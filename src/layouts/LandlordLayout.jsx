import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "@/stores/authStore"; // Kiểm tra lại đường dẫn này cho đúng với dự án của bạn
import { toast } from "react-toastify";

export default function LandlordLayout() {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. STATE ĐIỀU KHIỂN SIDEBAR TRÊN MOBILE
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    toast.info("Đã đăng xuất khỏi hệ thống");
    navigate("/login");
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${
      isActive
        ? "bg-brand text-white shadow-sm shadow-green-600/20"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  // Hàm check active thủ công cho menu "Khu nhà & Phòng"
  const isPropertiesGroupActive =
    location.pathname.includes("/landlord/properties") ||
    location.pathname.includes("/landlord/rooms");

  // Hàm đóng sidebar (dùng khi click vào overlay hoặc click vào 1 link trên mobile)
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="bg-[#f8fafc] text-slate-800 h-screen overflow-hidden flex font-sans">
      {/* 2. LỚP PHỦ OVERLAY (Chỉ hiện trên Mobile khi isSidebarOpen == true) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* ================= SIDEBAR ================= */}
      {/* 3. ĐIỀU CHỈNH CLASS TRANSLATE DỰA VÀO STATE */}
      <aside
        className={`fixed lg:relative w-[260px] bg-white border-r border-slate-200 flex flex-col h-full z-30 shrink-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* LOGO & TITLE */}
        <div className="h-[80px] flex items-center px-6 shrink-0 border-b border-slate-100">
          <img src="/icon-logo.png" alt="Logo" className="w-13 h-13" />
          <div className="ml-3 truncate">
            <h1 className="text-[15px] font-bold text-brand leading-tight">
              Nhà Trọ Kiêu Giang
            </h1>
            <p className="text-[12px] text-slate-500">Quản lý nhà trọ</p>
          </div>
        </div>

        {/* NAVIGATION LIST (Thêm sự kiện onClick={closeSidebar} để bấm menu xong là tự thu gọn trên đt) */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-4 py-4 space-y-1">
          <NavLink
            to="/landlord/dashboard"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <i className="fa-solid fa-chart-pie w-5 text-center"></i>
            <span>Trang chủ</span>
          </NavLink>

          {/* SỬ DỤNG CLASS ĐƯỢC CUSTOM RIÊNG CHO MENU NÀY */}
          <NavLink
            to="/landlord/properties"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${
              isPropertiesGroupActive
                ? "bg-brand text-white shadow-sm shadow-green-600/20"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            onClick={closeSidebar}
          >
            <i className="fa-solid fa-building w-5 text-center"></i>
            <span>Khu nhà & Phòng</span>
          </NavLink>

          <NavLink
            to="/landlord/leases"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <i className="fa-solid fa-file-signature w-5 text-center"></i>
            <span>Hợp đồng thuê</span>
          </NavLink>

          <NavLink
            to="/landlord/tenants"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <i className="fa-regular fa-user w-5 text-center"></i>
            <span>Khách thuê</span>
          </NavLink>

          <NavLink
            to="/landlord/utilities"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <div className="flex items-center gap-3 flex-1">
              <i className="fa-solid fa-droplet w-5 text-center"></i>
              <span>Điện nước</span>
            </div>
            <span className="bg-[#ef4444] text-white text-[11px] font-bold h-5 w-5 flex items-center justify-center rounded-full shrink-0">
              2
            </span>
          </NavLink>

          <NavLink
            to="/landlord/invoices"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <i className="fa-solid fa-file-invoice w-5 text-center"></i>
            <span>Hóa đơn</span>
          </NavLink>

          <NavLink
            to="/landlord/financials"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <div className="flex items-center gap-3 flex-1">
              <i className="fa-solid fa-money-bill-transfer w-5 text-center"></i>
              <span>Thu chi</span>
            </div>
            <span className="bg-[#ef4444] text-white text-[11px] font-bold h-5 w-5 flex items-center justify-center rounded-full shrink-0">
              5
            </span>
          </NavLink>

          <NavLink
            to="/landlord/services"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <i className="fa-solid fa-tags w-5 text-center"></i>
            <span>Dịch vụ & Giá</span>
          </NavLink>

          <NavLink
            to="/landlord/banks"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <i className="fa-solid fa-building-columns w-5 text-center"></i>
            <span>Tài khoản ngân hàng</span>
          </NavLink>

          <NavLink
            to="/landlord/reports"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <i className="fa-solid fa-chart-line w-5 text-center"></i>
            <span>Báo cáo</span>
          </NavLink>

          <NavLink
            to="/landlord/notifications"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <i className="fa-regular fa-bell w-5 text-center"></i>
            <span>Thông báo</span>
          </NavLink>

          <NavLink
            to="/landlord/settings"
            className={navLinkClasses}
            onClick={closeSidebar}
          >
            <i className="fa-solid fa-gear w-5 text-center"></i>
            <span>Cài đặt</span>
          </NavLink>
        </nav>

        {/* BOTTOM SECTION */}
        <div className="p-4 shrink-0 flex flex-col gap-4 border-t border-slate-100">
          {/* HỖ TRỢ */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center">
                <i className="fa-solid fa-phone-volume"></i>
              </div>
              <div>
                <p className="text-[12px] text-slate-500">Hỗ trợ</p>
                <p className="text-[13px] font-semibold text-slate-800">
                  0987 667 849
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">8:00 - 20:00</span>
          </div>

          {/* ĐĂNG XUẤT */}
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
      <main className="flex-1 flex flex-col h-screen min-w-0 bg-slate-50">
        {/* HEADER */}
        <header className="h-[80px] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* 4. NÚT MỞ SIDEBAR TRÊN MOBILE */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>

            <div className="flex flex-col">
              <h2 className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-tight">
                Hệ thống Quản lý
              </h2>
              <div className="hidden sm:flex items-center text-[12px] text-slate-500 mt-0.5">
                <span className="text-slate-700">Tiện lợi - nhanh chóng - đa nền tảng</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden md:flex bg-white text-brand border border-green-200 hover:bg-green-50 px-4 py-2 rounded-full text-sm font-semibold items-center gap-2 transition-colors">
              <i className="fa-regular fa-circle-question"></i>
              <span className="hidden lg:inline">Hướng dẫn sử dụng</span>
            </button>

            <button className="relative text-slate-500 hover:text-slate-800 transition-colors mx-1">
              <i className="fa-regular fa-bell text-[22px]"></i>
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                3
              </span>
            </button>

            <div className="flex items-center gap-2 cursor-pointer pl-1 border-l border-slate-200 ml-1">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-lg shrink-0 overflow-hidden">
                <i className="fa-solid fa-user"></i>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[14px] font-bold text-slate-800 leading-tight">
                  {user?.name || "Chủ Trọ"}
                </span>
                <span className="text-[12px] text-slate-500">Chủ trọ</span>
              </div>
            </div>
          </div>
        </header>

        {/* VÙNG NỘI DUNG CUỘN */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />

          {/* FOOTER ĐƠN GIẢN NHẤT */}
          <footer className="py-2 text-center border-t border-slate-200/60 mx-8">
            <p className="text-[12px] text-slate-400">
              Phiên bản v1.0 — Được làm bởi{" "}
              <span className="font-medium text-slate-500">Duy Hùng</span>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
