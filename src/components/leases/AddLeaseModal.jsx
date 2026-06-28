import React, { useEffect, useState } from "react";
import roomService from "@/services/roomService";
import ocrService from "@/services/ocrService";
import servicePriceService from "@/services/servicePriceService";


// Thêm 2 hàm này phía trên initialForm
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
  services: [],
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

  // THÊM ĐOẠN NÀY: State cho ảnh chỉ số
  const [electricityImage, setElectricityImage] = useState(null);
  const [waterImage, setWaterImage] = useState(null);
  const electricityImagePreview = electricityImage ? URL.createObjectURL(electricityImage) : null;
  const waterImagePreview = waterImage ? URL.createObjectURL(waterImage) : null;


  const [clientError, setClientError] = useState("");
  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomNotice, setRoomNotice] = useState("");

  // --- QUẢN LÝ QUÉT CCCD ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState({ type: "", text: "" });
  // ---

  const frontImagePreview = frontImage ? URL.createObjectURL(frontImage) : null;
  const backImagePreview = backImage ? URL.createObjectURL(backImage) : null;

  const [availableServices, setAvailableServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  useEffect(() => {
    return () => {
      if (frontImagePreview) URL.revokeObjectURL(frontImagePreview);
      if (backImagePreview) URL.revokeObjectURL(backImagePreview);
      if (electricityImagePreview) URL.revokeObjectURL(electricityImagePreview);
      if (waterImagePreview) URL.revokeObjectURL(waterImagePreview);
    };
  }, [frontImagePreview, backImagePreview, electricityImagePreview, waterImagePreview]);


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

    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);
        const response = await servicePriceService.getByProperty(form.property_id);

        console.log("Dữ liệu dịch vụ từ API:", response.data);
        const fetchedServices = response.data.data || response.data || [];
        setAvailableServices(fetchedServices);

        // Tự động map tất cả dịch vụ có sẵn vào form, gán số lượng = 1 và lấy giá mặc định
        const autoFilledServices = fetchedServices.map((srv) => ({
          service_type: srv.service_type,
          quantity: 1,
          // Sử dụng unit_price hoặc price tùy theo cấu trúc object API trả về
          custom_price: srv.unit_price !== undefined ? srv.unit_price : (srv.price || ""),
        }));

        setForm((prev) => ({
          ...prev,
          services: autoFilledServices,
        }));

      } catch (error) {
        console.error("Lỗi tải danh sách dịch vụ", error);
        setAvailableServices([]);
        // Reset services trong form nếu không tải được
        setForm((prev) => ({ ...prev, services: [] }));
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();

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

  const resetForm = () => {
    setForm(initialForm);
    setFrontImage(null);
    setBackImage(null);
    setClientError("");
    setRooms([]);
    setRoomNotice("");
    setScanMessage({ type: "", text: "" });
    setAvailableServices([]);
    setElectricityImage(null);
    setWaterImage(null);
  };

  // 2. THÊM useEffect này để tự động dọn dẹp data mỗi khi modal đóng
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  if (!open) return null;

  const handleScanCCCD = async (file) => {
    if (!file) return;

    setIsScanning(true);
    setScanMessage({ type: "", text: "" }); // Xóa thông báo cũ đi

    const payload = new FormData();
    payload.append("image", file);

    try {
      const response = await ocrService.scanIdCard(payload);

      // Axios tự động parse JSON và lưu vào response.data
      const result = response.data;

      if (result.data) {
        // ĐỔI TỪ if (result.success) THÀNH if (result.data)
        if (result.data) {
          // Điền tự động vào form
          setForm((prev) => ({
            ...prev,
            full_name: result.data.full_name || prev.full_name,
            id_card_number: result.data.id_card_number || prev.id_card_number,
          }));
          // Lấy luôn message từ API trả về cho sinh động
          setScanMessage({ type: "success", text: result.message || "Trích xuất thông tin thành công!" });
        }
      }
    } catch (error) {
      // Lấy câu message lỗi từ backend trả về (hoặc dùng câu mặc định)
      const errorMsg = error.response?.data?.message || "Không đọc được CCCD, vui lòng nhập tay.";
      setScanMessage({ type: "error", text: errorMsg });
    } finally {
      setIsScanning(false);
    }
  };


  const handleChange = (field) => (event) => {
    setClientError("");
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleRoomChange = (event) => {
    if (!event || !event.target) return;

    const selectedRoomId = event.target.value;

    // Tìm thông tin phòng để lấy giá và ngày thu tiền
    const selectedRoom = rooms.find((r) => String(r.id) === String(selectedRoomId));

    setForm((prev) => ({
      ...prev,
      room_id: selectedRoomId,
      room_price: selectedRoom ? formatMoneyInput(selectedRoom.current_price) : "", // Thêm dòng này
      billing_day: selectedRoom ? (selectedRoom.billing_day || "1") : prev.billing_day,
      deposit: selectedRoom ? formatMoneyInput(selectedRoom.current_price) : prev.deposit, // Format cọc
    }));
  };



  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose?.();
  };

  const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

  const handleAddService = () => {
    setForm((prev) => ({
      ...prev,
      services: [...prev.services, { service_type: "", quantity: 1, custom_price: "" }],
    }));
  };

  const handleRemoveService = (index) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleChangeService = (index, field, value) => {
    setForm((prev) => {
      const newServices = [...prev.services];
      // Tự động format nếu là trường custom_price
      newServices[index][field] = field === "custom_price" ? formatMoneyInput(value) : value;
      return { ...prev, services: newServices };
    });
  };

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

    // Validate sơ bộ cho services
    const hasInvalidService = form.services.some(s => !s.service_type || s.quantity < 1);
    if (hasInvalidService) {
      setClientError("Vui lòng chọn loại dịch vụ và đảm bảo số lượng >= 1.");
      return;
    }

    const payload = new FormData();

    payload.append("room_id", form.room_id);
    payload.append("start_date", form.start_date);
    payload.append("billing_day", form.billing_day || "1");
    payload.append("deposit", onlyDigits(form.deposit) || "0");
    payload.append("room_price", onlyDigits(form.room_price) || "0");
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

    if (electricityImage) {
      payload.append("electricity_image", electricityImage);
    }
    if (waterImage) {
      payload.append("water_image", waterImage);
    }

    // ĐOẠN NÀY ĐỂ APPEND SERVICES VÀO FORMDATA
    form.services.forEach((service, index) => {
      payload.append(`services[${index}][service_type]`, service.service_type);
      payload.append(`services[${index}][quantity]`, service.quantity);
      if (service.custom_price !== "") {
        payload.append(`services[${index}][custom_price]`, onlyDigits(service.custom_price));
      }
    });

    onSubmit?.(payload);
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
      <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-h-[95vh] max-w-[1040px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-white sticky top-0 z-20">
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
          <div className="px-4 py-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
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
                      onChange={handleRoomChange}
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
                      Giá tiền phòng
                    </label>
                    <input
                      type="text"
                      value={form.room_price}
                      // readOnly
                      onChange={(e) => setForm(prev => ({ ...prev, room_price: formatMoneyInput(e.target.value) }))}
                      placeholder="VD: 1.000.000"
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
                      onChange={(e) => setForm(prev => ({ ...prev, deposit: formatMoneyInput(e.target.value) }))}
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
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setFrontImage(file);
                        handleScanCCCD(file);
                      }}
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

                {/* Scan Message */}
                {(isScanning || scanMessage.text) && (
                  <div className="mb-4">
                    {isScanning && (
                      <p className="text-[13px] text-brand font-medium flex items-center gap-2">
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        Đang dùng AI trích xuất dữ liệu thẻ...
                      </p>
                    )}
                    {!isScanning && scanMessage.text && (
                      <p className={`text-[13px] font-medium flex items-center gap-2 ${scanMessage.type === "success" ? "text-green-600" : "text-orange-500"
                        }`}>
                        {scanMessage.type === "success"
                          ? <i className="fa-solid fa-check"></i>
                          : <i className="fa-solid fa-circle-exclamation"></i>
                        }
                        {scanMessage.text}
                      </p>
                    )}
                  </div>
                )}
                {/* Scan Message */}

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

                  <div className="grid grid-cols-1 gap-5">
                    {/* Điện */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                      <label className="flex items-center gap-2 text-[14px] font-bold text-slate-700 mb-3">
                        <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                          <i className="fa-solid fa-bolt"></i>
                        </div>
                        Chỉ số điện ban đầu <span className="text-red-500">*</span>
                      </label>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text" // Dùng text kết hợp onlyDigits để loại bỏ 2 nút mũi tên tăng giảm vướng víu
                            value={form.electricity_reading}
                            onChange={(e) => setForm(prev => ({ ...prev, electricity_reading: onlyDigits(e.target.value) }))}
                            placeholder="Nhập số điện..."
                            className="w-full pl-3.5 pr-14 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[16px] font-bold text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand focus:bg-white transition-colors"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[13px] pointer-events-none">
                            kWh
                          </span>
                        </div>

                        <label className="sm:w-[130px] h-[48px] border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5 transition-all group relative overflow-hidden shrink-0 bg-slate-50">
                          {electricityImagePreview ? (
                            <>
                              <img src={electricityImagePreview} alt="Điện" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-[12px] font-semibold flex items-center gap-1.5">
                                  <i className="fa-solid fa-camera"></i> Đổi ảnh
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-500 group-hover:text-brand">
                              <i className="fa-solid fa-camera text-[16px]"></i>
                              <span className="text-[13px] font-semibold">Chụp ảnh</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setElectricityImage(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>

                    {/* Nước */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                      <label className="flex items-center gap-2 text-[14px] font-bold text-slate-700 mb-3">
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                          <i className="fa-solid fa-droplet"></i>
                        </div>
                        Chỉ số nước ban đầu <span className="text-red-500">*</span>
                      </label>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={form.water_reading}
                            onChange={(e) => setForm(prev => ({ ...prev, water_reading: onlyDigits(e.target.value) }))}
                            placeholder="Nhập số nước..."
                            className="w-full pl-3.5 pr-14 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[16px] font-bold text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand focus:bg-white transition-colors"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[13px] pointer-events-none">
                            Khối
                          </span>
                        </div>

                        <label className="sm:w-[130px] h-[48px] border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5 transition-all group relative overflow-hidden shrink-0 bg-slate-50">
                          {waterImagePreview ? (
                            <>
                              <img src={waterImagePreview} alt="Nước" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-[12px] font-semibold flex items-center gap-1.5">
                                  <i className="fa-solid fa-camera"></i> Đổi ảnh
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-500 group-hover:text-brand">
                              <i className="fa-solid fa-camera text-[16px]"></i>
                              <span className="text-[13px] font-semibold">Chụp ảnh</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setWaterImage(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>
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

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">4</div>
                    <h3 className="text-[15px] font-bold text-slate-800">Dịch vụ đi kèm</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="text-[12px] font-semibold text-brand bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-plus"></i> Thêm DV
                  </button>
                </div>

                {form.services.length === 0 ? (
                  <p className="text-[13px] text-slate-500 text-center py-2 italic">Chưa có dịch vụ nào. Nhấn "Thêm DV" để chọn.</p>
                ) : (
                  <div className="space-y-3">
                    {form.services.map((service, index) => (
                      <div key={index} className="grid grid-cols-12 sm:flex sm:items-center gap-2 bg-white p-2.5 sm:p-2 border border-slate-200 rounded-lg relative group">
                        <div className="col-span-12 sm:flex-1">
                          <select
                            value={service.service_type}
                            onChange={(e) => handleChangeService(index, "service_type", e.target.value)}
                            className="w-full min-w-[130px] px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[13px] outline-none focus:border-brand"
                          >
                            <option value="">Chọn dịch vụ...</option>
                            {availableServices.map((srv) => (
                              <option key={srv.id} value={srv.service_type}>
                                {srv.service_type_label || srv.service_type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-5 sm:w-[80px]">
                          <input
                            type="number"
                            min="1"
                            value={service.quantity}
                            onChange={(e) => handleChangeService(index, "quantity", e.target.value)}
                            placeholder="SL"
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[13px] outline-none focus:border-brand"
                          />
                        </div>
                        <div className="col-span-5 sm:w-[130px]">
                          <input
                            type="text"
                            value={service.custom_price}
                            onChange={(e) => handleChangeService(index, "custom_price", e.target.value)}
                            placeholder="Giá riêng..."
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[13px] outline-none focus:border-brand"
                          />
                        </div>
                        <div className="col-span-2 sm:w-[40px] flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveService(index)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

        <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 sticky bottom-0 z-20 flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-3 sm:py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[14px] font-semibold hover:bg-slate-200 transition-colors w-[100px] sm:w-auto text-center disabled:opacity-60"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-8 py-3 sm:py-2.5 bg-brand text-white rounded-xl text-[14px] font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Đang lưu...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check text-[14px]"></i>
                Lưu hợp đồng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
