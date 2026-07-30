import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import LeasesStats from "@/components/leases/LeasesStats";
import LeasesTable from "@/components/leases/LeasesTable";
import AddLeaseModal from "@/components/leases/AddLeaseModal";
import leasesService from "@/services/leasesService";
import propertyService from "@/services/propertyService";
import ContractTemplateModal from "@/components/leases/ContractTemplateModal";
import DeleteLeaseModal from "@/components/leases/DeleteLeaseModal";
import ViewLeaseModal from "@/components/leases/ViewLeaseModal";
import EndLeaseModal from "@/components/leases/EndLeaseModal";
import CreateInvoiceModal from "@/components/invoices/CreateInvoiceModal"; // 1. Import Modal Hóa đơn thanh lý
const isExpiringSoon = (lease) => {
  if (!lease.end_date || lease.status !== "active") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(lease.end_date);
  if (Number.isNaN(endDate.getTime())) return false;

  const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 30;
};

const buildLeaseStats = (items = [], meta = null) => {
  const total = meta?.total ?? items.length;
  const active = items.filter((item) => item.status === "active").length;
  const ended = items.filter((item) => item.status === "ended").length;
  const expiring = items.filter(isExpiringSoon).length;

  const percent = (value) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  return {
    total,
    active,
    active_rate: percent(active),
    expiring,
    expiring_rate: percent(expiring),
    ended,
    ended_rate: percent(ended),
  };
};

export default function LeasesPage() {
  const [leases, setLeases] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [status, setStatus] = useState("");

  const [properties, setProperties] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreatingLease, setIsCreatingLease] = useState(false);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLease, setDeletingLease] = useState(null);
  const [isDeletingLease, setIsDeletingLease] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingLease, setViewingLease] = useState(null);

  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [endingLease, setEndingLease] = useState(null);

  // 1. Khai báo thêm state để quản lý Modal Hóa đơn thanh lý
  const [isCheckoutInvoiceOpen, setIsCheckoutInvoiceOpen] = useState(false);
  const [checkoutLease, setCheckoutLease] = useState(null);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await propertyService.getAll({ per_page: 100 });
      setProperties(response.data.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách khu nhà."
      );
    }
  }, []);

  const fetchLeases = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await leasesService.getAll({
        page,
        search: searchText || undefined,
        property_id: propertyId || undefined,
        status: status || undefined,
      });

      const items = response.data.data || [];
      const meta = response.data.meta || null;

      setLeases(items);
      setStats(response.data.stats || buildLeaseStats(items, meta));
      setPagination(meta);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách hợp đồng."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, searchText, propertyId, status]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

  const handleCreateLease = async (formData) => {
    try {
      setIsCreatingLease(true);

      await leasesService.create(formData);

      toast.success("Thêm hợp đồng thành công!", { autoClose: 1500 });

      setIsAddModalOpen(false);

      if (page !== 1) {
        setPage(1);
      } else {
        await fetchLeases();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể thêm hợp đồng. Vui lòng thử lại."
      );
    } finally {
      setIsCreatingLease(false);
    }
  };

  const handleOpenEndModal = (lease) => {
    // Thay vì mở EndLeaseModal, ta mở InvoiceModal trước
    setCheckoutLease(lease);
    setIsCheckoutInvoiceOpen(true);
  };

  // ---  HÀM XỬ LÝ XÓA ---
  const handleOpenDeleteModal = (lease) => {
    setDeletingLease(lease);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (leaseId) => {
    try {
      setIsDeletingLease(true);
      await leasesService.delete(leaseId); // Cần chắc chắn leasesService có hàm delete

      toast.success("Xóa hợp đồng thành công!", { autoClose: 1500 });

      setIsDeleteModalOpen(false);
      setDeletingLease(null);

      await fetchLeases();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể xóa hợp đồng lúc này. Vui lòng thử lại."
      );
    } finally {
      setIsDeletingLease(false);
    }
  };



  const handleOpenViewModal = (lease) => {
    setViewingLease(lease);
    setIsViewModalOpen(true);
  };

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    toast.success("Đã sao chép số điện thoại!");
  };

  return (
    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">
      <div className="flex-1 min-h-0 flex flex-col">
        <LeasesStats stats={stats} isLoading={isLoading} />

        <LeasesTable
          leases={leases}
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
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenViewModal={handleOpenViewModal}
          onEndLease={handleOpenEndModal}
          onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
          onCopyPhone={handleCopyPhone}
          onOpenDeleteModal={handleOpenDeleteModal}
        />
      </div>



      <AddLeaseModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateLease}
        isSubmitting={isCreatingLease}
        properties={properties}
      />
      <ContractTemplateModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
      <DeleteLeaseModal
        open={isDeleteModalOpen}
        lease={deletingLease}
        isDeleting={isDeletingLease}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingLease(null);
        }}
        onConfirm={handleConfirmDelete}
      />
      <ViewLeaseModal
        open={isViewModalOpen}
        lease={viewingLease}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingLease(null);
        }}
      />
      {/* 3. Thêm Modal Hóa Đơn Thanh Lý vào đây */}
      <CreateInvoiceModal
        open={isCheckoutInvoiceOpen}
        onClose={() => {
          setIsCheckoutInvoiceOpen(false);
          setCheckoutLease(null);
        }}
        properties={properties}
        defaultLease={checkoutLease}
        isCheckout={true}
        defaultNote="Hóa đơn thanh lý trả phòng."
        onSuccess={() => {
          // 4. LUỒNG LIỀN MẠCH: Xử lý Hóa đơn xong -> Tự động bật Modal kết thúc hợp đồng gốc
          setIsCheckoutInvoiceOpen(false);
          setEndingLease(checkoutLease);
          setIsEndModalOpen(true);
        }}
      />

      <EndLeaseModal
        open={isEndModalOpen}
        lease={endingLease}
        onClose={() => {
          setIsEndModalOpen(false);
          setEndingLease(null);
        }}
        onSuccess={fetchLeases}
      />
    </div>
  );
}
