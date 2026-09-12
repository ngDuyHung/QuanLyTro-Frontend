import React, { useCallback, useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import PropertyList from "@/components/properties/PropertyList";
import PropertyOverview from "@/components/properties/PropertyOverview";
import RoomList from "@/components/properties/RoomList";
import AddPropertyModal from "@/components/properties/AddPropertyModal";
import EditPropertyModal from "@/components/properties/EditPropertyModal";

import propertyService from "@/services/propertyService";

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


  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // --- STATE CHO FILTER VÀ SORT ---
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'name_asc', 'name_desc'

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Cấu hình nhãn hiển thị cho Lọc và Sắp xếp
  const filterOptions = [
    { value: "all", label: "Tất cả trạng thái", icon: "fa-filter" },
    { value: "active", label: "Đang hoạt động", icon: "fa-circle-check text-green-500" },
    { value: "inactive", label: "Tạm ngưng", icon: "fa-circle-pause text-orange-500" },
  ];

  const sortOptions = [
    { value: "newest", label: "Mới nhất", icon: "fa-arrow-down-short-wide" },
    { value: "oldest", label: "Cũ nhất", icon: "fa-arrow-up-wide-short" },
    { value: "name_asc", label: "Tên A-Z", icon: "fa-arrow-down-a-z" },
    { value: "name_desc", label: "Tên Z-A", icon: "fa-arrow-up-z-a" },
  ];

  const activeFilterLabel = filterOptions.find(o => o.value === filterStatus)?.label;
  const activeSortLabel = sortOptions.find(o => o.value === sortBy)?.label;

  // Xử lý delay tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Đóng menu khi click ra ngoài (Tạo overlay tàng hình)
  useEffect(() => {
    if (isFilterMenuOpen || isSortMenuOpen) {
      document.body.style.overflow = "hidden"; // Ngăn cuộn trang khi mở menu (tuỳ chọn)
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isFilterMenuOpen, isSortMenuOpen]);


  const fetchProperties = useCallback(async () => {
    try {
      setIsLoadingProperties(true);

      // CẬP NHẬT: Truyền thêm tham số status và sort vào API
      const response = await propertyService.getAll({
        search: search || undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        sort: sortBy,
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
  }, [search, page, filterStatus, sortBy]); // Thêm filterStatus và sortBy vào dependencies

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // hàm này để xử lý khi người dùng click chọn khu nhà
  const handleSelectProperty = (id) => {
    setSelectedPropertyId(id);

    // Tự động cuộn xuống danh sách phòng trên Mobile
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        // Tìm element danh sách phòng
        const roomTable = document.getElementById('room-table-top') || document.getElementById('room-list-top');
        if (roomTable) {
          roomTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150); // Delay 150ms để đợi React render dữ liệu khu nhà mới
    }
  };

  // Các hàm xử lý CRUD Property
  const handleOpenCreateProperty = () => setIsAddModalOpen(true);

  const handleOpenEditProperty = (property) => {
    setEditingProperty(property);
    setIsEditModalOpen(true);
  };

  const handleCreateProperty = async (formData) => {
    try {
      setIsCreating(true);
      const response = await propertyService.create(formData);
      toast.success("Tạo khu nhà thành công!", { autoClose: 1500 });
      setIsAddModalOpen(false);
      await fetchProperties();
      const createdProperty = response.data.data || response.data;
      if (createdProperty?.id) setSelectedPropertyId(createdProperty.id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể tạo khu nhà. Vui lòng thử lại.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProperty = async (formData) => {
    if (!editingProperty?.id) return;
    try {
      setIsUpdating(true);
      await propertyService.update(editingProperty.id, formData);
      toast.success("Cập nhật khu nhà thành công!", { autoClose: 1500 });
      const updatedPropertyId = editingProperty.id;
      setIsEditModalOpen(false);
      setEditingProperty(null);
      await fetchProperties();
      setSelectedPropertyId(updatedPropertyId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật khu nhà. Vui lòng thử lại.");
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
    const confirmed = window.confirm(`Bạn có chắc muốn xóa khu nhà "${property.name}" không?`);
    if (!confirmed) return;
    try {
      await propertyService.delete(property.id);
      toast.success("Xóa khu nhà thành công!", { autoClose: 1500 });
      await fetchProperties();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xóa khu nhà. Vui lòng thử lại.");
    }
  };


  const tabClasses = ({ isActive }) =>
    `px-4 sm:px-5 py-3 text-[13px] sm:text-[14px] transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${isActive
      ? "font-bold text-brand border-brand"
      : "font-medium text-slate-500 hover:text-slate-800 border-transparent"
    }`;

  const selectedProperty = properties.find((property) => property.id === selectedPropertyId) || null;

  return (
    <div className="flex-1 p-4 pt-0 md:p-6 lg:p-6 lg:pt-4 flex flex-col bg-slate-50 lg:h-full lg:overflow-hidden">
      {/* OVERLAY tàng hình để đóng menu khi click ra ngoài */}
      {(isFilterMenuOpen || isSortMenuOpen) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => { setIsFilterMenuOpen(false); setIsSortMenuOpen(false); }}
        ></div>
      )}
      <div className="mb-4 lg:mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:border-b lg:border-slate-200">
        <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 lg:border-none">
          <NavLink to="/landlord/properties" end className={tabClasses}>
            Danh sách khu nhà
          </NavLink>
          <NavLink to="/landlord/rooms" className={tabClasses}>
            Danh sách phòng
          </NavLink>
        </div>

        <div className="mt-3 lg:mt-0 pb-1 lg:pb-1 w-full lg:w-auto">

          {/* ======================================================= */}
          {/* GIAO DIỆN MOBILE: Gom Tìm kiếm + Nút Icon vào đúng 1 dòng */}
          {/* ======================================================= */}
          <div className="flex lg:hidden items-center gap-2 w-full">

            {/* Ô Tìm kiếm Mobile */}
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]"></i>
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm khu nhà..."
                className="w-full pl-8 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-brand shadow-sm transition-colors placeholder:text-slate-400"
              />
            </div>

            {/* Cụm Nút chức năng Mobile (Chỉ hiện Icon) */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Nút Lọc Mobile */}
              <div className="relative">
                <button
                  onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsSortMenuOpen(false); }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl border shadow-sm transition-colors ${isFilterMenuOpen || filterStatus !== 'all' ? 'border-brand text-brand bg-brand/5' : 'border-slate-200 text-slate-600 bg-white active:bg-slate-50'}`}
                >
                  <i className="fa-solid fa-filter text-[13px]"></i>
                  {filterStatus !== 'all' && (
                    <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
                  )}
                </button>
                {/* Dropdown Lọc */}
                {isFilterMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 py-1.5 z-40 animate-[fadeIn_0.15s_ease-out]">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 border-b border-slate-50">Lọc trạng thái</div>
                    {filterOptions.map((option) => (
                      <button key={option.value} onClick={() => { setFilterStatus(option.value); setPage(1); setIsFilterMenuOpen(false); }} className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${filterStatus === option.value ? "text-brand bg-brand/5" : "text-slate-700"}`}>
                        <i className={`fa-solid ${option.icon} w-4 text-center ${filterStatus === option.value ? 'text-brand' : 'text-slate-400'}`}></i>
                        {option.label}
                        {filterStatus === option.value && <i className="fa-solid fa-check ml-auto text-brand"></i>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nút Sắp xếp Mobile */}
              <div className="relative">
                <button
                  onClick={() => { setIsSortMenuOpen(!isSortMenuOpen); setIsFilterMenuOpen(false); }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl border shadow-sm transition-colors ${isSortMenuOpen || sortBy !== 'newest' ? 'border-brand text-brand bg-brand/5' : 'border-slate-200 text-slate-600 bg-white active:bg-slate-50'}`}
                >
                  <i className="fa-solid fa-arrow-up-wide-short text-[13px]"></i>
                </button>
                {/* Dropdown Sắp xếp */}
                {isSortMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 py-1.5 z-40 animate-[fadeIn_0.15s_ease-out]">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 border-b border-slate-50">Sắp xếp</div>
                    {sortOptions.map((option) => (
                      <button key={option.value} onClick={() => { setSortBy(option.value); setPage(1); setIsSortMenuOpen(false); }} className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${sortBy === option.value ? "text-brand bg-brand/5" : "text-slate-700"}`}>
                        <i className={`fa-solid ${option.icon} w-4 text-center ${sortBy === option.value ? 'text-brand' : 'text-slate-400'}`}></i>
                        {option.label}
                        {sortBy === option.value && <i className="fa-solid fa-check ml-auto text-brand"></i>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nút Thêm khu nhà Mobile */}
              <button
                type="button"
                onClick={handleOpenCreateProperty}
                className="h-9 px-3.5 flex items-center justify-center gap-1.5 bg-brand text-white rounded-xl shadow-sm active:bg-brand-dark transition-colors"
              >
                <i className="fa-solid fa-plus text-[13px] font-bold"></i>
                <span className="text-[13px] font-semibold whitespace-nowrap">Thêm khu nhà</span>
              </button>
            </div>
          </div>

          {/* ======================================================= */}
          {/* GIAO DIỆN DESKTOP: Giữ nguyên dạng nút dài nằm ngang */}
          {/* ======================================================= */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            {/* NÚT LỌC */}
            <div className="relative">
              <button
                onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsSortMenuOpen(false); }}
                className={`bg-white border px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-colors ${isFilterMenuOpen ? 'border-brand text-brand' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <i className={`fa-solid fa-filter ${filterStatus !== 'all' ? 'text-brand' : 'text-slate-400'}`}></i>
                <span className="hidden sm:inline">{activeFilterLabel}</span>
                <span className="sm:hidden">Lọc</span>
                <i className="fa-solid fa-angle-down text-[10px] ml-0.5 opacity-70"></i>
              </button>

              {/* Dropdown Lọc PC */}
              {isFilterMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 py-1.5 z-40 animate-[fadeIn_0.15s_ease-out]">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 border-b border-slate-50">Lọc theo trạng thái</div>
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setFilterStatus(option.value); setPage(1); setIsFilterMenuOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${filterStatus === option.value ? "text-brand bg-brand/5" : "text-slate-700"
                        }`}
                    >
                      <i className={`fa-solid ${option.icon} w-4 text-center ${filterStatus === option.value ? 'text-brand' : 'text-slate-400'}`}></i>
                      {option.label}
                      {filterStatus === option.value && <i className="fa-solid fa-check ml-auto text-brand"></i>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NÚT SẮP XẾP */}
            <div className="relative">
              <button
                onClick={() => { setIsSortMenuOpen(!isSortMenuOpen); setIsFilterMenuOpen(false); }}
                className={`bg-white border px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-colors ${isSortMenuOpen ? 'border-brand text-brand' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <i className="fa-solid fa-arrow-up-wide-short text-slate-400"></i>
                <span className="hidden sm:inline">Sắp xếp: {activeSortLabel}</span>
                <span className="sm:hidden">Sắp xếp</span>
                <i className="fa-solid fa-angle-down text-[10px] ml-0.5 opacity-70"></i>
              </button>

              {/* Dropdown Sắp xếp PC */}
              {isSortMenuOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 py-1.5 z-40 animate-[fadeIn_0.15s_ease-out]">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 border-b border-slate-50">Thứ tự ưu tiên</div>
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setSortBy(option.value); setPage(1); setIsSortMenuOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${sortBy === option.value ? "text-brand bg-brand/5" : "text-slate-700"
                        }`}
                    >
                      <i className={`fa-solid ${option.icon} w-4 text-center ${sortBy === option.value ? 'text-brand' : 'text-slate-400'}`}></i>
                      {option.label}
                      {sortBy === option.value && <i className="fa-solid fa-check ml-auto text-brand"></i>}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
      </div>

      <div className="flex-1 lg:min-h-0 flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Đã bọc sticky top-0 ở container cha này để ghim toàn bộ phần danh sách khu nhà khi cuộn */}
        <div className="lg:col-span-5 flex flex-col gap-2 lg:gap-4 lg:overflow-y-auto no-scrollbar lg:pr-1 mb-1 lg:mb-0 sticky top-0 z-30 bg-slate-50 -mx-4 px-4 py-2 lg:static lg:mx-0 lg:px-0 lg:py-0 border-b border-slate-200 lg:border-none shadow-sm lg:shadow-none">
          <div className="relative w-full shrink-0 hidden lg:block">
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
            onSelectProperty={handleSelectProperty}
            onEditProperty={handleOpenEditProperty}
            onDeleteProperty={handleDeleteProperty}
            isLoading={isLoadingProperties}
            pagination={pagination}
            page={page}
            onPageChange={setPage}
          />
        </div>

        <div className="lg:col-span-7 flex flex-col lg:h-full gap-5">
          <div className="shrink-0">
            <PropertyOverview property={selectedProperty} />
          </div>

          <div className="flex-1 flex flex-col lg:min-h-0">
            <RoomList
              property={selectedProperty}
              properties={properties}
              onRoomUpdated={fetchProperties}
              isPropertyLoading={isLoadingProperties}
            />
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