import React from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function LandlordDashboard() {
  const { user } = useAuthStore();
  const today = format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi });

  // Mảng dữ liệu thẻ thống kê nhanh để code không bị dài dòng
  const statCards = [
    {
      title: "Khu nhà",
      value: "3",
      icon: "fa-house",
      colorClass: "bg-green-50 text-[#0e8b4d]",
    },
    {
      title: "Phòng trọ",
      value: "46",
      icon: "fa-door-open",
      colorClass: "bg-blue-50 text-blue-500",
    },
    {
      title: "Đang thuê",
      value: "36",
      icon: "fa-circle-check",
      colorClass: "bg-emerald-50 text-emerald-500",
      sub: "78.3%",
      subColor: "text-emerald-500",
    },
    {
      title: "Phòng trống",
      value: "8",
      icon: "fa-door-closed",
      colorClass: "bg-orange-50 text-orange-500",
      sub: "17.4%",
      subColor: "text-orange-500",
    },
    {
      title: "Bảo trì",
      value: "2",
      icon: "fa-wrench",
      colorClass: "bg-purple-50 text-purple-500",
      sub: "4.3%",
      subColor: "text-purple-500",
    },
    {
      title: "Hợp đồng",
      value: "36111",
      icon: "fa-file-contract",
      colorClass: "bg-yellow-50 text-yellow-500",
    },
  ];

  return (
    <main className="flex-1 flex flex-col h-screen min-w-0 bg-slate-50">
      {/* CONTENT BODY */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 lg:p-6 flex flex-col">
        {/* Lời chào */}
        <div className="bg-[#fffdf2] border border-[#fef08a] rounded-xl px-5 py-3.5 mb-6 flex items-center shadow-sm">
          <span className="text-yellow-500 mr-3 text-lg">✨</span>
          <span className="text-[14px] text-yellow-800 font-medium">
            Chào {user?.name}, chúc bạn một ngày tốt lành! Hôm nay là {today}
          </span>
        </div>

        {/* Thẻ Thống kê nhanh - Responsive Tối ưu PC & Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
          {statCards.map((card, idx) => (
            <Link
              key={idx}
              to="#"
              className="group bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden"
            >
              {/* Nửa trên: Nội dung chính (Hiển thị ở cả Mobile & PC) */}
              <div className="p-3 sm:p-4 flex items-center gap-3">
                {/* Icon (Thu nhỏ nhẹ trên mobile) */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 ${card.colorClass}`}
                >
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>

                {/* Nội dung text (Sử dụng min-w-0 và truncate để chống tràn số) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p
                    className="text-[12px] sm:text-[13px] text-slate-500 font-medium mb-0.5 truncate"
                    title={card.title}
                  >
                    {card.title}
                  </p>

                  {/* Đưa phần % (card.sub) lên ngang hàng với con số */}
                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <h3
                      className="text-lg sm:text-xl font-bold text-slate-800 truncate"
                      title={card.value}
                    >
                      {card.value}
                    </h3>

                    {/* Đã thêm "hidden sm:inline-block" vào các thẻ span bên dưới */}
                    {card.sub ? (
                      <span
                        className={`hidden sm:inline-block text-[11px] font-bold shrink-0 ${card.subColor}`}
                      >
                        {card.sub}
                      </span>
                    ) : (
                      <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium shrink-0">
                        Tổng
                      </span>
                    )}
                  </div>
                </div>

                {/* Icon điều hướng: Chỉ hiển thị trên Mobile để báo hiệu có thể click */}
                <div className="sm:hidden text-slate-300 group-hover:text-[#0e8b4d] transition-colors shrink-0 ml-1">
                  <i className="fa-solid fa-angle-right text-[12px]"></i>
                </div>
              </div>

              {/* Nửa dưới: Dải "Xem chi tiết" (Chỉ hiển thị trên PC / Tablet từ breakpoint sm trở lên) */}
              <div className="hidden sm:block px-4 pb-3">
                <div className="pt-2.5 border-t border-slate-50 flex items-center text-[#0e8b4d] text-[12px] font-semibold group-hover:text-green-700 transition-colors">
                  Xem chi tiết
                  {/* Mũi tên sẽ dịch chuyển nhẹ sang phải khi hover thẻ */}
                  <i className="fa-solid fa-angle-right ml-1.5 text-[10px] transition-transform group-hover:translate-x-1"></i>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Thống kê thu tiền */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-[15px] font-bold text-slate-800 mb-6">
              Tình hình thu tiền tháng 05/2024
            </h3>

            <div className="flex flex-col md:flex-row flex-1 items-center gap-8 mb-4">
              <div
                className="relative w-[150px] h-[150px] rounded-full flex items-center justify-center shrink-0"
                style={{
                  background:
                    "conic-gradient(#ef4444 0% 18%, #e2e8f0 18% 22%, #10b981 22% 68%, #f97316 68% 100%)",
                }}
              >
                <div className="w-[110px] h-[110px] bg-white rounded-full flex flex-col items-center justify-center text-center shadow-inner">
                  <span className="text-[11px] text-slate-500 font-medium mb-0.5">
                    Tổng thu
                  </span>
                  <span className="text-[15px] font-bold text-slate-800 leading-none">
                    48.600.000đ
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    / 62.000.000đ
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col justify-center space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>{" "}
                      Đã thu đủ
                    </div>
                    <p className="text-[13px] font-bold text-slate-800 ml-4.5">
                      28.600.000đ
                    </p>
                  </div>
                  <span className="text-[12px] text-slate-500 font-medium">
                    46%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>{" "}
                      Đã thu một phần
                    </div>
                    <p className="text-[13px] font-bold text-slate-800 ml-4.5">
                      20.000.000đ
                    </p>
                  </div>
                  <span className="text-[12px] text-slate-500 font-medium">
                    32%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>{" "}
                      Chưa thu
                    </div>
                    <p className="text-[13px] font-bold text-slate-800 ml-4.5">
                      11.400.000đ
                    </p>
                  </div>
                  <span className="text-[12px] text-slate-500 font-medium">
                    18%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>{" "}
                      Miễn phí
                    </div>
                    <p className="text-[13px] font-bold text-slate-800 ml-4.5">
                      2.000.000đ
                    </p>
                  </div>
                  <span className="text-[12px] text-slate-500 font-medium">
                    4%
                  </span>
                </div>
              </div>
            </div>

            <a
              href="#"
              className="text-[#0e8b4d] text-[12px] font-semibold flex items-center hover:text-green-700 mt-auto pt-4 border-t border-slate-50"
            >
              Xem chi tiết thu chi{" "}
              <i className="fa-solid fa-angle-right ml-1.5 text-[10px]"></i>
            </a>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[15px] font-bold text-slate-800">
                Hóa đơn cần chú ý
              </h3>
              <a
                href="#"
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Xem tất cả (5)
              </a>
            </div>

            <div className="flex flex-col gap-3 flex-1 mb-4">
              <div className="flex items-center justify-between border border-slate-100 p-3 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center text-lg shrink-0">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[13px] font-semibold text-slate-800 group-hover:text-red-600 transition-colors">
                      Hóa đơn quá hạn
                    </p>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      5 hóa đơn
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-slate-800">
                    11.400.000đ
                  </span>
                  <i className="fa-solid fa-angle-right text-slate-400 text-[12px]"></i>
                </div>
              </div>

              <div className="flex items-center justify-between border border-slate-100 p-3 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center text-lg shrink-0">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[13px] font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">
                      Sắp đến hạn (3 ngày)
                    </p>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      7 hóa đơn
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-slate-800">
                    8.200.000đ
                  </span>
                  <i className="fa-solid fa-angle-right text-slate-400 text-[12px]"></i>
                </div>
              </div>

              <div className="flex items-center justify-between border border-slate-100 p-3 rounded-xl hover:border-green-200 hover:bg-green-50/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-lg shrink-0">
                    <i className="fa-solid fa-file-invoice-dollar"></i>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[13px] font-semibold text-slate-800 group-hover:text-green-600 transition-colors">
                      Chưa thanh toán
                    </p>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      12 hóa đơn
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-slate-800">
                    20.000.000đ
                  </span>
                  <i className="fa-solid fa-angle-right text-slate-400 text-[12px]"></i>
                </div>
              </div>
            </div>

            <a
              href="#"
              className="text-[#0e8b4d] text-[12px] font-semibold flex items-center hover:text-green-700 mt-auto pt-4 border-t border-slate-50"
            >
              Xem danh sách hóa đơn{" "}
              <i className="fa-solid fa-angle-right ml-1.5 text-[10px]"></i>
            </a>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[15px] font-bold text-slate-800">
                Thông báo quan trọng
              </h3>
              <a
                href="#"
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Xem tất cả
              </a>
            </div>

            <div className="flex flex-col gap-5 flex-1">
              <div className="flex gap-4 items-start relative pb-5 border-b border-slate-100/60">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-500 flex items-center justify-center text-xl shrink-0">
                  <i className="fa-solid fa-folder-open"></i>
                </div>
                <div className="flex-1 flex flex-col justify-center pt-0.5">
                  <p className="text-[13px] font-bold text-slate-800 mb-0.5">
                    Khách thuê phòng 101 - Khu A
                  </p>
                  <p className="text-[12px] text-slate-500">
                    hợp đồng sắp hết hạn (01/06/2024)
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium shrink-0 pt-1">
                  Hôm nay
                </span>
              </div>

              <div className="flex gap-4 items-start relative pb-5 border-b border-slate-100/60">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-400 flex items-center justify-center text-xl shrink-0">
                  <i className="fa-solid fa-droplet"></i>
                </div>
                <div className="flex-1 flex flex-col justify-center pt-0.5">
                  <p className="text-[13px] font-bold text-slate-800 mb-0.5">
                    Chưa chốt chỉ số nước Khu A
                  </p>
                  <p className="text-[12px] text-slate-500">kỳ tháng 05/2024</p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium shrink-0 pt-1">
                  Hôm nay
                </span>
              </div>

              <div className="flex gap-4 items-start relative">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center text-xl shrink-0">
                  <i className="fa-solid fa-file-circle-exclamation"></i>
                </div>
                <div className="flex-1 flex flex-col justify-center pt-0.5">
                  <p className="text-[13px] font-bold text-slate-800 mb-0.5">
                    5 hóa đơn đã quá hạn thanh toán
                  </p>
                  <p className="text-[12px] text-slate-500">
                    Tổng số tiền: 11.400.000đ
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium shrink-0 pt-1">
                  Hôm qua
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thao tác nhanh */}
        <div className="mb-6">
          <h3 className="text-[15px] font-bold text-slate-800 mb-4">
            Thao tác nhanh
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <button className="bg-white border border-slate-100 rounded-xl py-5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-[#0e8b4d] hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-house-medical text-[16px] text-[#0e8b4d] group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Thêm khu nhà
              </span>
            </button>
            <button className="bg-white border border-slate-100 rounded-xl py-3.5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-door-open text-[16px] text-blue-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Thêm phòng
              </span>
            </button>
            <button className="bg-white border border-slate-100 rounded-xl py-3.5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-user-plus text-[16px] text-orange-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Thêm khách thuê
              </span>
            </button>
            <button className="bg-white border border-slate-100 rounded-xl py-3.5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-file-signature text-[16px] text-purple-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Tạo hợp đồng
              </span>
            </button>
            <button className="bg-white border border-slate-100 rounded-xl py-3.5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-yellow-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-bolt text-[16px] text-yellow-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Chốt điện nước
              </span>
            </button>
            <button className="bg-white border border-slate-100 rounded-xl py-3.5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-red-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-file-invoice-dollar text-[16px] text-red-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Tạo hóa đơn
              </span>
            </button>
          </div>
        </div>

        {/* Hợp đồng sắp hết hạn */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[15px] font-bold text-slate-800">
                Hợp đồng sắp hết hạn
              </h3>
              <a
                href="#"
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Xem tất cả
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr>
                    <th className="text-[12px] text-slate-500 font-medium py-3 border-b border-slate-100 pl-2">
                      Phòng
                    </th>
                    <th className="text-[12px] text-slate-500 font-medium py-3 border-b border-slate-100">
                      Khách thuê
                    </th>
                    <th className="text-[12px] text-slate-500 font-medium py-3 border-b border-slate-100 text-center">
                      Ngày hết hạn
                    </th>
                    <th className="text-[12px] text-slate-500 font-medium py-3 border-b border-slate-100 text-right pr-2">
                      Còn lại
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 border-b border-slate-50 text-slate-800 font-medium pl-2">
                      101 - Khu A
                    </td>
                    <td className="py-3 border-b border-slate-50 text-slate-600">
                      Nguyễn Văn B
                    </td>
                    <td className="py-3 border-b border-slate-50 text-slate-600 text-center">
                      01/06/2024
                    </td>
                    <td className="py-3 border-b border-slate-50 font-bold text-red-500 text-right pr-2">
                      10 ngày
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 border-b border-slate-50 text-slate-800 font-medium pl-2">
                      203 - Khu B
                    </td>
                    <td className="py-3 border-b border-slate-50 text-slate-600">
                      Trần Thị C
                    </td>
                    <td className="py-3 border-b border-slate-50 text-slate-600 text-center">
                      05/06/2024
                    </td>
                    <td className="py-3 border-b border-slate-50 font-bold text-orange-500 text-right pr-2">
                      14 ngày
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 border-b border-slate-50 text-slate-800 font-medium pl-2">
                      102 - Khu A
                    </td>
                    <td className="py-3 border-b border-slate-50 text-slate-600">
                      Lê Văn D
                    </td>
                    <td className="py-3 border-b border-slate-50 text-slate-600 text-center">
                      10/06/2024
                    </td>
                    <td className="py-3 border-b border-slate-50 font-bold text-orange-500 text-right pr-2">
                      19 ngày
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 border-b border-slate-50 text-slate-800 font-medium pl-2">
                      301 - Khu C
                    </td>
                    <td className="py-3 border-b border-slate-50 text-slate-600">
                      Phạm Thị E
                    </td>
                    <td className="py-3 border-b border-slate-50 text-slate-600 text-center">
                      15/06/2024
                    </td>
                    <td className="py-3 border-b border-slate-50 font-bold text-blue-500 text-right pr-2">
                      24 ngày
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[15px] font-bold text-slate-800">
                Doanh thu 6 tháng gần nhất
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Đơn vị: đồng
              </span>
            </div>

            <div className="relative flex-1 min-h-[200px] mt-2">
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400">
                <div className="flex items-center w-full border-b border-slate-100 pb-1">
                  <span>60M</span>
                </div>
                <div className="flex items-center w-full border-b border-slate-100 pb-1">
                  <span>40M</span>
                </div>
                <div className="flex items-center w-full border-b border-slate-100 pb-1">
                  <span>20M</span>
                </div>
                <div className="flex items-center w-full pb-1">
                  <span>0</span>
                </div>
              </div>

              <div className="absolute inset-0 pl-10 pr-2 pb-5 flex items-end justify-between z-10 pt-4">
                <div className="w-[10%] bg-[#4ade80] rounded-t-sm h-[70.8%] relative group flex justify-center">
                  <span className="absolute -top-5 text-[10px] font-bold text-slate-800">
                    42.500.000
                  </span>
                </div>
                <div className="w-[10%] bg-[#4ade80] rounded-t-sm h-[75.3%] relative group flex justify-center">
                  <span className="absolute -top-5 text-[10px] font-bold text-slate-800">
                    45.200.000
                  </span>
                </div>
                <div className="w-[10%] bg-[#4ade80] rounded-t-sm h-[79.6%] relative group flex justify-center">
                  <span className="absolute -top-5 text-[10px] font-bold text-slate-800">
                    47.800.000
                  </span>
                </div>
                <div className="w-[10%] bg-[#4ade80] rounded-t-sm h-[82.6%] relative group flex justify-center">
                  <span className="absolute -top-5 text-[10px] font-bold text-slate-800">
                    49.600.000
                  </span>
                </div>
                <div className="w-[10%] bg-[#4ade80] rounded-t-sm h-[85.5%] relative group flex justify-center">
                  <span className="absolute -top-5 text-[10px] font-bold text-slate-800">
                    51.300.000
                  </span>
                </div>
                <div className="w-[10%] bg-[#4ade80] rounded-t-sm h-[81.0%] relative group flex justify-center">
                  <span className="absolute -top-5 text-[10px] font-bold text-slate-800">
                    48.600.000
                  </span>
                </div>
              </div>
            </div>

            <div className="pl-10 pr-2 flex justify-between items-center text-[11px] text-slate-500 font-medium mt-1">
              <span className="w-[10%] text-center">Tháng 12/2023</span>
              <span className="w-[10%] text-center">Tháng 01/2024</span>
              <span className="w-[10%] text-center">Tháng 02/2024</span>
              <span className="w-[10%] text-center">Tháng 03/2024</span>
              <span className="w-[10%] text-center">Tháng 04/2024</span>
              <span className="w-[10%] text-center">Tháng 05/2024</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
