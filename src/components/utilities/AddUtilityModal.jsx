import React, { useState, useEffect } from "react";
import leasesService from "@/services/leasesService";

const initialForm = {
    property_id: "",
    lease_id: "",
    type: "electricity",
    current_reading: "",
    reading_date: new Date().toISOString().slice(0, 10), // Mặc định hôm nay
    note: "",
};

export default function AddUtilityModal({
    open,
    onClose,
    onSubmit,
    isSubmitting = false,
    properties = [],
}) {
    const [form, setForm] = useState(initialForm);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [clientError, setClientError] = useState("");

    // Quản lý load hợp đồng theo khu nhà
    const [leases, setLeases] = useState([]);
    const [isLoadingLeases, setIsLoadingLeases] = useState(false);
    const [leaseNotice, setLeaseNotice] = useState("");

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

    // Load danh sách Hợp đồng đang active khi chọn Khu nhà
    useEffect(() => {
        if (!open || !form.property_id) {
            setLeases([]);
            setLeaseNotice("");
            return;
        }

        const fetchLeases = async () => {
            try {
                setIsLoadingLeases(true);
                setLeaseNotice("");
                // Chỉ lấy hợp đồng đang active
                const response = await leasesService.getAll({
                    property_id: form.property_id,
                    status: "active",
                    per_page: 100,
                });

                const activeLeases = response.data.data || [];
                setLeases(activeLeases);

                if (activeLeases.length === 0) {
                    setLeaseNotice("Khu nhà này chưa có phòng nào đang có hợp đồng hiệu lực.");
                }
            } catch (error) {
                setLeases([]);
                setClientError("Không thể tải danh sách hợp đồng của khu nhà.");
            } finally {
                setIsLoadingLeases(false);
            }
        };

        fetchLeases();
    }, [open, form.property_id]);



    const resetForm = () => {
        setForm(initialForm);
        setImage(null);
        setImagePreview("");
        setClientError("");
        setLeases([]);
        setLeaseNotice("");
    };

    useEffect(() => {
        if (open) {
            resetForm();
        }
    }, [open]);
    
    // Reset form khi đóng
    if (!open) return null;

    const handleClose = () => {
        if (isSubmitting) return;
        resetForm();
        onClose();
    };

    const handleChange = (field) => (event) => {
        setClientError("");
        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
            // Nếu đổi khu nhà, reset lại lease_id
            ...(field === "property_id" ? { lease_id: "" } : {}),
        }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        event.target.value = ""; // Reset input
    };

    const handleRemoveImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImage(null);
        setImagePreview("");
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!form.property_id) return setClientError("Vui lòng chọn khu nhà.");
        if (!form.lease_id) return setClientError("Vui lòng chọn phòng (hợp đồng).");
        if (!form.current_reading) return setClientError("Vui lòng nhập chỉ số mới.");
        if (!form.reading_date) return setClientError("Vui lòng chọn ngày chốt số.");

        const payload = new FormData();
        payload.append("lease_id", form.lease_id);
        payload.append("type", form.type);
        payload.append("current_reading", form.current_reading);
        payload.append("reading_date", form.reading_date);
        if (form.note.trim()) payload.append("note", form.note.trim());
        if (image) payload.append("meter_image", image);

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
                {/* Modal Container */}
                <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[700px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] relative">

                    {/* Header (Sticky Top) */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                                <i className="fa-solid fa-gauge-high text-[18px]"></i>
                            </div>
                            <div>
                                <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800 leading-tight">
                                    Ghi chỉ số Điện / Nước
                                </h2>
                                <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                                    Cập nhật số liệu để chuẩn bị lập hóa đơn tháng này.
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

                            {/* 1. Thông tin Phòng & Loại dịch vụ */}
                            <div className={`bg-white px-5 py-5 sm:p-6 border-b border-slate-200 ${clientError ? 'mt-4' : ''}`}>
                                <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-house-chimney text-[13px]"></i> 1. Thông tin phòng
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                                    {/* Khu nhà */}
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                            Khu nhà <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={form.property_id}
                                            onChange={handleChange("property_id")}
                                            className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand"
                                        >
                                            <option value="">Chọn khu nhà</option>
                                            {properties.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Phòng (Hợp đồng) */}
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                            Phòng đang thuê <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={form.lease_id}
                                            onChange={handleChange("lease_id")}
                                            disabled={!form.property_id || isLoadingLeases}
                                            className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <option value="">
                                                {isLoadingLeases ? "Đang tải danh sách..." : form.property_id ? "Chọn phòng..." : "Chọn khu nhà trước"}
                                            </option>
                                            {leases.map((lease) => (
                                                <option key={lease.id} value={lease.id}>
                                                    {lease.room?.name || 'Phòng'} - Khách: {lease.tenant?.full_name || 'Đại diện'}
                                                </option>
                                            ))}
                                        </select>
                                        {leaseNotice && <p className="mt-1.5 text-[12px] text-orange-600">{leaseNotice}</p>}
                                    </div>

                                    {/* Loại dịch vụ (Radio Button to trên mobile) */}
                                    <div className="sm:col-span-2 mt-2">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                            Loại dịch vụ cần chốt số
                                        </label>
                                        <div className="flex gap-3">
                                            <label className="flex-1 relative cursor-pointer group">
                                                <input type="radio" name="type" value="electricity" checked={form.type === "electricity"} onChange={handleChange("type")} className="peer sr-only" />
                                                <div className="w-full text-center px-3 py-3 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 peer-checked:border-amber-400 peer-checked:bg-amber-50 peer-checked:text-amber-600 transition-all flex flex-col items-center gap-1">
                                                    <i className="fa-solid fa-bolt text-lg mb-1"></i> Chỉ số Điện
                                                </div>
                                            </label>
                                            <label className="flex-1 relative cursor-pointer group">
                                                <input type="radio" name="type" value="water" checked={form.type === "water"} onChange={handleChange("type")} className="peer sr-only" />
                                                <div className="w-full text-center px-3 py-3 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 peer-checked:border-blue-400 peer-checked:bg-blue-50 peer-checked:text-blue-600 transition-all flex flex-col items-center gap-1">
                                                    <i className="fa-solid fa-droplet text-lg mb-1"></i> Chỉ số Nước
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Chỉ số & Ảnh */}
                            <div className="bg-white px-5 py-5 sm:p-6 mt-2 sm:mt-0 border-b border-slate-200">
                                <h3 className="text-[14px] font-bold text-brand mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-calculator text-[13px]"></i> 2. Nhập số liệu
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                                    {/* Ngày chốt số */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                            Ngày chốt chỉ số <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={form.reading_date}
                                            onChange={handleChange("reading_date")}
                                            className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                        />
                                    </div>

                                    {/* Chỉ số mới */}
                                    <div className="sm:col-span-2 relative">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                            Chỉ số trên đồng hồ mới nhất <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.current_reading}
                                            onChange={handleChange("current_reading")}
                                            placeholder="VD: 1540"
                                            className="w-full px-3.5 py-3 sm:py-3 bg-white border-2 border-slate-200 rounded-xl text-[16px] font-bold text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all pr-12"
                                        />
                                        <span className="absolute right-4 bottom-[13px] text-[13px] font-bold text-slate-400">
                                            {form.type === 'electricity' ? 'kWh' : 'm³'}
                                        </span>
                                    </div>

                                    {/* Upload Ảnh */}
                                    <div className="sm:col-span-2 mt-2">
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                            Ảnh chụp đồng hồ <span className="text-slate-400 font-normal">(Rất khuyến khích để tránh tranh chấp)</span>
                                        </label>

                                        {imagePreview ? (
                                            <div className="relative w-full sm:w-[250px] aspect-[4/3] rounded-xl border border-slate-200 overflow-hidden bg-black group">
                                                <img src={imagePreview} alt="Đồng hồ" className="w-full h-full object-contain" />
                                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                    <span className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-sm">Đổi ảnh khác</span>
                                                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                                                </label>
                                                <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-red-500 hover:bg-white flex items-center justify-center shadow-sm">
                                                    <i className="fa-solid fa-trash-can text-[12px]"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="border-2 border-dashed border-brand/30 bg-green-50/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-green-50 transition-all group">
                                                <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <i className="fa-solid fa-camera text-xl"></i>
                                                </div>
                                                <p className="text-[13px] font-semibold text-brand mb-1">Chụp hoặc Tải ảnh lên</p>
                                                <p className="text-[11px] text-slate-500">Hỗ trợ JPG, PNG, WEBP (Tối đa 4MB)</p>
                                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                                            </label>
                                        )}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl text-[12px] text-blue-700 flex items-start gap-2.5">
                                            <i className="fa-solid fa-circle-info mt-0.5 text-blue-500"></i>
                                            <p className="leading-relaxed">
                                                Hệ thống sẽ <b>tự động lấy chỉ số cũ</b> của tháng trước để tính ra số tiêu thụ. Bạn chỉ cần nhập đúng số đang hiển thị trên đồng hồ hiện tại.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Ghi chú */}
                            <div className="bg-white px-5 py-5 sm:p-6 mt-2 sm:mt-0">
                                <h3 className="text-[14px] font-bold text-brand mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-note-sticky text-[13px]"></i> 3. Ghi chú <span className="text-slate-400 font-normal text-[12px]">(Tùy chọn)</span>
                                </h3>
                                <textarea
                                    value={form.note}
                                    onChange={handleChange("note")}
                                    maxLength={255}
                                    placeholder="Nhập ghi chú thêm nếu cần (VD: Đồng hồ quay vòng, thay đồng hồ mới...)"
                                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] sm:text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none min-h-[100px]"
                                ></textarea>
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
                                        Lưu chỉ số
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