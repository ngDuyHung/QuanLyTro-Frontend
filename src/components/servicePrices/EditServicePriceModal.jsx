import React, { useState, useEffect } from "react";

export default function EditServicePriceModal({
    open,
    onClose,
    onSubmit,
    isSubmitting,
    properties = [],
    initialData,
}) {
    const [form, setForm] = useState({});

    useEffect(() => {
        if (open && initialData) {
            setForm({
                id: initialData.id,
                property_id: initialData.property_id || "",
                service_type: initialData.service_type,
                unit_price: initialData.unit_price,
                base_price: initialData.base_price || 0, // THÊM TRƯỜNG NÀY
                free_units: initialData.free_units || 0,
                free_unit_type: initialData.free_unit_type || "none",
                effective_date: initialData.effective_date ? initialData.effective_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
                note: initialData.note || "",
            });
        }
    }, [open, initialData]);

    if (!open) return null;

    const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    // Khi thay đổi Hình thức, tự reset các ô ẩn đi để tránh rác DB
    const handleFreeUnitTypeChange = (e) => {
        const val = e.target.value;
        setForm((prev) => ({
            ...prev,
            free_unit_type: val,
            ...(val === "none" ? { free_units: 0, base_price: 0 } : {})
        }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...form,
            property_id: form.property_id === "" ? null : Number(form.property_id),
            unit_price: Number(form.unit_price),
            base_price: Number(form.base_price) || 0, // THÊM TRƯỜNG NÀY
            free_units: Number(form.free_units) || 0,
        });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-white w-full sm:max-w-[500px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <i className="fa-solid fa-pen-to-square text-[15px]"></i>
                        </div>
                        <h2 className="text-[16px] font-bold text-slate-800">Chỉnh sửa đơn giá dịch vụ</h2>
                    </div>
                    <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark text-[13px]"></i>
                    </button>
                </div>

                {/* Form Body - Thêm overflow-y-auto để cuộn nếu nội dung dài */}
                <div className="flex-1 overflow-y-auto p-5">
                    <form id="edit-service-form" onSubmit={handleFormSubmit} className="space-y-4">
                        
                        <div>
                            <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Phạm vi áp dụng</label>
                            <select
                                value={form.property_id}
                                onChange={handleChange("property_id")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-brand disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled 
                            >
                                <option value="">Áp dụng chung toàn hệ thống (Global)</option>
                                {properties.map((p) => (
                                    <option key={p.id} value={p.id}>Cấu hình riêng: {p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* DÒNG 1: Loại dịch vụ & Hình thức tính phí */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Loại dịch vụ</label>
                                <select
                                    value={form.service_type}
                                    onChange={handleChange("service_type")}
                                    disabled
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-brand disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="electricity">Điện</option>
                                    <option value="water">Nước</option>
                                    <option value="internet">Internet / Wifi</option>
                                    <option value="garbage">Rác sinh hoạt</option>
                                    <option value="parking">Giữ xe</option>
                                    <option value="cleaning">Vệ sinh</option>
                                    <option value="elevator">Thang máy</option>
                                    <option value="management">Phí quản lý</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Hình thức tính phí</label>
                                <select
                                    value={form.free_unit_type}
                                    onChange={handleFreeUnitTypeChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-brand"
                                >
                                    <option value="none">Tính theo khối lượng</option>
                                    <option value="per_person">Cố định/Miễn phí theo người</option>
                                    <option value="per_room">Cố định/Miễn phí theo phòng</option>
                                </select>
                            </div>
                        </div>

                        {/* DÒNG 2: Đơn giá và Các ô ẩn hiện */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={form.free_unit_type !== "none" ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                                    {form.free_unit_type !== "none" ? "Đơn giá khi xài lố (VNĐ) *" : "Đơn giá (VNĐ) *"}
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={form.unit_price}
                                    onChange={handleChange("unit_price")}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold outline-none focus:border-brand"
                                />
                            </div>

                            {form.free_unit_type !== "none" && (
                                <>
                                    <div>
                                        <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Mức miễn phí</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.free_units}
                                            onChange={handleChange("free_units")}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-brand"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Phí thu cố định tối thiểu (VNĐ)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.base_price}
                                            onChange={handleChange("base_price")}
                                            placeholder="Ví dụ: 20000 (để trống nếu 0đ)"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-brand"
                                        />
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            Khoản thu cứng. Nếu xài lố mức miễn phí sẽ cộng thêm tiền lố.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <hr className="border-slate-100 my-1"/>

                        <div>
                            <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Ngày bắt đầu áp dụng</label>
                            <input
                                type="date"
                                required
                                value={form.effective_date}
                                onChange={handleChange("effective_date")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-brand"
                            />
                        </div>

                        <div>
                            <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Ghi chú bổ sung</label>
                            <textarea
                                value={form.note}
                                onChange={handleChange("note")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-brand h-20 resize-none"
                            />
                        </div>
                    </form>

                    {/* VÙNG HIỂN THỊ LỊCH SỬ THAY ĐỔI GIÁ (Giữ nguyên) */}
                    {initialData?.price_histories && initialData.price_histories.length > 0 && (
                        <div className="mt-6 border-t border-slate-200 pt-5">
                            <h3 className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-clock-rotate-left text-brand"></i> Lịch sử thay đổi đơn giá
                            </h3>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-[12px]">
                                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                                        <tr>
                                            <th className="px-3 py-2.5 font-semibold">Ngày đổi</th>
                                            <th className="px-3 py-2.5 font-semibold text-right">Giá cũ</th>
                                            <th className="px-3 py-2.5 font-semibold text-right">Giá mới</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                                        {initialData.price_histories.map((history) => (
                                            <tr key={history.id}>
                                                <td className="px-3 py-2.5 whitespace-nowrap">{history.changed_date}</td>
                                                <td className="px-3 py-2.5 text-right text-slate-400 line-through">
                                                    {history.old_price.toLocaleString()} đ
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-brand font-bold">
                                                    {history.new_price.toLocaleString()} đ
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-100 p-4 flex gap-3 bg-white shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-1/2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        form="edit-service-form"
                        disabled={isSubmitting}
                        className="w-1/2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-[13px] hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang lưu...</>
                        ) : (
                            "Cập nhật giá"
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}