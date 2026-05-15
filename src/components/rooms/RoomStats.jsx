import React from "react";

export default function RoomStats() {
  const stats = [
    { 
      label: "Tổng số phòng", value: "120", 
      icon: "fa-building", color: "text-blue-500", bg: "bg-blue-50" 
    },
    { 
      label: "Đang thuê", value: "95", 
      icon: "fa-building-circle-check", color: "text-brand", bg: "bg-brand-50", 
      badge: "79.2%", badgeColor: "text-brand bg-brand-50" 
    },
    { 
      label: "Phòng trống", value: "15", 
      icon: "fa-door-open", color: "text-blue-500", bg: "bg-blue-50", 
      badge: "12.5%", badgeColor: "text-slate-700 bg-slate-100" 
    },
    { 
      label: "Bảo trì", value: "8", 
      icon: "fa-shield-halved", color: "text-orange-500", bg: "bg-orange-50", 
      badge: "6.7%", badgeColor: "text-orange-600 bg-orange-50" 
    },
    { 
      label: "Phòng nợ tiền", value: "10", 
      icon: "fa-file-invoice-dollar", color: "text-red-500", bg: "bg-red-50", 
      badge: "8.3%", badgeColor: "text-red-600 bg-red-50" 
    },
    { 
      label: "Doanh thu tháng 5", value: "63.250.000đ", 
      icon: "fa-dollar-sign", color: "text-brand", bg: "bg-brand-50", 
      badge: "↑ 14%", badgeColor: "text-brand bg-brand-50", isCurrency: true 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4"
        >
          {/* Cột Trái: Icon bo tròn */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[20px] shrink-0 ${stat.bg} ${stat.color}`}>
            <i className={`fa-solid ${stat.icon}`}></i>
          </div>

          {/* Cột Phải: Nội dung */}
          <div className="flex-1 min-w-0">
            {/* Logic phân tách riêng cho thẻ Doanh Thu (chữ trên, số dưới) và các thẻ khác (số trên, chữ dưới) */}
            {!stat.isCurrency ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[20px] font-bold text-slate-800 leading-none mb-1.5">{stat.value}</p>
                  <p className="text-[12px] text-slate-500 font-medium truncate">{stat.label}</p>
                </div>
                {stat.badge && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${stat.badgeColor} whitespace-nowrap`}>
                    {stat.badge}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-center h-full">
                <p className="text-[12px] text-slate-500 font-medium mb-1.5 truncate">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-brand leading-none truncate">{stat.value}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stat.badgeColor} whitespace-nowrap`}>
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