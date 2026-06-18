import React from "react";

function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-3.5 bg-slate-100 rounded w-24 mt-1"></div>
        <div className="w-8 h-8 rounded-md bg-slate-100 shrink-0"></div>
      </div>
      <div className="flex items-end gap-2">
        <div className="h-7 bg-slate-100 rounded w-12"></div>
        <div className="h-3 bg-slate-100 rounded w-8 mb-1"></div>
      </div>
    </div>
  );
}

export default function LeasesStats({ stats, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-1">
          <p className="text-[12px] md:text-[13px] text-slate-500 font-medium line-clamp-1 pr-1">
            Tổng hợp đồng
          </p>
          <div className="w-8 h-8 rounded-md bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <i className="fa-solid fa-file-contract text-sm"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-[22px] md:text-[24px] font-bold text-slate-800 leading-none">
            {stats?.total || 0}
          </p>
          <p className="text-[11px] md:text-[12px] text-slate-400 font-medium">
            Tất cả
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-1">
          <p className="text-[12px] md:text-[13px] text-slate-500 font-medium line-clamp-1 pr-1">
            Đang hiệu lực
          </p>
          <div className="w-8 h-8 rounded-md bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <i className="fa-regular fa-circle-check text-sm"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-[22px] md:text-[24px] font-bold text-slate-800 leading-none">
            {stats?.active || 0}
          </p>
          <p className="text-[11px] md:text-[12px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
            {stats?.active_rate || 0}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-1">
          <p className="text-[12px] md:text-[13px] text-slate-500 font-medium line-clamp-1 pr-1">
            Sắp hết hạn
          </p>
          <div className="w-8 h-8 rounded-md bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
            <i className="fa-regular fa-clock text-sm"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-[22px] md:text-[24px] font-bold text-slate-800 leading-none">
            {stats?.expiring || 0}
          </p>
          <p className="text-[11px] md:text-[12px] text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded">
            {stats?.expiring_rate || 0}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-1">
          <p className="text-[12px] md:text-[13px] text-slate-500 font-medium line-clamp-1 pr-1">
            Đã kết thúc
          </p>
          <div className="w-8 h-8 rounded-md bg-red-50 flex items-center justify-center text-red-500 shrink-0">
            <i className="fa-regular fa-calendar-xmark text-sm"></i>
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-[22px] md:text-[24px] font-bold text-slate-800 leading-none">
            {stats?.ended || 0}
          </p>
          <p className="text-[11px] md:text-[12px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">
            {stats?.ended_rate || 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
