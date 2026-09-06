import React, { useState, useEffect } from "react";

const initialForm = {
    property_id: "",
    service_type: "electricity",
    unit_price: "",
    base_price: 0, // THÊM TRƯỜNG NÀY
    free_units: 0,
    free_unit_type: "none",
    effective_date: new Date().toISOString().slice(0, 10),
    note: "",
};

export default function AddServicePriceModal({
    open,
    onClose,
    onSubmit,
    isSubmitting,
    properties = [],
    currentPropertyFilter = "",
}) {
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        if (open) {
            setForm({
                ...initialForm,
                property_id: currentPropertyFilter || "",
                effective_date: new Date().toISOString().slice(0, 10),
            });
        }
    }, [open, currentPropertyFilter]);

    if (!open) return null;

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    // Khi người dùng đổi Hình thức miễn phí về "none", tự động reset các ô ẩn
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
        if (!form.unit_price || Number(form.unit_price) < 0) {
            alert("Vui lòng nhập đơn giá hợp lệ.");
            return;
        }
        onSubmit({
            ...form,
            property_id: form.property_id === "" ? null : Number(form.property_id),
            unit_price: Number(form.unit_price),
            base_price: Number(form.base_price) || 0, // THÊM DÒNG NÀY
            free_units: Number(form.free_units) || 0,
        });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-white w-full sm:max-w-[500px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                            <i className="fa-solid fa-gears text-[15px]"></i>
                        </div>
                        <h2 className="text-[16px] font-bold text-slate-800">Cấu hình đơn giá dịch vụ</h2>
                    </div>
                    <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark text-[13px]"></i>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">

                    <div>
                        <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Phạm vi áp dụng</label>
                        <select
                            value={form.property_id}
                            onChange={handleChange("property_id")}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-brand"
                        >
                            <option value="">Áp dụng chung toàn hệ thống (Global)</option>
                            {properties.map((p) => (
                                <option key={p.id} value={p.id}>Cấu hình riêng: {p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* DÒNG 1: Loại dịch vụ & Hình thức miễn phí */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Loại dịch vụ</label>
                            <select
                                value={form.service_type}
                                onChange={handleChange("service_type")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-brand"
                            >
                                <option value="electricity">Điện (kWh)</option>
                                <option value="water">Nước (m³)</option>
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
                    
                    {/* DÒNG 2: Đơn giá và Cấu hình phụ (Ẩn/Hiện dựa vào Hình thức) */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Đơn giá thì lúc nào cũng hiện */}
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
                                placeholder="Ví dụ: 3500"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold outline-none focus:border-brand"
                            />
                        </div>

                        {/* Các ô cấu hình phụ chỉ hiện khi KHÔNG PHẢI "none" */}
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
                            placeholder="Nhập lý do điều chỉnh hoặc mô tả..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-brand h-20 resize-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-slate-100 pt-4 flex gap-3 bg-white shrink-0">
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
                            disabled={isSubmitting}
                            className="w-1/2 px-4 py-2.5 bg-brand text-white font-semibold rounded-lg text-[13px] hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-brand/20 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang cập nhật...</>
                            ) : (
                                "Áp dụng giá mới"
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}