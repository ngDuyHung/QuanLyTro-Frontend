import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', function (event) {
    console.log('[Service Worker] 🔴 ĐÃ NHẬN ĐƯỢC TÍN HIỆU PUSH TỪ SERVER!');

    if (!(self.Notification && self.Notification.permission === 'granted')) {
        console.error('[Service Worker] ❌ Trình duyệt chưa cấp quyền (Permission không phải granted).');
        return;
    }

    if (!event.data) {
        console.warn('[Service Worker] ⚠️ Tín hiệu Push đến nhưng KHÔNG CÓ DỮ LIỆU (Payload rỗng)!');
        return;
    }

    try {
        // In ra dữ liệu thô để xem Laravel gửi xuống cái gì
        const rawData = event.data.text();
        console.log('[Service Worker] 📦 Dữ liệu thô nhận được:', rawData);

        const data = JSON.parse(rawData);
        
        const title = data.title || 'Thông báo từ Kiêu Giang';
        const options = {
            body: data.body || 'Bạn có thông báo mới.',
            icon: '/icon-logo.png', // Đảm bảo file này tồn tại trong thư mục public
            badge: '/icon-logo.png',
            data: { url: data.url || '/' }
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
                .then(() => console.log('[Service Worker] ✅ Đã hiển thị popup thông báo thành công!'))
                .catch(err => console.error('[Service Worker] ❌ Lỗi khi vẽ popup ra màn hình:', err))
        );

    } catch (error) {
        console.error('[Service Worker] ❌ Lỗi nghiêm trọng khi phân tích Payload:', error);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close(); 
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            let matchingClient = null;
            for (let i = 0; i < windowClients.length; i++) {
                if (windowClients[i].url === urlToOpen) {
                    matchingClient = windowClients[i];
                    break;
                }
            }
            if (matchingClient) {
                return matchingClient.focus();
            } else {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});