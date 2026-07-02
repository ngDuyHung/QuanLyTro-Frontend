import React, { useEffect, useState } from "react";

// --- CÁC HÀM HELPER FORMAT DỮ LIỆU ---
const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
};

const getFloorLabel = (floorNumber) => {
  if (floorNumber === null || floorNumber === undefined || floorNumber === "") return "Không xác định";
  if (String(floorNumber) === "0") return "Tầng trệt";
  return `Tầng ${floorNumber}`;
};

const getBillingDayLabel = (billingDay) => {
  if (billingDay === null || billingDay === undefined || billingDay === "") return "Theo quy định khu nhà";
  if (String(billingDay) === "0") return "Theo ngày vào ở";
  return `Ngày ${billingDay} hằng tháng`;
};

const getStatusConfig = (status) => {
  switch (status) {
    case "occupied":
      return { label: "Đang thuê", badgeClass: "bg-green-50 text-green-600 border-green-200", icon: "fa-user-check" };
    case "maintenance":
      return { label: "Đang bảo trì", badgeClass: "bg-orange-50 text-orange-600 border-orange-200", icon: "fa-wrench" };
    case "available":
    default:
      return { label: "Phòng trống", badgeClass: "bg-blue-50 text-blue-600 border-blue-200", icon: "fa-door-open" };
  }
};

const getRoleConfig = (role) => {
  if (role === 'representative') {
    return { label: 'Người đại diện', bg: 'bg-brand/10 text-brand', icon: 'fa-star' };
  }
  return { label: 'Thành viên', bg: 'bg-slate-100 text-slate-600', icon: 'fa-user' };
};

export default function ViewRoomModal({ open, onClose, room, isLoading = false }) {
  const [activeImage, setActiveImage] = useState("");
  // Thêm state quản lý ảnh đang phóng to
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    if (!open) {
      // Reset ảnh phóng to khi đóng modal
      setZoomedImage(null);
      return;
    }
    
    document.body.style.overflow = "hidden";

    const images = room?.images || [];
    const initialImg = images.find((img) => img.is_cover)?.image_url || images[0]?.image_url || "";
    setActiveImage(initialImg);

    return () => { document.body.style.overflow = ""; };
  }, [open, room]);

  if (!open) return null;

  if (isLoading || !room) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-3">
          <i className="fa-solid fa-circle-notch fa-spin text-brand text-2xl"></i>
          <span className="text-[13px] font-medium text-slate-600">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  const images = room.images || [];
  const statusConfig = getStatusConfig(room.status);
  const residents = room.current_residents || [];

  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- MODAL CHÍNH --- */}
      <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all"
        onClick={onClose}
      >
        <div 
          className="bg-slate-50 w-full h-[90vh] sm:h-auto sm:max-h-[90vh] lg:max-w-[950px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* --- HEADER --- */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <i className="fa-solid fa-door-open text-[18px]"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800 leading-tight">
                    Phòng {room.name}
                  </h2>
                  <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase tracking-wide hidden sm:inline-block ${statusConfig.badgeClass}`}>
                    {room.status_label || statusConfig.label}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Khu nhà: <span className="font-semibold text-slate-700">{room.property?.name || "---"}</span>
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
            >
              <i className="fa-solid fa-xmark text-[16px]"></i>
            </button>
          </div>

          {/* --- BODY --- */}
          <div className="overflow-y-auto no-scrollbar flex-1 p-4 sm:p-5">
            <div className="sm:hidden mb-4">
                <span className={`px-2.5 py-1 text-[11px] font-bold border rounded-md uppercase tracking-wide inline-flex items-center gap-1.5 ${statusConfig.badgeClass}`}>
                  <i className={`fa-solid ${statusConfig.icon}`}></i>
                  {room.status_label || statusConfig.label}
                </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
              {/* CỘT TRÁI: THÔNG TIN PHÒNG */}
              <div className="flex-1 lg:w-3/5 flex flex-col gap-5">
                
                {/* Khu vực Ảnh */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  {activeImage ? (
                    <div className="w-full relative group">
                      {/* Ảnh chính - Bấm để phóng to */}
                      <img 
                        src={activeImage} 
                        alt={room.name} 
                        onClick={() => setZoomedImage(activeImage)}
                        className="w-full h-[200px] sm:h-[240px] object-cover transition-all duration-300 cursor-zoom-in" 
                      />
                      {/* Nút gợi ý phóng to */}
                      <button 
                        onClick={() => setZoomedImage(activeImage)}
                        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Phóng to ảnh"
                      >
                        <i className="fa-solid fa-expand text-[13px]"></i>
                      </button>

                      {images.length > 1 && (
                        <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar bg-slate-50 border-t border-slate-200">
                          {images.map((img, idx) => (
                            <img 
                              key={idx} 
                              src={img.image_url} 
                              alt={`Thumbnail ${idx}`} 
                              onClick={() => setActiveImage(img.image_url)}
                              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0 border-2 cursor-pointer transition-all ${
                                img.image_url === activeImage 
                                  ? 'border-brand scale-[1.03] shadow-sm'
                                  : 'border-transparent hover:opacity-70'
                              }`} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-[160px] bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                      <i className="fa-regular fa-image text-3xl mb-2"></i>
                      <span className="text-[13px]">Phòng chưa có hình ảnh</span>
                    </div>
                  )}
                </div>

                {/* Các thông tin khác giữ nguyên */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <i className="fa-solid fa-circle-info text-brand text-[13px]"></i>
                    <h3 className="text-[14px] font-bold text-slate-800">Thông tin phòng</h3>
                  </div>
                  
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Giá thuê</p>
                      <p className="text-[14px] font-bold text-brand">{formatCurrency(room.current_price)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Diện tích</p>
                      <p className="text-[14px] font-semibold text-slate-800">{room.area ? `${room.area} m²` : "---"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Vị trí</p>
                      <p className="text-[14px] font-semibold text-slate-800">{getFloorLabel(room.floor_number)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Sức chứa</p>
                      <p className="text-[14px] font-semibold text-slate-800">
                        {Number(room.max_occupants) > 0 ? `Tối đa ${room.max_occupants} người` : "Không giới hạn"}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Quy định thu tiền</p>
                      <p className="text-[14px] font-semibold text-slate-800">{getBillingDayLabel(room.billing_day)}</p>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-[12px]">
                    <div className="flex items-center gap-1.5">
                      {room.allow_shared ? (
                        <i className="fa-solid fa-check-circle text-green-500"></i>
                      ) : (
                        <i className="fa-solid fa-xmark-circle text-slate-400"></i>
                      )}
                      <span className={room.allow_shared ? "text-slate-700 font-medium" : "text-slate-500"}>Cho ở ghép</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {room.is_public ? (
                        <i className="fa-solid fa-check-circle text-green-500"></i>
                      ) : (
                        <i className="fa-solid fa-xmark-circle text-slate-400"></i>
                      )}
                      <span className={room.is_public ? "text-slate-700 font-medium" : "text-slate-500"}>Đăng công khai</span>
                    </div>
                  </div>
                </div>

                {room.description && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                      <i className="fa-solid fa-align-left text-brand text-[13px]"></i>
                      <h3 className="text-[14px] font-bold text-slate-800">Mô tả & Ghi chú</h3>
                    </div>
                    <div className="p-4">
                      <p className="text-[13px] text-slate-600 whitespace-pre-line leading-relaxed">
                        {room.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: THÔNG TIN KHÁCH THUÊ */}
              <div className="lg:w-2/5 flex flex-col gap-5">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-users text-brand text-[13px]"></i>
                      <h3 className="text-[14px] font-bold text-slate-800">Thành viên trong phòng</h3>
                    </div>
                    <span className="text-[12px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      {room.current_occupants_count || 0} người
                    </span>
                  </div>

                  <div className="p-4 flex-1">
                    {residents.length === 0 ? (
                      <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                          <i className="fa-solid fa-user-slash text-2xl"></i>
                        </div>
                        <p className="text-[13px] text-slate-500 font-medium">Phòng hiện tại chưa có ai ở.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {residents.map((resident, index) => {
                          const tenant = resident.tenant;
                          const roleCfg = getRoleConfig(resident.role);
                          if(!tenant) return null;

                          return (
                            <div key={index} className="flex items-start p-3 rounded-xl border border-slate-100 hover:border-brand/30 hover:bg-slate-50 transition-colors shadow-sm">
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 mt-0.5 mr-3">
                                <i className="fa-solid fa-user"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-slate-800 leading-tight truncate">
                                  {tenant.full_name}
                                </p>
                                {tenant.phone ? (
                                  <a 
                                    href={`tel:${tenant.phone}`} 
                                    className="inline-flex items-center gap-1.5 mt-1 text-[13px] font-semibold text-brand hover:text-brand-dark transition-colors"
                                  >
                                    <i className="fa-solid fa-phone text-[11px]"></i>
                                    {tenant.phone}
                                  </a>
                                ) : (
                                  <p className="mt-1 text-[12px] text-slate-400 italic">Chưa có SĐT</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 ${roleCfg.bg}`}>
                                    <i className={`fa-solid ${roleCfg.icon} text-[9px]`}></i>
                                    {roleCfg.label}
                                  </span>
                                  {resident.move_in_date && (
                                    <span className="text-[11px] text-slate-400">
                                      Vào: {new Date(resident.move_in_date).toLocaleDateString('vi-VN')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- FOOTER --- */}
          <div className="px-5 py-3.5 border-t border-slate-200 bg-white shrink-0 sticky bottom-0 z-20 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-[14px] font-bold hover:bg-slate-200 transition-colors w-full sm:w-auto text-center"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL ZOOM ẢNH (CHẾ ĐỘ XEM TOÀN MÀN HÌNH) --- */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setZoomedImage(null)} // Click ra ngoài hoặc vào ảnh để đóng
        >
          {/* Nút đóng góc phải */}
          <button
            type="button"
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            title="Đóng"
          >
            <i className="fa-solid fa-xmark text-[20px]"></i>
          </button>
          
          {/* Ảnh được phóng to */}
          <img 
            src={zoomedImage} 
            alt="Zoomed room" 
            className="max-w-full max-h-full object-contain rounded-lg cursor-zoom-out shadow-2xl"
          />
        </div>
      )}
    </>
  );
}