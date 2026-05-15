import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function LandlordDashboard() {
  const { user } = useAuthStore();
  const today = format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi });

  // Mảng dữ liệu thẻ thống kê nhanh để code không bị dài dòng
  const statCards = [

    { title: "Khu nhà", value: "3", icon: "fa-house", colorClass: "bg-green-50 text-[#0e8b4d]" },
    { title: "Phòng trọ", value: "46", icon: "fa-door-open", colorClass: "bg-blue-50 text-blue-500" },
    { title: "Đang thuê", value: "36", icon: "fa-circle-check", colorClass: "bg-emerald-50 text-emerald-500", sub: "78.3%", subColor: "text-emerald-500" },
    { title: "Phòng trống", value: "8", icon: "fa-door-closed", colorClass: "bg-orange-50 text-orange-500", sub: "17.4%", subColor: "text-orange-500" },
    { title: "Bảo trì", value: "2", icon: "fa-wrench", colorClass: "bg-purple-50 text-purple-500", sub: "4.3%", subColor: "text-purple-500" },
    { title: "Hợp đồng", value: "36", icon: "fa-file-contract", colorClass: "bg-yellow-50 text-yellow-500" },
  ];

  return (
    <main className="flex-1 flex flex-col h-screen min-w-0 bg-slate-50">


      {/* CONTENT BODY */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 lg:p-8 flex flex-col">
        {/* Lời chào */}
      <div className="bg-[#fffdf2] border border-[#fef08a] rounded-xl px-5 py-3.5 mb-6 flex items-center shadow-sm">
        <span className="text-yellow-500 mr-3 text-lg">✨</span>
        <span className="text-[14px] text-yellow-800 font-medium">
          Chào {user?.name}, chúc bạn một ngày tốt lành! Hôm nay là {today}
        </span>
      </div>

      {/* 6 Thẻ Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${card.colorClass}`}>
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>
                <div className="flex flex-col justify-center pt-1">
                  <p className="text-[13px] text-slate-700 font-medium mb-1 whitespace-nowrap">{card.title}</p>
                  <h3 className="text-2xl font-bold text-slate-800 leading-none">{card.value}</h3>
                </div>
              </div>
              {card.sub ? (
                 <p className={`text-[12px] font-bold self-center mt-1 ${card.subColor}`}>{card.sub}</p>
              ) : (
                 <p className="text-[12px] text-slate-400 font-medium self-center mt-1">Tổng số</p>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex">
              <Link to="#" className="text-[#0e8b4d] text-[12px] font-semibold flex items-center hover:text-green-700">
                Xem chi tiết <i className="fa-solid fa-angle-right ml-1.5 text-[10px]"></i>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Thao tác nhanh */}
      <div className="mb-6">
        <h3 className="text-[15px] font-bold text-slate-800 mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <button className="bg-white border border-slate-100 rounded-xl py-5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-[#0e8b4d] hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <i className="fa-solid fa-house-medical text-[16px] text-[#0e8b4d] group-hover:scale-110 transition-transform"></i>
            <span className="text-[13px] font-semibold text-slate-700">Thêm khu nhà</span>
          </button>
          <button className="bg-white border border-slate-100 rounded-xl py-3.5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <i className="fa-solid fa-door-open text-[16px] text-blue-500 group-hover:scale-110 transition-transform"></i>
            <span className="text-[13px] font-semibold text-slate-700">Thêm phòng</span>
          </button>
          <button className="bg-white border border-slate-100 rounded-xl py-3.5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <i className="fa-solid fa-user-plus text-[16px] text-orange-500 group-hover:scale-110 transition-transform"></i>
            <span className="text-[13px] font-semibold text-slate-700">Thêm khách thuê</span>
          </button>
          <button className="bg-white border border-slate-100 rounded-xl py-3.5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <i className="fa-solid fa-file-signature text-[16px] text-purple-500 group-hover:scale-110 transition-transform"></i>
            <span className="text-[13px] font-semibold text-slate-700">Tạo hợp đồng</span>
          </button>
          <button className="bg-white border border-slate-100 rounded-xl py-3.5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-yellow-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <i className="fa-solid fa-bolt text-[16px] text-yellow-500 group-hover:scale-110 transition-transform"></i>
            <span className="text-[13px] font-semibold text-slate-700">Chốt điện nước</span>
          </button>
          <button className="bg-white border border-slate-100 rounded-xl py-3.5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-red-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <i className="fa-solid fa-file-invoice-dollar text-[16px] text-red-500 group-hover:scale-110 transition-transform"></i>
            <span className="text-[13px] font-semibold text-slate-700">Tạo hóa đơn</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-center items-center text-[12px] text-slate-400">
        <p>© 2024 Nhà Trọ An Bình. Tất cả quyền được bảo lưu.</p>
      </div>
      </div>
    </main>
  );
}