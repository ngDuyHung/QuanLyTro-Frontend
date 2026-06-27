import React from "react";

// --- Helpers ---
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "0";
  return Number(amount).toLocaleString("vi-VN");
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("vi-VN");
};

// Cấu hình hiển thị Badge cho Trạng thái
const getStatusConfig = (status) => {
  switch (status) {
    case "draft":
      return { label: "Nháp", className: "bg-slate-100 text-slate-600 border-slate-200", icon: "fa-pen-ruler" };
    case "issued":
      return { label: "Đã phát hành", className: "bg-blue-50 text-blue-600 border-blue-200", icon: "fa-paper-plane" };
    case "partially_paid":
      return { label: "Trả một phần", className: "bg-amber-50 text-amber-600 border-amber-200", icon: "fa-circle-half-stroke" };
    case "paid":
      return { label: "Đã thu đủ", className: "bg-green-50 text-green-600 border-green-200", icon: "fa-check-double" };
    case "overdue":
      return { label: "Quá hạn", className: "bg-red-50 text-red-600 border-red-200", icon: "fa-triangle-exclamation" };
    case "cancelled":
      return { label: "Đã hủy", className: "bg-slate-50 text-slate-400 border-slate-200 line-through", icon: "fa-ban" };
    default:
      return { label: status, className: "bg-slate-100 text-slate-600 border-slate-200", icon: "fa-circle-info" };
  }
};

// Cấu hình hiển thị cho Loại hóa đơn
const getTypeConfig = (type) => {
  switch (type) {
    case "monthly": return "Định kỳ tháng";
    case "checkin": return "Khách mới vào";
    case "checkout": return "Khách dọn đi";
    case "adjustment": return "Điều chỉnh/Khác";
    default: return "Hóa đơn";
  }
};

export default function InvoicesTable({
  invoices = [],
  properties = [],
  rooms = [],
  pagination,
  page,
  onPageChange,
  isLoading = false,

  // Filters
  propertyId = "",
  onPropertyIdChange,
  roomId = "",
  onRoomIdChange,
  status = "",
  onStatusChange,
  invoiceType = "",
  onInvoiceTypeChange,
  month = "",
  onMonthChange,

  // Actions
  onOpenCreateModal,
  onOpenViewModal,
  onOpenPaymentModal,
  onOpenIssueConfirm,
  onOpenCancelModal,
  onOpenDeleteModal,
  onOpenTemplateModal,
}) {
  return (
    <>
      {/* THANH CÔNG CỤ (FILTERS & ACTIONS) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">

          {/* Lọc Khu nhà */}
          <div className="relative w-full sm:w-auto min-w-[150px]">
            <select
              value={propertyId}
              onChange={(e) => onPropertyIdChange?.(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm"
            >
              <option value="">Khu nhà: Tất cả</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
          </div>

          {/* Lọc Phòng (Chỉ hiện phòng khi đã chọn Khu nhà) */}
          <div className="relative w-full sm:w-auto min-w-[130px]">
            <select
              value={roomId}
              onChange={(e) => onRoomIdChange?.(e.target.value)}
              disabled={!propertyId}
              className="w-full pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Phòng: Tất cả</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
          </div>

          {/* Lọc Trạng thái */}
          <div className="relative w-full sm:w-auto min-w-[140px]">
            <select
              value={status}
              onChange={(e) => onStatusChange?.(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm"
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value="draft">Nháp (Chưa chốt)</option>
              <option value="issued">Đã phát hành</option>
              <option value="partially_paid">Trả một phần</option>
              <option value="paid">Đã thu đủ</option>
              <option value="overdue">Quá hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
          </div>

          {/* Lọc Tháng */}
          <div className="relative w-full sm:w-auto min-w-[130px]">
            <input
              type="month"
              value={month}
              onChange={(e) => onMonthChange?.(e.target.value)}
              className="w-full px-3.5 py-[7px] bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand shadow-sm cursor-pointer"
              title="Kỳ hóa đơn"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto shrink-0">
          {/* ---  NÚT MẪU HỢP ĐỒNG --- */}
          <button
            type="button"
            onClick={onOpenTemplateModal}
            className="flex-1 lg:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <i className="fa-solid fa-file-signature text-[13px] text-blue-600"></i> Cấu hình mẫu
          </button>
          {/* ----------------------------- */}
          <button
            onClick={onOpenCreateModal}
            className="flex-1 xl:flex-none bg-brand text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-600/20"
          >
            <i className="fa-solid fa-file-invoice-dollar"></i> Lập hóa đơn
          </button>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-transparent lg:bg-white border-none lg:border lg:border-slate-200 lg:rounded-xl shadow-none lg:shadow-sm lg:overflow-hidden flex flex-col flex-1">
        {/* --- GIAO DIỆN MOBILE (Dạng Card ẩn trên PC) --- */}
        <div className="lg:hidden flex flex-col gap-3 pb-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 bg-white border border-slate-200 rounded-xl animate-pulse"></div>
            ))
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-[13px]">
              <i className="fa-solid fa-receipt text-3xl text-slate-200 mb-3 block"></i>
              Chưa có hóa đơn nào.
            </div>
          ) : (
            invoices.map((invoice) => {
              const statusConf = getStatusConfig(invoice.status);

              return (
                <div key={invoice.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">

                  {/* Header: Tên phòng + Trạng thái */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-[14px] leading-none">{invoice.room?.name || "—"}</span>
                      <span className="text-[11px] text-slate-500 mt-1">{invoice.property?.name || "—"}</span>
                    </div>
                    <span className={`px-2.5 py-1 border text-[10px] font-semibold rounded-md flex items-center gap-1.5 w-fit ${statusConf.className}`}>
                      <i className={`fa-solid ${statusConf.icon} text-[10px]`}></i> {statusConf.label}
                    </span>
                  </div>

                  {/* Body: Chi tiết Hóa đơn */}
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5">
                          <i className="fa-regular fa-file-lines text-slate-400 text-[12px]"></i>
                          {invoice.invoice_code}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">Kỳ: {formatDate(invoice.period_to)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] text-slate-500 mb-0.5">Tổng tiền</span>
                        <span className="font-bold text-slate-800 text-[14px]">{formatCurrency(invoice.total_amount)} đ</span>
                        {Number(invoice.discount_amount) > 0 && (
                          <span className="text-[10px] text-red-500 font-medium">- {formatCurrency(invoice.discount_amount)}</span>
                        )}
                      </div>
                    </div>

                    {/* Hộp tóm tắt công nợ */}
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 mb-0.5">Đã thu</span>
                        <span className="font-medium text-slate-600 text-[13px]">{formatCurrency(invoice.paid_amount)}</span>
                      </div>
                      <div className="h-6 w-px bg-slate-200 mx-2"></div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 mb-0.5">Còn nợ</span>
                        <span className={`font-bold text-[13px] ${Number(invoice.remaining_amount) > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                          {formatCurrency(invoice.remaining_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Thao tác (Tương thích logic như PC) */}
                  <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
                    {/* Nút Xem (Lúc nào cũng hiện) */}
                    <button
                      type="button"
                      onClick={() => onOpenViewModal?.(invoice)}
                      className="flex-1 py-2 border border-slate-200 rounded-lg bg-white text-[12px] font-medium text-slate-600 active:bg-slate-100 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <i className="fa-solid fa-print"></i> Xem / In
                    </button>

                    {/* HIỂN THỊ DÀNH RIÊNG CHO HÓA ĐƠN NHÁP */}
                    {invoice.status === 'draft' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenIssueConfirm?.(invoice)}
                          className="flex-1 py-2 border border-blue-200 rounded-lg bg-blue-50 text-[12px] font-medium text-blue-600 active:bg-blue-100 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <i className="fa-regular fa-paper-plane"></i> Phát hành
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDeleteModal?.(invoice)}
                          className="w-10 flex shrink-0 items-center justify-center border border-red-100 rounded-lg bg-white text-[12px] text-red-500 active:bg-red-50 shadow-sm"
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </>
                    )}

                    {/* HIỂN THỊ DÀNH CHO HÓA ĐƠN ĐÃ PHÁT HÀNH/CÒN NỢ */}
                    {['issued', 'partially_paid', 'overdue'].includes(invoice.status) && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenPaymentModal?.(invoice)}
                          className="flex-1 py-2 border border-green-200 rounded-lg bg-green-50 text-[12px] font-medium text-green-700 active:bg-green-100 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <i className="fa-solid fa-sack-dollar"></i> Thu tiền
                        </button>

                        {Number(invoice.paid_amount) === 0 && (
                          <button
                            type="button"
                            onClick={() => onOpenCancelModal?.(invoice)}
                            className="w-10 flex shrink-0 items-center justify-center border border-slate-200 rounded-lg bg-white text-[12px] text-slate-400 active:bg-slate-50 shadow-sm"
                          >
                            <i className="fa-solid fa-ban"></i>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
        {/* --- KẾT THÚC GIAO DIỆN MOBILE --- */}
        <div className="hidden xl:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1100px]">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 w-[180px]">Mã HĐ / Kỳ</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 w-[180px]">Khu nhà / Phòng</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Tổng tiền (đ)</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Đã thu (đ)</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Còn nợ (đ)</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-center w-[160px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {isLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 animate-pulse">
                    <td colSpan={7} className="py-3 px-4"><div className="h-12 bg-slate-100 rounded"></div></td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 px-4 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <i className="fa-solid fa-receipt text-4xl text-slate-200 mb-3"></i>
                      <p className="text-[14px] font-medium text-slate-500">Chưa có hóa đơn nào.</p>
                      <p className="text-[12px] mt-1">Hãy bấm "Lập hóa đơn" để tạo phiếu thu mới.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const statusConf = getStatusConfig(invoice.status);

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors group">
                      {/* Mã HĐ & Kỳ */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5">
                            <i className="fa-regular fa-file-lines text-slate-400 text-[12px]"></i>
                            {invoice.invoice_code}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5" title={`${formatDate(invoice.period_from)} - ${formatDate(invoice.period_to)}`}>
                            Kỳ: {formatDate(invoice.period_to)}
                          </span>
                        </div>
                      </td>

                      {/* Phòng & Khu */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[14px]">
                            {invoice.room?.name || "—"}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[150px]">
                            {invoice.property?.name || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Tổng tiền */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-slate-800 text-[14px]">
                          {formatCurrency(invoice.total_amount)}
                        </span>
                        {Number(invoice.discount_amount) > 0 && (
                          <span className="block text-[10px] text-red-500 font-medium">
                            - {formatCurrency(invoice.discount_amount)} (Giảm)
                          </span>
                        )}
                      </td>

                      {/* Đã thu */}
                      <td className="py-3 px-4 text-right text-slate-600 font-medium">
                        {formatCurrency(invoice.paid_amount)}
                      </td>

                      {/* Còn nợ */}
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold text-[14px] ${Number(invoice.remaining_amount) > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                          {formatCurrency(invoice.remaining_amount)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md inline-flex items-center gap-1.5 ${statusConf.className}`}>
                          <i className={`fa-solid ${statusConf.icon} text-[10px]`}></i>
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Thao tác (Tự động thích ứng trạng thái) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">

                          {/* Nút Xem (Lúc nào cũng hiện) */}
                          <button
                            type="button"
                            onClick={() => onOpenViewModal?.(invoice)}
                            className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-green-50 flex items-center justify-center bg-white transition-colors"
                            title="Xem phiếu in"
                          >
                            <i className="fa-solid fa-print text-[12px]"></i>
                          </button>

                          {/* HIỂN THỊ DÀNH RIÊNG CHO HÓA ĐƠN NHÁP */}
                          {invoice.status === 'draft' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenIssueConfirm?.(invoice)}
                                className="w-8 h-8 rounded border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center bg-blue-50 transition-colors"
                                title="Phát hành hóa đơn (Chốt nợ)"
                              >
                                <i className="fa-regular fa-paper-plane text-[12px]"></i>
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenDeleteModal?.(invoice)}
                                className="w-8 h-8 rounded border border-red-200 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center bg-red-50 transition-colors"
                                title="Xóa nháp"
                              >
                                <i className="fa-regular fa-trash-can text-[12px]"></i>
                              </button>
                            </>
                          )}

                          {/* HIỂN THỊ DÀNH CHO HÓA ĐƠN ĐÃ PHÁT HÀNH/CÒN NỢ */}
                          {['issued', 'partially_paid', 'overdue'].includes(invoice.status) && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenPaymentModal?.(invoice)}
                                className="px-2 h-8 rounded border border-green-200 text-green-700 font-semibold hover:bg-green-600 hover:text-white flex items-center justify-center bg-green-50 transition-colors text-[11px]"
                                title="Ghi nhận khách nộp tiền"
                              >
                                <i className="fa-solid fa-sack-dollar mr-1"></i> Thu tiền
                              </button>

                              {/* Chỉ cho Hủy khi chưa thu đồng nào (paid_amount == 0) */}
                              {Number(invoice.paid_amount) === 0 && (
                                <button
                                  type="button"
                                  onClick={() => onOpenCancelModal?.(invoice)}
                                  className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center bg-white transition-colors"
                                  title="Hủy hóa đơn sai sót"
                                >
                                  <i className="fa-solid fa-ban text-[12px]"></i>
                                </button>
                              )}
                            </>
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
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
          <span className="text-[12px] text-slate-500">
            Hiển thị 1 - {invoices.length} trong tổng số {pagination?.total || invoices.length} hóa đơn
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