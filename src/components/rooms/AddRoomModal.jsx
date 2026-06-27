import servicePriceService from "@/services/servicePriceService";
import { useEffect, useMemo, useState } from "react";

const initialForm = {
  property_id: "",
  name: "",
  floor_number: "",
  area: "",
  current_price: "",
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

export default function AddRoomModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  property,
  properties = [],
}) {
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [clientError, setClientError] = useState("");

  const [propertyServices, setPropertyServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);


  const selectedProperty = useMemo(() => {
    if (property?.id) return property;

    return (
      properties.find((item) => String(item.id) === String(form.property_id)) ||
      null
    );
  }, [property, properties, form.property_id]);

  const floorOptions = useMemo(() => {
    const floorsCount = Number(selectedProperty?.floors_count || 0);

    if (!floorsCount) {
      return [
        { value: "", label: "Không xác định" },
        { value: "0", label: "Trệt" },
        { value: "1", label: "Tầng 1" },
        { value: "2", label: "Tầng 2" },
        { value: "3", label: "Tầng 3" },
      ];
    }

    return [
      { value: "", label: "Không xác định" },
      { value: "0", label: "Trệt" },
      ...Array.from({ length: floorsCount }).map((_, index) => ({
        value: String(index + 1),
        label: `Tầng ${index + 1}`,
      })),
    ];
  }, [selectedProperty?.floors_count]);

  const clearImages = () => {
    setImages((currentImages) => {
      currentImages.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });

      return [];
    });

    setCoverImageIndex(0);
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

  // Lấy danh sách dịch vụ của khu nhà đang được chọn
  useEffect(() => {
    const targetPropertyId = property?.id || form.property_id;

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
  }, [property?.id, form.property_id]);

  const getServiceIcon = (type) => {
    switch (type) {
      case "electricity": return { icon: "fa-bolt", color: "text-amber-500" };
      case "water": return { icon: "fa-droplet", color: "text-blue-500" };
      case "internet": return { icon: "fa-wifi", color: "text-indigo-500" };
      case "garbage": return { icon: "fa-trash-can", color: "text-slate-500" };
      default: return { icon: "fa-gears", color: "text-brand" };
    }
  };

  useEffect(() => {
    if (!open) return;

    setForm(initialForm);
    setClientError("");
    setCoverImageIndex(0);

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
  }, [open]);

  if (!open) return null;

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setClientError("");

    setForm((prev) => ({
      ...prev,
      [field]: field === "current_price" ? formatMoneyInput(value) : value,
    }));
  };

  const handleSelectImages = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    const remainingSlots = MAX_IMAGES - images.length;

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

    setImages((prev) => [...prev, ...previewImages]);

    event.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const targetImage = prev[index];

      if (targetImage?.previewUrl) {
        URL.revokeObjectURL(targetImage.previewUrl);
      }

      return prev.filter((_, currentIndex) => currentIndex !== index);
    });

    setCoverImageIndex((prev) => {
      if (prev === index) return 0;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const targetPropertyId = property?.id || form.property_id;

    if (!targetPropertyId) {
      setClientError("Vui lòng chọn khu nhà trước khi thêm phòng.");
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

    const payload = new FormData();

    payload.append("name", form.name.trim());
    payload.append("floor_number", form.floor_number);
    payload.append("area", form.area || "");
    payload.append("current_price", String(parseMoney(form.current_price)));
    payload.append(
      "max_occupants",
      form.max_occupants === "" ? "0" : String(form.max_occupants),
    );
    payload.append("status", form.status || "available");
    payload.append("billing_day", form.billing_day || "");
    payload.append("allow_shared", form.allow_shared ? "1" : "0");
    payload.append("is_public", form.is_public ? "1" : "0");
    payload.append("description", form.description || "");

    images.forEach((image) => {
      payload.append("images[]", image.file);
    });

    payload.append("cover_image_index", String(coverImageIndex || 0));

    onSubmit(payload, targetPropertyId);
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
                Thêm phòng mới
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                Điền thông tin cơ bản để bắt đầu quản lý phòng
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
                    <select
                      value={property?.id || form.property_id}
                      disabled={Boolean(property?.id)}
                      onChange={handleChange("property_id")}
                      className={`w-full pl-3.5 pr-10 py-2.5 sm:py-2 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none ${property?.id
                        ? "bg-slate-50 cursor-not-allowed"
                        : "bg-white cursor-pointer"
                        }`}
                    >
                      {property?.id ? (
                        <option value={property.id}>{property.name}</option>
                      ) : (
                        <>
                          <option value="">Chọn khu nhà</option>
                          {properties.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
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
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Dịch vụ mặc định áp dụng
                  </label>

                  <div className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center flex-wrap gap-2 min-h-[46px]">
                    {isLoadingServices ? (
                      <span className="text-[12px] text-slate-400">
                        <i className="fa-solid fa-circle-notch fa-spin mr-1.5"></i> Đang tải dịch vụ...
                      </span>
                    ) : propertyServices.length > 0 ? (
                      <>
                        {propertyServices.map((srv) => {
                          const iconConfig = getServiceIcon(srv.service_type);
                          return (
                            <div
                              key={srv.service_type}
                              className="bg-white border border-slate-200 shadow-sm text-slate-700 text-[12px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5"
                            >
                              <i className={`fa-solid ${iconConfig.icon} ${iconConfig.color} text-[11px]`}></i>
                              {srv.service_type_label}
                            </div>
                          );
                        })}
                        <span className="text-[11px] text-slate-400 ml-1 mt-0.5 w-full block sm:inline sm:w-auto italic">
                          (Được kế thừa từ khu nhà. Bạn có thể thay đổi khi làm Hợp đồng thuê)
                        </span>
                      </>
                    ) : (
                      <span className="text-[12px] text-slate-400 italic">
                        Khu nhà này chưa có dịch vụ nào.
                      </span>
                    )}
                  </div>
                </div>

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

                    {images.map((image, index) => (
                      <div
                        key={image.previewUrl}
                        className="shrink-0 w-[100px] h-[100px] rounded-xl border border-slate-200 relative overflow-hidden group snap-start shadow-sm"
                      >
                        {coverImageIndex === index && (
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
                          onClick={() => setCoverImageIndex(index)}
                          className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 hover:bg-brand rounded text-white text-[9px] font-semibold transition-all"
                        >
                          Bìa
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
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
              disabled={isSubmitting || !(property?.id || form.property_id)}
              className="flex-1 sm:flex-none px-8 py-3 sm:py-2.5 bg-brand text-white rounded-xl text-[14px] font-bold hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang tạo...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check text-[14px]"></i>
                  Tạo phòng ngay
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
