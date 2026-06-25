import React from "react";

function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-4 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-1.5 md:mb-3">
        <div className="h-3 bg-slate-100 rounded w-16 md:w-24 mt-0.5"></div>
        <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-slate-100 shrink-0"></div>
      </div>
      <div className="flex items-end gap-1 md:gap-2">
        <div className="h-5 md:h-7 bg-slate-100 rounded w-8 md:w-12"></div>
        <div className="h-2.5 md:h-3 bg-slate-100 rounded w-6 md:w-8 mb-0.5"></div>
      </div>
    </div>
  );
}

export default function LeasesStats({ stats, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
      {/* Card 1: Tổng hợp đồng */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-0.5 md:mb-1">
          <p className="text-[11px] md:text-[13px] text-slate-500 font-medium line-clamp-1 pr-1">
            Tổng hợp đồng
          </p>
          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <i className="fa-solid fa-file-contract text-[11px] md:text-sm"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-1 md:gap-1.5">
          <p className="text-[18px] md:text-[24px] font-bold text-slate-800 leading-none">
            {stats?.total || 0}
          </p>
          <p className="text-[10px] md:text-[12px] text-slate-400 font-medium">
            Tất cả
          </p>
        </div>
      </div>

      {/* Card 2: Đang hiệu lực */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-0.5 md:mb-1">
          <p className="text-[11px] md:text-[13px] text-slate-500 font-medium line-clamp-1 pr-1">
            Đang hiệu lực
          </p>
          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <i className="fa-regular fa-circle-check text-[11px] md:text-sm"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-1 md:gap-1.5">
          <p className="text-[18px] md:text-[24px] font-bold text-slate-800 leading-none">
            {stats?.active || 0}
          </p>
          <p className="text-[10px] md:text-[11px] text-green-600 font-bold bg-green-50 px-1 md:px-1.5 py-0.5 rounded">
            {stats?.active_rate || 0}%
          </p>
        </div>
      </div>

      {/* Card 3: Sắp hết hạn */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-0.5 md:mb-1">
          <p className="text-[11px] md:text-[13px] text-slate-500 font-medium line-clamp-1 pr-1">
            Sắp hết hạn
          </p>
          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
            <i className="fa-regular fa-clock text-[11px] md:text-sm"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-1 md:gap-1.5">
          <p className="text-[18px] md:text-[24px] font-bold text-slate-800 leading-none">
            {stats?.expiring || 0}
          </p>
          <p className="text-[10px] md:text-[11px] text-orange-500 font-bold bg-orange-50 px-1 md:px-1.5 py-0.5 rounded">
            {stats?.expiring_rate || 0}%
          </p>
        </div>
      </div>

      {/* Card 4: Đã kết thúc */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-0.5 md:mb-1">
          <p className="text-[11px] md:text-[13px] text-slate-500 font-medium line-clamp-1 pr-1">
            Đã kết thúc
          </p>
          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-red-50 flex items-center justify-center text-red-500 shrink-0">
            <i className="fa-regular fa-calendar-xmark text-[11px] md:text-sm"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-1 md:gap-1.5">
          <p className="text-[18px] md:text-[24px] font-bold text-slate-800 leading-none">
            {stats?.ended || 0}
          </p>
          <p className="text-[10px] md:text-[11px] text-red-500 font-bold bg-red-50 px-1 md:px-1.5 py-0.5 rounded">
            {stats?.ended_rate || 0}%
          </p>
        </div>
      </div>
    </div>
  );
}