import React from "react";

// --- Helpers UI ---
const formatCurrency = (amount) => {
  return Number(amount).toLocaleString("vi-VN");
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const getDirectionConfig = (direction) => {
  if (direction === "income") {
    return { label: "Thu tiền", className: "text-green-600 bg-green-50 border-green-100", icon: "fa-arrow-down-long" };
  }
  return { label: "Chi tiền", className: "text-red-600 bg-red-50 border-red-100", icon: "fa-arrow-up-long" };
};

const getStatusConfig = (status) => {
  if (status === "cancelled") return { label: "Đã hủy", className: "bg-slate-100 text-slate-400 border-slate-200 line-through" };
  if (status === "pending") return { label: "Chờ duyệt", className: "bg-amber-50 text-amber-600 border-amber-200 animate-pulse" }; // THÊM DÒNG NÀY
  return { label: "Thành công", className: "bg-green-50 text-green-600 border-green-200" };
};

const getBadgeConfig = (item, index, page) => {
  // Vì API đã sắp xếp mới nhất lên đầu, dòng đầu tiên của trang 1 luôn là mới nhất
  const isNewest = page === 1 && index === 0;

  // Ưu tiên dùng created_at để lấy giờ/phút chính xác
  const dateStr = item.created_at || item.transaction_date;
  if (!dateStr) return null;

  const dateObj = new Date(dateStr);
  const today = new Date();
  const isToday = dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();

  if (isNewest) {
    return { label: "MỚI", className: "bg-red-500 text-white animate-pulse shadow-sm" };
  }

  if (isToday) {
    const time = dateObj.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    return { label: time, className: "bg-blue-50 text-blue-600 border border-blue-200" };
  }

  return null;
};

export default function FinancialTransactionsTable({
  transactions = [],
  properties = [],
  pagination,
  page,
  onPageChange,
  isLoading = false,
  propertyId,
  onPropertyIdChange,
  direction,
  onDirectionChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onOpenAddModal,
  onOpenViewModal,
  onOpenCancelModal,
}) {
  return (
    <>
      {/* THANH CÔNG CỤ */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">

          <select
            value={propertyId}
            onChange={(e) => onPropertyIdChange?.(e.target.value)}
            className="flex-1 lg:flex-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none"
          >
            <option value="">Khu nhà: Tất cả</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select
            value={direction}
            onChange={(e) => onDirectionChange?.(e.target.value)}
            className="flex-1 lg:flex-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none"
          >
            <option value="">Loại: Tất cả</option>
            <option value="income">Dòng tiền thu</option>
            <option value="expense">Dòng tiền chi</option>
          </select>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <input
              type="date" value={dateFrom} onChange={(e) => onDateFromChange?.(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date" value={dateTo} onChange={(e) => onDateToChange?.(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none"
            />
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="w-full lg:w-auto bg-brand text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm"
        >
          <i className="fa-solid fa-plus"></i> Tạo phiếu mới
        </button>
      </div>

      <div className="bg-transparent lg:bg-white border-none lg:border lg:border-slate-200 lg:rounded-xl shadow-none lg:shadow-sm overflow-hidden flex flex-col">

        {/* --- MOBILE VIEW (CARDS) --- */}
        <div className="lg:hidden flex flex-col gap-3 pb-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 bg-white border border-slate-200 rounded-xl animate-pulse"></div>
            ))
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-[13px]">Chưa có dữ liệu thu chi.</div>
          ) : (
            transactions.map((item, index) => {
              const dir = getDirectionConfig(item.direction);
              const status = getStatusConfig(item.status);
              const badge = getBadgeConfig(item, index, page);
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${dir.className}`}>
                        <i className={`fa-solid ${dir.icon}`}></i>
                      </div>
                      <div className="flex flex-col">
                        {/* HIỂN THỊ MÃ GD VÀ LABEL */}
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-[14px]">{item.transaction_code}</span>
                          {badge && (
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${badge.className}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-800 text-[14px]">{item.transaction_code}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                          <span>{formatDate(item.transaction_date)}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{item.method_label}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${status.className}`}>{status.label}</span>
                  </div>

                  <div className="mb-3">
                    {/* BỔ SUNG TÊN DANH MỤC */}
                    <div className="mb-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold border border-slate-200">
                        {item.category_label}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 line-clamp-2">{item.description}</p>

                    {/* BỔ SUNG NGƯỜI GIAO DỊCH */}
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                      <i className="fa-solid fa-location-dot text-slate-400"></i>
                      {item.room ? (
                        <span><strong className="text-slate-700">{item.room.name}</strong> ({item.property?.name})</span>
                      ) : (
                        <span>{item.property?.name} (Chi phí chung)</span>
                      )}
                      {item.tenant && <span>- Khách: {item.tenant.full_name}</span>}
                    </p>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Số tiền</span>
                      <span className={`text-[17px] font-black ${item.direction === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.direction === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onOpenViewModal(item)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center"><i className="fa-regular fa-eye"></i></button>
                      {item.status !== 'cancelled' && (
                        <button onClick={() => onOpenCancelModal(item)} className="w-9 h-9 rounded-lg bg-white text-red-400 border border-red-100 flex items-center justify-center"><i className="fa-solid fa-ban"></i></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- DESKTOP VIEW (TABLE) --- */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr className="text-[13px] font-semibold text-slate-600">
                <th className="py-4 px-3 w-[110px]">Ngày / Mã GD</th>
                <th className="py-4 px-3 w-[110px]">Loại GD</th>
                <th className="py-4 px-3 w-[150px]">Danh mục nghiệp vụ</th>
                <th className="py-4 px-3 w-[140px]">Phòng / Khu nhà</th>
                <th className="py-4 px-3 w-[150px]">Người giao dịch</th>
                <th className="py-4 px-3">Nội dung diễn giải</th>
                <th className="py-4 px-3 text-right w-[140px]">Số tiền (đ)</th>
                <th className="py-4 px-3 text-center w-[120px]">Phương thức</th>
                <th className="py-4 px-3 text-center w-[110px]">Trạng thái</th>
                <th className="py-4 px-3 text-center w-[90px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {isLoading ? (
                // --- TRẠNG THÁI LOADING (SKELETON) ---
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 animate-pulse">
                    <td colSpan={11} className="py-3.5 px-3">
                      <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                // --- TRẠNG THÁI RỖNG (KHÔNG CÓ DỮ LIỆU) ---
                <tr>
                  <td colSpan={11} className="py-16 px-4 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <i className="fa-solid fa-file-invoice-dollar text-4xl text-slate-200 mb-3"></i>
                      <p className="text-[14px] font-medium text-slate-500">Chưa có giao dịch thu chi nào.</p>
                      <p className="text-[12px] mt-1">Hãy bấm "Tạo phiếu mới" để ghi nhận dòng tiền.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((item, index) => {
                  const dir = getDirectionConfig(item.direction);
                  const badge = getBadgeConfig(item, index, page);
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">

                      {/* Ngày / Mã GD */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col font-medium">
                          {/* HIỂN THỊ NGÀY VÀ LABEL */}
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800">{formatDate(item.transaction_date)}</span>
                            {badge && (
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded leading-none ${badge.className}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 mt-0.5 font-mono">{item.transaction_code}</span>
                        </div>
                      </td>

                      {/* 3. Loại dòng tiền (Thu / Chi) */}
                      <td className="py-4 px-3">
                        <span className={`px-2 py-0.5 border text-[11px] font-bold rounded flex items-center gap-1.5 w-fit ${dir.className}`}>
                          <i className={`fa-solid ${dir.icon} text-[10px]`}></i> {dir.label}
                        </span>
                      </td>

                      {/* 4. Danh mục nghiệp vụ */}
                      <td className="py-4 px-3 text-slate-800 font-semibold">
                        {item.category_label}
                      </td>

                      {/* 5. Phòng / Khu nhà */}
                      <td className="py-4 px-3">
                        <div className="flex flex-col">
                          <span className="text-slate-700 font-medium">
                            {item.room?.name || "Chi phí chung"}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            {item.property?.name}
                          </span>
                        </div>
                      </td>

                      {/* 6. Người giao dịch (Khách thuê) */}
                      <td className="py-4 px-3 text-slate-600 font-medium">
                        {item.tenant?.full_name || "—"}
                      </td>

                      {/* 7. Nội dung diễn giải */}
                      <td className="py-4 px-3 text-slate-600 max-w-[220px] truncate" title={item.description}>
                        {item.description || "—"}
                      </td>

                      {/* 8. Số tiền dòng tiền */}
                      <td className={`py-4 px-3 text-right font-black text-[15px] ${item.direction === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.direction === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </td>

                      {/* 9. Phương thức thanh toán độc lập */}
                      <td className="py-4 px-3 text-center">
                        <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                          {item.method === 'sepay' ? (
                            <><i className="fa-solid fa-robot text-blue-500"></i> SePay</>
                          ) : item.method === 'bank_transfer' ? (
                            <><i className="fa-solid fa-building-columns text-amber-500"></i> Chuyển khoản</>
                          ) : (
                            <><i className="fa-solid fa-money-bill-1-wave text-green-500"></i> Tiền mặt</>
                          )}
                        </span>
                      </td>

                      {/* 10. Trạng thái phiếu */}
                      <td className="py-4 px-3 text-center">
                        <span className={`px-2 py-0.5 border rounded text-[11px] font-bold ${getStatusConfig(item.status).className}`}>
                          {getStatusConfig(item.status).label}
                        </span>
                      </td>

                      {/* 11. Các nút Thao tác nhanh */}
                      <td className="py-4 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenViewModal(item)}
                            className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-green-50 transition-colors flex items-center justify-center"
                            title="Xem chi tiết"
                          >
                            <i className="fa-regular fa-eye text-[12px]"></i>
                          </button>
                          {item.status !== 'cancelled' && (
                            <button
                              onClick={() => onOpenCancelModal(item)}
                              className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                              title="Hủy bỏ phiếu"
                            >
                              <i className="fa-solid fa-ban text-[12px]"></i>
                            </button>
                          )}
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
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex justify-between items-center">
          <span className="text-[12px] text-slate-500">Trang {page} / {pagination?.last_page || 1}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="w-8 h-8 rounded border border-slate-200 disabled:opacity-50"><i className="fa-solid fa-angle-left"></i></button>
            <button disabled={!pagination?.next_page_url} onClick={() => onPageChange(page + 1)} className="w-8 h-8 rounded border border-slate-200 disabled:opacity-50"><i className="fa-solid fa-angle-right"></i></button>
          </div>
        </div>
      </div>
    </>
  );
}