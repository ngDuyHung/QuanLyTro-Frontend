import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import RoomStats from "@/components/rooms/RoomStats";
import RoomTable from "@/components/rooms/RoomTable";
import AddRoomModal from "@/components/rooms/AddRoomModal";
import propertyService from "@/services/propertyService";
import roomService from "@/services/roomService";
import EditRoomModal from "@/components/rooms/EditRoomModal";
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

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

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
      await fetchRooms();
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

      setIsEditModalOpen(false);
      setEditingRoom(null);

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
    fetchRooms();
  }, [fetchRooms]);

  const tabClasses = ({ isActive }) =>
    `px-6 py-3 text-[14px] transition-colors border-b-2 -mb-[1px] ${
      isActive
        ? "font-bold text-brand border-brand"
        : "font-medium text-slate-500 hover:text-slate-800 border-transparent"
    }`;

  return (
    <div className="p-4 md:p-4 lg:p-5">
      {/* Page Header & Tabs */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-0 border-b border-slate-200">
          <div className="flex">
            <NavLink to="/landlord/properties" end className={tabClasses}>
              Danh sách khu nhà
            </NavLink>

            <NavLink to="/landlord/rooms" className={tabClasses}>
              Danh sách phòng
            </NavLink>
          </div>

          <div className="flex items-center gap-3 pb-2 md:pb-0">
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-slate-50 flex items-center gap-2">
              <i className="fa-solid fa-download text-slate-400"></i>
              Xuất Excel
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-brand text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-brand-dark flex items-center gap-2 shadow-sm"
            >
              <i className="fa-solid fa-plus"></i>
              Thêm phòng mới
            </button>
          </div>
        </div>
      </div>

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

      <AddRoomModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateRoom}
        isSubmitting={isCreatingRoom}
        properties={properties}
      />

      <EditRoomModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRoom(null);
        }}
        onSubmit={handleUpdateRoom}
        isSubmitting={isUpdatingRoom}
        room={editingRoom}
      />
    </div>
  );
}
