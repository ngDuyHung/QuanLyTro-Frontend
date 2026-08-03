import { Outlet, Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import { Link } from "react-router-dom";
export default function AuthLayout() {
  const user = useAuthStore((state) => state.user);

  if (user) {
    const roleRedirectMap = {
      admin: "/admin/dashboard",
      landlord: "/landlord/dashboard",
      tenant: "/tenant/dashboard",
    };
    return <Navigate to={roleRedirectMap[user.role] || "/"} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col text-sm font-sans text-body bg-white">
      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* === CỘT TRÁI (BANNER) - ĐÃ SỬA GIỐNG HÌNH 1 === */}
        <div className="hidden md:flex flex-col w-[55%] relative overflow-hidden bg-white pl-12 pr-10 pt-12 xl:pl-20 xl:pr-16">

          {/* Cục mờ trang trí nền giống thiết kế */}
          <div className="absolute right-[10%] top-[30%] w-40 h-40 rounded-full bg-primary/10 blur-[60px] pointer-events-none"></div>

          {/* Logo & Tên */}
          <Link to="/" className="flex items-center gap-3 relative z-10">
            <img src="/icon-logo.png" alt="Logo" className="w-16 h-16" />
            <div>
              <h1 className="text-xl font-bold text-primary leading-tight">
                Nhà Trọ Kiêu Giang
              </h1>
              <p className="text-xs text-gray-500 font-medium">Quản lý nhà trọ thông minh</p>
            </div>
          </Link>

          {/* Tiêu đề chính */}
          <div className="mt-14 xl:mt-20 relative z-10">
            <h2 className="text-[32px] xl:text-[36px] font-bold text-slate-800 leading-tight">Quản lý nhà trọ</h2>
            <h2 className="text-[32px] xl:text-[36px] font-bold text-primary mt-1 leading-tight">
              Dễ dàng – Hiệu quả – An toàn
            </h2>
            <p className="mt-4 text-base text-gray-600 max-w-md leading-relaxed font-medium">
              Giải pháp toàn diện giúp chủ trọ quản lý phòng, hợp đồng, khách thuê, doanh thu và chi phí một cách hiệu quả.
            </p>
          </div>

          {/* Danh sách tính năng với 4 icon khác nhau */}
          <div className="mt-10 xl:mt-12 flex flex-col gap-6 relative z-10">
            {/* Mục 1 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] text-primary flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800">Quản lý phòng & hợp đồng</h3>
                <p className="mt-0.5 text-sm text-gray-500">Theo dõi tình trạng phòng, hợp đồng thuê chi tiết.</p>
              </div>
            </div>

            {/* Mục 2 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] text-primary flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800">Quản lý khách thuê</h3>
                <p className="mt-0.5 text-sm text-gray-500">Lưu trữ thông tin, lịch sử thuê và công nợ rõ ràng.</p>
              </div>
            </div>

            {/* Mục 3 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] text-primary flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800">Hóa đơn & thanh toán</h3>
                <p className="mt-0.5 text-sm text-gray-500">Tạo hóa đơn, theo dõi thanh toán nhanh chóng.</p>
              </div>
            </div>

            {/* Mục 4 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] text-primary flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800">Báo cáo & thống kê</h3>
                <p className="mt-0.5 text-sm text-gray-500">Báo cáo doanh thu, công nợ trực quan, dễ hiểu.</p>
              </div>
            </div>
          </div>

          {/* Hình ảnh bên dưới - Đã gỡ blend mode làm tối ảnh, làm mờ fade nhẹ phần trên đỉnh */}
          <div className="absolute bottom-0 left-0 right-0 z-0 h-[80%] pointer-events-none">
            <img
              src="https://sf-static.upanhlaylink.com/img/image_202605151e666f883500e9b5a247724c0c0db117.jpg" alt="aacf3c01f11870462909.jpg"
              alt="Building"
              className="w-full h-full object-cover object-bottom"
              style={{
                maskImage: "linear-gradient(to bottom, transparent 0%, black 35%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 35%)",
              }}
            />
          </div>
        </div>

        {/* === CỘT PHẢI (CHỨA FORM) === */}
        <div className="w-full md:w-[45%] bg-white md:bg-[#fcfdff] relative flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 min-h-screen md:min-h-0">

          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-10 z-20">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition">
              <img src="https://flagcdn.com/w20/vn.png" alt="VN" className="w-5 h-auto rounded-sm" />
              <span className="text-slate-700 font-medium text-sm">Tiếng Việt</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>

          <div className="md:hidden flex flex-col items-center mb-6 mt-12">
            <img src="/icon-logo.png" alt="Logo" className="w-16 h-16 mb-3" />
            <h1 className="text-xl font-bold text-primary leading-tight">Nhà Trọ Kiêu Giang</h1>
          </div>

          <div className="w-full max-w-[440px] z-10 pb-8 md:pb-0">
            <Outlet />
          </div>
        </div>
      </div>

      {/* === FOOTER === */}
      <footer className="w-full bg-white border-t border-gray-100 py-5 px-6 md:px-16 flex flex-col md:flex-row items-center justify-between z-20 gap-3 md:gap-0">
        <p className="text-[13px] sm:text-sm text-gray-500 font-medium">
          © 2024 Nhà Trọ Kiêu Giang. Tất cả quyền được bảo lưu.
        </p>
        <div className="flex gap-6 sm:gap-8">
          <a href="#" className="text-primary hover:text-primary-hover font-medium text-[13px] sm:text-sm">Điều khoản sử dụng</a>
          <a href="#" className="text-primary hover:text-primary-hover font-medium text-[13px] sm:text-sm">Chính sách bảo mật</a>
        </div>
      </footer>
    </div>
  );
}