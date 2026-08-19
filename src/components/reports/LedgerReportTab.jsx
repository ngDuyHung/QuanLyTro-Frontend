import React from "react";
import Tooltip from "@/components/common/Tooltip";

// Hàm format tiền tệ VNĐ
const formatVND = (amount) => {
  return Number(amount || 0).toLocaleString("vi-VN") + " đ";
};

// Hàm dịch phương thức thanh toán (Tối ưu responsive text)
const formatMethod = (method) => {
  switch (method) {
    case "cash":
      return <span className="text-emerald-600 bg-emerald-50 px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-[11px] font-semibold border border-emerald-100 whitespace-nowrap">Tiền mặt</span>;
    case "bank_transfer":
      return <span className="text-blue-600 bg-blue-50 px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-[11px] font-semibold border border-blue-100 whitespace-nowrap">Chuyển khoản</span>;
    case "sepay":
      return <span className="text-purple-600 bg-purple-50 px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-[11px] font-semibold border border-purple-100 whitespace-nowrap">SePay (Tự động)</span>;
    default:
      return <span className="text-slate-600 bg-slate-50 px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-[11px] font-semibold border border-slate-200 whitespace-nowrap">Khác</span>;
  }
};

// Hàm format ngày tháng
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${h}:${min}`;
};

export default function LedgerReportTab({ data }) {
  if (!data) return null;

  const { summary = {}, transactions = [] } = data;

  const openingBalance = summary.opening_balance || 0;
  const totalIncome = summary.total_income || 0;
  const totalExpense = summary.total_expense || 0;
  const closingBalance = summary.closing_balance || 0;
  const depositHeld = summary.deposit_held || 0;
  const freeCashBalance = summary.free_cash_balance ?? closingBalance;

  const operatingIncome = summary.operating_income ?? totalIncome;
  const depositReceived = summary.deposit_received || 0;
  const operatingExpense = summary.operating_expense ?? totalExpense;
  const depositRefunded = summary.deposit_refunded || 0;
  const hasDepositFlowInPeriod = depositReceived > 0 || depositRefunded > 0;

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-[fadeIn_0.3s_ease-out]">

      {/* 1. KHỐI TỔNG QUAN (2 Cột trên Mobile / 4 Cột trên PC) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

        {/* Tồn Đầu Kỳ */}
        <div className="bg-white rounded-xl p-3.5 md:p-4 border border-slate-100 shadow-sm flex flex-col justify-between gap-2">
          <span className="text-[10px] md:text-[12px] text-slate-500 font-semibold uppercase flex items-center leading-tight">
            Tồn quỹ đầu kỳ
            <Tooltip content="Số tiền thực tế có trong quỹ (tiền mặt/ngân hàng) tính đến ngay trước ngày bắt đầu kỳ báo cáo." />
          </span>
          <span className="text-base sm:text-xl font-bold text-slate-800 truncate">
            {formatVND(openingBalance)}
          </span>
        </div>

        {/* Tổng Thu */}
        <div className="bg-white rounded-xl p-3.5 md:p-4 border border-slate-100 shadow-sm flex flex-col justify-between gap-2">
          <span className="text-[10px] md:text-[12px] text-slate-500 font-semibold uppercase flex items-center leading-tight">
            Tổng Thu (trong kỳ)
            <Tooltip content="Toàn bộ dòng tiền chảy vào quỹ (Bao gồm cả doanh thu và tiền cọc thu mới của khách)." />
          </span>
          <span className="text-base sm:text-xl font-bold text-green-600 truncate">
            + {formatVND(totalIncome)}
          </span>
          {hasDepositFlowInPeriod && (
            <span className="text-[9px] md:text-[11px] text-slate-400 mt-auto leading-tight">
              Kinh doanh: {formatVND(operatingIncome)}
              <br className="md:hidden" />
              <span className="hidden md:inline"> · </span>
              Cọc mới: {formatVND(depositReceived)}
            </span>
          )}
        </div>

        {/* Tổng Chi */}
        <div className="bg-white rounded-xl p-3.5 md:p-4 border border-slate-100 shadow-sm flex flex-col justify-between gap-2">
          <span className="text-[10px] md:text-[12px] text-slate-500 font-semibold uppercase flex items-center leading-tight">
            Tổng Chi (trong kỳ)
            <Tooltip content="Toàn bộ dòng tiền chảy ra khỏi quỹ (Bao gồm cả chi phí vận hành và tiền hoàn cọc cho khách)." />
          </span>
          <span className="text-base sm:text-xl font-bold text-red-500 truncate">
            - {formatVND(totalExpense)}
          </span>
          {hasDepositFlowInPeriod && (
            <span className="text-[9px] md:text-[11px] text-slate-400 mt-auto leading-tight">
              Chi phí: {formatVND(operatingExpense)}
              <br className="md:hidden" />
              <span className="hidden md:inline"> · </span>
              Hoàn cọc: {formatVND(depositRefunded)}
            </span>
          )}
        </div>

        {/* Tồn Cuối Kỳ */}
        <div className="bg-white rounded-xl p-3.5 md:p-4 border border-[#0e8b4d]/30 bg-[#0e8b4d]/5 shadow-sm flex flex-col relative justify-between gap-2">
          {/* Lớp bọc background riêng biệt không gây cắt Tooltip */}
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div className="absolute -right-3 -top-3 md:-right-4 md:-top-4 text-[#0e8b4d]/10 text-5xl md:text-6xl">
              <i className="fa-solid fa-vault"></i>
            </div>
          </div>

          <span className="text-[10px] md:text-[12px] text-[#0e8b4d] font-bold uppercase z-10 flex items-center leading-tight">
            Tồn quỹ cuối kỳ
            <Tooltip content="Số tiền thực tế bạn đang cầm trong tay tính đến cuối kỳ báo cáo. Bằng: Tồn đầu kỳ + Tổng Thu - Tổng Chi." />
          </span>
          <span className="text-base sm:text-xl lg:text-2xl font-bold text-[#0e8b4d] z-10 truncate">
            {formatVND(closingBalance)}
          </span>
        </div>
      </div>

      {/* 1.5 CẢNH BÁO TIỀN GIỮ HỘ (Thiết kế ngang mượt mà trên Mobile) */}
      {depositHeld > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 flex flex-row items-center md:items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm md:text-lg shrink-0">
            <i className="fa-solid fa-hand-holding-dollar"></i>
          </div>
          <p className="text-[10px] md:text-[12px] text-amber-800 leading-relaxed flex-1">
            Trong <span className="font-bold">{formatVND(closingBalance)}</span> tồn quỹ,
            chỉ <span className="font-bold">{formatVND(freeCashBalance)}</span> là tiền tự do sử dụng.
            Còn lại <span className="font-bold">{formatVND(depositHeld)}</span> là cọc giữ hộ phải trả lại khách, không nên tiêu vào.
          </p>
        </div>
      )}

      {/* 2. BẢNG CHI TIẾT GIAO DỊCH */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-3.5 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-[14px] md:text-[15px]">
            <i className="fa-solid fa-list-check text-blue-500"></i>
            Biến động số dư
          </div>
          <span className="text-[11px] md:text-[12px] text-slate-500 font-medium">
            {transactions.length} giao dịch
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar pb-1">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-50 text-[11px] md:text-[12px] text-slate-500 uppercase tracking-wider">
                {/* Cột Thời gian được ghim bên trái */}
                <th className="py-2.5 md:py-3 px-3 md:px-4 font-bold border-b border-slate-200 sticky left-0 z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Thời gian
                </th>
                <th className="py-2.5 md:py-3 px-3 md:px-4 font-bold border-b border-slate-200">Mã GD</th>
                <th className="py-2.5 md:py-3 px-3 md:px-4 font-bold border-b border-slate-200">Nội dung GD</th>
                <th className="py-2.5 md:py-3 px-3 md:px-4 font-bold border-b border-slate-200 text-center">Hình thức</th>
                <th className="py-2.5 md:py-3 px-3 md:px-4 font-bold border-b border-slate-200 text-right">Thu (+)</th>
                <th className="py-2.5 md:py-3 px-3 md:px-4 font-bold border-b border-slate-200 text-right">Chi (-)</th>
                <th className="py-2.5 md:py-3 px-3 md:px-4 font-bold border-b border-slate-200 text-right">Tồn quỹ</th>
              </tr>
            </thead>
            <tbody className="text-[12px] md:text-[13px] text-slate-700">

              {/* Dòng Tồn đầu kỳ */}
              <tr className="bg-slate-50/50 font-semibold border-b border-slate-100">
                <td className="py-2.5 md:py-3 px-3 md:px-4 text-slate-500 sticky left-0 z-10 bg-slate-50/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  --- Đầu kỳ ---
                </td>
                <td className="py-2.5 md:py-3 px-3 md:px-4" colSpan="5"></td>
                <td className="py-2.5 md:py-3 px-3 md:px-4 text-right text-slate-800">
                  {formatVND(openingBalance)}
                </td>
              </tr>

              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-500 sticky left-0">
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <i className="fa-solid fa-file-invoice text-xl md:text-2xl text-slate-400"></i>
                      </div>
                      Không có phát sinh giao dịch nào.
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="group border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {/* Cột Thời gian (Ghim Trái) */}
                    <td className="py-2.5 md:py-3 px-3 md:px-4 text-slate-500 sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {formatDate(tx.date)}
                    </td>

                    {/* Mã GD */}
                    <td className="py-2.5 md:py-3 px-3 md:px-4 font-medium text-slate-600">
                      {tx.code}
                    </td>

                    {/* Nội dung (Cắt chữ + Nút Xem Mở Tooltip) */}
                    <td className="py-2.5 md:py-3 px-3 md:px-4 text-slate-500 sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center">
                        <span className="inline-block truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] font-medium text-slate-700">
                          {tx.description}
                        </span>

                        {/* Ứng dụng Tooltip mới: Bọc nút "Xem" vào Tooltip */}
                        <Tooltip content={tx.description}>
                          <button
                            type="button"
                            className="ml-2 text-[10px] md:text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-1.5 py-0.5 rounded font-semibold transition-colors shrink-0"
                          >
                            Xem
                          </button>
                        </Tooltip>


                      </div>
                    </td>

                    {/* Hình thức */}
                    <td className="py-2.5 md:py-3 px-3 md:px-4 text-center">
                      {formatMethod(tx.method)}
                    </td>

                    {/* Số liệu Thu/Chi/Tồn */}
                    <td className="py-2.5 md:py-3 px-3 md:px-4 text-right font-bold text-green-600">
                      {tx.income > 0 ? `+${formatVND(tx.income)}` : "-"}
                    </td>
                    <td className="py-2.5 md:py-3 px-3 md:px-4 text-right font-bold text-red-500">
                      {tx.expense > 0 ? `-${formatVND(tx.expense)}` : "-"}
                    </td>
                    <td className="py-2.5 md:py-3 px-3 md:px-4 text-right font-bold text-slate-800">
                      {formatVND(tx.balance)}
                    </td>
                  </tr>
                ))
              )}

              {/* Dòng Tổng cộng cuối kỳ */}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <td className="py-2.5 md:py-3 px-3 md:px-4 uppercase text-slate-800 sticky left-0 z-10 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Tổng cộng
                </td>
                <td className="py-2.5 md:py-3 px-3 md:px-4" colSpan="3"></td>
                <td className="py-2.5 md:py-3 px-3 md:px-4 text-right text-green-600">
                  {formatVND(totalIncome)}
                </td>
                <td className="py-2.5 md:py-3 px-3 md:px-4 text-right text-red-500">
                  {formatVND(totalExpense)}
                </td>
                <td className="py-2.5 md:py-3 px-3 md:px-4 text-right text-[#0e8b4d] text-[13px] md:text-[14px]">
                  {formatVND(closingBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}