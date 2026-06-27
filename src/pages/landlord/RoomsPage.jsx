import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import RoomStats from "@/components/rooms/RoomStats";
import RoomTable from "@/components/rooms/RoomTable";
import AddRoomModal from "@/components/rooms/AddRoomModal";
import EditRoomModal from "@/components/rooms/EditRoomModal";

import propertyService from "@/services/propertyService";
import roomService from "@/services/roomService";

const PER_PAGE = 10;

const emptyRoomStats = {
  total: 0,
  occupied: 0,
  available: 0,
  maintenance: 0,
  occupancy_rate: 0,
  available_rate: 0,
  maintenance_rate: 0,
  expected_monthly_revenue: 0,
  debt_rooms: 0,
  debt_rate: 0,
  current_debt_amount: 0,
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [propertyId, setPropertyId] = useState("");

  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomStats, setRoomStats] = useState(emptyRoomStats);

  const [properties, setProperties] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const [editingRoom, setEditingRoom] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);

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
  }, [page, search, status, propertyId]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleOpenCreateRoom = () => {
    setIsAddModalOpen(true);
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

  const handleExportExcel = () => {
    toast.info("Chức năng xuất Excel sẽ làm ở bước sau.", {
      autoClose: 1200,
    });
  };

  const tabClasses = ({ isActive }) =>
    `px-4 sm:px-5 py-3 text-[13px] sm:text-[14px] transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
      isActive
        ? "font-bold text-brand border-brand"
        : "font-medium text-slate-500 hover:text-slate-800 border-transparent"
    }`;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 pt-0 md:p-6 lg:p-6 lg:pt-4 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="mb-4 lg:mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:border-b lg:border-slate-200">
        <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 lg:border-none">
          <NavLink to="/landlord/properties" end className={tabClasses}>
            Danh sách khu nhà
          </NavLink>

          <NavLink to="/landlord/rooms" className={tabClasses}>
            Danh sách phòng
          </NavLink>
        </div>

        <div className="flex items-center gap-2 mt-3 lg:mt-0 pb-1 lg:pb-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setStatus("");
              setPropertyId("");
              setSearchText("");
              setSearch("");
              setPage(1);
            }}
            className="bg-white border border-slate-200 px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0"
          >
            <i className="fa-solid fa-filter text-brand"></i>
            <span className="hidden sm:inline">Tất cả trạng thái</span>
            <span className="sm:hidden">Lọc</span>
            <i className="fa-solid fa-angle-down text-[10px] ml-0.5 text-slate-400"></i>
          </button>

          <button
            type="button"
            onClick={() =>
              toast.info("Chức năng sắp xếp phòng sẽ làm ở bước sau.", {
                autoClose: 1200,
              })
            }
            className="bg-white border border-slate-200 px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0"
          >
            <i className="fa-solid fa-arrow-up-wide-short text-slate-400"></i>
            <span className="hidden sm:inline">Sắp xếp: Mới nhất</span>
            <span className="sm:hidden">Sắp xếp</span>
            <i className="fa-solid fa-angle-down text-[10px] ml-0.5 text-slate-400"></i>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-white border border-slate-200 px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0"
          >
            <i className="fa-solid fa-download text-slate-400"></i>
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
          onEditRoom={handleOpenEditRoom}
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
    </div>
  );
}