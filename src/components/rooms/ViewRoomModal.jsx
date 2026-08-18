import React, { useEffect, useState } from "react";
import invoiceService from "@/services/invoiceService";
import utilityService from "@/services/utilityService";

const ROOM_AMENITIES_MAP = {
  air_conditioner: { label: "Máy lạnh", icon: "fa-snowflake" },
  heater: { label: "Nóng lạnh", icon: "fa-fire" },
  wifi: { label: "Wifi", icon: "fa-wifi" },
  cooking: { label: "Nấu ăn", icon: "fa-kitchen-set" },
  camera: { label: "Camera", icon: "fa-video" },
  balcony: { label: "Ban công", icon: "fa-sun" },
  mezzanine: { label: "Gác lửng", icon: "fa-stairs" },
  parking: { label: "Giữ xe", icon: "fa-motorcycle" },
  free_hours: { label: "Giờ tự do", icon: "fa-clock" },
};

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

const getInvoiceStatusConfig = (status) => {
  switch (status) {
    case "paid":
      return { label: "Đã thu đủ", badge: "bg-emerald-50 text-emerald-600 border-emerald-200" };
    case "partially_paid":
      return { label: "Thu 1 phần", badge: "bg-blue-50 text-blue-600 border-blue-200" };
    case "issued":
    case "overdue":
      return { label: status === "overdue" ? "Quá hạn" : "Chờ thu", badge: "bg-red-50 text-red-600 border-red-200" };
    case "draft":
      return { label: "Bản nháp", badge: "bg-amber-50 text-amber-600 border-amber-200" };
    case "cancelled":
      return { label: "Đã hủy", badge: "bg-slate-50 text-slate-500 border-slate-200" };
    default:
      return { label: "Không rõ", badge: "bg-slate-50 text-slate-500 border-slate-200" };
  }
};

export default function ViewRoomModal({ open, onClose, room, isLoading = false }) {
  const [activeImage, setActiveImage] = useState("");
  // Thêm state quản lý ảnh đang phóng to
  const [zoomedImage, setZoomedImage] = useState(null);

  const [recentInvoices, setRecentInvoices] = useState([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  const [latestUtilities, setLatestUtilities] = useState({ electricity: null, water: null });
  const [isLoadingUtilities, setIsLoadingUtilities] = useState(false);

  useEffect(() => {
    if (!open || !room?.id) {
      setRecentInvoices([]);
      setLatestUtilities({ electricity: null, water: null }); // Reset
      return;
    }

    const fetchInvoices = async () => {
      try {
        setIsLoadingInvoices(true);
        const res = await invoiceService.getAll({
          room_id: room.id,
          per_page: 2, // Lấy đúng 2 hóa đơn mới nhất
          include_details: 1 // Bao gồm chi tiết các khoản thu
        });
        setRecentInvoices(res.data?.data || []);
      } catch (error) {
        console.error("Lỗi lấy hóa đơn:", error);
      } finally {
        setIsLoadingInvoices(false);
      }
    };

    // --- HÀM CALL API ĐIỆN NƯỚC ---
    const fetchUtilities = async () => {
      try {
        setIsLoadingUtilities(true);
        const res = await utilityService.getAll({ room_id: room.id, per_page: 10 });
        const data = res.data?.data || [];
        setLatestUtilities({
          // Chỉ lấy record đầu tiên tìm thấy (mới nhất)
          electricity: data.find(r => r.type === 'electricity') || null,
          water: data.find(r => r.type === 'water') || null
        });
      } catch (error) {
        console.error("Lỗi lấy điện nước:", error);
      } finally {
        setIsLoadingUtilities(false);
      }
    };

    fetchInvoices();
    fetchUtilities(); // Gọi hàm
  }, [open, room]);

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

  // --- HÀM RENDER CHỈ SỐ GỌN NHẸ ---
  const renderSimpleUtility = (typeLabel, iconClass, unit, reading, colorClass, textColor) => {
    if (!reading) {
      return (
        <div className="border-t border-slate-100 p-4 text-[12px] text-slate-500 italic">
          Chưa có dữ liệu chốt số {typeLabel.toLowerCase()}.
        </div>
      );
    }

    return (
      <div className="border-t border-slate-100 p-4 flex gap-4 items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${colorClass}`}>
              <i className={`fa-solid ${iconClass} text-[12px]`}></i>
            </div>
            <span className="font-bold text-slate-800 text-[13px]">{typeLabel}</span>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-auto">
              Chốt: {new Date(reading.reading_date).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div className="flex items-baseline gap-1 mb-1">
            <span className={`text-[20px] font-black ${textColor}`}>{reading.usage}</span>
            <span className="text-[12px] font-bold text-slate-500">{unit}</span>
          </div>
          <div className="text-[12px] text-slate-500 font-medium">
            Số cũ: {reading.previous_reading} <i className="fa-solid fa-arrow-right mx-1 text-[10px] text-slate-300"></i> Mới: {reading.current_reading}
          </div>
        </div>

        {/* Hình ảnh chứng minh */}
        <div
          className="w-[60px] h-[60px] rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-zoom-in relative group mt-1"
          onClick={() => reading.meter_image ? setZoomedImage(reading.meter_image) : null}
        >
          {reading.meter_image ? (
            <>
              <img src={reading.meter_image} className="w-full h-full object-cover" alt="Đồng hồ" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-expand text-white text-[12px]"></i>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <i className="fa-regular fa-image text-lg"></i>
            </div>
          )}
        </div>
      </div>
    );
  };

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
          className="bg-slate-50 w-full h-[95vh] lg:max-w-[1200px] xl:max-w-[1300px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]"
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
          <div className="flex-1 p-4 sm:p-2 overflow-hidden flex flex-col">
            <div className="sm:hidden mb-4">
              <span className={`px-2.5 py-1 text-[11px] font-bold border rounded-md uppercase tracking-wide inline-flex items-center gap-1.5 ${statusConfig.badgeClass}`}>
                <i className={`fa-solid ${statusConfig.icon}`}></i>
                {room.status_label || statusConfig.label}
              </span>
            </div>

            {/* ========================================================== */}
            {/* LAYOUT 3 CỘT MỚI: HÓA ĐƠN -> PHÒNG -> KHÁCH & ĐIỆN NƯỚC */}
            {/* ========================================================== */}
            <div className="flex flex-col lg:flex-row gap-2 h-full overflow-y-auto lg:overflow-hidden no-scrollbar">

              {/* CỘT 1 (TRÁI): TÀI CHÍNH (HÓA ĐƠN) */}
              <div className="lg:w-[320px] xl:w-[350px] flex flex-col gap-5 lg:overflow-y-auto no-scrollbar lg:pr-1 shrink-0 pb-0 lg:h-full">

                {/* --- KHỐI HÓA ĐƠN MỚI NÀY VÀO NGAY DƯỚI ĐÓ --- */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col lg:h-full">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-file-invoice-dollar text-brand text-[13px]"></i>
                      <h3 className="text-[14px] font-bold text-slate-800">Hóa đơn gần đây</h3>
                    </div>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
                    {isLoadingInvoices ? (
                      // Skeleton loading đẹp mắt
                      <div className="space-y-3">
                        <div className="h-[68px] bg-slate-100 rounded-xl animate-pulse"></div>
                        <div className="h-[68px] bg-slate-100 rounded-xl animate-pulse"></div>
                      </div>
                    ) : recentInvoices.length === 0 ? (
                      // Trạng thái trống
                      <div className="text-center py-6 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                          <i className="fa-solid fa-receipt text-xl"></i>
                        </div>
                        <p className="text-[13px] text-slate-500 font-medium">Phòng này chưa có hóa đơn nào.</p>
                      </div>
                    ) : (
                      // Danh sách hóa đơn có hiển thị chi tiết (Replace đoạn list cũ bằng đoạn này)
                      <div className="flex flex-col gap-4">
                        {recentInvoices.map((invoice) => {
                          const invStatus = getInvoiceStatusConfig(invoice.status);
                          const periodLabel = invoice.period_from
                            ? `${new Date(invoice.period_from).getDate()} tháng ${new Date(invoice.period_from).getMonth() + 1} /${new Date(invoice.period_from).getFullYear()}`
                            : "---";


                          return (
                            <div key={invoice.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-colors hover:border-brand/30">

                              {/* HEADER HÓA ĐƠN */}
                              <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                                <div>
                                  <p className="text-[13px] font-bold text-slate-800">{invoice.invoice_code}</p>
                                  <p className="text-[11px] text-slate-800 mt-0.5">
                                    <i className="fa-regular fa-calendar text-[10px] mr-1"></i>Kỳ: {periodLabel}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[14px] font-bold text-brand">{formatCurrency(invoice.total_amount)}</p>
                                  <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold border rounded ${invStatus.badge}`}>
                                    {invStatus.label}
                                  </span>
                                </div>
                              </div>

                              {/* CHI TIẾT CÁC KHOẢN THU (ITEMS) */}
                              <div className="p-3 bg-white flex flex-col gap-2.5">
                                {invoice.items?.map((item) => {
                                  const isUtility = ["electricity", "water"].includes(item.charge_type);
                                  const meter = invoice.meter_readings?.find((m) => m.type === item.charge_type);
                                  const quantity = parseFloat(item.quantity) || 0;
                                  const price = Number(item.unit_price_snapshot) || 0;

                                  let subText = null;
                                  // Xử lý logic hiển thị sub text giống hệt biên lai
                                  if (item.charge_type === 'room') {
                                    subText = `${quantity} ${item.unit} x ${formatCurrency(price)}`;
                                  } else if (isUtility && meter) {
                                    subText = `Mới: ${meter.current_reading} - Cũ: ${meter.previous_reading} (${quantity} ${item.unit})`;
                                  } else if (quantity > 1) {
                                    subText = `${quantity} ${item.unit} x ${formatCurrency(price)}`;
                                  }

                                  return (
                                    <div key={item.id} className="flex justify-between items-start text-[12px] leading-tight">
                                      <div className="flex-1 pr-2">
                                        <span className="font-semibold text-slate-700">{item.description}</span>
                                        {subText && (
                                          <span className="block text-[11px] text-slate-800 mt-0.5">
                                            {subText}
                                          </span>
                                        )}
                                      </div>
                                      <div className="font-semibold text-slate-800 text-right whitespace-nowrap">
                                        {formatCurrency(item.amount)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* CỘT 2 (GIỮA): THÔNG TIN PHÒNG CHÍNH */}
              <div className="lg:flex-1 lg:h-full shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm lg:overflow-hidden flex flex-col">
                <div className="lg:flex-1 lg:overflow-y-auto no-scrollbar p-4 flex flex-col gap-4">
                  {/* 1. Khu vực Ảnh (Không dùng Card nữa, bo góc trực tiếp ảnh chính) */}
                  <div className="flex flex-col gap-3 shrink-0 mt-1">
                    {activeImage ? (
                      <div className="w-full relative group">
                        <img
                          src={activeImage}
                          alt={room.name}
                          onClick={() => setZoomedImage(activeImage)}
                          className="w-full h-[240px] sm:h-[280px] object-cover rounded-2xl cursor-zoom-in shadow-sm border border-slate-100"
                        />
                        <button
                          onClick={() => setZoomedImage(activeImage)}
                          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Phóng to ảnh"
                        >
                          <i className="fa-solid fa-expand text-[13px]"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-[240px] bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                        <i className="fa-regular fa-image text-3xl mb-2"></i>
                        <span className="text-[13px]">Phòng chưa có hình ảnh</span>
                      </div>
                    )}

                    {/* Ảnh nhỏ (Thumbnails) */}
                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img.image_url}
                            alt={`Thumbnail ${idx}`}
                            onClick={() => setActiveImage(img.image_url)}
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 cursor-pointer transition-all border-2 ${img.image_url === activeImage
                              ? 'border-brand scale-[1.02] shadow-sm'
                              : 'border-transparent opacity-70 hover:opacity-100 bg-slate-100'
                              }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <hr className="border-slate-500" />

                  {/* 2. Thông tin cơ bản */}
                  <div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <i className="fa-solid fa-circle-info text-brand"></i> Chi tiết phòng
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Giá thuê</p>
                        <p className="text-[15px] font-bold text-brand">{formatCurrency(room.current_price)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Tiền thế chân</p>
                        <p className="text-[15px] font-bold text-brand">{formatCurrency(room.deposit_amount)}</p>
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
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Quy định thu tiền</p>
                        <p className="text-[14px] font-semibold text-slate-800">{getBillingDayLabel(room.billing_day)}</p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-50 flex items-center gap-6 text-[13px]">
                      <div className="flex items-center gap-1.5">
                        {room.allow_shared ? (
                          <i className="fa-solid fa-check-circle text-green-500 text-[15px]"></i>
                        ) : (
                          <i className="fa-solid fa-circle-xmark text-slate-300 text-[15px]"></i>
                        )}
                        <span className={room.allow_shared ? "text-slate-700 font-medium" : "text-slate-400"}>Cho ở ghép</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {room.is_public ? (
                          <i className="fa-solid fa-check-circle text-green-500 text-[15px]"></i>
                        ) : (
                          <i className="fa-solid fa-circle-xmark text-slate-300 text-[15px]"></i>
                        )}
                        <span className={room.is_public ? "text-slate-700 font-medium" : "text-slate-400"}>Đăng công khai</span>
                      </div>
                    </div>
                  </div>

                  {room.description && (
                    <>
                      <hr className="border-slate-500" />
                      {/* 3. Mô tả */}
                      <div>
                        <h3 className="text-[16px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <i className="fa-solid fa-align-left text-brand"></i> Mô tả & Ghi chú
                        </h3>
                        <p className="text-[13.5px] text-slate-600 whitespace-pre-line leading-relaxed">
                          {room.description}
                        </p>
                      </div>
                    </>
                  )}

                  {room.amenities && room.amenities.length > 0 && (
                    <>
                      <hr className="border-slate-500" />
                      {/* 4. Tiện ích */}
                      <div>
                        <h3 className="text-[16px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <i className="fa-solid fa-list-check text-brand"></i> Tiện ích phòng
                        </h3>
                        <div className="flex flex-wrap gap-2.5">
                          {room.amenities.map((amenityKey) => {
                            const amenity = ROOM_AMENITIES_MAP[amenityKey];
                            if (!amenity) return null;
                            return (
                              <span
                                key={amenityKey}
                                className="bg-slate-100 border border-slate-200 text-slate-600 text-[12.5px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-2"
                              >
                                <i className={`fa-solid ${amenity.icon} text-slate-400 text-[12px]`}></i>
                                {amenity.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* CỘT 3 (PHẢI): KHÁCH & ĐIỆN NƯỚC */}
              <div className="lg:w-[320px] xl:w-[350px] flex flex-col gap-5 lg:overflow-y-auto no-scrollbar lg:pr-1 shrink-0 pb-4 lg:h-full">
                {/* CỘT PHẢI: THÔNG TIN KHÁCH THUÊ */}

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm  flex flex-col">
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
                      <div className="text-center py-10 flex flex-col items-center justify-center min-h-[160px]">
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
                          if (!tenant) return null;

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

                {/* KHỐI CHỈ SỐ ĐIỆN NƯỚC  */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="px-4 py-3 bg-slate-50/50 flex items-center justify-between sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-bolt text-brand text-[13px]"></i>
                      <h3 className="text-[14px] font-bold text-slate-800">Chỉ số gần nhất</h3>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    {isLoadingUtilities ? (
                      <div className="p-5 text-center text-slate-400">
                        <i className="fa-solid fa-spinner animate-spin text-brand text-lg mb-2"></i>
                        <p className="text-[12px]">Đang tải chỉ số...</p>
                      </div>
                    ) : (
                      <>
                        {renderSimpleUtility('Điện', 'fa-bolt', 'kWh', latestUtilities.electricity, 'bg-amber-50 text-amber-500', 'text-amber-600')}
                        {renderSimpleUtility('Nước', 'fa-droplet', 'm³', latestUtilities.water, 'bg-blue-50 text-blue-500', 'text-blue-600')}
                      </>
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
      {
        zoomedImage && (
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
        )
      }
    </>
  );
}