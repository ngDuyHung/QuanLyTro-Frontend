import React from "react";

const getRoleConfig = (role) => {
  if (role === "representative") return { label: "Khách đại diện", className: "bg-green-50 text-green-600 border-green-200" };
  return { label: "Người ở ghép", className: "bg-blue-50 text-blue-600 border-blue-200" };
};

const getStatusConfig = (status) => {
  switch (status) {
    case "active":
      return {
        label: "Đang ở",
        className: "bg-green-50 text-green-600 border-green-200",
      };
    case "pending":
      return {
        label: "Chờ gắn HĐ",
        className: "bg-orange-50 text-orange-500 border-orange-200",
      };
    case "left":
      return {
        label: "Đã rời phòng",
        className: "bg-red-50 text-red-500 border-red-200",
      };
    default:
      return {
        label: "Chưa rõ",
        className: "bg-slate-100 text-slate-500 border-slate-200",
      };
  }
};

export default function TenantTable({
  tenants = [],
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
  onOpenScanModal,
  onOpenViewModal,
  onOpenDeleteModal,
}) {
  return (
    <>
      {/* THANH CÔNG CỤ */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Tìm kiếm */}
          <div className="relative w-full lg:w-[280px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              value={searchText}
              onChange={(e) => onSearchTextChange?.(e.target.value)}
              placeholder="Tìm kiếm theo tên, SĐT, CCCD..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-sm text-slate-700"
            />
          </div>

          {/* Lọc Khu nhà */}
          <div className="relative min-w-[140px]">
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

          {/* Lọc Trạng thái */}
          <div className="relative min-w-[140px]">
            <select
              value={status}
              onChange={(e) => onStatusChange?.(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:border-brand appearance-none cursor-pointer shadow-sm"
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value="active">Đang thuê</option>
              <option value="pending">Chờ gắn HĐ</option>
              <option value="left">Đã trả phòng</option>
            </select>
            <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
          </div>

          {/* Nút Bộ lọc nâng cao */}
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
            <i className="fa-solid fa-filter text-slate-400"></i> Bộ lọc
          </button>
        </div>

        {/* Cụm Nút chức năng phải */}
        <div className="flex items-center gap-3 w-full lg:w-auto ml-auto">
          {/* Nút Quét CCCD mẫu tối ưu */}

          <button
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2.5 shadow-sm relative">
            <div className="relative flex items-center justify-center">
              <i className="fa-solid fa-expand text-slate-500 text-[16px]"></i>
              <i className="fa-solid fa-barcode absolute text-[8px] text-slate-400"></i>
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#0e8b4d] rounded-full"></span>
              <span
                className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#0e8b4d] rounded-full animate-ping opacity-75"></span>
            </div>
            Quét CCCD
          </button>

          {/* Nút Thêm khách thuê */}
          <button
            onClick={onOpenAddModal}
            className="flex-1 lg:flex-none bg-brand text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-600/20"
          >
            <i className="fa-solid fa-plus text-[12px]"></i> Thêm khách thuê
          </button>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">

        {/* --- GIAO DIỆN MOBILE (Dạng Card ẩn trên PC) --- */}
        <div className="lg:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-white border border-slate-200 rounded-xl animate-pulse"></div>
            ))
          ) : tenants.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-[13px]">
              Chưa có dữ liệu khách thuê.
            </div>
          ) : (
            tenants.map((tenant) => {
              const roleConfig = getRoleConfig(tenant.role);
              const statusConfig = getStatusConfig(tenant.status);
              const currentResidence = tenant.current_residence || null;

              const roomName = tenant.room || currentResidence?.room?.name || "Chưa gắn phòng";
              const propertyName = tenant.property || currentResidence?.room?.property?.name || "—";
              const leaseId = currentResidence?.lease_id || currentResidence?.lease?.id || null;
              const moveInDate = tenant.move_in_date || currentResidence?.move_in_date || null;
              const tenantName = tenant.name || tenant.full_name;
              const cccd = tenant.cccd || tenant.id_card_number || "—";

              return (
                <div key={tenant.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">

                  {/* Header: Tên khách + Trạng thái */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-50 text-brand flex items-center justify-center border border-green-100 shrink-0">
                        <i className="fa-regular fa-user text-[12px]"></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-[14px] leading-none">{tenantName}</span>
                        <span className="text-[11px] text-slate-500 mt-1">CCCD: {cccd}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 border text-[10px] font-semibold rounded-md whitespace-nowrap ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Body: Thông tin chi tiết */}
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] text-slate-500 mb-0.5">Liên hệ</span>
                        <span className="font-semibold text-slate-800 text-[13px]">{tenant.phone || "—"}</span>
                        <span className={`mt-1.5 w-fit px-2 py-0.5 border text-[10px] rounded ${roleConfig.className}`}>
                          {roleConfig.label}
                        </span>
                      </div>

                      <div className="flex flex-col items-end shrink-0 text-right">
                        <span className="text-[11px] text-slate-500 mb-0.5">Phòng / Khu</span>
                        <span className="font-semibold text-slate-800 text-[13px]">{roomName}</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">{propertyName}</span>
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-50"></div>

                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500 mb-0.5">Hợp đồng</span>
                        <span className="font-medium text-slate-800 text-[12px]">
                          {leaseId ? `HĐ #${leaseId}` : "Chưa gắn HĐ"}
                        </span>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[11px] text-slate-500 mb-0.5">Ngày vào ở</span>
                        <span className="font-medium text-slate-800 text-[12px]">{moveInDate || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Nút thao tác */}
                  <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenViewModal?.(tenant)}
                      className="flex-1 py-2 border border-slate-200 rounded-lg bg-white text-[12px] font-medium text-slate-600 active:bg-slate-100 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <i className="fa-regular fa-eye"></i> Xem
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEditModal?.(tenant)}
                      className="flex-1 py-2 border border-blue-100 rounded-lg bg-white text-[12px] font-medium text-blue-600 active:bg-blue-50 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDeleteModal?.(tenant)}
                      className="w-10 flex shrink-0 items-center justify-center border border-red-100 rounded-lg bg-white text-[12px] text-red-500 active:bg-red-50 shadow-sm"
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
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-[40px] text-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand" />
                </th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Khách thuê</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">SĐT</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Khu nhà - Phòng</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Hợp đồng</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Vai trò</th>
                <th className="py-3.5 px-4 text-[13px] font-semibold text-slate-600">Trạng thái</th>
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
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-slate-400">
                    Chưa có dữ liệu khách thuê.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant, index) => {
                  const roleConfig = getRoleConfig(tenant.role);
                  const statusConfig = getStatusConfig(tenant.status);
                  const isActiveStyle = index === 0 ? "bg-green-50/20 relative" : ""; // Giả lập dòng đầu tiên đang được chọn

                  const currentResidence = tenant.current_residence || null;

                  const roomName =
                    tenant.room ||
                    currentResidence?.room?.name ||
                    "Chưa gắn phòng";

                  const propertyName =
                    tenant.property ||
                    currentResidence?.room?.property?.name ||
                    "—";

                  const leaseId =
                    currentResidence?.lease_id ||
                    currentResidence?.lease?.id ||
                    null;

                  const moveInDate =
                    tenant.move_in_date ||
                    currentResidence?.move_in_date ||
                    null;

                  return (
                    <tr key={tenant.id} className={`hover:bg-slate-50 border-b border-slate-100 transition-colors group ${isActiveStyle}`}>
                      <td className="py-3 px-4 text-center relative">
                        {index === 0 && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand"></div>}
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-50 text-brand flex items-center justify-center shadow-sm border border-green-100">
                            <i className="fa-regular fa-user"></i>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[14px]">
                              {tenant.name || tenant.full_name}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5">
                              CCCD: {tenant.cccd || tenant.id_card_number || "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{tenant.phone}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{roomName}</span>
                          <span className="text-[11px] text-slate-500 mt-0.5">{propertyName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {leaseId ? `HĐ #${leaseId}` : "Chưa gắn HĐ"}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            {moveInDate ? `Vào ở: ${moveInDate}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md ${roleConfig.className}`}>
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenViewModal?.(tenant)}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-green-50 flex items-center justify-center bg-white transition-colors"
                            title="Xem chi tiết">
                            <i className="fa-regular fa-eye"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEditModal?.(tenant)}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 flex items-center justify-center bg-white transition-colors"
                            title="Chỉnh sửa"
                          >
                            <i className="fa-solid fa-pen-to-square text-[12px]"></i>
                          </button>
                          {/* nút xóa */}
                          <button
                            type="button"
                            onClick={() => onOpenDeleteModal?.(tenant)}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-600 hover:bg-red-50 flex items-center justify-center bg-white transition-colors"
                            title="Xóa khách thuê"
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
            Hiển thị 1 - {tenants.length} trong tổng số {pagination?.total || 48} khách thuê
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
            <div className="relative hidden sm:block">
              <select className="pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded text-[12px] text-slate-600 focus:outline-none appearance-none cursor-pointer">
                <option>8 / trang</option>
              </select>
              <i className="fa-solid fa-angle-down absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}