import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import incidentService from "@/services/incidentService";
import propertyService from "@/services/propertyService";
import roomService from "@/services/roomService";

// Import components sau này sẽ viết
import IncidentsTable from "@/components/incidents/IncidentsTable";
import CreateIncidentModal from "@/components/incidents/CreateIncidentModal";
import ResolveIncidentModal from "@/components/incidents/ResolveIncidentModal";
import ViewIncidentModal from "@/components/incidents/ViewIncidentModal";
// Có thể thêm Cancel/Delete/Update Modal nếu cần

export default function IncidentsPage() {
    // --- Quản lý dữ liệu hệ thống ---
    const [incidents, setIncidents] = useState([]);
    const [properties, setProperties] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    const [searchParams] = useSearchParams();

    // --- Trạng thái bộ lọc (Filters) ---
    const [page, setPage] = useState(1);
    const [propertyId, setPropertyId] = useState(searchParams.get("property_id") || "");
    const [roomId, setRoomId] = useState(searchParams.get("room_id") || "");
    const [status, setStatus] = useState(searchParams.get("status") || "");
    const [priority, setPriority] = useState("");

    // --- Quản lý Modal ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);

    // --- Fetch Init Data (Khu nhà) ---
    useEffect(() => {
        const fetchInitData = async () => {
            try {
                const propRes = await propertyService.getAll({ per_page: 100 });
                setProperties(propRes.data?.data || propRes.data || []);
            } catch (error) {
                console.error("Lỗi lấy danh mục khu nhà:", error);
            }
        };
        fetchInitData();
    }, []);

    // --- Fetch Phòng khi đổi Khu nhà ---
    useEffect(() => {
        if (!propertyId) {
            setRooms([]);
            setRoomId("");
            return;
        }
        const fetchRooms = async () => {
            try {
                const roomRes = await roomService.getByProperty(propertyId, { per_page: 100 });
                setRooms(roomRes.data?.data || roomRes.data || []);
            } catch (error) {
                console.error("Lỗi lấy danh sách phòng:", error);
            }
        };
        fetchRooms();
    }, [propertyId]);

    // --- Fetch Dữ Liệu Sự cố ---
    const fetchIncidents = useCallback(async (currentPage = page) => {
        setIsLoading(true);
        try {
            const params = {
                page: currentPage,
                per_page: 15,
                ...(propertyId && { property_id: propertyId }),
                ...(roomId && { room_id: roomId }),
                ...(status && { status }),
                ...(priority && { priority }),
            };

            const response = await incidentService.getAll(params);
            
            setIncidents(response.data?.data || response.data || []);
            // Đồng bộ định dạng meta với API
            setPagination(response.meta || response.data?.meta || null);
            setPage(currentPage);
        } catch (error) {
            console.error("Lỗi tải danh sách sự cố:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, propertyId, roomId, status, priority]);

    // Lắng nghe thay đổi bộ lọc để gọi API
    useEffect(() => {
        fetchIncidents(1); // Khi filter đổi, luôn reset về trang 1
    }, [propertyId, roomId, status, priority]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 relative overflow-hidden">
            {/* --- HEADER --- */}
            <div className="px-5 py-4 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-b border-slate-200">
                <div>
                    <h1 className="text-lg font-bold text-slate-800">Quản lý sự cố</h1>
                    <p className="text-[13px] text-slate-500 mt-0.5">Theo dõi và xử lý bảo trì, hỏng hóc tại các khu nhà</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-9 px-4 bg-brand text-white text-[13px] font-medium rounded-lg hover:bg-brand-dark transition-colors shadow-sm shadow-brand/20 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                    <i className="fa-solid fa-plus"></i>
                    Báo cáo sự cố
                </button>
            </div>

            {/* --- BỘ LỌC (FILTERS) --- */}
            <div className="px-5 py-3 shrink-0 flex flex-wrap items-center gap-3 bg-white border-b border-slate-200">
                <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-600 outline-none focus:border-brand transition-colors min-w-[160px]"
                >
                    <option value="">Tất cả khu nhà</option>
                    {properties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>

                <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    disabled={!propertyId}
                    className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-600 outline-none focus:border-brand transition-colors min-w-[140px] disabled:opacity-60"
                >
                    <option value="">Tất cả phòng</option>
                    {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-600 outline-none focus:border-brand transition-colors"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ tiếp nhận</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="cancelled">Đã hủy</option>
                </select>

                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-600 outline-none focus:border-brand transition-colors"
                >
                    <option value="">Tất cả mức độ</option>
                    <option value="emergency">Khẩn cấp</option>
                    <option value="high">Nghiêm trọng</option>
                    <option value="normal">Bình thường</option>
                    <option value="low">Thấp</option>
                </select>
            </div>

            {/* --- BẢNG DỮ LIỆU --- */}
            <div className="flex-1 overflow-hidden relative">
                <IncidentsTable
                    incidents={incidents}
                    isLoading={isLoading}
                    pagination={pagination}
                    page={page}
                    onPageChange={(newPage) => fetchIncidents(newPage)}
                    onOpenViewModal={(item) => {
                        setSelectedIncident(item);
                        setIsViewModalOpen(true);
                    }}
                    onOpenResolveModal={(item) => {
                        setSelectedIncident(item);
                        setIsResolveModalOpen(true);
                    }}
                    refreshData={() => fetchIncidents(page)}
                />
            </div>

            {/* --- CÁC MODAL --- */}
            <CreateIncidentModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                properties={properties}
                onSuccess={() => fetchIncidents(1)}
            />

            {selectedIncident && (
                <ResolveIncidentModal
                    open={isResolveModalOpen}
                    incident={selectedIncident}
                    onClose={() => {
                        setIsResolveModalOpen(false);
                        setSelectedIncident(null);
                    }}
                    onSuccess={() => fetchIncidents(page)}
                />
            )}

            {selectedIncident && (
                <ViewIncidentModal
                    open={isViewModalOpen}
                    incident={selectedIncident}
                    onClose={() => {
                        setIsViewModalOpen(false);
                        setSelectedIncident(null);
                    }}
                    refreshData={() => fetchIncidents(page)}
                />
            )}
        </div>
    );
}