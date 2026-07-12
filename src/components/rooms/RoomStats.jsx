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
  total: 0, // tổng số phòng
  occupied: 0, // số phòng đang thuê
  available: 0, // số phòng trống
  maintenance: 0, // số phòng đang bảo trì
  reserved: 0,
  occupancy_rate: 0, // tỷ lệ phòng đang thuê
  available_rate: 0, // tỷ lệ phòng trống
  maintenance_rate: 0, // tỷ lệ phòng đang bảo trì
  reserved_rate: 0,
  debt_rooms: 0, // số phòng nợ tiền
  debt_rate: 0,// tỷ lệ phòng nợ tiền
  current_debt_amount: 0,// tổng số tiền nợ hiện tại
};

function StatSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 lg:p-4 shadow-sm flex items-center gap-3 lg:gap-4 animate-pulse">
      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-slate-100 shrink-0"></div>

      <div className="flex-1 min-w-0">
        <div className="h-4 lg:h-5 bg-slate-100 rounded w-12 lg:w-16 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-20 lg:w-24"></div>
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
      label: "Đang cọc",
      value: stats.reserved,
      icon: "fa-hand-holding-dollar",
      color: "text-purple-500",
      bg: "bg-purple-50",
      badge: formatPercent(stats.reserved_rate),
      badgeColor: "text-purple-600 bg-purple-50",
      isCurrency: false, // Xóa bỏ isCurrency: true vì đây là đếm số lượng
    },
  ];

  if (isLoading) {
    return (
      <div className="hidden md:grid  grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4 mb-4 lg:mb-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="hidden md:grid  grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4 mb-4 lg:mb-6">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-xl p-3 lg:p-4 shadow-sm flex items-center gap-3 lg:gap-4 min-w-0"
        >
          <div
            className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-[17px] lg:text-[20px] shrink-0 ${stat.bg} ${stat.color}`}
          >
            <i className={`fa-solid ${stat.icon}`}></i>
          </div>

          <div className="flex-1 min-w-0">
            {!stat.isCurrency ? (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-[18px] lg:text-[20px] font-bold text-slate-800 leading-none truncate">
                    {stat.value}
                  </p>

                  {stat.badge && (
                    <span
                      className={`text-[10px] lg:text-[11px] font-bold px-1.5 lg:px-2 py-0.5 rounded-md whitespace-nowrap ${stat.badgeColor}`}
                    >
                      {stat.badge}
                    </span>
                  )}
                </div>

                <p className="text-[11px] lg:text-[12px] text-slate-500 font-medium truncate mt-1">
                  {stat.label}
                </p>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-[11px] lg:text-[12px] text-slate-500 font-medium truncate">
                    {stat.label}
                  </p>

                  <span
                    className={`hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${stat.badgeColor}`}
                  >
                    {stat.badge}
                  </span>
                </div>

                <p className="text-[13px] lg:text-[15px] font-bold text-brand leading-none truncate">
                  {stat.value}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}