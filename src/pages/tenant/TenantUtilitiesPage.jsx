import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import tenantUtilityService from "@/services/tenantUtilityService";
import TenantUtilitiesTable from "@/components/tenant/utilities/TenantUtilitiesTable";
import TenantSubmitUtilityModal from "@/components/tenant/utilities/TenantSubmitUtilityModal";
import TenantViewUtilityModal from "@/components/tenant/utilities/TenantViewUtilityModal";
import useTenantStore from "@/stores/tenantStore";

export default function TenantUtilitiesPage() {
    const [readings, setReadings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();

    // Filters
    const [page, setPage] = useState(1);
    const [type, setType] = useState("");
    const [month, setMonth] = useState("");

    // Modals
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedReading, setSelectedReading] = useState(null);

    const { setCurrentLeaseId } = useTenantStore();

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

    // MỞ MODAL TỰ ĐỘNG & ĐIỀU HƯỚNG ĐÚNG PHÒNG
    useEffect(() => {
        const action = searchParams.get("action");
        const leaseIdParam = searchParams.get("lease_id");

        // Nếu trên URL có truyền lease_id từ thông báo Push
        if (leaseIdParam) {
            setCurrentLeaseId(Number(leaseIdParam)); // Ép toàn bộ App chuyển sang phòng này
        }

        if (action === "submit_reading") {
            setIsSubmitModalOpen(true);

            // Dọn dẹp URL cho sạch sẽ sau khi đã mở Modal
            searchParams.delete("action");
            searchParams.delete("lease_id");
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams, setCurrentLeaseId]);

    useEffect(() => {
        fetchReadings();
    }, [fetchReadings]);

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">
            {/* Header Area */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Chỉ số Điện / Nước</h1>
                    <p className="text-[13px] text-slate-500 mt-1">
                        Báo cáo số điện nước tiêu thụ hàng tháng để chủ trọ lập hóa đơn.
                    </p>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 min-h-0 flex flex-col">
                <TenantUtilitiesTable
                    readings={readings}
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    isLoading={isLoading}
                    type={type}
                    onTypeChange={setType}
                    month={month}
                    onMonthChange={setMonth}
                    onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                    onOpenViewModal={(reading) => {
                        setSelectedReading(reading);
                        setIsViewModalOpen(true);
                    }}
                />
            </div>

            {/* Modals */}
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