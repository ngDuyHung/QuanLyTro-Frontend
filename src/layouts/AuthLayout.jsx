import { Outlet, Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";

export default function AuthLayout() {
  const user = useAuthStore((state) => state.user);

  // LOGIC CHẶN: Nếu đã có user thì tự động đá về Dashboard theo Role
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
        {/* === CỘT TRÁI (Banner & Giới thiệu) === */}
        <div className="hidden md:flex flex-col w-[55%] relative overflow-hidden pl-16 pr-10 pt-10">
          <div className="absolute right-0 top-1/3 w-64 h-64 bg-dots opacity-50"></div>
          <div className="absolute right-1/4 top-[20%] w-24 h-24 rounded-full bg-primary-light opacity-50 blur-xl"></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary leading-tight">
                Nhà Trọ An Bình
              </h1>
              <p className="text-xs text-body">Quản lý nhà trọ thông minh</p>
            </div>
          </div>

          <div className="mt-16 relative z-10">
            <h2 className="text-3xl font-bold text-heading">Quản lý nhà trọ</h2>
            <h2 className="text-3xl font-bold text-primary mt-2">
              Dễ dàng – Hiệu quả – An toàn
            </h2>
            <p className="mt-4 text-base max-w-lg leading-relaxed">
              Giải pháp toàn diện giúp chủ trọ quản lý phòng, hợp đồng, khách
              thuê, doanh thu và chi phí một cách hiệu quả.
            </p>
          </div>

          {/* Icon list */}
          <div className="mt-12 flex flex-col gap-8 relative z-10">
            {[
              {
                title: "Quản lý phòng & hợp đồng",
                desc: "Theo dõi tình trạng phòng, hợp đồng thuê chi tiết.",
              },
              {
                title: "Quản lý khách thuê",
                desc: "Lưu trữ thông tin, lịch sử thuê và công nợ rõ ràng.",
              },
              {
                title: "Hóa đơn & thanh toán",
                desc: "Tạo hóa đơn, theo dõi thanh toán nhanh chóng.",
              },
              {
                title: "Báo cáo & thống kê",
                desc: "Báo cáo doanh thu, công nợ trực quan, dễ hiểu.",
              },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-heading">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-0 h-[35%] pointer-events-none flex items-end">
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Building"
              className="w-full h-full object-cover object-bottom opacity-80 mix-blend-multiply"
              style={{
                maskImage: "linear-gradient(to bottom, transparent, black 20%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, black 20%)",
              }}
            />
          </div>
        </div>

        {/* === CỘT PHẢI (Form sẽ chèn vào đây) === */}
        <div className="w-full md:w-[45%] bg-[#fafbfc] relative flex flex-col items-center justify-center p-6 sm:p-12">
          {/* Nút đổi ngôn ngữ */}
          <div className="absolute top-6 right-6 lg:top-10 lg:right-10">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition">
              <img
                src="https://flagcdn.com/w20/vn.png"
                alt="VN"
                className="w-5 h-auto rounded-sm"
              />
              <span className="text-heading font-medium text-sm">
                Tiếng Việt
              </span>
            </button>
          </div>

          {/* DỮ LIỆU CỦA TRANG LOGIN SẼ RƠI VÀO ĐÂY */}
          <Outlet />
        </div>
      </div>

      {/* === FOOTER === */}
      <footer className="w-full bg-white border-t border-gray-100 py-5 px-6 md:px-16 flex flex-col md:flex-row items-center justify-between z-20">
        <p className="text-sm">
          © 2024 Nhà Trọ An Bình. Tất cả quyền được bảo lưu.
        </p>
        <div className="flex gap-6 mt-3 md:mt-0">
          <a href="#" className="hover:text-primary font-medium">
            Điều khoản sử dụng
          </a>
          <a href="#" className="hover:text-primary font-medium">
            Chính sách bảo mật
          </a>
        </div>
      </footer>
    </div>
  );
}
