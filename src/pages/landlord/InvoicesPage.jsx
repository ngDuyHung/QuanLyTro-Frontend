import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import invoiceService from "@/services/invoiceService";
import propertyService from "@/services/propertyService";
import roomService from "@/services/roomService";
import InvoicesTable from "@/components/invoices/InvoicesTable";
import CreateInvoiceModal from "@/components/invoices/CreateInvoiceModal";
export default function InvoicesPage() {
    // --- Quản lý dữ liệu hệ thống ---
    const [invoices, setInvoices] = useState([]);
    const [properties, setProperties] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // --- Trạng thái bộ lọc (Filters) ---
    const [page, setPage] = useState(1);
    const [propertyId, setPropertyId] = useState("");
    const [roomId, setRoomId] = useState("");
    const [status, setStatus] = useState("");
    const [invoiceType, setInvoiceType] = useState("");
    const [month, setMonth] = useState(""); // Định dạng: YYYY-MM

    // --- Trạng thái kiểm soát các Modal chức năng ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isIssueConfirmOpen, setIsIssueConfirmOpen] = useState(false);

    // Lưu thông tin hóa đơn đang được chọn để Thao tác (Xem/Xóa/Hủy/Thu tiền)
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // 1. Tải danh sách Khu nhà phục vụ bộ lọc đầu tiên
    const fetchProperties = useCallback(async () => {
        try {
            const response = await propertyService.getAll({ per_page: 100 });
            setProperties(response.data.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách khu nhà.");
        }
    }, []);

    // 2. Tải danh sách Phòng dựa trên Khu nhà được chọn để lọc sâu
    useEffect(() => {
        if (!propertyId) {
            setRooms([]);
            setRoomId("");
            return;
        }
        const fetchRooms = async () => {
            try {
                const response = await roomService.getAll({ property_id: propertyId, per_page: 100 });
                setRooms(response.data.data || []);
            } catch (error) {
                toast.error("Không thể tải danh sách phòng của khu nhà này.");
            }
        };
        fetchRooms();
    }, [propertyId]);

    // 3. Tải danh sách Hóa đơn theo các bộ lọc hiện tại
    const fetchInvoices = useCallback(async () => {
        try {
            setIsLoading(true);

            // Tách biến month thành period_from và period_to nếu người dùng lọc theo kỳ tháng
            let periodFrom = undefined;
            let periodTo = undefined;
            if (month) {
                periodFrom = `${month}-01`;
                // Tự động tính ngày cuối tháng (Ví dụ: 2026-06 -> 2026-06-30)
                const year = parseInt(month.split("-")[0], 10);
                const monthNum = parseInt(month.split("-")[1], 10);
                const lastDay = new Date(year, monthNum, 0).getDate();
                periodTo = `${month}-${lastDay}`;
            }

            const response = await invoiceService.getAll({
                page,
                property_id: propertyId || undefined,
                room_id: roomId || undefined,
                status: status || undefined,
                invoice_type: invoiceType || undefined,
                period_from: periodFrom,
                period_to: periodTo,
            });

            setInvoices(response.data.data || []);
            setPagination(response.data.meta || null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể tải danh sách hóa đơn.");
        } finally {
            setIsLoading(false);
        }
    }, [page, propertyId, roomId, status, invoiceType, month]);

    // Kích hoạt nạp cấu hình ban đầu
    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    // Theo dõi sự thay đổi bộ lọc để gọi lại API danh sách
    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    // --- Các hàm Handler điều phối bật Modal dữ liệu ---
    const handleOpenCreateModal = () => setIsCreateModalOpen(true);

    const handleOpenViewModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const handleOpenPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
    };

    const handleOpenIssueConfirm = (invoice) => {
        setSelectedInvoice(invoice);
        setIsIssueConfirmOpen(true);
    };

    const handleOpenCancelModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsCancelModalOpen(true);
    };

    const handleOpenDeleteModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">

            {/* Tiêu đề trang & Thống kê nhanh */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Quản lý hóa đơn</h1>
                    <p className="text-[13px] text-slate-500 mt-1">
                        Theo dõi công nợ tiền phòng, chi phí dịch vụ và quản lý phiếu thu tiền khách thuê.
                    </p>
                </div>
            </div>


            {/* Khu vực Bảng dữ liệu và thanh lọc công cụ */}
            <div className="flex-1 min-h-0 flex flex-col">
                <InvoicesTable
                    invoices={invoices}
                    properties={properties}
                    rooms={rooms}
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    isLoading={isLoading}

                    propertyId={propertyId}
                    onPropertyIdChange={(val) => { setPropertyId(val); setPage(1); setRoomId(""); }}
                    roomId={roomId}
                    onRoomIdChange={(val) => { setRoomId(val); setPage(1); }}
                    status={status}
                    onStatusChange={(val) => { setStatus(val); setPage(1); }}
                    invoiceType={invoiceType}
                    onInvoiceTypeChange={(val) => { setInvoiceType(val); setPage(1); }}
                    month={month}
                    onMonthChange={(val) => { setMonth(val); setPage(1); }}

                    onOpenCreateModal={handleOpenCreateModal}
                    onOpenViewModal={handleOpenViewModal}
                    onOpenPaymentModal={handleOpenPaymentModal}
                    onOpenIssueConfirm={handleOpenIssueConfirm}
                    onOpenCancelModal={handleOpenCancelModal}
                    onOpenDeleteModal={handleOpenDeleteModal}
                />
            </div>

            {/* --- CÁC COMPONENT MODAL CHỨC NĂNG SẼ ĐƯỢC ĐẶT Ở ĐÂY Ở BƯỚC TIẾP THEO --- */}
            <CreateInvoiceModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                properties={properties}
                onSuccess={() => fetchInvoices()} // Tải lại bảng sau khi tạo thành công
            />
        </div>
    );
}