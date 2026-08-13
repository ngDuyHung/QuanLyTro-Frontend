import React, { useState, useEffect } from "react";
import roomService from "@/services/roomService";
import ocrService from "@/services/ocrService";

const initialForm = {
    full_name: "",
    phone: "",
    email: "",
    id_card_number: "",
    property_id: "",
    room_id: "",
    move_in_date: new Date().toISOString().slice(0, 10),
    note: "",
};

const hasActiveLease = (room) => {
    return Boolean(
        room.has_active_lease ||
        room.active_lease ||
        room.activeLease ||
        room.current_lease ||
        room.currentLease ||
        room.active_lease_id ||
        room.lease_id ||
        room.status === "occupied"
    );
};

const getRoomActiveLeaseText = (room) => {
    const lease =
        room.active_lease ||
        room.activeLease ||
        room.current_lease ||
        room.currentLease ||
        null;

    const tenantName =
        lease?.tenant?.full_name ||
        lease?.tenant_name ||
        room.tenant_name ||
        room.current_tenant_name ||
        "";

    if (tenantName) {
        return `Đang thuê - ${tenantName}`;
    }

    return "Đang có hợp đồng";
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

export default function AddTenantModal({
    open,
    onClose,
    onSubmit,
    isSubmitting = false,
    properties = [],
}) {
    const [form, setForm] = useState(initialForm);
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const frontImagePreview = frontImage ? URL.createObjectURL(frontImage) : null;
    const backImagePreview = backImage ? URL.createObjectURL(backImage) : null;
    const [clientError, setClientError] = useState("");

    // --- QUẢN LÝ QUÉT CCCD ---
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState({ type: "", text: "" });
    // ---
    const [rooms, setRooms] = useState([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [roomNotice, setRoomNotice] = useState("");

    // --- Quản lý trạng thái quét UI CCCD ---
    const [scanStatusFront, setScanStatusFront] = useState("idle"); // idle | scanning | success | error
    const [scanStatusBack, setScanStatusBack] = useState("idle");

    // --- Quản lý trạng thái Zoom ảnh ---
    const [fullScreenImage, setFullScreenImage] = useState(null);

    useEffect(() => {
        return () => {
            if (frontImagePreview) URL.revokeObjectURL(frontImagePreview);
            if (backImagePreview) URL.revokeObjectURL(backImagePreview);
        };
    }, [frontImagePreview, backImagePreview]);

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
        if (!open || !form.property_id) {
            setRooms([]);
            setRoomNotice("");
            return;
        }

        const fetchRooms = async () => {
            try {
                setIsLoadingRooms(true);
                setRoomNotice("");

                const response = await roomService.getActiveLeaseRoomsByProperty(
                    form.property_id,
                    { per_page: 100 }
                );

                const allRooms = response.data.data || [];
                const activeLeaseRooms = allRooms.filter(hasActiveLease);

                setRooms(activeLeaseRooms);

                if (activeLeaseRooms.length === 0) {
                    setRoomNotice(
                        "Khu nhà này chưa có phòng nào đang có hợp đồng hiệu lực. Vui lòng tạo hợp đồng trước khi thêm khách thuê."
                    );
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

    // Tự động reset trạng thái eKYC sau 3 giây
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
        setScanMessage({ type: "", text: "" });

        const payload = new FormData();
        payload.append("image", file);

        try {
            const response = await ocrService.scanIdCard(payload);
            const result = response.data;

            if (result.data) {
                setForm((prev) => ({
                    ...prev,
                    full_name: result.data.full_name || prev.full_name,
                    id_card_number: result.data.id_card_number || prev.id_card_number,
                }));
                setScanMessage({ type: "success", text: result.message || "Trích xuất thông tin thành công!" });
                setScanStatusFront("success");
                setScanStatusBack("success");
            }
        } catch (error) {
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
        setRoomNotice("");
        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
            ...(field === "property_id" ? { room_id: "" } : {}),
        }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setFrontImage(null);
        setBackImage(null);
        setClientError("");
        setScanMessage({ type: "", text: "" });
        setRoomNotice("");
        setRooms([]);
        setScanStatusFront("idle");
        setScanStatusBack("idle");
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetForm();
        onClose?.();
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!form.full_name.trim()) return setClientError("Vui lòng nhập họ và tên khách thuê.");
        if (!form.phone.trim()) return setClientError("Vui lòng nhập số điện thoại.");
        if (!form.id_card_number.trim()) return setClientError("Vui lòng nhập số CCCD/CMND.");
        if (!form.property_id) return setClientError("Vui lòng chọn khu nhà.");
        if (!form.room_id) return setClientError("Vui lòng chọn phòng.");

        const payload = new FormData();
        payload.append("full_name", form.full_name.trim());
        payload.append("phone", form.phone.trim());
        payload.append("id_card_number", form.id_card_number.trim());
        if (form.email.trim()) payload.append("email", form.email.trim());
        payload.append("room_id", form.room_id);
        payload.append("role", "member");
        if (form.move_in_date) payload.append("move_in_date", form.move_in_date);
        if (form.note.trim()) payload.append("note", form.note.trim());
        if (frontImage) payload.append("id_card_front_image", frontImage);
        if (backImage) payload.append("id_card_back_image", backImage);

        onSubmit(payload);
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
            `}</style>

            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
                <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-h-[95vh] max-w-[980px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] relative">

                    {/* Header (Sticky Top) */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                                <i className="fa-solid fa-user-plus text-[18px]"></i>
                            </div>
                            <div>
                                <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800 leading-tight">
                                    Thêm khách thuê mới
                                </h2>
                                <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                                    Khách được thêm vào phòng với vai trò mặc định là người ở ghép.
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

                    {/* Body (Scrollable) */}
                    <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* CỘT TRÁI */}
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

                                    <div className="bg-green-50/50 border border-green-100 text-green-700 px-4 py-3 rounded-xl sm:rounded-lg text-[13px] flex items-start gap-3 mb-5">
                                        <i className="fa-solid fa-wand-magic-sparkles mt-0.5 text-green-500"></i>
                                        <p>Sau khi tải ảnh lên, hệ thống sẽ tự động trích xuất thông tin từ CCCD.</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        {/* Mặt trước CCCD */}
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center transition-all min-h-[170px] relative bg-white">
                                            <p className="text-[13px] font-semibold text-slate-700 mb-3 relative z-10 w-full text-center">
                                                Mặt trước CCCD
                                            </p>

                                            {frontImagePreview ? (
                                                // KHI CÓ ẢNH
                                                <div className="relative w-full h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-black mb-2 shadow-inner">

                                                    {/* LỚP 1: ẢNH NỀN (Nhấp vào để zoom) */}
                                                    <img
                                                        src={frontImagePreview}
                                                        alt="Mặt trước CCCD"
                                                        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                                                        onClick={() => setFullScreenImage(frontImagePreview)}
                                                    />

                                                    {/* LỚP 2: OVERLAY QUÉT (Nằm đè lên ảnh) */}
                                                    <EkycOverlay status={scanStatusFront} />

                                                    {/* LỚP 3: NÚT XÓA ẢNH (Nằm trên cùng) */}
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setFrontImage(null);
                                                            setScanStatusFront("idle");
                                                        }}
                                                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-red-500 flex items-center justify-center backdrop-blur-sm transition-colors shadow-md z-20"
                                                    >
                                                        <i className="fa-solid fa-xmark text-[11px]"></i>
                                                    </button>
                                                </div>
                                            ) : (
                                                // KHI CHƯA CÓ ẢNH
                                                <label className="w-full h-[110px] flex flex-col items-center justify-center cursor-pointer mb-2 group-hover:border-brand transition-colors">
                                                    <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative z-10">
                                                        <i className="fa-regular fa-address-card text-xl"></i>
                                                    </div>
                                                    <span className="text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center line-clamp-1 max-w-full relative z-10">
                                                        Chụp hoặc tải ảnh lên
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
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

                                            {/* Tên file */}
                                            {frontImage && (
                                                <span className="text-[12px] text-slate-500 text-center line-clamp-1 max-w-full relative z-10 mt-1 w-full block">
                                                    {frontImage.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Mặt sau CCCD */}
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center transition-all min-h-[170px] relative bg-white">
                                            <p className="text-[13px] font-semibold text-slate-700 mb-3 relative z-10 w-full text-center">
                                                Mặt sau CCCD
                                            </p>

                                            {backImagePreview ? (
                                                <div className="relative w-full h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-black mb-2 shadow-inner">

                                                    {/* LỚP 1: ẢNH NỀN (Nhấp vào để zoom) */}
                                                    <img
                                                        src={backImagePreview}
                                                        alt="Mặt sau CCCD"
                                                        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                                                        onClick={() => setFullScreenImage(backImagePreview)}
                                                    />

                                                    {/* LỚP 2: OVERLAY QUÉT (Nằm đè lên ảnh) */}
                                                    <EkycOverlay status={scanStatusBack} />

                                                    {/* LỚP 3: NÚT XÓA ẢNH (Nằm trên cùng) */}
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setBackImage(null);
                                                            setScanStatusBack("idle");
                                                        }}
                                                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-red-500 flex items-center justify-center backdrop-blur-sm transition-colors shadow-md z-20"
                                                    >
                                                        <i className="fa-solid fa-xmark text-[11px]"></i>
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="w-full h-[110px] flex flex-col items-center justify-center cursor-pointer mb-2 group-hover:border-brand transition-colors">
                                                    <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative z-10">
                                                        <i className="fa-regular fa-address-card text-xl"></i>
                                                    </div>
                                                    <span className="text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center line-clamp-1 max-w-full relative z-10">
                                                        Chụp hoặc tải ảnh lên
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
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

                                            {/* Tên file */}
                                            {backImage && (
                                                <span className="text-[12px] text-slate-500 text-center line-clamp-1 max-w-full relative z-10 mt-1 w-full block">
                                                    {backImage.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {(isScanning || scanMessage.text) && (
                                        <div className="mb-4">
                                            {isScanning && (
                                                <p className="text-[13px] text-brand font-medium flex items-center gap-2">
                                                    <i className="fa-solid fa-spinner animate-spin"></i> Đang trích xuất dữ liệu...
                                                </p>
                                            )}
                                            {!isScanning && scanMessage.text && (
                                                <p className={`text-[13px] font-medium flex items-center gap-2 ${scanMessage.type === "success" ? "text-green-600" : "text-orange-500"}`}>
                                                    {scanMessage.type === "success" ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-circle-exclamation"></i>}
                                                    {scanMessage.text}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={form.full_name}
                                                onChange={handleChange("full_name")}
                                                placeholder="Nhập họ và tên"
                                                className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={form.phone}
                                                onChange={handleChange("phone")}
                                                placeholder="Nhập số điện thoại"
                                                className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Số CCCD/CMND <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={form.id_card_number}
                                                onChange={handleChange("id_card_number")}
                                                placeholder="Nhập số CCCD/CMND"
                                                className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email <span className="text-slate-400 font-normal">(tùy chọn)</span></label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={handleChange("email")}
                                                placeholder="VD: khachthue@gmail.com"
                                                className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px w-full bg-slate-100 hidden lg:block"></div>

                                {/* 2. Thông tin lưu trú */}
                                <div>
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                                            2
                                        </div>
                                        <h3 className="text-[15px] font-bold text-slate-800">
                                            Gắn vào phòng
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Khu nhà <span className="text-red-500">*</span></label>
                                            <select
                                                value={form.property_id}
                                                onChange={handleChange("property_id")}
                                                className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] outline-none focus:border-brand"
                                            >
                                                <option value="">Chọn khu nhà</option>
                                                {properties.map((property) => (
                                                    <option key={property.id} value={property.id}>{property.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Phòng <span className="text-red-500">*</span></label>
                                            <select
                                                value={form.room_id}
                                                onChange={handleChange("room_id")}
                                                disabled={!form.property_id || isLoadingRooms}
                                                className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] outline-none focus:border-brand disabled:bg-slate-50 disabled:text-slate-400"
                                            >
                                                <option value="">
                                                    {isLoadingRooms ? "Đang tải phòng..." : form.property_id ? "Chọn phòng" : "Chọn khu nhà trước"}
                                                </option>
                                                {rooms.map((room) => (
                                                    <option key={room.id} value={room.id}>{room.name} - {getRoomActiveLeaseText(room)}</option>
                                                ))}
                                            </select>
                                            {roomNotice && <p className="mt-1.5 text-[12px] text-orange-600 leading-relaxed">{roomNotice}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Ngày vào ở</label>
                                            <input
                                                type="date"
                                                value={form.move_in_date}
                                                onChange={handleChange("move_in_date")}
                                                className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                            />
                                        </div>

                                        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl sm:rounded-lg text-[13px] flex items-start gap-3">
                                            <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                                            <div>
                                                <p>Khách thuê sẽ được thêm vào phòng với vai trò <b>người ở ghép</b>.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CỘT PHẢI */}
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

                                    <div className="bg-white border border-green-100 shadow-sm p-4 rounded-xl text-[13px] text-slate-700">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                                <i className="fa-solid fa-user-check"></i>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 mb-1">Tài khoản tự động</p>
                                                <p className="text-slate-500 leading-relaxed">
                                                    Hệ thống sẽ tự động cấp tài khoản đăng nhập (App Khách Thuê) cho người ở ghép. Tên đăng nhập và Mật khẩu mặc định là <span className="font-bold text-slate-700">Số điện thoại</span>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 bg-orange-50 border border-orange-100 p-3.5 rounded-xl text-[13px] text-orange-800 flex items-start gap-3">
                                        <i className="fa-solid fa-circle-exclamation mt-0.5 text-orange-500 shrink-0"></i>
                                        <div className="leading-relaxed">
                                            <p className="font-semibold mb-0.5">Chuyển thành đại diện ở chức năng riêng.</p>
                                            <p>Hệ thống mới xử lý tài khoản đăng nhập cho người thuê khi làm hợp đồng.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                                            4
                                        </div>
                                        <h3 className="text-[14px] font-bold text-slate-800">
                                            Ghi chú <span className="text-slate-400 font-normal text-[12px]">(tùy chọn)</span>
                                        </h3>
                                    </div>

                                    <div className="relative">
                                        <textarea
                                            value={form.note}
                                            onChange={handleChange("note")}
                                            maxLength={300}
                                            placeholder="Nhập ghi chú thêm về khách thuê..."
                                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] sm:text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none min-h-[140px]"
                                        ></textarea>
                                        <span className="absolute bottom-3 right-3 text-[11px] text-slate-400">
                                            {form.note.length}/300
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer (Sticky Bottom) */}
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
                            type="button"
                            onClick={handleSubmit}
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
                                    <i className="fa-solid fa-check text-[14px] sm:hidden"></i>
                                    <span className="hidden sm:inline">Lưu khách thuê</span>
                                    <span className="sm:hidden">Tạo mới</span>
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
            </div>
        </>
    );
}