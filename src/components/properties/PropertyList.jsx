const fallbackImages = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=300",
];

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

function PropertyCard({ property, index, isSelected, onSelect }) {
  const status = getStatusConfig(property.status);
  const totalRooms = property.total_rooms ?? property.rooms_count ?? 0;
  const expectedRooms = property.expected_rooms_count ?? 0;

  const imageUrl =
    property.cover_image_url ||
    property.cover_image_path ||
    fallbackImages[index % fallbackImages.length];

  return (
    <button
      type="button"
      onClick={() => onSelect(property.id)}
      className={`text-left flex-shrink-0 w-[148px] lg:w-full bg-white rounded-xl p-2.5 lg:p-3.5 cursor-pointer shadow-sm flex flex-col lg:flex-row lg:gap-4 transition-all ${
        isSelected
          ? "border-2 border-brand"
          : "border border-slate-200 hover:border-brand"
      } ${property.status === "inactive" ? "opacity-80 hover:opacity-100" : ""}`}
    >
      {/* Ảnh Cover */}
      <div className="w-full h-[66px] lg:w-[130px] lg:h-[130px] rounded-lg overflow-hidden shrink-0 mb-2 lg:mb-0">
        <img
          src={imageUrl}
          alt={property.name}
          className={`w-full h-full object-cover ${
            property.status === "inactive" ? "grayscale" : ""
          }`}
        />
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

            <span className="hidden shrink-0 text-slate-400 lg:block">
              <i className="fa-solid fa-ellipsis"></i>
            </span>
          </div>

          <p className="hidden lg:flex text-[12px] text-slate-500 mt-1.5 items-start gap-1.5 line-clamp-2">
            <i className="fa-solid fa-location-dot mt-0.5 text-slate-400 shrink-0"></i>
            {property.address}
          </p>

          {property.code && (
            <p className="hidden lg:block text-[11px] text-slate-400 mt-1">
              Mã khu: <span className="font-semibold">{property.code}</span>
            </p>
          )}
        </div>

        <div className="mt-1 lg:mt-2 lg:pt-2 lg:border-t lg:border-slate-50">
          {/* Mobile */}
          <div className="flex items-center justify-between lg:hidden">
            <p className="text-[11px] text-slate-500">
              {totalRooms}/{expectedRooms || totalRooms} phòng
            </p>

            <span
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${status.className}`}
            >
              {status.shortLabel}
            </span>
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

            <div className="text-[10px] text-slate-400 mt-2.5">
              Cập nhật:{" "}
              {property.updated_at
                ? new Date(property.updated_at).toLocaleDateString("vi-VN")
                : "—"}
            </div>
          </div>
        </div>
      </div>
    </button>
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
  isLoading = false,
  pagination,
  page,
  onPageChange,
}) {
  const total = pagination?.total ?? properties.length;
  const lastPage = pagination?.last_page ?? 1;

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

        <p className="text-[14px] font-bold text-slate-700">
          Chưa có khu nhà
        </p>

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
            onSelect={onSelectProperty}
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
    </>
  );
}