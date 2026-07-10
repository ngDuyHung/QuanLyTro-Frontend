import { useState } from "react";
import { useNavigate } from "react-router-dom";
const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
};

const getStatusConfig = (status) => {
  switch (status) {
    case "reserved": // case Đặt cọc
      return {
        label: "Đã cọc",
        shortLabel: "Cọc",
        badgeClass: "bg-amber-50 text-amber-600 border border-amber-200",
        iconClass: "bg-amber-50 text-amber-500",
        icon: "fa-key",
      };
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
    // ...(room.status === "available"
    //   ? [
    //     {
    //       key: "createLease",
    //       label: "Tạo hợp đồng / thêm khách",
    //       icon: "fa-solid fa-user-plus",
    //       className: "text-brand",
    //     },
    //     {
    //       key: "maintenance",
    //       label: "Chuyển sang bảo trì",
    //       icon: "fa-solid fa-wrench",
    //       className: "text-orange-600",
    //     },
    //   ]
    //   : []),

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
  const navigate = useNavigate();
  const statusConfig = getStatusConfig(room.status);
  const tenantName = getTenantName(room);
  const tenantPhone = getTenantPhone(room);

  // Xác định trạng thái nợ từ API
  const hasDebt = room.payment_status === "debt";

  return (
    <div className={`bg-white border rounded-xl shadow-sm overflow-visible transition-colors ${hasDebt ? "border-red-300 shadow-red-50" : "border-slate-200"
      }`}>
      {/* Header */}
      <div className={`flex items-start justify-between gap-3 px-3.5 py-3 border-b ${hasDebt ? "border-red-100 bg-red-50/40 rounded-t-xl" : "border-slate-100"
        }`}>
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
          </div>
        </div>
      </div>

      {/* Main info (Chia 2 cột: Giá phòng & Thanh toán) */}
      <div className="px-3.5 py-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Cột 1: Giá phòng */}
          <div>
            <p className="text-[11px] text-slate-500 mb-1">Giá phòng</p>
            <p className="text-[15px] font-bold text-brand leading-tight truncate">
              {formatCurrency(room.current_price)}
            </p>
          </div>

          {/* Cột 2: Trạng thái thanh toán */}
          <div>
            <p className="text-[11px] text-slate-500 mb-1">Thanh toán</p>
            {room.payment_status === "debt" ? (
              /* THIẾT KẾ NÚT BẤM KHI CÓ NỢ */
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/landlord/invoices?property_id=${room.property_id}&room_id=${room.id}`);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-bold bg-red-50 text-red-600 border border-red-200 active:bg-red-100 active:scale-[0.96] transition-all cursor-pointer shadow-sm"
              >
                <i className="fa-solid fa-circle-exclamation text-[12px]"></i>
                <span>Nợ {formatCurrency(room.unpaid_amount)}</span>
              </div>
            ) : room.payment_status === "paid" ? (
              /* TRẠNG THÁI ĐÃ THU ĐỦ */
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[13px] pt-0.5">
                <i className="fa-solid fa-circle-check text-[14px]"></i>
                <span>Đã thu đủ</span>
              </div>
            ) : room.payment_status === "unbilled" ? (
              /* TRẠNG THÁI CHƯA LẬP HÓA ĐƠN */
              <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-[13px] pt-0.5">
                <i className="fa-solid fa-file-circle-plus text-[14px]"></i>
                <span>Chưa lập HĐ</span>
              </div>
            ) : (
              /* TRẠNG THÁI TRỐNG HOẶC KHÁC */
              <p className="text-[13px] font-semibold text-slate-400 leading-tight pt-0.5">
                —
              </p>
            )}
          </div>
        </div>

        {/* Thông tin người thuê */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          {tenantName ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-user text-slate-400 text-[11px]"></i>
              </div>

              <div className="min-w-0 flex-1 flex justify-between items-center">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800 truncate">
                    {tenantName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {tenantPhone || "Chưa có số điện thoại"}
                  </p>
                </div>
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

      {/* Footer actions Mobile */}
      <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2 rounded-b-xl">
        {room.status === "available" ? (
          <>
            <button
              type="button"
              onClick={() => onAction?.("reserve", room)}
              className="flex-1 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[12px] font-semibold text-amber-600 flex items-center justify-center gap-1.5 active:bg-amber-100"
            >
              <i className="fa-solid fa-hand-holding-dollar"></i> Nhận cọc
            </button>
            <button
              type="button"
              onClick={() => onAction?.("createLease", room)}
              className="flex-1 py-2 rounded-lg border border-brand bg-brand text-[12px] font-semibold text-white flex items-center justify-center gap-1.5 active:bg-brand-dark"
            >
              <i className="fa-solid fa-file-signature"></i> Tạo hợp đồng
            </button>
          </>
        ) : room.status === "reserved" ? (
          <>
            <button
              type="button"
              onClick={() => onAction?.("createLease", room)}
              className="flex-1 py-2 rounded-lg border border-brand bg-brand text-[12px] font-semibold text-white flex items-center justify-center gap-1.5 active:bg-brand-dark"
            >
              <i className="fa-solid fa-check-double"></i> Nhận phòng
            </button>
            <button
              type="button"
              onClick={() => onAction?.("cancelReserve", room)}
              className="flex-1 py-2 rounded-lg border border-red-200 bg-red-50 text-[12px] font-semibold text-red-600 flex items-center justify-center gap-1.5 active:bg-red-100"
            >
              <i className="fa-solid fa-ban"></i> Hủy cọc
            </button>
          </>
        ) : room.status === "maintenance" ? (
          <button
            type="button"
            onClick={() => onAction?.("available", room)}
            className="flex-1 py-2 rounded-lg border border-orange-200 bg-orange-50 text-[12px] font-semibold text-orange-600 flex items-center justify-center gap-1.5 active:bg-orange-100"
          >
            <i className="fa-solid fa-wrench"></i> Bảo trì xong
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onAction?.("view", room)}
              className="flex-1 py-2 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-600 flex items-center justify-center gap-1.5 active:bg-slate-100"
            >
              <i className="fa-regular fa-eye text-slate-400"></i>
              Xem chi tiết
            </button>
            <button
              type="button"
              onClick={() => onAction?.("invoice", room)}
              className="flex-1 py-2 rounded-lg border border-green-200 bg-green-50 text-[12px] font-semibold text-brand flex items-center justify-center gap-1.5 active:bg-green-100"
            >
              <i className="fa-solid fa-file-invoice-dollar"></i> Lập hóa đơn
            </button>
          </>
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

function MobileRoomActionSheet({ room, open, onClose, onAction }) {
  if (!open || !room) return null;

  return (
    <div
      className="fixed inset-0 z-[60] lg:hidden bg-slate-900/50 backdrop-blur-[2px] flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-2xl shadow-2xl animate-[slideUp_0.2s_ease-out] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-4"></div>
          <p className="text-[13px] text-slate-500">Thao tác phòng</p>
          <h3 className="text-[16px] font-bold text-slate-800 mt-0.5 line-clamp-1">
            {room.name}
          </h3>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => { onClose(); onAction("view", room); }}
            className="w-full px-4 py-3.5 rounded-xl text-left text-[14px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3"
          >
            <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <i className="fa-regular fa-eye text-[15px]"></i>
            </span>
            <span>Xem chi tiết</span>
          </button>

          <button
            type="button"
            onClick={() => { onClose(); onAction("edit", room); }}
            className="w-full mt-1 px-4 py-3.5 rounded-xl text-left text-[14px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3"
          >
            <span className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <i className="fa-regular fa-pen-to-square text-[15px]"></i>
            </span>
            <span>Chỉnh sửa phòng</span>
          </button>

          <button
            type="button"
            disabled={room.status !== "available"}
            onClick={() => { onClose(); onAction("delete", room); }}
            className={`w-full mt-1 px-4 py-3.5 rounded-xl text-left text-[14px] font-semibold flex items-center gap-3 ${room.status === "available"
              ? "text-red-600 hover:bg-red-50"
              : "text-slate-400 cursor-not-allowed opacity-60"
              }`}
          >
            <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${room.status === "available" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-400"}`}>
              <i className="fa-regular fa-trash-can text-[15px]"></i>
            </span>
            <span>Xóa phòng {room.status !== "available" && <span className="text-[11px] font-normal italic ml-1">(Chỉ xóa phòng trống)</span>}</span>
          </button>
        </div>

        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-100 text-[14px] font-semibold text-slate-600"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
export default function RoomTable({
  rooms = [],
  properties = [],
  pagination,
  page,
  onPageChange,
  isLoading = false,
  searchText = "",
  onSearchTextChange,
  status = "",
  onStatusChange,
  propertyId = "",
  onPropertyIdChange,
  sort = "created_at_desc",
  onSortChange,
  onClearFilters,
  onEditRoom,
  onViewRoom,
  onDeleteRoom,
  onCreateLease,
  onViewInvoices,
  onRecordMeter,
  onUpdateStatus,
  onReserve,
  onCancelReserve,
}) {
  const [activeActionRoomId, setActiveActionRoomId] = useState(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false); // STATE MỚI CHO BỘ LỌC
  const navigate = useNavigate();

  // Đếm số lượng bộ lọc đang được áp dụng để hiển thị Badge đỏ
  const activeFilterCount =
    (propertyId ? 1 : 0) +
    (status ? 1 : 0) +
    (sort !== "created_at_desc" ? 1 : 0);

  const isFilterActive =
    searchText !== "" || activeFilterCount > 0;

  // HÀM TẠO TIÊU ĐỀ CỘT CÓ THỂ CLICK ĐỂ SẮP XẾP
  const renderSortableHeader = (label, sortAscKey, sortDescKey, widthClass = "") => {
    const isActive = sort === sortAscKey || sort === sortDescKey;
    const isAsc = sort === sortAscKey;
    const nextSort = isAsc ? sortDescKey : sortAscKey;

    return (
      <th
        className={`py-3 px-4 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors group select-none ${widthClass}`}
        onClick={() => onSortChange?.(nextSort)}
        title={`Nhấn để sắp xếp theo ${label}`}
      >
        <div className="flex items-center gap-1.5 w-max">
          <span>{label}</span>
          <i
            className={`fa-solid text-[12px] ${isActive
              ? isAsc
                ? "fa-sort-up text-brand mt-1"
                : "fa-sort-down text-brand mb-1"
              : "fa-sort text-slate-300 group-hover:text-slate-400"
              }`}
          ></i>
        </div>
      </th>
    );
  };

  const handleAction = (actionKey, room) => {
    setActiveActionRoomId(null);
    switch (actionKey) {
      case "view": onViewRoom?.(room); return;
      case "edit":
      case "images": onEditRoom?.(room); return;
      case "delete": onDeleteRoom?.(room); return;
      case "createLease": onCreateLease?.(room); return;
      case "reserve": onReserve?.(room); return;
      case "cancelReserve": onCancelReserve?.(room); return;
      case "invoice": onViewInvoices?.(room); return;
      case "meter": onRecordMeter?.(room); return;
      case "maintenance": onUpdateStatus?.(room, "maintenance"); return;
      case "available": onUpdateStatus?.(room, "available"); return;
      default: return;
    }
  };

  // --- GIAO DIỆN NỘI DUNG CỦA BỘ LỌC (Dùng chung cho cả Desktop & Mobile) ---
  const FilterContent = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold text-slate-700">Khu nhà</label>
        <select
          value={propertyId}
          onChange={(event) => onPropertyIdChange?.(event.target.value)}
          className="w-full border border-slate-200 rounded-lg text-[13px] px-3 py-2.5 text-slate-600 outline-none focus:border-brand bg-slate-50 focus:bg-white transition-colors"
        >
          <option value="">Tất cả khu nhà</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold text-slate-700">Trạng thái phòng</label>
        <select
          value={status}
          onChange={(event) => onStatusChange?.(event.target.value)}
          className="w-full border border-slate-200 rounded-lg text-[13px] px-3 py-2.5 text-slate-600 outline-none focus:border-brand bg-slate-50 focus:bg-white transition-colors"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">Phòng trống</option>
          <option value="reserved">Đang đặt cọc</option>
          <option value="occupied">Đang thuê</option>
          <option value="maintenance">Bảo trì</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold text-slate-700">Sắp xếp theo</label>
        <select
          value={sort}
          onChange={(event) => onSortChange?.(event.target.value)}
          className="w-full border border-slate-200 rounded-lg text-[13px] px-3 py-2.5 text-slate-600 outline-none focus:border-brand bg-slate-50 focus:bg-white transition-colors"
        >
          <option value="created_at_desc">Mới nhất</option>
          <option value="created_at_asc">Cũ nhất</option>
          <option value="price_asc">Giá phòng: Thấp đến cao</option>
          <option value="price_desc">Giá phòng: Cao đến thấp</option>
          <option value="name_asc">Tên phòng: A - Z</option>
          <option value="name_desc">Tên phòng: Z - A</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="mb-6 flex flex-col gap-3 lg:gap-0 lg:bg-white lg:border lg:border-slate-200 lg:rounded-xl lg:shadow-sm">

      {/* ========================================================= */}
      {/* BỘ LỌC CHO DESKTOP (Hiển thị dàn trải, không bị giấu đi) */}
      {/* ========================================================= */}
      <div className="hidden lg:flex bg-white border-b border-slate-100 p-4 gap-3 items-center justify-between">
        <div className="flex gap-3 items-center flex-1 min-w-0">
          {/* Ô Tìm kiếm */}
          <div className="relative w-[260px] shrink-0">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              value={searchText}
              onChange={(event) => onSearchTextChange?.(event.target.value)}
              placeholder="Tìm kiếm phòng..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-shadow"
            />
          </div>

          <div className="flex gap-2">
            {/* Dropdown Chọn Khu nhà */}
            <select
              value={propertyId}
              onChange={(event) => onPropertyIdChange?.(event.target.value)}
              className="shrink-0 min-w-[150px] border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand bg-white cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="">Tất cả khu nhà</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>

            {/* Dropdown Trạng thái */}
            <select
              value={status}
              onChange={(event) => onStatusChange?.(event.target.value)}
              className="shrink-0 min-w-[150px] border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand bg-white cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="available">Phòng trống</option>
              <option value="reserved">Đang đặt cọc</option>
              <option value="occupied">Đang thuê</option>
              <option value="maintenance">Bảo trì</option>
            </select>

            {/* Dropdown Sắp xếp (Chuyển ra ngoài cho PC) */}
            <select
              value={sort}
              onChange={(event) => onSortChange?.(event.target.value)}
              className="shrink-0 min-w-[160px] border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand bg-white cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="created_at_desc">Sắp xếp: Mới nhất</option>
              <option value="created_at_asc">Sắp xếp: Cũ nhất</option>
              <option value="price_asc">Giá phòng: Thấp đến cao</option>
              <option value="price_desc">Giá phòng: Cao đến thấp</option>
              <option value="name_asc">Tên phòng: A - Z</option>
              <option value="name_desc">Tên phòng: Z - A</option>
            </select>
          </div>
        </div>

        {/* Nút Xóa lọc PC */}
        {isFilterActive && (
          <button
            type="button"
            onClick={onClearFilters}
            className="shrink-0 text-[13px] text-red-500 hover:text-red-600 font-medium px-2 flex items-center gap-1.5 transition-colors bg-red-50 hover:bg-red-100 py-1.5 rounded-md"
          >
            <i className="fa-solid fa-xmark"></i> Xóa lọc
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* BỘ LỌC CHO MOBILE (Nút bấm thu gọn + Bottom Sheet)        */}
      {/* ========================================================= */}
      <div className="lg:hidden bg-white border border-slate-200 rounded-xl p-3 flex gap-3 items-center shadow-sm relative">
        {/* Ô Tìm kiếm Mobile */}
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            value={searchText}
            onChange={(event) => onSearchTextChange?.(event.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-[13px] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
          />
        </div>

        {/* Nút Mở Bottom Sheet Mobile */}
        <button
          type="button"
          onClick={() => setIsFilterMenuOpen(true)}
          className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 border rounded-lg text-[13px] font-medium transition-colors ${activeFilterCount > 0
            ? "border-brand text-brand bg-brand/5"
            : "border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
            }`}
        >
          <i className="fa-solid fa-filter"></i>
          <span className="hidden sm:inline">Lọc</span>

          {/* Chấm đỏ thông báo số lượng bộ lọc đang bật */}
          {activeFilterCount > 0 && (
            <span className="bg-brand text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shrink-0">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* BOTTOM SHEET CHO MOBILE */}
      {isFilterMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden bg-slate-900/50 backdrop-blur-[2px] flex items-end">
          <div className="absolute inset-0" onClick={() => setIsFilterMenuOpen(false)}></div>
          <div className="w-full bg-white rounded-t-2xl shadow-2xl animate-[slideUp_0.2s_ease-out] relative z-10 flex flex-col max-h-[85vh]">
            <div className="px-5 pt-3 pb-4 border-b border-slate-100 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-4"></div>
              <div className="flex justify-between items-center">
                <h3 className="text-[16px] font-bold text-slate-800">Bộ lọc & Sắp xếp</h3>
                {activeFilterCount > 0 && (
                  <button onClick={() => { onClearFilters(); setIsFilterMenuOpen(false); }} className="text-[13px] text-red-500 font-medium">Xóa lọc</button>
                )}
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col gap-5 no-scrollbar">
              {FilterContent}
            </div>

            <div className="px-5 pb-5 pt-3 border-t border-slate-100 shrink-0">
              <button onClick={() => setIsFilterMenuOpen(false)} className="w-full py-3 bg-brand text-white rounded-xl text-[14px] font-semibold active:scale-[0.98] transition-transform shadow-sm shadow-brand/30">
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

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
      <div className="hidden lg:block overflow-visible w-full">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50/50 text-[12px] text-slate-500 font-medium">
            <tr>
              <th className="py-3 px-4 border-b border-slate-100 w-[40px]">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand focus:ring-brand"
                />
              </th>

              {/* GỌI HÀM ĐỂ TẠO CỘT CÓ THỂ BẤM SORT */}
              {renderSortableHeader("Phòng", "name_asc", "name_desc")}

              <th className="py-3 px-4 border-b border-slate-100">Khu nhà</th>
              <th className="py-3 px-4 border-b border-slate-100">Diện tích</th>

              {renderSortableHeader("Giá phòng", "price_asc", "price_desc")}

              <th className="py-3 px-4 border-b border-slate-100">Trạng thái</th>
              <th className="py-3 px-4 border-b border-slate-100">Người thuê</th>
              <th className="py-3 px-4 border-b border-slate-100">Thanh toán</th>

              {renderSortableHeader("Ngày tạo", "created_at_asc", "created_at_desc")}

              <th className="py-3 px-4 border-b border-slate-100 text-right w-40">
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
                  <td colSpan={10} className="py-3 px-4">
                    <div className="h-8 bg-slate-100 rounded"></div>
                  </td>
                </tr>
              ))
            ) : rooms.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
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
                    className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${activeActionRoomId === room.id ? "relative z-40" : "relative z-0"
                      }`}
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

                    {/* CỘT THANH TOÁN DESKTOP */}
                    <td className="py-3 px-4">
                      {room.payment_status === "debt" ? (
                        <div
                          onClick={() => navigate(`/landlord/invoices?property_id=${room.property_id}&room_id=${room.id}`)}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
                          title={`Phòng ${room.name} đang nợ tiền. Nhấn để xem chi tiết hóa đơn.`}
                        >
                          <i className="fa-solid fa-circle-exclamation text-[11px]"></i>
                          <span>Nợ {formatCurrency(room.unpaid_amount)}</span>
                        </div>
                      ) : room.payment_status === "paid" ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[13px] pl-1">
                          <i className="fa-solid fa-circle-check text-[14px]"></i>
                          <span>Đã thu đủ</span>
                        </div>
                      ) : room.payment_status === "unbilled" ? (
                        <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-[13px] pl-1" title="Chưa lập hóa đơn cho kỳ hiện tại">
                          <i className="fa-solid fa-file-circle-plus text-[14px]"></i>
                          <span>Chưa lập HĐ</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 pl-4">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-400">{room.created_at ? new Date(room.created_at).toLocaleDateString() : "—"}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        {/* TRẠNG THÁI TRỐNG */}
                        {room.status === "available" && (
                          <>
                            <button onClick={() => handleAction("reserve", room)} className="flex items-center px-3 py-1.5 bg-white text-amber-600 border border-amber-200 rounded-lg text-[12px] font-semibold hover:bg-amber-50 transition-all shadow-sm whitespace-nowrap">
                              <i className="fa-solid fa-hand-holding-dollar mr-1.5"></i> Nhận cọc
                            </button>
                            <button onClick={() => handleAction("createLease", room)} className="flex items-center px-3 py-1.5 bg-brand text-white border border-brand rounded-lg text-[12px] font-semibold hover:bg-brand-dark transition-all shadow-sm whitespace-nowrap">
                              <i className="fa-solid fa-file-signature mr-1.5"></i> Tạo HĐ
                            </button>
                          </>
                        )}
                        {/* TRẠNG THÁI ĐÃ CỌC */}
                        {room.status === "reserved" && (
                          <>
                            {/* Hủy cọc (Secondary) đặt bên trái, Nhận phòng (Primary) đặt bên phải */}
                            <button onClick={() => handleAction("cancelReserve", room)} className="flex items-center px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg text-[12px] font-semibold hover:bg-red-50 transition-all shadow-sm whitespace-nowrap">
                              <i className="fa-solid fa-ban mr-1.5"></i> Hủy cọc
                            </button>
                            <button onClick={() => handleAction("createLease", room)} className="flex items-center px-3 py-1.5 bg-brand text-white border border-brand rounded-lg text-[12px] font-semibold hover:bg-brand-dark transition-all shadow-sm whitespace-nowrap">
                              <i className="fa-solid fa-check-double mr-1.5"></i> Nhận phòng
                            </button>
                          </>
                        )}
                        {/* TRẠNG THÁI ĐANG THUÊ */}
                        {room.status === "occupied" && (
                          <button onClick={() => handleAction("invoice", room)} className="flex items-center px-3 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg text-[12px] font-semibold hover:bg-blue-50 transition-all shadow-sm whitespace-nowrap">
                            <i className="fa-solid fa-file-invoice-dollar mr-1.5"></i>Lập hóa đơn
                          </button>
                        )}
                        {/* NÚT MENU 3 CHẤM */}
                        <button
                          type="button"
                          onClick={() =>
                            setActiveActionRoomId((currentId) =>
                              currentId === room.id ? null : room.id,
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm shrink-0"
                          title="Thao tác khác"
                        >
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        {/* DROPDOWN MENU */}
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
                Trang {pagination.current_page || 1}/{pagination.last_page || 1} · {pagination.total || 0} phòng
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

        {pagination?.last_page > 1 && (
          <div className="flex items-center gap-1">
            {/* Nút lùi trang */}
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-angle-left text-[12px] lg:text-[11px]"></i>
            </button>

            {/* MOBILE UI: Chỉ hiện một ô số trang hiện tại */}
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
                    onClick={() => onPageChange?.(pageNumber)}
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
              onClick={() => onPageChange?.(page + 1)}
              className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-angle-right text-[12px] lg:text-[11px]"></i>
            </button>
          </div>
        )}
      </div>
      <MobileRoomActionSheet
        open={!!activeActionRoomId && window.innerWidth < 1024}
        room={rooms.find(r => r.id === activeActionRoomId)}
        onClose={() => setActiveActionRoomId(null)}
        onAction={handleAction}
      />
    </div>
  );
}