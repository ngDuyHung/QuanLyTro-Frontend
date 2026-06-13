import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import PropertyList from "@/components/properties/PropertyList";
import PropertyOverview from "@/components/properties/PropertyOverview";
import RoomList from "@/components/properties/RoomList";
import AddPropertyModal from "@/components/properties/AddPropertyModal";

import propertyService from "@/services/propertyService";
export default function PropertiesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

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

  const handleCreateProperty = async (formData) => {
    try {
      setIsCreating(true);

      const payload = {
        property_type: formData.property_type || "boarding_house",
        name: formData.name,
        code: formData.code,
        status: formData.status || "active",
        address: formData.address,
        floors_count: formData.floors_count,
        expected_rooms_count: formData.expected_rooms_count,
        manager_name: formData.manager_name || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        description: formData.description || formData.note || null,
      };

      const response = await propertyService.create(payload);

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

  // Cập nhật responsive cho class Tab: Giảm size chữ & padding trên mobile
  const tabClasses = ({ isActive }) =>
    `px-4 sm:px-5 py-3 text-[13px] sm:text-[14px] transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
      isActive
        ? "font-bold text-brand border-brand"
        : "font-medium text-slate-500 hover:text-slate-800 border-transparent"
    }`;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 lg:p-8 flex flex-col h-full bg-slate-50">
      {/* ========================================= */}
      {/* 1. HÀNG TABS & NÚT CÔNG CỤ (Tối ưu Mobile) */}
      {/* ========================================= */}
      <div className="mb-4 lg:mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between lg:border-b lg:border-slate-200">
        {/* Cụm Tabs: Tách border-b riêng cho Mobile để vạch kẻ active (-mb-[1px]) bám chuẩn xác */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 lg:border-none">
          <NavLink to="/landlord/properties" end className={tabClasses}>
            Danh sách khu nhà
          </NavLink>
          <NavLink to="/landlord/rooms" className={tabClasses}>
            Danh sách phòng
          </NavLink>
        </div>

        {/* Cụm nút hành động: Rút gọn text trên Mobile, gài vuốt ngang mượt */}
        <div className="flex items-center gap-2 mt-3 lg:mt-0 pb-1 lg:pb-0 overflow-x-auto no-scrollbar">
          {/* Nút Lọc */}
          <button className="bg-white border border-slate-200 px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0">
            <i className="fa-solid fa-filter text-brand"></i>
            <span className="hidden sm:inline">Tất cả trạng thái</span>
            <span className="sm:hidden">Lọc</span>
            <i className="fa-solid fa-angle-down text-[10px] ml-0.5 text-slate-400"></i>
          </button>

          {/* Nút Sắp xếp */}
          <button className="bg-white border border-slate-200 px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0">
            <i className="fa-solid fa-arrow-up-wide-short text-slate-400"></i>
            <span className="hidden sm:inline">Sắp xếp: Mới nhất</span>
            <span className="sm:hidden">Sắp xếp</span>
            <i className="fa-solid fa-angle-down text-[10px] ml-0.5 text-slate-400"></i>
          </button>

          {/* Nút Thêm: Đẩy về góc phải trên mobile nhờ ml-auto */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand text-white px-3 sm:px-4 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-brand-dark transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ml-auto lg:ml-0"
          >
            <i className="fa-solid fa-plus"></i>
            <span className="hidden sm:inline">Thêm khu nhà</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* 2. MAIN CONTENT GRID (Chia 2 cột)         */}
      {/* ========================================= */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">
        {/* CỘT TRÁI (Tỷ lệ 5/12): Tìm kiếm + Danh sách khu nhà */}
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
            isLoading={isLoadingProperties}
            pagination={pagination}
            page={page}
            onPageChange={setPage}
          />
        </div>

        {/* CỘT PHẢI (Tỷ lệ 7/12): Tổng quan + Danh sách phòng */}
        <div className="lg:col-span-7 flex flex-col h-full gap-5">
          <div className="shrink-0">
            <PropertyOverview />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <RoomList />
          </div>
        </div>
      </div>
      <AddPropertyModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateProperty}
        isSubmitting={isCreating}
      />
    </div>
  );
}
