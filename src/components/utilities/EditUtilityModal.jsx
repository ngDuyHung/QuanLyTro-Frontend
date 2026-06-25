import React, { useState, useEffect } from "react";

export default function EditUtilityModal({
  open,
  reading,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [form, setForm] = useState({
    current_reading: "",
    reading_date: "",
    note: "",
    remove_image: false,
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [previousReading, setPreviousReading] = useState(0);
  const [clientError, setClientError] = useState("");

  // Dọn dẹp URL ảnh preview để tránh tràn bộ nhớ
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Khóa cuộn trang khi mở Modal
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

  // Đổ dữ liệu từ `reading` prop vào state khi mở Modal
  useEffect(() => {
    if (!open || !reading) return;

    setForm({
      current_reading: reading.current_reading || "",
      reading_date: reading.reading_date || new Date().toISOString().slice(0, 10),
      note: reading.note || "",
      remove_image: false,
    });

    setExistingImage(reading.meter_image || "");
    setPreviousReading(reading.previous_reading || 0);
    setImage(null);
    setImagePreview("");
    setClientError("");
  }, [open, reading]);

  if (!open || !reading) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleChange = (field) => (event) => {
    setClientError("");
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, remove_image: false })); // Đã chọn ảnh mới thì ko gán cờ xóa nữa
    event.target.value = ""; // Reset input
  };

  const handleRemoveNewImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview("");
  };

  const handleRemoveExistingImage = () => {
    setExistingImage("");
    setForm((prev) => ({ ...prev, remove_image: true })); // Báo cho backend biết là muốn xóa ảnh
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.current_reading) return setClientError("Vui lòng nhập chỉ số mới.");
    if (Number(form.current_reading) < previousReading) {
      return setClientError(`Chỉ số mới không được nhỏ hơn số cũ (${previousReading}).`);
    }
    if (!form.reading_date) return setClientError("Vui lòng chọn ngày chốt số.");

    const payload = new FormData();
    // Khai báo _method PUT để Laravel nhận diện Update qua FormData
    payload.append("_method", "PUT");
    payload.append("current_reading", form.current_reading);
    payload.append("reading_date", form.reading_date);
    
    if (form.note.trim()) payload.append("note", form.note.trim());
    
    if (image) {
      payload.append("meter_image", image);
    } else if (form.remove_image) {
      payload.append("remove_image", "1");
    }

    onSubmit(reading.id, payload);
  };

  // Tính toán số tiêu thụ dự kiến để hiển thị trực quan
  const currentVal = Number(form.current_reading) || 0;
  const usageVal = Math.max(0, currentVal - previousReading);
  const typeLabel = reading.type === 'electricity' ? 'Điện' : 'Nước';
  const unitLabel = reading.type === 'electricity' ? 'kWh' : 'm³';

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
        <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[700px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] relative">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <i className="fa-solid fa-pen-to-square text-[18px]"></i>
              </div>
              <div>
                <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800 leading-tight">
                  Sửa chỉ số {typeLabel}
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                  Cập nhật sai sót trước khi lập hóa đơn.
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
            {/* Body */}
            <div className="overflow-y-auto no-scrollbar flex-1 pb-6 bg-slate-50">
              
              {clientError && (
                <div className="mx-5 mt-5 sm:mx-6 sm:mt-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2 shadow-sm">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {clientError}
                </div>
              )}

              {/* 1. Thông tin (Chỉ đọc) */}
              <div className={`bg-white px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 ${clientError ? 'mt-4' : ''}`}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                   <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold text-[12px] rounded-md">
                     Phòng {reading.room_name}
                   </span>
                   <span className="px-2.5 py-1 bg-slate-50 text-slate-500 font-medium text-[12px] rounded-md border border-slate-200">
                     {reading.property_name}
                   </span>
                   <span className={`px-2.5 py-1 font-bold text-[12px] rounded-md border flex items-center gap-1.5 ml-auto
                     ${reading.type === 'electricity' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                     <i className={`fa-solid ${reading.type === 'electricity' ? 'fa-bolt' : 'fa-droplet'}`}></i> {typeLabel}
                   </span>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-500 mb-1">Chỉ số cũ (Kỳ trước)</p>
                    <p className="text-[18px] font-bold text-slate-800">{previousReading.toLocaleString('vi-VN')} <span className="text-[13px] text-slate-400 font-medium">{unitLabel}</span></p>
                  </div>
                  <i className="fa-solid fa-arrow-right-long text-slate-300 text-xl"></i>
                  <div className="text-right">
                    <p className="text-[12px] font-semibold text-brand mb-1">Mức tiêu thụ tạm tính</p>
                    <p className="text-[18px] font-bold text-brand">{usageVal.toLocaleString('vi-VN')} <span className="text-[13px] text-green-600/70 font-medium">{unitLabel}</span></p>
                  </div>
                </div>
              </div>

              {/* 2. Cập nhật số liệu */}
              <div className="bg-white px-5 py-5 sm:p-6 mt-2 sm:mt-0 border-b border-slate-200">
                <h3 className="text-[14px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-calculator text-[13px] text-brand"></i> Thông tin điều chỉnh
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Ngày chốt số <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.reading_date}
                      onChange={handleChange("reading_date")}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Chỉ số mới nhất <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={previousReading}
                      value={form.current_reading}
                      onChange={handleChange("current_reading")}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border-2 border-slate-200 rounded-xl sm:rounded-lg text-[15px] font-bold text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all pr-12"
                    />
                    <span className="absolute right-4 bottom-[11px] sm:bottom-[9px] text-[13px] font-bold text-slate-400">
                      {unitLabel}
                    </span>
                  </div>

                  {/* Upload Ảnh */}
                  <div className="sm:col-span-2 mt-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                      Ảnh chụp đồng hồ
                    </label>
                    
                    <div className="flex gap-4">
                      {imagePreview || existingImage ? (
                        <div className="relative w-full sm:w-[250px] aspect-[4/3] rounded-xl border border-slate-200 overflow-hidden bg-black group">
                          <img src={imagePreview || existingImage} alt="Đồng hồ" className="w-full h-full object-contain" />
                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <span className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-sm">Đổi ảnh khác</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                          </label>
                        </div>
                      ) : (
                        <label className="w-full sm:w-[250px] aspect-[4/3] border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50 transition-all group">
                          <i className="fa-solid fa-camera text-2xl text-slate-300 group-hover:text-brand mb-2"></i>
                          <p className="text-[12px] font-semibold text-slate-500 group-hover:text-brand">Tải ảnh lên</p>
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                        </label>
                      )}

                      {/* Các nút Hủy ảnh */}
                      {(imagePreview || existingImage) && (
                         <div className="flex flex-col justify-end gap-2">
                           {imagePreview && (
                              <button type="button" onClick={handleRemoveNewImage} className="text-[12px] font-semibold text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                Hủy ảnh mới
                              </button>
                           )}
                           {existingImage && !imagePreview && (
                              <button type="button" onClick={handleRemoveExistingImage} className="text-[12px] font-semibold text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                Xóa ảnh cũ
                              </button>
                           )}
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Ghi chú */}
              <div className="bg-white px-5 py-5 sm:p-6 mt-2 sm:mt-0">
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                   Ghi chú <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                </label>
                <textarea
                  value={form.note}
                  onChange={handleChange("note")}
                  maxLength={255}
                  placeholder="Lý do điều chỉnh..."
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none min-h-[90px]"
                ></textarea>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 sticky bottom-0 z-20 flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-5 py-3 sm:py-2.5 bg-slate-100 text-slate-600 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-semibold hover:bg-slate-200 transition-colors w-[100px] sm:w-auto text-center disabled:opacity-70"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-8 py-3 sm:py-2.5 bg-blue-600 text-white rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-bold sm:font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 sm:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
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