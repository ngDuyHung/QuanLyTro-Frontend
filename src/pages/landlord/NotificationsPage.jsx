import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import notificationService from "@/services/notificationService";
import NotificationsTable from "@/components/notifications/NotificationsTable";
import NotificationFormModal from "@/components/notifications/NotificationFormModal";
import ViewNotificationModal from "@/components/notifications/ViewNotificationModal";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // --- THÊM STATE QUẢN LÝ TAB ---
    const [activeTab, setActiveTab] = useState("manual"); // 'manual' hoặc 'system'

    const [page, setPage] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterTargetType, setFilterTargetType] = useState("");

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingNotification, setEditingNotification] = useState(null);
    const [viewingNotification, setViewingNotification] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchText.trim());
            setPage(1); 
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText]);

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await notificationService.getAll({
                page,
                per_page: 15,
                search: search || undefined,
                status: filterStatus || undefined,
                target_type: filterTargetType || undefined,
                is_system: activeTab === "system" // Truyền param xuống Backend
            });

            setNotifications(response.data.data || []);
            setPagination(response.data.meta || null);
        } catch (error) {
            toast.error("Không thể tải danh sách thông báo.");
        } finally {
            setIsLoading(false);
        }
    }, [page, search, filterStatus, filterTargetType, activeTab]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleOpenAddModal = () => {
        setEditingNotification(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (notification) => {
        setEditingNotification(notification);
        setIsFormModalOpen(true);
    };

    const handleOpenViewModal = (notification) => {
        setViewingNotification(notification);
        setIsViewModalOpen(true);
    };

    const handleDeleteNotification = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa thông báo này? Khách thuê sẽ không thể xem lại được nữa.")) return;
        try {
            await notificationService.delete(id);
            toast.success("Đã xóa thông báo thành công.");
            fetchNotifications();
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể xóa thông báo.");
        }
    };

    const handleSaveNotification = async (formData) => {
        try {
            setIsLoading(true); 
            if (formData.id) {
                await notificationService.update(formData.id, formData);
                toast.success("Cập nhật thông báo thành công!");
            } else {
                await notificationService.create(formData);
                toast.success("Tạo thông báo thành công!");
            }
            setIsFormModalOpen(false);
            fetchNotifications();
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu thông báo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendPush = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn gửi lại thông báo đẩy (Web Push) tới các thiết bị của khách thuê?")) return;
        try {
            await notificationService.resendPush(id);
            toast.success("Đã gửi Web Push thành công tới các khách thuê!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể gửi thông báo đẩy.");
        }
    };

    // Hàm style cho Tab
    const tabClasses = (tab) =>
        `px-4 sm:px-6 py-3 text-[13px] sm:text-[14px] transition-colors border-b-2 -mb-[1px] whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === tab
                ? "font-bold text-brand border-brand"
                : "font-medium text-slate-500 hover:text-slate-800 border-transparent"
        }`;

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 flex flex-col h-full bg-slate-50">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Thông báo cho khách thuê</h1>
                    <p className="text-[13px] text-slate-500 mt-1">
                        Quản lý tin nhắn hệ thống và thông báo khu trọ.
                    </p>
                </div>
                {/* Ẩn nút Thêm mới nếu đang ở Tab Hệ thống */}
                {activeTab === "manual" && (
                    <button
                        onClick={handleOpenAddModal}
                        className="w-full sm:w-auto px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl sm:rounded-lg text-[13px] flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition-colors"
                    >
                        <i className="fa-solid fa-bullhorn text-[12px]"></i>
                        Tạo thông báo mới
                    </button>
                )}
            </div>

            {/* --- UI 2 TABS --- */}
            <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 mb-5">
                <button className={tabClasses("manual")} onClick={() => { setActiveTab("manual"); setPage(1); }}>
                    <i className="fa-regular fa-comment-dots"></i> Do tôi soạn
                </button>
                <button className={tabClasses("system")} onClick={() => { setActiveTab("system"); setPage(1); }}>
                    <i className="fa-solid fa-robot"></i> Hệ thống tự động
                </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                <NotificationsTable
                    notifications={notifications}
                    isLoading={isLoading}
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    searchText={searchText}
                    onSearchChange={setSearchText}
                    filterStatus={filterStatus}
                    onFilterStatusChange={(val) => { setFilterStatus(val); setPage(1); }}
                    filterTargetType={filterTargetType}
                    onFilterTargetTypeChange={(val) => { setFilterTargetType(val); setPage(1); }}
                    onEdit={handleOpenEditModal}
                    onView={handleOpenViewModal}
                    onDelete={handleDeleteNotification}
                    onResendPush={handleResendPush}
                    activeTab={activeTab} // Truyền tab hiện tại vào Table để xử lý hiển thị
                />
            </div>

            <NotificationFormModal
                open={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleSaveNotification}
                isSubmitting={isLoading} 
                initialData={editingNotification}
            />

            <ViewNotificationModal
                open={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                notification={viewingNotification}
            />
        </div>
    );
}