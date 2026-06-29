import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import PropertyList from "@/components/properties/PropertyList";
import PropertyOverview from "@/components/properties/PropertyOverview";
import RoomList from "@/components/properties/RoomList";
import AddPropertyModal from "@/components/properties/AddPropertyModal";
import EditPropertyModal from "@/components/properties/EditPropertyModal";

import propertyService from "@/services/propertyService";

import EditRoomModal from "@/components/rooms/EditRoomModal";
import roomService from "@/services/roomService";
import ImportExcelModal from "@/components/properties/ImportExcelModal";
export default function PropertiesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [editingProperty, setEditingProperty] = useState(null);

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);


  const [editingRoom, setEditingRoom] = useState(null);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [roomRefreshKey, setRoomRefreshKey] = useState(0);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoadingProperties(true);

      const response = await propertyService.getAll({
        search: search || undefined,
        page,
        per_page: 10,
      });

      const list = response.data.data || [];

      setProperties(list);
      setPagination(response.data.meta || null);

      setSelectedPropertyId((currentId) => {
        if (currentId && list.some((item) => item.id === currentId)) {
          return currentId;
        }

        return list[0]?.id || null;
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách khu nhà.",
      );
    } finally {
      setIsLoadingProperties(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleOpenCreateProperty = () => {
    setIsAddModalOpen(true);
  };

  const handleOpenEditProperty = (property) => {
    setEditingProperty(property);
    setIsEditModalOpen(true);
  };

  const handleCreateProperty = async (formData) => {
    try {
      setIsCreating(true);

      const response = await propertyService.create(formData);

      toast.success("Tạo khu nhà thành công!", {
        autoClose: 1500,
      });

      setIsAddModalOpen(false);

      await fetchProperties();

      const createdProperty = response.data.data || response.data;

      if (createdProperty?.id) {
        setSelectedPropertyId(createdProperty.id);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể tạo khu nhà. Vui lòng thử lại.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProperty = async (formData) => {
    if (!editingProperty?.id) return;

    try {
      setIsUpdating(true);

      await propertyService.update(editingProperty.id, formData);

      toast.success("Cập nhật khu nhà thành công!", {
        autoClose: 1500,
      });

      const updatedPropertyId = editingProperty.id;

      setIsEditModalOpen(false);
      setEditingProperty(null);

      await fetchProperties();

      setSelectedPropertyId(updatedPropertyId);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể cập nhật khu nhà. Vui lòng thử lại.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProperty = async (property) => {
    const totalRooms = property.total_rooms ?? property.rooms_count ?? 0;

    if (totalRooms > 0) {
      toast.warning("Không thể xóa khu nhà vì vẫn còn phòng bên trong.");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khu nhà "${property.name}" không?`,
    );

    if (!confirmed) return;

    try {
      await propertyService.delete(property.id);

      toast.success("Xóa khu nhà thành công!", {
        autoClose: 1500,
      });

      await fetchProperties();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể xóa khu nhà. Vui lòng thử lại.",
      );
    }
  };


  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setIsEditRoomOpen(true);
  };

  const handleCloseEditRoom = () => {
    setIsEditRoomOpen(false);
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

      setRoomRefreshKey(prev => prev + 1);
      toast.success("Cập nhật phòng thành công!", {
        autoClose: 1500,
      });

      handleCloseEditRoom();

      //await fetchRooms();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể cập nhật phòng. Vui lòng thử lại.",
      );
    } finally {
      setIsUpdatingRoom(false);
    }
  };

  const tabClasses = ({ isActive }) =>
    `px-4 sm:px-5 py-3 text-[13px] sm:text-[14px] transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${isActive
      ? "font-bold text-brand border-brand"
      : "font-medium text-slate-500 hover:text-slate-800 border-transparent"
    }`;

  const selectedProperty =
    properties.find((property) => property.id === selectedPropertyId) || null;

  return (
    <div className="flex-1 p-4 pt-0 md:p-6 lg:p-6 lg:pt-4 flex flex-col bg-slate-50 lg:h-full lg:overflow-hidden">
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
          <button className="bg-white border border-slate-200 px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0">
            <i className="fa-solid fa-filter text-brand"></i>
            <span className="hidden sm:inline">Tất cả trạng thái</span>
            <span className="sm:hidden">Lọc</span>
            <i className="fa-solid fa-angle-down text-[10px] ml-0.5 text-slate-400"></i>
          </button>

          <button className="bg-white border border-slate-200 px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0">
            <i className="fa-solid fa-arrow-up-wide-short text-slate-400"></i>
            <span className="hidden sm:inline">Sắp xếp: Mới nhất</span>
            <span className="sm:hidden">Sắp xếp</span>
            <i className="fa-solid fa-angle-down text-[10px] ml-0.5 text-slate-400"></i>
          </button>

          {/* ---  EXCEL MỚI THÊM VÀO ĐÂY --- */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white border border-green-500 text-green-600 px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-green-50 flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0 ml-auto lg:ml-2"
          >
            <i className="fa-regular fa-file-excel text-[14px]"></i>
            <span className="hidden sm:inline">Nhập Excel</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateProperty}
            className="bg-brand text-white px-3 sm:px-4 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-brand-dark transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ml-auto lg:ml-0"
          >
            <i className="fa-solid fa-plus"></i>
            <span className="hidden sm:inline">Thêm khu nhà</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5 flex flex-col gap-4 lg:overflow-y-auto no-scrollbar lg:pr-1 mb-6 lg:mb-0">
          <div className="relative w-full shrink-0">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Tìm kiếm khu nhà theo tên hoặc địa chỉ..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-sm"
            />
          </div>

          <PropertyList
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={setSelectedPropertyId}
            onEditProperty={handleOpenEditProperty}
            onDeleteProperty={handleDeleteProperty}
            isLoading={isLoadingProperties}
            pagination={pagination}
            page={page}
            onPageChange={setPage}
          />
        </div>

        <div className="lg:col-span-7 flex flex-col h-full gap-5">
          <div className="shrink-0">
            <PropertyOverview property={selectedProperty} />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <RoomList
              property={selectedProperty}
              onEditRoom={handleOpenEditRoom}
              refreshKey={roomRefreshKey} />
          </div>
        </div>
      </div>

      <AddPropertyModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateProperty}
        isSubmitting={isCreating}
      />

      <EditPropertyModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProperty(null);
        }}
        property={editingProperty}
        onSubmit={handleUpdateProperty}
        isSubmitting={isUpdating}
      />

      <EditRoomModal
        open={isEditRoomOpen}
        room={editingRoom}
        onClose={handleCloseEditRoom}
        onSubmit={handleUpdateRoom}
        isSubmitting={isUpdatingRoom}
        properties={properties}
      />

      <ImportExcelModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchProperties(); // Fetch lại danh sách sau khi import thành công
        }}
      />
    </div>
  );
}
