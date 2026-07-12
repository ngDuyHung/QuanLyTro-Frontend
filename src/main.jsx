import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// ==========================================
// CẤU HÌNH DEBUG GIAO DIỆN LOADING PWA
// Bật true: Hiển thị giao diện khóa màn hình để ngắm/chỉnh sửa UI lúc dev.
// Bật false: Chạy thực tế (Tự động ẩn và chỉ hiện khi có bản cập nhật thật).
// ==========================================
const DEBUG_MODE = false; 

// Hàm tạo và hiển thị màn hình Loading chuyên nghiệp
const showPwaLoader = (isDemo = false) => {
  // Tránh tạo trùng lặp nếu đã tồn tại
  if (document.getElementById('pwa-update-overlay')) return;

  const loader = document.createElement('div');
  loader.id = 'pwa-update-overlay';
  loader.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); animation: pwaFadeIn 0.3s ease-out;">
      
      <div style="position: relative; width: 80px; height: 80px; margin-bottom: 24px;">
        <svg style="position: absolute; top: 0; left: 0; width: 55px; height: 55px; fill: #10b981; animation: pwaSpinClockwise 3.5s linear infinite;" viewBox="0 0 24 24">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.47,5.34 14.86,5.08L14.47,2.42C14.43,2.19 14.24,2 14,2H10C9.75,2 9.56,2.19 9.53,2.42L9.14,5.08C8.53,5.34 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.95C7.96,18.34 8.53,18.66 9.14,18.92L9.14,21.58C9.56,21.81 9.75,22 10,22H14C14.24,22 14.43,21.81 14.47,21.58L14.86,18.92C15.47,18.66 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
        </svg>
        <svg style="position: absolute; bottom: 4px; right: 4px; width: 36px; height: 36px; fill: #34d399; animation: pwaSpinCounterClockwise 2.5s linear infinite;" viewBox="0 0 24 24">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.47,5.34 14.86,5.08L14.47,2.42C14.43,2.19 14.24,2 14,2H10C9.75,2 9.56,2.19 9.53,2.42L9.14,5.08C8.53,5.34 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.95C7.96,18.34 8.53,18.66 9.14,18.92L9.14,21.58C9.56,21.81 9.75,22 10,22H14C14.24,22 14.43,21.81 14.47,21.58L14.86,18.92C15.47,18.66 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
        </svg>
      </div>
      
      <h3 style="margin: 0 0 6px 0; color: #ffffff; font-size: 17px; font-weight: 700; letter-spacing: -0.01em;">Hệ thống đang cập nhật</h3>
      <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 500; text-align: center; padding: 0 24px; line-height: 1.5;">
        ${isDemo ? '<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 4px;">DEBUG</span>Bạn đang xem thử giao diện cập nhật...' : 'Vui lòng chờ trong giây lát để tối ưu hóa dữ liệu mới nhất...'}
      </p>
      
      <style>
        @keyframes pwaFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pwaSpinClockwise { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pwaSpinCounterClockwise { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
      </style>
    </div>
  `;
  
  document.body.appendChild(loader);
};

// 1. Khởi tạo Service Worker và thiết lập logic tự kiểm tra bản mới
const updateSW = registerSW({
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;

    // Lắp bộ lắng nghe chuyển đổi trạng thái Foreground ứng dụng
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update();
      }
    });
  }
});

// 2. Lắng nghe sự kiện giành quyền điều khiển hệ thống khi cài đặt hoàn tất
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Nếu đang bật debug giao diện, chặn không cho reload thật để lập trình viên xem UI
    if (DEBUG_MODE) return;

    showPwaLoader(false);

    // Trì hoãn 1.7 giây nhằm tạo nhịp nghỉ UX trọn vẹn trước khi Reload trang
    setTimeout(() => {
      window.location.reload();
    }, 1700);
  });
}

// KHỞI CHẠY KHỐI RENDER ỨNG DỤNG REACT
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// KÍCH HOẠT CHẾ ĐỘ HIỂN THỊ THỬ UI KHI ĐANG DEV
if (DEBUG_MODE && typeof window !== 'undefined') {
  // Chờ DOM dựng xong hoàn toàn rồi tiêm UI thử nghiệm vào xem ngay lập tức
  setTimeout(() => showPwaLoader(true), 200);
}