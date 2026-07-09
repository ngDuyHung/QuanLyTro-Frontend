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

    // --- Filter States ---
    const [page, setPage] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterTargetType, setFilterTargetType] = useState("");

    // --- Modal States ---
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingNotification, setEditingNotification] = useState(null);
    const [viewingNotification, setViewingNotification] = useState(null);

    // Debounce cho thanh tìm kiếm
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchText.trim());
            setPage(1); // Reset về trang 1 khi search
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
            });

            setNotifications(response.data.data || []);
            setPagination(response.data.meta || null);
        } catch (error) {
            toast.error("Không thể tải danh sách thông báo.");
        } finally {
            setIsLoading(false);
        }
    }, [page, search, filterStatus, filterTargetType]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // --- Handlers ---
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
            setIsLoading(true); // Có thể tạo state isSubmitting riêng
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

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 flex flex-col h-full bg-slate-50">
            {/* Tiêu đề & Nút Thêm mới */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Thông báo cho khách thuê</h1>
                    <p className="text-[13px] text-slate-500 mt-1">
                        Gửi nhắc nhở, nội quy hoặc thông báo điện nước đến toàn hệ thống hoặc từng khu nhà.
                    </p>
                </div>
                <button
                    onClick={handleOpenAddModal}
                    className="w-full sm:w-auto px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl sm:rounded-lg text-[13px] flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition-colors"
                >
                    <i className="fa-solid fa-bullhorn text-[12px]"></i>
                    Tạo thông báo mới
                </button>
            </div>

            {/* Vùng Bảng & Filter */}
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
                />
            </div>

            {/* CÁC MODAL */}
            <NotificationFormModal
                open={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleSaveNotification}
                isSubmitting={isLoading} // Nên dùng isSubmitting
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