import React from "react";

// Hàm format tiền tệ VNĐ
const formatVND = (amount) => {
  return Number(amount || 0).toLocaleString("vi-VN") + " đ";
};

// Hàm dịch phương thức thanh toán
const formatMethod = (method) => {
  switch (method) {
    case "cash":
      return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-100">Tiền mặt</span>;
    case "bank_transfer":
      return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-100">Chuyển khoản</span>;
    case "sepay":
      return <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-purple-100">SePay (Tự động)</span>;
    default:
      return <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">Khác</span>;
  }
};

// Hàm format ngày tháng (Từ YYYY-MM-DD HH:mm sang DD/MM/YYYY HH:mm)
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

  // Bóc tách phần "tiền của mình" và phần "tiền giữ hộ khách" phát sinh TRONG KỲ,
  // để Tổng Thu/Chi không còn là một con số gộp mập mờ.
  const operatingIncome = summary.operating_income ?? totalIncome;
  const depositReceived = summary.deposit_received || 0;
  const operatingExpense = summary.operating_expense ?? totalExpense;
  const depositRefunded = summary.deposit_refunded || 0;
  const hasDepositFlowInPeriod = depositReceived > 0 || depositRefunded > 0;

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      
      {/* 1. KHỐI TỔNG QUAN (4 CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col">
          <span className="text-[12px] text-slate-500 font-semibold mb-1 uppercase">
            Tồn quỹ đầu kỳ
          </span>
          <span className="text-lg lg:text-xl font-bold text-slate-800">
            {formatVND(openingBalance)}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col">
          <span className="text-[12px] text-slate-500 font-semibold mb-1 uppercase">
            Tổng Thu trong kỳ
          </span>
          <span className="text-lg lg:text-xl font-bold text-green-600">
            + {formatVND(totalIncome)}
          </span>
          {hasDepositFlowInPeriod && (
            <span className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Doanh thu thật: {formatVND(operatingIncome)}
              {depositReceived > 0 && <> · Cọc thu mới: {formatVND(depositReceived)}</>}
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col">
          <span className="text-[12px] text-slate-500 font-semibold mb-1 uppercase">
            Tổng Chi trong kỳ
          </span>
          <span className="text-lg lg:text-xl font-bold text-red-500">
            - {formatVND(totalExpense)}
          </span>
          {hasDepositFlowInPeriod && (
            <span className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Chi phí thực: {formatVND(operatingExpense)}
              {depositRefunded > 0 && <> · Hoàn cọc: {formatVND(depositRefunded)}</>}
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#0e8b4d]/30 bg-[#0e8b4d]/5 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-[#0e8b4d]/10 text-6xl">
            <i className="fa-solid fa-vault"></i>
          </div>
          <span className="text-[12px] text-[#0e8b4d] font-bold mb-1 uppercase z-10">
            Tồn quỹ cuối kỳ
          </span>
          <span className="text-xl lg:text-2xl font-bold text-[#0e8b4d] z-10">
            {formatVND(closingBalance)}
          </span>
        </div>
      </div>

      {/* 1.5 PHÂN TÁCH TỒN QUỸ: TIỀN CỌC GIỮ HỘ vs TIỀN TỰ DO SỬ DỤNG */}
      {depositHeld > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg shrink-0">
            <i className="fa-solid fa-hand-holding-dollar"></i>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
            <p className="text-[12px] text-amber-800 leading-relaxed flex-1">
              Trong <span className="font-bold">{formatVND(closingBalance)}</span> tồn quỹ hiện có,
              chỉ <span className="font-bold">{formatVND(freeCashBalance)}</span> là tiền tự do sử dụng.
              Phần còn lại <span className="font-bold">{formatVND(depositHeld)}</span> là tiền cọc giữ chỗ/thế chân
              của khách thuê, sẽ phải hoàn trả khi khách trả phòng — không nên tiêu vào số này.
            </p>
          </div>
        </div>
      )}

      {/* 2. BẢNG CHI TIẾT GIAO DỊCH (WATERFALL) */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-[15px]">
            <i className="fa-solid fa-list-check text-blue-500"></i>
            Chi tiết biến động số dư
          </div>
          <span className="text-[12px] text-slate-500 font-medium">
            {transactions.length} giao dịch
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[12px] text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-bold border-b border-slate-200">Thời gian</th>
                <th className="py-3 px-4 font-bold border-b border-slate-200">Mã GD</th>
                <th className="py-3 px-4 font-bold border-b border-slate-200">Nội dung</th>
                <th className="py-3 px-4 font-bold border-b border-slate-200 text-center">Hình thức</th>
                <th className="py-3 px-4 font-bold border-b border-slate-200 text-right">Thu (+)</th>
                <th className="py-3 px-4 font-bold border-b border-slate-200 text-right">Chi (-)</th>
                <th className="py-3 px-4 font-bold border-b border-slate-200 text-right">Tồn quỹ</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-700">
              {/* Dòng Tồn đầu kỳ giả lập để bảng liền mạch */}
              <tr className="bg-slate-50/50 font-semibold border-b border-slate-100">
                <td className="py-3 px-4 text-slate-500 text-center" colSpan="6">
                  --- Số dư đầu kỳ ---
                </td>
                <td className="py-3 px-4 text-right text-slate-800">
                  {formatVND(openingBalance)}
                </td>
              </tr>

              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <i className="fa-solid fa-file-invoice text-2xl text-slate-400"></i>
                      </div>
                      Không có phát sinh giao dịch nào trong khoảng thời gian này.
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {tx.code}
                    </td>
                    <td className="py-3 px-4 truncate max-w-[250px]" title={tx.description}>
                      {tx.description}
                      {tx.is_deposit && (
                        <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-semibold align-middle">
                          Cọc
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {formatMethod(tx.method)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">
                      {tx.income > 0 ? `+${formatVND(tx.income)}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-500">
                      {tx.expense > 0 ? `-${formatVND(tx.expense)}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      {formatVND(tx.balance)}
                    </td>
                  </tr>
                ))
              )}

              {/* Dòng Tổng cộng cuối kỳ */}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <td className="py-3 px-4 text-center uppercase text-slate-800" colSpan="4">
                  Tổng cộng phát sinh
                </td>
                <td className="py-3 px-4 text-right text-green-600">
                  {formatVND(totalIncome)}
                </td>
                <td className="py-3 px-4 text-right text-red-500">
                  {formatVND(totalExpense)}
                </td>
                <td className="py-3 px-4 text-right text-[#0e8b4d] text-[14px]">
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