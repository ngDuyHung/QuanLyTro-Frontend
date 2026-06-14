const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
};

const getStatusConfig = (status) => {
  switch (status) {
    case "occupied":
      return {
        label: "Đang thuê",
        className: "bg-green-50 text-green-600",
      };

    case "maintenance":
      return {
        label: "Bảo trì",
        className: "bg-orange-50 text-orange-500",
      };

    case "available":
    default:
      return {
        label: "Trống",
        className: "bg-blue-50 text-blue-500",
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
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">
      {/* Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative w-[240px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              value={searchText}
              onChange={(event) => onSearchTextChange?.(event.target.value)}
              placeholder="Tìm kiếm phòng, khu nhà..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(event) => onStatusChange?.(event.target.value)}
            className="border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="available">Phòng trống</option>
            <option value="occupied">Đang thuê</option>
            <option value="maintenance">Bảo trì</option>
          </select>
          <select className="border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand">
            <option>Trạng thái thuê</option>
          </select>
          <select className="border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand">
            <option>Trạng thái thanh toán</option>
          </select>
          <select className="border border-slate-200 rounded-lg text-[13px] px-3 py-2 text-slate-600 outline-none focus:border-brand">
            <option>Hợp đồng hết hạn</option>
          </select>
          <button className="border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <i className="fa-solid fa-filter"></i> Thêm bộ lọc
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[13px] text-slate-500 hover:text-slate-800 px-2">
            Xóa lọc
          </button>
          <button className="bg-brand-50 text-brand border border-green-200 rounded-lg px-3 py-2 text-[13px] font-medium hover:bg-green-100 flex items-center gap-2">
            <i className="fa-regular fa-floppy-disk"></i> Lưu bộ lọc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
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
                Trạng thái thuê{" "}
                <i className="fa-solid fa-sort ml-1 text-slate-300"></i>
              </th>
              <th className="py-3 px-4 border-b border-slate-100">
                Thanh toán{" "}
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

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">
                        {room.property?.name || "—"}
                      </p>
                      <p className="text-[11px] text-slate-500">
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
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${statusConfig.className}`}
                      >
                        {room.status_label || statusConfig.label}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-400">—</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-400">—</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-400">—</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                          title="Xem chi tiết"
                        >
                          <i className="fa-regular fa-eye"></i>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditRoom?.(room)}
                          className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-brand hover:border-green-200 hover:bg-green-50 flex items-center justify-center"
                          title="Sửa phòng"
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                        </button>

                        <button
                          type="button"
                          className="w-8 h-8 rounded border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                          title="Thao tác khác"
                        >
                          <i className="fa-solid fa-ellipsis-vertical"></i>
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

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[13px] text-slate-500">
          {pagination ? (
            <>
              Hiển thị {pagination.from || 0} - {pagination.to || 0} trong tổng
              số {pagination.total || 0} phòng
            </>
          ) : (
            "Chưa có dữ liệu phòng"
          )}
        </span>

        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!pagination || page <= 1}
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-angle-left"></i>
            </button>

            <button className="w-8 h-8 rounded bg-brand text-white font-medium flex items-center justify-center">
              {pagination?.current_page || 1}
            </button>

            <button
              type="button"
              disabled={!pagination || page >= pagination.last_page}
              onClick={() => onPageChange?.(page + 1)}
              className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-angle-right"></i>
            </button>
          </div>

          <select className="border border-slate-200 rounded-lg text-[13px] px-3 py-1.5 text-slate-600 outline-none focus:border-brand">
            <option>10 / trang</option>
          </select>
        </div>
      </div>
    </div>
  );
}
