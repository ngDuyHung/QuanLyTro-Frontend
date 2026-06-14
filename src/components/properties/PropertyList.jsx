import { useState } from "react";

const getStatusConfig = (status) => {
  switch (status) {
    case "inactive":
      return {
        label: "Tạm ngưng",
        shortLabel: "TN",
        className: "bg-orange-50 text-orange-500",
      };

    case "active":
    default:
      return {
        label: "Đang hoạt động",
        shortLabel: "HĐ",
        className: "bg-green-50 text-green-600",
      };
  }
};

function PropertyActionMenu({ property, onEdit, onDelete }) {
  const totalRooms = property.total_rooms ?? property.rooms_count ?? 0;
  const hasRooms = totalRooms > 0;

  return (
    <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 z-30 overflow-hidden">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEdit?.(property);
        }}
        className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
      >
        <i className="fa-regular fa-pen-to-square w-4 text-center text-[12px] text-brand"></i>
        <span>Sửa thông tin</span>
      </button>

      <button
        type="button"
        disabled={hasRooms}
        onClick={(event) => {
          event.stopPropagation();

          if (hasRooms) return;

          onDelete?.(property);
        }}
        className={`w-full px-3.5 py-2.5 text-left text-[13px] font-medium flex items-center gap-2.5 ${
          hasRooms
            ? "text-slate-400 bg-slate-50 cursor-not-allowed"
            : "text-red-600 hover:bg-red-50"
        }`}
      >
        <i className="fa-regular fa-trash-can w-4 text-center text-[12px]"></i>
        <span>Xóa khu nhà</span>
      </button>

      {hasRooms && (
        <div className="px-3.5 py-2 bg-amber-50 border-t border-amber-100 text-[11px] leading-4 text-amber-700">
          Chỉ xóa được khi khu nhà chưa có phòng.
        </div>
      )}
    </div>
  );
}

function MobilePropertyActionSheet({
  property,
  open,
  onClose,
  onEdit,
  onDelete,
}) {
  if (!open || !property) return null;

  const totalRooms = property.total_rooms ?? property.rooms_count ?? 0;
  const hasRooms = totalRooms > 0;

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

          <p className="text-[13px] text-slate-500">Thao tác khu nhà</p>
          <h3 className="text-[16px] font-bold text-slate-800 mt-0.5 line-clamp-1">
            {property.name}
          </h3>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onEdit?.(property);
            }}
            className="w-full px-4 py-3.5 rounded-xl text-left text-[14px] font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 flex items-center gap-3"
          >
            <span className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <i className="fa-regular fa-pen-to-square text-[15px]"></i>
            </span>
            <span>Sửa thông tin khu nhà</span>
          </button>

          <button
            type="button"
            disabled={hasRooms}
            onClick={() => {
              if (hasRooms) return;

              onClose?.();
              onDelete?.(property);
            }}
            className={`w-full mt-1 px-4 py-3.5 rounded-xl text-left text-[14px] font-semibold flex items-center gap-3 ${
              hasRooms
                ? "text-slate-400 bg-slate-50 cursor-not-allowed"
                : "text-red-600 hover:bg-red-50 active:bg-red-100"
            }`}
          >
            <span
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                hasRooms
                  ? "bg-slate-100 text-slate-400"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <i className="fa-regular fa-trash-can text-[15px]"></i>
            </span>
            <span>Xóa khu nhà</span>
          </button>

          {hasRooms && (
            <div className="mt-2 mx-1 px-3 py-2 rounded-lg bg-amber-50 text-[12px] leading-5 text-amber-700">
              Khu nhà đang có phòng nên chưa thể xóa. Hãy xóa hoặc chuyển phòng
              trước.
            </div>
          )}
        </div>

        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-100 text-[14px] font-semibold text-slate-600 active:bg-slate-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyCard({
  property,
  index,
  isSelected,
  onSelect,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
}) {
  const status = getStatusConfig(property.status);
  const totalRooms = property.total_rooms ?? property.rooms_count ?? 0;
  const expectedRooms = property.expected_rooms_count ?? 0;

  const imageUrl = property.cover_image_url || "";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(property.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect?.(property.id);
        }
      }}
      className={`relative text-left flex-shrink-0 w-[148px] lg:w-full bg-white rounded-xl p-2.5 lg:p-3.5 cursor-pointer shadow-sm flex flex-col lg:flex-row lg:gap-4 transition-all ${
        isSelected
          ? "border-2 border-brand"
          : "border border-slate-200 hover:border-brand"
      } ${property.status === "inactive" ? "opacity-80 hover:opacity-100" : ""}`}
    >
      {/* Ảnh Cover */}
      <div className="w-full h-[66px] lg:w-[130px] lg:h-[130px] rounded-lg overflow-hidden shrink-0 mb-2 lg:mb-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={property.name}
            className={`w-full h-full object-cover ${
              property.status === "inactive" ? "grayscale" : ""
            }`}
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center ${
              property.status === "inactive" ? "grayscale opacity-70" : ""
            }`}
          >
            <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <i className="fa-regular fa-building text-[15px] lg:text-[22px]"></i>
            </div>
            <span className="hidden lg:block text-[11px] text-slate-400 mt-2">
              Chưa có ảnh
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0 w-full lg:w-auto">
              <h3 className="text-[12px] lg:text-[15px] font-bold text-slate-800 truncate w-full lg:w-auto lg:whitespace-normal">
                {property.name}
              </h3>

              <span
                className={`hidden lg:inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <div className="hidden shrink-0 lg:block relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleMenu?.(property.id);
                }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center"
              >
                <i className="fa-solid fa-ellipsis"></i>
              </button>

              {isMenuOpen && (
                <PropertyActionMenu
                  property={property}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )}
            </div>
          </div>

          <p className="hidden lg:flex text-[12px] text-slate-500 mt-1.5 items-start gap-1.5 line-clamp-2">
            <i className="fa-solid fa-location-dot mt-0.5 text-slate-400 shrink-0"></i>
            {property.address}
          </p>
        </div>

        <div className="mt-1 lg:mt-2 lg:pt-2 lg:border-t lg:border-slate-50">
          {/* Mobile */}
          <div className="flex items-center justify-between lg:hidden gap-2">
            <p className="text-[11px] text-slate-500">
              {totalRooms}/{expectedRooms || totalRooms} phòng
            </p>

            <div className="flex items-center gap-1.5 relative">
              <span
                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${status.className}`}
              >
                {status.shortLabel}
              </span>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleMenu?.(property.id);
                }}
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-400 bg-white flex items-center justify-center"
              >
                <i className="fa-solid fa-ellipsis-vertical text-[11px]"></i>
              </button>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-[16px] font-bold text-slate-800 leading-none">
                  {expectedRooms || totalRooms}
                </p>
                <p className="text-[10px] text-slate-500 mt-1.5">Dự kiến</p>
              </div>

              <div>
                <p className="text-[16px] font-bold text-slate-800 leading-none">
                  {totalRooms}
                </p>
                <p className="text-[10px] text-slate-500 mt-1.5">Đã tạo</p>
              </div>

              <div>
                <p className="text-[16px] font-bold text-slate-800 leading-none">
                  {property.floors_count ?? 0}
                </p>
                <p className="text-[10px] text-slate-500 mt-1.5">Số tầng</p>
              </div>

              <div>
                <p className="text-[16px] font-bold text-slate-800 leading-none">
                  {Math.max((expectedRooms || 0) - totalRooms, 0)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1.5">Còn lại</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-400 mt-2.5 text-[10px] lg:text-[11px]">
              {property.code && (
                <p className="hidden lg:block">
                  Mã khu: <span className="font-semibold">{property.code}</span>
                </p>
              )}

              <div>
                Cập nhật:{" "}
                {property.updated_at
                  ? new Date(property.updated_at).toLocaleDateString("vi-VN")
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <div className="flex-shrink-0 w-[148px] lg:w-full bg-white border border-slate-200 rounded-xl p-2.5 lg:p-3.5 shadow-sm flex flex-col lg:flex-row lg:gap-4 animate-pulse">
      <div className="w-full h-[66px] lg:w-[130px] lg:h-[130px] rounded-lg bg-slate-100 shrink-0 mb-2 lg:mb-0"></div>

      <div className="flex-1 min-w-0">
        <div className="h-4 bg-slate-100 rounded w-2/3 mb-3"></div>
        <div className="hidden lg:block h-3 bg-slate-100 rounded w-full mb-2"></div>
        <div className="hidden lg:block h-3 bg-slate-100 rounded w-3/4"></div>
      </div>
    </div>
  );
}

export default function PropertyList({
  properties = [],
  selectedPropertyId,
  onSelectProperty,
  onEditProperty,
  onDeleteProperty,
  isLoading = false,
  pagination,
  page,
  onPageChange,
}) {
  const [activeMenuPropertyId, setActiveMenuPropertyId] = useState(null);

  const total = pagination?.total ?? properties.length;
  const lastPage = pagination?.last_page ?? 1;
  const activeMenuProperty =
    properties.find((property) => property.id === activeMenuPropertyId) || null;

  const handleToggleMenu = (propertyId) => {
    setActiveMenuPropertyId((currentId) =>
      currentId === propertyId ? null : propertyId,
    );
  };

  const handleEditProperty = (property) => {
    setActiveMenuPropertyId(null);
    onEditProperty?.(property);
  };

  const handleDeleteProperty = (property) => {
    setActiveMenuPropertyId(null);
    onDeleteProperty?.(property);
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between mb-2 lg:hidden">
          <p className="text-[13px] font-bold text-slate-700">Chọn khu nhà</p>
          <span className="text-[12px] text-slate-400">Đang tải...</span>
        </div>

        <div className="flex gap-3 pb-2 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-y-visible lg:pb-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <PropertySkeleton key={index} />
          ))}
        </div>
      </>
    );
  }

  if (!properties.length) {
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-xl px-4 py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <i className="fa-regular fa-building text-lg"></i>
        </div>

        <p className="text-[14px] font-bold text-slate-700">Chưa có khu nhà</p>

        <p className="text-[12px] text-slate-500 mt-1">
          Bấm “Thêm khu nhà” để tạo khu nhà đầu tiên.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2 lg:hidden">
        <p className="text-[13px] font-bold text-slate-700">Chọn khu nhà</p>
        <span className="text-[12px] text-slate-400">{total} khu nhà</span>
      </div>

      <div className="flex gap-3 pb-2 overflow-x-auto no-scrollbar lg:flex-col lg:overflow-y-visible lg:pb-0">
        {properties.map((property, index) => (
          <PropertyCard
            key={property.id}
            property={property}
            index={index}
            isSelected={property.id === selectedPropertyId}
            isMenuOpen={activeMenuPropertyId === property.id}
            onToggleMenu={handleToggleMenu}
            onSelect={onSelectProperty}
            onEdit={handleEditProperty}
            onDelete={handleDeleteProperty}
          />
        ))}
      </div>

      {lastPage > 1 && (
        <div className="hidden lg:flex justify-center items-center gap-1 mt-2 mb-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-angle-left text-[12px]"></i>
          </button>

          {Array.from({ length: lastPage }).map((_, index) => {
            const pageNumber = index + 1;

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                  pageNumber === page
                    ? "bg-brand text-white shadow-sm shadow-green-600/20"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-angle-right text-[12px]"></i>
          </button>
        </div>
      )}
      <MobilePropertyActionSheet
        open={Boolean(activeMenuProperty)}
        property={activeMenuProperty}
        onClose={() => setActiveMenuPropertyId(null)}
        onEdit={handleEditProperty}
        onDelete={handleDeleteProperty}
      />
    </>
  );
}
