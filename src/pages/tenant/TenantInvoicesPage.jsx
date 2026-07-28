import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import tenantInvoiceService from "@/services/tenantInvoiceService";
import TenantInvoicesTable from "@/components/tenant/invoices/TenantInvoicesTable";
import TenantPaymentModal from "@/components/tenant/invoices/TenantPaymentModal";
import TenantViewModal from "@/components/tenant/invoices/TenantViewModal";

export default function TenantInvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // Filters
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [month, setMonth] = useState("");

    // Modal States
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Danh sách Tabs ánh xạ với value gọi API
    const tabs = [
        { label: "Tất cả", value: "" },
        { label: "Chưa thanh toán", value: "issued" },
        { label: "Đã thanh toán", value: "paid" },
        { label: "Quá hạn", value: "overdue" },
        { label: "Đã hủy", value: "cancelled" },
    ];

    const fetchInvoices = useCallback(async () => {
        setIsLoading(true);
        try {
            // Khởi tạo params gửi lên backend
            const params = {
                page,
                status: status || undefined,
            };

            // Nếu người dùng có chọn tháng, truyền thẳng chuỗi "YYYY-MM" lên backend để lọc
            if (month) {
                // Ta có thể đổi tên tham số truyền lên thành 'filter_month' để dễ phân biệt
                // (Backend sẽ cần được cập nhật nhẹ để bắt tham số này)
                params.filter_month = month;
            }

            const response = await tenantInvoiceService.getAll(params);

            setInvoices(response.data.data || []);
            setPagination(response.data.meta || null);
        } catch (error) {
            toast.error("Không thể tải danh sách hóa đơn.");
        } finally {
            setIsLoading(false);
        }
    }, [page, status, month]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    // Handlers mở Modal
    const handleOpenPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
    };

    const handleOpenViewModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#F7F9FC] custom-scrollbar">

            {/* Tiêu đề trang */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Hóa đơn</h2>
                <p className="text-sm text-gray-500 mt-1">Theo dõi và thanh toán các khoản phí thuê phòng của bạn.</p>
            </div>

            {/* Main White Container */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-full">

                {/* Tabs & Filters Row */}
                <div className="px-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                    {/* Tabs */}
                    <div className="flex items-center gap-4 md:gap-6 text-sm font-medium overflow-x-auto w-full md:w-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => { setStatus(tab.value); setPage(1); }}
                                className={`py-4 whitespace-nowrap transition relative ${status === tab.value
                                    ? "text-gray-900 font-semibold"
                                    : "text-gray-500 hover:text-gray-900"
                                    }`}
                            >
                                {tab.label}
                                {/* Đường gạch dưới màu xanh (Primary) cho Tab đang active */}
                                {status === tab.value && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-md"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3 pb-4 md:pb-0 shrink-0">
                        <div className="relative group">
                            {/* Nút hiển thị UI */}
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 group-hover:bg-gray-50 transition">
                                <i className="fa-regular fa-calendar text-gray-400"></i>
                                <span>
                                    {month ? `Tháng ${month.split('-')[1]}/${month.split('-')[0]}` : "Chọn tháng"}
                                </span>
                                <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 ml-1"></i>
                            </button>

                            {/* Input ẩn với CSS kéo dãn icon lịch ra toàn bộ nút */}
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => { setMonth(e.target.value); setPage(1); }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer 
                                           [&::-webkit-calendar-picker-indicator]:absolute 
                                           [&::-webkit-calendar-picker-indicator]:inset-0 
                                           [&::-webkit-calendar-picker-indicator]:w-full 
                                           [&::-webkit-calendar-picker-indicator]:h-full 
                                           [&::-webkit-calendar-picker-indicator]:cursor-pointer 
                                           [&::-webkit-calendar-picker-indicator]:opacity-0"
                            />
                        </div>

                        {/* Nút Xóa Lọc (Chỉ hiện khi đã chọn tháng) */}
                        {month && (
                            <button
                                onClick={() => { setMonth(""); setPage(1); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50 rounded-lg text-sm text-red-600 hover:bg-red-100 transition"
                            >
                                <i className="fa-solid fa-xmark"></i> Xóa
                            </button>
                        )}
                    </div>
                </div>

                {/* Vùng chứa Danh sách */}
                <div className="flex-1 flex flex-col relative">
                    <TenantInvoicesTable
                        invoices={invoices}
                        isLoading={isLoading}
                        pagination={pagination}
                        page={page}
                        onPageChange={setPage}
                        onOpenPaymentModal={handleOpenPaymentModal}
                        onOpenViewModal={handleOpenViewModal}
                    />
                </div>

            </div>

            {/* Các Modals */}
            <TenantPaymentModal
                open={isPaymentModalOpen}
                invoice={selectedInvoice}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedInvoice(null);
                }}
                onSuccess={() => fetchInvoices()}
            />

            <TenantViewModal
                open={isViewModalOpen}
                invoice={selectedInvoice}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedInvoice(null);
                }}
            />
        </div>
    );
}