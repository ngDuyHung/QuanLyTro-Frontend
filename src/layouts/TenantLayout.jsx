import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import { toast } from "react-toastify";
import notificationService from "@/services/notificationService";
import api from "@/services/api";

// 1. IMPORT MODAL TÀI KHOẢN VÀO ĐÂY
import UserProfileModal from "@/components/user/UserProfileModal";

export default function TenantLayout() { // Đổi tên component cho chuẩn
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // STATE ĐIỀU KHIỂN SIDEBAR & THÔNG BÁO
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // 2. STATE ĐIỀU KHIỂN DROPDOWN & MODAL TÀI KHOẢN
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const fetchLatestNotifs = async () => {
      try {
        const response = await notificationService.getAll({ per_page: 5 });
        setNotifications(response.data.data || []);
      } catch (error) {
        console.error("Không tải được thông báo trên header", error);
      }
    };
    fetchLatestNotifs();
  }, []);

  // Xử lý click ra ngoài để đóng dropdown thông báo & dropdown user
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Khởi tạo một Ref để trỏ vào khung cuộn nội dung
  const scrollContainerRef = useRef(null);

  // Lắng nghe sự thay đổi của URL, hễ đổi trang là cuộn lên đầu
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    // Xóa Push Token trước khi logout
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
        }
      } catch (error) {
        console.error("Lỗi xóa push token khi logout", error);
      }
    }

    clearAuth();
    toast.info("Đã đăng xuất khỏi hệ thống");
    navigate("/login");
  };

  // --- ĐỒNG BỘ NGẦM PUSH TOKEN ---
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  useEffect(() => {
    const syncPushSubscription = async () => {
      if ('Notification' in window && 'serviceWorker' in navigator && Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          let subscription = await registration.pushManager.getSubscription();

          if (!subscription) {
            const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
          }

          if (subscription) {
            const subData = subscription.toJSON();
            // Gửi lên Backend để cập nhật lại token cho user đang login
            await api.post('/push/subscribe', {
              endpoint: subData.endpoint,
              keys: subData.keys
            });
          }
        } catch (error) {
          console.error("Lỗi đồng bộ push token ngầm:", error);
        }
      }
    };

    syncPushSubscription();
  }, []);

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${isActive
      ? "bg-brand text-white shadow-sm shadow-green-600/20"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  // Hàm đóng sidebar
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="fixed inset-0 bg-[#f8fafc] text-slate-800 overflow-hidden flex font-sans">
      {/* LỚP PHỦ OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed lg:relative w-[260px] bg-white border-r border-slate-200 flex flex-col h-full z-50 shrink-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* LOGO & TITLE */}
        <div className="h-[80px] flex items-center px-6 shrink-0 border-b border-slate-100">
          <img src="/icon-logo.png" alt="Logo" className="w-13 h-13" />
          <div className="ml-3 truncate">
            <h1 className="text-[15px] font-bold text-brand leading-tight">
              Nhà Trọ Kiêu Giang
            </h1>
            <p className="text-[12px] text-slate-500">Cổng thông tin khách thuê</p>
          </div>
        </div>

        {/* NAVIGATION LIST */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-4 py-4 space-y-1">
          <NavLink to="/tenant/dashboard" className={navLinkClasses} onClick={closeSidebar}>
            <i className="fa-solid fa-house w-5 text-center"></i>
            <span>Trang chủ</span>
          </NavLink>

          <NavLink to="/tenant/invoices" className={navLinkClasses} onClick={closeSidebar}>
            <div className="flex items-center gap-3 flex-1">
              <i className="fa-solid fa-file-invoice-dollar w-5 text-center"></i>
              <span>Hóa đơn</span>
            </div>
          </NavLink>

          <NavLink to="/tenant/utilities" className={navLinkClasses} onClick={closeSidebar}>
            <i className="fa-solid fa-droplet w-5 text-center"></i>
            <span>Điện nước</span>
          </NavLink>

          <NavLink to="/tenant/contracts" className={navLinkClasses} onClick={closeSidebar}>
            <div className="flex items-center gap-3 flex-1">
              <i className="fa-solid fa-file-signature w-5 text-center"></i>
              <span>Hợp đồng</span>
            </div>
          </NavLink>

          <NavLink to="/tenant/incidents" className={navLinkClasses} onClick={closeSidebar}>
            <i className="fa-solid fa-screwdriver-wrench w-5 text-center"></i>
            <span>Yêu cầu sửa chữa</span>
          </NavLink>

          <NavLink to="/tenant/notifications" className={navLinkClasses} onClick={closeSidebar}>
            <i className="fa-regular fa-bell w-5 text-center"></i>
            <span>Thông báo</span>
          </NavLink>

          <NavLink to="/tenant/members" className={navLinkClasses} onClick={closeSidebar}>
            <i className="fa-solid fa-users w-5 text-center"></i>
            <span>Thành viên</span>
          </NavLink>

          <NavLink to="/tenant/account" className={navLinkClasses} onClick={closeSidebar}>
            <i className="fa-solid fa-user w-5 text-center"></i>
            <span>Hồ sơ lưu trú</span>
          </NavLink>
        </nav>

        {/* BOTTOM SECTION */}
        <div className="p-4 shrink-0 flex flex-col gap-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center">
                <i className="fa-solid fa-phone-volume"></i>
              </div>
              <div>
                <p className="text-[12px] text-slate-500">Liên hệ quản lý</p>
                <p className="text-[13px] font-semibold text-slate-800">
                  0987 667 849
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[14px] font-medium transition-colors"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col h-dvh min-w-0 bg-slate-50 relative">
        {/* HEADER */}
        <header className="h-[75px] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>

            <div className="flex flex-col">
              <h2 className="text-[17px] lg:text-[20px] font-bold text-slate-800 leading-tight">
                Xin chào, {user?.name || "Khách thuê"} 👋
              </h2>
              <div className="hidden sm:flex items-center text-[12px] text-slate-500 mt-0.5">
                <span className="text-slate-700">Theo dõi thông tin và chi phí phòng trọ dễ dàng.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* THÔNG BÁO */}
            <div className="relative mx-1" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-1.5 rounded-full transition-colors ${isNotifOpen ? "bg-slate-100 text-brand" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
              >
                <i className="fa-regular fa-bell text-[22px]"></i>
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </button>

              {/* DROPDOWN MENU THÔNG BÁO */}
              {isNotifOpen && (
                <div className="fixed left-4 right-4 top-[70px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[380px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden z-[100] flex flex-col sm:origin-top-right animate-[fadeIn_0.2s_ease-out]">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-sm shrink-0">
                    <h3 className="font-bold text-slate-800 text-[15px]">Thông báo mới</h3>
                  </div>

                  <div className="max-h-[60vh] sm:max-h-[360px] overflow-y-auto no-scrollbar flex flex-col bg-white">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                          <i className="fa-regular fa-bell-slash text-xl"></i>
                        </div>
                        <span className="text-[13px] font-medium mt-1">Không có thông báo mới nào</span>
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const getIcon = (type) => {
                          if (type === 'billing') return { c: 'text-red-500 bg-red-50', i: 'fa-file-invoice-dollar' };
                          if (type === 'warning') return { c: 'text-amber-500 bg-amber-50', i: 'fa-triangle-exclamation' };
                          return { c: 'text-blue-500 bg-blue-50', i: 'fa-circle-info' };
                        };
                        const style = getIcon(item.type);

                        return (
                          <div key={item.id} className="p-4 border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-3.5 group">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-transparent group-hover:border-current/10 ${style.c} transition-all`}>
                              <i className={`fa-solid ${style.i} text-[14px]`}></i>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <p className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2 mb-1 group-hover:text-brand transition-colors">
                                {item.title}
                              </p>
                              <div className="flex items-center justify-between mt-auto">
                                <span className="text-[11px] font-medium text-slate-500 truncate pr-2">
                                  {item.target_type_label}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                                  {new Date(item.created_at).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-3 border-t border-slate-100 text-center bg-slate-50 shrink-0">
                    <NavLink
                      to="/tenant/notifications"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-[13px] font-bold text-brand hover:text-green-700 w-full block py-1.5 transition-colors"
                    >
                      Xem tất cả thông báo <i className="fa-solid fa-arrow-right text-[11px] ml-1"></i>
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* 3. KHU VỰC USER AVATAR & DROPDOWN (Đã cập nhật) */}
            <div className="relative ml-1 pl-1 border-l border-slate-200" ref={userMenuRef}>
              <div 
                className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-50 transition-colors"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "T"}
                </div>
                <div className="hidden sm:flex flex-col pr-1">
                  <span className="text-[14px] font-bold text-slate-800 leading-tight">
                    {user?.name || "Người thuê"}
                  </span>
                  <span className="text-[12px] text-slate-500">{user?.phone || 'Tài khoản'}</span>
                </div>
                <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 hidden sm:block"></i>
              </div>

              {/* USER MENU DROPDOWN */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[100] animate-[fadeIn_0.2s_ease-out]">
                  <div className="px-4 py-3 border-b border-slate-50 sm:hidden">
                    <p className="font-bold text-slate-800 text-[14px]">{user?.name}</p>
                    <p className="text-[12px] text-slate-500">{user?.phone}</p>
                  </div>
                  
                  <div className="p-2 flex flex-col gap-1">
                    <button 
                      onClick={() => { setIsUserMenuOpen(false); setIsProfileModalOpen(true); }}
                      className="w-full text-left px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-brand rounded-lg transition-colors flex items-center gap-2"
                    >
                      <i className="fa-solid fa-lock w-4"></i> Đổi mật khẩu
                    </button>
                    <NavLink 
                      to="/tenant/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-brand rounded-lg transition-colors flex items-center gap-2"
                    >
                      <i className="fa-regular fa-address-card w-4"></i> Hồ sơ định danh
                    </NavLink>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket w-4"></i> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* VÙNG NỘI DUNG CUỘN */}
        <div ref={scrollContainerRef}
          className="flex-1 overflow-y-auto flex flex-col pb-[65px] lg:pb-0">
          <div className="flex-1 flex flex-col">
            <Outlet />
          </div>
          <footer className="hidden lg:block py-4 text-center border-t border-slate-200/60 mx-8 shrink-0 relative z-10 bg-slate-50">
            <p className="text-[12px] text-slate-400">
              <i className="fa-solid fa-shield-halved text-gray-400"></i> Thông tin
              của bạn được bảo mật tuyệt đối | © 2026 Nhà Trọ Kiêu Giang.
            </p>
          </footer>
        </div>

        {/* ================= BOTTOM NAVIGATION (MOBILE) ĐÃ SỬA LẠI ĐÚNG ROUTE TENANT ================= */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center px-1 z-40 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)] h-[calc(68px+env(safe-area-inset-bottom))]">

          {/* 1. Trang chủ */}
          <NavLink to="/tenant/dashboard" className="flex-1 flex justify-center h-full">
            {({ isActive }) => (
              <div className={`w-full flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive ? "text-brand" : "text-slate-400 hover:text-slate-600"}`}>
                <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${isActive ? "bg-green-50 scale-110" : "bg-transparent scale-100"}`}>
                  <i className="fa-solid fa-house text-[20px]"></i>
                </div>
                <span className={`text-[10px] transition-all duration-300 ${isActive ? "font-bold" : "font-medium"}`}>Trang chủ</span>
              </div>
            )}
          </NavLink>

          {/* 2. Hóa đơn */}
          <NavLink to="/tenant/invoices" className="flex-1 flex justify-center h-full">
            {({ isActive }) => (
              <div className={`w-full flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive ? "text-brand" : "text-slate-400 hover:text-slate-600"}`}>
                <div className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${isActive ? "bg-green-50 scale-110" : "bg-transparent scale-100"}`}>
                  <i className="fa-solid fa-file-invoice-dollar text-[20px]"></i>
                </div>
                <span className={`text-[10px] transition-all duration-300 ${isActive ? "font-bold" : "font-medium"}`}>Hóa đơn</span>
              </div>
            )}
          </NavLink>

          {/* 3. Sự cố */}
          <NavLink to="/tenant/incidents" className="flex-1 flex justify-center h-full">
            {({ isActive }) => (
              <div className={`w-full flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive ? "text-brand" : "text-slate-400 hover:text-slate-600"}`}>
                <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${isActive ? "bg-green-50 scale-110" : "bg-transparent scale-100"}`}>
                  <i className="fa-solid fa-screwdriver-wrench text-[20px]"></i>
                </div>
                <span className={`text-[10px] transition-all duration-300 ${isActive ? "font-bold" : "font-medium"}`}>Sự cố</span>
              </div>
            )}
          </NavLink>

          {/* 4. Điện nước */}
          <NavLink to="/tenant/utilities" className="flex-1 flex justify-center h-full">
            {({ isActive }) => (
              <div className={`w-full flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive ? "text-brand" : "text-slate-400 hover:text-slate-600"}`}>
                <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${isActive ? "bg-green-50 scale-110" : "bg-transparent scale-100"}`}>
                  <i className="fa-solid fa-droplet text-[20px]"></i>
                </div>
                <span className={`text-[10px] transition-all duration-300 ${isActive ? "font-bold" : "font-medium"}`}>Điện nước</span>
              </div>
            )}
          </NavLink>

          {/* 5. Nút Thêm (Mở Sidebar) */}
          <button onClick={() => setIsSidebarOpen(true)} className="flex-1 flex justify-center h-full">
            <div className="w-full flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-8 rounded-full bg-transparent scale-100">
                <i className="fa-solid fa-bars-staggered text-[20px]"></i>
              </div>
              <span className="text-[10px] font-medium">Menu</span>
            </div>
          </button>
        </nav>

        {/* 4. RENDER MODAL CẬP NHẬT TÀI KHOẢN */}
        <UserProfileModal 
          open={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />

      </main>
    </div>
  );
}