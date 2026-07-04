import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import servicePriceService from "@/services/servicePriceService";
import useAuthStore from "@/stores/authStore";

const initialForm = {
  name: "",
  code: "",
  status: "active",
  floors_count: "",
  expected_rooms_count: "",
  manager_name: "",
  address: "",
  note: "",
  cover_image: null,
  cover_image_preview: "",
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

export default function AddPropertyModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(initialForm);

  // State quản lý danh sách dịch vụ đi kèm khu nhà
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);


  // 1. Kéo trực tiếp object user từ Zustand ra
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    return () => {
      if (form.cover_image_preview) {
        URL.revokeObjectURL(form.cover_image_preview);
      }
    };
  }, [form.cover_image_preview]);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Reset form và tự động tải bảng giá hệ thống làm gợi ý khi mở Modal
  useEffect(() => {
    if (open) {
      setForm({
        ...initialForm,
        // Tự động điền tên từ object user
        manager_name: user?.full_name || user?.name || "",
      });
      fetchGlobalServices();
    }
  }, [open, user]);

  const fetchGlobalServices = async () => {
    try {
      setIsLoadingServices(true);
      const res = await servicePriceService.getGlobal({ per_page: 100 });
      const globalPrices = res.data.data || [];

      // Mồi dữ liệu cấu hình ban đầu từ bảng giá chung hệ thống
      setServices(
        globalPrices.map((p) => ({
          service_type: p.service_type,
          service_type_label: p.service_type_label,
          unit_price: p.unit_price || 0,
          free_units: p.free_units || 0,
          free_unit_type: p.free_unit_type || "none",
        }))
      );
    } catch (error) {
      toast.error("Không thể tải bảng giá dịch vụ mặc định của hệ thống.");
    } finally {
      setIsLoadingServices(false);
    }
  };

  if (!open) return null;

  const handleChange = (field) => (event) => {
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

  const handleRemoveImage = () => {
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

  // Hàm thay đổi động giá trị của từng ô cấu hình dịch vụ theo vị trí (index)
  const handleServiceChange = (index, field, value) => {
    setServices((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData();

    formData.append("property_type", "boarding_house");
    formData.append("name", form.name.trim());
    formData.append("code", form.code.trim());
    formData.append("status", form.status);
    formData.append("floors_count", Number(form.floors_count || 0));
    formData.append("expected_rooms_count", Number(form.expected_rooms_count || 0));
    formData.append("manager_name", form.manager_name?.trim() || "");
    formData.append("address", form.address.trim());
    formData.append("description", form.note?.trim() || "");

    if (form.cover_image) {
      formData.append("cover_image", form.cover_image);
    }

    // Đóng gói mảng dịch vụ gửi lên Laravel theo cấu trúc mảng object []
    services.forEach((service, index) => {
      formData.append(`services[${index}][service_type]`, service.service_type);
      formData.append(`services[${index}][unit_price]`, service.unit_price || 0);
      formData.append(`services[${index}][free_units]`, service.free_units || 0);
      formData.append(`services[${index}][free_unit_type]`, service.free_unit_type || "none");
    });

    onSubmit(formData);
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
                  Thêm khu nhà mới
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                  Thiết lập thông tin để quản lý phòng và khách thuê
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shrink-0 disabled:opacity-60"
            >
              <i className="fa-solid fa-xmark text-[16px]"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <div className="overflow-y-auto no-scrollbar flex-1 pb-6 bg-slate-50">

              {/* 1. Thông tin cơ bản */}
              <div className="bg-white px-5 py-5 sm:p-6 border-b border-slate-200">
                <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-circle-info text-[12px]"></i> 1. Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Tên khu nhà <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange("name")}
                      placeholder="VD: Khu A - Lê Văn Sỹ"
                      required
                      className="w-full px-3.5 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-medium transition-all"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Mã khu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={handleChange("code")}
                      placeholder="VD: KHU-A"
                      required
                      className="w-full px-3.5 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Số tầng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.floors_count}
                      onChange={handleChange("floors_count")}
                      placeholder="Nhập 0 nếu không chia tầng"
                      required
                      className="w-full px-3.5 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Số phòng dự kiến <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.expected_rooms_count}
                      onChange={handleChange("expected_rooms_count")}
                      placeholder="VD: 20"
                      required
                      className="w-full px-3.5 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Người quản lý <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="text"
                      value={form.manager_name}
                      onChange={handleChange("manager_name")}
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>
                  <div className="sm:col-span-3 mt-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">Trạng thái khu nhà</label>
                    <div className="flex gap-3">
                      <label className="flex-1 relative cursor-pointer">
                        <input type="radio" name="status" value="active" checked={form.status === "active"} onChange={handleChange("status")} className="peer sr-only" />
                        <div className="w-full text-center px-3 py-3 sm:py-2 rounded-xl sm:rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-600 peer-checked:border-brand peer-checked:bg-brand/5 peer-checked:text-brand transition-all">
                          Đang hoạt động
                        </div>
                      </label>
                      <label className="flex-1 relative cursor-pointer">
                        <input type="radio" name="status" value="inactive" checked={form.status === "inactive"} onChange={handleChange("status")} className="peer sr-only" />
                        <div className="w-full text-center px-3 py-3 sm:py-2 rounded-xl sm:rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-600 peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:text-orange-600 transition-all">
                          Tạm ngưng
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Ảnh đại diện */}
              <div className="bg-white px-5 py-5 sm:p-6 border-b border-slate-200 mt-2 sm:mt-0">
                <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                  <i className="fa-regular fa-image text-[12px]"></i> 2. Ảnh đại diện
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-[220px] h-[140px] rounded-xl border border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center">
                    {form.cover_image_preview ? (
                      <img src={form.cover_image_preview} alt="Ảnh đại diện khu nhà" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center px-4">
                        <div className="w-11 h-11 mx-auto rounded-full bg-brand/10 text-brand flex items-center justify-center mb-2">
                          <i className="fa-regular fa-image text-[18px]"></i>
                        </div>
                        <p className="text-[12px] font-medium text-slate-600">Chưa chọn ảnh</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WEBP tối đa 4MB</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <label className="inline-flex w-fit items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-[13px] font-bold cursor-pointer hover:bg-brand-dark transition-colors">
                      <i className="fa-solid fa-upload text-[12px]"></i> Chọn ảnh đại diện
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                    </label>
                    {form.cover_image_preview && (
                      <button type="button" onClick={handleRemoveImage} className="mt-2 w-fit text-[13px] font-semibold text-red-600 hover:text-red-700">
                        Xóa ảnh đã chọn
                      </button>
                    )}
                    <p className="text-[12px] text-slate-500 mt-3 leading-5">
                      Ảnh này sẽ hiển thị ở danh sách khu nhà và trang giới thiệu phòng trọ cho khách thuê.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Địa chỉ */}
              <div className="bg-white px-5 py-5 sm:p-6 border-b border-slate-200 mt-2 sm:mt-0">
                <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-map-location-dot text-[12px]"></i> 3. Địa chỉ
                </h3>
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
                      className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Cấu hình dịch vụ & Định mức miễn phí (THIẾT KẾ ĐÁP ỨNG MOBILE) */}
              <div className="bg-white px-5 py-5 sm:p-6 border-b border-slate-200 mt-2 sm:mt-0">
                <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-file-invoice-dollar text-[12px]"></i> 4. Dịch vụ và Định mức mặc định
                </h3>
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
                    {/* Header chỉ hiện ở Desktop */}
                    <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 rounded-lg">
                      <div className="col-span-3">Loại dịch vụ</div>
                      <div className="col-span-3">Đơn giá (đ)</div>
                      <div className="col-span-2">Định mức miễn phí</div>
                      <div className="col-span-3">Hình thức miễn phí</div>
                      <div className="col-span-1 text-center">Bỏ</div>
                    </div>

                    {/* Danh sách dịch vụ - Tự động đổi bố cục tùy theo kích cỡ màn hình */}
                    {services.map((service, index) => (
                      <div
                        key={service.service_type}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col gap-3.5 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center hover:border-slate-300 shadow-sm transition-all"
                      >
                        {/* Tên dịch vụ */}
                        <div className="col-span-12 sm:col-span-3 flex items-center gap-2 bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-brand shrink-0"></div>
                          <span className="text-[13px] font-bold text-slate-800">
                            {service.service_type_label}/{service.service_type === "electricity" ? "kWh" : service.service_type === "water" ? "m³" : service.service_type === "garbage" ? "tháng" : service.service_type === "internet" ? "tháng" : "đơn vị"}
                          </span>
                        </div>

                        {/* Ô nhập Đơn giá */}
                        <div className="col-span-12 sm:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1 sm:hidden">Đơn giá (VNĐ):</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              required
                              value={service.unit_price}
                              onChange={(e) => handleServiceChange(index, "unit_price", e.target.value ? Number(e.target.value) : "")}
                              className="w-full pl-3 pr-7 py-2 bg-slate-50/50 sm:bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">đ</span>
                          </div>
                        </div>

                        {/* Ô nhập Định mức miễn phí */}
                        <div className="col-span-6 sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1 sm:hidden">Số lượng miễn phí:</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={service.free_units}
                            onChange={(e) => handleServiceChange(index, "free_units", e.target.value ? Number(e.target.value) : 0)}
                            className="w-full px-3 py-2 bg-slate-50/50 sm:bg-white border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                          />
                        </div>

                        {/* Dropdown chọn Loại đơn vị miễn phí */}
                        <div className="col-span-6 sm:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1 sm:hidden">Hình thức miễn phí:</label>
                          <div className="relative">
                            <select
                              value={service.free_unit_type}
                              onChange={(e) => handleServiceChange(index, "free_unit_type", e.target.value)}
                              className="w-full pl-3 pr-8 py-2 bg-slate-50/50 sm:bg-white border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer appearance-none transition-all"
                            >
                              <option value="none">Không miễn phí</option>
                              <option value="per_room">Tính theo phòng</option>
                              <option value="per_person">Tính theo người</option>
                            </select>
                            <i className="fa-solid fa-angle-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
                          </div>
                        </div>

                        {/* Nút loại bỏ dịch vụ khỏi khu nhà */}
                        <div className="col-span-12 sm:col-span-1 text-right sm:text-center mt-1 sm:mt-0 border-t border-dashed border-slate-100 pt-2 sm:pt-0 sm:border-none">
                          <button
                            type="button"
                            onClick={() => setServices(prev => prev.filter((_, i) => i !== index))}
                            className="w-full sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2 py-2 sm:py-0 text-[12px] sm:text-[14px] font-medium transition-colors"
                            title="Xóa dịch vụ này"
                          >
                            <i className="fa-regular fa-trash-can text-[13px]"></i>
                            <span className="sm:hidden font-bold">Bỏ áp dụng dịch vụ này</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Ghi chú */}
              <div className="bg-white px-5 py-5 sm:p-6 mt-2 sm:mt-0">
                <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-note-sticky text-[12px]"></i> 5. Ghi chú
                </h3>
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
                onClick={onClose}
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
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check text-[14px]"></i>
                    Tạo khu nhà
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}