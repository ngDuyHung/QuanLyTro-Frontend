import React from "react";
import RoomStats from "@/components/rooms/RoomStats";
import RoomTable from "@/components/rooms/RoomTable";
import RoomWidgets from "@/components/rooms/RoomWidgets";
import { NavLink } from "react-router-dom";

export default function RoomsPage() {
  // Hàm xử lý class động: Tự nhận diện Tab đang chọn để đổi màu và thêm viền trong suốt chống giật
  const tabClasses = ({ isActive }) =>
    `px-6 py-3 text-[14px] transition-colors border-b-2 -mb-[1px] ${
      isActive
        ? "font-bold text-brand border-brand"
        : "font-medium text-slate-500 hover:text-slate-800 border-transparent"
    }`;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Page Header & Tabs */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-0 border-b border-slate-200">
          
          {/* Vùng chứa Tabs */}
          <div className="flex">
            <NavLink
              to="/landlord/properties"
              end
              className={tabClasses}
            >
              Danh sách khu nhà
            </NavLink>

            <NavLink
              to="/landlord/rooms"
              className={tabClasses}
            >
              Danh sách phòng
            </NavLink>
          </div>

          {/* Vùng chứa các nút thao tác */}
          <div className="flex items-center gap-3 pb-2 md:pb-0">
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-slate-50 flex items-center gap-2">
              <i className="fa-solid fa-download text-slate-400"></i> Xuất Excel
            </button>
            <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-lg p-1">
              <span className="text-[12px] text-slate-500 px-2">Hiển thị</span>
              <button className="w-7 h-7 rounded flex items-center justify-center bg-slate-100 text-slate-700 shadow-sm">
                <i className="fa-solid fa-list"></i>
              </button>
              <button className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-border-all"></i>
              </button>
            </div>
            <button className="bg-brand text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-brand-dark flex items-center gap-2 shadow-sm">
              <i className="fa-solid fa-plus"></i> Thêm phòng mới
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Sub-components */}
      <RoomStats />
      <RoomTable />
      <RoomWidgets />
    </div>
  );
}