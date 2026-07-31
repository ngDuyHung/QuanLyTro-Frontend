import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import financialTransactionService from "@/services/financialTransactionService";
import propertyService from "@/services/propertyService";
import FinancialTransactionsTable from "@/components/financial/FinancialTransactionsTable";
import AddFinancialTransactionModal from "@/components/financial/AddFinancialTransactionModal";
import CancelFinancialTransactionModal from "@/components/financial/CancelFinancialTransactionModal";
import ViewFinancialTransactionModal from "@/components/financial/ViewFinancialTransactionModal";
// Các Modal sẽ import ở bước sau

export default function FinancialTransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // --- Bộ lọc (Filters) ---
    const [page, setPage] = useState(1);
    const [propertyId, setPropertyId] = useState("");
    const [direction, setDirection] = useState(""); // income | expense
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // --- STATE TÌM KIẾM ---
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce xử lý tìm kiếm (tránh spam API)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset về trang 1 khi tìm kiếm mới
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);
    // -----------------------------

    // --- Quản lý Modal ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);


    // 1. Tải danh sách Khu nhà cho bộ lọc
    const fetchProperties = useCallback(async () => {
        try {
            const response = await propertyService.getAll({ per_page: 100 });
            setProperties(response.data.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách khu nhà.");
        }
    }, []);


    // 2. Tải danh sách Thu Chi
    const fetchTransactions = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await financialTransactionService.getAll({
                page,
                property_id: propertyId || undefined,
                direction: direction || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                search: debouncedSearch || undefined,
            });

            setTransactions(response.data.data || []);
            setPagination(response.data.meta || null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể tải dữ liệu thu chi.");
        } finally {
            setIsLoading(false);
        }
    }, [page, propertyId, direction, dateFrom, dateTo, debouncedSearch]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Sổ quỹ Thu Chi</h1>
                    <p className="text-[13px] text-slate-500 mt-1">Theo dõi dòng tiền vào/ra, cọc giữ chỗ và chi phí vận hành.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                <FinancialTransactionsTable
                    transactions={transactions}
                    properties={properties}
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    isLoading={isLoading}

                    // Filters
                    propertyId={propertyId}
                    onPropertyIdChange={(val) => { setPropertyId(val); setPage(1); }}
                    direction={direction}
                    onDirectionChange={(val) => { setDirection(val); setPage(1); }}
                    dateFrom={dateFrom}
                    onDateFromChange={setDateFrom}
                    dateTo={dateTo}
                    onDateToChange={setDateTo}

                    search={search}
                    onSearchChange={setSearch}

                    // Actions
                    onOpenAddModal={() => setIsAddModalOpen(true)}
                    onOpenViewModal={(item) => { setSelectedTransaction(item); setIsViewModalOpen(true); }}
                    onOpenCancelModal={(item) => { setSelectedTransaction(item); setIsCancelModalOpen(true); }}
                />
            </div>

            {/* --- CÁC MODAL SẼ ĐƯỢC CHÈN Ở ĐÂY --- */}
            <AddFinancialTransactionModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                properties={properties}
                onSuccess={fetchTransactions}
            />

            <CancelFinancialTransactionModal
                open={isCancelModalOpen}
                transaction={selectedTransaction}
                onClose={() => {
                    setIsCancelModalOpen(false);
                    setSelectedTransaction(null);
                }}
                onSuccess={fetchTransactions}
            />
            <ViewFinancialTransactionModal
                open={isViewModalOpen}
                transaction={selectedTransaction}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedTransaction(null);
                }}
            />
        </div>
    );
}