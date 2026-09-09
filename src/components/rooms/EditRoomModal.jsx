import { useEffect, useMemo, useState, useRef } from "react";
import servicePriceService from "@/services/servicePriceService";

const ROOM_AMENITIES = [
  { value: "air_conditioner", label: "Máy lạnh", icon: "fa-snowflake" },
  { value: "heater", label: "Nóng lạnh", icon: "fa-fire" },
  { value: "wifi", label: "Wifi", icon: "fa-wifi" },
  { value: "cooking", label: "Nấu ăn", icon: "fa-kitchen-set" },
  { value: "camera", label: "Camera", icon: "fa-video" },
  { value: "balcony", label: "Ban công", icon: "fa-sun" },
  { value: "mezzanine", label: "Gác lửng", icon: "fa-stairs" },
  { value: "parking", label: "Giữ xe", icon: "fa-motorcycle" },
  { value: "free_hours", label: "Giờ tự do", icon: "fa-clock" },
];

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
  amenities: [],

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
  amenities: Array.isArray(room?.amenities) ? room.amenities : [],
  sort_order: room?.sort_order ?? "0",
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
  const scrollContainerRef = useRef(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  // ---  cho Dịch vụ ---
  const [propertyServices, setPropertyServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Helper lấy icon dịch vụ
  const getServiceIcon = (type) => {
    switch (type) {
      case "electricity": return { icon: "fa-bolt", color: "text-amber-500" };
      case "water": return { icon: "fa-droplet", color: "text-blue-500" };
      case "internet": return { icon: "fa-wifi", color: "text-indigo-500" };
      case "garbage": return { icon: "fa-trash-can", color: "text-slate-500" };
      default: return { icon: "fa-gears", color: "text-brand" };
    }
  };

  // Tự động tải danh sách dịch vụ của khu nhà hiện tại
  useEffect(() => {
    const targetPropertyId = room?.property_id || form.property_id;

    if (targetPropertyId) {
      setIsLoadingServices(true);
      servicePriceService.getByProperty(targetPropertyId, { per_page: 100 })
        .then(res => {
          setPropertyServices(res.data.data || []);
        })
        .catch(() => {
          setPropertyServices([]);
        })
        .finally(() => {
          setIsLoadingServices(false);
        });
    } else {
      setPropertyServices([]);
    }
  }, [room?.property_id, form.property_id]);

  useEffect(() => {
    if (clientError && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }, [clientError]);

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
    setClientError("");
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

  const handleToggleAmenity = (value) => {
    setForm((prev) => {
      const currentAmenities = prev.amenities || [];
      if (currentAmenities.includes(value)) {
        // Nếu đã có thì bỏ check (xóa khỏi mảng)
        return { ...prev, amenities: currentAmenities.filter((item) => item !== value) };
      } else {
        // Nếu chưa có thì check (thêm vào mảng)
        return { ...prev, amenities: [...currentAmenities, value] };
      }
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
    setClientError("");

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

    payload.append("sort_order", form.sort_order || "0");

    // Thay formData thành payload
    if (form.amenities && form.amenities.length > 0) {
      form.amenities.forEach((amenity, index) => {
        payload.append(`amenities[${index}]`, amenity);
      });
    } else {
      payload.append('amenities', '');
    }

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
          {/* THÊM ref VÀ ĐỔI NỀN TRẮNG */}
          <div ref={scrollContainerRef} className="overflow-y-auto no-scrollbar flex-1 pb-6 bg-white px-4 py-5 sm:p-6 flex flex-col gap-6 sm:gap-8">

            {/* --- BẮT ĐẦU KHỐI THÔNG BÁO LỖI --- */}
            {clientError && (
              <div className="bg-red-50 border-l-[4px] border-red-500 rounded-r-xl p-3.5 sm:p-4 shadow-sm flex items-start gap-3 animate-[fadeIn_0.3s_ease-out]">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0 mt-0.5 border border-red-200">
                  <i className="fa-solid fa-triangle-exclamation text-[14px]"></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-bold text-red-700 mb-0.5">
                    Thiếu thông tin hoặc sai định dạng
                  </h4>
                  <p className="text-[13px] text-red-600 leading-relaxed">
                    {clientError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setClientError("")}
                  className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
                >
                  <i className="fa-solid fa-xmark text-[13px]"></i>
                </button>
              </div>
            )}
            {/* --- KẾT THÚC KHỐI THÔNG BÁO LỖI --- */}

            {/* 1. Thông tin cơ bản */}
            <div className="bg-white px-1 py-5 sm:p-6 border-b border-slate-200">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">1</div>
                <h3 className="text-[15px] font-bold text-slate-800">Thông tin cơ bản</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 sm:gap-x-5 gap-y-4">
                {/* Khu nhà: Trải dài 2 cột trên Mobile, 2 cột trên PC */}
                <div className="col-span-2 sm:col-span-2">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Khu nhà <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={room?.property?.name || "Không xác định"}
                      disabled
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-500 cursor-not-allowed"
                    />
                    <i className="fa-solid fa-angle-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] pointer-events-none"></i>
                  </div>
                </div>

                {/* Tên/Số phòng: 1/2 Mobile, 1/3 PC */}
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Tên/Số phòng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={handleChange("name")}
                    placeholder="VD: 101"
                    required
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium"
                  />
                </div>

                {/* Thứ tự hiển thị: 1/2 Mobile, 1/3 PC */}
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={handleChange("sort_order")}
                    placeholder="VD: 1"
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>

                {/* Tầng: 1/2 Mobile, 1/3 PC */}
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Tầng
                  </label>
                  <select
                    value={form.floor_number}
                    onChange={handleChange("floor_number")}
                    required
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none cursor-pointer"
                  >
                    {floorOptions.map((floor) => (
                      <option key={floor.value} value={floor.value}>{floor.label}</option>
                    ))}
                  </select>
                </div>

                {/* Diện tích: 1/2 Mobile, 1/3 PC */}
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Diện tích <span className="text-slate-400 font-normal">(m²)</span>
                  </label>
                  <input
                    type="number"
                    value={form.area}
                    onChange={handleChange("area")}
                    min="0" step="0.1" placeholder="VD: 25" required inputMode="numeric"
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>

                {/* Giá thuê: 1/2 Mobile, 1/3 PC */}
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Giá thuê <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.current_price}
                      onChange={handleChange("current_price")}
                      placeholder="VD: 2.800.000" required inputMode="numeric"
                      className="w-full pl-3.5 pr-8 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-bold text-brand"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">đ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 italic leading-tight">
                    *Mức giá tự động áp dụng khi lập hóa đơn kỳ tới.
                  </p>
                </div>

                {/* Tiền cọc: 1/2 Mobile, 1/3 PC */}
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Tiền thế chân <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.deposit_amount}
                      onChange={handleChange("deposit_amount")}
                      placeholder="VD: 800.000" required inputMode="numeric"
                      className="w-full pl-3.5 pr-8 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-bold text-brand"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">đ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 italic leading-tight">
                    *Cọc thực tế thu sẽ dựa trên số tiền này.
                  </p>
                </div>

                {/* Sức chứa: Trải dài 2 cột Mobile, 1/3 PC */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Sức chứa tối đa
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.max_occupants}
                      onChange={handleChange("max_occupants")}
                      min="0" placeholder="VD: 3" required
                      className="w-full pl-3.5 pr-12 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 pointer-events-none">người</span>
                  </div>
                </div>

                {/* Trạng thái phòng: Trải dài trên mọi màn hình */}
                <div className="col-span-2 sm:col-span-3 mt-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                    Trạng thái phòng
                  </label>
                  {isOccupiedRoom ? (
                    <div className="px-3 py-3 sm:py-2.5 rounded-xl sm:rounded-lg border border-green-200 bg-green-50 text-[14px] sm:text-[13px] font-semibold text-green-600 flex items-center gap-2">
                      <i className="fa-solid fa-building-circle-check"></i>
                      Đang thuê - trạng thái này được quản lý bởi hợp đồng
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <label className="flex-1 relative cursor-pointer">
                        <input type="radio" name="status" value="available" checked={form.status === "available"} onChange={handleChange("status")} required className="peer sr-only" />
                        <div className="w-full text-center px-3 py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg border border-slate-200 bg-white text-[14px] sm:text-[13px] font-semibold text-slate-600 peer-checked:border-brand peer-checked:bg-brand/5 peer-checked:text-brand transition-all active:scale-[0.98]">
                          Trống
                        </div>
                      </label>
                      <label className="flex-1 relative cursor-pointer">
                        <input type="radio" name="status" value="maintenance" checked={form.status === "maintenance"} onChange={handleChange("status")} className="peer sr-only" />
                        <div className="w-full text-center px-3 py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg border border-slate-200 bg-white text-[14px] sm:text-[13px] font-semibold text-slate-600 peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-600 transition-all active:scale-[0.98]">
                          Bảo trì
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Cấu hình dịch vụ & Thu tiền */}
            <div className="bg-white px-1 py-5 sm:p-6 border-b border-slate-200 mt-2 sm:mt-0">

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">2</div>
                <h3 className="text-[15px] font-bold text-slate-800">Cấu hình dịch vụ & Thu tiền</h3>
              </div>


              <div className="grid grid-cols-2 gap-x-4 sm:gap-x-5 gap-y-5">
                {/* Dịch vụ mặc định: Luôn chiếm 2 cột */}
                <div className="col-span-2">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Dịch vụ mặc định áp dụng
                  </label>
                  <div className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg flex items-center flex-wrap gap-2 min-h-[50px]">
                    {isLoadingServices ? (
                      <span className="text-[12px] text-slate-400">
                        <i className="fa-solid fa-circle-notch fa-spin mr-1.5"></i> Đang tải dịch vụ...
                      </span>
                    ) : propertyServices.length > 0 ? (
                      <>
                        {propertyServices.map((srv) => {
                          const iconConfig = getServiceIcon(srv.service_type);
                          return (
                            <div key={srv.service_type} className="bg-white border border-slate-200 shadow-sm text-slate-700 text-[12px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                              <i className={`fa-solid ${iconConfig.icon} ${iconConfig.color} text-[11px]`}></i>
                              {srv.service_type_label}
                            </div>
                          );
                        })}
                        <span className="text-[11px] text-slate-400 ml-1 mt-0.5 w-full block sm:inline sm:w-auto italic">
                          (Thay đổi được khi làm hợp đồng)
                        </span>
                      </>
                    ) : (
                      <span className="text-[12px] text-slate-400 italic">Khu nhà này chưa có dịch vụ nào.</span>
                    )}
                  </div>
                </div>

                {/* Ngày thu tiền: Full width Mobile, 1/2 PC */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Ngày thu tiền định kỳ
                  </label>
                  <div className="relative">
                    <select
                      value={form.billing_day}
                      onChange={handleChange("billing_day")}
                      className="w-full pl-3.5 pr-10 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none cursor-pointer"
                    >
                      <option value="">Theo cấu hình khu nhà</option>
                      <option value="0">Theo ngày vào ở</option>
                      {Array.from({ length: 31 }).map((_, index) => (
                        <option key={index + 1} value={index + 1}>Ngày {index + 1} hằng tháng</option>
                      ))}
                    </select>
                    <i className="fa-solid fa-angle-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] pointer-events-none"></i>
                  </div>
                </div>

                {/* 2 Nút gạt Toggle: Full width Mobile, 1/2 PC */}
                <div className="col-span-2 sm:col-span-1 flex flex-col justify-center gap-3 bg-white sm:bg-slate-50 rounded-xl sm:rounded-lg sm:p-3 sm:border sm:border-slate-100">
                  <label className="flex items-center justify-between cursor-pointer group px-1 sm:px-0">
                    <span className="text-[14px] sm:text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                      Cho phép ở ghép
                    </span>
                    <div className="relative">
                      <input type="checkbox" checked={form.allow_shared} onChange={handleChange("allow_shared")} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group px-1 sm:px-0">
                    <span className="text-[14px] sm:text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                      Đăng lên trang công khai
                    </span>
                    <div className="relative">
                      <input type="checkbox" checked={form.is_public} onChange={handleChange("is_public")} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Hình ảnh & Mô tả */}
            <div className="bg-white px-1 py-5 sm:p-6 mt-2 sm:mt-0">

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">3</div>
                <h3 className="text-[15px] font-bold text-slate-800">Hình ảnh & Mô tả</h3>
              </div>


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

                    {/* Vòng lặp 1: Ảnh CŨ từ server */}
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
                          className="w-full h-full object-cover cursor-pointer active:scale-95 transition-transform"
                          alt="Room existing"
                          onClick={() => setFullScreenImage(image.image_url)}
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

                    {/* Vòng lặp 2: Ảnh MỚI user vừa chọn */}
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
                          className="w-full h-full object-cover cursor-pointer active:scale-95 transition-transform"
                          alt={`Room preview new ${index + 1}`}
                          onClick={() => setFullScreenImage(image.previewUrl)}
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
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none min-h-[90px] placeholder:text-slate-400"
                    placeholder="Nhập tiện ích phòng, giờ giấc, quy định riêng..."
                  ></textarea>
                </div>

                {/* BẮT ĐẦU: KHỐI TIỆN ÍCH PHÒNG */}
                <div className="col-span-full sm:col-span-2 lg:col-span-full mt-2">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-3">
                    Tiện ích có sẵn trong phòng
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-3.5 gap-x-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    {ROOM_AMENITIES.map((amenity) => (
                      <label key={amenity.value} className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center shrink-0">
                          <input
                            type="checkbox"
                            checked={form.amenities?.includes(amenity.value) || false}
                            onChange={() => handleToggleAmenity(amenity.value)}
                            className="peer appearance-none w-4 h-4 border border-slate-300 rounded-[4px] bg-white checked:bg-brand checked:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer group-hover:border-brand/50"
                          />
                          <i className="fa-solid fa-check absolute text-white text-[10px] opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                        </div>
                        <span className="text-[13px] text-slate-600 font-medium select-none group-hover:text-slate-800 transition-colors flex items-center gap-1.5">
                          {/* Tuỳ chọn: Có thể giữ icon hoặc xóa icon đi cho gọn */}
                          <i className={`fa-solid ${amenity.icon} text-slate-400 text-[11px]`}></i>
                          {amenity.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* KẾT THÚC: KHỐI TIỆN ÍCH PHÒNG */}
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
      {/* GIAO DIỆN ZOOM ẢNH TOÀN MÀN HÌNH */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10 cursor-zoom-out animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setFullScreenImage(null)}
        >
          <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-white text-3xl sm:text-4xl transition-colors w-12 h-12 flex items-center justify-center bg-black/50 rounded-full active:scale-95">
            <i className="fa-solid fa-xmark"></i>
          </button>
          <img
            src={fullScreenImage}
            alt="Phóng to ảnh"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-[zoomIn_0.2s_ease-out]"
          />
        </div>
      )}
    </div>
  );
}
