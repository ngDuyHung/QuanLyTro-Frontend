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

    const fetchInvoices = useCallback(async () => {
        setIsLoading(true);
        try {
            let periodFrom = undefined;
            let periodTo = undefined;
            if (month) {
                periodFrom = `${month}-01`;
                const year = parseInt(month.split("-")[0], 10);
                const monthNum = parseInt(month.split("-")[1], 10);
                const lastDay = new Date(year, monthNum, 0).getDate();
                periodTo = `${month}-${lastDay}`;
            }

            const response = await tenantInvoiceService.getAll({
                page,
                status: status || undefined,
                period_from: periodFrom,
                period_to: periodTo,
            });

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
        <div className="p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">
            <div className="mb-6">
                <h1 className="text-[22px] font-bold text-slate-800">Hóa đơn của tôi</h1>
                <p className="text-[13px] text-slate-500 mt-1">Xem chi tiết công nợ và thanh toán tiền phòng.</p>
            </div>

            {/* Bảng Dữ Liệu */}
            <div className="flex-1 min-h-0 flex flex-col">
                <TenantInvoicesTable 
                    invoices={invoices}
                    isLoading={isLoading}
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    
                    // Filter props
                    status={status}
                    onStatusChange={(val) => { setStatus(val); setPage(1); }}
                    month={month}
                    onMonthChange={(val) => { setMonth(val); setPage(1); }}

                    // Action props
                    onOpenPaymentModal={handleOpenPaymentModal}
                    onOpenViewModal={handleOpenViewModal}
                />
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