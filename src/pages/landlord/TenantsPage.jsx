import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify"; // Bật nếu bạn dùng Toast
import TenantStats from "@/components/tenants/TenantStats";
import TenantTable from "@/components/tenants/TenantTable";
import AddTenantModal from "@/components/tenants/AddTenantModal";
import tenantService from "@/services/tenantService";
export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 48, current_page: 1 });

  // Bộ lọc
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [status, setStatus] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await tenantService.getAll({
        page,
        search: searchText || undefined,
        property_id: propertyId || undefined,
        status: status || undefined,
      });

      setTenants(response.data.data || []);
      setStats(response.data.stats || null);
      setPagination(response.data.meta || null);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể tải danh sách khách thuê.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, searchText, propertyId, status]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreateTenant = async (formData) => {
    try {
      setIsCreatingTenant(true);

      await tenantService.create(formData);

      toast.success("Thêm khách thuê thành công!", {
        autoClose: 1500,
      });

      setIsAddModalOpen(false);
      await fetchTenants();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể thêm khách thuê. Vui lòng thử lại.",
      );
    } finally {
      setIsCreatingTenant(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true); // Đổi thành true để hiện Popup
  };

  const handleOpenScanModal = () => {
    console.log("Mở Camera quét QR/CCCD");
    // setIsScanModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Thống kê */}
        <TenantStats stats={stats} isLoading={isLoading} />

        {/* Bảng danh sách & Filter */}
        <TenantTable
          tenants={tenants}
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          isLoading={isLoading}
          searchText={searchText}
          onSearchTextChange={setSearchText}
          propertyId={propertyId}
          onPropertyIdChange={setPropertyId}
          status={status}
          onStatusChange={setStatus}
          onOpenAddModal={handleOpenAddModal}
          onOpenScanModal={handleOpenScanModal}
        />
      </div>

      <div className="mt-8 mb-2 flex justify-center items-center text-[12px] text-slate-400">
        <p>© 2024 Nhà Trọ Kiêu Giang. Tất cả quyền được bảo lưu.</p>
      </div>

      <AddTenantModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateTenant}
        isSubmitting={isCreatingTenant}
      />
    </div>
  );
}