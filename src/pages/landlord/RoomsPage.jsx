import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import RoomStats from "@/components/rooms/RoomStats";
import RoomTable from "@/components/rooms/RoomTable";
import AddRoomModal from "@/components/rooms/AddRoomModal";
import EditRoomModal from "@/components/rooms/EditRoomModal";
import ViewRoomModal from "@/components/rooms/ViewRoomModal";
import DeleteRoomModal from "@/components/rooms/DeleteRoomModal";
import propertyService from "@/services/propertyService";
import roomService from "@/services/roomService";
import AddLeaseModal from "@/components/leases/AddLeaseModal";
import leasesService from "@/services/leasesService";
import AddReservationModal from "@/components/rooms/AddReservationModal";
import CancelReservationModal from "@/components/rooms/CancelReservationModal";
import reservationService from "@/services/reservationService";
import CreateInvoiceModal from "@/components/invoices/CreateInvoiceModal";
import importService from "@/services/importService";
import DebtorsModal from "@/components/rooms/DebtorsModal";
const PER_PAGE = 10;

const emptyRoomStats = {
  total: 0,
  occupied: 0,
  available: 0,
  maintenance: 0,
  reserved: 0,
  occupancy_rate: 0,
  available_rate: 0,
  maintenance_rate: 0,
  reserved_rate: 0,
  expected_monthly_revenue: 0,
  debt_rooms: 0,
  debt_rate: 0,
};

export default function RoomsPage() {
  const location = useLocation();
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(location.state?.filterStatus || "");
  const [propertyId, setPropertyId] = useState("");
  const [sort, setSort] = useState("created_at_desc");

  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomStats, setRoomStats] = useState(emptyRoomStats);

  const [properties, setProperties] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const [editingRoom, setEditingRoom] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);

  const [isViewRoomOpen, setIsViewRoomOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isLoadingRoomDetail, setIsLoadingRoomDetail] = useState(false);

  //state for delete room modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  // Quản lý Đặt cọc
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isCancelReserveModalOpen, setIsCancelReserveModalOpen] = useState(false);
  const [actionRoom, setActionRoom] = useState(null); // Lưu phòng đang thao tác
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  // Quản lý Lập hợp đồng
  const [isAddLeaseModalOpen, setIsAddLeaseModalOpen] = useState(false);
  const [isCreatingLease, setIsCreatingLease] = useState(false);

  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);

  // state for exporting excel
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const [isDebtorsModalOpen, setIsDebtorsModalOpen] = useState(false);

  // Lắng nghe sự thay đổi của location.state để tự động cập nhật bộ lọc
  useEffect(() => {
    if (location.state?.filterStatus) {
      setStatus(location.state.filterStatus);
      setPage(1); // Reset về trang 1

      // Xóa state trên URL để khi f5 không bị dính mãi bộ lọc này
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await propertyService.getAll({
        per_page: 100,
      });

      setProperties(response.data.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách khu nhà.",
      );
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true);

      const response = await roomService.getAll({
        page,
        per_page: PER_PAGE,
        search: search || undefined,
        status: status || undefined,
        property_id: propertyId || undefined,
        sort: sort || undefined,
      });
      console.log("Fetched rooms:", response.data.data);
      setRooms(response.data.data || []);
      setPagination(response.data.meta || null);
      setRoomStats(response.data.stats || emptyRoomStats);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách phòng.",
      );
    } finally {
      setIsLoadingRooms(false);
    }
  }, [page, search, status, propertyId, sort]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleOpenCreateRoom = () => {
    setIsAddModalOpen(true);
  };

  // hàm dọn dẹp bộ lọc
  const handleClearFilters = () => {
    setSearchText("");
    setSearch("");
    setStatus("");
    setPropertyId("");
    setSort("created_at_desc");
    setPage(1);
  };

  const handleCreateRoom = async (formData, targetPropertyId) => {
    if (!targetPropertyId) {
      toast.warning("Vui lòng chọn khu nhà trước khi thêm phòng.");
      return;
    }

    try {
      setIsCreatingRoom(true);

      await roomService.create(targetPropertyId, formData);

      toast.success("Tạo phòng thành công!", {
        autoClose: 1500,
      });

      setIsAddModalOpen(false);

      if (page !== 1) {
        setPage(1);
      } else {
        await fetchRooms();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể tạo phòng. Vui lòng thử lại.",
      );
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setIsEditModalOpen(true);
  };

  const handleCloseEditRoom = () => {
    setIsEditModalOpen(false);
    setEditingRoom(null);
  };

  const handleUpdateRoom = async (formData, room) => {
    if (!room?.id) {
      toast.warning("Không tìm thấy phòng cần cập nhật.");
      return;
    }

    try {
      setIsUpdatingRoom(true);

      await roomService.update(room.id, formData);

      toast.success("Cập nhật phòng thành công!", {
        autoClose: 1500,
      });

      handleCloseEditRoom();

      await fetchRooms();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể cập nhật phòng. Vui lòng thử lại.",
      );
    } finally {
      setIsUpdatingRoom(false);
    }
  };

  const handleOpenRoomDetail = async (room) => {
    if (!room?.id) return;

    try {
      setIsLoadingRoomDetail(true);

      const response = await roomService.getById(room.id);

      const roomDetail = response.data.data || response.data;

      setSelectedRoom(roomDetail);
      setIsViewRoomOpen(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể tải chi tiết phòng. Vui lòng thử lại.",
      );

      setSelectedRoom(null);
      setIsViewRoomOpen(false);
    } finally {
      setIsLoadingRoomDetail(false);
    }
  };

  const handleCloseRoomDetail = () => {
    setIsViewRoomOpen(false);
    setSelectedRoom(null);
  };

  const handleOpenDeleteModal = (room) => {
    setDeletingRoom(room);
    setIsDeleteModalOpen(true);
  }

  const handleConfirmDelete = async (roomId) => {
    try {
      setIsDeletingRoom(true);
      await roomService.delete(roomId);
      toast.success("Xóa phòng thành công!", { autoClose: 1500 });
      setIsDeleteModalOpen(false);
      setDeletingRoom(null);

      //cập nhật lại danh sách phòng sau khi xóa
      await fetchRooms();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể xóa phòng lúc này. Vui lòng thử lại."
      );
    } finally {
      setIsDeletingRoom(false);
    }
  };


  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const response = await importService.downloadTemplate();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Du_Lieu_Khu_Nha.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Tải file mẫu thành công!");
    } catch (error) {
      toast.error("Không thể tải file mẫu. Vui lòng thử lại.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleCreateReservation = async (data) => {
    try {
      setIsSubmittingReservation(true);
      // data.room_id đã được đính kèm bên trong Modal
      await reservationService.create(data);
      toast.success("Đã nhận cọc và tạo phiếu thu thành công!");
      setIsReserveModalOpen(false);
      fetchRooms(); // Load lại list phòng để cập nhật status sang màu Cam
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  const handleCancelReservation = async (data) => {
    try {
      setIsSubmittingReservation(true);
      // Gọi API hủy (Lưu ý: API backend mình viết ở trên cần reservation_id. 
      // Nếu trong frontend bạn chưa có reservation_id, hãy tìm reservation active thông qua room_id, hoặc điều chỉnh API backend nhận room_id).
      await reservationService.cancel(data.room_id, data);
      toast.success("Đã hủy cọc phòng thành công!");
      setIsCancelReserveModalOpen(false);
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  // Mở modal lập hợp đồng
  const handleOpenCreateLease = (room) => {
    setActionRoom(room);
    setIsAddLeaseModalOpen(true);
  };

  // Submit form hợp đồng
  const handleCreateLease = async (formData) => {
    try {
      setIsCreatingLease(true);
      await leasesService.create(formData);
      toast.success("Tạo hợp đồng thành công!", { autoClose: 1500 });
      setIsAddLeaseModalOpen(false);
      await fetchRooms(); // Refresh lại danh sách phòng
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi tạo hợp đồng.");
    } finally {
      setIsCreatingLease(false);
    }
  };

  // Mở modal cọc / hủy cọc
  const handleOpenReserve = (room) => {
    setActionRoom(room);
    setIsReserveModalOpen(true);
  };

  const handleOpenCancelReserve = (room) => {
    setActionRoom(room);
    setIsCancelReserveModalOpen(true);
  };

  const tabClasses = ({ isActive }) =>
    `px-4 sm:px-5 py-3 text-[13px] sm:text-[14px] transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${isActive
      ? "font-bold text-brand border-brand"
      : "font-medium text-slate-500 hover:text-slate-800 border-transparent"
    }`;


  const handleOpenCreateInvoice = (room) => {
    setActionRoom(room); // Dùng chung state actionRoom đang có sẵn
    setIsCreateInvoiceModalOpen(true);
  };
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 pt-0 md:p-6 lg:p-6 lg:pt-4 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="mb-4 lg:mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:border-b lg:border-slate-200">
        <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 lg:border-none">
          <NavLink to="/landlord/properties" end className={tabClasses}>
            Danh sách khu nhà2
          </NavLink>

          <NavLink to="/landlord/rooms" className={tabClasses}>
            Danh sách phòng
          </NavLink>
        </div>

        <div className="flex items-center gap-2 mt-3 lg:mt-0 pb-1 lg:pb-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setIsDebtorsModalOpen(true)}
            className="bg-white border border-red-200 px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0 transition-colors"
          >
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span className="hidden sm:inline">Khách hay nợ</span>
            <span className="sm:hidden">DS Nợ</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel} // chặn click khi đang export
            className={`bg-white border border-slate-200 px-3 sm:px-3.5 py-2 rounded-lg 
              text-[12px] sm:text-[13px] font-medium text-slate-600 
              flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0
              transition-opacity duration-300
              ${isExportingExcel ? "opacity-50 pointer-events-none" : "hover:bg-slate-50"}`}
          >
            {isExportingExcel ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-download text-slate-400"></i>
            )}
            <span className="hidden sm:inline">Xuất Excel</span>
            <span className="sm:hidden">Xuất</span>
          </button>


          <button
            type="button"
            onClick={handleOpenCreateRoom}
            className="bg-brand text-white px-3 sm:px-4 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-brand-dark transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ml-auto lg:ml-0"
          >
            <i className="fa-solid fa-plus"></i>
            <span className="hidden sm:inline">Thêm phòng mới</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        <RoomStats stats={roomStats} isLoading={isLoadingRooms} />

        <RoomTable
          rooms={rooms}
          properties={properties}
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          isLoading={isLoadingRooms}
          searchText={searchText}
          onSearchTextChange={setSearchText}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          propertyId={propertyId}
          onPropertyIdChange={(value) => {
            setPropertyId(value);
            setPage(1);
          }}
          sort={sort} // <-- Truyền state sort
          onSortChange={(value) => { // <-- Xử lý đổi sort
            setSort(value);
            setPage(1);
          }}
          onClearFilters={handleClearFilters} // <-- Xử lý xóa lọc
          onEditRoom={handleOpenEditRoom}
          onViewRoom={handleOpenRoomDetail}
          onDeleteRoom={handleOpenDeleteModal}

          onCreateLease={handleOpenCreateLease} // Truyền hàm Lên HĐ xuống
          onReserve={handleOpenReserve}         // Truyền hàm Cọc xuống
          onCancelReserve={handleOpenCancelReserve} // Truyền hàm Hủy cọc xuống
          onViewInvoices={handleOpenCreateInvoice}
        />
      </div>

      <AddRoomModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateRoom}
        isSubmitting={isCreatingRoom}
        properties={properties}
      />

      <EditRoomModal
        open={isEditModalOpen}
        onClose={handleCloseEditRoom}
        onSubmit={handleUpdateRoom}
        isSubmitting={isUpdatingRoom}
        room={editingRoom}
        properties={properties}
      />
      <ViewRoomModal
        open={isViewRoomOpen}
        onClose={handleCloseRoomDetail}
        room={selectedRoom}
        isLoading={isLoadingRoomDetail}
      />
      <DeleteRoomModal
        open={isDeleteModalOpen}
        room={deletingRoom}
        isDeleting={isDeletingRoom}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingRoom(null);
        }}
        onConfirm={handleConfirmDelete}
      />
      <AddLeaseModal
        open={isAddLeaseModalOpen}
        onClose={() => {
          setIsAddLeaseModalOpen(false);
          setActionRoom(null);
        }}
        onSubmit={handleCreateLease}
        isSubmitting={isCreatingLease}
        properties={properties}
        defaultRoom={actionRoom} // <--- Đẩy phòng đang chọn vào đây để nó tự fill
      />
      <AddReservationModal
        open={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        room={actionRoom}
        onSubmit={handleCreateReservation}
        isSubmitting={isSubmittingReservation}
      />

      <CancelReservationModal
        open={isCancelReserveModalOpen}
        onClose={() => setIsCancelReserveModalOpen(false)}
        room={actionRoom}
        onSubmit={handleCancelReservation}
        isSubmitting={isSubmittingReservation}
      />
      <CreateInvoiceModal
        open={isCreateInvoiceModalOpen}
        onClose={() => {
          setIsCreateInvoiceModalOpen(false);
          setActionRoom(null);
        }}
        properties={properties}
        defaultRoom={actionRoom} // Truyền phòng đang chọn vào đây
        onSuccess={() => {
          // Tùy chọn: Gọi fetchRooms() nếu muốn cập nhật lại thống kê trên trang sau khi tạo
          fetchRooms();
        }}
      />

      <DebtorsModal
        open={isDebtorsModalOpen}
        onClose={() => setIsDebtorsModalOpen(false)}
        propertyId={propertyId} // Truyền propertyId để modal chỉ hiển thị danh sách nợ của khu nhà đang lọc (nếu có)
      />
    </div>
  );
}