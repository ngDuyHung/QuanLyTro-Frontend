import { precacheAndRoute } from "workbox-precaching";

// 1. BIẾN ÉP THAY ĐỔI BYTE (Hãy đổi số này thành v2, v3... mỗi khi bạn muốn ép xóa cache triệt để)
const FORCE_RESET_VERSION = "v2.0_NUKE_CACHE";
console.log("[Service Worker] Đang chạy bản:", FORCE_RESET_VERSION);

// Nạp cache
precacheAndRoute(self.__WB_MANIFEST);

// 2. ÉP BỎ QUA CHỜ ĐỢI
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// 3. VŨ KHÍ HẠT NHÂN: XÓA SẠCH CACHE CŨ VÀ ÉP TẢI LẠI TRANG
self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Bước A: Quét và xóa sạch mọi bộ nhớ Cache của PWA cũ
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log("[Service Worker] Đang tiêu diệt cache:", cacheName);
          return caches.delete(cacheName);
        })
      );
    })
    // Bước B: Chiếm quyền điều khiển
    .then(() => self.clients.claim())
    // Bước C: Tìm các tab đang mở và ép F5 tải lại từ Server
    .then(() => self.clients.matchAll({ type: "window" }))
    .then((windowClients) => {
      windowClients.forEach((client) => {
        if (client.url && "navigate" in client) {
          console.log("[Service Worker] Ép trình duyệt Reload!");
          client.navigate(client.url);
        }
      });
    })
  );
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
          console.log("[Service Worker] ✅ Đã hiển thị popup thông báo ra màn hình thành công!"),
        )
        .catch((err) =>
          console.error("[Service Worker] ❌ Lỗi khi vẽ popup:", err),
        ),
    );
  } catch (error) {
    console.error("[Service Worker] ❌ Lỗi nghiêm trọng khi phân tích dữ liệu JSON:", error);
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