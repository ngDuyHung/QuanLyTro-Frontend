import React, { useEffect, useState, useRef } from "react";
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

const getMinEndDate = (startDateStr) => {
  if (!startDateStr) return "";
  const date = new Date(startDateStr);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
};

const initialForm = {
  property_id: "",
  room_id: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  billing_day: "1",
  deposit: "0",
  room_price: "0",
  occupants_count: "",
  electricity_reading: "",
  water_reading: "",
  full_name: "",
  phone: "",
  email: "",
  id_card_number: "",
  services: [],
};

const isAvailableRoom = (room) => {
  return room.status === "available" ||
    room.status === "reserved" ||
    room.status === "empty";
};

//  COMPONENT UI OVERLAY QUÉT OCR VÀO ĐÂY
const EkycOverlay = ({ status }) => {
  if (status === "idle") return null;
  return (
    // pointer-events-none: Quan trọng để không chặn click chuột vào input file
    <div className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center transition-all duration-300
              ${status === "scanning" ? "bg-black/60 backdrop-blur-[3px]" : ""}
              ${status === "error" ? "ekyc-shake ring-4 ring-red-500 ring-inset bg-black/40" : ""}
              ${status === "success" ? "ring-4 ring-green-500 ring-inset bg-transparent" : ""}
          `}>
      {/* 4 Góc ngắm - Giảm kích thước viền lại 1 chút cho cân đối */}
      {(status === "scanning" || status === "error") && (
        <>
          <div className={`absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl ${status === 'error' ? 'border-red-500' : 'border-brand'}`}></div>
          <div className={`absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr ${status === 'error' ? 'border-red-500' : 'border-brand'}`}></div>
          <div className={`absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl ${status === 'error' ? 'border-red-500' : 'border-brand'}`}></div>
          <div className={`absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br ${status === 'error' ? 'border-red-500' : 'border-brand'}`}></div>
        </>
      )}

      {/* Tia laser chạy dọc */}
      {status === "scanning" && (
        <div className="absolute top-0 left-0 w-full h-1 bg-green-400 shadow-[0_0_15px_4px_rgba(74,222,128,0.7)] ekyc-scan-line"></div>
      )}

      {/* Trạng thái Text / Icon */}
      {status === "scanning" && (
        <div className="flex flex-col items-center justify-center">
          <i className="fa-solid fa-circle-notch fa-spin text-brand text-xl mb-1"></i>
        </div>
      )}
      {status === "success" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-[zoomIn_0.3s_ease-out]">
          <i className="fa-solid fa-check text-white text-sm"></i>
        </div>
      )}
    </div>
  );
};

export default function AddLeaseModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  properties = [],
  defaultRoom = null
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

  // --- Quản lý trạng thái quét UI CCCD ---
  const [scanStatusFront, setScanStatusFront] = useState("idle"); // idle | scanning | success | error
  const [scanStatusBack, setScanStatusBack] = useState("idle");

  // --- Quản lý trạng thái Zoom ảnh ---
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const scrollContainerRef = useRef(null);
  // 2. Lắng nghe clientError, nếu có lỗi thì cuộn lên top
  useEffect(() => {
    if (clientError && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth" // Tạo hiệu ứng cuộn mượt mà
      });
    }
  }, [clientError]);

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
      // AUTO FILL DATA NẾU CÓ TRUYỀN defaultRoom TỪ NGOÀI VÀO
      if (defaultRoom) {
        setForm(prev => ({
          ...prev,
          property_id: defaultRoom.property_id,
          room_id: defaultRoom.id,
          room_price: formatMoneyInput(defaultRoom.current_price),
          deposit: formatMoneyInput(defaultRoom.deposit_amount),
          billing_day: defaultRoom.billing_day || "1",
          start_date: defaultRoom.pending_reservation?.expected_move_in_date || new Date().toISOString().slice(0, 10),
          full_name: defaultRoom.pending_reservation?.tenant_name || "",
          phone: defaultRoom.pending_reservation?.tenant_phone || "",
        }));
      }
    } else {
      document.body.style.overflow = "";
      setForm(initialForm);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, defaultRoom]);


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
    setScanStatusFront("idle");
    setScanStatusBack("idle");
  };

  // 2. THÊM useEffect này để tự động dọn dẹp data mỗi khi modal đóng
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // useEffect để reset trạng thái eKYC
  useEffect(() => {
    if (scanStatusFront === "success" || scanStatusFront === "error") {
      const timer = setTimeout(() => setScanStatusFront("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [scanStatusFront]);

  useEffect(() => {
    if (scanStatusBack === "success" || scanStatusBack === "error") {
      const timer = setTimeout(() => setScanStatusBack("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [scanStatusBack]);

  if (!open) return null;



  const handleScanCCCD = async (file) => {
    if (!file) return;

    setScanStatusFront("scanning");
    setScanStatusBack("scanning");

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
          setScanStatusFront("success");
          setScanStatusBack("success");
        }
      }
    } catch (error) {
      // Lấy câu message lỗi từ backend trả về (hoặc dùng câu mặc định)
      const errorMsg = error.response?.data?.message || "Không đọc được CCCD, vui lòng nhập tay.";
      setScanMessage({ type: "error", text: errorMsg });
      setScanStatusFront("error");
      setScanStatusBack("error");
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

    if (!form.occupants_count || Number(form.occupants_count) < 1) {
      setClientError("Vui lòng nhập số lượng người ở hợp lệ (tối thiểu 1).");
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

    if (!form.electricity_reading.trim() || Number(form.electricity_reading) < 0) {
      setClientError("Vui lòng nhập chỉ số điện hợp lệ (tối thiểu 0).");
      return;
    }
    if (!form.water_reading.trim() || Number(form.water_reading) < 0) {
      setClientError("Vui lòng nhập chỉ số nước hợp lệ (tối thiểu 0).");
      return;
    }

    // Kiểm tra thời hạn hợp đồng tối thiểu 1 tháng
    if (form.end_date) {
      const minEndDate = new Date(getMinEndDate(form.start_date));
      const selectedEndDate = new Date(form.end_date);

      // Reset giờ phút giây về 0 để so sánh chính xác ngày
      minEndDate.setHours(0, 0, 0, 0);
      selectedEndDate.setHours(0, 0, 0, 0);

      if (selectedEndDate < minEndDate) {
        setClientError("Thời hạn hợp đồng phải tối thiểu là 1 tháng.");
        return;
      }
    }
    const payload = new FormData();

    payload.append("room_id", form.room_id);
    payload.append("start_date", form.start_date);
    payload.append("end_date", form.end_date);
    payload.append("billing_day", form.billing_day || "1");
    payload.append("deposit", onlyDigits(form.deposit) || "0");
    payload.append("room_price", onlyDigits(form.room_price) || "0");
    payload.append("occupants_count", form.occupants_count || "1");
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
      /* THÊM HIỆU ỨNG QUÉT OCR VÀO ĐÂY */
    @keyframes ekycScan {
        0% { top: 5%; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: 95%; opacity: 0; }
    }
    @keyframes ekycShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        50% { transform: translateX(4px); }
        75% { transform: translateX(-4px); }
    }
    .ekyc-scan-line { animation: ekycScan 2s linear infinite; }
    .ekyc-shake { animation: ekycShake 0.4s ease-in-out; }
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

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar bg-white">
          <div className="px-4 py-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
            <div className="lg:col-span-7 flex flex-col gap-8">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">1</div>
                  <h3 className="text-[15px] font-bold text-slate-800">
                    Thông tin phòng & hợp đồng
                  </h3>
                </div>

                {/* --- BẮT ĐẦU KHỐI THÔNG BÁO LỖI --- */}
                {clientError && (
                  <div className="mb-5 bg-red-50 border-l-[4px] border-red-500 rounded-r-xl p-3.5 sm:p-4 shadow-sm flex items-start gap-3 animate-[fadeIn_0.3s_ease-out]">
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
                    {/* Nút tắt nhanh thông báo lỗi (Tùy chọn) */}
                    <button
                      onClick={() => setClientError("")}
                      className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
                    >
                      <i className="fa-solid fa-xmark text-[13px]"></i>
                    </button>
                  </div>
                )}
                {/* --- KẾT THÚC KHỐI THÔNG BÁO LỖI --- */}


                <div className="flex flex-col gap-4">

                  {/* HÀNG 1: Khu nhà & Phòng (Mobile 1 cột, PC 2 cột) */}
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
                          setForm((prev) => ({ ...prev, property_id: event.target.value, room_id: "" }));
                        }}
                        className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
                      >
                        <option value="">Chọn khu nhà</option>
                        {properties.map((property) => (
                          <option key={property.id} value={property.id}>{property.name}</option>
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
                        className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all disabled:opacity-60 disabled:bg-slate-100"
                      >
                        <option value="">
                          {isLoadingRooms ? "Đang tải phòng..." : form.property_id ? "Chọn phòng trống" : "Chọn khu nhà trước"}
                        </option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name} {room.current_price ? ` - ${Number(room.current_price).toLocaleString("vi-VN")}đ/th` : ""}
                          </option>
                        ))}
                      </select>
                      {roomNotice && <p className="mt-1.5 text-[12px] text-orange-600">{roomNotice}</p>}
                    </div>
                  </div>

                  {/* HÀNG 2: Ngày tháng (Luôn 2 cột trên Mobile) */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                        Ngày bắt đầu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.start_date}
                        onChange={handleChange("start_date")}
                        className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                        Kết thúc <span className="text-slate-400 font-normal hidden sm:inline">(tùy chọn)</span>
                      </label>
                      <input
                        type="date"
                        value={form.end_date}
                        onChange={handleChange("end_date")}
                        min={form.start_date}
                        className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  {/* HÀNG 3: Tiền bạc (Luôn 2 cột + Thêm hậu tố "đ") */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Giá phòng</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.room_price}
                          onChange={(e) => setForm(prev => ({ ...prev, room_price: formatMoneyInput(e.target.value) }))}
                          placeholder="0" inputMode="numeric"
                          className="w-full pl-3.5 pr-8 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] font-semibold text-brand outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none">đ</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Thế chân</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.deposit}
                          onChange={(e) => setForm(prev => ({ ...prev, deposit: formatMoneyInput(e.target.value) }))}
                          placeholder="0" inputMode="numeric"
                          className="w-full pl-3.5 pr-8 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] font-semibold text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium pointer-events-none">đ</span>
                      </div>
                    </div>
                  </div>

                  {/* HÀNG 4: Ngày thu & Người ở (Luôn 2 cột) */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Thu tiền (ngày)</label>
                      <input
                        type="number" min="1" max="28" inputMode="numeric"
                        value={form.billing_day}
                        onChange={handleChange("billing_day")}
                        className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                        Số người <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number" min="1" inputMode="numeric"
                        value={form.occupants_count}
                        onChange={handleChange("occupants_count")}
                        placeholder="VD: 2"
                        className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
                      />
                    </div>
                  </div>

                  {/* Bảng nhắc nhở giữ nguyên */}
                  <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-[13px] flex items-start gap-3 mt-1">
                    <i className="fa-solid fa-circle-info text-blue-500 mt-0.5 shrink-0"></i>
                    <p>Chú ý điền đúng số lượng người đang ở để tính hóa đơn chính xác.</p>
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

                {/* ---  KHỐI CCCD --- */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">

                  {/* === Mặt trước CCCD === */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all min-h-[130px] sm:min-h-[170px] relative bg-slate-50 hover:bg-brand/5 hover:border-brand group">
                    <p className="text-[12px] sm:text-[13px] font-semibold text-slate-700 mb-2 relative z-10 w-full text-center">
                      Mặt trước CCCD
                    </p>

                    {frontImagePreview ? (
                      // KHI CÓ ẢNH (Thu nhỏ chiều cao trên mobile h-[70px])
                      <div className="relative w-full h-[70px] sm:h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-black mb-1.5 shadow-inner">
                        <img
                          src={frontImagePreview}
                          alt="Mặt trước CCCD"
                          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                          onClick={() => setFullScreenImage(frontImagePreview)}
                        />
                        <EkycOverlay status={scanStatusFront} />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setFrontImage(null);
                            setScanStatusFront("idle");
                          }}
                          className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-red-500 flex items-center justify-center backdrop-blur-sm transition-colors shadow-md z-20"
                        >
                          <i className="fa-solid fa-xmark text-[11px]"></i>
                        </button>
                      </div>
                    ) : (
                      // KHI CHƯA CÓ ẢNH
                      <label className="w-full h-[70px] sm:h-[110px] flex flex-col items-center justify-center cursor-pointer mb-1.5 relative z-10">
                        <div className="w-10 h-8 sm:w-12 sm:h-10 border border-slate-300 bg-white rounded flex items-center justify-center text-slate-400 mb-1.5 group-hover:border-brand group-hover:text-brand transition-colors shadow-sm">
                          <i className="fa-regular fa-address-card text-lg sm:text-xl"></i>
                        </div>
                        <span className="text-[11px] sm:text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center line-clamp-1 max-w-full">
                          <span className="hidden sm:inline">Chụp hoặc tải ảnh lên</span>
                          <span className="sm:hidden">Tải ảnh lên</span>
                        </span>
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              setFrontImage(file);
                              setScanStatusFront("idle");
                              handleScanCCCD(file);
                            }
                          }}
                        />
                      </label>
                    )}

                    {frontImage && (
                      <span className="text-[10px] sm:text-[12px] text-slate-500 text-center line-clamp-1 max-w-full relative z-10 mt-0.5 w-full block px-1">
                        {frontImage.name}
                      </span>
                    )}
                  </div>

                  {/* === Mặt sau CCCD === */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all min-h-[130px] sm:min-h-[170px] relative bg-slate-50 hover:bg-brand/5 hover:border-brand group">
                    <p className="text-[12px] sm:text-[13px] font-semibold text-slate-700 mb-2 relative z-10 w-full text-center">
                      Mặt sau CCCD
                    </p>

                    {backImagePreview ? (
                      <div className="relative w-full h-[70px] sm:h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-black mb-1.5 shadow-inner">
                        <img
                          src={backImagePreview}
                          alt="Mặt sau CCCD"
                          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                          onClick={() => setFullScreenImage(backImagePreview)}
                        />
                        <EkycOverlay status={scanStatusBack} />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setBackImage(null);
                            setScanStatusBack("idle");
                          }}
                          className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-red-500 flex items-center justify-center backdrop-blur-sm transition-colors shadow-md z-20"
                        >
                          <i className="fa-solid fa-xmark text-[11px]"></i>
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-[70px] sm:h-[110px] flex flex-col items-center justify-center cursor-pointer mb-1.5 relative z-10">
                        <div className="w-10 h-8 sm:w-12 sm:h-10 border border-slate-300 bg-white rounded flex items-center justify-center text-slate-400 mb-1.5 group-hover:border-brand group-hover:text-brand transition-colors shadow-sm">
                          <i className="fa-regular fa-address-card text-lg sm:text-xl"></i>
                        </div>
                        <span className="text-[11px] sm:text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center line-clamp-1 max-w-full">
                          <span className="hidden sm:inline">Chụp hoặc tải ảnh lên</span>
                          <span className="sm:hidden">Tải ảnh lên</span>
                        </span>
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              setBackImage(file);
                              setScanStatusBack("idle");
                            }
                          }}
                        />
                      </label>
                    )}

                    {backImage && (
                      <span className="text-[10px] sm:text-[12px] text-slate-500 text-center line-clamp-1 max-w-full relative z-10 mt-0.5 w-full block px-1">
                        {backImage.name}
                      </span>
                    )}
                  </div>

                </div>
                {/* --- KẾT THÚC KHỐI CCCD --- */}

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
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
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
                      inputMode="numeric"
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
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
                      inputMode="numeric"
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
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
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[14px] sm:text-[13px] text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
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

                {/* --- BẮT ĐẦU KHỐI CHỈ SỐ ĐIỆN/NƯỚC --- */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 gap-5">

                    {/* === Chỉ số Điện === */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                      <label className="flex items-center gap-2 text-[14px] font-bold text-slate-700 mb-3">
                        <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                          <i className="fa-solid fa-bolt"></i>
                        </div>
                        Chỉ số điện ban đầu <span className="text-red-500">*</span>
                      </label>

                      {/* Flex row cho cả Mobile và PC */}
                      <div className="flex flex-row gap-2.5 sm:gap-3">

                        {/* Ô nhập số (Căn trái) */}
                        <div className="relative flex-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={form.electricity_reading}
                            onChange={(e) => setForm(prev => ({ ...prev, electricity_reading: onlyDigits(e.target.value) }))}
                            placeholder="Nhập số điện..."
                            required
                            className="w-full pl-3.5 pr-12 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[15px] sm:text-[16px] font-bold text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[12px] sm:text-[13px] pointer-events-none">
                            kWh
                          </span>
                        </div>

                        {/* Nút chụp ảnh (Căn phải) */}
                        <label className="w-[85px] sm:w-[130px] h-[48px] sm:h-[48px] border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5 transition-all group relative overflow-hidden shrink-0 bg-slate-50">
                          {electricityImagePreview ? (
                            <>
                              <img src={electricityImagePreview} alt="Điện" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-[11px] sm:text-[12px] font-semibold flex items-center gap-1">
                                  <i className="fa-solid fa-camera"></i> <span className="hidden sm:inline">Đổi ảnh</span>
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-brand">
                              <i className="fa-solid fa-camera text-[15px] sm:text-[16px]"></i>
                              <span className="text-[12px] sm:text-[13px] font-semibold hidden sm:inline">Chụp ảnh</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setElectricityImage(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>

                    {/* === Chỉ số Nước === */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                      <label className="flex items-center gap-2 text-[14px] font-bold text-slate-700 mb-3">
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                          <i className="fa-solid fa-droplet"></i>
                        </div>
                        Chỉ số nước ban đầu <span className="text-red-500">*</span>
                      </label>

                      {/* Flex row cho cả Mobile và PC */}
                      <div className="flex flex-row gap-2.5 sm:gap-3">

                        {/* Ô nhập số (Căn trái) */}
                        <div className="relative flex-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={form.water_reading}
                            onChange={(e) => setForm(prev => ({ ...prev, water_reading: onlyDigits(e.target.value) }))}
                            placeholder="Nhập số nước..."
                            required
                            className="w-full pl-3.5 pr-12 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[15px] sm:text-[16px] font-bold text-slate-800 outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand hover:border-slate-300 transition-all"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[12px] sm:text-[13px] pointer-events-none">
                            Khối
                          </span>
                        </div>

                        {/* Nút chụp ảnh (Căn phải) */}
                        <label className="w-[85px] sm:w-[130px] h-[48px] sm:h-[48px] border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5 transition-all group relative overflow-hidden shrink-0 bg-slate-50">
                          {waterImagePreview ? (
                            <>
                              <img src={waterImagePreview} alt="Nước" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-[11px] sm:text-[12px] font-semibold flex items-center gap-1">
                                  <i className="fa-solid fa-camera"></i> <span className="hidden sm:inline">Đổi ảnh</span>
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-brand">
                              <i className="fa-solid fa-camera text-[15px] sm:text-[16px]"></i>
                              <span className="text-[12px] sm:text-[13px] font-semibold hidden sm:inline">Chụp ảnh</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setWaterImage(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>

                  </div>
                  {/* --- KẾT THÚC KHỐI CHỈ SỐ ĐIỆN/NƯỚC --- */}
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

      {/* GIAO DIỆN ZOOM ẢNH TOÀN MÀN HÌNH */}
      {
        fullScreenImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10 cursor-zoom-out animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setFullScreenImage(null)}
          >
            <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-white text-3xl sm:text-4xl transition-colors w-12 h-12 flex items-center justify-center bg-black/50 rounded-full">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <img
              src={fullScreenImage}
              alt="Phóng to CCCD"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-[zoomIn_0.2s_ease-out]"
            />
          </div>
        )
      }
    </div >
  );
}
