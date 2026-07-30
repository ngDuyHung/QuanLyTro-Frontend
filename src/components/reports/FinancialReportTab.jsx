import React from "react";

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

// Badge hiển thị SỐ TIỀN chênh lệch tuyệt đối so với kỳ trước (không dùng %,
// vì % dễ gây hiểu nhầm khi kỳ trước = 0 hoặc quá nhỏ).
// invert=true dành cho các chỉ số mà TĂNG lại là xấu (VD: Tổng chi phí)
const ChangeBadge = ({ current, previous, invert = false }) => {
    if (previous === null || previous === undefined) return null;

    const diff = current - previous;

    // Cả 2 kỳ đều không phát sinh gì
    if (diff === 0 && previous === 0) {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded text-slate-400 bg-slate-50">
                <i className="fa-solid fa-minus text-[9px]"></i>
                Chưa có phát sinh ở cả 2 kỳ
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

    // Kỳ trước không có dữ liệu để so sánh -> ghi rõ là "phát sinh mới", tránh suy diễn %
    if (previous === 0) {
        return (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded ${colorClass}`}>
                <i className={`fa-solid ${icon} text-[9px]`}></i>
                Phát sinh mới {formatVND(Math.abs(diff))} (kỳ trước không có)
            </span>
        );
    }

    const sign = isUp ? "+" : isFlat ? "" : "-";

    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded ${colorClass}`}>
            <i className={`fa-solid ${icon} text-[9px]`}></i>
            {sign}{formatVND(Math.abs(diff))} so với kỳ trước
        </span>
    );
};

// Badge riêng cho Biên lợi nhuận: so sánh bằng ĐIỂM PHẦN TRĂM (cách chuẩn khi so sánh
// một chỉ số vốn dĩ đã là tỷ lệ %, khác với việc quy đổi doanh thu/chi phí ra %)
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
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded ${colorClass}`}>
            <i className={`fa-solid ${icon} text-[9px]`}></i>
            {sign}{Math.abs(diff)} điểm % so với kỳ trước
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
    const incomeTxCount = overview?.income_transaction_count || 0;
    const expenseTxCount = overview?.expense_transaction_count || 0;
    const avgIncomeTx = overview?.avg_income_transaction || 0;
    const avgExpenseTx = overview?.avg_expense_transaction || 0;

    const depositReceived = deposit_holding?.received || 0;
    const depositRefunded = deposit_holding?.refunded || 0;
    const hasDepositActivity = depositReceived > 0 || depositRefunded > 0;

    const previousIncome = comparison?.previous_total_income;
    const previousExpense = comparison?.previous_total_expense;
    const previousProfit = comparison?.previous_profit;

    // Biên lợi nhuận của kỳ trước, tự tính từ số liệu thô để so sánh theo điểm %
    const previousMargin = (previousIncome !== undefined && previousIncome !== null)
        ? (previousIncome > 0 ? Math.round(((previousIncome - previousExpense) / previousIncome) * 1000) / 10 : 0)
        : undefined;

    // Hàm render danh sách Breakdown với thanh phần trăm
    const renderBreakdownList = (breakdownData, total, isIncome) => {
        // Thêm || {} để chống crash nếu dữ liệu bị undefined
        const entries = Object.entries(breakdownData || {}).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-8 opacity-60">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <i className="fa-solid fa-box-open text-2xl text-slate-400"></i>
                    </div>
                    <p className="text-[13px] text-slate-500 font-medium">Chưa có dữ liệu phát sinh</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4 mt-2">
                {entries.map(([category, amount]) => {
                    const percent = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
                    const barColor = isIncome ? "bg-green-500" : "bg-red-500";
                    const label = categoryLabels[category] || category;

                    return (
                        <div key={category} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-end">
                                <span className="text-[13px] font-medium text-slate-700">{label}</span>
                                <span className="text-[13px] font-bold text-slate-800">{formatVND(amount)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${barColor}`}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                                <span className="text-[12px] font-semibold text-slate-500 w-10 text-right shrink-0">
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
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">

            {/* 1. KHỐI THẺ TỔNG QUAN (4 CARDS: Thu / Chi / Lợi nhuận / Biên lợi nhuận) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Thẻ Tổng Thu */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-lg shrink-0">
                            <i className="fa-solid fa-arrow-trend-up"></i>
                        </div>
                        <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wide">
                            Tổng doanh thu
                        </span>
                    </div>
                    <span className="text-xl lg:text-2xl font-bold text-green-600">
                        {formatVND(totalIncome)}
                    </span>
                    <ChangeBadge current={totalIncome} previous={previousIncome} invert={false} />
                </div>

                {/* Thẻ Tổng Chi */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-lg shrink-0">
                            <i className="fa-solid fa-arrow-trend-down"></i>
                        </div>
                        <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wide">
                            Tổng chi phí
                        </span>
                    </div>
                    <span className="text-xl lg:text-2xl font-bold text-red-500">
                        {formatVND(totalExpense)}
                    </span>
                    <ChangeBadge current={totalExpense} previous={previousExpense} invert={true} />
                </div>

                {/* Thẻ Lợi Nhuận */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 ${profit >= 0 ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                            <i className="fa-solid fa-wallet"></i>
                        </div>
                        <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wide">
                            Lợi nhuận gộp
                        </span>
                    </div>
                    <span className={`text-xl lg:text-2xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                        {formatVND(profit)}
                    </span>
                    <ChangeBadge current={profit} previous={previousProfit} invert={false} />
                </div>

                {/* Thẻ Biên Lợi Nhuận (Profit Margin) */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-lg shrink-0">
                            <i className="fa-solid fa-percent"></i>
                        </div>
                        <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wide">
                            Biên lợi nhuận
                        </span>
                    </div>
                    <span className="text-xl lg:text-2xl font-bold text-purple-600">
                        {profitMargin}%
                    </span>
                    <MarginChangeBadge currentMargin={profitMargin} previousMargin={previousMargin} />
                    <span className="text-[11px] text-slate-400 -mt-1">
                        Cứ 100đ thu về thì lãi {profitMargin}đ
                    </span>
                </div>
            </div>

            {/* 1.5 DẢI THỐNG KÊ HOẠT ĐỘNG GIAO DỊCH */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-3.5 text-[13px] text-slate-600">
                {/* <div className="flex items-center gap-2">
                    <i className="fa-solid fa-receipt text-green-500"></i>
                    <span><span className="font-bold text-slate-800">{incomeTxCount}</span> phiếu thu</span>
                    {avgIncomeTx > 0 && (
                        <span className="text-slate-400">· TB {formatVND(avgIncomeTx)}/phiếu</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-file-invoice-dollar text-red-500"></i>
                    <span><span className="font-bold text-slate-800">{expenseTxCount}</span> phiếu chi</span>
                    {avgExpenseTx > 0 && (
                        <span className="text-slate-400">· TB {formatVND(avgExpenseTx)}/phiếu</span>
                    )}
                </div> */}
            </div>

            {/* 1.8 KHỐI TIỀN GIỮ HỘ (CỌC) - Tách riêng khỏi lợi nhuận để không gây nhầm lẫn */}
            {hasDepositActivity && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg shrink-0">
                        <i className="fa-solid fa-hand-holding-dollar"></i>
                    </div>
                    <div className="flex-1">
                        <p className="text-[13px] font-bold text-amber-800 mb-1">
                            Tiền cọc đang giữ hộ khách (không tính vào lợi nhuận)
                        </p>
                        <p className="text-[12px] text-amber-700 leading-relaxed">
                            Đã thu <span className="font-bold">{formatVND(depositReceived)}</span> tiền cọc giữ chỗ/thế chân trong kỳ,
                            đã hoàn trả <span className="font-bold">{formatVND(depositRefunded)}</span>.
                            Đây là khoản tiền tạm giữ hộ khách thuê, không phải doanh thu của chủ trọ nên không được cộng vào Lợi nhuận gộp phía trên.
                        </p>
                    </div>
                </div>
            )}

            {/* 2. DOANH THU THEO TỪNG KHU NHÀ (chỉ hiện khi xem "Tất cả khu nhà" và có > 1 khu) */}
            {property_breakdown.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-[15px]">
                            <i className="fa-solid fa-building-user text-blue-500"></i>
                            Hiệu quả theo từng khu nhà
                        </div>
                        <span className="text-[12px] text-slate-500 font-medium">
                            {property_breakdown.length} khu nhà · xếp theo lợi nhuận
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 text-[12px] text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4 font-bold border-b border-slate-200">Khu nhà</th>
                                    <th className="py-3 px-4 font-bold border-b border-slate-200 text-right">Doanh thu</th>
                                    <th className="py-3 px-4 font-bold border-b border-slate-200 text-right">Chi phí</th>
                                    <th className="py-3 px-4 font-bold border-b border-slate-200 text-right">Lợi nhuận</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] text-slate-700">
                                {property_breakdown.map((p) => (
                                    <tr key={p.property_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4 font-bold text-slate-800">{p.property_name}</td>
                                        <td className="py-3 px-4 text-right text-green-600 font-semibold">
                                            {formatVND(p.total_income)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-red-500 font-semibold">
                                            {formatVND(p.total_expense)}
                                        </td>
                                        <td className={`py-3 px-4 text-right font-bold ${p.profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phân tích Nguồn thu */}
                <div className="bg-white rounded-xl p-5 md:p-6 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                        <i className="fa-solid fa-chart-pie text-green-500 text-lg"></i>
                        <h3 className="text-[15px] font-bold text-slate-800">Cơ cấu Nguồn thu</h3>
                    </div>
                    <div className="flex-1">
                        {renderBreakdownList(income_breakdown, totalIncome, true)}
                    </div>
                </div>

                {/* Phân tích Chi phí */}
                <div className="bg-white rounded-xl p-5 md:p-6 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                        <i className="fa-solid fa-chart-pie text-red-500 text-lg"></i>
                        <h3 className="text-[15px] font-bold text-slate-800">Cơ cấu Chi phí</h3>
                    </div>
                    <div className="flex-1">
                        {renderBreakdownList(expense_breakdown, totalExpense, false)}
                    </div>
                </div>
            </div>

        </div>
    );
}