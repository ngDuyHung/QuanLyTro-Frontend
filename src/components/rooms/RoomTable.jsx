import { useState } from "react";

const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
};

const getStatusConfig = (status) => {
  switch (status) {
    case "occupied":
      return {
        label: "Đang thuê",
        shortLabel: "Thuê",
        badgeClass: "bg-green-50 text-green-600",
        iconClass: "bg-green-50 text-green-500",
        icon: "fa-building-circle-check",
      };

    case "maintenance":
      return {
        label: "Bảo trì",
        shortLabel: "BT",
        badgeClass: "bg-orange-50 text-orange-500",
        iconClass: "bg-orange-50 text-orange-500",
        icon: "fa-wrench",
      };

    case "available":
    default:
      return {
        label: "Trống",
        shortLabel: "Trống",
        badgeClass: "bg-blue-50 text-blue-500",
        iconClass: "bg-blue-50 text-blue-500",
        icon: "fa-door-open",
      };
  }
};

const formatFloor = (floorNumber) => {
  if (floorNumber === null || floorNumber === undefined || floorNumber === "") {
    return "Không xác định";
  }

  if (Number(floorNumber) === 0) return "Trệt";

  return `Tầng ${floorNumber}`;
};


const getTenantName = (room) =>
  room.tenant?.name ||
  room.current_tenant?.name ||
  room.current_lease?.tenant?.name ||
  room.tenant_name ||
  "";

const getTenantPhone = (room) =>
  room.tenant?.phone ||
  room.current_tenant?.phone ||
  room.current_lease?.tenant?.phone ||
  room.tenant_phone ||
  "";

function RoomActionsMenu({ room, onAction }) {
  const actions = [
    {
      key: "view",
      label: "Xem chi tiết",
      icon: "fa-regular fa-eye",
      className: "text-slate-700",
    },
    {
      key: "edit",
      label: "Chỉnh sửa phòng",
      icon: "fa-regular fa-pen-to-square",
      className: "text-slate-700",
    },
    {
      key: "images",
      label: "Cập nhật hình ảnh",
      icon: "fa-regular fa-images",
      className: "text-slate-700",
    },
    {
      key: "meter",
      label: "Ghi điện nước",
      icon: "fa-solid fa-gauge-high",
      className: "text-slate-700",
    },
    {
      key: "invoice",
      label: "Xem hóa đơn",
      icon: "fa-solid fa-file-invoice-dollar",
      className: "text-slate-700",
    },
    ...(room.status === "available"
      ? [
          {
            key: "createLease",
            label: "Tạo hợp đồng / thêm khách",
            icon: "fa-solid fa-user-plus",
            className: "text-brand",
          },
          {
            key: "maintenance",
            label: "Chuyển sang bảo trì",
            icon: "fa-solid fa-wrench",
            className: "text-orange-600",
          },
        ]
      : []),
    ...(room.status === "maintenance"
      ? [
          {
            key: "available",
            label: "Đánh dấu phòng trống",
            icon: "fa-solid fa-door-open",
            className: "text-brand",
          },
        ]
      : []),
    {
      key: "delete",
      label: "Xóa phòng",
      icon: "fa-regular fa-trash-can",
      className:
        room.status === "available"
          ? "text-red-600"
          : "text-slate-400 cursor-not-allowed",
      disabled: room.status !== "available",
    },
  ];

  return (
    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 z-30 overflow-hidden text-left">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          disabled={action.disabled}
          onClick={() => {
            if (action.disabled) return;
            onAction?.(action.key, room);
          }}
          className={`w-full px-3.5 py-2.5 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-2.5 disabled:hover:bg-white disabled:cursor-not-allowed ${action.className}`}
        >
          <i className={`${action.icon} w-4 text-center text-[12px]`}></i>
          <span>{action.label}</span>
        </button>
      ))}

      {room.status !== "available" && (
        <div className="px-3.5 py-2 bg-amber-50 border-t border-amber-100 text-[11px] leading-4 text-amber-700">
          Chỉ xóa được phòng đang trống.
        </div>
      )}
    </div>
  );
}

function MobileRoomCard({ room, isMenuOpen, onToggleMenu, onAction }) {
  const statusConfig = getStatusConfig(room.status);
  const tenantName = getTenantName(room);
  const tenantPhone = getTenantPhone(room);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-3.5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${statusConfig.iconClass}`}
          >
            <i className={`fa-solid ${statusConfig.icon} text-[14px]`}></i>
          </div>

          <div className="min-w-0">
            <p className="text-[14px] font-bold text-slate-800 leading-tight truncate">
              {room.name}
            </p>

            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {room.property?.name || "Chưa có khu nhà"} ·{" "}
              {formatFloor(room.floor_number)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusConfig.badgeClass}`}
          >
            {room.status_label || statusConfig.shortLabel}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleMenu?.(room.id)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 bg-white active:bg-slate-50"
              title="Thao tác"
            >
              <i className="fa-solid fa-ellipsis-vertical text-[12px]"></i>
            </button>

            {isMenuOpen && <RoomActionsMenu room={room} onAction={onAction} />}
          </div>
        </div>
      </div>

      {/* Main info */}
      <div className="px-3.5 py-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Giá phòng</p>
            <p className="text-[14px] font-bold text-brand leading-tight truncate">
              {formatCurrency(room.current_price)}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 mb-1">Diện tích</p>
            <p className="text-[13px] font-semibold text-slate-700 leading-tight">
              {room.area ? `${room.area} m²` : "—"}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 mb-1">Thanh toán</p>
            <p className="text-[13px] font-semibold text-slate-400 leading-tight">
              —
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          {tenantName ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-user text-slate-400 text-[11px]"></i>
              </div>

              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 truncate">
                  {tenantName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {tenantPhone || "Chưa có số điện thoại"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[13px] text-slate-400 italic">
              <i className="fa-regular fa-user"></i>
              <span>
                {room.status === "maintenance"
                  ? "Phòng đang bảo trì"
                  : "Chưa có khách thuê"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
        <button
          type="button"
          onClick={() => onAction?.("view", room)}
          className="flex-1 py-2 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-600 flex items-center justify-center gap-1.5 active:bg-slate-100"
        >
          <i className="fa-regular fa-eye text-slate-400"></i>
          Xem chi tiết
        </button>

        {room.status === "available" ? (
          <button
            type="button"
            onClick={() => onAction?.("createLease", room)}
            className="flex-1 py-2 rounded-lg border border-brand bg-brand text-[12px] font-medium text-white flex items-center justify-center gap-1.5 active:bg-brand-dark"
          >
            <i className="fa-solid fa-user-plus text-[11px]"></i>
            Thêm khách
          </button>
        ) : room.status === "maintenance" ? (
          <button
            type="button"
            onClick={() => onAction?.("available", room)}
            className="flex-1 py-2 rounded-lg border border-orange-200 bg-orange-50 text-[12px] font-medium text-orange-600 flex items-center justify-center gap-1.5 active:bg-orange-100"
          >
            <i className="fa-solid fa-wrench text-[11px]"></i>
            Bảo trì
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAction?.("invoice", room)}
            className="flex-1 py-2 rounded-lg border border-green-200 bg-green-50 text-[12px] font-medium text-brand flex items-center justify-center gap-1.5 active:bg-green-100"
          >
            <i className="fa-solid fa-file-invoice-dollar text-[11px]"></i>
            Hóa đơn
          </button>
        )}
      </div>
    </div>
  );
}

function MobileLoadingCards() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[138px] bg-white border border-slate-200 rounded-xl animate-pulse"
        ></div>
      ))}
    </div>
  );
}

function EmptyRoomState() {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-xl px-4 py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <i className="fa-solid fa-door-open text-lg"></i>
      </div>

      <p className="text-[14px] font-bold text-slate-700">
        Chưa có phòng phù hợp
      </p>

      <p className="text-[12px] text-slate-500 mt-1">
        Hãy thử đổi bộ lọc hoặc thêm phòng mới.
      </p>
    </div>
  );
}

export default function RoomTable({
  rooms = [],
  pagination,
  page,
  onPageChange,
  isLoading = false,
  searchText = "",
  onSearchTextChange,
  status = "",
  onStatusChange,
  onEditRoom,
  onViewRoom,
  onDeleteRoom,
  onCreateLease,
  onViewInvoices,
  onRecordMeter,
  onUpdateStatus,
}) {
  const [activeActionRoomId, setActiveActionRoomId] = useState(null);

  const handleAction = (actionKey, room) => {
    setActiveActionRoomId(null);

    switch (actionKey) {
      case "view":
        onViewRoom?.(room);
        return;

      case "edit":
      case "images":
        onEditRoom?.(room);
        return;

      case "delete":
        onDeleteRoom?.(room);
        return;

      case "createLease":
        onCreateLease?.(room);
        return;

      case "invoice":
        onViewInvoices?.(room);
        return;

      case "meter":
        onRecordMeter?.(room);
        return;

      case "maintenance":
        onUpdateStatus?.(room, "maintenance");
        return;

      case "available":
        onUpdateStatus?.(room, "available");
        return;

      default:
        return;
    }
  };

  const canGoPrev = Boolean(pagination && page > 1);
  const canGoNext = Boolean(pagination && page < pagination.last_page);

  return (
    <div className="mb-6 flex flex-col gap-3 lg:gap-0 lg:bg-white lg:border lg:border-slate-200 lg:rounded-xl lg:shadow-sm">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl lg:rounded-none lg:border-0 lg:border-b lg:border-slate-100 p-3 lg:p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between shadow-sm lg:shadow-none">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center flex-1 min-w-0">
          <div className="relative w-full lg:w-[260px] shrink-0">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>

            <input
              type="text"
              value={searchText}
              onChange={(event) => onSearchTextChange?.(event.target.value)}
              placeholder="Tìm kiếm phòng, khu nhà..."
              className="w-full pl-9 pr-3 py-2.5 lg:py-2 border border-slate-200 rounded-lg text-[13px] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0 lg:flex-wrap">
            <select
              value={status}
              onChange={(event) => onStatusChange?.(event.target.value)}
              className="shrink-0 min-w-[150px] border border-slate-200 rounded-lg text-[13px] px-3 py-2.5 lg:py-2 text-slate-600 outline-none focus:border-brand bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="available">Phòng trống</option>
              <option value="occupied">Đang thuê</option>
              <option value="maintenance">Bảo trì</option>
            </select>

            <select className="shrink-0 min-w-[150px] border border-slate-200 rounded-lg text-[13px] px-3 py-2.5 lg:py-2 text-slate-600 outline-none focus:border-brand bg-white">
              <option>Thanh toán</option>
            </select>

            <select className="shrink-0 min-w-[150px] border border-slate-200 rounded-lg text-[13px] px-3 py-2.5 lg:py-2 text-slate-600 outline-none focus:border-brand bg-white">
              <option>HĐ hết hạn</option>
            </select>

            <button
              type="button"
              className="shrink-0 border border-slate-200 rounded-lg px-3 py-2.5 lg:py-2 text-[13px] text-slate-600 hover:bg-slate-50 flex items-center gap-2 bg-white"
            >
              <i className="fa-solid fa-filter"></i>
              Thêm lọc
            </button>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <button
            type="button"
            className="text-[13px] text-slate-500 hover:text-slate-800 px-2"
          >
            Xóa lọc
          </button>

          <button
            type="button"
            className="bg-brand-50 text-brand border border-green-200 rounded-lg px-3 py-2 text-[13px] font-medium hover:bg-green-100 flex items-center gap-2"
          >
            <i className="fa-regular fa-floppy-disk"></i>
            Lưu bộ lọc
          </button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden">
        {isLoading ? (
          <MobileLoadingCards />
        ) : rooms.length === 0 ? (
          <EmptyRoomState />
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <MobileRoomCard
                key={room.id}
                room={room}
                isMenuOpen={activeActionRoomId === room.id}
                onToggleMenu={(roomId) =>
                  setActiveActionRoomId((currentId) =>
                    currentId === roomId ? null : roomId,
                  )
                }
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto w-full">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50/50 text-[12px] text-slate-500 font-medium">
            <tr>
              <th className="py-3 px-4 border-b border-slate-100 w-[40px]">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand focus:ring-brand"
                />
              </th>

              <th className="py-3 px-4 border-b border-slate-100">
                Phòng <i className="fa-solid fa-sort ml-1 text-slate-300"></i>
              </th>

              <th className="py-3 px-4 border-b border-slate-100">
                Khu nhà <i className="fa-solid fa-sort ml-1 text-slate-300"></i>
              </th>

              <th className="py-3 px-4 border-b border-slate-100">
                Diện tích{" "}
                <i className="fa-solid fa-sort ml-1 text-slate-300"></i>
              </th>

              <th className="py-3 px-4 border-b border-slate-100">
                Giá phòng{" "}
                <i className="fa-solid fa-sort ml-1 text-slate-300"></i>
              </th>

              <th className="py-3 px-4 border-b border-slate-100">
                Trạng thái{" "}
                <i className="fa-solid fa-sort ml-1 text-slate-300"></i>
              </th>

              <th className="py-3 px-4 border-b border-slate-100">
                Người thuê{" "}
                <i className="fa-solid fa-sort ml-1 text-slate-300"></i>
              </th>

              <th className="py-3 px-4 border-b border-slate-100">
                HĐ hết hạn{" "}
                <i className="fa-solid fa-sort ml-1 text-slate-300"></i>
              </th>

              <th className="py-3 px-4 border-b border-slate-100 text-center">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="text-[13px]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-50 animate-pulse"
                >
                  <td colSpan={9} className="py-3 px-4">
                    <div className="h-8 bg-slate-100 rounded"></div>
                  </td>
                </tr>
              ))
            ) : rooms.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-10 px-4 text-center text-slate-400"
                >
                  Chưa có phòng phù hợp.
                </td>
              </tr>
            ) : (
              rooms.map((room) => {
                const statusConfig = getStatusConfig(room.status);
                const tenantName = getTenantName(room);
                const tenantPhone = getTenantPhone(room);

                return (
                  <tr
                    key={room.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{room.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {formatFloor(room.floor_number)}
                      </p>
                    </td>

                    <td className="py-3 px-4 max-w-[240px]">
                      <p className="font-bold text-slate-800 truncate">
                        {room.property?.name || "—"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {room.property?.address || "—"}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {room.area ? `${room.area} m²` : "—"}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {formatCurrency(room.current_price)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${statusConfig.badgeClass}`}
                      >
                        {room.status_label || statusConfig.label}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {tenantName ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {tenantName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {tenantPhone || "Chưa có số điện thoại"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-400">—</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2 relative">
                        <button
                          type="button"
                          onClick={() => handleAction("view", room)}
                          className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                          title="Xem chi tiết"
                        >
                          <i className="fa-regular fa-eye"></i>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAction("edit", room)}
                          className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-brand hover:border-green-200 hover:bg-green-50 flex items-center justify-center"
                          title="Sửa phòng"
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setActiveActionRoomId((currentId) =>
                              currentId === room.id ? null : room.id,
                            )
                          }
                          className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center bg-white"
                          title="Thao tác khác"
                        >
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>

                        {activeActionRoomId === room.id && (
                          <RoomActionsMenu
                            room={room}
                            onAction={handleAction}
                          />
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

      {/* Pagination */}
      <div className="bg-white border border-slate-200 lg:border-x-0 lg:border-b-0 lg:border-t lg:border-slate-100 rounded-xl lg:rounded-b-xl lg:rounded-t-none p-3 lg:p-4 flex items-center justify-between">
        <span className="text-[12px] lg:text-[13px] text-slate-500">
          {pagination ? (
            <>
              <span className="lg:hidden">
                Trang {pagination.current_page || 1}/
                {pagination.last_page || 1} · {pagination.total || 0} phòng
              </span>

              <span className="hidden lg:inline">
                Hiển thị {pagination.from || 0} - {pagination.to || 0} trong
                tổng số {pagination.total || 0} phòng
              </span>
            </>
          ) : (
            <>
              <span className="lg:hidden">0 phòng</span>
              <span className="hidden lg:inline">Chưa có dữ liệu phòng</span>
            </>
          )}
        </span>

        <div className="flex items-center gap-3 lg:gap-4">
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              className="w-8 h-8 rounded-lg lg:rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
            >
              <i className="fa-solid fa-angle-left text-[12px]"></i>
            </button>

            <button
              type="button"
              className="w-8 h-8 rounded-lg lg:rounded bg-brand text-white font-medium flex items-center justify-center text-[13px]"
            >
              {pagination?.current_page || 1}
            </button>

            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => onPageChange?.(page + 1)}
              className="w-8 h-8 rounded-lg lg:rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
            >
              <i className="fa-solid fa-angle-right text-[12px]"></i>
            </button>
          </div>

          <select className="hidden lg:block border border-slate-200 rounded-lg text-[13px] px-3 py-1.5 text-slate-600 outline-none focus:border-brand bg-white">
            <option>10 / trang</option>
          </select>
        </div>
      </div>
    </div>
  );
}