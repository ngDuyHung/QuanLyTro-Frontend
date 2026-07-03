import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AddRoomModal from "@/components/rooms/AddRoomModal";
import roomService from "@/services/roomService";
import ViewRoomModal from "@/components/rooms/ViewRoomModal";
import DeleteRoomModal from "@/components/rooms/DeleteRoomModal";
import EditRoomModal from "@/components/rooms/EditRoomModal";
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
  room.representative?.tenant?.full_name ||
  room.representative?.tenant?.name ||
  room.tenant_name ||
  "";

const getTenantPhone = (room) =>
  room.representative?.tenant?.phone ||
  room.tenant_phone ||
  "";

function RoomActionsMenu({ room, onAction, isNearBottom }) {
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
      key: "delete",
      label: "Xóa phòng",
      icon: "fa-regular fa-trash-can",
      className: "text-red-600",
    },
  ];

  return (
    <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'} w-56 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 z-30 overflow-hidden text-left`}>
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

export default function RoomList({ property, properties, onRoomUpdated }) {
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [activeActionRoomId, setActiveActionRoomId] = useState(null);

  const [isViewRoomOpen, setIsViewRoomOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isLoadingRoomDetail, setIsLoadingRoomDetail] = useState(false);

  const [editingRoom, setEditingRoom] = useState(null);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  // State for delete room modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

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
      console.log("response data", response.data.data);


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
    setIsViewRoomOpen(false);
    setSelectedRoom(null);
  }, [propertyId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const roomStats = useMemo(() => {
    const total = pagination?.total ?? rooms.length;
    const occupied = rooms.filter((room) => room.status === "occupied").length;
    const available = rooms.filter(
      (room) => room.status === "available",
    ).length;
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

  const handleOpenRoomDetail = async (room) => {
    if (!room?.id) return;

    try {
      setIsLoadingRoomDetail(true);

      const response = await roomService.getById(room.id);

      const roomDetail = response.data.data || response.data;

      setSelectedRoom(roomDetail);
      setIsViewRoomOpen(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể tải chi tiết phòng. Vui lòng thử lại.",
      );

      setSelectedRoom(null);
      setIsViewRoomOpen(false);
    } finally {
      setIsLoadingRoomDetail(false);
    }
  };

  const handleCloseRoomDetail = () => {
    setIsViewRoomOpen(false);
    setSelectedRoom(null);
  };

  const handleConfirmDelete = async (roomId) => {
    try {
      setIsDeletingRoom(true);

      // Gọi API xóa phòng
      await roomService.delete(roomId);

      toast.success("Xóa phòng thành công!", { autoClose: 1500 });

      // Đóng modal và reset state
      setIsDeleteModalOpen(false);
      setDeletingRoom(null);

      // Refresh lại danh sách phòng
      if (page !== 1 && rooms.length === 1) {
        setPage(page - 1); // Nếu xóa item cuối cùng của trang, lùi lại 1 trang
      } else {
        await fetchRooms();
      }
      // báo cho thằng khu nhà để nó tải lại 
      onRoomUpdated?.();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể xóa phòng lúc này. Vui lòng thử lại."
      );
    } finally {
      setIsDeletingRoom(false);
    }
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setIsEditRoomOpen(true);
  };

  const handleCloseEditRoom = () => {
    setIsEditRoomOpen(false);
    setEditingRoom(null);
  };

  const handleUpdateRoom = async (formData, room) => {
    if (!room?.id) {
      toast.warning("Không tìm thấy phòng cần cập nhật.");
      return;
    }
    try {
      setIsUpdatingRoom(true);
      await roomService.update(room.id, formData);

      toast.success("Cập nhật phòng thành công!", { autoClose: 1500 });
      handleCloseEditRoom();

      // Gọi trực tiếp hàm fetchRooms nội bộ để làm mới danh sách phòng
      await fetchRooms();

      // Báo cho trang cha biết để cập nhật lại số liệu Khu nhà nếu cần
      // onRoomUpdated?.();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể cập nhật phòng. Vui lòng thử lại."
      );
    } finally {
      setIsUpdatingRoom(false);
    }
  };

  const handleAction = (actionKey, room) => {
    setActiveActionRoomId(null);

    if (actionKey === "view") {
      handleOpenRoomDetail(room);
      return;
    }

    if (actionKey === "edit") {
      handleOpenEditRoom(room);
      return;
    }

    if (actionKey === "delete") {
      setDeletingRoom(room);
      setIsDeleteModalOpen(true);
      return;
    }

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

    toast.info(`${actionLabels[actionKey] || "Thao tác"}: ${room.name} đang update`, {
      autoClose: 1200,
    });
  };

  const canGoPrev = Boolean(pagination?.current_page > 1);
  const canGoNext = Boolean(
    pagination?.current_page &&
    pagination?.current_page < pagination?.last_page,
  );

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
              onClick={() => { onClose(); onAction("delete", room); }}
              className="w-full mt-1 px-4 py-3.5 rounded-xl text-left text-[14px] font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <span className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <i className="fa-regular fa-trash-can text-[15px]"></i>
              </span>
              <span>Xóa phòng</span>
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
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${statusConfig.iconClass}`}
                      >
                        <i
                          className={`fa-solid ${statusConfig.icon} text-sm`}
                        ></i>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-slate-800 leading-none truncate">
                          {room.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {room.area
                            ? `${room.area} m²`
                            : "Chưa nhập diện tích"}
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
                  {rooms.map((room, index) => {
                    const statusConfig = getStatusConfig(room.status);
                    const tenantName = getTenantName(room);
                    const tenantPhone = getTenantPhone(room);
                    const coverImage = getRoomCoverImage(room);

                    const isNearBottom = index >= rooms.length - 2 && rooms.length > 3;

                    return (
                      <tr
                        key={room.id}
                        className="hover:bg-slate-50 transition-colors border-b border-slate-50"
                      >
                        <td className="py-3 px-5 font-semibold text-slate-800">
                          <div className="flex items-center gap-2 min-w-0">
                            <i className="fa-solid fa-door-open text-slate-400 shrink-0"></i>
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
                                isNearBottom={isNearBottom}
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
                Trang {pagination.current_page}/{pagination.last_page} · {pagination.total} phòng
              </span>
              <span className="hidden lg:inline">
                Hiển thị {pagination.from || 0} - {pagination.to || 0} trong tổng số {pagination.total || 0} phòng
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setPage(pageNumber)}
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
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 lg:w-7 lg:h-7 rounded-lg lg:rounded flex items-center justify-center text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-angle-right text-[12px] lg:text-[11px]"></i>
            </button>
          </div>
        )}
      </div>

      <ViewRoomModal
        open={isViewRoomOpen}
        onClose={handleCloseRoomDetail}
        room={selectedRoom}
        isLoading={isLoadingRoomDetail}
      />

      <AddRoomModal
        open={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        onSubmit={handleCreateRoom}
        isSubmitting={isCreatingRoom}
        property={property}
      />

      <EditRoomModal
        open={isEditRoomOpen}
        room={editingRoom}
        onClose={handleCloseEditRoom}
        onSubmit={handleUpdateRoom}
        isSubmitting={isUpdatingRoom}
        properties={properties}
      />
      <DeleteRoomModal
        open={isDeleteModalOpen}
        room={deletingRoom}
        isDeleting={isDeletingRoom}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingRoom(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <MobileRoomActionSheet
        open={!!activeActionRoomId && window.innerWidth < 1024}
        room={rooms.find(r => r.id === activeActionRoomId)}
        onClose={() => setActiveActionRoomId(null)}
        onAction={handleAction}
      />
    </div>
  );
}
