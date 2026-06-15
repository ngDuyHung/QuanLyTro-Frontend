import React from "react";

function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm animate-pulse">
      <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0"></div>
      <div className="flex-1">
        <div className="h-3 bg-slate-100 rounded w-24 mb-2"></div>
        <div className="h-6 bg-slate-100 rounded w-12 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-16"></div>
      </div>
    </div>
  );
}

export default function TenantStats({ stats, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
          <i className="fa-solid fa-users text-xl"></i>
        </div>
        <div>
          <p className="text-[13px] text-slate-500 font-medium">Tổng khách thuê</p>
          <p className="text-[24px] font-bold text-slate-800 leading-tight mt-0.5">{stats?.total || 0}</p>
          <p className="text-[12px] text-slate-400 font-medium mt-0.5">Tất cả</p>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
          <i className="fa-regular fa-circle-check text-xl"></i>
        </div>
        <div>
          <p className="text-[13px] text-slate-500 font-medium">Đang thuê</p>
          <p className="text-[24px] font-bold text-slate-800 leading-tight mt-0.5">{stats?.active || 0}</p>
          <p className="text-[12px] text-green-600 font-bold mt-0.5">{stats?.active_rate || 0}%</p>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
          <i className="fa-regular fa-clock text-xl"></i>
        </div>
        <div>
          <p className="text-[13px] text-slate-500 font-medium">Sắp hết hạn HĐ</p>
          <p className="text-[24px] font-bold text-slate-800 leading-tight mt-0.5">{stats?.expiring || 0}</p>
          <p className="text-[12px] text-orange-500 font-bold mt-0.5">{stats?.expiring_rate || 0}%</p>
        </div>
      </div>

      {/* Card 4 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
          <i className="fa-regular fa-calendar-xmark text-xl"></i>
        </div>
        <div>
          <p className="text-[13px] text-slate-500 font-medium">Đã trả phòng</p>
          <p className="text-[24px] font-bold text-slate-800 leading-tight mt-0.5">{stats?.left || 0}</p>
          <p className="text-[12px] text-red-500 font-bold mt-0.5">{stats?.left_rate || 0}%</p>
        </div>
      </div>
    </div>
  );
}