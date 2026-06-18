import React, { useState, useEffect } from "react";
import roomService from "@/services/roomService";

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

                const response = await roomService.getActiveLeaseRoomsByProperty(
                    form.property_id,
                    {
                        per_page: 100,
                    }
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

    const handleChange = (field) => (event) => {
        setClientError("");

        setRoomNotice("");

        setForm((prev) => ({
            ...prev,
            property_id: event.target.value,
            room_id: "",
        }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setFrontImage(null);
        setBackImage(null);
        setClientError("");
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

        if (!form.property_id) {
            setClientError("Vui lòng chọn khu nhà.");
            return;
        }

        if (!form.room_id) {
            setClientError("Vui lòng chọn phòng.");
            return;
        }

        const payload = new FormData();

        payload.append("full_name", form.full_name.trim());
        payload.append("phone", form.phone.trim());
        payload.append("id_card_number", form.id_card_number.trim());

        if (form.email.trim()) {
            payload.append("email", form.email.trim());
        }

        payload.append("room_id", form.room_id);

        // Nghiệp vụ hiện tại: thêm từ danh mục khách thuê mặc định là người ở ghép
        payload.append("role", "member");

        if (form.move_in_date) {
            payload.append("move_in_date", form.move_in_date);
        }

        if (form.note.trim()) {
            payload.append("note", form.note.trim());
        }

        if (frontImage) {
            payload.append("id_card_front_image", frontImage);
        }

        if (backImage) {
            payload.append("id_card_back_image", backImage);
        }

        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[980px] flex flex-col h-[95vh] sm:h-auto sm:max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
                    <div>
                        <h2 className="text-[18px] font-bold text-slate-800">
                            Thêm khách thuê mới
                        </h2>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                            Khách được thêm vào phòng với vai trò mặc định là người ở ghép.
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

                                <div className="bg-green-50/50 border border-green-100 text-green-700 px-4 py-3 rounded-lg text-[13px] flex items-start gap-3 mb-5">
                                    <i className="fa-solid fa-wand-magic-sparkles mt-0.5 text-green-500"></i>
                                    <p>
                                        Sau khi tải ảnh lên, hệ thống sẽ tự động trích xuất thông tin từ CCCD.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <label className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50/30 transition-all group min-h-[170px] overflow-hidden">
                                        <p className="text-[13px] font-semibold text-slate-700 mb-3 group-hover:text-brand transition-colors">
                                            Mặt trước CCCD
                                        </p>

                                        {frontImagePreview ? (
                                            <div className="relative w-full h-[110px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mb-2">
                                                <img
                                                    src={frontImagePreview}
                                                    alt="Mặt trước CCCD"
                                                    className="w-full h-full object-cover"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        setFrontImage(null);
                                                    }}
                                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white flex items-center justify-center shadow-sm"
                                                    title="Xóa ảnh"
                                                >
                                                    <i className="fa-solid fa-xmark text-[12px]"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative">
                                                <i className="fa-regular fa-address-card text-xl"></i>
                                                <i className="fa-solid fa-user absolute text-[10px] right-2 bottom-2"></i>
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
                                                <img
                                                    src={backImagePreview}
                                                    alt="Mặt sau CCCD"
                                                    className="w-full h-full object-cover"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        setBackImage(null);
                                                    }}
                                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white flex items-center justify-center shadow-sm"
                                                    title="Xóa ảnh"
                                                >
                                                    <i className="fa-solid fa-xmark text-[12px]"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-10 border border-slate-300 rounded flex items-center justify-center text-slate-400 mb-2 group-hover:border-brand group-hover:text-brand transition-colors relative">
                                                <i className="fa-regular fa-address-card text-xl"></i>
                                                <i className="fa-solid fa-qrcode absolute text-[10px] right-2 bottom-2"></i>
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
                                        Gắn vào phòng
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                            Khu nhà <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={form.property_id}
                                            onChange={(event) => {
                                                setClientError("");
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
                                            Phòng <span className="text-red-500">*</span>
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
                                                        ? "Chọn phòng"
                                                        : "Chọn khu nhà trước"}
                                            </option>

                                            {rooms.map((room) => (
                                                <option key={room.id} value={room.id}>
                                                    {room.name} - {getRoomActiveLeaseText(room)}
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
                                            Ngày vào ở
                                        </label>
                                        <input
                                            type="date"
                                            value={form.move_in_date}
                                            onChange={handleChange("move_in_date")}
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                        />
                                    </div>

                                    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-[13px] flex items-start gap-3">
                                        <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                                        <p>
                                            Khách thuê sẽ được thêm vào phòng với vai trò{" "}
                                            <b>người ở ghép</b>.
                                            <p>
                                                Chỉ hiển thị các phòng đang có hợp đồng hiệu lực. Khách thuê sẽ được
                                                thêm vào phòng với vai trò <b>người ở ghép</b>.
                                            </p>
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
                                                Mặc định: Người ở ghép
                                            </p>
                                            <p className="text-slate-500 leading-relaxed">
                                                Chức năng này chỉ dùng để thêm hồ sơ khách thuê và gắn
                                                vào phòng. Khách không được cấp tài khoản đăng nhập ở
                                                bước này.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 bg-orange-50 border border-orange-100 p-3.5 rounded-xl text-[13px] text-orange-800 flex items-start gap-3">
                                    <i className="fa-solid fa-circle-exclamation mt-0.5 text-orange-500 shrink-0"></i>
                                    <div className="leading-relaxed">
                                        <p className="font-semibold mb-0.5">
                                            Chuyển thành đại diện sẽ làm ở chức năng riêng.
                                        </p>
                                        <p>
                                            Khi tạo hợp đồng hoặc đổi đại diện, hệ thống mới xử lý tài
                                            khoản đăng nhập cho người thuê.
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
                                        Ghi chú{" "}
                                        <span className="text-slate-400 font-normal text-[12px]">
                                            (tùy chọn)
                                        </span>
                                    </h3>
                                </div>

                                <div className="relative">
                                    <textarea
                                        value={form.note}
                                        onChange={handleChange("note")}
                                        maxLength={300}
                                        placeholder="Nhập ghi chú thêm về khách thuê..."
                                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none min-h-[140px]"
                                    ></textarea>
                                    <span className="absolute bottom-3 right-3 text-[11px] text-slate-400">
                                        {form.note.length}/300
                                    </span>
                                </div>
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
                        Lưu khách thuê
                    </button>
                </div>
            </div>
        </div>
    );
}