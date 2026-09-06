import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import invoiceService from "@/services/invoiceService";
import propertyService from "@/services/propertyService";
import roomService from "@/services/roomService";
import InvoicesTable from "@/components/invoices/InvoicesTable";
import CreateInvoiceModal from "@/components/invoices/CreateInvoiceModal";
import PaymentInvoiceModal from "@/components/invoices/PaymentInvoiceModal";
import CancelInvoiceModal from "@/components/invoices/CancelInvoiceModal";
import DeleteInvoiceModal from "@/components/invoices/DeleteInvoiceModal";
import ViewInvoiceModal from "@/components/invoices/ViewInvoiceModal";
import InvoiceTemplateModal from "@/components/invoices/InvoiceTemplateModal";
import { useSearchParams } from "react-router-dom";
export default function InvoicesPage() {
    // --- Quản lý dữ liệu hệ thống ---
    const [invoices, setInvoices] = useState([]);
    const [properties, setProperties] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // lấy các tham số từ URL để lọc dữ liệu (nếu có)
    const [searchParams] = useSearchParams();

    // --- Trạng thái bộ lọc (Filters) ---
    const [page, setPage] = useState(1);
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const [propertyId, setPropertyId] = useState(searchParams.get("property_id") || "");
    const [roomId, setRoomId] = useState(searchParams.get("room_id") || "");

    // BỔ SUNG: State nhận lease_id từ URL
    const [leaseId, setLeaseId] = useState(searchParams.get("lease_id") || "");

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
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);


    // BỔ SUNG: Lắng nghe param lease_id
    useEffect(() => {
        setPropertyId(searchParams.get("property_id") || "");
        setRoomId(searchParams.get("room_id") || "");
        setLeaseId(searchParams.get("lease_id") || "");
    }, [searchParams]);

    // 1. Tải danh sách Khu nhà phục vụ bộ lọc đầu tiên
    const fetchProperties = useCallback(async () => {
        try {
            const response = await propertyService.getAll({ per_page: 100 });
            setProperties(response.data.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách khu nhà.");
        }
    }, []);

    // 1. Kiểm tra URL có truyền sẵn property_id hoặc room_id để tự động lọc không
    useEffect(() => {
        setPropertyId(searchParams.get("property_id") || "");
        setRoomId(searchParams.get("room_id") || "");
    }, [searchParams]);

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
                search: searchText || undefined,
                property_id: propertyId || undefined,
                room_id: roomId || undefined,
                lease_id: leaseId || undefined,
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
    }, [page, propertyId, roomId, leaseId, status, invoiceType, month, searchText]);

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

    // 1. Chuyển từ Thu tiền -> Xem chi tiết
    const handleSwitchToView = (invoice) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(false);
        setIsViewModalOpen(true);
    };

    // 2. Chuyển từ Xem chi tiết -> Thu tiền
    const handleSwitchToPayment = (invoice) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(false);
        setIsPaymentModalOpen(true);
    };

    // Xử lý phát hành hóa đơn
    const handleOpenIssueConfirm = async (invoice) => {
        await invoiceService.issue(invoice.id)
            .then(() => {
                toast.success("Hóa đơn đã được phát hành thành công.");
                fetchInvoices(); // Tải lại danh sách hóa đơn sau khi phát hành
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || "Không thể phát hành hóa đơn.");
            });
    };

    const handleOpenCancelModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsCancelModalOpen(true);
    };

    const handleOpenDeleteModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsDeleteModalOpen(true);
    };

    const handleOpenTemplateModal = () => {
        setIsTemplateModalOpen(true);
    }

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">

            {/* Tiêu đề trang & Nút thêm nhanh (Mobile) */}
            <div className="mb-4 sm:mb-6 flex justify-between items-center gap-4">
                <div>
                    <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-800">Quản lý hóa đơn</h1>
                    {/* Ẩn dòng chữ phụ trên Mobile để đỡ tốn chỗ */}
                    <p className="text-[13px] text-slate-500 mt-0.5 hidden sm:block">
                        Theo dõi hóa đơn và thu tiền khách thuê.
                    </p>
                </div>

                {/* NÚT LẬP HÓA ĐƠN ĐƯA LÊN ĐÂY ĐỂ ĐẬP NGAY VÀO MẮT CHỦ NHÀ */}
                <button
                    onClick={handleOpenCreateModal}
                    className="xl:hidden bg-brand text-white px-3.5 py-2 rounded-lg text-[13px] font-bold shadow-sm shadow-brand/20 flex items-center gap-1.5 active:bg-green-700 transition-colors shrink-0"
                >
                    <i className="fa-solid fa-plus text-[14px]"></i> Lập hóa đơn
                </button>
            </div>


            {/* Khu vực Bảng dữ liệu và thanh lọc công cụ */}
            <div className="flex-1 min-h-0 flex flex-col">
                <InvoicesTable
                    leaseId={leaseId}
                    onLeaseIdChange={(val) => { setLeaseId(val); setPage(1); }}
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
                    onOpenTemplateModal={handleOpenTemplateModal}
                    searchText={searchText}
                    onSearchTextChange={(val) => { setSearchText(val); setPage(1); }}
                    onClearFilters={() => {
                        setSearchText(""); setPropertyId(""); setRoomId("");
                        setLeaseId("");
                        setStatus(""); setInvoiceType(""); setMonth(""); setPage(1);
                    }}
                />
            </div>

            {/* --- CÁC COMPONENT MODAL CHỨC NĂNG SẼ ĐƯỢC ĐẶT Ở ĐÂY Ở BƯỚC TIẾP THEO --- */}
            <CreateInvoiceModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                properties={properties}
                onSuccess={() => fetchInvoices()} // Tải lại bảng sau khi tạo thành công
            />
            <PaymentInvoiceModal
                open={isPaymentModalOpen}
                invoice={selectedInvoice}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={() => fetchInvoices()}
                onOpenViewModal={handleSwitchToView}
            />
            <CancelInvoiceModal
                open={isCancelModalOpen}
                invoice={selectedInvoice}
                onClose={() => {
                    setIsCancelModalOpen(false);
                    setSelectedInvoice(null);
                }}
                onSuccess={() => fetchInvoices()}
            />
            <DeleteInvoiceModal
                open={isDeleteModalOpen}
                invoice={selectedInvoice}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedInvoice(null);
                }}
                onSuccess={() => fetchInvoices()}
            />
            <ViewInvoiceModal
                open={isViewModalOpen}
                invoice={selectedInvoice}

                // BỔ SUNG THÊM DÒNG NÀY:
                onClose={() => setIsViewModalOpen(false)}
                onOpenPaymentModal={handleSwitchToPayment}
            />

            <InvoiceTemplateModal
                open={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
            />
        </div>
    );
}