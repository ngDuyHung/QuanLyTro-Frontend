import React, { useState, useEffect } from "react";
import utilityService from "@/services/utilityService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  // --- STATE  ---
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Khóa cuộn nền khi mở modal
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Gọi API Phân tích 6 tháng
  useEffect(() => {
    if (!open || !reading?.room_id) {
      setAnalysisData(null);
      return;
    }

    const fetchAnalysis = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await utilityService.getAnalysis({
          room_id: reading.room_id,
          type: reading.type,
        });
        setAnalysisData(response.data.data);
      } catch (error) {
        console.error("Không thể tải dữ liệu phân tích", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchAnalysis();
  }, [open, reading]);

  if (!open || !reading) return null;

  const typeConfig = getTypeConfig(reading.type);

  // === LOGIC TÍNH TOÁN BIẾN ĐỘNG SO VỚI THÁNG KỀ TRƯỚC ===
  let previousMonthUsage = null;
  let usageDiff = 0;
  let usagePercent = 0;
  let isWarning = false;

  // Lấy dữ liệu tháng liền kề từ mảng chart_data (phần tử kề cuối)
  if (analysisData?.chart_data?.length > 1) {
    const chartData = analysisData.chart_data;
    previousMonthUsage = chartData[chartData.length - 2].usage;
    usageDiff = reading.usage - previousMonthUsage;
    usagePercent = previousMonthUsage > 0 ? (usageDiff / previousMonthUsage) * 100 : 0;
    isWarning = usagePercent >= 20; // Cảnh báo Đỏ bên trái nếu tăng >20% so với tháng liền kề
  } else if (analysisData?.chart_data?.length === 1) {
    previousMonthUsage = 0;
    usageDiff = reading.usage;
  }

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

              {/* CỘT PHẢI: PHÂN TÍCH TIÊU THỤ 6 THÁNG (5 Cột trên PC) */}
              <div className="lg:col-span-5 flex flex-col gap-5 h-full pb-4">

                {/* KHỐI BIỂU ĐỒ LINE CHART */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[280px]">
                  <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2 shrink-0">
                    <i className="fa-solid fa-chart-line text-brand text-[13px]"></i>
                    <h3 className="text-[14px] font-bold text-slate-800">Biểu đồ tiêu thụ 6 tháng</h3>
                  </div>

                  <div className="p-4 flex-1">
                    {isLoadingHistory ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-[13px] animate-pulse">
                        <i className="fa-solid fa-spinner animate-spin mb-2 text-2xl text-brand"></i>
                        <p>Đang phân tích dữ liệu...</p>
                      </div>
                    ) : analysisData?.chart_data?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analysisData.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                            formatter={(value) => [`${value} ${typeConfig.unit}`, 'Sử dụng']}
                          />
                          <Line
                            type="monotone"
                            dataKey="usage"
                            stroke={reading.type === 'electricity' ? '#f59e0b' : '#3b82f6'}
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                          <i className="fa-solid fa-chart-simple text-xl text-slate-300"></i>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-500">Chưa đủ dữ liệu vẽ biểu đồ</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* KHỐI ĐÁNH GIÁ (SUMMARY BOX) */}
                {!isLoadingHistory && analysisData?.summary?.has_data && (
                  <div className={`rounded-xl border p-4 shadow-sm ${analysisData.summary.status === 'warning_high' ? 'bg-red-50 border-red-200' :
                      analysisData.summary.status === 'warning_low' ? 'bg-blue-50 border-blue-200' :
                        'bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${analysisData.summary.status === 'warning_high' ? 'bg-red-100 text-red-600' :
                          analysisData.summary.status === 'warning_low' ? 'bg-blue-100 text-blue-600' :
                            'bg-emerald-100 text-emerald-600'
                        }`}>
                        <i className={`fa-solid ${analysisData.summary.status === 'warning_high' ? 'fa-arrow-trend-up' :
                            analysisData.summary.status === 'warning_low' ? 'fa-arrow-trend-down' :
                              'fa-check'
                          }`}></i>
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-[14px] font-bold ${analysisData.summary.status === 'warning_high' ? 'text-red-700' :
                            analysisData.summary.status === 'warning_low' ? 'text-blue-700' :
                              'text-emerald-700'
                          }`}>
                          Đánh giá mức độ tiêu thụ
                        </h4>
                        <p className={`text-[13px] mt-1 leading-relaxed ${analysisData.summary.status === 'warning_high' ? 'text-red-600' :
                            analysisData.summary.status === 'warning_low' ? 'text-blue-600' :
                              'text-emerald-600'
                          }`}>
                          {analysisData.summary.message}
                        </p>
                        <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-[12px]">
                          <span className="opacity-70 font-medium">Trung bình {analysisData.summary.data_count} tháng qua:</span>
                          <span className="font-bold">{analysisData.summary.average_6_months} {typeConfig.unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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