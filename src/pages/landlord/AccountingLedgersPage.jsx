import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import accountingLedgerService from "@/services/accountingLedgerService";
import propertyService from "@/services/propertyService";
import AccountingLedgersTable from "@/components/accounting/AccountingLedgersTable";

// Import các Modal (Chúng ta sẽ tạo ở bước sau)
import LockLedgerModal from "@/components/accounting/LockLedgerModal";
import ViewLedgerModal from "@/components/accounting/ViewLedgerModal";
import DeleteLedgerModal from "@/components/accounting/DeleteLedgerModal";
import LedgerConfigModal from "@/components/accounting/LedgerConfigModal";

export default function AccountingLedgersPage() {
    const [ledgers, setLedgers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // --- Trạng thái bộ lọc ---
    const currentYear = new Date().getFullYear();
    const [page, setPage] = useState(1);
    const [propertyId, setPropertyId] = useState("");
    const [periodYear, setPeriodYear] = useState(currentYear);

    // --- Trạng thái Modal ---
    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedLedger, setSelectedLedger] = useState(null);

    const fetchProperties = useCallback(async () => {
        try {
            const response = await propertyService.getAll({ per_page: 100 });
            setProperties(response.data.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách khu nhà.");
        }
    }, []);

    const fetchLedgers = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await accountingLedgerService.getAll({
                page,
                property_id: propertyId || undefined,
                period_year: periodYear || undefined,
            });

            setLedgers(response.data.data || []);
            setPagination(response.data.meta || null);
        } catch (error) {
            toast.error("Không thể tải danh sách sổ kế toán.");
        } finally {
            setIsLoading(false);
        }
    }, [page, propertyId, periodYear]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    useEffect(() => {
        fetchLedgers();
    }, [fetchLedgers]);

    // --- Handlers ---
    const handleOpenViewModal = (ledger) => {
        setSelectedLedger(ledger);
        setIsViewModalOpen(true);
    };

    const handleOpenDeleteModal = (ledger) => {
        setSelectedLedger(ledger);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">
            {/* Tiêu đề trang */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Sổ doanh thu (Thuế)</h1>
                    <p className="text-[13px] text-slate-500 mt-1">
                        Theo dõi doanh thu, đối soát và chốt sổ kế toán theo mẫu S1a-HKD của Bộ Tài chính.
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-file-signature text-[13px] text-blue-600"></i> Mẫu S1a-HKD
                    </button>
                    <button
                        onClick={() => setIsLockModalOpen(true)}
                        className="flex-1 sm:flex-none bg-brand text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20 flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-lock"></i> Chốt sổ kỳ mới
                    </button>
                </div>
            </div>

            {/* Bảng dữ liệu */}
            <div className="flex-1 min-h-0 flex flex-col">
                <AccountingLedgersTable
                    ledgers={ledgers}
                    properties={properties}
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    isLoading={isLoading}
                    propertyId={propertyId}
                    onPropertyIdChange={(val) => { setPropertyId(val); setPage(1); }}
                    periodYear={periodYear}
                    onPeriodYearChange={(val) => { setPeriodYear(val); setPage(1); }}
                    onView={handleOpenViewModal}
                    onDelete={handleOpenDeleteModal}
                />
            </div>

            {/* --- Modals Placeholder --- */}
            {isLockModalOpen && (
                <LockLedgerModal
                    open={isLockModalOpen}
                    onClose={() => setIsLockModalOpen(false)}
                    properties={properties}
                    onSuccess={fetchLedgers}
                />
            )}

            {isViewModalOpen && (
                <ViewLedgerModal
                    open={isViewModalOpen}
                    ledger={selectedLedger}
                    onClose={() => {
                        setIsViewModalOpen(false);
                        setSelectedLedger(null);
                    }}
                />
            )}

            {isDeleteModalOpen && (
                <DeleteLedgerModal
                    open={isDeleteModalOpen}
                    ledger={selectedLedger}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setSelectedLedger(null);
                    }}
                    onSuccess={fetchLedgers}
                />
            )}

            {isTemplateModalOpen && (
                <LedgerConfigModal
                    open={isTemplateModalOpen}
                    onClose={() => setIsTemplateModalOpen(false)}
                    properties={properties}
                    onSuccess={fetchProperties} // Gọi lại fetchProperties để data trong dropdown được update
                />
            )}
        </div>
    );
}