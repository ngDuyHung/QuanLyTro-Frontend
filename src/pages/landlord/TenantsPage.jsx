import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import TenantStats from "@/components/tenants/TenantStats";
import TenantTable from "@/components/tenants/TenantTable";
import AddTenantModal from "@/components/tenants/AddTenantModal";
import tenantService from "@/services/tenantService";
import propertyService from "@/services/propertyService";
import EditTenantModal from "@/components/tenants/EditTenantModal";
import ViewTenantModal from "@/components/tenants/ViewTenantModal";
import DeleteTenantModal from "@/components/tenants/DeleteTenantModal";
import LeaveRoomModal from "@/components/tenants/LeaveRoomModal";
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

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTenant, setViewingTenant] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State quản lý Modal Rời phòng
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedTenantToLeave, setSelectedTenantToLeave] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);

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
      console.log("fetchTenants response:", response.data);
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

  // ---  HÀM MỞ VIEW MODAL ---
  const handleOpenViewModal = async (tenant) => {
    try {
      // Gọi API lấy chi tiết để có được lịch sử (residence_history)
      const response = await tenantService.getById(tenant.id);
      setViewingTenant(response.data.data || response.data);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể tải thông tin chi tiết khách thuê."
      );
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


  const handleOpenLeaveModal = (tenant) => {
    setSelectedTenantToLeave(tenant);
    setLeaveModalOpen(true);
  };

  // ---  HÀM XỬ LÝ XÓA ---
  const handleOpenDeleteModal = (tenant) => {
    setDeletingTenant(tenant);
    setIsDeleteModalOpen(true);
  };

  const handleCloseLeaveModal = () => {
    setSelectedTenantToLeave(null);
    setLeaveModalOpen(false);
  };

  // Hàm gọi API xác nhận
  const handleConfirmLeave = async (tenantId, data) => {
    try {
      setIsLeaving(true);
      // Gọi file tenantService.js đã có sẵn hàm leave()
      await tenantService.leave(tenantId, data);

      toast.success("Đã ghi nhận khách rời phòng thành công!");
      handleCloseLeaveModal();

      // Gọi lại hàm fetch danh sách tenants để làm mới UI
      fetchTenants();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi xử lý.");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleConfirmDelete = async (tenantId) => {
    try {
      setIsDeleting(true);
      await tenantService.delete(tenantId);

      toast.success("Xóa khách thuê thành công!", { autoClose: 1500 });

      setIsDeleteModalOpen(false);
      setDeletingTenant(null);

      // Load lại danh sách
      await fetchTenants();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể xóa khách thuê lúc này. Vui lòng thử lại."
      );
    } finally {
      setIsDeleting(false);
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
          onOpenViewModal={handleOpenViewModal}
          onOpenDeleteModal={handleOpenDeleteModal}
          onOpenLeaveModal={handleOpenLeaveModal}
        />
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
      <ViewTenantModal
        open={isViewModalOpen}
        tenant={viewingTenant}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingTenant(null);
        }}
      />
      <LeaveRoomModal
        isOpen={leaveModalOpen}
        onClose={handleCloseLeaveModal}
        onConfirm={handleConfirmLeave}
        tenant={selectedTenantToLeave}
        isLoading={isLeaving}
      />
      <DeleteTenantModal
        open={isDeleteModalOpen}
        tenant={deletingTenant}
        isDeleting={isDeleting}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingTenant(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}