import React from "react";

const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
};

const formatPercent = (value) => {
  const number = Number(value || 0);
  return `${number}%`;
};

const emptyStats = {
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

function StatSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-slate-100 rounded w-16 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-24"></div>
      </div>
    </div>
  );
}

export default function RoomStats({ stats = emptyStats, isLoading = false }) {
  const statItems = [
    {
      label: "Tổng số phòng",
      value: stats.total,
      icon: "fa-building",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Đang thuê",
      value: stats.occupied,
      icon: "fa-building-circle-check",
      color: "text-brand",
      bg: "bg-brand-50",
      badge: formatPercent(stats.occupancy_rate),
      badgeColor: "text-brand bg-brand-50",
    },
    {
      label: "Phòng trống",
      value: stats.available,
      icon: "fa-door-open",
      color: "text-blue-500",
      bg: "bg-blue-50",
      badge: formatPercent(stats.available_rate),
      badgeColor: "text-slate-700 bg-slate-100",
    },
    {
      label: "Bảo trì",
      value: stats.maintenance,
      icon: "fa-shield-halved",
      color: "text-orange-500",
      bg: "bg-orange-50",
      badge: formatPercent(stats.maintenance_rate),
      badgeColor: "text-orange-600 bg-orange-50",
    },
    {
      label: "Phòng nợ tiền",
      value: stats.debt_rooms,
      icon: "fa-file-invoice-dollar",
      color: "text-red-500",
      bg: "bg-red-50",
      badge: formatPercent(stats.debt_rate),
      badgeColor: "text-red-600 bg-red-50",
    },
    {
      label: "Doanh thu dự kiến",
      value: formatCurrency(stats.expected_monthly_revenue),
      icon: "fa-dollar-sign",
      color: "text-brand",
      bg: "bg-brand-50",
      badge: "Tạm tính",
      badgeColor: "text-brand bg-brand-50",
      isCurrency: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-[20px] shrink-0 ${stat.bg} ${stat.color}`}
          >
            <i className={`fa-solid ${stat.icon}`}></i>
          </div>

          <div className="flex-1 min-w-0">
            {!stat.isCurrency ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[20px] font-bold text-slate-800 leading-none mb-1.5">
                    {stat.value}
                  </p>
                  <p className="text-[12px] text-slate-500 font-medium truncate">
                    {stat.label}
                  </p>
                </div>

                {stat.badge && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${stat.badgeColor} whitespace-nowrap`}
                  >
                    {stat.badge}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-center h-full">
                <p className="text-[12px] text-slate-500 font-medium mb-1.5 truncate">
                  {stat.label}
                </p>

                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-brand leading-none truncate">
                    {stat.value}
                  </p>

                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stat.badgeColor} whitespace-nowrap`}
                  >
                    {stat.badge}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}