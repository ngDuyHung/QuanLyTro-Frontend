import React from "react";

// Helper định dạng ngày tháng
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

// Helper cấu hình UI cho Điện / Nước
const getTypeConfig = (type) => {
  if (type === "electricity") {
    return { label: "Điện", icon: "fa-bolt", className: "bg-amber-50 text-amber-600 border-amber-200", unit: "kWh" };
  }
  return { label: "Nước", icon: "fa-droplet", className: "bg-blue-50 text-blue-500 border-blue-200", unit: "m³" };
};

export default function UtilitiesTable({
  readings = [],
  properties = [],
  pagination,
  page,
  onPageChange,
  isLoading = false,
  propertyId = "",
  onPropertyIdChange,
  type = "",
  onTypeChange,
  month = "",
  onMonthChange,
  onOpenAddModal,
  onOpenEditModal,
  onOpenViewModal,
  onOpenDeleteModal,
}) {
  return (
    <>
      {/* THANH CÔNG CỤ (FILTERS & ACTIONS) */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          
          {/* Chọn Khu nhà */}
          <div className="relative w-full sm:w-auto min-w-[160px]">
            <select
              value={propertyId}
              onChange={(e) => onPropertyIdChange?.(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm"
            >
              <option value="">Khu nhà: Tất cả</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
          </div>

          {/* Chọn Loại (Điện/Nước) */}
          <div className="relative w-full sm:w-auto min-w-[140px]">
            <select
              value={type}
              onChange={(e) => onTypeChange?.(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm"
            >
              <option value="">Dịch vụ: Tất cả</option>
              <option value="electricity">Chỉ số Điện</option>
              <option value="water">Chỉ số Nước</option>
            </select>
            <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
          </div>

          {/* Chọn Kỳ chốt (Tháng) */}
          <div className="relative w-full sm:w-auto">
            <input
              type="month"
              value={month}
              onChange={(e) => onMonthChange?.(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand shadow-sm cursor-pointer"
              title="Lọc theo kỳ chốt số"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto ml-auto">
          {/* Nút Thêm */}
          <button
            onClick={onOpenAddModal}
            className="flex-1 lg:flex-none bg-brand text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-600/20"
          >
            <i className="fa-solid fa-plus text-[12px]"></i> Ghi chỉ số mới
          </button>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Phòng / Khu nhà</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Loại Dịch Vụ</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Ngày chốt</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Số cũ</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Số mới</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Tiêu thụ</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-center">Tình trạng</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-center w-[120px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 animate-pulse">
                    <td colSpan={8} className="py-3 px-4"><div className="h-10 bg-slate-100 rounded"></div></td>
                  </tr>
                ))
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <i className="fa-solid fa-clipboard-list text-3xl text-slate-200 mb-3"></i>
                      <p>Chưa có dữ liệu chỉ số trong kỳ này.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                readings.map((reading, index) => {
                  const typeConfig = getTypeConfig(reading.type);
                  const isLocked = reading.is_invoiced; // Đã lập HĐ thì khóa sửa/xóa

                  return (
                    <tr key={reading.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[14px]">
                            {reading.room_name}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5 max-w-[150px] truncate">
                            {reading.property_name}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md flex items-center gap-1.5 w-fit ${typeConfig.className}`}>
                          <i className={`fa-solid ${typeConfig.icon}`}></i> {typeConfig.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {formatDate(reading.reading_date)}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-500">
                        {reading.previous_reading.toLocaleString('vi-VN')}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-800">
                        {reading.current_reading.toLocaleString('vi-VN')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-brand text-[14px]">
                          {reading.usage.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1">{typeConfig.unit}</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isLocked ? (
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded text-[10px] font-semibold" title="Chỉ số đã được chốt vào hóa đơn">
                            Đã lập HĐ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-600 rounded text-[10px] font-semibold">
                            Sẵn sàng
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => onOpenViewModal?.(reading)}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-green-50 flex items-center justify-center bg-white transition-colors"
                            title="Xem chi tiết"
                          >
                            <i className="fa-regular fa-eye"></i>
                          </button>
                          
                          {/* Chỉnh sửa */}
                          <button
                            type="button"
                            onClick={() => onOpenEditModal?.(reading)}
                            disabled={isLocked}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 flex items-center justify-center bg-white transition-colors disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:hover:bg-white disabled:cursor-not-allowed"
                            title={isLocked ? "Không thể sửa vì đã lập hóa đơn" : "Chỉnh sửa"}
                          >
                            <i className="fa-solid fa-pen-to-square text-[12px]"></i>
                          </button>
                          
                          {/* Xóa */}
                          <button
                            type="button"
                            onClick={() => onOpenDeleteModal?.(reading)}
                            disabled={isLocked}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-600 hover:bg-red-50 flex items-center justify-center bg-white transition-colors disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:hover:bg-white disabled:cursor-not-allowed"
                            title={isLocked ? "Không thể xóa vì đã lập hóa đơn" : "Xóa chỉ số"}
                          >
                            <i className="fa-regular fa-trash-can text-[13px]"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-[12px] text-slate-500">
            Hiển thị 1 - {readings.length} trong tổng số {pagination?.total || readings.length} bản ghi
          </span>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
                className="w-8 h-8 rounded flex items-center justify-center text-slate-400 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <i className="fa-solid fa-angle-left text-[12px]"></i>
              </button>
              <button className="w-8 h-8 rounded flex items-center justify-center bg-brand text-white font-medium text-[13px]">
                {page}
              </button>
              <button
                disabled={!pagination?.next_page_url}
                onClick={() => onPageChange?.(page + 1)}
                className="w-8 h-8 rounded flex items-center justify-center text-slate-400 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <i className="fa-solid fa-angle-right text-[12px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}