import { useEffect, useMemo, useState } from "react";

const initialForm = {
  property_id: "",
  name: "",
  floor_number: "",
  area: "",
  current_price: "",
  deposit_amount: "",
  max_occupants: "",
  status: "available",
  billing_day: "",
  allow_shared: true,
  is_public: true,
  description: "",

};

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const parseMoney = (value) => {
  if (!value) return 0;

  return Number(String(value).replace(/[^\d]/g, ""));
};

const formatMoneyInput = (value) => {
  const number = parseMoney(value);

  if (!number) return "";

  return new Intl.NumberFormat("vi-VN").format(number);
};

const toForm = (room) => ({
  property_id: room?.property_id || "",
  name: room?.name || "",
  floor_number:
    room?.floor_number === null || room?.floor_number === undefined
      ? ""
      : String(room.floor_number),
  area:
    room?.area === null || room?.area === undefined ? "" : String(room.area),
  current_price: formatMoneyInput(room?.current_price || ""),
  deposit_amount: formatMoneyInput(room?.deposit_amount || ""),
  max_occupants:
    room?.max_occupants === null || room?.max_occupants === undefined
      ? ""
      : String(room.max_occupants),
  status: room?.status || "available",
  billing_day:
    room?.billing_day === null || room?.billing_day === undefined
      ? ""
      : String(room.billing_day),
  allow_shared: Boolean(room?.allow_shared),
  is_public: Boolean(room?.is_public),
  description: room?.description || "",
});

export default function EditRoomModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  room,
  properties = [],
}) {
  const [form, setForm] = useState(initialForm);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [coverImage, setCoverImage] = useState({
    type: "existing",
    id: null,
    index: null,
  });
  const [clientError, setClientError] = useState("");

  const floorOptions = useMemo(() => {
    // 1. Tìm khu nhà hiện tại trong mảng properties
    const selectedProperty = properties.find(
      (p) => String(p.id) === String(room?.property_id)
    );

    // 2. Lấy số tầng của khu nhà đó (nếu không tìm thấy thì tạm để 5)
    const floorsCount = Number(selectedProperty?.floors_count || 5);

    // 3. Khởi tạo mảng options mặc định
    const options = [
      { value: "", label: "Không xác định" },
      { value: "0", label: "Trệt" },
    ];

    // 4. Dùng vòng lặp để sinh ra đúng số tầng
    for (let i = 1; i <= floorsCount; i++) {
      options.push({ value: String(i), label: `Tầng ${i}` });
    }

    return options;
  }, [room?.property_id, properties]);

  const clearImages = () => {
    setNewImages((currentImages) => {
      currentImages.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });

      return [];
    });

    setExistingImages([]);
    setDeletedImageIds([]);
    setCoverImage({
      type: "existing",
      id: null,
      index: null,
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setClientError("");
    clearImages();
  };

  const handleClose = () => {
    if (isSubmitting) return;

    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    setForm(toForm(room));
    setClientError("");

    const roomImages = room?.images || [];
    setExistingImages(roomImages);
    setNewImages([]);
    setDeletedImageIds([]);

    const currentCover = roomImages.find((image) => image.is_cover);
    const firstImage = roomImages[0];

    setCoverImage({
      type: "existing",
      id: currentCover?.id || firstImage?.id || null,
      index: null,
    });

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, room]);

  if (!open) return null;

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setClientError("");

    setForm((prev) => {
      // Khai báo các trường cần format tiền
      const moneyFields = ["current_price", "deposit_amount"];

      return {
        ...prev,
        [field]: moneyFields.includes(field) ? formatMoneyInput(value) : value,
      };
    });
  };

  const handleSelectImages = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    const remainingSlots =
      MAX_IMAGES - existingImages.length - newImages.length;

    if (remainingSlots <= 0) {
      setClientError("Chỉ được tải tối đa 5 ảnh cho mỗi phòng.");
      event.target.value = "";
      return;
    }

    const validFiles = selectedFiles.slice(0, remainingSlots).filter((file) => {
      if (!file.type.startsWith("image/")) {
        setClientError("Vui lòng chỉ chọn file hình ảnh.");
        return false;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setClientError("Mỗi ảnh không được vượt quá 5MB.");
        return false;
      }

      return true;
    });

    const previewImages = validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewImages((prev) => {
      const nextImages = [...prev, ...previewImages];

      if (
        !coverImage.id &&
        coverImage.index === null &&
        nextImages.length > 0
      ) {
        setCoverImage({
          type: "new",
          id: null,
          index: 0,
        });
      }

      return nextImages;
    });

    event.target.value = "";
  };

  const handleRemoveExistingImage = (image) => {
    setExistingImages((prev) => {
      const nextImages = prev.filter((item) => item.id !== image.id);

      if (coverImage.type === "existing" && coverImage.id === image.id) {
        if (nextImages.length > 0) {
          setCoverImage({
            type: "existing",
            id: nextImages[0].id,
            index: null,
          });
        } else if (newImages.length > 0) {
          setCoverImage({
            type: "new",
            id: null,
            index: 0,
          });
        } else {
          setCoverImage({
            type: "existing",
            id: null,
            index: null,
          });
        }
      }

      return nextImages;
    });

    setDeletedImageIds((prev) => [...prev, image.id]);
  };

  const handleRemoveNewImage = (index) => {
    setNewImages((prev) => {
      const targetImage = prev[index];

      if (targetImage?.previewUrl) {
        URL.revokeObjectURL(targetImage.previewUrl);
      }

      const nextImages = prev.filter(
        (_, currentIndex) => currentIndex !== index,
      );

      if (coverImage.type === "new") {
        if (coverImage.index === index) {
          if (existingImages.length > 0) {
            setCoverImage({
              type: "existing",
              id: existingImages[0].id,
              index: null,
            });
          } else if (nextImages.length > 0) {
            setCoverImage({
              type: "new",
              id: null,
              index: 0,
            });
          } else {
            setCoverImage({
              type: "existing",
              id: null,
              index: null,
            });
          }
        } else if (coverImage.index > index) {
          setCoverImage((prevCover) => ({
            ...prevCover,
            index: prevCover.index - 1,
          }));
        }
      }

      return nextImages;
    });
  };

  const isOccupiedRoom = room?.status === "occupied";

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!room?.id) {
      setClientError("Không tìm thấy phòng cần cập nhật.");
      return;
    }

    if (!form.name.trim()) {
      setClientError("Vui lòng nhập tên hoặc số phòng.");
      return;
    }

    if (!parseMoney(form.current_price)) {
      setClientError("Vui lòng nhập giá thuê phòng.");
      return;
    }

    if (!parseMoney(form.deposit_amount)) {
      setClientError("Vui lòng nhập tiền cọc.");
      return;
    }

    const payload = new FormData();

    payload.append("_method", "PUT");

    payload.append("name", form.name.trim());
    payload.append("floor_number", form.floor_number);
    payload.append("area", form.area || "");
    payload.append("current_price", String(parseMoney(form.current_price)));
    payload.append("deposit_amount", String(parseMoney(form.deposit_amount)));
    payload.append(
      "max_occupants",
      form.max_occupants === "" ? "0" : String(form.max_occupants),
    );
    if (!isOccupiedRoom) {
      payload.append("status", form.status || "available");
    }
    payload.append("billing_day", form.billing_day || "");
    payload.append("allow_shared", form.allow_shared ? "1" : "0");
    payload.append("is_public", form.is_public ? "1" : "0");
    payload.append("description", form.description || "");

    deletedImageIds.forEach((id) => {
      payload.append("deleted_image_ids[]", String(id));
    });

    newImages.forEach((image) => {
      payload.append("images[]", image.file);
    });

    if (coverImage.type === "existing" && coverImage.id) {
      payload.append("cover_image_id", String(coverImage.id));
    }

    if (coverImage.type === "new" && coverImage.index !== null) {
      payload.append("cover_image_index", String(coverImage.index));
    }

    onSubmit(payload, room);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          @keyframes fadeIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[800px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <i className="fa-solid fa-door-open text-[18px]"></i>
            </div>

            <div>
              <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800 leading-tight">
                Cập nhật phòng
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                Cập nhật thông tin, hình ảnh và trạng thái phòng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shrink-0 disabled:opacity-60"
          >
            <i className="fa-solid fa-xmark text-[16px]"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="overflow-y-auto no-scrollbar flex-1 pb-6 bg-slate-50">
            {/* 1. Thông tin cơ bản */}
            <div className="bg-white px-5 py-5 sm:p-6 border-b border-slate-200">
              <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-[12px]"></i>
                1. Thông tin cơ bản
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Khu nhà <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={room?.property?.name || "Không xác định"}
                      disabled
                      className="w-full px-3.5 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-500 cursor-not-allowed"
                    />
                    <i className="fa-solid fa-angle-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] pointer-events-none"></i>
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Tên/Số phòng <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={handleChange("name")}
                    placeholder="VD: 101"
                    required
                    className="w-full px-3.5 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Tầng
                  </label>

                  <select
                    value={form.floor_number}
                    onChange={handleChange("floor_number")}
                    required
                    className="w-full px-3.5 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none cursor-pointer"
                  >
                    {floorOptions.map((floor) => (
                      <option key={floor.value} value={floor.value}>
                        {floor.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Diện tích{" "}
                    <span className="text-slate-400 font-normal">(m²)</span>
                  </label>

                  <input
                    type="number"
                    value={form.area}
                    onChange={handleChange("area")}
                    min="0"
                    step="0.1"
                    placeholder="VD: 25"
                    required
                    className="w-full px-3.5 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Giá thuê <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={form.current_price}
                      onChange={handleChange("current_price")}
                      placeholder="VD: 2.800.000"
                      required
                      className="w-full pl-3.5 pr-8 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-bold text-brand"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
                      đ
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Tiền thế chân <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={form.deposit_amount}
                      onChange={handleChange("deposit_amount")}
                      placeholder="VD: 800.000"
                      required
                      className="w-full pl-3.5 pr-8 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-bold text-brand"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
                      đ
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Sức chứa tối đa
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      value={form.max_occupants}
                      onChange={handleChange("max_occupants")}
                      min="0"
                      placeholder="VD: 3"
                      required
                      className="w-full pl-3.5 pr-12 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 pointer-events-none">
                      người
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Trạng thái phòng
                  </label>

                  {isOccupiedRoom ? (
                    <div className="px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-[13px] font-semibold text-green-600 flex items-center gap-2">
                      <i className="fa-solid fa-building-circle-check"></i>
                      Đang thuê - trạng thái này được quản lý bởi hợp đồng
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <label className="flex-1 relative cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="available"
                          checked={form.status === "available"}
                          onChange={handleChange("status")}
                          required
                          className="peer sr-only"
                        />
                        <div className="w-full text-center px-3 py-2.5 sm:py-2 rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-600 peer-checked:border-brand peer-checked:bg-brand/5 peer-checked:text-brand transition-all">
                          Trống
                        </div>
                      </label>

                      <label className="flex-1 relative cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="maintenance"
                          checked={form.status === "maintenance"}
                          onChange={handleChange("status")}
                          className="peer sr-only"
                        />
                        <div className="w-full text-center px-3 py-2.5 sm:py-2 rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-600 peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-600 transition-all">
                          Bảo trì
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Cấu hình dịch vụ & Thu tiền */}
            <div className="bg-white px-5 py-5 sm:p-6 border-b border-slate-200 mt-2 sm:mt-0">
              <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                <i className="fa-solid fa-file-invoice-dollar text-[12px]"></i>
                2. Cấu hình dịch vụ & Thu tiền
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">

                <div className="sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Ngày thu tiền định kỳ
                  </label>

                  <div className="relative">
                    <select
                      value={form.billing_day}
                      onChange={handleChange("billing_day")}
                      className="w-full pl-3.5 pr-10 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none cursor-pointer"
                    >
                      <option value="">Theo cấu hình khu nhà</option>
                      <option value="0">Theo ngày vào ở</option>
                      {Array.from({ length: 31 }).map((_, index) => (
                        <option key={index + 1} value={index + 1}>
                          Ngày {index + 1} hằng tháng
                        </option>
                      ))}
                    </select>

                    <i className="fa-solid fa-angle-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] pointer-events-none"></i>
                  </div>
                </div>

                <div className="sm:col-span-1 flex flex-col justify-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[13px] font-medium text-slate-700">
                      Cho phép ở ghép
                    </span>

                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={form.allow_shared}
                        onChange={handleChange("allow_shared")}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[13px] font-medium text-slate-700">
                      Đăng lên trang công khai
                    </span>

                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={form.is_public}
                        onChange={handleChange("is_public")}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Hình ảnh & Mô tả */}
            <div className="bg-white px-5 py-5 sm:p-6 mt-2 sm:mt-0">
              <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                <i className="fa-solid fa-images text-[12px]"></i>
                3. Hình ảnh & Mô tả
              </h3>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                    Ảnh phòng{" "}
                    <span className="text-slate-400 font-normal">
                      (Tối đa 5MB/ảnh)
                    </span>
                  </label>

                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                    <label className="shrink-0 w-[100px] h-[100px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-brand/5 hover:border-brand transition-all cursor-pointer snap-start group">
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-camera text-brand"></i>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600">
                        Thêm ảnh
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSelectImages}
                        className="hidden"
                      />
                    </label>

                    {existingImages.map((image) => (
                      <div
                        key={image.id}
                        className="shrink-0 w-[100px] h-[100px] rounded-xl border border-slate-200 relative overflow-hidden group snap-start shadow-sm"
                      >
                        {coverImage.type === "existing" &&
                          coverImage.id === image.id && (
                            <div className="absolute top-0 left-0 bg-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">
                              Ảnh bìa
                            </div>
                          )}

                        <img
                          src={image.image_url}
                          className="w-full h-full object-cover"
                          alt="Room"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setCoverImage({
                              type: "existing",
                              id: image.id,
                              index: null,
                            })
                          }
                          className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 hover:bg-brand rounded text-white text-[9px] font-semibold transition-all"
                        >
                          Bìa
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(image)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full text-white flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}

                    {newImages.map((image, index) => (
                      <div
                        key={image.previewUrl}
                        className="shrink-0 w-[100px] h-[100px] rounded-xl border border-slate-200 relative overflow-hidden group snap-start shadow-sm"
                      >
                        {coverImage.type === "new" &&
                          coverImage.index === index && (
                            <div className="absolute top-0 left-0 bg-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">
                              Ảnh bìa
                            </div>
                          )}

                        <img
                          src={image.previewUrl}
                          className="w-full h-full object-cover"
                          alt={`Room preview ${index + 1}`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setCoverImage({
                              type: "new",
                              id: null,
                              index,
                            })
                          }
                          className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 hover:bg-brand rounded text-white text-[9px] font-semibold transition-all"
                        >
                          Bìa
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full text-white flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Ghi chú & Mô tả phòng
                  </label>

                  <textarea
                    value={form.description}
                    onChange={handleChange("description")}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none min-h-[90px] placeholder:text-slate-400"
                    placeholder="Nhập tiện ích phòng, giờ giấc, quy định riêng..."
                  ></textarea>
                </div>

                {clientError && (
                  <div className="px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium">
                    {clientError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 sticky bottom-0 z-20 flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-3 sm:py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[14px] font-semibold hover:bg-slate-200 transition-colors w-[100px] sm:w-auto text-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !room?.id}
              className="flex-1 sm:flex-none px-8 py-3 sm:py-2.5 bg-brand text-white rounded-xl text-[14px] font-bold hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check text-[14px]"></i>
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
