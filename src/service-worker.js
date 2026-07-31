import { precacheAndRoute } from "workbox-precaching";
// 1. NẠP CACHE PWA
precacheAndRoute(self.__WB_MANIFEST);

// 2. ÉP CÀI ĐẶT BẢN MỚI NGAY LẬP TỨC (Bỏ qua chờ đợi)
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// 3. VŨ KHÍ TỐI THƯỢNG: CHIẾM QUYỀN VÀ ÉP TRÌNH DUYỆT RELOAD
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      // Tìm toàn bộ các tab/cửa sổ PWA đang mở
      return self.clients.matchAll({ type: "window" });
    }).then((windowClients) => {
      // Ép từng cửa sổ tải lại trang hiện tại ngay lập tức
      windowClients.forEach((client) => {
        if (client.url && "navigate" in client) {
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