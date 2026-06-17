import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import TenantStats from "@/components/tenants/TenantStats";
import TenantTable from "@/components/tenants/TenantTable";
import AddTenantModal from "@/components/tenants/AddTenantModal";
import tenantService from "@/services/tenantService";
import propertyService from "@/services/propertyService";
import EditTenantModal from "@/components/tenants/EditTenantModal";
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
  const [properties, setProperties] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [isUpdatingTenant, setIsUpdatingTenant] = useState(false);

  // Hàm tải danh sách khu nhà để hiển thị trong filter
  const fetchProperties = useCallback(async () => {
    try {
      const response = await propertyService.getAll({
        per_page: 100,
      });

      setProperties(response.data.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể tải danh sách khu nhà."
      );
    }
  }, []);

  // Lấy danh sách tài sản để hiển thị trong filter
  const fetchTenants = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await tenantService.getAll({
        page,
        search: searchText || undefined,
        property_id: propertyId || undefined,
        status: status || undefined,
      });

      const items = response.data.data || [];
      const meta = response.data.meta || null;

      setTenants(items);
      setStats(response.data.stats || buildTenantStats(items, meta));
      setPagination(meta);
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

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

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

  const handleOpenEditModal = async (tenant) => {
    try {
      setEditingTenant(tenant);
      setIsEditModalOpen(true);

      const response = await tenantService.getById(tenant.id);

      setEditingTenant(response.data.data || response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể tải thông tin khách thuê."
      );
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true); // Đổi thành true để hiện Popup
  };

  const handleUpdateTenant = async (tenantId, formData) => {
    try {
      setIsUpdatingTenant(true);

      await tenantService.update(tenantId, formData);

      toast.success("Cập nhật khách thuê thành công!", {
        autoClose: 1500,
      });

      setIsEditModalOpen(false);
      setEditingTenant(null);

      await fetchTenants();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể cập nhật khách thuê. Vui lòng thử lại."
      );
    } finally {
      setIsUpdatingTenant(false);
    }
  };

  const handleOpenScanModal = () => {
    console.log("Mở Camera quét QR/CCCD");
    // setIsScanModalOpen(true);
  };



  // Hàm xây dựng thống kê khách thuê
  const buildTenantStats = (items = [], meta = null) => {
    const total = meta?.total ?? items.length;

    const active = items.filter((item) => item.status === "active").length;
    const pending = items.filter((item) => item.status === "pending").length;
    const left = items.filter((item) => item.status === "left").length;

    const percent = (value) => {
      if (!total) return 0;
      return Math.round((value / total) * 100);
    };

    return {
      total,
      active,
      pending,
      left,
      active_rate: percent(active),
      pending_rate: percent(pending),
      left_rate: percent(left),
    };
  };

  return (
    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Thống kê */}
        <TenantStats stats={stats} isLoading={isLoading} />

        {/* Bảng danh sách & Filter */}
        <TenantTable
          tenants={tenants}
          properties={properties}
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
          onOpenEditModal={handleOpenEditModal}
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
        properties={properties}
      />
      <EditTenantModal
        open={isEditModalOpen}
        tenant={editingTenant}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTenant(null);
        }}
        onSubmit={handleUpdateTenant}
        isSubmitting={isUpdatingTenant}
      />
    </div>
  );
}