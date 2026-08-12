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

    const handlePageChange = (newPage) => {
        onPageChange?.(newPage);
        
        // Hiệu ứng cuộn mượt mà lên đầu bảng sau khi đổi trang
        setTimeout(() => {
            const tableContainer = document.getElementById('tenant-utilities-table-top');
            if (tableContainer) {
                tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 50);
    };

    return (
        <>
            {/* Thanh công cụ lọc */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    
                    {/* Lọc loại dịch vụ */}
                    <div className="relative min-w-[160px] flex-1 lg:flex-none">
                        <select
                            value={type}
                            onChange={(e) => {
                                onTypeChange(e.target.value);
                                handlePageChange(1); // Reset về trang 1 khi đổi filter
                            }}
                            className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm"
                        >
                            <option value="">Loại dịch vụ: Tất cả</option>
                            <option value="electricity">Chỉ số Điện</option>
                            <option value="water">Chỉ số Nước</option>
                        </select>
                        <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
                    </div>

                    {/* Lọc theo tháng */}
                    <div className="relative min-w-[160px] flex-1 lg:flex-none">
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => {
                                onMonthChange(e.target.value);
                                handlePageChange(1);
                            }}
                            className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand shadow-sm appearance-none"
                            title="Lọc theo kỳ chốt số"
                        />
                        <i className="fa-regular fa-calendar absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] pointer-events-none"></i>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto ml-auto">
                    <button
                        onClick={onOpenSubmitModal}
                        className="w-full lg:w-auto bg-brand text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-600/20"
                    >
                        <i className="fa-solid fa-camera text-[12px]"></i> Ghi chỉ số mới
                    </button>
                </div>
            </div>

            {/* Bảng Dữ Liệu (Mobile + PC) */}
            <div id="tenant-utilities-table-top" className="bg-transparent lg:bg-white border-none lg:border lg:border-slate-200 lg:rounded-xl shadow-none lg:shadow-sm lg:overflow-hidden flex flex-col flex-1">
                
                {/* --- GIAO DIỆN MOBILE --- */}
                <div className="lg:hidden flex flex-col gap-3 pb-4">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-white border border-slate-200 rounded-xl animate-pulse"></div>)
                    ) : readings.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-[13px]">Chưa có dữ liệu chốt số.</div>
                    ) : (
                        readings.map((reading) => {
                            const conf = getTypeConfig(reading.type);
                            return (
                                <div key={reading.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                        <span className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md flex items-center gap-1.5 ${conf.className}`}>
                                            <i className={`fa-solid ${conf.icon}`}></i> {conf.label}
                                        </span>
                                        <span className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                                            <i className="fa-regular fa-calendar"></i> {formatDate(reading.reading_date)}
                                        </span>
                                    </div>
                                    <div className="p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="text-center flex-1">
                                                <span className="block text-[11px] text-slate-500 mb-0.5">Số cũ</span>
                                                <span className="font-medium text-slate-600 text-[14px]">{reading.previous_reading}</span>
                                            </div>
                                            <i className="fa-solid fa-arrow-right text-slate-300 text-[11px] px-2"></i>
                                            <div className="text-center flex-1">
                                                <span className="block text-[11px] text-slate-500 mb-0.5">Số mới</span>
                                                <span className="font-bold text-slate-800 text-[14px]">{reading.current_reading}</span>
                                            </div>
                                            <div className="h-8 w-px bg-slate-200 mx-2"></div>
                                            <div className="text-center flex-1">
                                                <span className="block text-[11px] text-slate-500 mb-0.5">Tiêu thụ</span>
                                                <span className="font-bold text-brand text-[14px]">{reading.usage} <span className="text-[10px] font-normal">{conf.unit}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
                                        <button onClick={() => onOpenViewModal(reading)} className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[12px] font-medium active:bg-slate-100 flex justify-center items-center gap-2 shadow-sm">
                                            <i className="fa-regular fa-eye"></i> Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* --- GIAO DIỆN DESKTOP --- */}
                <div className="hidden lg:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                        <thead className="bg-white border-b border-slate-200">
                            <tr>
                                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 w-[150px]">Loại Dịch Vụ</th>
                                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Ngày chốt</th>
                                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Số cũ</th>
                                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Số mới</th>
                                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Sử dụng</th>
                                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-center">Tình trạng</th>
                                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-center w-[100px]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px]">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-50 animate-pulse">
                                        <td colSpan={7} className="py-3 px-4"><div className="h-10 bg-slate-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : readings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-slate-400">Chưa có dữ liệu chốt số.</td>
                                </tr>
                            ) : (
                                readings.map((r, index) => {
                                    const conf = getTypeConfig(r.type);
                                    return (
                                        <tr key={r.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md flex items-center gap-1.5 w-fit ${conf.className}`}>
                                                    <i className={`fa-solid ${conf.icon}`}></i> {conf.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-700 font-medium">{formatDate(r.reading_date)}</td>
                                            <td className="py-3 px-4 text-right text-slate-500 font-medium">{r.previous_reading}</td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-800">{r.current_reading}</td>
                                            <td className="py-3 px-4 text-right font-bold text-brand">{r.usage} <span className="text-[11px] text-slate-400 font-normal">{conf.unit}</span></td>
                                            <td className="py-3 px-4 text-center">
                                                {r.is_invoiced ? (
                                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">Đã lập HĐ</span>
                                                ) : (
                                                    <span className="text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-md">Sẵn sàng</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center">
                                                    <button 
                                                        onClick={() => onOpenViewModal(r)} 
                                                        className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-green-50 flex items-center justify-center bg-white transition-colors shadow-sm"
                                                        title="Xem chi tiết"
                                                    >
                                                        <i className="fa-regular fa-eye"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PHÂN TRANG (PAGINATION) CAO CẤP --- */}
                <div className="bg-white border border-slate-200 lg:border-x-0 lg:border-b-0 lg:border-t lg:border-slate-100 rounded-xl lg:rounded-b-xl lg:rounded-t-none p-3 lg:p-4 flex items-center justify-between mt-auto">
                    <span className="text-[12px] lg:text-[13px] text-slate-500">
                        {pagination && pagination.total > 0 ? (
                            <>
                                <span className="lg:hidden">
                                    Trang {pagination.current_page || 1}/{pagination.last_page || 1} · {pagination.total || 0} bản ghi
                                </span>
                                <span className="hidden lg:inline">
                                    Hiển thị {pagination.from || 0} - {pagination.to || 0} trong tổng số {pagination.total || 0} bản ghi
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="lg:hidden">0 bản ghi</span>
                                <span className="hidden lg:inline">Chưa có dữ liệu</span>
                            </>
                        )}
                    </span>

                    {pagination?.last_page > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => handlePageChange(Math.max(1, page - 1))}
                                className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <i className="fa-solid fa-angle-left text-[12px] lg:text-[11px]"></i>
                            </button>

                            {/* MOBILE UI: Chỉ hiện số trang hiện tại */}
                            <button type="button" className="flex lg:hidden w-8 h-8 rounded-lg items-center justify-center bg-brand text-white font-medium text-[13px] shadow-sm">
                                {page}
                            </button>

                            {/* DESKTOP UI: Dãy số */}
                            <div className="hidden lg:flex gap-1">
                                {Array.from({ length: pagination.last_page }).map((_, index) => {
                                    const pageNumber = index + 1;
                                    return (
                                        <button
                                            key={pageNumber}
                                            type="button"
                                            onClick={() => handlePageChange(pageNumber)}
                                            className={`flex h-7 w-7 items-center justify-center rounded text-[12px] font-medium transition-colors ${pageNumber === page
                                                ? "bg-brand text-white shadow-sm border-brand"
                                                : "border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                disabled={page >= pagination.last_page}
                                onClick={() => handlePageChange(page + 1)}
                                className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <i className="fa-solid fa-angle-right text-[12px] lg:text-[11px]"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}