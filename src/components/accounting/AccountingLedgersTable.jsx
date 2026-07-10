import React from "react";

const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0";
    return Number(amount).toLocaleString("vi-VN");
};

export default function AccountingLedgersTable({
    ledgers = [],
    properties = [],
    pagination,
    page,
    onPageChange,
    isLoading = false,
    propertyId = "",
    onPropertyIdChange,
    periodYear = "",
    onPeriodYearChange,
    onView,
    onDelete,
}) {
    // Render text hiển thị kỳ chốt sổ
    const getPeriodLabel = (ledger) => {
        if (ledger.period_type === 'month') return `Tháng ${ledger.period_month}/${ledger.period_year}`;
        if (ledger.period_type === 'quarter') return `Quý /${ledger.period_year}`;
        return `Năm ${ledger.period_year}`;
    };

    return (
        <div className="bg-transparent lg:bg-white border-none lg:border lg:border-slate-200 lg:rounded-xl shadow-none lg:shadow-sm lg:overflow-hidden flex flex-col flex-1">

            {/* Bộ lọc Header (PC) */}
            <div className="hidden lg:flex items-center gap-3 p-4 border-b border-slate-100 bg-white">
                <div className="relative min-w-[200px]">
                    <select
                        value={propertyId}
                        onChange={(e) => onPropertyIdChange?.(e.target.value)}
                        className="w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer"
                    >
                        <option value="">Khu nhà: Toàn hệ thống</option>
                        {properties.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
                </div>

                <div className="relative min-w-[120px]">
                    <select
                        value={periodYear}
                        onChange={(e) => onPeriodYearChange?.(e.target.value)}
                        className="w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer"
                    >
                        <option value="">Tất cả các năm</option>
                        {[...Array(5)].map((_, i) => {
                            const year = new Date().getFullYear() - i;
                            return <option key={year} value={year}>Năm {year}</option>;
                        })}
                    </select>
                    <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
                </div>
            </div>

            {/* Mobile Filters */}
            <div className="lg:hidden flex gap-2 mb-4">
                <select value={propertyId} onChange={(e) => onPropertyIdChange?.(e.target.value)} className="flex-1 p-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none">
                    <option value="">Tất cả khu</option>
                    {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={periodYear} onChange={(e) => onPeriodYearChange?.(e.target.value)} className="w-[120px] p-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none">
                    <option value="">Mọi năm</option>
                    {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <option key={year} value={year}>{year}</option>;
                    })}
                </select>
            </div>

            {/* --- GIAO DIỆN MOBILE --- */}
            <div className="lg:hidden flex flex-col gap-3 pb-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse"></div>)
                ) : ledgers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-[13px]">
                        <i className="fa-solid fa-book text-3xl text-slate-200 mb-3 block"></i>
                        Chưa có lịch sử chốt sổ nào.
                    </div>
                ) : (
                    ledgers.map((ledger) => (
                        <div key={ledger.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <span className="font-bold text-slate-800 text-[14px]">Kỳ: {getPeriodLabel(ledger)}</span>
                                <span className="text-[11px] text-slate-500">{ledger.property_name}</span>
                            </div>
                            <div className="p-4 flex justify-between items-center bg-slate-50/50">
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-slate-500 mb-0.5">Tổng doanh thu chốt</span>
                                    <span className="font-black text-brand text-[16px]">{formatCurrency(ledger.total_revenue)} đ</span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex flex-col items-end">
                                    <span>Ngày chốt:</span>
                                    <span className="font-medium text-slate-600">{ledger.created_at?.split(' ')[0]}</span>
                                </div>
                            </div>
                            <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
                                <button onClick={() => onView?.(ledger)} className="flex-1 py-2 border border-slate-200 rounded-lg bg-white text-[12px] font-medium text-slate-600 flex items-center justify-center gap-1.5 shadow-sm">
                                    <i className="fa-solid fa-eye"></i> Xem / In
                                </button>
                                <button onClick={() => onDelete?.(ledger)} className="w-10 flex items-center justify-center border border-red-100 rounded-lg bg-white text-[12px] text-red-500 shadow-sm">
                                    <i className="fa-regular fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- GIAO DIỆN PC --- */}
            <div className="hidden lg:block overflow-x-auto min-h-0 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                            <th className="py-3.5 px-5 text-[13px] font-semibold text-slate-600 w-[180px]">Kỳ chốt sổ</th>
                            <th className="py-3.5 px-5 text-[13px] font-semibold text-slate-600">Khu nhà</th>
                            <th className="py-3.5 px-5 text-[13px] font-semibold text-slate-600">Tổng doanh thu</th>
                            <th className="py-3.5 px-5 text-[13px] font-semibold text-slate-600">Ghi chú</th>
                            <th className="py-3.5 px-5 text-[13px] font-semibold text-slate-600">Ngày chốt</th>
                            <th className="py-3.5 px-5 text-[13px] font-semibold text-slate-600 text-center w-[120px]">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="text-[13px]">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-50 animate-pulse">
                                    <td colSpan={6} className="py-3 px-5"><div className="h-10 bg-slate-100 rounded"></div></td>
                                </tr>
                            ))
                        ) : ledgers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-16 px-5 text-center text-slate-400">
                                    <div className="flex flex-col items-center">
                                        <i className="fa-solid fa-book text-4xl text-slate-200 mb-3"></i>
                                        <p className="text-[14px] font-medium text-slate-500">Chưa có lịch sử chốt sổ nào.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            ledgers.map((ledger) => (
                                <tr key={ledger.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                                    <td className="py-3 px-5 font-bold text-slate-800">
                                        {getPeriodLabel(ledger)}
                                    </td>
                                    <td className="py-3 px-5 text-slate-600">
                                        {ledger.property_name}
                                    </td>
                                    <td className="py-3 px-5 font-black text-brand text-[14px]">
                                        {formatCurrency(ledger.total_revenue)} đ
                                    </td>
                                    <td className="py-3 px-5 text-slate-500 max-w-[200px] truncate" title={ledger.note}>
                                        {ledger.note || "—"}
                                    </td>
                                    <td className="py-3 px-5 text-slate-500">
                                        {ledger.created_at}
                                    </td>
                                    <td className="py-3 px-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => onView?.(ledger)} className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-green-50 flex items-center justify-center bg-white transition-colors" title="Xem chi tiết & In">
                                                <i className="fa-solid fa-print text-[12px]"></i>
                                            </button>
                                            <button onClick={() => onDelete?.(ledger)} className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-500 hover:bg-red-50 flex items-center justify-center bg-white transition-colors" title="Hủy chốt sổ">
                                                <i className="fa-regular fa-trash-can text-[13px]"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
            <div className="px-5 py-3 border-t border-slate-200 bg-white flex justify-between items-center mt-auto shrink-0">
                <span className="text-[12px] text-slate-500">
                    Hiển thị 1 - {ledgers.length} trong tổng số {pagination?.total || ledgers.length} sổ
                </span>
                <div className="flex items-center gap-1">
                    <button disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-50">
                        <i className="fa-solid fa-angle-left text-[12px]"></i>
                    </button>
                    <button className="w-8 h-8 rounded bg-brand text-white font-medium text-[13px]">{page}</button>
                    <button disabled={!pagination?.next_page_url} onClick={() => onPageChange?.(page + 1)} className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-50">
                        <i className="fa-solid fa-angle-right text-[12px]"></i>
                    </button>
                </div>
            </div>

        </div>
    );
}