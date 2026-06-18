import React, { useEffect, useState } from "react";
import roomService from "@/services/roomService";

const initialForm = {
  property_id: "",
  room_id: "",
  start_date: new Date().toISOString().slice(0, 10),
  billing_day: "1",
  deposit: "0",
  electricity_reading: "0",
  water_reading: "0",
  full_name: "",
  phone: "",
  email: "",
  id_card_number: "",
};

const isAvailableRoom = (room) => {
  return room.status === "available" || room.status === "empty" || room.status === "vacant";
};

export default function AddLeaseModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  properties = [],
}) {
  const [form, setForm] = useState(initialForm);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [clientError, setClientError] = useState("");
  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomNotice, setRoomNotice] = useState("");

  const frontImagePreview = frontImage ? URL.createObjectURL(frontImage) : null;
  const backImagePreview = backImage ? URL.createObjectURL(backImage) : null;

  useEffect(() => {
    return () => {
      if (frontImagePreview) URL.revokeObjectURL(frontImagePreview);
      if (backImagePreview) URL.revokeObjectURL(backImagePreview);
    };
  }, [frontImagePreview, backImagePreview]);

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

  useEffect(() => {
    if (!open || !form.property_id) {
      setRooms([]);
      setRoomNotice("");
      return;
    }

    const fetchRooms = async () => {
      try {
        setIsLoadingRooms(true);
        setRoomNotice("");

        const response = await roomService.getByProperty(form.property_id, {
          per_page: 100,
          status: "available",
        });

        const allRooms = response.data.data || [];
        const availableRooms = allRooms.filter(isAvailableRoom);

        setRooms(availableRooms);

        if (availableRooms.length === 0) {
          setRoomNotice("Khu nhà này chưa có phòng trống để tạo hợp đồng.");
        }
      } catch (error) {
        setRooms([]);
        setRoomNotice("");
        setClientError(
          error.response?.data?.message ||
            "Không thể tải danh sách phòng của khu nhà."
        );
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [open, form.property_id]);

  if (!open) return null;

  const handleChange = (field) => (event) => {
    setClientError("");
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setFrontImage(null);
    setBackImage(null);
    setClientError("");
    setRooms([]);
    setRoomNotice("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose?.();
  };

  const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.property_id) {
      setClientError("Vui lòng chọn khu nhà.");
      return;
    }

    if (!form.room_id) {
      setClientError("Vui lòng chọn phòng trống để tạo hợp đồng.");
      return;
    }

    if (!form.start_date) {
      setClientError("Vui lòng chọn ngày bắt đầu hợp đồng.");
      return;
    }

    if (!form.full_name.trim()) {
      setClientError("Vui lòng nhập họ và tên khách đại diện.");
      return;
    }

    if (!form.phone.trim()) {
      setClientError("Vui lòng nhập số điện thoại khách đại diện.");
      return;
    }

    if (!form.id_card_number.trim()) {
      setClientError("Vui lòng nhập số CCCD/CMND khách đại diện.");
      return;
    }

    const payload = new FormData();

    payload.append("room_id", form.room_id);
    payload.append("start_date", form.start_date);
    payload.append("billing_day", form.billing_day || "1");
    payload.append("deposit", onlyDigits(form.deposit) || "0");
    payload.append("electricity_reading", onlyDigits(form.electricity_reading) || "0");
    payload.append("water_reading", onlyDigits(form.water_reading) || "0");

    payload.append("tenant[full_name]", form.full_name.trim());
    payload.append("tenant[phone]", onlyDigits(form.phone));
    payload.append("tenant[id_card_number]", form.id_card_number.trim());

    if (form.email.trim()) {
      payload.append("tenant[email]", form.email.trim());
    }

    if (frontImage) {
      payload.append("tenant[id_card_front_image]", frontImage);
    }

    if (backImage) {
      payload.append("tenant[id_card_back_image]", backImage);
    }

    onSubmit?.(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1040px] flex flex-col h-[95vh] sm:h-auto sm:max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div>
            <h2 className="text-[18px] font-bold text-slate-800">
              Thêm hợp đồng mới
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Tạo hợp đồng nhận phòng và tự tạo hồ sơ khách đại diện.
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

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 flex flex-col gap-8">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">1</div>
                  <h3 className="text-[15px] font-bold text-slate-800">
                    Thông tin phòng & hợp đồng
                  </h3>
                </div>

                {clientError && (
                  <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-[13px]">
                    {clientError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Khu nhà <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.property_id}
                      onChange={(event) => {
                        setClientError("");
                        setRoomNotice("");
                        setForm((prev) => ({
                          ...prev,
                          property_id: event.target.value,
                          room_id: "",
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand"
                    >
                      <option value="">Chọn khu nhà</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Phòng trống <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.room_id}
                      onChange={handleChange("room_id")}
                      disabled={!form.property_id || isLoadingRooms}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {isLoadingRooms
                          ? "Đang tải phòng..."
                          : form.property_id
                            ? "Chọn phòng trống"
                            : "Chọn khu nhà trước"}
                      </option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                          {room.current_price
                            ? ` - ${Number(room.current_price).toLocaleString("vi-VN")}đ/tháng`
                            : ""}
                        </option>
                      ))}
                    </select>
                    {roomNotice && (
                      <p className="mt-1.5 text-[12px] text-orange-600 leading-relaxed">
                        {roomNotice}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Ngày bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={handleChange("start_date")}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Ngày thu tiền
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      value={form.billing_day}
                      onChange={handleChange("billing_day")}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Tiền cọc
                    </label>
                    <input
                      type="text"
                      value={form.deposit}
                      onChange={handleChange("deposit")}
                      placeholder="VD: 1000000"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-[13px] flex items-start gap-3">
                    <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                    <p>
                      Chỉ hiển thị phòng trống. Sau khi tạo hợp đồng, phòng sẽ chuyển sang trạng thái đang thuê.
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100"></div>

              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">2</div>
                  <h3 className="text-[15px] font-bold text-slate-800">
                    Khách đại diện
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <label className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50/30 transition-all group min-h-[170px] overflow-hidden">
                    <p className="text-[13px] font-semibold text-slate-700 mb-3 group-hover:text-brand transition-colors">
                      Mặt trước CCCD
                    </p>
                    {frontImagePreview ? (
                      <div className="relative w-full h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mb-2">
                        <img src={frontImagePreview} alt="Mặt trước CCCD" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setFrontImage(null);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white flex items-center justify-center shadow-sm"
                        >
                          <i className="fa-solid fa-xmark text-[12px]"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative">
                        <i className="fa-regular fa-address-card text-xl"></i>
                      </div>
                    )}
                    <span className="text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center line-clamp-1 max-w-full">
                      {frontImage ? frontImage.name : "Chụp hoặc tải ảnh lên"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setFrontImage(event.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>

                  <label className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50/30 transition-all group min-h-[170px] overflow-hidden">
                    <p className="text-[13px] font-semibold text-slate-700 mb-3 group-hover:text-brand transition-colors">
                      Mặt sau CCCD
                    </p>
                    {backImagePreview ? (
                      <div className="relative w-full h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mb-2">
                        <img src={backImagePreview} alt="Mặt sau CCCD" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setBackImage(null);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white flex items-center justify-center shadow-sm"
                        >
                          <i className="fa-solid fa-xmark text-[12px]"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative">
                        <i className="fa-regular fa-address-card text-xl"></i>
                      </div>
                    )}
                    <span className="text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center line-clamp-1 max-w-full">
                      {backImage ? backImage.name : "Chụp hoặc tải ảnh lên"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setBackImage(event.target.files?.[0] || null)}
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
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Email <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange("email")}
                      placeholder="VD: khachthue@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">3</div>
                  <h3 className="text-[15px] font-bold text-slate-800">
                    Chỉ số ban đầu
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Chỉ số điện ban đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.electricity_reading}
                      onChange={handleChange("electricity_reading")}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Chỉ số nước ban đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.water_reading}
                      onChange={handleChange("water_reading")}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div className="bg-orange-50 border border-orange-100 p-3.5 rounded-xl text-[13px] text-orange-800 flex items-start gap-3">
                    <i className="fa-solid fa-circle-exclamation mt-0.5 text-orange-500 shrink-0"></i>
                    <div className="leading-relaxed">
                      <p className="font-semibold mb-0.5">Dữ liệu này dùng để tính hóa đơn kỳ đầu.</p>
                      <p>Chỉ số ban đầu sẽ được lưu thành bản ghi điện/nước đầu tiên của hợp đồng.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-green-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3 text-[13px] text-slate-600 leading-relaxed">
                  <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 mb-1">Sau khi lưu hợp đồng</p>
                    <p>Hệ thống sẽ tạo khách đại diện, tạo hợp đồng, chuyển phòng sang đang thuê và ghi chỉ số điện/nước ban đầu.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
            Lưu hợp đồng
          </button>
        </div>
      </div>
    </div>
  );
}
