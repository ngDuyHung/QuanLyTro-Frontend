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
    if (!form.id_card_number.trim()) return setClientError("Vui lòng nhập số CCCD/CMND.");

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
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
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
            <div className="overflow-y-auto no-scrollbar flex-1 pb-6 bg-slate-50">
              
              {/* Error Message */}
              {clientError && (
                <div className="mx-5 mt-5 sm:mx-6 sm:mt-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2 shadow-sm">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {clientError}
                </div>
              )}

              {/* 1. Thông tin cá nhân */}
              <div className={`bg-white px-5 py-5 sm:p-6 border-b border-slate-200 ${clientError ? 'mt-4' : ''}`}>
                <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-address-card text-[13px]"></i> 1. Thông tin liên hệ
                </h3>

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
                      className="w-full px-3.5 py-3 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-medium"
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
                      className="w-full px-3.5 py-3 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Số CCCD/CMND <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.id_card_number}
                      onChange={handleChange("id_card_number")}
                      placeholder="Nhập số CCCD"
                      className="w-full px-3.5 py-3 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-medium"
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
                      className="w-full px-3.5 py-3 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Ảnh giấy tờ */}
              <div className="bg-white px-5 py-5 sm:p-6 mt-2 sm:mt-0">
                <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                  <i className="fa-regular fa-images text-[13px]"></i> 2. Ảnh CCCD / CMND
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Mặt trước */}
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-slate-600 mb-2 text-center uppercase tracking-wide">Mặt trước</span>
                    <div className="relative w-full aspect-[8/5] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center group hover:border-brand transition-colors">
                      {frontPreview ? (
                        <img src={frontPreview} alt="Mặt trước mới" className="w-full h-full object-cover" />
                      ) : existingFrontUrl ? (
                        <img src={existingFrontUrl} alt="Mặt trước hiện tại" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <i className="fa-regular fa-image text-2xl mb-1 group-hover:text-brand transition-colors"></i>
                          <p className="text-[11px]">Chưa có ảnh</p>
                        </div>
                      )}

                      {/* Nút Upload đè lên */}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[1px]">
                        <div className="bg-white text-slate-700 px-3 py-1.5 rounded-lg text-[12px] font-semibold shadow-sm flex items-center gap-1.5">
                          <i className="fa-solid fa-camera"></i> {existingFrontUrl || frontPreview ? 'Đổi ảnh' : 'Tải lên'}
                        </div>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFrontChange} className="hidden" />
                      </label>
                    </div>
                    {frontPreview && (
                      <button type="button" onClick={handleRemoveNewFront} className="mt-2 text-[12px] font-semibold text-red-500 hover:text-red-600 text-center">
                        Hủy ảnh mới chọn
                      </button>
                    )}
                  </div>

                  {/* Mặt sau */}
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-slate-600 mb-2 text-center uppercase tracking-wide">Mặt sau</span>
                    <div className="relative w-full aspect-[8/5] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center group hover:border-brand transition-colors">
                      {backPreview ? (
                        <img src={backPreview} alt="Mặt sau mới" className="w-full h-full object-cover" />
                      ) : existingBackUrl ? (
                        <img src={existingBackUrl} alt="Mặt sau hiện tại" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <i className="fa-regular fa-image text-2xl mb-1 group-hover:text-brand transition-colors"></i>
                          <p className="text-[11px]">Chưa có ảnh</p>
                        </div>
                      )}

                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[1px]">
                        <div className="bg-white text-slate-700 px-3 py-1.5 rounded-lg text-[12px] font-semibold shadow-sm flex items-center gap-1.5">
                          <i className="fa-solid fa-camera"></i> {existingBackUrl || backPreview ? 'Đổi ảnh' : 'Tải lên'}
                        </div>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBackChange} className="hidden" />
                      </label>
                    </div>
                    {backPreview && (
                      <button type="button" onClick={handleRemoveNewBack} className="mt-2 text-[12px] font-semibold text-red-500 hover:text-red-600 text-center">
                        Hủy ảnh mới chọn
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-100 p-3.5 rounded-xl text-[12px] text-blue-700 flex items-start gap-2.5">
                  <i className="fa-solid fa-circle-info mt-0.5 text-blue-500"></i>
                  <p className="leading-relaxed">Nếu bạn tải ảnh mới lên, ảnh cũ sẽ tự động được thay thế. Dung lượng ảnh tối đa 4MB.</p>
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
    </>
  );
}