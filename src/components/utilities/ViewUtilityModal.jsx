import React, { useState, useEffect } from "react";
import utilityService from "@/services/utilityService";

// Helper định dạng ngày tháng
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const getTypeConfig = (type) => {
  if (type === "electricity") {
    return { label: "Điện", icon: "fa-bolt", className: "bg-amber-50 text-amber-600 border-amber-200", unit: "kWh" };
  }
  return { label: "Nước", icon: "fa-droplet", className: "bg-blue-50 text-blue-500 border-blue-200", unit: "m³" };
};

export default function ViewUtilityModal({ open, reading, onClose }) {
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Khóa cuộn nền khi mở modal
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Tự động tải lịch sử tiêu thụ của riêng phòng này qua các kỳ trước
  useEffect(() => {
    if (!open || !reading) return;

    const fetchRoomHistory = async () => {
      try {
        setIsLoadingHistory(true);
        // Tận dụng API có sẵn, lọc theo Khu nhà và Loại dịch vụ trước để tối ưu hóa dữ liệu
        const response = await utilityService.getAll({
          property_id: reading.property_id,
          type: reading.type,
          per_page: 50,
        });

        // Lọc lại trên FE các bản ghi của cùng tên phòng, loại bỏ bản ghi hiện tại đang xem
        const filteredHistory = (response.data.data || [])
          .filter((item) => item.room_name === reading.room_name && item.id !== reading.id)
          .slice(0, 4); // Lấy tối đa 4 kỳ gần nhất để hiển thị timeline

        setHistory(filteredHistory);
      } catch (error) {
        console.error("Không thể tải lịch sử tiêu thụ của phòng", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchRoomHistory();
  }, [open, reading]);

  if (!open || !reading) return null;

  const typeConfig = getTypeConfig(reading.type);

  // === LOGIC TÍNH TOÁN BIẾN ĐỘNG  ===
  const previousMonthUsage = history.length > 0 ? history[0].usage : null;
  let usageDiff = 0;
  let usagePercent = 0;
  let isWarning = false;

  if (previousMonthUsage !== null && previousMonthUsage > 0) {
    usageDiff = reading.usage - previousMonthUsage;
    usagePercent = (usageDiff / previousMonthUsage) * 100;
    // Cảnh báo đỏ nếu tăng đột biến (Ví dụ: tăng trên 20%)
    isWarning = usagePercent >= 20;
  } else if (previousMonthUsage === 0) {
    // Xử lý case tháng trước dùng 0 số nhưng tháng này có dùng
    usageDiff = reading.usage;
    isWarning = reading.usage > 0; // Tự định nghĩa logic cảnh báo nếu cần
  }
  // ===============================================

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
        {/* Modal Box */}
        <div className="bg-slate-50 w-full h-[92vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[950px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">

          {/* Header - Cố định */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${reading.type === 'electricity' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                <i className={`fa-solid ${typeConfig.icon} text-[16px]`}></i>
              </div>
              <div>
                <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800 leading-tight">
                  Chi tiết số {typeConfig.label} — Phòng {reading.room_name}
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {reading.property_name}
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

          {/* Body - Cuộn nội dung */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* CỘT TRÁI: THÔNG TIN CHI TIẾT KỲ HIỆN TẠI (7 Cột trên PC) */}
              <div className="lg:col-span-7 flex flex-col gap-5">

                {/* Khối hiển thị số lớn */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">Số liệu tiêu thụ kì này</span>
                    <span className="text-[12px] text-slate-500 flex items-center gap-1">
                      <i className="fa-regular fa-calendar"></i> Ngày chốt: <b>{formatDate(reading.reading_date)}</b>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 text-center items-center gap-2">
                    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                      <p className="text-[11px] text-slate-500 font-medium mb-1">Chỉ số cũ</p>
                      <p className="text-[16px] sm:text-[18px] font-bold text-slate-700">{reading.previous_reading.toLocaleString("vi-VN")}</p>
                    </div>
                    <i className="fa-solid fa-minus text-slate-300 text-sm"></i>
                    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                      <p className="text-[11px] text-slate-500 font-medium mb-1">Chỉ số mới</p>
                      <p className="text-[16px] sm:text-[18px] font-bold text-slate-800">{reading.current_reading.toLocaleString("vi-VN")}</p>
                    </div>
                  </div>

                  {/* Khối hiển thị số lượng sử dụng và cảnh báo */}
                  <div className={`mt-4 border rounded-xl p-4 transition-colors ${isWarning ? 'bg-red-50 border-red-200' : 'bg-green-50/60 border-green-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-700">Sử dụng thực tế:</span>
                      <div className="text-right">
                        <span className={`text-[24px] font-black leading-none ${isWarning ? 'text-red-600' : 'text-brand'}`}>
                          {reading.usage.toLocaleString("vi-VN")}
                        </span>
                        <span className={`text-[13px] font-bold ml-1 ${isWarning ? 'text-red-600' : 'text-brand'}`}>
                          {typeConfig.unit}
                        </span>
                      </div>
                    </div>

                    {/* Phần hiển thị so sánh với tháng trước */}
                    {previousMonthUsage !== null && (
                      <div className={`mt-3 pt-3 border-t flex items-center justify-between text-[12px] ${isWarning ? 'border-red-200/60' : 'border-green-200/60'}`}>
                        <span className="text-slate-500">
                          So với kỳ trước ({previousMonthUsage} {typeConfig.unit}):
                        </span>

                        {usageDiff > 0 ? (
                          <span className={`font-bold flex items-center gap-1 ${isWarning ? 'text-red-600' : 'text-orange-500'}`}>
                            <i className="fa-solid fa-arrow-trend-up"></i>
                            Tăng {usageDiff.toLocaleString("vi-VN")} {typeConfig.unit}
                            {previousMonthUsage > 0 && ` (${usagePercent.toFixed(1)}%)`}
                          </span>
                        ) : usageDiff < 0 ? (
                          <span className="font-bold flex items-center gap-1 text-green-600">
                            <i className="fa-solid fa-arrow-trend-down"></i>
                            Giảm {Math.abs(usageDiff).toLocaleString("vi-VN")} {typeConfig.unit}
                          </span>
                        ) : (
                          <span className="font-bold text-slate-500 flex items-center gap-1">
                            <i className="fa-solid fa-minus"></i> Không đổi
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Khối hình ảnh bằng chứng */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className="block text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <i className="fa-regular fa-image text-slate-400"></i> Ảnh chụp đồng hồ thực tế
                  </span>
                  <div className="w-full aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center relative group border border-slate-100">
                    {reading.meter_image ? (
                      <img
                        src={reading.meter_image}
                        alt="Ảnh đồng hồ điện nước"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-slate-400 text-center flex flex-col items-center">
                        <i className="fa-regular fa-images text-3xl mb-2 text-slate-600"></i>
                        <p className="text-[12px]">Kỳ này không tải lên hình ảnh minh chứng</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Khối Thông tin phụ & Trạng thái hóa đơn */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-[13px]">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Người chốt số</span>
                      <span className="font-semibold text-slate-800">{reading.tenant_name || "Chủ trọ"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Trạng thái đối soát</span>
                      <div>
                        {reading.is_invoiced ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 font-semibold rounded text-[11px]">
                            <i className="fa-solid fa-lock text-[9px] mr-1 text-slate-400"></i> Đã khóa vào Hóa đơn
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-green-50 border border-green-200 text-green-600 font-semibold rounded text-[11px]">
                            <i className="fa-solid fa-unlock text-[9px] mr-1 text-green-400"></i> Sẵn sàng lập hóa đơn
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 border-t border-slate-100 pt-2 mt-1">
                      <span className="text-slate-400 block mb-1">Ghi chú kèm theo</span>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium italic min-h-[50px]">
                        {reading.note || "Không có ghi chú nào cho kỳ chốt này."}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* CỘT PHẢI: LỊCH SỬ TIÊU THỤ CÁC KỲ TRƯỚC (5 Cột trên PC) */}
              <div className="lg:col-span-5 flex flex-col h-full">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left text-slate-500 text-[13px]"></i>
                    <h3 className="text-[14px] font-bold text-slate-800">Nhật ký tiêu thụ kỳ trước</h3>
                  </div>

                  <div className="p-4 sm:p-5 flex-1">
                    {isLoadingHistory ? (
                      <div className="py-10 text-center text-slate-400 text-[13px] animate-pulse">
                        <i className="fa-solid fa-spinner animate-spin mb-2 text-xl text-brand"></i>
                        <p>Đang đối soát lịch sử phòng...</p>
                      </div>
                    ) : history.length > 0 ? (
                      <div className="relative border-l-2 border-slate-200/80 ml-2 space-y-5 pb-2">
                        {history.map((hist) => (
                          <div key={hist.id} className="relative pl-5">
                            {/* Chấm tròn mốc thời gian */}
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white"></div>

                            <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase block">Kỳ chốt số</span>
                                <span className="font-bold text-[13px] text-slate-700 mt-0.5 block">
                                  {formatDate(hist.reading_date)}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                  Chỉ số: {hist.previous_reading} → {hist.current_reading}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-[16px] font-extrabold text-slate-800 block">
                                  +{hist.usage.toLocaleString("vi-VN")}
                                </span>
                                <span className="text-[11px] text-slate-400 font-bold">{typeConfig.unit}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-2.5">
                          <i className="fa-solid fa-hourglass-start text-xl text-slate-300"></i>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-500">Đây là kỳ chốt số đầu tiên</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">Phòng này chưa có lịch sử tiêu thụ điện nước ở các tháng trước đó.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer - Cố định */}
          <div className="sticky bottom-0 z-20 border-t border-slate-200 px-5 py-3.5 bg-white flex justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[13px] font-bold hover:bg-slate-200 transition-colors"
            >
              Đóng cửa sổ
            </button>
          </div>

        </div>
      </div>
    </>
  );
}