import React from "react";

// Hàm format tiền tệ VNĐ
const formatVND = (amount) => {
    return Number(amount || 0).toLocaleString("vi-VN") + " đ";
};

export default function DebtReportTab({ data }) {
    if (!data) return null;

    // Lấy dữ liệu từ backend trả về[cite: 4]
    const { aging = {}, top_debtors = [] } = data;

    const totalDebt = aging.total_debt || 0;
    const inTerm = aging.in_term || 0;
    const overdue1_15 = aging.overdue_1_15 || 0;
    const overdueOver15 = aging.overdue_over_15 || 0;

    return (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">

            {/* 1. KHỐI TỔNG QUAN CÔNG NỢ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-[12px] text-slate-500 font-semibold mb-1 uppercase">
                        Tổng công nợ
                    </span>
                    <span className="text-lg lg:text-xl font-bold text-red-600">
                        {formatVND(totalDebt)}
                    </span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-[12px] text-slate-500 font-semibold mb-1 uppercase">
                        Trong hạn (Chưa tới hạn thu)
                    </span>
                    <span className="text-lg lg:text-xl font-bold text-blue-600">
                        {formatVND(inTerm)}
                    </span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-[12px] text-slate-500 font-semibold mb-1 uppercase">
                        Quá hạn (1 - 15 ngày)
                    </span>
                    <span className="text-lg lg:text-xl font-bold text-orange-500">
                        {formatVND(overdue1_15)}
                    </span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-red-500/30 bg-red-500/5 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-red-500/10 text-6xl">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <span className="text-[12px] text-red-600 font-bold mb-1 uppercase z-10">
            Quá hạn  (trên 15 ngày)
                    </span>
                    <span className="text-xl lg:text-2xl font-bold text-red-600 z-10">
                        {formatVND(overdueOver15)}
                    </span>
                </div>
            </div>

            {/* 2. BẢNG TOP KHÁCH NỢ NHIỀU NHẤT */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-[15px]">
                        <i className="fa-solid fa-users-slash text-red-500"></i>
                        Danh sách phòng đang nợ
                    </div>
                    <span className="text-[12px] text-slate-500 font-medium">
                        {top_debtors.length} phòng
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 text-[12px] text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4 font-bold border-b border-slate-200">Phòng / Khu nhà</th>
                                <th className="py-3 px-4 font-bold border-b border-slate-200">Khách thuê đại diện</th>
                                <th className="py-3 px-4 font-bold border-b border-slate-200 text-center">Số HĐ chưa thanh toán</th>
                                <th className="py-3 px-4 font-bold border-b border-slate-200 text-right">Tổng nợ</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] text-slate-700">
                            {top_debtors.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-10 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                                                <i className="fa-solid fa-shield-check text-2xl text-green-500"></i>
                                            </div>
                                            <p className="font-medium text-slate-700">Tuyệt vời!</p>
                                            <p className="text-[12px] mt-1">Hiện tại không có phòng nào đang nợ tiền.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                top_debtors.map((debtor, index) => (
                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4">
                                            {/* Dữ liệu phòng và khu nhà[cite: 4] */}
                                            <div className="font-bold text-slate-800">{debtor.room_name}</div>
                                            <div className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                <i className="fa-solid fa-building"></i> {debtor.property_name}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {/* Thông tin liên hệ khách thuê[cite: 4] */}
                                            <div className="font-medium text-slate-700">{debtor.tenant_name}</div>
                                            <div className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                <i className="fa-solid fa-phone"></i> {debtor.tenant_phone}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center font-semibold text-slate-600">
                                            {/* Số lượng hóa đơn nợ[cite: 4] */}
                                            <span className="bg-slate-100 px-2 py-1 rounded-md text-[12px]">
                                                {debtor.invoice_count} hóa đơn
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-red-500 text-[14px]">
                                            {/* Số tiền nợ[cite: 4] */}
                                            {formatVND(debtor.debt_amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}