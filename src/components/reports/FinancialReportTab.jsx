import React from "react";
import Tooltip from "@/components/common/Tooltip";

// Hàm format tiền tệ VNĐ
const formatVND = (amount) => {
    return Number(amount || 0).toLocaleString("vi-VN") + " đ";
};

// Từ điển dịch thuật Category từ database sang Tiếng Việt
const categoryLabels = {
    invoice_payment: "Thu tiền hóa đơn (Tiền phòng, điện nước...)",
    holding_deposit: "Thu cọc giữ chỗ",
    security_deposit: "Thu tiền thế chân",
    deposit_forfeit: "Tiền phạt cọc (Khách bùng)",
    damage_fee: "Phí bồi thường hư hỏng",
    other_income: "Nguồn thu khác",

    refund_security_deposit: "Hoàn trả tiền thế chân",
    repair: "Bảo trì & Sửa chữa",
    operation: "Chi phí vận hành chung",
    other_expense: "Chi phí khác",
};

// Badge hiển thị SỐ TIỀN chênh lệch tuyệt đối so với kỳ trước
const ChangeBadge = ({ current, previous, invert = false }) => {
    if (previous === null || previous === undefined) return null;

    const diff = current - previous;

    // Cả 2 kỳ đều không phát sinh gì
    if (diff === 0 && previous === 0) {
        return (
            <span className="inline-flex items-start md:items-center gap-1 text-[10px] md:text-[11px] font-semibold px-1.5 py-1 md:py-0.5 rounded text-slate-400 bg-slate-50 w-fit">
                <i className="fa-solid fa-minus text-[9px] mt-0.5 md:mt-0"></i>
                <span className="leading-tight">Không phát sinh</span>
            </span>
        );
    }

    const isFlat = diff === 0;
    const isUp = diff > 0;
    const isGood = isFlat ? null : invert ? !isUp : isUp;

    const colorClass = isFlat
        ? "text-slate-400 bg-slate-50"
        : isGood
            ? "text-green-600 bg-green-50"
            : "text-red-500 bg-red-50";

    const icon = isFlat ? "fa-minus" : isUp ? "fa-arrow-up" : "fa-arrow-down";

    // Kỳ trước không có dữ liệu để so sánh -> ghi rõ là "phát sinh mới"
    if (previous === 0) {
        return (
            <span className={`inline-flex items-start md:items-center gap-1 text-[10px] md:text-[11px] font-semibold px-1.5 py-1 md:py-0.5 rounded ${colorClass} w-fit`}>
                <i className={`fa-solid ${icon} text-[9px] mt-0.5 md:mt-0`}></i>
                <span className="leading-tight break-words">Phát sinh mới {formatVND(Math.abs(diff))}</span>
            </span>
        );
    }

    const sign = isUp ? "+" : isFlat ? "" : "-";

    return (
        <span className={`inline-flex items-start md:items-center gap-1 text-[10px] md:text-[11px] font-semibold px-1.5 py-1 md:py-0.5 rounded ${colorClass} w-fit`}>
            <i className={`fa-solid ${icon} text-[9px] mt-0.5 md:mt-0`}></i>
            <span className="leading-tight break-words">{sign}{formatVND(Math.abs(diff))} vs kỳ trước</span>
        </span>
    );
};

// Badge riêng cho Biên lợi nhuận
const MarginChangeBadge = ({ currentMargin, previousMargin }) => {
    if (previousMargin === null || previousMargin === undefined) return null;

    const diff = Math.round((currentMargin - previousMargin) * 10) / 10;
    const isFlat = Math.abs(diff) < 0.05;
    const isUp = diff > 0;

    const colorClass = isFlat
        ? "text-slate-400 bg-slate-50"
        : isUp
            ? "text-green-600 bg-green-50"
            : "text-red-500 bg-red-50";

    const icon = isFlat ? "fa-minus" : isUp ? "fa-arrow-up" : "fa-arrow-down";
    const sign = isUp ? "+" : isFlat ? "" : "-";

    return (
        <span className={`inline-flex items-start md:items-center gap-1 text-[10px] md:text-[11px] font-semibold px-1.5 py-1 md:py-0.5 rounded ${colorClass} w-fit`}>
            <i className={`fa-solid ${icon} text-[9px] mt-0.5 md:mt-0`}></i>
            <span className="leading-tight">{sign}{Math.abs(diff)} điểm % vs kỳ trước</span>
        </span>
    );
};

export default function FinancialReportTab({ data }) {
    if (!data) return null;

    const {
        overview = {},
        income_breakdown = {},
        expense_breakdown = {},
        deposit_holding = {},
        comparison = {},
        property_breakdown = [],
    } = data;

    const totalIncome = overview?.total_income || 0;
    const totalExpense = overview?.total_expense || 0;
    const profit = overview?.profit || 0;
    const profitMargin = overview?.profit_margin ?? 0;

    const depositReceived = deposit_holding?.received || 0;
    const depositRefunded = deposit_holding?.refunded || 0;
    const hasDepositActivity = depositReceived > 0 || depositRefunded > 0;

    const previousIncome = comparison?.previous_total_income;
    const previousExpense = comparison?.previous_total_expense;
    const previousProfit = comparison?.previous_profit;

    // Biên lợi nhuận của kỳ trước
    const previousMargin = (previousIncome !== undefined && previousIncome !== null)
        ? (previousIncome > 0 ? Math.round(((previousIncome - previousExpense) / previousIncome) * 1000) / 10 : 0)
        : undefined;

    // Hàm render danh sách Breakdown
    const renderBreakdownList = (breakdownData, total, isIncome) => {
        const entries = Object.entries(breakdownData || {}).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-8 opacity-60">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <i className="fa-solid fa-box-open text-xl md:text-2xl text-slate-400"></i>
                    </div>
                    <p className="text-[12px] md:text-[13px] text-slate-500 font-medium">Chưa có dữ liệu phát sinh</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-3 md:gap-4 mt-2">
                {entries.map(([category, amount]) => {
                    const percent = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
                    const barColor = isIncome ? "bg-green-500" : "bg-red-500";
                    const label = categoryLabels[category] || category;

                    return (
                        <div key={category} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-[12px] md:text-[13px] font-medium text-slate-700 leading-snug">{label}</span>
                                <span className="text-[12px] md:text-[13px] font-bold text-slate-800 shrink-0">{formatVND(amount)}</span>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="flex-1 h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${barColor}`}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                                <span className="text-[11px] md:text-[12px] font-semibold text-slate-500 w-9 md:w-10 text-right shrink-0">
                                    {percent}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4 md:gap-6 animate-[fadeIn_0.3s_ease-out]">

            {/* 1. KHỐI THẺ TỔNG QUAN (2 Cột trên Mobile / 4 Cột trên PC) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                
                {/* Thẻ Tổng Doanh Thu */}
                <div className="bg-white rounded-xl p-3.5 md:p-5 border border-slate-100 shadow-sm flex flex-col justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-sm md:text-lg shrink-0">
                            <i className="fa-solid fa-arrow-trend-up"></i>
                        </div>
                        <span className="text-[10px] md:text-[12px] text-slate-500 font-semibold uppercase tracking-wide flex items-center leading-tight">
                            Tổng doanh thu
                            <Tooltip content="Chỉ tính doanh thu thật sự (tiền phòng, điện, nước...). KHÔNG bao gồm tiền cọc thu của khách." />
                        </span>
                    </div>
                    <span className="text-base sm:text-xl lg:text-2xl font-bold text-green-600 truncate">
                        {formatVND(totalIncome)}
                    </span>
                    <div className="mt-auto">
                        <ChangeBadge current={totalIncome} previous={previousIncome} invert={false} />
                    </div>
                </div>

                {/* Thẻ Tổng Chi Phí */}
                <div className="bg-white rounded-xl p-3.5 md:p-5 border border-slate-100 shadow-sm flex flex-col justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-sm md:text-lg shrink-0">
                            <i className="fa-solid fa-arrow-trend-down"></i>
                        </div>
                        <span className="text-[10px] md:text-[12px] text-slate-500 font-semibold uppercase tracking-wide flex items-center leading-tight">
                            Tổng chi phí
                            <Tooltip content="Chỉ tính các chi phí vận hành, sửa chữa... KHÔNG bao gồm tiền hoàn cọc cho khách." />
                        </span>
                    </div>
                    <span className="text-base sm:text-xl lg:text-2xl font-bold text-red-500 truncate">
                        {formatVND(totalExpense)}
                    </span>
                    <div className="mt-auto">
                        <ChangeBadge current={totalExpense} previous={previousExpense} invert={true} />
                    </div>
                </div>

                {/* Thẻ Lợi Nhuận */}
                <div className="bg-white rounded-xl p-3.5 md:p-5 border border-slate-100 shadow-sm flex flex-col justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className={`w-8 h-8 md:w-11 md:h-11 rounded-full flex items-center justify-center text-sm md:text-lg shrink-0 ${profit >= 0 ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                            <i className="fa-solid fa-wallet"></i>
                        </div>
                        <span className="text-[10px] md:text-[12px] text-slate-500 font-semibold uppercase tracking-wide flex items-center leading-tight">
                            Lợi nhuận gộp
                            <Tooltip content="Bằng Tổng doanh thu trừ đi Tổng chi phí. Đây là số tiền thực lãi của khu trọ." />
                        </span>
                    </div>
                    <span className={`text-base sm:text-xl lg:text-2xl font-bold truncate ${profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                        {formatVND(profit)}
                    </span>
                    <div className="mt-auto">
                        <ChangeBadge current={profit} previous={previousProfit} invert={false} />
                    </div>
                </div>

                {/* Thẻ Biên Lợi Nhuận */}
                <div className="bg-white rounded-xl p-3.5 md:p-5 border border-slate-100 shadow-sm flex flex-col justify-between gap-2 md:gap-3 relative">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-sm md:text-lg shrink-0">
                            <i className="fa-solid fa-percent"></i>
                        </div>
                        <span className="text-[10px] md:text-[12px] text-slate-500 font-semibold uppercase tracking-wide flex items-center leading-tight">
                            Biên lợi nhuận
                            <Tooltip content="Tỷ lệ phần trăm lợi nhuận trên tổng doanh thu. Ví dụ 20% nghĩa là cứ thu 100đ thì lãi 20đ." />
                        </span>
                    </div>
                    <span className="text-base sm:text-xl lg:text-2xl font-bold text-purple-600 truncate">
                        {profitMargin}%
                    </span>
                    <div className="mt-auto flex flex-col gap-1">
                        <MarginChangeBadge currentMargin={profitMargin} previousMargin={previousMargin} />
                        <span className="text-[9.5px] md:text-[11px] text-slate-400 leading-tight">
                            Thu 100đ thì lãi {profitMargin}đ
                        </span>
                    </div>
                </div>
            </div>

            {/* 1.5 KHỐI TIỀN GIỮ HỘ (CỌC) */}
            {hasDepositActivity && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-base md:text-lg shrink-0">
                        <i className="fa-solid fa-hand-holding-dollar"></i>
                    </div>
                    <div className="flex-1">
                        <p className="text-[12px] md:text-[13px] font-bold text-amber-800 mb-1">
                            Tiền cọc đang giữ hộ khách
                        </p>
                        <p className="text-[11px] md:text-[12px] text-amber-700 leading-relaxed">
                            Đã thu <span className="font-bold">{formatVND(depositReceived)}</span> cọc giữ chỗ/thế chân,
                            hoàn trả <span className="font-bold">{formatVND(depositRefunded)}</span>. 
                            (Không được cộng vào Lợi nhuận gộp).
                        </p>
                    </div>
                </div>
            )}

            {/* 2. DOANH THU THEO TỪNG KHU NHÀ (Hiển thị thanh scroll ngang mượt mà + Sticky Tên Khu) */}
            {property_breakdown.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-3.5 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-[14px] md:text-[15px]">
                            <i className="fa-solid fa-building-user text-blue-500"></i>
                            Hiệu quả theo khu nhà
                        </div>
                        <span className="text-[11px] md:text-[12px] text-slate-500 font-medium">
                            Xếp theo lợi nhuận
                        </span>
                    </div>
                    <div className="overflow-x-auto no-scrollbar pb-1">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[500px]">
                            <thead>
                                <tr className="bg-slate-50 text-[11px] md:text-[12px] text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-3 md:px-4 font-bold border-b border-slate-200 sticky left-0 z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        Khu nhà
                                    </th>
                                    <th className="py-3 px-3 md:px-4 font-bold border-b border-slate-200 text-right">Doanh thu</th>
                                    <th className="py-3 px-3 md:px-4 font-bold border-b border-slate-200 text-right">Chi phí</th>
                                    <th className="py-3 px-3 md:px-4 font-bold border-b border-slate-200 text-right">Lợi nhuận</th>
                                </tr>
                            </thead>
                            <tbody className="text-[12px] md:text-[13px] text-slate-700">
                                {property_breakdown.map((p) => (
                                    <tr key={p.property_id} className="group border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-3 md:px-4 font-bold text-slate-800 sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            {p.property_name}
                                        </td>
                                        <td className="py-3 px-3 md:px-4 text-right text-green-600 font-semibold">
                                            {formatVND(p.total_income)}
                                        </td>
                                        <td className="py-3 px-3 md:px-4 text-right text-red-500 font-semibold">
                                            {formatVND(p.total_expense)}
                                        </td>
                                        <td className={`py-3 px-3 md:px-4 text-right font-bold ${p.profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                                            {formatVND(p.profit)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. KHỐI CƠ CẤU CHI TIẾT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Phân tích Nguồn thu */}
                <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-slate-100 pb-3">
                        <i className="fa-solid fa-chart-pie text-green-500 text-base md:text-lg"></i>
                        <h3 className="text-[14px] md:text-[15px] font-bold text-slate-800">Cơ cấu Nguồn thu</h3>
                    </div>
                    <div className="flex-1">
                        {renderBreakdownList(income_breakdown, totalIncome, true)}
                    </div>
                </div>

                {/* Phân tích Chi phí */}
                <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-slate-100 pb-3">
                        <i className="fa-solid fa-chart-pie text-red-500 text-base md:text-lg"></i>
                        <h3 className="text-[14px] md:text-[15px] font-bold text-slate-800">Cơ cấu Chi phí</h3>
                    </div>
                    <div className="flex-1">
                        {renderBreakdownList(expense_breakdown, totalExpense, false)}
                    </div>
                </div>
            </div>

        </div>
    );
}