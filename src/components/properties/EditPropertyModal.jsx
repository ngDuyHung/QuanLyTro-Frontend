import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import servicePriceService from "@/services/servicePriceService";

const parseMoney = (value) => {
  if (!value) return 0;
  return Number(String(value).replace(/[^\d]/g, ""));
};

const formatMoneyInput = (value) => {
  const number = parseMoney(value);
  if (!number) return "";
  return new Intl.NumberFormat("vi-VN").format(number);
};

const initialForm = {
  property_type: "boarding_house",
  name: "",
  code: "",
  status: "active",
  floors_count: "",
  expected_rooms_count: "",
  manager_name: "",
  address: "",
  latitude: "",
  longitude: "",
  description: "",
  note: "",
  cover_image: null,
  cover_image_preview: "",
  existing_cover_image_url: "",
};

const generatePropertyCode = (name) => {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 20);
};

export default function EditPropertyModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  property,
}) {
  const [form, setForm] = useState(initialForm);
  // State quản lý danh sách dịch vụ của khu nhà này
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  // ---  State cho Error Banner, Scroll và Zoom ---
  const [clientError, setClientError] = useState("");
  const scrollContainerRef = useRef(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  useEffect(() => {
    if (clientError && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }, [clientError]);

  useEffect(() => {
    return () => {
      if (form.cover_image_preview) {
        URL.revokeObjectURL(form.cover_image_preview);
      }
    };
  }, [form.cover_image_preview]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Nạp dữ liệu vào form khi mở Modal
  useEffect(() => {
    if (!open) return;

    if (!property) {
      setForm(initialForm);
      setServices([]);
      return;
    }

    setForm({
      property_type: property.property_type || "boarding_house",
      name: property.name || "",
      code: property.code || "",
      status: property.status || "active",
      address: property.address || "",
      floors_count:
        property.floors_count !== null && property.floors_count !== undefined
          ? String(property.floors_count)
          : "",
      expected_rooms_count:
        property.expected_rooms_count !== null &&
          property.expected_rooms_count !== undefined
          ? String(property.expected_rooms_count)
          : "",
      manager_name: property.manager_name || "",
      latitude:
        property.latitude !== null && property.latitude !== undefined
          ? String(property.latitude)
          : "",
      longitude:
        property.longitude !== null && property.longitude !== undefined
          ? String(property.longitude)
          : "",
      description: property.description || "",
      note: property.description || "",
      cover_image: null,
      cover_image_preview: "",
      existing_cover_image_url: property.cover_image_url || "",
    });

    // Tải bảng giá dịch vụ riêng của khu nhà này
    fetchPropertyServices(property.id);
  }, [open, property]);

  const fetchPropertyServices = async (propertyId) => {
    try {
      setIsLoadingServices(true);
      const res = await servicePriceService.getByProperty(propertyId, { per_page: 100 });
      const prices = res.data.data || [];

      setServices(
        prices.map((p) => ({
          service_type: p.service_type,
          service_type_label: p.service_type_label,
          unit_price: formatMoneyInput(p.unit_price || 0),
          base_price: formatMoneyInput(p.base_price || 0),
          free_units: p.free_units || 0,
          free_unit_type: p.free_unit_type || "none",
        }))
      );
    } catch (error) {
      toast.error("Không thể tải bảng giá dịch vụ của khu nhà.");
    } finally {
      setIsLoadingServices(false);
    }
  };

  if (!open) return null;

  const handleChange = (field) => (event) => {
    setClientError("");
    const value = event.target.value;
    setForm((prev) => {
      if (field === "name" && !prev.code) {
        return {
          ...prev,
          name: value,
          code: generatePropertyCode(value),
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setForm((prev) => {
      if (prev.cover_image_preview) {
        URL.revokeObjectURL(prev.cover_image_preview);
      }
      return {
        ...prev,
        cover_image: file,
        cover_image_preview: URL.createObjectURL(file),
      };
    });
    event.target.value = "";
  };

  const handleRemoveSelectedImage = () => {
    setForm((prev) => {
      if (prev.cover_image_preview) {
        URL.revokeObjectURL(prev.cover_image_preview);
      }
      return {
        ...prev,
        cover_image: null,
        cover_image_preview: "",
      };
    });
  };

  // --- Handlers cho mảng Dịch vụ ---
  const handleServicePriceChange = (index, value) => {
    setServices((prev) => {
      const newServices = [...prev];
      newServices[index].unit_price = value ? Number(value) : "";
      return newServices;
    });
  };

  const handleRemoveService = (index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };


  // Hàm thay đổi động giá trị cấu hình dịch vụ
  const handleServiceChange = (index, field, value) => {
    setServices((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setClientError(""); // Xóa lỗi cũ

    // Validate cơ bản
    if (!form.name.trim()) {
      setClientError("Vui lòng nhập tên khu nhà.");
      return;
    }
    if (!form.address.trim()) {
      setClientError("Vui lòng nhập địa chỉ khu nhà.");
      return;
    }
    const note = form.note?.trim() || "";
    const formData = new FormData();

    formData.append("_method", "PUT");
    formData.append("property_type", form.property_type);
    formData.append("name", form.name.trim());
    formData.append("code", form.code.trim());
    formData.append("status", form.status);
    formData.append("address", form.address.trim());
    formData.append("manager_name", form.manager_name?.trim() || "");
    formData.append("floors_count", Number(form.floors_count || 0));
    formData.append("expected_rooms_count", Number(form.expected_rooms_count || 0));
    formData.append("description", note || "");

    if (form.latitude) formData.append("latitude", form.latitude);
    if (form.longitude) formData.append("longitude", form.longitude);
    if (form.cover_image) formData.append("cover_image", form.cover_image);

    // Append mảng dịch vụ vào formData
    if (services.length === 0) {
      // Gửi cờ báo hiệu người dùng đã xóa sạch dịch vụ
      formData.append("empty_services", "true");
    } else {
      services.forEach((service, index) => {
        formData.append(`services[${index}][service_type]`, service.service_type);
        formData.append(`services[${index}][unit_price]`, parseMoney(service.unit_price) || 0);
        formData.append(`services[${index}][base_price]`, parseMoney(service.base_price) || 0);
        formData.append(`services[${index}][free_units]`, service.free_units || 0);
        formData.append(`services[${index}][free_unit_type]`, service.free_unit_type || "none");
        formData.append(`services[${index}][effective_date]`, ""); // để trống để pass request thôi chứ update property nó set ngày sẵn trong rồi 

      });
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
        <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[800px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <i className="fa-solid fa-building text-[18px]"></i>
              </div>
              <div>
                <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800 leading-tight">
                  Chỉnh sửa khu nhà
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                  Cập nhật thông tin để quản lý phòng và khách thuê
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

          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
            {/* THÊM ref VÀ STYLE LIỀN MẠCH VÀO ĐÂY */}
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
                  {/* Tên khu nhà: Full width mobile, 2/3 PC */}
                  <div className="col-span-2 sm:col-span-2">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Tên khu nhà <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange("name")}
                      placeholder="VD: Khu A - Lê Văn Sỹ"
                      required
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium transition-all"
                    />
                  </div>

                  {/* Mã khu: Full width mobile, 1/3 PC */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Mã khu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={handleChange("code")}
                      placeholder="VD: KHU-A"
                      required
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  {/* Số tầng: 1/2 mobile, 1/3 PC */}
                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Số tầng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.floors_count}
                      onChange={handleChange("floors_count")}
                      placeholder="VD: 0"
                      required
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  {/* Số phòng: 1/2 mobile, 1/3 PC */}
                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                      Số phòng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.expected_rooms_count}
                      onChange={handleChange("expected_rooms_count")}
                      placeholder="VD: 20"
                      required
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  {/* Người quản lý: Full width mobile, 1/3 PC */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Người quản lý <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="text"
                      value={form.manager_name}
                      onChange={handleChange("manager_name")}
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  {/* Trạng thái: Full width cả Mobile và PC */}
                  <div className="col-span-2 sm:col-span-3 mt-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">Trạng thái khu nhà</label>
                    <div className="flex gap-3">
                      <label className="flex-1 relative cursor-pointer">
                        <input type="radio" name="status" value="active" checked={form.status === "active"} onChange={handleChange("status")} className="peer sr-only" />
                        <div className="w-full text-center px-3 py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg border border-slate-200 bg-white text-[14px] sm:text-[13px] font-semibold text-slate-600 peer-checked:border-brand peer-checked:bg-brand/5 peer-checked:text-brand transition-all active:scale-[0.98]">
                          Đang hoạt động
                        </div>
                      </label>
                      <label className="flex-1 relative cursor-pointer">
                        <input type="radio" name="status" value="inactive" checked={form.status === "inactive"} onChange={handleChange("status")} className="peer sr-only" />
                        <div className="w-full text-center px-3 py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg border border-slate-200 bg-white text-[14px] sm:text-[13px] font-semibold text-slate-600 peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-600 transition-all active:scale-[0.98]">
                          Tạm ngưng
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Ảnh đại diện */}
              <div className="bg-white px-1 py-5 sm:p-6 border-b border-slate-200">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">2</div>
                  <h3 className="text-[15px] font-bold text-slate-800">Ảnh đại diện</h3>
                </div>
                <div className="flex items-start sm:items-center gap-4 mt-2">
                  {/* Ô hiển thị ảnh */}
                  <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] shrink-0 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden relative group flex items-center justify-center hover:border-brand transition-colors">
                    {form.cover_image_preview || form.existing_cover_image_url ? (
                      <>
                        <img
                          src={form.cover_image_preview || form.existing_cover_image_url}
                          alt="Ảnh đại diện"
                          className="w-full h-full object-cover cursor-pointer active:scale-95 transition-transform"
                          onClick={() => setFullScreenImage(form.cover_image_preview || form.existing_cover_image_url)}
                        />
                        {/* Nút xóa ảnh hiển thị khi hover (trên PC) */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                          <button type="button" onClick={handleRemoveSelectedImage} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-md transition-colors" title="Bỏ ảnh này">
                            <i className="fa-solid fa-trash-can text-[12px]"></i>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-brand transition-colors">
                        <i className="fa-regular fa-image text-[24px] sm:text-[28px] mb-1"></i>
                        <span className="text-[11px] sm:text-[12px] font-medium">Trống</span>
                      </div>
                    )}
                  </div>

                  {/* Nút upload và Text hướng dẫn */}
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand text-white text-[13px] font-bold cursor-pointer hover:bg-brand-dark transition-colors shadow-sm active:scale-[0.98]">
                      <i className="fa-solid fa-upload text-[12px]"></i>
                      <span className="hidden sm:inline">
                        {form.cover_image_preview || form.existing_cover_image_url ? "Đổi ảnh đại diện" : "Chọn ảnh đại diện"}
                      </span>
                      <span className="sm:hidden">Tải ảnh lên</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                    </label>

                    {/* Hiển thị nút xóa ảnh ngay dưới nút Upload cho Mobile dễ bấm */}
                    {form.cover_image_preview && (
                      <button type="button" onClick={handleRemoveSelectedImage} className="sm:hidden ml-3 px-3 py-2.5 rounded-lg bg-red-50 text-[13px] font-bold text-red-500 active:bg-red-100 transition-colors">
                        Hủy ảnh mới
                      </button>
                    )}

                    <p className="text-[12px] text-slate-500 mt-2.5 leading-relaxed">
                      Định dạng JPG, PNG, WEBP (Tối đa 4MB).<br className="hidden sm:block" />
                      Ảnh hiển thị ở danh sách khu nhà.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Địa chỉ */}
              <div className="bg-white px-1 py-5 sm:p-6 border-b border-slate-200 mt-2 sm:mt-0">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">3</div>
                  <h3 className="text-[15px] font-bold text-slate-800">Địa chỉ</h3>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Địa chỉ khu nhà <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-location-dot absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]"></i>
                    <input
                      type="text"
                      value={form.address}
                      onChange={handleChange("address")}
                      placeholder="Nhập đầy đủ số nhà, đường, phường/xã, quận/huyện..."
                      required
                      className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Cấu hình dịch vụ & Định mức miễn phí (THIẾT KẾ ĐÁP ỨNG MOBILE) */}
              <div className="bg-white px-1 py-5 sm:p-6 border-b border-slate-200 mt-2 sm:mt-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">4</div>
                  <h3 className="text-[15px] font-bold text-slate-800">Dịch vụ và Định mức mặc định</h3>
                </div>
                <p className="text-[12px] text-slate-500 mb-4">
                  Cấu hình giá dịch vụ và định mức miễn phí (nếu có) dành riêng cho khu nhà này. Nhấn nút xóa đối với các dịch vụ không áp dụng.
                </p>

                {isLoadingServices ? (
                  <div className="py-6 text-center text-[13px] text-slate-400">
                    <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Đang tải bảng giá đề xuất hệ thống...
                  </div>
                ) : services.length === 0 ? (
                  <div className="py-4 text-center text-[13px] text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Hệ thống chưa thiết lập danh mục giá toàn cục.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header chỉ hiện ở Desktop (Đã gộp cột cho gọn) */}
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 rounded-lg">
                      <div className="w-[140px]">Dịch vụ</div>
                      <div className="flex-1">Cấu hình giá & Định mức</div>
                      <div className="w-8 text-center">Bỏ</div>
                    </div>

                    {/* Danh sách dịch vụ */}
                    {services.map((service, index) => {
                      const unit = service.service_type === "electricity" ? "kWh"
                        : service.service_type === "water" ? "m³"
                          : service.service_type === "garbage" ? "tháng"
                            : service.service_type === "internet" ? "tháng" : "đv";

                      return (
                        <div
                          key={service.service_type}
                          className="bg-white border border-slate-200 sm:border-slate-100 rounded-xl sm:rounded-lg p-3 sm:p-2 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-2 shadow-sm sm:shadow-none hover:border-brand/30 transition-all group"
                        >
                          {/* Cột 1: Tên dịch vụ */}
                          <div className="flex items-center justify-between sm:w-[140px] sm:mt-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-brand sm:hidden"></div>
                              <span className="text-[14px] sm:text-[13px] font-bold text-slate-800">
                                {service.service_type_label} <span className="text-slate-500 font-medium text-[12px]">/{unit}</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setServices(prev => prev.filter((_, i) => i !== index))}
                              className="sm:hidden w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center active:bg-red-100 transition-colors"
                            >
                              <i className="fa-regular fa-trash-can text-[13px]"></i>
                            </button>
                          </div>

                          {/* Cột 2: Lưới nhập liệu Động */}
                          <div className="flex-1 flex flex-col gap-2">
                            {/* Dòng 1: Đơn giá và Hình thức */}
                            <div className="grid grid-cols-2 sm:flex sm:flex-1 gap-3 sm:gap-2">
                              <div className="col-span-2 sm:flex-1">
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 sm:hidden">
                                  {service.free_unit_type !== 'none' ? 'Đơn giá lố (VNĐ)' : 'Đơn giá (VNĐ)'}
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    required
                                    value={service.unit_price}
                                    onChange={(e) => handleServiceChange(index, "unit_price", formatMoneyInput(e.target.value))}
                                    className="w-full pl-3 pr-7 py-2.5 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] font-bold text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                    placeholder="0"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">đ</span>
                                </div>
                              </div>

                              <div className="col-span-2 sm:w-[170px]">
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 sm:hidden">Hình thức</label>
                                <select
                                  value={service.free_unit_type}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setServices(prev => {
                                      const updated = [...prev];
                                      updated[index].free_unit_type = val;
                                      if (val === 'none') {
                                        updated[index].free_units = 0;
                                        updated[index].base_price = ""; // Tự động reset phí cố định khi về none
                                      }
                                      return updated;
                                    });
                                  }}
                                  className="w-full px-2 py-2.5 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all cursor-pointer"
                                >
                                  <option value="none">Theo khối lượng</option>
                                  <option value="per_person">Cố định/Theo người</option>
                                  <option value="per_room">Cố định/Theo phòng</option>
                                </select>
                              </div>
                            </div>

                            {/* Dòng 2: Mức miễn phí và Phí cố định (CHỈ HIỆN KHI KHÁC 'none') */}
                            {service.free_unit_type !== 'none' && (
                              <div className="grid grid-cols-2 sm:flex sm:flex-1 gap-3 sm:gap-2 p-3 sm:p-2 bg-slate-50 border border-slate-200 rounded-lg mt-1 relative">
                                <div className="absolute -top-2 left-6 w-3 h-3 bg-slate-50 border-t border-l border-slate-200 rotate-45 sm:hidden"></div>

                                <div className="col-span-1 sm:w-[120px]">
                                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Mức miễn phí</label>
                                  <input
                                    type="number"
                                    min="0"
                                    required
                                    value={service.free_units}
                                    onChange={(e) => handleServiceChange(index, "free_units", e.target.value ? Number(e.target.value) : 0)}
                                    className="w-full px-3 py-2 sm:py-1.5 bg-white border border-slate-200 rounded-lg text-[14px] sm:text-[13px] font-semibold text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                  />
                                </div>

                                <div className="col-span-1 sm:flex-1">
                                  <label className="block text-[11px] font-bold text-slate-500 mb-1" title="Phí thu mặc định ban đầu">Thu tối thiểu</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={service.base_price}
                                      onChange={(e) => handleServiceChange(index, "base_price", formatMoneyInput(e.target.value))}
                                      className="w-full pl-3 pr-7 py-2 sm:py-1.5 bg-white border border-slate-200 rounded-lg text-[14px] sm:text-[13px] font-semibold text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                      placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">đ</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Nút xóa trên PC */}
                          <div className="hidden sm:flex w-8 items-center justify-center sm:mt-1.5">
                            <button
                              type="button"
                              onClick={() => setServices(prev => prev.filter((_, i) => i !== index))}
                              className="text-slate-400 hover:text-red-500 w-7 h-7 rounded-md hover:bg-red-50 flex items-center justify-center transition-colors"
                              title="Bỏ dịch vụ này"
                            >
                              <i className="fa-regular fa-trash-can text-[13px]"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Ghi chú */}
              <div className="bg-white px-1 py-5 sm:p-6 mt-2 sm:mt-0">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">5</div>
                  <h3 className="text-[15px] font-bold text-slate-800">Ghi chú</h3>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Thông tin thêm <span className="text-slate-400 font-normal">(tùy chọn)</span>
                  </label>
                  <textarea
                    value={form.note}
                    onChange={handleChange("note")}
                    maxLength={500}
                    placeholder="Nhập ghi chú thêm về khu nhà..."
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none min-h-[90px] placeholder:text-slate-400"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 sticky bottom-0 z-20 flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-5 py-3 sm:py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[14px] font-semibold hover:bg-slate-200 transition-colors w-[100px] sm:w-auto text-center disabled:opacity-70"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-8 py-3 sm:py-2.5 bg-brand text-white rounded-xl text-[14px] font-bold hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check text-[14px]"></i>
                    Cập nhật khu nhà
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
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
    </>
  );
}