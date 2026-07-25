import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import tenantUtilityService from "@/services/tenantUtilityService";
import TenantUtilitiesTable from "@/components/tenant/utilities/TenantUtilitiesTable";
import TenantSubmitUtilityModal from "@/components/tenant/utilities/TenantSubmitUtilityModal";
import TenantViewUtilityModal from "@/components/tenant/utilities/TenantViewUtilityModal";

export default function TenantUtilitiesPage() {
    const [readings, setReadings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    // Filters
    const [page, setPage] = useState(1);
    const [type, setType] = useState(""); 
    const [month, setMonth] = useState(""); 

    // Modals
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedReading, setSelectedReading] = useState(null);

    const fetchReadings = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await tenantUtilityService.getAll({
                page,
                type: type || undefined,
                month: month || undefined,
            });

            setReadings(response.data.data || []);
            setPagination(response.data.meta || null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể tải dữ liệu chỉ số.");
        } finally {
            setIsLoading(false);
        }
    }, [page, type, month]);

    useEffect(() => {
        fetchReadings();
    }, [fetchReadings]);

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Chỉ số Điện / Nước</h1>
                    <p className="text-[13px] text-slate-500 mt-1">
                        Báo cáo số điện nước tiêu thụ hàng tháng để chủ trọ lập hóa đơn.
                    </p>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                <TenantUtilitiesTable
                    readings={readings}
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    isLoading={isLoading}
                    type={type}
                    onTypeChange={(val) => { setType(val); setPage(1); }}
                    month={month}
                    onMonthChange={(val) => { setMonth(val); setPage(1); }}
                    onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                    onOpenViewModal={(reading) => {
                        setSelectedReading(reading);
                        setIsViewModalOpen(true);
                    }}
                />
            </div>

            <TenantSubmitUtilityModal
                open={isSubmitModalOpen}
                onClose={() => setIsSubmitModalOpen(false)}
                onSuccess={fetchReadings}
            />

            <TenantViewUtilityModal
                open={isViewModalOpen}
                reading={selectedReading}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedReading(null);
                }}
            />
        </div>
    );
}