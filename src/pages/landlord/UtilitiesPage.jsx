import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import UtilitiesTable from "@/components/utilities/UtilitiesTable";
import utilityService from "@/services/utilityService";
import propertyService from "@/services/propertyService";

export default function UtilitiesPage() {
  const [readings, setReadings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  // --- Bộ lọc (Filters) ---
  const [page, setPage] = useState(1);
  const [propertyId, setPropertyId] = useState("");
  const [type, setType] = useState(""); // 'electricity' hoặc 'water'
  const [month, setMonth] = useState(""); // Format: YYYY-MM

  // --- Quản lý Modal (Sẽ làm ở bước sau) ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);

  // 1. Kéo danh sách Khu nhà cho bộ lọc
  const fetchProperties = useCallback(async () => {
    try {
      const response = await propertyService.getAll({ per_page: 100 });
      setProperties(response.data.data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách khu nhà.");
    }
  }, []);

  // 2. Kéo danh sách Chỉ số điện nước
  const fetchReadings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await utilityService.getAll({
        page,
        property_id: propertyId || undefined,
        type: type || undefined,
        month: month || undefined,
      });

      setReadings(response.data.data || []);
      setPagination(response.data.meta || null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không thể tải dữ liệu chỉ số."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, propertyId, type, month]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // --- Handlers mở Modal ---
  const handleOpenAddModal = () => setIsAddModalOpen(true);
  
  const handleOpenEditModal = (reading) => {
    setSelectedReading(reading);
    setIsEditModalOpen(true);
  };

  const handleOpenViewModal = (reading) => {
    setSelectedReading(reading);
    setIsViewModalOpen(true);
  };

  const handleOpenDeleteModal = (reading) => {
    setSelectedReading(reading);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">
      
      {/* Tiêu đề trang (Tùy chọn, bạn có thể tự style thêm Stats giống Tenant) */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800">Quản lý điện nước</h1>
          <p className="text-[13px] text-slate-500 mt-1">Chốt chỉ số tiêu thụ hàng tháng để lập hóa đơn.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <UtilitiesTable
          readings={readings}
          properties={properties}
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          isLoading={isLoading}
          
          // Filters
          propertyId={propertyId}
          onPropertyIdChange={(val) => { setPropertyId(val); setPage(1); }}
          type={type}
          onTypeChange={(val) => { setType(val); setPage(1); }}
          month={month}
          onMonthChange={(val) => { setMonth(val); setPage(1); }}
          
          // Actions
          onOpenAddModal={handleOpenAddModal}
          onOpenEditModal={handleOpenEditModal}
          onOpenViewModal={handleOpenViewModal}
          onOpenDeleteModal={handleOpenDeleteModal}
        />
      </div>

      <div className="mt-8 mb-2 flex justify-center items-center text-[12px] text-slate-400">
        <p>© 2024 Nhà Trọ Kiêu Giang. Tất cả quyền được bảo lưu.</p>
      </div>

      {/* --- CÁC MODAL SẼ ĐƯỢC CHÈN VÀO ĐÂY Ở BƯỚC TỚI --- */}
    </div>
  );
}