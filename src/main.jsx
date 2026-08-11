import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// ======================================================================
// KHỐI CODE: TỰ ĐỘNG ÉP XÓA CACHE DỰA VÀO VITE BUILD TIMESTAMP
// ======================================================================
const APP_VERSION = __APP_VERSION__; // Biến này do Vite tự động bơm vào lúc build
const localVersion = localStorage.getItem("KIUGIANG_APP_VERSION");

if (localVersion !== APP_VERSION) {
  console.log("[Updater] Phát hiện bản Build mới! Đang dọn dẹp hệ thống...");

  // 1. Xóa toàn bộ bộ nhớ Cache Storage của PWA
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach(name => caches.delete(name));
    });
  }

  // 2. Tiêu diệt toàn bộ Service Worker cũ đang kẹt
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach(registration => registration.unregister());
    });
  }

  // 3. Cập nhật mốc Version mới và Ép tải lại trang (Hard Reload)
  localStorage.setItem("KIUGIANG_APP_VERSION", APP_VERSION);
  window.location.reload(true);
}
// ======================================================================

// ======================================================================
// THÊM ĐOẠN NÀY: ÉP TỰ ĐỘNG RELOAD KHI SERVICE WORKER MỚI CHIẾM QUYỀN
// ======================================================================
let refreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log("Service Worker mới đã sẵn sàng. Đang tải lại trang...");
      window.location.reload(); // Ép F5 để hiển thị giao diện mới nhất
    }
  });
}

// ==========================================
// CẤU HÌNH DEBUG GIAO DIỆN LOADING PWA
// Bật true: Hiển thị giao diện khóa màn hình để ngắm/chỉnh sửa UI lúc dev.
// Bật false: Chạy thực tế (Tự động ẩn và chỉ hiện khi có bản cập nhật thật).
// ==========================================
const DEBUG_MODE = false;

// Hàm tạo và hiển thị màn hình Loading chuyên nghiệp
const showPwaLoader = (isDemo = false) => {
  if (document.getElementById('pwa-update-overlay')) return;

  const loader = document.createElement('div');
  loader.id = 'pwa-update-overlay';

  // Tinh chỉnh nội dung hiển thị dựa vào chế độ Dev hay Thực tế
  const debugBadge = isDemo
    ? `<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 6px; vertical-align: middle;">DEBUG</span>`
    : '';
  const subText = isDemo
    ? 'Đang xem trước giao diện cập nhật'
    : 'Đang áp dụng phiên bản mới nhất...';

  loader.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Inter', system-ui, sans-serif; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); animation: pwaFadeIn 0.3s ease-out;">
      
      <div style="position: relative; width: 72px; height: 72px; margin-bottom: 28px;">
        <svg style="position: absolute; top: 0; left: 0; width: 50px; height: 50px; fill: #10b981; animation: pwaSpinClockwise 3.5s linear infinite;" viewBox="0 0 24 24">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.47,5.34 14.86,5.08L14.47,2.42C14.43,2.19 14.24,2 14,2H10C9.75,2 9.56,2.19 9.53,2.42L9.14,5.08C8.53,5.34 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.95C7.96,18.34 8.53,18.66 9.14,18.92L9.14,21.58C9.56,21.81 9.75,22 10,22H14C14.24,22 14.43,21.81 14.47,21.58L14.86,18.92C15.47,18.66 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
        </svg>
        <svg style="position: absolute; bottom: 0; right: 0; width: 34px; height: 34px; fill: #34d399; animation: pwaSpinCounterClockwise 2.5s linear infinite;" viewBox="0 0 24 24">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.47,5.34 14.86,5.08L14.47,2.42C14.43,2.19 14.24,2 14,2H10C9.75,2 9.56,2.19 9.53,2.42L9.14,5.08C8.53,5.34 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.95C7.96,18.34 8.53,18.66 9.14,18.92L9.14,21.58C9.56,21.81 9.75,22 10,22H14C14.24,22 14.43,21.81 14.47,21.58L14.86,18.92C15.47,18.66 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
        </svg>
      </div>

      <div style="width: 100%; max-width: 320px; display: flex; flex-direction: column; align-items: center; padding: 0 20px; box-sizing: border-box;">
        
        <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; text-align: center;">
          Cập nhật hệ thống
        </h3>
        
        <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.15); border-radius: 6px; overflow: hidden; margin-bottom: 12px; position: relative;">
          <div style="height: 100%; width: 0%; background: #10b981; border-radius: 6px; animation: pwaLoadBar ${isDemo ? '3s' : '1.7s'} ease-out forwards;"></div>
        </div>

        <p style="margin: 0; color: #cbd5e1; font-size: 14.5px; font-weight: 500; text-align: center; line-height: 1.5; width: 100%;">
          ${debugBadge}${subText}
        </p>
      </div>
      
      <style>
        @keyframes pwaFadeIn { 
          from { opacity: 0; } 
          to { opacity: 1; } 
        }
        @keyframes pwaSpinClockwise { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        @keyframes pwaSpinCounterClockwise { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(-360deg); } 
        }
        @keyframes pwaLoadBar { 
          0% { width: 0%; } 
          40% { width: 60%; } 
          80% { width: 90%; } 
          100% { width: 100%; } 
        }
      </style>
    </div>
  `;

  document.body.appendChild(loader);
};


// ======================================================================
// 1. KHỞI TẠO SERVICE WORKER VÀ BẮT SỰ KIỆN CÓ BẢN CẬP NHẬT MỚI
// ======================================================================
const updateSW = registerSW({
  // Khi trình duyệt phát hiện có code mới trên Server
  onNeedRefresh() {
    if (DEBUG_MODE) return;

    // Hiển thị UI Loading khóa màn hình
    showPwaLoader(false);

    // Chờ 1.7 giây cho hiệu ứng loading chạy xong, 
    // rồi gửi tín hiệu cho Service Worker cài đặt bản mới & Tự động reload trang
    setTimeout(() => {
      updateSW(true);
    }, 1700);
  },

  // Kiểm tra cập nhật mỗi khi user chuyển app từ background lên foreground
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update();
      }
    });
  }
});

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

