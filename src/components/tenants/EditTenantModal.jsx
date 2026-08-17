import React, { useState, useEffect } from "react";

const initialForm = {
  full_name: "",
  phone: "",
  email: "",
  id_card_number: "",
};

export default function EditTenantModal({
  open,
  tenant,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(initialForm);

  // Quản lý ảnh mặt trước
  const [frontImage, setFrontImage] = useState(null);
  const [frontPreview, setFrontPreview] = useState("");
  const [existingFrontUrl, setExistingFrontUrl] = useState("");

  // Quản lý ảnh mặt sau
  const [backImage, setBackImage] = useState(null);
  const [backPreview, setBackPreview] = useState("");
  const [existingBackUrl, setExistingBackUrl] = useState("");

  const [clientError, setClientError] = useState("");
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Cleanup object URLs để tránh memory leak
  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [frontPreview, backPreview]);

  // Khóa cuộn trang nền khi mở Modal
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Đổ dữ liệu tenant vào form khi mở
  useEffect(() => {
    if (!open) return;

    if (!tenant) {
      setForm(initialForm);
      return;
    }

    setForm({
      full_name: tenant.full_name || tenant.name || "",
      phone: tenant.phone || "",
      email: tenant.email || "",
      id_card_number: tenant.id_card_number || tenant.cccd || "",
    });

    setExistingFrontUrl(tenant.id_card_front_image || "");
    setExistingBackUrl(tenant.id_card_back_image || "");

    setFrontImage(null);
    setFrontPreview("");
    setBackImage(null);
    setBackPreview("");
    setClientError("");
  }, [open, tenant]);

  if (!open) return null;

  const handleChange = (field) => (event) => {
    setClientError("");
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleFrontChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontImage(file);
    setFrontPreview(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleBackChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (backPreview) URL.revokeObjectURL(backPreview);
    setBackImage(file);
    setBackPreview(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleRemoveNewFront = () => {
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontImage(null);
    setFrontPreview("");
  };

  const handleRemoveNewBack = () => {
    if (backPreview) URL.revokeObjectURL(backPreview);
    setBackImage(null);
    setBackPreview("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.full_name.trim()) return setClientError("Vui lòng nhập họ và tên khách thuê.");
    if (!form.phone.trim()) return setClientError("Vui lòng nhập số điện thoại.");

    const payload = new FormData();
    // Khai báo _method PUT để Laravel nhận diện Update qua FormData
    payload.append("_method", "PUT");
    payload.append("full_name", form.full_name.trim());
    payload.append("phone", form.phone.trim());
    payload.append("id_card_number", form.id_card_number.trim());

    if (form.email.trim()) {
      payload.append("email", form.email.trim());
    }

    if (frontImage) payload.append("id_card_front_image", frontImage);
    if (backImage) payload.append("id_card_back_image", backImage);

    onSubmit(tenant.id, payload);
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

      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
        {/* Modal Container */}
        <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[700px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">

          {/* Header (Sticky Top) */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              {/* Đổi màu bg-blue-50/text-blue-600 thành bg-brand/10 và text-brand */}
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <i className="fa-solid fa-user-pen text-[18px]"></i>
              </div>
              <div>
                <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800 leading-tight">
                  Chỉnh sửa hồ sơ
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                  Cập nhật thông tin cá nhân và giấy tờ của khách thuê
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
            {/* Body (Scrollable) */}
            <div className="overflow-y-auto no-scrollbar flex-1 pb-6 bg-white">

              {/* Error Message Đồng Bộ */}
              {clientError && (
                <div className="mx-5 mt-5 sm:mx-6 sm:mt-6 mb-2 bg-red-50 border-l-[4px] border-red-500 rounded-r-xl p-3.5 sm:p-4 shadow-sm flex items-start gap-3 animate-[fadeIn_0.3s_ease-out]">
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

              {/* 1. Thông tin cá nhân */}
              <div className="px-5 py-5 sm:p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                    1
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800">
                    Thông tin liên hệ
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={handleChange("full_name")}
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange("phone")}
                      placeholder="Nhập số điện thoại"
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Số CCCD/CMND <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="text"
                      value={form.id_card_number}
                      onChange={handleChange("id_card_number")}
                      placeholder="Nhập số CCCD"
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Địa chỉ Email <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange("email")}
                      placeholder="VD: khachthue@email.com"
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100"></div>

              {/* 2. Ảnh giấy tờ */}
              <div className="px-5 py-5 sm:p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                    2
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800">
                    Ảnh CCCD / CMND
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-2">
                  {/* Mặt trước */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all min-h-[140px] sm:min-h-[170px] relative bg-white hover:border-brand">
                    <p className="text-[11px] sm:text-[13px] font-semibold text-slate-700 mb-2 relative z-10 w-full text-center">
                      Mặt trước
                    </p>

                    {(frontPreview || existingFrontUrl) ? (
                      <div className="relative w-full h-[80px] sm:h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-black mb-1.5 shadow-inner group">
                        <img
                          src={frontPreview || existingFrontUrl}
                          alt="Mặt trước"
                          className="absolute inset-0 w-full h-full object-cover cursor-pointer active:scale-95 transition-transform"
                          onClick={() => setFullScreenImage(frontPreview || existingFrontUrl)}
                        />

                        {/* Nút đổi ảnh (Thu nhỏ lại nằm ở dưới cùng) */}
                        <label className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white px-3 py-1 rounded-full text-[11px] font-medium shadow-sm transition-all cursor-pointer backdrop-blur-sm z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                          <i className="fa-solid fa-camera mr-1.5"></i> Đổi ảnh
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFrontChange} className="hidden" />
                        </label>

                        {/* Nút X chỉ hiện nếu là ảnh mới tải lên */}
                        {frontPreview && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveNewFront();
                            }}
                            className="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/50 text-white hover:bg-red-500 flex items-center justify-center backdrop-blur-sm transition-colors shadow-md z-20"
                          >
                            <i className="fa-solid fa-xmark text-[10px] sm:text-[11px]"></i>
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className="w-full h-[80px] sm:h-[110px] flex flex-col items-center justify-center cursor-pointer mb-1.5 group-hover:border-brand transition-colors">
                        <div className="w-10 h-8 sm:w-12 sm:h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-1.5 group-hover:border-brand group-hover:text-brand transition-colors relative z-10 shadow-sm">
                          <i className="fa-regular fa-address-card text-lg sm:text-xl"></i>
                        </div>
                        <span className="text-[10px] sm:text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center">
                          Tải ảnh lên
                        </span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFrontChange} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Mặt sau */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all min-h-[140px] sm:min-h-[170px] relative bg-white hover:border-brand">
                    <p className="text-[11px] sm:text-[13px] font-semibold text-slate-700 mb-2 relative z-10 w-full text-center">
                      Mặt sau
                    </p>

                    {(backPreview || existingBackUrl) ? (
                      <div className="relative w-full h-[80px] sm:h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-black mb-1.5 shadow-inner group">
                        <img
                          src={backPreview || existingBackUrl}
                          alt="Mặt sau"
                          className="absolute inset-0 w-full h-full object-cover cursor-pointer active:scale-95 transition-transform"
                          onClick={() => setFullScreenImage(backPreview || existingBackUrl)}
                        />

                        {/* Nút đổi ảnh (Thu nhỏ lại nằm ở dưới cùng) */}
                        <label className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white px-3 py-1 rounded-full text-[11px] font-medium shadow-sm transition-all cursor-pointer backdrop-blur-sm z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                          <i className="fa-solid fa-camera mr-1.5"></i> Đổi ảnh
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBackChange} className="hidden" />
                        </label>

                        {backPreview && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveNewBack();
                            }}
                            className="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/50 text-white hover:bg-red-500 flex items-center justify-center backdrop-blur-sm transition-colors shadow-md z-20"
                          >
                            <i className="fa-solid fa-xmark text-[10px] sm:text-[11px]"></i>
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className="w-full h-[80px] sm:h-[110px] flex flex-col items-center justify-center cursor-pointer mb-1.5 group-hover:border-brand transition-colors">
                        <div className="w-10 h-8 sm:w-12 sm:h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-1.5 group-hover:border-brand group-hover:text-brand transition-colors relative z-10 shadow-sm">
                          <i className="fa-regular fa-address-card text-lg sm:text-xl"></i>
                        </div>
                        <span className="text-[10px] sm:text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center">
                          Tải ảnh lên
                        </span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBackChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer (Sticky Bottom) */}
            <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 sticky bottom-0 z-20 flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              {/* Nút Hủy */}
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-5 py-3 sm:py-2.5 bg-slate-100 text-slate-600 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-semibold hover:bg-slate-200 transition-colors w-[100px] sm:w-auto text-center disabled:opacity-70"
              >
                Hủy
              </button>

              {/* Nút Cập nhật */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-8 py-3 sm:py-2.5 bg-brand text-white rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-bold sm:font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand/30 sm:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
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
      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10 cursor-zoom-out animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setFullScreenImage(null)}
        >
          <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-white text-3xl sm:text-4xl transition-colors w-12 h-12 flex items-center justify-center bg-black/50 rounded-full">
            <i className="fa-solid fa-xmark"></i>
          </button>
          <img
            src={fullScreenImage}
            alt="Phóng to"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-[zoomIn_0.2s_ease-out]"
          />
        </div>
      )}
    </>
  );
}