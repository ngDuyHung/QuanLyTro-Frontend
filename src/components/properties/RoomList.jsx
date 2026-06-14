import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AddRoomModal from "@/components/rooms/AddRoomModal";
import roomService from "@/services/roomService";

const PER_PAGE = 8;

const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
};

const getStatusConfig = (status) => {
  switch (status) {
    case "occupied":
      return {
        label: "Đang thuê",
        badgeClass: "bg-green-50 text-green-600",
        iconClass: "bg-green-50 text-green-500",
        icon: "fa-door-open",
      };

    case "maintenance":
      return {
        label: "Bảo trì",
        badgeClass: "bg-orange-50 text-orange-500",
        iconClass: "bg-orange-50 text-orange-400",
        icon: "fa-wrench",
      };

    case "available":
    default:
      return {
        label: "Trống",
        badgeClass: "bg-blue-50 text-blue-500",
        iconClass: "bg-blue-50 text-blue-400",
        icon: "fa-door-open",
      };
  }
};

const getRoomCoverImage = (room) => {
  const images = room.images || [];

  if (!images.length) return null;

  return (
    images.find((image) => image.is_cover)?.image_url ||
    images[0]?.image_url ||
    null
  );
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
  const status = room.status;

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
    ...(status === "available"
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
    ...(status === "maintenance"
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
      className: "text-red-600",
    },
  ];

  return (
    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 z-30 overflow-hidden text-left">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={() => onAction(action.key, room)}
          className={`w-full px-3.5 py-2.5 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-2.5 ${action.className}`}
        >
          <i className={`${action.icon} w-4 text-center text-[12px]`}></i>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyRoomState({ property }) {
  return (
    <div className="flex-1 bg-white border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center px-5 py-10">
      <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-3">
        <i className="fa-solid fa-door-open text-lg"></i>
      </div>
      <p className="text-[14px] font-bold text-slate-800">
        Chưa có phòng trong khu này
      </p>
      <p className="text-[12px] text-slate-500 mt-1 max-w-[320px]">
        {property?.name
          ? `Bạn có thể thêm phòng đầu tiên cho ${property.name}.`
          : "Vui lòng chọn khu nhà để xem danh sách phòng."}
      </p>
    </div>
  );
}

export default function RoomList({ property }) {
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [activeActionRoomId, setActiveActionRoomId] = useState(null);

  const propertyId = property?.id || null;

  const fetchRooms = useCallback(async () => {
    if (!propertyId) {
      setRooms([]);
      setPagination(null);
      return;
    }

    try {
      setIsLoadingRooms(true);

      const response = await roomService.getByProperty(propertyId, {
        page,
        per_page: PER_PAGE,
      });

      setRooms(response.data.data || []);
      setPagination(response.data.meta || null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách phòng.",
      );
    } finally {
      setIsLoadingRooms(false);
    }
  }, [propertyId, page]);

  useEffect(() => {
    setPage(1);
    setActiveActionRoomId(null);
  }, [propertyId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const roomStats = useMemo(() => {
    const total = pagination?.total ?? rooms.length;
    const occupied = rooms.filter((room) => room.status === "occupied").length;
    const available = rooms.filter((room) => room.status === "available").length;
    const maintenance = rooms.filter(
      (room) => room.status === "maintenance",
    ).length;

    return {
      total,
      occupied,
      available,
      maintenance,
    };
  }, [pagination?.total, rooms]);

  const handleCreateRoom = async (formDataPayload) => {
    if (!property?.id) {
      toast.error("Vui lòng chọn khu nhà trước khi thêm phòng.");
      return;
    }

    try {
      setIsCreatingRoom(true);

      await roomService.create(property.id, formDataPayload);

      toast.success("Tạo phòng thành công!", {
        autoClose: 1500,
      });

      setIsAddRoomOpen(false);

      if (page !== 1) {
        setPage(1);
      } else {
        await fetchRooms();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Không thể tạo phòng. Vui lòng thử lại.",
      );
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleAction = (actionKey, room) => {
    setActiveActionRoomId(null);

    const actionLabels = {
      view: "Xem chi tiết phòng",
      edit: "Chỉnh sửa phòng",
      images: "Cập nhật hình ảnh",
      meter: "Ghi điện nước",
      invoice: "Xem hóa đơn",
      createLease: "Tạo hợp đồng / thêm khách",
      maintenance: "Chuyển phòng sang bảo trì",
      available: "Đánh dấu phòng trống",
      delete: "Xóa phòng",
    };

    toast.info(`${actionLabels[actionKey] || "Thao tác"}: ${room.name}`, {
      autoClose: 1200,
    });
  };

  const canGoPrev = Boolean(pagination?.current_page > 1);
  const canGoNext = Boolean(
    pagination?.current_page && pagination?.current_page < pagination?.last_page,
  );

  return (
    <div className="flex flex-col flex-1">
      {/* Header chung của danh sách phòng (Mobile & Desktop) */}
      <div className="flex justify-between items-center mb-3 lg:px-5 lg:py-4 lg:bg-white lg:border lg:border-slate-200 lg:rounded-t-xl lg:mb-0 lg:border-b-0">
        <div>
          <p className="text-[14px] font-bold text-slate-800 lg:hidden">
            Danh sách phòng
          </p>
          <p className="text-[12px] text-brand font-semibold mt-0.5 lg:hidden">
            {property?.name || "Chưa chọn khu nhà"} · {roomStats.total} phòng
          </p>

          <h3 className="hidden lg:block text-[15px] font-bold text-slate-800">
            Phòng thuộc:{" "}
            <span className="text-brand">
              {property?.name || "Chưa chọn khu nhà"}
            </span>
          </h3>

          <p className="hidden lg:block text-[12px] text-slate-500 mt-1">
            Trống: {roomStats.available} · Đang thuê: {roomStats.occupied} · Bảo
            trì: {roomStats.maintenance}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              toast.info("Chức năng sắp xếp phòng sẽ làm ở bước sau.", {
                autoClose: 1200,
              })
            }
            className="hidden lg:flex border border-green-200 text-brand px-2.5 py-1.5 rounded-lg text-[13px] font-medium hover:bg-brand-50 transition-colors items-center gap-1.5"
          >
            <i className="fa-solid fa-arrow-down-a-z"></i>
            <span>Sắp xếp phòng</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddRoomOpen(true)}
            disabled={!property?.id}
            className="bg-brand text-white px-3.5 py-2 lg:px-2.5 lg:py-1.5 rounded-xl lg:rounded-lg text-[13px] font-semibold lg:font-medium hover:bg-brand-dark transition-colors flex items-center gap-1.5 shadow-sm lg:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-plus text-[11px] lg:text-[13px]"></i>
            <span className="hidden lg:inline">Thêm phòng mới</span>
            <span className="lg:hidden">Thêm phòng</span>
          </button>
        </div>
      </div>

      {isLoadingRooms ? (
        <div className="flex-1 bg-white border border-slate-200 rounded-xl lg:rounded-none lg:border-x lg:border-y-0 p-5">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <EmptyRoomState property={property} />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="lg:hidden flex flex-col gap-3 pb-4">
            {rooms.map((room) => {
              const statusConfig = getStatusConfig(room.status);
              const tenantName = getTenantName(room);
              const tenantPhone = getTenantPhone(room);
              const coverImage = getRoomCoverImage(room);

              return (
                <div
                  key={room.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={room.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${statusConfig.iconClass}`}
                        >
                          <i
                            className={`fa-solid ${statusConfig.icon} text-sm`}
                          ></i>
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-slate-800 leading-none truncate">
                          {room.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {room.area ? `${room.area} m²` : "Chưa nhập diện tích"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${statusConfig.badgeClass}`}
                      >
                        {room.status_label || statusConfig.label}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveActionRoomId((currentId) =>
                            currentId === room.id ? null : room.id,
                          )
                        }
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 bg-white"
                      >
                        <i className="fa-solid fa-ellipsis-vertical text-[12px]"></i>
                      </button>

                      {activeActionRoomId === room.id && (
                        <RoomActionsMenu room={room} onAction={handleAction} />
                      )}
                    </div>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    {tenantName ? (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-user text-slate-400 text-[11px]"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 leading-none truncate">
                            {tenantName}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {tenantPhone || "Chưa có số điện thoại"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13px] text-slate-400 italic">
                        {room.status === "maintenance"
                          ? "Đang bảo trì"
                          : "Chưa có khách thuê"}
                      </p>
                    )}

                    <div className="text-right shrink-0">
                      <p className="text-[15px] font-bold text-brand leading-none">
                        {formatCurrency(room.current_price)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        /tháng
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAction("view", room)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-lg bg-white text-[12px] font-medium text-slate-600 active:bg-slate-100"
                    >
                      <i className="fa-regular fa-eye text-slate-400"></i>
                      Xem chi tiết
                    </button>

                    {room.status === "available" ? (
                      <button
                        type="button"
                        onClick={() => handleAction("createLease", room)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-brand rounded-lg bg-brand text-[12px] font-medium text-white active:bg-brand-dark"
                      >
                        <i className="fa-solid fa-user-plus text-[11px]"></i>
                        Thêm khách
                      </button>
                    ) : room.status === "maintenance" ? (
                      <button
                        type="button"
                        onClick={() => handleAction("available", room)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-orange-200 rounded-lg bg-orange-50 text-[12px] font-medium text-orange-600 active:bg-orange-100"
                      >
                        <i className="fa-solid fa-wrench text-[11px]"></i>
                        Bảo trì
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAction("invoice", room)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-green-200 rounded-lg bg-green-50 text-[12px] font-medium text-brand active:bg-green-100"
                      >
                        <i className="fa-solid fa-file-invoice-dollar text-[11px]"></i>
                        Hóa đơn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:flex flex-1 overflow-hidden bg-white border-x border-slate-200">
            <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[760px]">
                <thead className="sticky top-0 bg-white z-10 shadow-sm shadow-slate-100">
                  <tr>
                    <th className="text-[12px] text-slate-500 font-medium py-3 px-5 border-b border-slate-100 w-[160px]">
                      Tên phòng
                    </th>
                    <th className="text-[12px] text-slate-500 font-medium py-3 px-2 border-b border-slate-100 w-[90px]">
                      Diện tích
                    </th>
                    <th className="text-[12px] text-slate-500 font-medium py-3 px-2 border-b border-slate-100 w-[120px]">
                      Giá phòng
                    </th>
                    <th className="text-[12px] text-slate-500 font-medium py-3 px-2 border-b border-slate-100 w-[110px]">
                      Trạng thái
                    </th>
                    <th className="text-[12px] text-slate-500 font-medium py-3 px-2 border-b border-slate-100">
                      Người thuê
                    </th>
                    <th className="text-[12px] text-slate-500 font-medium py-3 px-5 border-b border-slate-100 text-center w-[90px]">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className="text-[13px]">
                  {rooms.map((room) => {
                    const statusConfig = getStatusConfig(room.status);
                    const tenantName = getTenantName(room);
                    const tenantPhone = getTenantPhone(room);
                    const coverImage = getRoomCoverImage(room);

                    return (
                      <tr
                        key={room.id}
                        className="hover:bg-slate-50 transition-colors border-b border-slate-50"
                      >
                        <td className="py-3 px-5 font-semibold text-slate-800">
                          <div className="flex items-center gap-2 min-w-0">
                            {coverImage ? (
                              <img
                                src={coverImage}
                                alt={room.name}
                                className="w-7 h-7 rounded object-cover shrink-0"
                              />
                            ) : (
                              <i className="fa-solid fa-door-open text-slate-400 shrink-0"></i>
                            )}
                            <span className="truncate">{room.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-slate-600">
                          {room.area ? `${room.area} m²` : "—"}
                        </td>

                        <td className="py-3 px-2 font-semibold text-slate-800">
                          {formatCurrency(room.current_price)}
                        </td>

                        <td className="py-3 px-2">
                          <span
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${statusConfig.badgeClass}`}
                          >
                            {room.status_label || statusConfig.label}
                          </span>
                        </td>

                        <td className="py-3 px-2">
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

                        <td className="py-3 px-5 text-center">
                          <div className="flex justify-center gap-1.5 relative">
                            <button
                              type="button"
                              onClick={() => handleAction("view", room)}
                              className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-brand hover:border-brand flex items-center justify-center"
                            >
                              <i className="fa-regular fa-eye"></i>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveActionRoomId((currentId) =>
                                  currentId === room.id ? null : room.id,
                                )
                              }
                              className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 flex items-center justify-center bg-white"
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center lg:px-5 lg:py-3 lg:bg-white lg:border lg:border-slate-200 lg:border-t-slate-100 lg:rounded-b-xl pt-2 pb-2">
        <span className="text-[12px] text-slate-500">
          {pagination ? (
            <>
              <span className="lg:hidden">
                Trang {pagination.current_page}/{pagination.last_page} ·{" "}
                {pagination.total} phòng
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

        <div className="flex gap-1">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-angle-left text-[12px] lg:text-[11px]"></i>
          </button>

          <button
            type="button"
            className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center bg-brand text-white font-medium text-[13px] lg:text-[12px]"
          >
            {pagination?.current_page || 1}
          </button>

          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-angle-right text-[12px] lg:text-[11px]"></i>
          </button>
        </div>
      </div>

      <AddRoomModal
        open={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        onSubmit={handleCreateRoom}
        isSubmitting={isCreatingRoom}
        property={property}
      />
    </div>
  );
}
