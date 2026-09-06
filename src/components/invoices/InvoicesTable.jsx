import React, { useState } from "react";

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

const calculateOverdueDays = (dueDate) => {
  if (!dueDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Đưa về đầu ngày hiện tại
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);   // Đưa về đầu ngày hết hạn
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
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
  searchText = "",
  onSearchTextChange,
  onClearFilters,
  propertyId = "",
  onPropertyIdChange,
  roomId = "",
  leaseId = "", // BỔ SUNG
  onLeaseIdChange, // BỔ SUNG
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

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Đếm số lượng bộ lọc đang áp dụng (Bỏ propertyId ra khỏi bộ đếm)
  const activeFilterCount =
    (roomId ? 1 : 0) +
    (leaseId ? 1 : 0) +
    (status ? 1 : 0) +
    (invoiceType ? 1 : 0) +
    (month ? 1 : 0);

  const isFilterActive = searchText !== "" || activeFilterCount > 0;

  // NỘI DUNG BỘ LỌC (Dùng chung cho Bottom Sheet Mobile)
  const FilterContent = (
    <>
      {leaseId && (
        <div className="flex flex-col gap-1.5">
          <div className="bg-brand/10 text-brand px-3 py-2 rounded-lg text-[13px] font-medium flex items-center justify-between mb-2">
            <span>Đang lọc theo hợp đồng: HĐ #{leaseId}</span>
            <button onClick={() => onLeaseIdChange?.("")}><i className="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      )}

      {/* Đã gỡ bỏ thẻ select Khu nhà ở đây vì đã đưa ra ngoài màn hình chính */}

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold text-slate-700">Phòng</label>
        <select
          value={roomId}
          onChange={(e) => onRoomIdChange?.(e.target.value)}
          disabled={!propertyId}
          className="w-full border border-slate-200 rounded-lg text-[13px] px-3 py-2.5 text-slate-600 outline-none focus:border-brand bg-slate-50 focus:bg-white disabled:opacity-60 transition-colors"
        >
          <option value="">Tất cả phòng</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        {/* Thông báo nhắc nhở nếu chưa chọn khu nhà */}
        {!propertyId && <span className="text-[11px] text-slate-400 italic">Vui lòng chọn khu nhà trước để lọc phòng</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold text-slate-700">Trạng thái</label>
        <select
          value={status}
          onChange={(e) => onStatusChange?.(e.target.value)}
          className="w-full border border-slate-200 rounded-lg text-[13px] px-3 py-2.5 text-slate-600 outline-none focus:border-brand bg-slate-50 focus:bg-white transition-colors"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Nháp (Chưa chốt)</option>
          <option value="issued">Đã phát hành</option>
          <option value="partially_paid">Trả một phần</option>
          <option value="paid">Đã thu đủ</option>
          <option value="overdue">Quá hạn</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold text-slate-700">Kỳ hóa đơn</label>
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange?.(e.target.value)}
          className="w-full border border-slate-200 rounded-lg text-[13px] px-3 py-2.5 text-slate-600 outline-none focus:border-brand bg-slate-50 focus:bg-white transition-colors"
        />
      </div>
    </>
  );
  return (
    <>
      {/* THANH CÔNG CỤ (FILTERS & ACTIONS) */}
      <div className="hidden xl:flex flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Ô Tìm kiếm PC */}
          <div className="relative w-[240px] shrink-0">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              value={searchText}
              onChange={(e) => onSearchTextChange?.(e.target.value)}
              placeholder="Tìm theo mã hóa đơn..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
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

      {/* THANH CÔNG CỤ: MOBILE (ĐÃ TỐI ƯU SIÊU RÚT GỌN CHỈ CÒN 2 DÒNG) */}
      <div className="xl:hidden flex flex-col gap-2.5 mb-3">

        {/* Dòng 1: Tìm kiếm & Công cụ phụ */}
        <div className="flex items-center gap-2">
          {/* Ô tìm kiếm (Rộng rãi, dễ gõ) */}
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]"></i>
            <input
              type="text"
              value={searchText}
              onChange={(e) => onSearchTextChange?.(e.target.value)}
              placeholder="Tìm mã hóa đơn..."
              className="w-full pl-8 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-[13px] focus:bg-white focus:border-brand outline-none shadow-sm transition-colors placeholder:text-slate-400"
            />
          </div>

          {/* Nút Cấu hình mẫu (Có chữ để chủ nhà dễ hiểu) */}
          <button
            onClick={onOpenTemplateModal}
            className="h-9 px-3 shrink-0 flex items-center justify-center bg-white border border-slate-200 text-blue-600 rounded-lg shadow-sm active:bg-slate-50 transition-colors gap-1.5"
            title="Cấu hình mẫu in"
          >
            <i className="fa-solid fa-file-signature text-[14px]"></i>
            <span className="text-[12px] font-bold">Mẫu in</span>
          </button>

          {/* Nút Lọc (Chỉ Icon + Bong bóng đỏ báo hiệu) */}
          <button
            onClick={() => setIsFilterMenuOpen(true)}
            className={`w-9 h-9 shrink-0 relative flex items-center justify-center border rounded-lg shadow-sm transition-colors ${activeFilterCount > 0 ? "border-brand text-brand bg-brand/5" : "bg-white border-slate-200 text-slate-600 active:bg-slate-50"}`}
          >
            <i className="fa-solid fa-filter text-[13px]"></i>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Dòng 2: DÃY NÚT LỌC NHANH KHU NHÀ (Scroll ngang mượt mà) */}
        {properties.length > 0 && (
          <div className="flex overflow-x-auto gap-2 no-scrollbar pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => onPropertyIdChange?.("")}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all border ${!propertyId ? "bg-slate-800 text-white border-slate-800 shadow-sm" : "bg-white text-slate-500 border-slate-200 active:bg-slate-50"}`}
            >
              Tất cả khu
            </button>
            {properties.map(p => (
              <button
                key={p.id}
                onClick={() => onPropertyIdChange?.(String(p.id))}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all border ${propertyId === String(p.id) ? "bg-brand text-white border-brand shadow-sm shadow-brand/20" : "bg-white text-slate-500 border-slate-200 active:bg-slate-50"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM SHEET CHO MOBILE */}
      {isFilterMenuOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden flex items-end">
          {/* Lớp nền mờ (Backdrop) - Đặt tách biệt hoàn toàn để không bị xung đột sự kiện */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={() => setIsFilterMenuOpen(false)}
          ></div>

          {/* Khối nội dung chính (Đã gỡ bỏ stopPropagation) */}
          <div className="w-full bg-white rounded-t-2xl shadow-2xl animate-[slideUp_0.2s_ease-out] relative z-10 flex flex-col max-h-[85vh]">
            <div className="px-5 pt-3 pb-4 border-b border-slate-100 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-4"></div>
              <div className="flex justify-between items-center">
                <h3 className="text-[16px] font-bold text-slate-800">Bộ lọc hóa đơn</h3>
                {activeFilterCount > 0 && (
                  <button onClick={() => { onClearFilters?.(); setIsFilterMenuOpen(false); }} className="text-[13px] text-red-500 font-medium">Xóa lọc</button>
                )}
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col gap-5 no-scrollbar">
              {FilterContent}
            </div>

            <div className="px-5 pb-5 pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => {
                  setIsFilterMenuOpen(false);
                  // Thêm hiệu ứng cuộn mượt lên đầu danh sách để tạo phản hồi thị giác khi áp dụng xong
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-3 bg-brand text-white rounded-xl text-[14px] font-semibold active:scale-[0.98] transition-transform shadow-sm shadow-brand/30"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

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

              // ========================================================
              // 1. GIAO DIỆN RÚT GỌN (COMPACT) CHO HÓA ĐƠN ĐÃ HỦY
              // ========================================================
              if (invoice.status === 'cancelled') {
                return (
                  <div key={invoice.id} className="relative bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col overflow-hidden mb-2 opacity-75 grayscale-[30%]">
                    <div className="flex items-center justify-between p-3">

                      <div className="flex flex-col flex-1 min-w-0 pr-2">
                        {/* Tên phòng + Kỳ hóa đơn */}
                        <div className="flex items-center gap-1.5 font-bold text-slate-500 text-[14px]">
                          <i className="fa-solid fa-house-chimney text-slate-400 text-[12px] shrink-0"></i>
                          <span className="line-through truncate">{invoice.room?.name || "—"}</span>
                          <span className="text-[12px] font-medium text-slate-400 shrink-0">
                            ({formatDate(invoice.period_from)})
                          </span>
                        </div>
                        {/* Dòng dưới */}
                        <div className="text-[11px] font-medium text-slate-400 mt-1 truncate">
                          HĐ: {invoice.invoice_code}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Giữ lại Badge Trạng Thái */}
                        <span className="px-2 py-1 bg-slate-200 text-slate-500 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <i className="fa-solid fa-ban"></i> Đã hủy
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenViewModal?.(invoice)}
                          className="w-8 h-8 rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center shadow-sm transition-colors"
                        >
                          <i className="fa-solid fa-print text-[13px]"></i>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              }

              // ========================================================
              // 2. GIAO DIỆN RÚT GỌN (COMPACT) CHO HÓA ĐƠN ĐÃ THU ĐỦ
              // ========================================================
              if (invoice.status === 'paid') {
                return (
                  <div key={invoice.id} className="relative bg-emerald-50/40 rounded-xl border border-emerald-200 flex flex-col overflow-hidden mb-2 shadow-sm">
                    <div className="flex items-center justify-between p-3">

                      <div className="flex flex-col flex-1 min-w-0 pr-2">
                        {/* Tên phòng + Kỳ hóa đơn */}
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[14px]">
                          <i className="fa-solid fa-house-chimney text-emerald-600 text-[12px] shrink-0"></i>
                          <span className="truncate">{invoice.room?.name || "—"}</span>
                          <span className="text-[12px] font-medium text-slate-500 shrink-0">
                            (Kỳ: {formatDate(invoice.period_from)})
                          </span>
                        </div>

                        {/* Dòng dưới: Mã HĐ + Tiền */}
                        <div className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                          <span>HĐ: {invoice.invoice_code}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-emerald-600 font-bold text-[12px]">{formatCurrency(invoice.total_amount)}đ</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Giữ lại Badge Trạng Thái giúp dễ nhìn */}
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm border border-emerald-200">
                          <i className="fa-solid fa-check-double"></i> Đã thu
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenViewModal?.(invoice)}
                          className="w-8 h-8 rounded border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center shadow-sm transition-colors"
                        >
                          <i className="fa-solid fa-print text-[13px]"></i>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              }

              // ========================================================
              // 3. GIAO DIỆN ĐẦY ĐỦ CHO CÁC HÓA ĐƠN CẦN XỬ LÝ (NHÁP, ĐANG NỢ, TRỄ HẠN)
              // ========================================================

              // Đổi màu viền Card tương ứng với Trạng thái
              let cardBorderColor = "border-slate-200";
              let cutoutColor = "border-slate-200";
              if (invoice.status === 'overdue') {
                cardBorderColor = "border-red-500 shadow-red-500/10";
                cutoutColor = "border-red-500";
              } else if (['issued', 'partially_paid'].includes(invoice.status)) {
                cardBorderColor = "border-amber-500 shadow-amber-500/10"; // Đổi nợ sang màu Cam cho cảnh báo nhẹ
                cutoutColor = "border-amber-500";
              }

              return (
                <div key={invoice.id} className={`relative bg-white rounded-xl shadow-sm border-[1.5px] ${cardBorderColor} flex flex-col overflow-hidden mb-3 transition-all`}>

                  {/* --- PHẦN 1: HEADER --- */}
                  <div className="flex items-start justify-between p-3 pb-2 bg-slate-50/50">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[16px]">
                        <i className="fa-solid fa-house-chimney text-slate-500 text-[14px]"></i> {invoice.room?.name || "—"}
                      </div>
                      <div className="text-[12px] font-medium text-slate-500 mt-0.5">{invoice.property?.name || "—"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2.5 py-1.5 border text-[12px] font-bold rounded-lg flex items-center gap-1.5 w-fit shadow-sm ${statusConf.className}`}>
                        <i className={`fa-solid ${statusConf.icon}`}></i> {statusConf.label}
                      </span>
                      {(invoice.status === 'issued' || invoice.status === 'partially_paid') && invoice.due_date && calculateOverdueDays(invoice.due_date) > 0 && (
                        <span className="text-[11px] text-red-600 font-bold italic bg-red-50 px-2 py-0.5 rounded-md border border-red-100 flex items-center gap-1">
                          <i className="fa-regular fa-clock"></i> Trễ {calculateOverdueDays(invoice.due_date)} ngày
                        </span>
                      )}
                    </div>
                  </div>

                  {/* --- PHẦN 2: THÔNG TIN HÓA ĐƠN & SỐ TIỀN --- */}
                  <div className="px-3 pb-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col gap-2">
                      <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
                        <span className="text-[12px] font-bold text-slate-600 flex items-center gap-1.5">
                          <i className="fa-regular fa-file-lines text-slate-400 text-[13px]"></i> {invoice.invoice_code}
                        </span>
                        <span className="text-[12px] font-bold text-slate-600">Kỳ: {formatDate(invoice.period_from)}</span>
                      </div>

                      <div className="flex justify-between items-center pt-0.5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                            Cần thu (Còn nợ)
                          </span>
                          <span className={`text-[20px] font-black leading-none tracking-tight ${invoice.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>
                            {formatCurrency(invoice.remaining_amount)} <span className="text-[14px] underline decoration-slate-300 font-bold ml-0.5">đ</span>
                          </span>
                        </div>

                        <div className="flex flex-col items-end text-[11px] gap-0.5">
                          <div className="text-slate-500">Tổng: <span className="font-bold text-slate-700">{formatCurrency(invoice.total_amount)}</span></div>
                          {Number(invoice.discount_amount) > 0 && (
                            <div className="text-slate-500">Giảm: <span className="font-bold text-red-500">-{formatCurrency(invoice.discount_amount)}</span></div>
                          )}
                          <div className="text-slate-500">Đã trả: <span className="font-bold text-slate-700">{formatCurrency(invoice.paid_amount)}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- PHẦN 3: ĐƯỜNG CẮT RĂNG CƯA --- */}
                  <div className={`relative border-t-[1.5px] border-dashed ${cardBorderColor.split(' ')[0]}`}>
                    <div className={`absolute -left-[9px] -top-[9px] w-4 h-4 rounded-full bg-slate-50 border-r-[1.5px] ${cutoutColor}`}></div>
                    <div className={`absolute -right-[9px] -top-[9px] w-4 h-4 rounded-full bg-slate-50 border-l-[1.5px] ${cutoutColor}`}></div>
                  </div>

                  {/* --- PHẦN 4: THAO TÁC (FOOTER) --- */}
                  <div className="bg-slate-50/50 p-3 flex gap-2">

                    <button
                      type="button"
                      onClick={() => onOpenViewModal?.(invoice)}
                      className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-[13px] font-bold text-slate-700 active:bg-slate-100 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <i className="fa-solid fa-print text-[14px]"></i> Xem / In
                    </button>

                    {invoice.status === 'draft' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenIssueConfirm?.(invoice)}
                          className="flex-[1.5] py-2.5 border-2 border-blue-300 rounded-xl bg-blue-50 text-[13px] font-bold text-blue-700 active:bg-blue-100 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <i className="fa-regular fa-paper-plane text-[14px]"></i> Phát hành
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDeleteModal?.(invoice)}
                          className="w-11 flex shrink-0 items-center justify-center border-2 border-red-200 rounded-xl bg-white text-[14px] text-red-500 active:bg-red-50 shadow-sm"
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </>
                    )}

                    {['issued', 'partially_paid', 'overdue'].includes(invoice.status) && (
                      <>
                        {(() => {
                          const isPending = invoice.has_pending_transaction || invoice.allocations?.some(
                            (a) => a.financial_transaction?.status === 'pending'
                          );

                          if (isPending) {
                            return (
                              <button
                                type="button"
                                onClick={() => onOpenPaymentModal?.(invoice)}
                                className="flex-[1.5] py-2.5 border-2 border-amber-400 rounded-xl bg-amber-50 text-[13px] font-bold text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-1.5 shadow-sm animate-pulse"
                              >
                                <i className="fa-solid fa-bell text-[14px]"></i> Duyệt tiền
                              </button>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={() => onOpenPaymentModal?.(invoice)}
                              className="flex-[1.5] py-2.5 border-2 border-green-600 rounded-xl bg-green-600 text-[13px] font-bold text-white active:bg-green-700 flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <i className="fa-solid fa-sack-dollar text-[14px]"></i> Thu tiền
                            </button>
                          );
                        })()}

                        {Number(invoice.paid_amount) === 0 && (
                          <button
                            type="button"
                            onClick={() => onOpenCancelModal?.(invoice)}
                            className="w-11 flex shrink-0 items-center justify-center border-2 border-slate-200 rounded-xl bg-white text-[14px] text-slate-500 active:bg-slate-50 shadow-sm"
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
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 w-[180px]">Ngày thu / hết hạn</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Tổng tiền (đ)</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Đã thu (đ)</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-right">Còn nợ (đ)</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-center w-[160px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 animate-pulse">
                    <td colSpan={8} className="py-3 px-4"><div className="h-12 bg-slate-100 rounded"></div></td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 px-4 text-center text-slate-400">
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
                            Kỳ: {formatDate(invoice.period_from)}
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

                      {/* Ngày thu & Ngày hết hạn */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-500">
                            Ngày thu: {invoice.period_from ? formatDate(invoice.period_from) : "—"}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            Hạn: {invoice.due_date ? formatDate(invoice.due_date) : "—"}
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
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md inline-flex items-center gap-1.5 ${statusConf.className}`}>
                            <i className={`fa-solid ${statusConf.icon} text-[10px]`}></i>
                            {statusConf.label}
                          </span>
                          {(invoice.status === 'issued' || invoice.status === 'partially_paid') && invoice.due_date && calculateOverdueDays(invoice.due_date) > 0 && (
                            <span className="text-[10px] text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                              Trễ {calculateOverdueDays(invoice.due_date)} ngày
                            </span>
                          )}
                        </div>
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
                              {(() => {
                                const isPending = invoice.has_pending_transaction;
                                if (isPending) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => onOpenPaymentModal?.(invoice)}
                                      className="px-2 h-8 rounded border border-amber-300 text-amber-700 font-bold hover:bg-amber-500 hover:text-white flex items-center justify-center bg-amber-50 transition-colors text-[11px] animate-pulse"
                                      title="Khách vừa gửi minh chứng"
                                    >
                                      <i className="fa-solid fa-bell mr-1"></i> Duyệt tiền
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    type="button"
                                    onClick={() => onOpenPaymentModal?.(invoice)}
                                    className="px-2 h-8 rounded border border-green-200 text-green-700 font-semibold hover:bg-green-600 hover:text-white flex items-center justify-center bg-green-50 transition-colors text-[11px]"
                                    title="Ghi nhận khách nộp tiền"
                                  >
                                    <i className="fa-solid fa-sack-dollar mr-1"></i> Thu tiền
                                  </button>
                                );
                              })()}

                              {/* Chỉ cho Hủy khi chưa thu đồng nào */}
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