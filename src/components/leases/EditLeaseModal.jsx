import React, { useEffect, useState } from "react";

const initialForm = {
  full_name: "",
  phone: "",
  email: "",
  id_card_number: "",
  property_name: "",
  room_name: "",
  move_in_date: "",
  note: "",
};

export default function EditTenantModal({
  open,
  tenant,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(initialForm);

  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);

  const [frontPreview, setFrontPreview] = useState("");
  const [backPreview, setBackPreview] = useState("");

  const [existingFrontImage, setExistingFrontImage] = useState("");
  const [existingBackImage, setExistingBackImage] = useState("");

  const [clientError, setClientError] = useState("");

  useEffect(() => {
    if (!open || !tenant) return;

    const currentResidence = tenant.current_residence || null;

    setForm({
      full_name: tenant.full_name || tenant.name || "",
      phone: tenant.phone || "",
      email: tenant.email || "",
      id_card_number: tenant.id_card_number || tenant.cccd || "",

      property_name:
        tenant.property ||
        currentResidence?.room?.property?.name ||
        "",

      room_name:
        tenant.room ||
        currentResidence?.room?.name ||
        "",

      move_in_date:
        tenant.move_in_date ||
        currentResidence?.move_in_date ||
        "",

      note:
        currentResidence?.note ||
        tenant.note ||
        "",
    });

    setExistingFrontImage(tenant.id_card_front_image || "");
    setExistingBackImage(tenant.id_card_back_image || "");

    setFrontImage(null);
    setBackImage(null);
    setClientError("");
  }, [open, tenant]);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!frontImage) {
      setFrontPreview(existingFrontImage || "");
      return;
    }

    const objectUrl = URL.createObjectURL(frontImage);
    setFrontPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [frontImage, existingFrontImage]);

  useEffect(() => {
    if (!backImage) {
      setBackPreview(existingBackImage || "");
      return;
    }

    const objectUrl = URL.createObjectURL(backImage);
    setBackPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [backImage, existingBackImage]);

  if (!open || !tenant) return null;

  const handleChange = (field) => (event) => {
    setClientError("");

    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setFrontImage(null);
    setBackImage(null);
    setFrontPreview("");
    setBackPreview("");
    setExistingFrontImage("");
    setExistingBackImage("");
    setClientError("");
  };

  const handleClose = () => {
    if (isSubmitting) return;

    resetForm();
    onClose?.();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.full_name.trim()) {
      setClientError("Vui lòng nhập họ và tên khách thuê.");
      return;
    }

    if (!form.phone.trim()) {
      setClientError("Vui lòng nhập số điện thoại.");
      return;
    }

    if (!form.id_card_number.trim()) {
      setClientError("Vui lòng nhập số CCCD/CMND.");
      return;
    }

    const payload = new FormData();

    /*
      Nếu tenantService.update đang dùng api.post(`/tenants/${id}`, data)
      thì cần _method = PUT để Laravel hiểu đây là request cập nhật.
    */
    payload.append("_method", "PUT");

    payload.append("full_name", form.full_name.trim());
    payload.append("phone", form.phone.trim());
    payload.append("email", form.email.trim());
    payload.append("id_card_number", form.id_card_number.trim());

    if (frontImage) {
      payload.append("id_card_front_image", frontImage);
    }

    if (backImage) {
      payload.append("id_card_back_image", backImage);
    }

    onSubmit?.(tenant.id, payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[980px] flex flex-col h-[95vh] sm:h-auto sm:max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div>
            <h2 className="text-[18px] font-bold text-slate-800">
              Chỉnh sửa khách thuê
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Chỉ chỉnh thông tin hồ sơ. Đổi phòng hoặc chuyển đại diện sẽ làm ở chức năng riêng.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 disabled:opacity-60"
          >
            <i className="fa-solid fa-xmark text-[20px]"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cột trái */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              {/* 1. Thông tin cá nhân */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                    1
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800">
                    Thông tin khách thuê
                  </h3>
                </div>

                {clientError && (
                  <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-[13px]">
                    {clientError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Mặt trước CCCD */}
                  <label className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50/30 transition-all group min-h-[170px] overflow-hidden">
                    <p className="text-[13px] font-semibold text-slate-700 mb-3 group-hover:text-brand transition-colors">
                      Mặt trước CCCD
                    </p>

                    {frontPreview ? (
                      <div className="relative w-full h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mb-2">
                        <img
                          src={frontPreview}
                          alt="Mặt trước CCCD"
                          className="w-full h-full object-cover"
                        />

                        {frontImage && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setFrontImage(null);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white flex items-center justify-center shadow-sm"
                            title="Bỏ ảnh mới chọn"
                          >
                            <i className="fa-solid fa-xmark text-[12px]"></i>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative">
                        <i className="fa-regular fa-address-card text-xl"></i>
                        <i className="fa-solid fa-user absolute text-[10px] right-2 bottom-2"></i>
                      </div>
                    )}

                    <span className="text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center line-clamp-1 max-w-full">
                      {frontImage
                        ? frontImage.name
                        : frontPreview
                          ? "Bấm để thay ảnh mặt trước"
                          : "Chụp hoặc tải ảnh lên"}
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setFrontImage(event.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>

                  {/* Mặt sau CCCD */}
                  <label className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50/30 transition-all group min-h-[170px] overflow-hidden">
                    <p className="text-[13px] font-semibold text-slate-700 mb-3 group-hover:text-brand transition-colors">
                      Mặt sau CCCD
                    </p>

                    {backPreview ? (
                      <div className="relative w-full h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mb-2">
                        <img
                          src={backPreview}
                          alt="Mặt sau CCCD"
                          className="w-full h-full object-cover"
                        />

                        {backImage && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setBackImage(null);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white flex items-center justify-center shadow-sm"
                            title="Bỏ ảnh mới chọn"
                          >
                            <i className="fa-solid fa-xmark text-[12px]"></i>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative">
                        <i className="fa-regular fa-address-card text-xl"></i>
                        <i className="fa-solid fa-qrcode absolute text-[10px] right-2 bottom-2"></i>
                      </div>
                    )}

                    <span className="text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center line-clamp-1 max-w-full">
                      {backImage
                        ? backImage.name
                        : backPreview
                          ? "Bấm để thay ảnh mặt sau"
                          : "Chụp hoặc tải ảnh lên"}
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setBackImage(event.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={handleChange("full_name")}
                      placeholder="Nhập họ và tên"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={handleChange("phone")}
                      placeholder="Nhập số điện thoại"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
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
                      placeholder="Nhập số CCCD/CMND"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Email{" "}
                      <span className="text-slate-400 font-normal">
                        (tùy chọn)
                      </span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange("email")}
                      placeholder="VD: khachthue@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100"></div>

              {/* 2. Thông tin lưu trú */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                    2
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800">
                    Thông tin lưu trú hiện tại
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Khu nhà
                    </label>
                    <input
                      type="text"
                      value={form.property_name || "—"}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Phòng
                    </label>
                    <input
                      type="text"
                      value={form.room_name || "—"}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Ngày vào ở
                    </label>
                    <input
                      type="text"
                      value={form.move_in_date || "—"}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-[13px] flex items-start gap-3">
                    <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                    <p>
                      Đổi phòng hoặc ghi nhận rời phòng sẽ làm bằng chức năng riêng
                      để giữ đúng lịch sử cư trú.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                    3
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800">
                    Vai trò & tài khoản
                  </h3>
                </div>

                <div className="bg-white border border-blue-100 shadow-sm p-4 rounded-xl text-[13px] text-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-user-group"></i>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 mb-1">
                        Không chỉnh vai trò ở đây
                      </p>
                      <p className="text-slate-500 leading-relaxed">
                        Người ở ghép, đại diện hợp đồng và tài khoản đăng nhập sẽ
                        được xử lý trong chức năng hợp đồng hoặc chuyển đại diện.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-orange-50 border border-orange-100 p-3.5 rounded-xl text-[13px] text-orange-800 flex items-start gap-3">
                  <i className="fa-solid fa-circle-exclamation mt-0.5 text-orange-500 shrink-0"></i>
                  <div className="leading-relaxed">
                    <p className="font-semibold mb-0.5">
                      Không nên sửa phòng trực tiếp trong form hồ sơ.
                    </p>
                    <p>
                      Nếu cho sửa trực tiếp sẽ mất ý nghĩa lịch sử vào ở, rời phòng
                      hoặc chuyển phòng.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                    4
                  </div>
                  <h3 className="text-[14px] font-bold text-slate-800">
                    Ghi chú lưu trú
                  </h3>
                </div>

                <div className="relative">
                  <textarea
                    value={form.note}
                    disabled
                    placeholder="Chưa có ghi chú lưu trú."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-500 resize-none min-h-[140px] cursor-not-allowed"
                  ></textarea>
                </div>

                <p className="text-[11px] text-slate-400 mt-2">
                  Ghi chú này thuộc lịch sử cư trú. Nếu cần sửa, nên xử lý trong
                  chức năng chi tiết cư trú sau.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-60"
          >
            <i className="fa-solid fa-xmark text-[14px]"></i> Hủy
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {isSubmitting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}