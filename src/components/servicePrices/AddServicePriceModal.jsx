import React, { useState, useEffect } from "react";

const initialForm = {
    property_id: "",
    service_type: "electricity",
    unit_price: "",
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
                            </select>
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Đơn giá (VNĐ) *</label>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Số lượng miễn phí</label>
                            <input
                                type="number"
                                min="0"
                                value={form.free_units}
                                onChange={handleChange("free_units")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-brand"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Hình thức miễn phí</label>
                            <select
                                value={form.free_unit_type}
                                onChange={handleChange("free_unit_type")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold outline-none focus:border-brand"
                            >
                                <option value="none">Không miễn phí</option>
                                <option value="per_room">Trên mỗi phòng</option>
                                <option value="per_person">Trên mỗi nhân khẩu</option>
                            </select>
                        </div>
                    </div>

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