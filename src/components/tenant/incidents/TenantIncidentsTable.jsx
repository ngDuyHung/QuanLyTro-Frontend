import React from "react";

const getStatusConfig = (status) => {
    switch (status) {
        case "pending": return { label: "Chờ tiếp nhận", className: "bg-amber-50 text-amber-600 border-amber-200" };
        case "processing": return { label: "Đang xử lý", className: "bg-blue-50 text-blue-600 border-blue-200" };
        case "resolved": return { label: "Đã giải quyết", className: "bg-green-50 text-green-600 border-green-200" };
        case "cancelled": return { label: "Đã hủy", className: "bg-slate-100 text-slate-500 border-slate-200" };
        default: return { label: status, className: "bg-slate-100 text-slate-500 border-slate-200" };
    }
};

const getPriorityConfig = (priority) => {
    switch (priority) {
        case "low": return { label: "Thấp", color: "text-slate-400" };
        case "normal": return { label: "Bình thường", color: "text-blue-500" };
        case "high": return { label: "Cao", color: "text-orange-500" };
        case "emergency": return { label: "Khẩn cấp", color: "text-red-600 font-bold" };
        default: return { label: priority, color: "text-slate-500" };
    }
};

export default function TenantIncidentsTable({
    incidents, isLoading, pagination, page, onPageChange,
    status, onStatusChange, onOpenReportModal, onOpenViewModal, onOpenEditModal, onCancelIncident
}) {
    return (
        <>
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
                <div className="w-full lg:w-auto flex gap-3">
                    <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="w-full sm:w-[200px] pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand">
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ tiếp nhận</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="resolved">Đã giải quyết</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
                <button onClick={onOpenReportModal} className="w-full lg:w-auto bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-[13px] font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation"></i> Báo sự cố ngay
                </button>
            </div>

            <div className="bg-transparent lg:bg-white border-none lg:border border-slate-200 lg:rounded-xl shadow-none lg:shadow-sm lg:overflow-hidden flex flex-col flex-1">
                
                {/* MOBILE VIEW */}
                <div className="lg:hidden flex flex-col gap-3 pb-4">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse"></div>)
                    ) : incidents.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-[13px]">Không có sự cố nào.</div>
                    ) : (
                        incidents.map((inc) => {
                            const st = getStatusConfig(inc.status);
                            const prio = getPriorityConfig(inc.priority);
                            return (
                                <div key={inc.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 border text-[10px] font-bold rounded ${st.className}`}>{st.label}</span>
                                        <span className={`text-[11px] ${prio.color}`}><i className="fa-solid fa-circle text-[8px] mr-1"></i>{prio.label}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-[14px] leading-snug mb-1 line-clamp-2">{inc.title}</h3>
                                    <p className="text-[12px] text-slate-500 mb-3"><i className="fa-solid fa-tag text-slate-300 mr-1"></i> {inc.category_label}</p>
                                    
                                    <div className="flex gap-2 mt-auto border-t border-slate-100 pt-3">
                                        <button onClick={() => onOpenViewModal(inc)} className="flex-1 py-1.5 bg-slate-50 text-slate-600 rounded text-[12px] font-semibold border border-slate-200 hover:bg-slate-100"><i className="fa-regular fa-eye"></i> Xem</button>
                                        {inc.status === 'pending' && (
                                            <>
                                                <button onClick={() => onOpenEditModal(inc)} className="w-9 shrink-0 flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded hover:bg-blue-100"><i className="fa-solid fa-pen"></i></button>
                                                <button onClick={() => onCancelIncident(inc)} className="w-9 shrink-0 flex items-center justify-center bg-red-50 text-red-500 border border-red-100 rounded hover:bg-red-100"><i className="fa-solid fa-xmark"></i></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* DESKTOP VIEW */}
                <div className="hidden lg:block overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600 w-[200px]">Tiêu đề</th>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600">Loại / Ưu tiên</th>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600">Ngày báo cáo</th>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600 text-center">Trạng thái</th>
                                <th className="py-3 px-4 text-[13px] font-semibold text-slate-600 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px]">
                            {isLoading ? (
                                <tr><td colSpan={5} className="py-10 text-center text-slate-400">Đang tải...</td></tr>
                            ) : incidents.length === 0 ? (
                                <tr><td colSpan={5} className="py-10 text-center text-slate-400">Không có sự cố nào.</td></tr>
                            ) : (
                                incidents.map((inc) => {
                                    const st = getStatusConfig(inc.status);
                                    const prio = getPriorityConfig(inc.priority);
                                    return (
                                        <tr key={inc.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4 font-semibold text-slate-800 whitespace-normal line-clamp-2">{inc.title}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-slate-600 font-medium">{inc.category_label}</span>
                                                    <span className={`text-[11px] ${prio.color}`}>{prio.label}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500">{new Date(inc.created_at).toLocaleDateString("vi-VN")}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-0.5 border text-[11px] font-bold rounded ${st.className}`}>{st.label}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex justify-center gap-1.5">
                                                    <button onClick={() => onOpenViewModal(inc)} className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-brand hover:border-brand bg-white"><i className="fa-regular fa-eye"></i></button>
                                                    {inc.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => onOpenEditModal(inc)} className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-600 bg-white" title="Sửa"><i className="fa-solid fa-pen-to-square"></i></button>
                                                            <button onClick={() => onCancelIncident(inc)} className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-500 bg-white" title="Hủy"><i className="fa-solid fa-ban"></i></button>
                                                        </>
                                                    )}
                                                </div>
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