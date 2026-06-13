import { useEffect, useState } from "react";

const initialForm = {
  name: "",
  code: "",
  status: "active",
  floors_count: "",
  expected_rooms_count: "",
  manager_name: "",
  address: "",
  note: "",
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

  useEffect(() => {
    if (open) {
      setForm(initialForm);
    }
  }, [open]);

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

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      ...form,
      floors_count: Number(form.floors_count || 0),
      expected_rooms_count: Number(form.expected_rooms_count || 0),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] sm:p-4 overflow-hidden">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[860px] sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand shrink-0">
              <i className="fa-solid fa-building text-[18px] sm:text-[20px]"></i>
            </div>

            <div>
              <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-800">
                Thêm khu nhà mới
              </h2>
              <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">
                Tạo khu nhà để quản lý phòng, khách thuê và cấu hình áp dụng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 disabled:opacity-60"
          >
            <i className="fa-solid fa-xmark text-[18px] sm:text-[20px]"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          {/* Body */}
          <div className="px-4 py-5 sm:px-6 sm:py-6 overflow-y-auto no-scrollbar flex-1 space-y-6 bg-white">
            {/* 1. Thông tin cơ bản */}
            <div>
              <h3 className="text-[14px] sm:text-[15px] font-bold text-brand mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-brand rounded-full inline-block"></span>
                1. Thông tin cơ bản
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Tên khu nhà <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={handleChange("name")}
                    placeholder="Nhập tên khu nhà / tòa nhà"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Ví dụ: Khu A - Lê Văn Sỹ
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Mã khu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={handleChange("code")}
                    placeholder="VD: KHU-A"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Mã tự động gợi ý, có thể chỉnh sửa
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Trạng thái <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <div
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-10 ${
                        form.status === "active"
                          ? "bg-brand"
                          : "bg-orange-400"
                      }`}
                    ></div>

                    <select
                      value={form.status}
                      onChange={handleChange("status")}
                      className="w-full pl-8 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand appearance-none cursor-pointer transition-all"
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Tạm ngưng</option>
                    </select>

                    <i className="fa-solid fa-angle-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] pointer-events-none"></i>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Số tầng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.floors_count}
                    onChange={handleChange("floors_count")}
                    placeholder="VD: 5"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Nhập 0 nếu khu nhà không chia tầng rõ ràng
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Số phòng dự kiến <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.expected_rooms_count}
                    onChange={handleChange("expected_rooms_count")}
                    placeholder="VD: 20"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Tổng số phòng dự kiến trong khu nhà
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Người quản lý / liên hệ{" "}
                    <span className="text-slate-400 font-normal ml-0.5">
                      (tùy chọn)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.manager_name}
                    onChange={handleChange("manager_name")}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100"></div>

            {/* 2. Địa chỉ */}
            <div>
              <h3 className="text-[14px] sm:text-[15px] font-bold text-brand mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-brand rounded-full inline-block"></span>
                2. Địa chỉ
              </h3>

              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Địa chỉ khu nhà <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <i className="fa-solid fa-location-dot absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]"></i>
                  <input
                    type="text"
                    value={form.address}
                    onChange={handleChange("address")}
                    placeholder="Nhập đầy đủ số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-slate-400"
                  />
                </div>

                <p className="text-[11px] text-slate-400 mt-1.5">
                  Hệ thống có thể dùng địa chỉ này để xác định vị trí bản đồ
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100"></div>

            {/* 3. Ghi chú */}
            <div>
              <h3 className="text-[14px] sm:text-[15px] font-bold text-brand mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-brand rounded-full inline-block"></span>
                3. Ghi chú
              </h3>

              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Ghi chú{" "}
                  <span className="text-slate-400 font-normal ml-0.5">
                    (tùy chọn)
                  </span>
                </label>

                <textarea
                  value={form.note}
                  onChange={handleChange("note")}
                  maxLength={500}
                  placeholder="Nhập ghi chú thêm về khu nhà..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none min-h-[110px] placeholder:text-slate-400"
                ></textarea>

                <div className="flex justify-end mt-1">
                  <span className="text-[11px] text-slate-400">
                    {form.note.length}/500 ký tự
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0 bg-white">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-brand text-white rounded-xl text-[13px] font-bold hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 order-1 sm:order-3 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang tạo...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus text-[11px]"></i>
                  Tạo khu nhà
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2 order-2 sm:flex sm:items-center">
              <button
                type="button"
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[13px] font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70"
              >
                <i className="fa-regular fa-floppy-disk text-slate-400 text-[14px]"></i>
                Lưu nháp
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-semibold hover:bg-slate-50 transition-colors text-center disabled:opacity-70"
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}