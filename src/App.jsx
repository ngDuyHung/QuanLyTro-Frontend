import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer, Bounce, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./assets/css/toast-custom.css";
import AppRouter from "./router";

// Component Toast Gợi ý cài đặt PWA nâng cấp
const InstallPwaToast = ({ deferredPrompt, closeToast }) => {
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Người dùng đã đồng ý cài đặt PWA');
    }
    
    closeToast();
  };

  return (
    <div className="relative pl-1">
      {/* Nút X tắt (Màu đỏ nổi bật, bo tròn) */}
      <button
        onClick={closeToast}
        className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white border border-red-100 transition-colors shadow-sm z-10"
        title="Đóng thông báo"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <div className="flex items-start gap-3.5 pt-1">
        {/* Logo Ứng dụng */}
        <div className="shrink-0">
          <img 
            src="/icon-logo.png" 
            alt="Kiêu Giang Logo" 
            className="w-14 h-14 object-cover rounded-xl shadow-sm border border-gray-100"
          />
        </div>
        
        {/* Nội dung chữ (Chữ to, rõ nét hơn) */}
        <div className="flex-1 pr-4">
          <h4 className="font-bold text-base text-slate-800 leading-tight">
            Cài đặt ứng dụng
          </h4>
          <p className="text-[14px] text-slate-600 mt-1.5 leading-snug">
            Thêm App Kiêu Giang vào màn hình chính để truy cập như một ứng dụng thông thường.
          </p>
        </div>
      </div>

      {/* Cụm nút bấm (To, dễ ấn bằng ngón tay) */}
      <div className="flex gap-2.5 mt-4">
        <button
          onClick={handleInstall}
          className="flex-1 bg-[#0d8a51] text-white py-2.5 rounded-lg text-[14px] font-bold hover:bg-[#0a6d40] shadow-sm transition-colors flex justify-center items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Cài đặt ngay
        </button>
        <button
          onClick={closeToast}
          className="px-5 bg-slate-100 text-slate-600 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-slate-200 hover:text-slate-700 transition-colors"
        >
          Để sau
        </button>
      </div>
    </div>
  );
};

function App() {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      const hasShownPrompt = sessionStorage.getItem("pwa_prompt_shown");
      
      if (!hasShownPrompt) {
        toast(
          ({ closeToast }) => (
            <InstallPwaToast deferredPrompt={e} closeToast={closeToast} />
          ),
          {
            position: "bottom-center",
            // Vô hiệu hóa tự động đóng để người lớn tuổi có đủ thời gian đọc hiểu thông báo
            autoClose: false, 
            closeOnClick: false,
            draggable: false,
            toastId: "pwa-install-toast",
            // Thêm viền xanh nhẹ (border-[#0d8a51]/30) và bo góc mềm mại
            className: "p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[#0d8a51]/30 bg-white m-4 sm:mx-auto !w-auto max-w-[400px]"
          }
        );
        sessionStorage.setItem("pwa_prompt_shown", "true");
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <BrowserRouter>
      <AppRouter />
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover={true}
        theme="light"
        transition={Bounce}
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
      />
    </BrowserRouter>
  );
}

export default App;