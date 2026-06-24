import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import LeasesStats from "@/components/leases/LeasesStats";
import LeasesTable from "@/components/leases/LeasesTable";
import AddLeaseModal from "@/components/leases/AddLeaseModal";
import leasesService from "@/services/leasesService";
import propertyService from "@/services/propertyService";
import ContractTemplateModal from "@/components/leases/ContractTemplateModal";
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

  const handleEndLease = async (lease) => {
    if (!window.confirm(`Kết thúc hợp đồng HĐ #${lease.id}?`)) return;

    try {
      await leasesService.end(lease.id);
      toast.success("Đã kết thúc hợp đồng.", { autoClose: 1500 });
      await fetchLeases();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không thể kết thúc hợp đồng."
      );
    }
  };



  const handleOpenViewModal = (lease) => {
    toast.info("Chức năng xem chi tiết hợp đồng sẽ làm ở bước tiếp theo.");
    console.log("View lease:", lease);
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
          onEndLease={handleEndLease}
          onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
          onCopyPhone={handleCopyPhone}
        />
      </div>

      <div className="mt-8 mb-2 flex justify-center items-center text-[12px] text-slate-400">
        <p>© 2024 Nhà Trọ Kiêu Giang. Tất cả quyền được bảo lưu.</p>
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
    </div>
  );
}
