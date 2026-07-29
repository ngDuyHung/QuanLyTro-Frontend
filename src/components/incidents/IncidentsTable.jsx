import React, { useState } from "react";
import { toast } from "react-toastify";
import incidentService from "@/services/incidentService";

// --- Helpers Format UI ---
const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit' });
};

const getCategoryLabel = (category) => {
    const categories = {
        electrical: "Điện",
        water: "Nước",
        furniture: "Nội thất",
        security: "An ninh",
        other: "Khác",
    };
    return categories[category] || "Khác";
};

const getPriorityConfig = (priority) => {
    switch (priority) {
        case "emergency":
            return { label: "Khẩn cấp", className: "bg-red-50 text-red-600 border-red-200" };
        case "high":
            return { label: "Nghiêm trọng", className: "bg-orange-50 text-orange-600 border-orange-200" };
        case "normal":
            return { label: "Bình thường", className: "bg-blue-50 text-blue-600 border-blue-200" };
        case "low":
            return { label: "Thấp", className: "bg-slate-50 text-slate-600 border-slate-200" };
        default:
            return { label: priority, className: "bg-slate-50 text-slate-600" };
    }
};

const getStatusConfig = (status) => {
    switch (status) {
        case "pending":
            return { label: "Chờ tiếp nhận", className: "bg-amber-50 text-amber-600 border-amber-200", icon: "fa-hourglass-half" };
        case "processing":
            return { label: "Đang xử lý", className: "bg-blue-50 text-blue-600 border-blue-200", icon: "fa-screwdriver-wrench" };
        case "resolved":
            return { label: "Đã giải quyết", className: "bg-green-50 text-green-600 border-green-200", icon: "fa-circle-check" };
        case "cancelled":
            return { label: "Đã hủy", className: "bg-slate-100 text-slate-500 border-slate-200 line-through", icon: "fa-ban" };
        default:
            return { label: status, className: "bg-slate-50 text-slate-600 border-slate-200" };
    }
};

export default function IncidentsTable({
    incidents = [],
    isLoading = false,
    pagination,
    page,
    onPageChange,
    onOpenViewModal,
    onOpenResolveModal,
    refreshData,
}) {
    // Trạng thái khóa nút khi đang gọi API (tránh click đúp)
    const [isActionLoading, setIsActionLoading] = useState(false);

    // --- Các hàm xử lý nhanh gọi API trực tiếp ---
    const handleProcess = async (id) => {
        if (!window.confirm("Xác nhận tiếp nhận và bắt đầu xử lý sự cố này?")) return;
        setIsActionLoading(true);
        try {
            await incidentService.process(id);
            toast.success("Đã tiếp nhận sự cố thành công!");
            refreshData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy sự cố này không?")) return;
        setIsActionLoading(true);
        try {
            await incidentService.cancel(id);
            toast.success("Đã hủy sự cố!");
            refreshData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Hành động này không thể hoàn tác. Xác nhận xóa vĩnh viễn sự cố?")) return;
        setIsActionLoading(true);
        try {
            await incidentService.delete(id);
            toast.success("Đã xóa sự cố thành công!");
            refreshData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsActionLoading(false);
        }
    };

    // Hàm tính toán phân trang tương tự RoomTable
    const getPaginationGroup = () => {
        if (!pagination) return [];
        let start = Math.max(1, page - 1);
        let end = Math.min(pagination.last_page || 1, page + 1);

        if (end - start < 2) {
            if (start === 1) end = Math.min(pagination.last_page || 1, 3);
            else if (end === pagination.last_page) start = Math.max(1, pagination.last_page - 2);
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    // Component Nút Thao tác dùng chung cho cả Table và Mobile Card
    const ActionButtons = ({ item }) => (
        <div className="flex items-center gap-1.5 justify-end">
            {/* LUÔN HIỂN THỊ NÚT XEM CHI TIẾT */}
            <button
                onClick={() => onOpenViewModal(item)}
                className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5 transition-colors flex items-center justify-center"
                title="Xem chi tiết"
            >
                <i className="fa-solid fa-eye text-[13px]"></i>
            </button>

            {/* STATE: PENDING */}
            {item.status === 'pending' && (
                <>
                    <button
                        disabled={isActionLoading}
                        onClick={() => handleProcess(item.id)}
                        className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                        title="Bắt đầu xử lý"
                    >
                        <i className="fa-solid fa-play text-[12px]"></i>
                    </button>
                    <button
                        disabled={isActionLoading}
                        onClick={() => handleCancel(item.id)}
                        className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center"
                        title="Hủy sự cố"
                    >
                        <i className="fa-solid fa-ban text-[12px]"></i>
                    </button>
                    <button
                        disabled={isActionLoading}
                        onClick={() => handleDelete(item.id)}
                        className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                        title="Xóa vĩnh viễn"
                    >
                        <i className="fa-regular fa-trash-can text-[13px]"></i>
                    </button>
                </>
            )}

            {/* STATE: PROCESSING */}
            {item.status === 'processing' && (
                <>
                    <button
                        disabled={isActionLoading}
                        onClick={() => onOpenResolveModal(item)}
                        className="w-8 h-8 rounded border border-green-500 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-colors flex items-center justify-center shadow-sm"
                        title="Nghiệm thu / Chốt sự cố"
                    >
                        <i className="fa-solid fa-check-double text-[13px]"></i>
                    </button>
                    <button
                        disabled={isActionLoading}
                        onClick={() => handleCancel(item.id)}
                        className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center"
                        title="Hủy sự cố"
                    >
                        <i className="fa-solid fa-ban text-[12px]"></i>
                    </button>
                </>
            )}
        </div>
    );

    
  const handlePageChange = (newPage) => {
    onPageChange?.(newPage);

    setTimeout(() => {
      // Tìm khối chứa danh sách thông qua ID để cuộn lên
      const tableContainer = document.getElementById('incident-table-top');

      if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Dự phòng
      }
    }, 50);
  };

    return (
        <div className="h-full flex flex-col bg-white">
            <div id="incident-table-top" className="flex-1 overflow-auto custom-scrollbar">

                {/* --- 1. GIAO DIỆN MOBILE (Dạng Card) --- */}
                <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/50">
                    {isLoading ? (
                        <div className="col-span-full py-10 text-center flex flex-col items-center text-slate-500">
                            <i className="fa-solid fa-spinner fa-spin text-2xl text-brand mb-2"></i>
                            <span className="text-[13px]">Đang tải dữ liệu...</span>
                        </div>
                    ) : incidents.length === 0 ? (
                        <div className="col-span-full py-10 text-center flex flex-col items-center text-slate-400">
                            <i className="fa-solid fa-clipboard-check text-4xl mb-3 text-slate-300"></i>
                            <p className="text-[14px]">Chưa có sự cố nào.</p>
                        </div>
                    ) : (
                        incidents.map((item) => {
                            const statusConfig = getStatusConfig(item.status);
                            const priorityConfig = getPriorityConfig(item.priority);

                            return (
                                <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[14px] font-bold text-slate-800 leading-snug line-clamp-2">
                                                {item.title}
                                            </span>
                                            <div className="text-[12px] text-slate-500 flex items-center gap-2">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">
                                                    {getCategoryLabel(item.category)}
                                                </span>
                                                <span>•</span>
                                                <span>{formatDate(item.created_at)}</span>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border ${statusConfig.className}`}>
                                            <i className={`fa-solid ${statusConfig.icon}`}></i>
                                            {statusConfig.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[13px]">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700">
                                                <i className="fa-solid fa-location-dot text-brand/70 mr-1.5"></i>
                                                {item.room?.name || <span className="italic">Khu vực chung</span>}
                                            </span>
                                            <span className="text-slate-500 text-[12px] ml-4 mt-0.5">
                                                {item.property?.name}
                                            </span>
                                        </div>
                                        <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-medium border ${priorityConfig.className}`}>
                                            {priorityConfig.label}
                                        </span>
                                    </div>

                                    <div className="mt-1 pt-3 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[11px] text-slate-400 font-medium tracking-wider">THAO TÁC</span>
                                        <ActionButtons item={item} />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* --- 2. GIAO DIỆN DESKTOP (Dạng Table) --- */}
                <table className="hidden md:table w-full text-left border-collapse min-w-[900px]">
                    <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                        <tr>
                            <th className="py-3 px-4 text-[12px] font-semibold text-slate-600 uppercase tracking-wider w-[50px] text-center">ID</th>
                            <th className="py-3 px-4 text-[12px] font-semibold text-slate-600 uppercase tracking-wider min-w-[250px]">Thông tin sự cố</th>
                            <th className="py-3 px-4 text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Vị trí</th>
                            <th className="py-3 px-4 text-[12px] font-semibold text-slate-600 uppercase tracking-wider text-center">Mức độ</th>
                            <th className="py-3 px-4 text-[12px] font-semibold text-slate-600 uppercase tracking-wider text-center">Trạng thái</th>
                            <th className="py-3 px-4 text-[12px] font-semibold text-slate-600 uppercase tracking-wider w-[180px] text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="py-10 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <i className="fa-solid fa-spinner fa-spin text-2xl text-brand mb-2"></i>
                                        <span className="text-[13px]">Đang tải dữ liệu...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : incidents.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-10 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <i className="fa-solid fa-clipboard-check text-4xl mb-3 text-slate-300"></i>
                                        <p className="text-[14px]">Chưa có sự cố nào.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            incidents.map((item) => {
                                const statusConfig = getStatusConfig(item.status);
                                const priorityConfig = getPriorityConfig(item.priority);

                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-3 px-4 text-[13px] text-slate-500 text-center font-medium">
                                            #{item.id}
                                        </td>

                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-semibold text-slate-800 line-clamp-1">
                                                    {item.title}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1 text-[12px] text-slate-500">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                                        {getCategoryLabel(item.category)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{formatDate(item.created_at)}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3 px-4">
                                            <div className="flex flex-col text-[13px]">
                                                <span className="font-medium text-slate-700">
                                                    {item.room?.name || <span className="italic text-slate-400">Khu vực chung</span>}
                                                </span>
                                                <span className="text-slate-500 text-[12px] mt-0.5">
                                                    {item.property?.name}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-medium border ${priorityConfig.className}`}>
                                                {priorityConfig.label}
                                            </span>
                                        </td>

                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${statusConfig.className}`}>
                                                <i className={`fa-solid ${statusConfig.icon}`}></i>
                                                {statusConfig.label}
                                            </span>
                                        </td>

                                        <td className="py-3 px-4">
                                            <ActionButtons item={item} />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* PHÂN TRANG ĐỒNG BỘ UI */}
            {pagination && (
                <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto shrink-0">
                    <span className="text-[12px] text-slate-500 font-medium">
                        Hiển thị {incidents.length} / {pagination.total || 0} bản ghi
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => onPageChange?.(page - 1)}
                            className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <i className="fa-solid fa-angle-left text-[12px] lg:text-[11px]"></i>
                        </button>

                        <div className="flex items-center gap-1">
                            {getPaginationGroup().map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    onClick={() => onPageChange?.(pageNumber)}
                                    className={`flex h-8 w-8 lg:h-7 lg:w-7 items-center justify-center rounded-lg lg:rounded text-[13px] lg:text-[12px] font-medium transition-colors ${pageNumber === page
                                            ? "bg-brand text-white shadow-sm"
                                            : "border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
                                        }`}
                                >
                                    {pageNumber}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            disabled={page >= (pagination.last_page || 1)}
                            onClick={() => onPageChange?.(page + 1)}
                            className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <i className="fa-solid fa-angle-right text-[12px] lg:text-[11px]"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}