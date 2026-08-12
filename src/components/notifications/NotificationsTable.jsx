import React from "react";

const getTypeConfig = (type) => {
    switch (type) {
        case "warning": return { color: "text-amber-500 bg-amber-50 border-amber-200", icon: "fa-triangle-exclamation", label: "Cảnh báo" };
        case "billing": return { color: "text-red-500 bg-red-50 border-red-200", icon: "fa-file-invoice-dollar", label: "Tài chính" };
        case "system": return { color: "text-purple-600 bg-purple-50 border-purple-200", icon: "fa-robot", label: "Auto Bot" };
        default: return { color: "text-blue-500 bg-blue-50 border-blue-200", icon: "fa-circle-info", label: "Thông tin" };
    }
};

const getStatusConfig = (status) => {
    return status === "published"
        ? { color: "text-green-600 bg-green-50 border-green-200", label: "Đã đăng" }
        : { color: "text-slate-500 bg-slate-100 border-slate-200", label: "Bản nháp" };
};

const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN", {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export default function NotificationsTable({
    notifications = [],
    isLoading,
    pagination,
    page,
    onPageChange,
    searchText,
    onSearchChange,
    filterStatus,
    onFilterStatusChange,
    filterTargetType,
    onFilterTargetTypeChange,
    onEdit,
    onView,
    onDelete,
    onResendPush,
    activeTab, // Nhận prop activeTab
}) {
    return (
        <>
            {/* Thanh công cụ lọc */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-3 w-full">
                    {/* Search */}
                    <div className="relative w-full lg:w-[300px]">
                        <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Tìm theo tiêu đề..."
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-sm text-slate-700"
                        />
                    </div>

                    {/* Filter Trạng thái (Chỉ hiện nếu ở tab manual) */}
                    {activeTab === "manual" && (
                        <div className="relative flex-1 sm:flex-none sm:min-w-[160px]">
                            <select
                                value={filterStatus}
                                onChange={(e) => onFilterStatusChange(e.target.value)}
                                className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="">Trạng thái: Tất cả</option>
                                <option value="published">Đã đăng</option>
                                <option value="draft">Bản nháp</option>
                            </select>
                            <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
                        </div>
                    )}

                    {/* Filter Phạm vi */}
                    <div className="relative flex-1 sm:flex-none sm:min-w-[160px]">
                        <select
                            value={filterTargetType}
                            onChange={(e) => onFilterTargetTypeChange(e.target.value)}
                            className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm"
                        >
                            <option value="">Phạm vi: Tất cả</option>
                            <option value="all">Toàn hệ thống</option>
                            <option value="property">Theo khu nhà</option>
                            <option value="room">Theo phòng</option>
                        </select>
                        <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
                    </div>
                </div>
            </div>

            <div className="bg-transparent lg:bg-white border-none lg:border lg:border-slate-200 lg:rounded-xl shadow-none lg:shadow-sm lg:overflow-hidden flex flex-col flex-1">
                
                {/* --- GIAO DIỆN MOBILE --- */}
                <div className="lg:hidden flex flex-col gap-3 pb-4">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse"></div>
                        ))
                    ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-[13px]">
                            {activeTab === "manual" ? "Không tìm thấy thông báo nào." : "Chưa có thông báo tự động nào được sinh ra."}
                        </div>
                    ) : (
                        notifications.map((item) => {
                            const typeUi = getTypeConfig(item.type);
                            const statusUi = getStatusConfig(item.status);
                            const isSystem = item.type === 'system';

                            return (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                        <div className="flex items-start gap-2.5 overflow-hidden">
                                            <div className="mt-0.5 shrink-0">
                                                {item.is_pinned && !isSystem ? (
                                                    <i className="fa-solid fa-thumbtack text-red-500 -rotate-45" title="Đã ghim"></i>
                                                ) : (
                                                    <i className={`fa-solid ${typeUi.icon} ${typeUi.color.split(' ')[0]}`}></i>
                                                )}
                                            </div>
                                            <span className="font-bold text-slate-800 text-[14px] leading-snug line-clamp-2">
                                                {item.title}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] text-slate-500 mb-0.5">Phân loại & Trạng thái</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`px-2 py-0.5 border text-[10px] font-semibold rounded ${typeUi.color}`}>
                                                        {item.type_label || typeUi.label}
                                                    </span>
                                                    <span className={`px-2 py-0.5 border text-[10px] font-semibold rounded ${statusUi.color}`}>
                                                        {statusUi.label}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end shrink-0 text-right">
                                                <span className="text-[11px] text-slate-500 mb-0.5">Phạm vi</span>
                                                <span className="font-semibold text-slate-800 text-[12px]">
                                                    {item.target_type === "all" ? "Toàn hệ thống" : item.target_type_label}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full h-px bg-slate-50"></div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] text-slate-500">
                                                Đăng lúc: <span className="text-slate-700 font-medium">{formatDate(item.created_at)}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
                                        {item.status === 'published' && (
                                            <button
                                                type="button"
                                                onClick={() => onResendPush(item.id)}
                                                className="w-11 flex shrink-0 items-center justify-center border border-brand/20 rounded-lg bg-brand/5 text-[13px] text-brand active:bg-brand/10 shadow-sm"
                                                title="Gửi lại thông báo đẩy"
                                            >
                                                <i className="fa-regular fa-bell"></i>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => onView(item)}
                                            className="flex-1 py-2 border border-slate-200 rounded-lg bg-white text-[12px] font-semibold text-slate-600 active:bg-slate-100 flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                            <i className="fa-regular fa-eye text-blue-500"></i> Xem
                                        </button>

                                        {/* Ẩn nút Sửa nếu là hệ thống */}
                                        {!isSystem && (
                                            <button
                                                type="button"
                                                onClick={() => onEdit(item)}
                                                className="flex-1 py-2 border border-slate-200 rounded-lg bg-white text-[12px] font-semibold text-slate-600 active:bg-slate-100 flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <i className="fa-solid fa-pen text-amber-500"></i> Sửa
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => onDelete(item.id)}
                                            className="w-11 flex shrink-0 items-center justify-center border border-red-100 rounded-lg bg-white text-[13px] text-red-500 active:bg-red-50 shadow-sm"
                                        >
                                            <i className="fa-regular fa-trash-can"></i>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* --- BẢNG DỮ LIỆU PC --- */}
                <div className="hidden lg:block flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <table className="w-full border-collapse text-left min-w-[950px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[13px] font-semibold">
                                <th className="px-5 py-3.5 w-10 text-center"></th>
                                <th className="px-5 py-3.5">Tiêu đề thông báo</th>
                                <th className="px-5 py-3.5">Phân loại</th>
                                <th className="px-5 py-3.5">Phạm vi</th>
                                <th className="px-5 py-3.5">Trạng thái</th>
                                <th className="px-5 py-3.5">Ngày đăng</th>
                                <th className="px-5 py-3.5 text-center w-[160px]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] text-slate-700">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-50 animate-pulse">
                                        <td colSpan="7" className="py-3 px-5">
                                            <div className="h-10 bg-slate-100 rounded"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : notifications.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-slate-400">
                                        {activeTab === "manual" ? "Không tìm thấy thông báo nào." : "Chưa có thông báo tự động nào được sinh ra."}
                                    </td>
                                </tr>
                            ) : (
                                notifications.map((item) => {
                                    const typeUi = getTypeConfig(item.type);
                                    const statusUi = getStatusConfig(item.status);
                                    const isSystem = item.type === 'system';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                                            <td className="px-5 py-3.5 text-center">
                                                {item.is_pinned && !isSystem && <i className="fa-solid fa-thumbtack text-red-500 -rotate-45" title="Đã ghim"></i>}
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-slate-800 max-w-[300px] truncate" title={item.title}>
                                                {item.title}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-bold ${typeUi.color}`}>
                                                    <i className={`fa-solid ${typeUi.icon}`}></i> {item.type_label || typeUi.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {item.target_type === "all" ? (
                                                    <span className="text-brand font-semibold"><i className="fa-solid fa-globe mr-1"></i> Toàn hệ thống</span>
                                                ) : (
                                                    <span className="text-slate-600 font-medium"><i className="fa-solid fa-building mr-1"></i> {item.target_type_label}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2 py-1 rounded-md border text-[11px] font-bold ${statusUi.color}`}>
                                                    {statusUi.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-500 text-[12px] font-medium">
                                                {formatDate(item.created_at)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-center gap-2">
                                                    {item.status === 'published' && (
                                                        <button onClick={() => onResendPush(item.id)} className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5 flex items-center justify-center transition-colors shadow-sm" title="Gửi lại thông báo đẩy (Web Push)">
                                                            <i className="fa-regular fa-bell text-[13px]"></i>
                                                        </button>
                                                    )}
                                                    <button onClick={() => onView(item)} className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors shadow-sm" title="Xem trước nội dung">
                                                        <i className="fa-regular fa-eye text-[13px]"></i>
                                                    </button>
                                                    
                                                    {/* Ẩn nút Sửa nếu là hệ thống */}
                                                    {!isSystem && (
                                                        <button onClick={() => onEdit(item)} className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-600 hover:bg-amber-50 flex items-center justify-center transition-colors shadow-sm" title="Chỉnh sửa">
                                                            <i className="fa-solid fa-pen text-[12px]"></i>
                                                        </button>
                                                    )}
                                                    
                                                    <button onClick={() => onDelete(item.id)} className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm" title="Xóa thông báo">
                                                        <i className="fa-regular fa-trash-can text-[13px]"></i>
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
            </div>
        </>
    );
}