import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import dashboardService from "@/services/dashboardService";

export default function LandlordDashboard() {
  const { user } = useAuthStore();
  const today = format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi });

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [animateChart, setAnimateChart] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  // Thêm state này để chạy hiệu ứng vòng tròn (từ 0 đến 1)
  const [circleProgress, setCircleProgress] = useState(0);

  const [activeMobileTab, setActiveMobileTab] = useState('manage'); // 'manage' hoặc 'overview'

  useEffect(() => {
    if (!isLoading) {
      // 1. Hiệu ứng mọc cột (giữ nguyên của bạn)
      const timer = setTimeout(() => setAnimateChart(true), 50);

      // 2. Hiệu ứng vẽ vòng tròn (Thêm mới)
      let start = null;
      const duration = 500; // Thời gian chạy hiệu ứng: 1 giây (1000ms)

      const animateCircle = (timestamp) => {
        if (!start) start = timestamp;
        // Tính toán tiến trình từ 0 đến 1
        const progress = Math.min((timestamp - start) / duration, 1);
        setCircleProgress(progress);

        // Nếu chưa đạt 1 (100%), tiếp tục gọi frame tiếp theo
        if (progress < 1) {
          window.requestAnimationFrame(animateCircle);
        }
      };

      window.requestAnimationFrame(animateCircle);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardService.getDashboardData();
        // Lấy đúng object data từ API trả về
        console.log("Dữ liệu dashboard:", res.data);
        setDashboardData(res.data?.data || res.data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Lấy dữ liệu overview an toàn
  const overview = dashboardData?.overview || {};
  const totalRooms = overview.total_rooms || 0;

  // Hàm tính phần trăm an toàn (tránh lỗi chia cho 0)
  const calcPercent = (value) => {
    return totalRooms > 0 ? ((value / totalRooms) * 100).toFixed(1) : 0;
  };

  // Khai báo ĐỦ 6 THẺ CARD
  const statCards = [
    {
      title: "Khu nhà",
      value: overview.total_properties || 0,
      icon: "fa-house",
      colorClass: "bg-green-50 text-[#0e8b4d]",
      linkTo: "/landlord/properties", // Link đến DS Khu nhà
      linkState: null,
    },
    {
      title: "Phòng trọ",
      value: totalRooms,
      icon: "fa-door-open",
      colorClass: "bg-blue-50 text-blue-500",
      linkTo: "/landlord/rooms", // Link đến tất cả phòng (không có filter)
      linkState: null,
    },
    {
      title: "Đang thuê",
      value: overview.occupied_rooms || 0,
      icon: "fa-circle-check",
      colorClass: "bg-emerald-50 text-emerald-500",
      sub: `${overview.occupancy_rate || 0}%`,
      subColor: "text-emerald-500",
      linkTo: "/landlord/rooms",
      linkState: { filterStatus: 'occupied' }, // Chuyển sang màn Room + Lọc phòng Đang thuê
    },
    {
      title: "Phòng trống",
      value: overview.available_rooms || 0,
      icon: "fa-door-closed",
      colorClass: "bg-orange-50 text-orange-500",
      sub: `${calcPercent(overview.available_rooms)}%`,
      subColor: "text-orange-500",
      linkTo: "/landlord/rooms",
      linkState: { filterStatus: 'available' }, // Chuyển sang màn Room + Lọc phòng Trống
    },
    {
      title: "Bảo trì",
      value: overview.maintenance_rooms || 0,
      icon: "fa-wrench",
      colorClass: "bg-purple-50 text-purple-500",
      sub: `${calcPercent(overview.maintenance_rooms)}%`,
      subColor: "text-purple-500",
      linkTo: "/landlord/rooms",
      linkState: { filterStatus: 'maintenance' }, // Chuyển sang màn Room + Lọc phòng Bảo trì
    },
    {
      title: "Hợp đồng",
      value: overview.total_leases || 0,
      icon: "fa-file-contract",
      colorClass: "bg-yellow-50 text-yellow-500",
      linkTo: "/landlord/leases",
      linkState: null,
    },
  ];

  const pendingTasks = dashboardData?.pending_tasks || {};
  const expiringLeases = dashboardData?.expiring_leases || [];

  // Lấy dữ liệu tình hình thu tiền từ API
  const collection = dashboardData?.collection_status || {
    month_label: "...",
    total_expected: 0,
    collected_total: 0,
    statuses: {
      paid: { amount: 0, percent: 0 },
      partially_paid: { amount: 0, percent: 0 },
      issued: { amount: 0, percent: 0 },
      cancelled: { amount: 0, percent: 0 }
    }
  };

  // --- LOGIC HIỆU ỨNG BIỂU ĐỒ VÒNG TRÒN ---

  // 1. Lấy phần trăm gốc
  const baseP1 = collection.statuses.paid.percent;
  const baseP2 = baseP1 + collection.statuses.partially_paid.percent;
  const baseP3 = baseP2 + collection.statuses.issued.percent;
  const baseP4 = 100; // Tổng vòng tròn

  // 2. Nhân với tiến trình (circleProgress chạy từ 0 -> 1)
  const p1 = baseP1 * circleProgress;
  const p2 = baseP2 * circleProgress;
  const p3 = baseP3 * circleProgress;
  const p4 = baseP4 * circleProgress;

  // 3. Render CSS Conic Gradient
  // Vùng cuối cùng (#f8fafc) chiếm từ p4 đến 100% để giả làm phần nền tĩnh chưa vẽ tới
  const conicGradient = collection.total_expected > 0
    ? `conic-gradient(#10b981 0% ${p1}%, #f97316 ${p1}% ${p2}%, #ef4444 ${p2}% ${p3}%, #cbd5e1 ${p3}% ${p4}%, #f8fafc ${p4}% 100%)`
    : `conic-gradient(#f8fafc 0% 100%)`;


  // --- LOGIC BIỂU ĐỒ DOANH THU 6 THÁNG ---
  const financialChart = dashboardData?.financial_chart || [];

  // 1. Tìm tháng có doanh thu cao nhất
  const maxIncome = Math.max(...financialChart.map(item => item?.income || 0), 0);

  // 2. Làm tròn trục Y (đỉnh biểu đồ) sao cho chia hết cho 3 (vì thiết kế có 3 khoảng: 1/3, 2/3, Max)
  let yAxisMaxM = Math.ceil(maxIncome / 1000000); // Đổi ra đơn vị Triệu (M)

  if (yAxisMaxM === 0) yAxisMaxM = 30; // Nếu chưa có doanh thu, mặc định trục Y là 30 Triệu

  // Tăng lên 1 chút để cột cao nhất không bị chạm đỉnh biểu đồ
  if (maxIncome > 0 && maxIncome >= (yAxisMaxM - 1) * 1000000) {
    yAxisMaxM += 3;
  }
  // Làm tròn cho đến khi chia hết cho 3
  while (yAxisMaxM % 3 !== 0) {
    yAxisMaxM++;
  }
  const yAxisMax = yAxisMaxM * 1000000; // Đổi ngược lại ra đơn vị VNĐ

  return (
    <div className="p-4 md:p-6 lg:p-6 bg-slate-50 w-full flex flex-col overflow-x-hidden pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-6">
      {/* Lời chào */}
      {showGreeting && (
        <div className="hidden sm:flex bg-[#fffdf2] border border-[#fef08a] rounded-xl px-5 py-3.5 mb-6 flex items-center justify-between shadow-sm transition-all">

          {/* Cụm icon và nội dung chữ */}
          <div className="flex items-center">
            <span className="text-yellow-500 mr-3 text-lg">✨</span>
            <span className="text-[14px] text-yellow-800 font-medium">
              Chào {user?.name}, chúc bạn một ngày tốt lành! Hôm nay là {today}
            </span>
          </div>

          {/* Nút tắt thông báo */}
          <button
            onClick={() => setShowGreeting(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-yellow-600 hover:bg-yellow-100 hover:text-yellow-800 transition-colors shrink-0 ml-4"
            title="Đóng thông báo"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      )}

      {/* 2. TAB SWITCHER DÀNH RIÊNG CHO MOBILE (Sẽ ẩn trên PC nhờ lg:hidden) */}
      <div className="lg:hidden relative flex bg-white border border-[#0e8b4d] p-1 rounded-xl mb-6 z-0">

        {/* Thanh trượt vật lý ảo (Sliding Segmented Indicator) */}
        <div
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#0e8b4d] rounded-lg shadow-sm transition-transform duration-300 ease-out -z-10"
          style={{
            transform: activeMobileTab === 'manage' ? 'translateX(0)' : 'translateX(100%)'
          }}
        ></div>

        {/* Nút: Quản lý */}
        <button
          onClick={() => setActiveMobileTab('manage')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg text-[14px] font-bold transition-colors duration-300 ${activeMobileTab === 'manage'
            ? 'text-white'
            : 'text-[#0e8b4d] hover:text-green-800'
            }`}
        >
          <i className="fa-solid fa-cube text-[16px]"></i> Quản lý
        </button>

        {/* Nút: Tổng quan */}
        <button
          onClick={() => setActiveMobileTab('overview')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg text-[14px] font-bold transition-colors duration-300 ${activeMobileTab === 'overview'
            ? 'text-white'
            : 'text-[#0e8b4d] hover:text-green-800'
            }`}
        >
          <i className="fa-solid fa-chart-line text-[16px]"></i> Tổng quan
        </button>
      </div>

      {/* ================================================= */}
      {/* VÙNG A: MÀN HÌNH QUẢN LÝ (CHỈ MOBILE)             */}
      {/* ================================================= */}
      <div className={`lg:hidden ${activeMobileTab === 'manage' ? 'flex flex-col animate-slide-in-left' : 'hidden'}`}>

        {/* 1. Thẻ "Số tiền khách đang nợ" */}
        {isLoading ? (
          // SKELETON TICKET CARD
          <div className="relative flex bg-white rounded-xl shadow-sm border border-slate-100 mb-6 overflow-hidden h-[104px]">
            <div className="absolute top-0 left-[100px] w-6 h-6 bg-slate-50 border border-slate-100 rounded-full -translate-x-1/2 -translate-y-1/2 z-10 box-border"></div>
            <div className="absolute bottom-0 left-[100px] w-6 h-6 bg-slate-50 border border-slate-100 rounded-full -translate-x-1/2 translate-y-1/2 z-10 box-border"></div>

            <div className="w-[100px] py-4 flex flex-col items-center justify-center shrink-0">
              <div className="w-[52px] h-[52px] bg-slate-200 rounded-full animate-pulse mb-2.5"></div>
            </div>

            <div className="w-px border-l-[2px] border-dashed border-slate-200 my-2"></div>

            <div className="flex-1 py-4 pl-5 pr-4 flex flex-col justify-center gap-2">
              <div className="w-32 h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-24 h-3 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-20 h-5 bg-slate-200 rounded animate-pulse mt-1"></div>
            </div>
          </div>
        ) : (
          // REAL TICKET CARD
          <Link
            to="/landlord/invoices"
            className="relative flex bg-white rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] border border-slate-100 mb-6 hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="absolute top-0 left-[100px] w-6 h-6 bg-slate-50 border border-slate-100 rounded-full -translate-x-1/2 -translate-y-1/2 z-10 box-border"></div>
            <div className="absolute bottom-0 left-[100px] w-6 h-6 bg-slate-50 border border-slate-100 rounded-full -translate-x-1/2 translate-y-1/2 z-10 box-border"></div>

            <div className="w-[100px] py-4 flex flex-col items-center justify-center shrink-0">
              <div className="w-[52px] h-[52px] bg-[#eefcf2] rounded-full flex items-center justify-center mb-2.5">
                <i className="fa-solid fa-file-invoice text-slate-700 text-2xl"></i>
              </div>
              <span className="bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded">
                Đang nợ
              </span>
            </div>

            <div className="w-px border-l-[2px] border-dashed border-slate-200 my-2"></div>

            <div className="flex-1 py-4 pl-5 pr-4 flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-[14px] text-slate-800 font-bold mb-0.5">Số tiền khách đang nợ</p>
                <p className="text-[12px] text-slate-500 mb-2">Tổng hợp từ hóa đơn phát hành</p>
                <p className="text-[20px] font-bold text-[#f03e3e] leading-none mb-2.5">
                  {Number(pendingTasks.unpaid_invoices_total || 0).toLocaleString("vi-VN")} đ
                </p>
                <p className="text-[11px] text-[#e85d04] font-medium flex items-center gap-1.5">
                  <i className="fa-solid fa-triangle-exclamation text-[12px]"></i>
                  {pendingTasks.unpaid_invoices_count || 0} hóa đơn cần thu tiền
                </p>
              </div>
              <i className="fa-solid fa-chevron-right text-slate-800 text-lg ml-2 stroke-2"></i>
            </div>
          </Link>
        )}

        {/* 2. Lưới "Thao tác thường dùng" */}
        <div className="mb-6">
          <div className="mb-4 flex flex-col border-l-4 border-green-500 pl-2">
            <h3 className="text-[15px] font-bold text-slate-800 leading-tight">Thao tác thường dùng</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Thực hiện tác vụ nhanh để quản lý nhà trọ</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {isLoading ? (
              // SKELETON 3 NÚT
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 h-[100px]">
                  <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
                  <div className="w-16 h-3 bg-slate-200 rounded animate-pulse mt-1"></div>
                </div>
              ))
            ) : (
              // REAL 3 NÚT
              <>
                <Link to="/landlord/rooms" state={{ filterStatus: 'available' }} className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center relative">
                    <i className="fa-solid fa-hand-holding-dollar text-[22px]"></i>
                    {overview.available_rooms > 0 && (
                      <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                        {overview.available_rooms}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">Cọc giữ chỗ</span>
                </Link>

                <Link to="/landlord/rooms" state={{ filterStatus: 'available' }} className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center relative">
                    <i className="fa-solid fa-file-signature text-[22px]"></i>
                    {pendingTasks.expiring_leases_count > 0 && (
                      <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                        {pendingTasks.expiring_leases_count}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">Lập hợp<br />đồng mới</span>
                </Link>

                <Link to="/landlord/rooms" state={{ filterStatus: 'occupied' }} className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center relative">
                    <i className="fa-solid fa-file-invoice-dollar text-[22px]"></i>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">Lập hóa đơn</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 3. Lưới "Menu quản lý nhà trọ" */}
        <div className="mb-6">
          <div className="mb-4 flex flex-col border-l-4 border-blue-500 pl-2">
            <h3 className="text-[15px] font-bold text-slate-800 leading-tight">Menu quản lý nhà trọ</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Quản lý đối tượng nghiệp vụ trong nhà trọ</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {isLoading ? (
              // SKELETON 6 NÚT
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 h-[100px]">
                  <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
                  <div className="w-16 h-3 bg-slate-200 rounded animate-pulse mt-1"></div>
                </div>
              ))
            ) : (
              // REAL 6 NÚT
              <>
                <Link to="/landlord/properties" className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-[#0e8b4d]/10 text-[#0e8b4d] flex items-center justify-center relative">
                    <i className="fa-solid fa-house-medical text-[22px]"></i>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">Khu nhà</span>
                </Link>

                <Link to="/landlord/rooms" className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center relative">
                    <i className="fa-solid fa-door-open text-[22px]"></i>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">Phòng trọ</span>
                </Link>

                <Link to="/landlord/tenants" className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center relative">
                    <i className="fa-solid fa-users text-[22px]"></i>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">Khách thuê</span>
                </Link>

                <Link to="/landlord/utilities" className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center relative">
                    <i className="fa-solid fa-bolt text-[22px]"></i>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">Điện nước</span>
                </Link>

                <Link to="/landlord/invoices" className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center relative">
                    <i className="fa-solid fa-file-invoice-dollar text-[22px]"></i>
                    {pendingTasks.unpaid_invoices_count > 0 && (
                      <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                        {pendingTasks.unpaid_invoices_count}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">Hóa đơn<br />cần thu</span>
                </Link>

                <Link to="/landlord/incidents" className="bg-white border border-slate-100 rounded-xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center relative">
                    <i className="fa-solid fa-wrench text-[22px]"></i>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">Sự cố &<br />Bảo trì</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* VÙNG B: MÀN HÌNH TỔNG QUAN (MOBILE) HOẶC MẶC ĐỊNH (PC) */}
      {/* ================================================= */}
      <div className={`${activeMobileTab === 'overview' ? 'flex flex-col animate-slide-in-right' : 'hidden lg:flex lg:flex-col'}`}>
        {/* Thẻ Thống kê nhanh - Responsive Tối ưu PC & Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
          {statCards.map((card, idx) => (
            <Link
              key={idx}
              to={card.linkTo || "#"}
              className="group bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden"
            >
              {/* Nửa trên: Nội dung chính */}
              <div className="p-3 sm:p-4 flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 transition-opacity ${isLoading ? "bg-slate-100 text-slate-300 animate-pulse" : card.colorClass
                    }`}
                >
                  <i className={`fa-solid ${card.icon}`}></i>
                </div>

                {/* Nội dung text */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                  <p
                    className="text-[12px] sm:text-[13px] text-slate-500 font-medium truncate"
                    title={card.title}
                  >
                    {card.title}
                  </p>

                  {/* Phần Số liệu & Phần trăm áp dụng Skeleton */}
                  <div className="flex items-center gap-1.5 sm:gap-2 h-6 sm:h-7">
                    {isLoading ? (
                      // Skeleton cho con số
                      <div className="h-5 sm:h-6 bg-slate-200 rounded-md w-12 animate-pulse"></div>
                    ) : (
                      <h3
                        className="text-lg sm:text-xl font-bold text-slate-800 truncate"
                        title={card.value}
                      >
                        {card.value}
                      </h3>
                    )}

                    {isLoading ? (
                      // Skeleton cho phần % phụ
                      <div className="hidden sm:inline-block h-4 bg-slate-200 rounded md w-8 animate-pulse"></div>
                    ) : card.sub ? (
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

                {/* Icon điều hướng: Mobile */}
                <div className="sm:hidden text-slate-300 group-hover:text-[#0e8b4d] transition-colors shrink-0 ml-1">
                  <i className="fa-solid fa-angle-right text-[12px]"></i>
                </div>
              </div>

              {/* Nửa dưới: Dải "Xem chi tiết" (PC) */}
              <div className="hidden sm:block px-4 pb-3">
                <div className="pt-2.5 border-t border-slate-50 flex items-center text-[#0e8b4d] text-[12px] font-semibold group-hover:text-green-700 transition-colors">
                  Xem chi tiết
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
              Tình hình thu tiền tháng {collection.month_label}
            </h3>

            {isLoading ? (
              // SKELETON LOADING CHO KHỐI THU TIỀN
              <div className="flex flex-col md:flex-row flex-1 items-center gap-8 mb-4">
                {/* Biểu đồ tròn Skeleton */}
                <div className="relative w-[150px] h-[150px] rounded-full flex items-center justify-center shrink-0 bg-slate-200 animate-pulse">
                  <div className="w-[110px] h-[110px] bg-white rounded-full flex flex-col items-center justify-center text-center shadow-inner">
                    {/* Chữ "Thực thu" giả */}
                    <div className="w-12 h-3 bg-slate-200 rounded mb-2"></div>
                    {/* Số tiền thực thu giả */}
                    <div className="w-20 h-4 bg-slate-200 rounded mb-1"></div>
                    {/* Số tổng kỳ vọng giả */}
                    <div className="w-16 h-2 bg-slate-200 rounded mt-1.5 border-t border-slate-100 pt-1"></div>
                  </div>
                </div>

                {/* Thông số chi tiết bên phải Skeleton */}
                <div className="flex-1 w-full flex flex-col justify-center space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex items-center justify-between">
                      <div>
                        {/* Dấu chấm và Label */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-200 animate-pulse"></div>
                          <div className="w-24 h-3 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                        {/* Số tiền */}
                        <div className="w-20 h-3.5 bg-slate-200 rounded ml-[18px] animate-pulse"></div>
                      </div>
                      {/* Phần trăm % */}
                      <div className="w-8 h-3 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // DỮ LIỆU THẬT KHI ĐÃ LOAD XONG (Giữ nguyên code cũ của bạn)
              <div className="flex flex-col md:flex-row flex-1 items-center gap-8 mb-4">
                {/* Biểu đồ tròn Dynamic */}
                <div
                  className="relative w-[150px] h-[150px] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.05)]"
                  style={{ background: conicGradient }}
                >
                  <div className="w-[110px] h-[110px] bg-white rounded-full flex flex-col items-center justify-center text-center shadow-inner">
                    <span className="text-[11px] text-slate-500 font-medium mb-0.5">
                      Thực thu
                    </span>
                    <span className="text-[14px] font-bold text-slate-800 leading-none truncate max-w-[90px]" title={collection.collected_total + "đ"}>
                      {Number(collection.collected_total).toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1.5 border-t border-slate-100 pt-1">
                      / {Number(collection.total_expected).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                {/* Thông số chi tiết bên phải */}
                <div className="flex-1 w-full flex flex-col justify-center space-y-4">
                  {/* 1. Đã thu đủ */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Đã thu đủ
                      </div>
                      <p className="text-[13px] font-bold text-slate-800 ml-4.5">
                        {Number(collection.statuses.paid.amount).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <span className="text-[12px] text-slate-500 font-medium">
                      {collection.statuses.paid.percent}%
                    </span>
                  </div>

                  {/* 2. Đã thu một phần */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Đã thu một phần
                      </div>
                      <p className="text-[13px] font-bold text-slate-800 ml-4.5">
                        {Number(collection.statuses.partially_paid.amount).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <span className="text-[12px] text-slate-500 font-medium">
                      {collection.statuses.partially_paid.percent}%
                    </span>
                  </div>

                  {/* 3. Chưa thu */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Chưa thu
                      </div>
                      <p className="text-[13px] font-bold text-slate-800 ml-4.5">
                        {Number(collection.statuses.issued.amount).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <span className="text-[12px] text-slate-500 font-medium">
                      {collection.statuses.issued.percent}%
                    </span>
                  </div>

                  {/* 4. Đã hủy */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mb-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div> Đã hủy
                      </div>
                      <p className="text-[13px] font-bold text-slate-800 ml-4.5">
                        {Number(collection.statuses.cancelled.amount).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <span className="text-[12px] text-slate-500 font-medium">
                      {collection.statuses.cancelled.percent}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Link
              to="/landlord/invoices"
              className="text-[#0e8b4d] text-[12px] font-semibold flex items-center hover:text-green-700 mt-auto pt-4 border-t border-slate-50 transition-colors"
            >
              Quản lý hóa đơn thu tiền <i className="fa-solid fa-angle-right ml-1.5 text-[10px]"></i>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[15px] font-bold text-slate-800">
                Hóa đơn cần chú ý
              </h3>
              <Link
                to="/landlord/invoices"
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Xem tất cả {pendingTasks.unpaid_invoices_count > 0 ? `(${pendingTasks.unpaid_invoices_count})` : ''}
              </Link>
            </div>

            <div className="flex flex-col gap-3 flex-1 mb-4">
              {isLoading ? (
                // SKELETON LOADING CHO KHỐI HÓA ĐƠN
                <>
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between border border-slate-100 p-3 rounded-xl">
                      <div className="flex items-center gap-3 w-full">
                        {/* Icon vuông bo góc */}
                        <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                        {/* Tiêu đề & Mô tả */}
                        <div className="flex flex-col justify-center gap-1.5 flex-1">
                          <div className="w-32 h-3.5 bg-slate-200 rounded animate-pulse"></div>
                          <div className="w-20 h-3 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      {/* Số tiền & Mũi tên */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-20 h-3.5 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-2 h-3 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* 1. Hóa đơn quá hạn (Ưu tiên hiện đầu tiên) */}
                  <div className="flex items-center justify-between border border-slate-100 p-3 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${pendingTasks.overdue_invoices_count > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                        <i className="fa-solid fa-triangle-exclamation"></i>
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className={`text-[13px] font-semibold transition-colors ${pendingTasks.overdue_invoices_count > 0 ? 'text-slate-800 group-hover:text-red-600' : 'text-slate-500'}`}>
                          Hóa đơn quá hạn
                        </p>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          {pendingTasks.overdue_invoices_count || 0} hóa đơn
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[13px] font-bold ${pendingTasks.overdue_invoices_count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        {Number(pendingTasks.overdue_invoices_total || 0).toLocaleString('vi-VN')}đ
                      </span>
                      <i className="fa-solid fa-angle-right text-slate-400 text-[12px]"></i>
                    </div>
                  </div>

                  {/* 2. Sắp đến hạn */}
                  <div className="flex items-center justify-between border border-slate-100 p-3 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${pendingTasks.due_soon_invoices_count > 0 ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
                        <i className="fa-solid fa-clock-rotate-left"></i>
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className={`text-[13px] font-semibold transition-colors ${pendingTasks.due_soon_invoices_count > 0 ? 'text-slate-800 group-hover:text-orange-600' : 'text-slate-500'}`}>
                          Sắp đến hạn (3 ngày)
                        </p>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          {pendingTasks.due_soon_invoices_count || 0} hóa đơn
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[13px] font-bold ${pendingTasks.due_soon_invoices_count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        {Number(pendingTasks.due_soon_invoices_total || 0).toLocaleString('vi-VN')}đ
                      </span>
                      <i className="fa-solid fa-angle-right text-slate-400 text-[12px]"></i>
                    </div>
                  </div>

                  {/* 3. Chưa thanh toán (Tất cả hóa đơn còn nợ) */}
                  <div className="flex items-center justify-between border border-slate-100 p-3 rounded-xl hover:border-green-200 hover:bg-green-50/30 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${pendingTasks.unpaid_invoices_count > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                        <i className="fa-solid fa-file-invoice-dollar"></i>
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className={`text-[13px] font-semibold transition-colors ${pendingTasks.unpaid_invoices_count > 0 ? 'text-slate-800 group-hover:text-green-600' : 'text-slate-500'}`}>
                          Tổng nợ chờ thu
                        </p>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          {pendingTasks.unpaid_invoices_count || 0} hóa đơn
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[13px] font-bold ${pendingTasks.unpaid_invoices_count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        {Number(pendingTasks.unpaid_invoices_total || 0).toLocaleString('vi-VN')}đ
                      </span>
                      <i className="fa-solid fa-angle-right text-slate-400 text-[12px]"></i>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link
              to="/landlord/invoices"
              className="text-[#0e8b4d] text-[12px] font-semibold flex items-center hover:text-green-700 mt-auto pt-4 border-t border-slate-50"
            >
              Xem danh sách hóa đơn{" "}
              <i className="fa-solid fa-angle-right ml-1.5 text-[10px]"></i>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[15px] font-bold text-slate-800">
                Thông báo quan trọng
              </h3>
              <Link
                to="/landlord/notifications"
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="flex flex-col gap-5 flex-1">

              {/* Hiển thị Loading */}
              {isLoading && (
                <>
                  {[1, 2].map((item) => (
                    <div key={item} className="flex gap-4 items-start relative pb-5 border-b border-slate-100/60 last:border-0">
                      {/* Icon Skeleton */}
                      <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse shrink-0"></div>
                      {/* Text Skeleton */}
                      <div className="flex-1 flex flex-col pt-1 gap-1.5">
                        {/* Tiêu đề giả */}
                        <div className="w-32 h-3.5 bg-slate-200 rounded animate-pulse mb-0.5"></div>
                        {/* Hai dòng mô tả giả */}
                        <div className="w-[85%] h-3 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-[60%] h-3 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!isLoading && (
                <>
                  {/* 1. Cảnh báo Hợp đồng */}
                  {pendingTasks.expiring_leases_count > 0 && (
                    <div className="flex gap-4 items-start relative pb-5 border-b border-slate-100/60">
                      <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-500 flex items-center justify-center text-xl shrink-0">
                        <i className="fa-solid fa-folder-open"></i>
                      </div>
                      <div className="flex-1 flex flex-col justify-center pt-0.5">
                        <p className="text-[13px] font-bold text-slate-800 mb-0.5">
                          Hợp đồng sắp hết hạn
                        </p>
                        <p className="text-[12px] text-slate-500">
                          Có <span className="font-semibold text-yellow-600">{pendingTasks.expiring_leases_count} hợp đồng</span> sẽ hết hạn trong vòng 30 ngày tới.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2. Cảnh báo Sự cố */}
                  {pendingTasks.pending_incidents_count > 0 && (
                    <div className="flex gap-4 items-start relative pb-5 border-b border-slate-100/60">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl shrink-0">
                        <i className="fa-solid fa-screwdriver-wrench"></i>
                      </div>
                      <div className="flex-1 flex flex-col justify-center pt-0.5">
                        <p className="text-[13px] font-bold text-slate-800 mb-0.5">
                          Sự cố cần xử lý
                        </p>
                        <p className="text-[12px] text-slate-500">
                          Bạn có <span className="font-semibold text-orange-600">{pendingTasks.pending_incidents_count} sự cố</span> đang chờ tiếp nhận/nghiệm thu.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. Cảnh báo Hóa đơn nợ */}
                  {pendingTasks.unpaid_invoices_count > 0 && (
                    <div className="flex gap-4 items-start relative">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center text-xl shrink-0">
                        <i className="fa-solid fa-file-circle-exclamation"></i>
                      </div>
                      <div className="flex-1 flex flex-col justify-center pt-0.5">
                        <p className="text-[13px] font-bold text-slate-800 mb-0.5">
                          {pendingTasks.unpaid_invoices_count} hóa đơn chưa thu đủ
                        </p>
                        <p className="text-[12px] text-slate-500">
                          Tổng công nợ: <span className="font-bold text-red-500">{Number(pendingTasks.unpaid_invoices_total).toLocaleString("vi-VN")}đ</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 4. Trạng thái rỗng (Khi mọi thứ đều tốt, = 0) */}
                  {pendingTasks.expiring_leases_count === 0 &&
                    pendingTasks.pending_incidents_count === 0 &&
                    pendingTasks.unpaid_invoices_count === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 opacity-60">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                          <i className="fa-regular fa-bell-slash text-2xl text-slate-400"></i>
                        </div>
                        <p className="text-[13px] text-slate-500 font-medium">Tuyệt vời! Không có cảnh báo nào.</p>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Thao tác nhanh */}
        <div className="mb-6">
          <h3 className="text-[15px] font-bold text-slate-800 mb-4">
            Thao tác nhanh
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <Link to="/landlord/properties" className="bg-white border border-slate-100 rounded-xl py-5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-[#0e8b4d] hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-house-medical text-[16px] text-[#0e8b4d] group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Thêm khu nhà
              </span>
            </Link>
            <Link to="/landlord/rooms" className="bg-white border border-slate-100 rounded-xl py-5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-door-open text-[16px] text-blue-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Thêm phòng
              </span>
            </Link>
            <Link to="/landlord/tenants" className="bg-white border border-slate-100 rounded-xl py-5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-user-plus text-[16px] text-orange-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Thêm khách thuê
              </span>
            </Link>
            <Link to="/landlord/leases" className="bg-white border border-slate-100 rounded-xl py-5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-file-signature text-[16px] text-purple-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Tạo hợp đồng
              </span>
            </Link>
            <Link to="/landlord/utilities" className="bg-white border border-slate-100 rounded-xl py-5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-yellow-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-bolt text-[16px] text-yellow-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Chốt điện nước
              </span>
            </Link>
            <Link to="/landlord/invoices" className="bg-white border border-slate-100 rounded-xl py-5 px-3 flex items-center justify-center gap-2.5 shadow-sm hover:border-red-500 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <i className="fa-solid fa-file-invoice-dollar text-[16px] text-red-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[13px] font-semibold text-slate-700">
                Tạo hóa đơn
              </span>
            </Link>
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
                  {isLoading ? (
                    // SKELETON LOADING CHO BẢNG HỢP ĐỒNG
                    <>
                      {[1, 2, 3, 4].map((item) => (
                        <tr key={item} className="border-b border-slate-50 last:border-0">
                          {/* Cột 1: Phòng */}
                          <td className="py-3.5 pl-2">
                            <div className="h-3.5 bg-slate-200 rounded animate-pulse w-24"></div>
                          </td>
                          {/* Cột 2: Khách thuê */}
                          <td className="py-3.5">
                            <div className="h-3.5 bg-slate-200 rounded animate-pulse w-32"></div>
                          </td>
                          {/* Cột 3: Ngày hết hạn (Căn giữa) */}
                          <td className="py-3.5">
                            <div className="h-3.5 bg-slate-200 rounded animate-pulse w-20 mx-auto"></div>
                          </td>
                          {/* Cột 4: Còn lại (Căn phải) */}
                          <td className="py-3.5 pr-2">
                            <div className="h-3.5 bg-slate-200 rounded animate-pulse w-16 ml-auto"></div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : expiringLeases.length === 0 ? (
                    // TRẠNG THÁI TRỐNG (Giữ nguyên)
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500 font-medium">
                        Chưa có hợp đồng nào sắp hết hạn.
                      </td>
                    </tr>
                  ) : (
                    expiringLeases.map((lease) => (
                      <tr key={lease.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 border-b border-slate-50 text-slate-800 font-medium pl-2">
                          {lease.room_name} - {lease.property_name}
                        </td>
                        <td className="py-3 border-b border-slate-50 text-slate-600">
                          {lease.tenant_name}
                        </td>
                        <td className="py-3 border-b border-slate-50 text-slate-600 text-center">
                          {lease.end_date}
                        </td>
                        <td
                          className={`py-3 border-b border-slate-50 font-bold text-right pr-2 ${lease.days_left <= 10
                            ? "text-red-500" // Cấp bách (10 ngày)
                            : lease.days_left <= 20
                              ? "text-orange-500" // Cần chú ý (20 ngày)
                              : "text-blue-500" // Bình thường
                            }`}
                        >
                          {lease.days_left} ngày
                        </td>
                      </tr>
                    ))
                  )}
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

            {isLoading ? (
              // SKELETON LOADING CHO BIỂU ĐỒ 
              <>
                <div className="relative h-[240px] mt-2">
                  {/* Trục Y Skeleton */}
                  <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex items-center w-full border-b border-slate-100 pb-1 h-0">
                        <div className="w-4 h-2 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>

                  {/* Các Cột Biểu Đồ Skeleton */}
                  <div className="absolute inset-0 pl-10 pr-2 pb-5 flex items-end justify-between z-10 pt-4">
                    {/* Chiều cao giả lập dạng biểu đồ (30%, 70%, 50%, 90%, 60%, 80%) */}
                    {[30, 70, 50, 90, 60, 80].map((h, index) => (
                      <div
                        key={index}
                        className="w-[12%] sm:w-[10%] bg-slate-200 rounded-t-sm animate-pulse"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Trục X Skeleton */}
                <div className="pl-10 pr-2 flex justify-between items-center mt-1">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="w-[12%] sm:w-[10%] flex justify-center">
                      <div className="w-8 h-2 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // BIỂU ĐỒ THẬT KHI ĐÃ CÓ DATA (Có hiệu ứng mọc lên)
              <>
                <div className="relative h-[240px] mt-2">
                  {/* Trục Y */}
                  <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400">
                    <div className="flex items-center w-full border-b border-slate-100 pb-1"><span>{yAxisMaxM}M</span></div>
                    <div className="flex items-center w-full border-b border-slate-100 pb-1"><span>{(yAxisMaxM * 2) / 3}M</span></div>
                    <div className="flex items-center w-full border-b border-slate-100 pb-1"><span>{yAxisMaxM / 3}M</span></div>
                    <div className="flex items-center w-full pb-1"><span>0</span></div>
                  </div>

                  {/* Các Cột Biểu Đồ (Dynamic + Grow Animation) */}
                  <div className="absolute inset-0 pl-10 pr-2 pb-5 flex items-end justify-between z-10 pt-4">
                    {financialChart.map((item, index) => {
                      const heightPercent = yAxisMax > 0 ? (item.income / yAxisMax) * 100 : 0;
                      return (
                        <div
                          key={index}
                          // Thêm duration-1000 ease-out để cột chạy lên mượt mà trong 1 giây
                          className="w-[12%] sm:w-[10%] bg-[#4ade80] rounded-t-sm relative group flex justify-center transition-all duration-1000 ease-out hover:bg-[#22c55e]"
                          // Nếu animateChart là false -> cao 0%. True -> vọt lên % thật
                          style={{ height: animateChart ? `${heightPercent}%` : '0%' }}
                        >
                          {/* Con số trên đỉnh cột (Sẽ từ từ hiện ra sau khi cột mọc xong nhờ delay) */}
                          <span className={`absolute -top-6 text-[9px] sm:text-[10px] font-bold text-slate-800 whitespace-nowrap bg-white/90 sm:bg-transparent px-1 rounded transition-opacity duration-500 delay-500 ${animateChart ? 'opacity-0 sm:opacity-100 group-hover:opacity-100' : 'opacity-0'}`}>
                            {item.income > 0 ? Number(item.income).toLocaleString('vi-VN') : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trục X */}
                <div className="pl-10 pr-2 flex justify-between items-center text-[9px] sm:text-[11px] text-slate-500 font-medium mt-1">
                  {financialChart.map((item, index) => (
                    <span key={index} className="w-[12%] sm:w-[10%] text-center whitespace-nowrap">
                      Tháng {item.month}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
