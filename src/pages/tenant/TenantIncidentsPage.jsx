import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import tenantIncidentService from "@/services/tenantIncidentService";
import TenantIncidentsTable from "@/components/tenant/incidents/TenantIncidentsTable";
import TenantReportIncidentModal from "@/components/tenant/incidents/TenantReportIncidentModal";
import TenantViewIncidentModal from "@/components/tenant/incidents/TenantViewIncidentModal";
import TenantEditIncidentModal from "@/components/tenant/incidents/TenantEditIncidentModal";

export default function TenantIncidentsPage() {
    const [incidents, setIncidents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");

    // Modal States
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);

    const fetchIncidents = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await tenantIncidentService.getAll({ page, status: status || undefined });
            setIncidents(res.data.data || []);
            setPagination(res.data.meta || null);
        } catch (error) {
            toast.error("Không thể tải danh sách sự cố.");
        } finally {
            setIsLoading(false);
        }
    }, [page, status]);

    useEffect(() => {
        fetchIncidents();
    }, [fetchIncidents]);

    const handleCancel = async (incident) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy báo cáo sự cố này?")) return;
        try {
            await tenantIncidentService.cancel(incident.id);
            toast.success("Đã hủy sự cố.");
            fetchIncidents();
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể hủy sự cố này.");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Báo cáo sự cố</h1>
                    <p className="text-[13px] text-slate-500 mt-1">Gửi yêu cầu sửa chữa, bảo trì đồ đạc trong phòng của bạn.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
                <TenantIncidentsTable
                    incidents={incidents}
                    isLoading={isLoading}
                    pagination={pagination}
                    page={page}
                    onPageChange={setPage}
                    status={status}
                    onStatusChange={(val) => { setStatus(val); setPage(1); }}
                    onOpenReportModal={() => setIsReportOpen(true)}
                    onOpenViewModal={(item) => { setSelectedIncident(item); setIsViewOpen(true); }}
                    onOpenEditModal={(item) => { setSelectedIncident(item); setIsEditOpen(true); }}
                    onCancelIncident={handleCancel}
                />
            </div>

            <TenantReportIncidentModal 
                open={isReportOpen} 
                onClose={() => setIsReportOpen(false)} 
                onSuccess={fetchIncidents} 
            />
            
            <TenantEditIncidentModal 
                open={isEditOpen} 
                incident={selectedIncident} 
                onClose={() => { setIsEditOpen(false); setSelectedIncident(null); }} 
                onSuccess={fetchIncidents} 
            />
            
            <TenantViewIncidentModal 
                open={isViewOpen} 
                incident={selectedIncident} 
                onClose={() => { setIsViewOpen(false); setSelectedIncident(null); }} 
            />
        </div>
    );
}