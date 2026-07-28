import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import tenantNotificationService from "@/services/tenantNotificationService";
import TenantViewNotificationModal from "@/components/tenant/notifications/TenantViewNotificationModal"; // Import Component Modal

const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const today = new Date();

    // Nếu là hôm nay thì hiện giờ phút, nếu khác ngày thì hiện ngày tháng
    if (date.toDateString() === today.toDateString()) {
        return "Hôm nay, " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString("vi-VN");
};

const getTypeConfig = (type) => {
    switch (type) {
        case 'info': return { icon: 'fa-circle-info', color: 'text-blue-500', bg: 'bg-blue-50' };
        case 'warning': return { icon: 'fa-triangle-exclamation', color: 'text-amber-500', bg: 'bg-amber-50' };
        case 'billing': return { icon: 'fa-file-invoice-dollar', color: 'text-green-500', bg: 'bg-green-50' };
        default: return { icon: 'fa-bell', color: 'text-slate-500', bg: 'bg-slate-100' };
    }
};

export default function TenantNotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);

    // Quản lý Modal
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedNotificationId, setSelectedNotificationId] = useState(null);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await tenantNotificationService.getAll({ page });
            setNotifications(res.data?.data || []);
            setPagination(res.data?.meta || null);
        } catch (error) {
            toast.error("Không tải được danh sách thông báo.");
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Handle Mở/Đóng Modal
    const handleOpenViewModal = (id) => {
        setSelectedNotificationId(id);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedNotificationId(null);
    };

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-8 flex flex-col h-full bg-slate-50">

            {/* Header */}
            <div className="mb-6 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Thông báo từ Quản lý</h1>
                    <p className="text-[13px] text-slate-500 mt-1">Cập nhật tin tức, nhắc nhở đóng phí và nội quy khu trọ.</p>
                </div>
            </div>

            {/* Khung danh sách */}
            <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                        <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-brand"></i>
                        <p className="text-[13px] font-medium">Đang tải thông báo...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <i className="fa-regular fa-bell-slash text-2xl"></i>
                        </div>
                        <p className="text-[14px] font-medium text-slate-500">Bạn chưa có thông báo nào.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2">
                        {notifications.map((item) => {
                            const conf = getTypeConfig(item.type);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleOpenViewModal(item.id)}
                                    className="group flex gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all"
                                >
                                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-lg ${conf.bg} ${conf.color}`}>
                                        <i className={`fa-solid ${conf.icon}`}></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="font-bold text-[15px] text-slate-800 truncate group-hover:text-brand transition-colors">
                                                {item.is_pinned && <i className="fa-solid fa-thumbtack text-red-500 mr-2 text-[12px] rotate-45" title="Thông báo ghim"></i>}
                                                {item.title}
                                            </h3>
                                            <span className="shrink-0 text-[11px] text-slate-400 font-medium">{formatDate(item.created_at)}</span>
                                        </div>
                                        <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed pr-4">{item.content ? item.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : "Vui lòng kiểm tra chi tiết"}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Phân trang */}
                {pagination && pagination.last_page > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-[12px] text-slate-500">
                        <span>Trang {page} / {pagination.last_page}</span>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Trước
                            </button>
                            <button
                                disabled={!pagination.next_page_url}
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Gọi Component Modal */}
            <TenantViewNotificationModal
                open={isViewModalOpen}
                notificationId={selectedNotificationId}
                onClose={handleCloseViewModal}
            />
        </div>
    );
}