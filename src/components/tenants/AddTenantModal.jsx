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

    if (!open) return null;

    const handleScanCCCD = async (file) => {
        if (!file) return;

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
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Không đọc được CCCD, vui lòng nhập tay.";
            setScanMessage({ type: "error", text: errorMsg });
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
                                        <label className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50/30 transition-all group min-h-[170px] overflow-hidden">
                                            <p className="text-[13px] font-semibold text-slate-700 mb-3 group-hover:text-brand transition-colors">
                                                Mặt trước CCCD
                                            </p>

                                            {frontImagePreview ? (
                                                <div className="relative w-full h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mb-2">
                                                    <img src={frontImagePreview} alt="Mặt trước CCCD" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFrontImage(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white flex items-center justify-center shadow-sm"><i className="fa-solid fa-xmark text-[12px]"></i></button>
                                                </div>
                                            ) : (
                                                <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative">
                                                    <i className="fa-regular fa-address-card text-xl"></i>
                                                    <i className="fa-solid fa-user absolute text-[10px] right-2 bottom-2"></i>
                                                </div>
                                            )}
                                            <span className="text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center line-clamp-1">{frontImage ? frontImage.name : "Chụp hoặc tải ảnh lên"}</span>
                                            <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] || null; setFrontImage(file); handleScanCCCD(file); }} className="hidden" />
                                        </label>

                                        <label className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50/30 transition-all group min-h-[170px] overflow-hidden">
                                            <p className="text-[13px] font-semibold text-slate-700 mb-3 group-hover:text-brand transition-colors">
                                                Mặt sau CCCD
                                            </p>

                                            {backImagePreview ? (
                                                <div className="relative w-full h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mb-2">
                                                    <img src={backImagePreview} alt="Mặt sau CCCD" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBackImage(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white flex items-center justify-center shadow-sm"><i className="fa-solid fa-xmark text-[12px]"></i></button>
                                                </div>
                                            ) : (
                                                <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative">
                                                    <i className="fa-regular fa-address-card text-xl"></i>
                                                    <i className="fa-solid fa-qrcode absolute text-[10px] right-2 bottom-2"></i>
                                                </div>
                                            )}
                                            <span className="text-[12px] text-slate-500 group-hover:text-brand transition-colors text-center line-clamp-1">{backImage ? backImage.name : "Chụp hoặc tải ảnh lên"}</span>
                                            <input type="file" accept="image/*" onChange={(e) => setBackImage(e.target.files?.[0] || null)} className="hidden" />
                                        </label>
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

                                    <div className="bg-white border border-blue-100 shadow-sm p-4 rounded-xl text-[13px] text-slate-700">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <i className="fa-solid fa-user-group"></i>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 mb-1">Mặc định: Người ở ghép</p>
                                                <p className="text-slate-500 leading-relaxed">
                                                    Chức năng này chỉ dùng để thêm hồ sơ khách thuê. Khách không được cấp tài khoản đăng nhập ở bước này.
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
            </div>
        </>
    );
}