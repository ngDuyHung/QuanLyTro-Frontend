import React from "react";
import settingService from "@/services/settingService";
const formatMoney = (value) => {
  const numberValue = Number(value || 0);
  return numberValue.toLocaleString("vi-VN") + "đ";
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const getStatusConfig = (status) => {
  switch (status) {
    case "active":
      return {
        label: "Đang hiệu lực",
        className: "bg-green-50 text-green-600 border-green-200",
      };
    case "ended":
      return {
        label: "Đã kết thúc",
        className: "bg-slate-100 text-slate-500 border-slate-200",
      };
    case "cancelled":
    case "canceled":
      return {
        label: "Đã hủy",
        className: "bg-red-50 text-red-500 border-red-200",
      };
    default:
      return {
        label: "Chưa rõ",
        className: "bg-slate-100 text-slate-500 border-slate-200",
      };
  }
};

export default function LeasesTable({
  leases = [],
  properties = [],
  pagination,
  page,
  onPageChange,
  isLoading = false,
  searchText = "",
  onSearchTextChange,
  propertyId = "",
  onPropertyIdChange,
  status = "",
  onStatusChange,
  onOpenAddModal,
  onOpenEditModal,
  onOpenViewModal,
  onEndLease,
  onOpenTemplateModal,
  onCopyPhone,
  onOpenDeleteModal,
}) {

  const handlePageChange = (newPage) => {
    onPageChange?.(newPage);

    setTimeout(() => {
      // Tìm khối chứa danh sách thông qua ID để cuộn lên
      const tableContainer = document.getElementById('lease-table-top');

      if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Dự phòng
      }
    }, 50);
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-[300px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              value={searchText}
              onChange={(e) => onSearchTextChange?.(e.target.value)}
              placeholder="Tìm theo khách thuê, phòng, mã HĐ..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-sm text-slate-700"
            />
          </div>

          <div className="relative min-w-[160px]">
            <select
              value={propertyId}
              onChange={(e) => onPropertyIdChange?.(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm"
            >
              <option value="">Khu nhà: Tất cả</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
          </div>

          <div className="relative min-w-[160px]">
            <select
              value={status}
              onChange={(e) => onStatusChange?.(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm"
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value="active">Đang hiệu lực</option>
              <option value="ended">Đã kết thúc</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto ml-auto">
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
            type="button"
            onClick={onOpenAddModal}
            className="flex-1 lg:flex-none bg-brand text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-600/20"
          >
            <i className="fa-solid fa-plus text-[12px]"></i> Thêm hợp đồng
          </button>
        </div>
      </div>

      <div id="lease-table-top" className="bg-transparent lg:bg-white border-none lg:border lg:border-slate-200 lg:rounded-xl shadow-none lg:shadow-sm lg:overflow-hidden flex flex-col">

        {/* --- GIAO DIỆN MOBILE (Dạng Card ẩn trên PC) --- */}
        <div className="lg:hidden flex flex-col gap-3 pb-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-white border border-slate-200 rounded-xl animate-pulse"></div>
            ))
          ) : leases.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-[13px]">
              Chưa có dữ liệu hợp đồng.
            </div>
          ) : (
            leases.map((lease) => {
              const statusConfig = getStatusConfig(lease.status);
              const roomName = lease.room?.name || "—";
              const propertyName = lease.room?.property?.name || "—";
              const tenantName = lease.tenant?.full_name || "—";
              const tenantPhone = lease.tenant?.phone || "";
              const leaseCode = `HĐ #${lease.id}`;

              return (
                <div key={lease.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">

                  {/* Header: Mã HĐ + Trạng thái */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-50 text-brand flex items-center justify-center border border-green-100 shrink-0">
                        <i className="fa-solid fa-file-contract text-[12px]"></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-[14px] leading-none">{leaseCode}</span>
                        <span className="text-[11px] text-slate-500 mt-1">Tạo: {formatDate(lease.created_at)}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 border text-[10px] font-semibold rounded-md whitespace-nowrap ${statusConfig.className}`}>
                      {lease.status_label || statusConfig.label}
                    </span>
                  </div>

                  {/* Body: Thông tin chi tiết */}
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] text-slate-500 mb-0.5">Khách thuê</span>
                        <span className="font-semibold text-slate-800 text-[13px] truncate">{tenantName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[12px] text-slate-600">{tenantPhone || "Chưa có SĐT"}</span>
                          {tenantPhone && (
                            <button onClick={() => onCopyPhone?.(tenantPhone)} className="text-slate-400 hover:text-brand" title="Copy">
                              <i className="fa-solid fa-copy text-[11px]"></i>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 text-right">
                        <span className="text-[11px] text-slate-500 mb-0.5">Phòng</span>
                        <span className="font-semibold text-slate-800 text-[13px]">{roomName}</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">{propertyName}</span>
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-50"></div>

                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500 mb-0.5">Thời hạn</span>
                        <span className="font-medium text-slate-800 text-[12px]">{formatDate(lease.start_date)}</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          {lease.end_date ? `Đến ${formatDate(lease.end_date)}` : "Không thời hạn"}
                        </span>
                      </div>

                      <div className="flex flex-col items-end text-right">
                        <span className="text-[11px] text-slate-500 mb-0.5">Tiền cọc</span>
                        <span className="font-bold text-slate-800 text-[13px] text-brand">{formatMoney(lease.deposit)}</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">Thu ngày {lease.billing_day || 1}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Nút thao tác */}
                  <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenViewModal?.(lease)}
                      className="flex-1 py-2 border border-slate-200 rounded-lg bg-white text-[12px] font-semibold text-slate-600 active:bg-slate-100 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <i className="fa-regular fa-file-pdf text-brand"></i> Xem & In
                    </button>

                    <button
                      type="button"
                      onClick={() => onEndLease?.(lease)}
                      disabled={lease.status !== "active"}
                      className="flex-1 py-2 border border-amber-200 rounded-lg bg-amber-50 text-[12px] font-semibold text-amber-600 active:bg-amber-100 flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <i className="fa-solid fa-door-open"></i> Kết thúc
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDeleteModal?.(lease)}
                      className="w-11 flex shrink-0 items-center justify-center border border-red-100 rounded-lg bg-white text-[13px] text-red-500 active:bg-red-50 shadow-sm"
                      title="Xóa hợp đồng"
                    >
                      <i className="fa-regular fa-trash-can"></i>
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
        {/* --- KẾT THÚC GIAO DIỆN MOBILE --- */}

        <div className="hidden lg:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1100px]">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-[40px] text-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand" />
                </th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Hợp đồng</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Khách đại diện</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Khu nhà - Phòng</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Thời hạn</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Ngày thu</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Tiền cọc</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Trạng thái</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600 text-center w-[120px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 animate-pulse">
                    <td colSpan={9} className="py-3 px-4">
                      <div className="h-10 bg-slate-100 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : leases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 px-4 text-center text-slate-400">
                    Chưa có dữ liệu hợp đồng.
                  </td>
                </tr>
              ) : (
                leases.map((lease, index) => {
                  const statusConfig = getStatusConfig(lease.status);
                  const roomName = lease.room?.name || "—";
                  const propertyName = lease.room?.property?.name || "—";
                  const tenantName = lease.tenant?.full_name || "—";
                  const tenantPhone = lease.tenant?.phone || "";
                  const leaseCode = `HĐ #${lease.id}`;
                  const isActiveStyle = index === 0 ? "bg-green-50/20 relative" : "";

                  return (
                    <tr key={lease.id} className={`hover:bg-slate-50 border-b border-slate-100 transition-colors group ${isActiveStyle}`}>
                      <td className="py-3 px-4 text-center relative">
                        {index === 0 && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand"></div>}
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-50 text-brand flex items-center justify-center shadow-sm border border-green-100">
                            <i className="fa-solid fa-file-contract"></i>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[14px]">{leaseCode}</span>
                            <span className="text-[11px] text-slate-500 mt-0.5">Tạo: {formatDate(lease.created_at)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{tenantName}</span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            SĐT: {tenantPhone || "Chưa có SĐT"}
                            {/* icon copy số điện thoại */}
                            {tenantPhone && (
                              <button
                                className="ml-2 text-slate-400 hover:text-brand"
                                title="Sao chép SĐT"
                                onClick={() => onCopyPhone?.(tenantPhone)}
                              >
                                <i className="fa-solid fa-copy"></i>
                              </button>
                            )}
                          </span>

                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{roomName}</span>
                          <span className="text-[11px] text-slate-500 mt-0.5">{propertyName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{formatDate(lease.start_date)}</span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            {lease.end_date ? `Đến ${formatDate(lease.end_date)}` : "Không thời hạn"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        Ngày {lease.billing_day || 1}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        {formatMoney(lease.deposit)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md ${statusConfig.className}`}>
                          {lease.status_label || statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenViewModal?.(lease)}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-green-50 flex items-center justify-center bg-white transition-colors shadow-sm"
                            title="Xem và In hợp đồng"
                          >
                            <i className="fa-regular fa-file-pdf text-[13px]"></i>
                          </button>

                          <button
                            type="button"
                            onClick={() => onEndLease?.(lease)}
                            disabled={lease.status !== "active"}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-600 hover:bg-amber-50 flex items-center justify-center bg-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Kết thúc hợp đồng"
                          >
                            <i className="fa-solid fa-door-open text-[12px]"></i>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDeleteModal?.(lease)}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-600 hover:bg-red-50 flex items-center justify-center bg-white transition-colors shadow-sm"
                            title="Xóa hợp đồng"
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

        <div className="bg-white border border-slate-200 lg:border-x-0 lg:border-b-0 lg:border-t lg:border-slate-100 rounded-xl lg:rounded-b-xl lg:rounded-t-none p-3 lg:p-4 flex items-center justify-between">
          <span className="text-[12px] lg:text-[13px] text-slate-500">
            {pagination ? (
              <>
                <span className="lg:hidden">
                  Trang {pagination.current_page || 1}/{pagination.last_page || 1} · {pagination.total || 0} hợp đồng
                </span>

                <span className="hidden lg:inline">
                  Hiển thị {pagination.from || 0} - {pagination.to || 0} trong tổng số {pagination.total || 0} hợp đồng
                </span>
              </>
            ) : (
              <>
                <span className="lg:hidden">0 hợp đồng</span>
                <span className="hidden lg:inline">Chưa có dữ liệu hợp đồng</span>
              </>
            )}
          </span>

          {pagination?.last_page > 1 && (
            <div className="flex items-center gap-1">
              {/* Nút lùi trang */}
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-angle-left text-[12px] lg:text-[11px]"></i>
              </button>

              {/* MOBILE UI: Chỉ hiện ô số trang hiện tại */}
              <button
                type="button"
                className="flex lg:hidden w-8 h-8 rounded-lg items-center justify-center bg-brand text-white font-medium text-[13px]"
              >
                {page}
              </button>

              {/* DESKTOP UI: Hiện đầy đủ dãy số trang */}
              <div className="hidden lg:flex gap-1">
                {Array.from({ length: pagination.last_page }).map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => handlePageChange(pageNumber)}
                      className={`flex h-7 w-7 items-center justify-center rounded text-[12px] font-medium transition-colors ${pageNumber === page
                          ? "bg-brand text-white shadow-sm"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              {/* Nút tiến trang */}
              <button
                type="button"
                disabled={page >= pagination.last_page}
                onClick={() => handlePageChange(page + 1)}
                className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-angle-right text-[12px] lg:text-[11px]"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
