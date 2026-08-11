import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

const VERSION = "v3.2"; // Đổi thành v3.2, v3.3... cho các lần deploy sau
console.log("[Service Worker] Đang chạy bản:", VERSION);

// BỔ SUNG DÒNG NÀY: Ép SW kiểm soát ngay lập tức các client đang mở
clientsClaim();

// 1. NẠP CACHE
precacheAndRoute(self.__WB_MANIFEST);

// 2. LẮNG NGHE LỆNH TỪ MAIN.JSX ĐỂ TIẾN HÀNH CẬP NHẬT
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[Service Worker] Nhận lệnh cài đặt bản mới từ UI Loading!");
    self.skipWaiting();
  }
});
// ======================================================================
// 4. XỬ LÝ SỰ KIỆN NHẬN THÔNG BÁO PUSH TỪ LARAVEL
// ======================================================================
self.addEventListener("push", function (event) {
  // Nếu trình duyệt chưa cấp quyền thì hủy bỏ
  if (!(self.Notification && self.Notification.permission === "granted")) {
    return;
  }

  if (!event.data) {
    return;
  }

  try {
    const rawData = event.data.text();
    const data = JSON.parse(rawData);

    const title = data.title || "Thông báo từ Kiêu Giang";
    const options = {
      body: data.body || "Bạn có một thông báo mới.",
      icon: "/icon-logo.png", // Logo lớn hiện bên cạnh thông báo
      badge: "/icon-logo.png", // Logo nhỏ hiện trên thanh trạng thái (Mobile)
      data: {
        url: data.url || "/", // Lưu lại đường dẫn để xử lý khi Click
      },
    };

    // Vẽ popup thông báo ra góc màn hình
    event.waitUntil(
      self.registration
        .showNotification(title, options)
        .then(() =>
          console.log(
            "[Service Worker] ✅ Đã hiển thị popup thông báo ra màn hình thành công!",
          ),
        )
        .catch((err) =>
          console.error("[Service Worker] ❌ Lỗi khi vẽ popup:", err),
        ),
    );
  } catch (error) {
    console.error(
      "[Service Worker] ❌ Lỗi nghiêm trọng khi phân tích dữ liệu JSON:",
      error,
    );
  }
});

// ======================================================================
// 5. XỬ LÝ SỰ KIỆN KHI NGƯỜI DÙNG CLICK VÀO POPUP THÔNG BÁO
// ======================================================================
self.addEventListener("notificationclick", function (event) {
  event.notification.close(); // Đóng popup thông báo ngay lập tức

  // Lấy đường dẫn đã lưu lúc nhận thông báo
  const urlToOpen = new URL(event.notification.data.url, self.location.origin)
    .href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        let matchingClient = null;

        // Quét xem người dùng có đang mở sẵn tab nào của trang web không
        for (let i = 0; i < windowClients.length; i++) {
          if (windowClients[i].url === urlToOpen) {
            matchingClient = windowClients[i];
            break;
          }
        }

        // Nếu đang mở sẵn tab đó -> Focus (Chuyển sang tab đó)
        if (matchingClient) {
          return matchingClient.focus();
        }
        // Nếu web đang đóng hoặc không đúng tab -> Mở một tab mới hoàn toàn
        else {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
