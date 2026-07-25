import React from "react";

const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("vi-VN");
};

const getTypeConfig = (type) => {
    if (type === "electricity") return { label: "Điện", icon: "fa-bolt", className: "bg-amber-50 text-amber-600 border-amber-200", unit: "kWh" };
    return { label: "Nước", icon: "fa-droplet", className: "bg-blue-50 text-blue-500 border-blue-200", unit: "m³" };
};

export default function TenantUtilitiesTable({
    readings, isLoading, pagination, page, onPageChange,
    type, onTypeChange, month, onMonthChange,
    onOpenSubmitModal, onOpenViewModal
}) {
    return (
        <>
            {/* Thanh công cụ lọc */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <select
                        value={type}
                        onChange={(e) => onTypeChange(e.target.value)}
                        className="flex-1 lg:flex-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand"
                    >
                        <option value="">Loại dịch vụ: Tất cả</option>
                        <option value="electricity">Chỉ số Điện</option>
                        <option value="water">Chỉ số Nước</option>
                    </select>

                    <input
                        type="month"
                        value={month}
                        onChange={(e) => onMonthChange(e.target.value)}
                        className="flex-1 lg:flex-none px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand"
                        title="Lọc theo kỳ chốt số"
                    />
                </div>

                <button
                    onClick={onOpenSubmitModal}
                    className="w-full lg:w-auto bg-brand text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    <i className="fa-solid fa-camera"></i> Ghi chỉ số mới
                </button>
            </div>

            {/* Bảng Dữ Liệu (Mobile + PC) */}
            <div className="bg-transparent lg:bg-white border-none lg:border lg:border-slate-200 lg:rounded-xl shadow-none lg:shadow-sm lg:overflow-hidden flex flex-col flex-1">
                
                {/* MOBILE VIEW */}
                <div className="lg:hidden flex flex-col gap-3 pb-4">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-36 bg-white border border-slate-200 rounded-xl animate-pulse"></div>)
                    ) : readings.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-[13px]">Chưa có dữ liệu chốt số.</div>
                    ) : (
                        readings.map((reading) => {
                            const conf = getTypeConfig(reading.type);
                            return (
                                <div key={reading.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col p-4">
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                                        <span className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md flex items-center gap-1.5 ${conf.className}`}>
                                            <i className={`fa-solid ${conf.icon}`}></i> {conf.label}
                                        </span>
                                        <span className="text-[12px] font-medium text-slate-600">{formatDate(reading.reading_date)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                                        <div className="text-center flex-1">
                                            <span className="block text-[10px] text-slate-500 mb-0.5">Số cũ</span>
                                            <span className="font-medium text-slate-600 text-[13px]">{reading.previous_reading}</span>
                                        </div>
                                        <i className="fa-solid fa-arrow-right text-slate-300 text-[10px] px-1"></i>
                                        <div className="text-center flex-1">
                                            <span className="block text-[10px] text-slate-500 mb-0.5">Số mới</span>
                                            <span className="font-bold text-slate-800 text-[13px]">{reading.current_reading}</span>
                                        </div>
                                        <div className="h-6 w-px bg-slate-200 mx-2"></div>
                                        <div className="text-center flex-1">
                                            <span className="block text-[10px] text-slate-500 mb-0.5">Tiêu thụ</span>
                                            <span className="font-bold text-brand text-[13px]">{reading.usage} <span className="text-[10px] font-normal">{conf.unit}</span></span>
                                        </div>
                                    </div>
                                    <button onClick={() => onOpenViewModal(reading)} className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-semibold hover:bg-slate-200 flex justify-center items-center gap-2">
                                        <i className="fa-regular fa-eye"></i> Xem chi tiết
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* DESKTOP VIEW */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600">Loại Dịch Vụ</th>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600">Ngày chốt</th>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600 text-right">Số cũ</th>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600 text-right">Số mới</th>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600 text-right">Sử dụng</th>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600 text-center">Tình trạng</th>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px]">
                            {isLoading ? (
                                <tr><td colSpan={7} className="py-10 text-center text-slate-400">Đang tải...</td></tr>
                            ) : readings.length === 0 ? (
                                <tr><td colSpan={7} className="py-10 text-center text-slate-400">Chưa có dữ liệu</td></tr>
                            ) : (
                                readings.map((r) => {
                                    const conf = getTypeConfig(r.type);
                                    return (
                                        <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md flex items-center gap-1.5 w-fit ${conf.className}`}>
                                                    <i className={`fa-solid ${conf.icon}`}></i> {conf.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 font-medium">{formatDate(r.reading_date)}</td>
                                            <td className="py-3 px-4 text-right text-slate-500">{r.previous_reading}</td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-800">{r.current_reading}</td>
                                            <td className="py-3 px-4 text-right font-bold text-brand">{r.usage} <span className="text-[11px] text-slate-400 font-normal">{conf.unit}</span></td>
                                            <td className="py-3 px-4 text-center">
                                                {r.is_invoiced ? (
                                                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Đã lập HĐ</span>
                                                ) : (
                                                    <span className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Sẵn sàng</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button onClick={() => onOpenViewModal(r)} className="w-8 h-8 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-brand hover:border-brand shadow-sm">
                                                    <i className="fa-regular fa-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t bg-white flex justify-between text-[12px] text-slate-500 items-center">
                    <span>Trang {page} / {pagination?.last_page || 1}</span>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50">Trước</button>
                        <button disabled={!pagination?.next_page_url} onClick={() => onPageChange(page + 1)} className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50">Sau</button>
                    </div>
                </div>
            </div>
        </>
    );
}