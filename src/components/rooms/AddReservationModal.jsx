import React, { useEffect, useState } from "react";

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
    tenant_name: "",
    tenant_phone: "",
    deposit_amount: "",
    expected_move_in_date: new Date().toISOString().slice(0, 10), // Mặc định hôm nay
    payment_method: "cash",
    bank_account_id: "",
    note: "",
};

export default function AddReservationModal({
    open,
    onClose,
    onSubmit,
    isSubmitting = false,
    room,
}) {
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            // Đặt lại form mỗi khi mở
            setForm({ ...initialForm, expected_move_in_date: new Date().toISOString().slice(0, 10) });
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open || !room) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "deposit_amount") {
            setForm((prev) => ({ ...prev, [name]: formatMoneyInput(value) }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = {
            ...form,
            room_id: room.id,
            deposit_amount: parseMoney(form.deposit_amount),
        };
        onSubmit(submitData);
    };

    return (
        <>
            <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
                <div className="bg-white w-full sm:max-w-[500px] h-[90dvh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
                        <div>
                            <h3 className="text-[16px] font-bold text-slate-800">
                                Nhận cọc giữ chỗ
                            </h3>
                            <p className="text-[13px] text-slate-500 mt-0.5">
                                Phòng {room.name} - Hệ thống sẽ tự động tạo Phiếu Thu
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-5 sidebar-scroll">
                        <form id="reservation-form" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                    Tên khách hàng <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="tenant_name"
                                    required
                                    value={form.tenant_name}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[14px] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                    placeholder="Nhập họ và tên"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                    Số điện thoại <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="tenant_phone"
                                    required
                                    value={form.tenant_phone}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[14px] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                        Số tiền cọc (VNĐ) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="deposit_amount"
                                        required
                                        value={form.deposit_amount}
                                        onChange={handleChange}
                                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[14px] font-semibold text-brand focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                        placeholder="VD: 500.000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                        Dự kiến nhận phòng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="expected_move_in_date"
                                        required
                                        value={form.expected_move_in_date}
                                        onChange={handleChange}
                                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[14px] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                    Hình thức thanh toán <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="payment_method"
                                    value={form.payment_method}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[14px] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                >
                                    <option value="cash">Tiền mặt</option>
                                    <option value="bank_transfer">Chuyển khoản</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                    Ghi chú thêm
                                </label>
                                <textarea
                                    name="note"
                                    rows="3"
                                    value={form.note}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-200 rounded-lg text-[14px] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                    placeholder="Ghi chú về tiền cọc, yêu cầu của khách..."
                                ></textarea>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[14px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-60"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            form="reservation-form"
                            disabled={isSubmitting || !form.deposit_amount}
                            className="px-8 py-2.5 bg-brand text-white rounded-xl text-[14px] font-bold hover:bg-brand-dark transition-colors flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <i className="fa-solid fa-check"></i>
                            )}
                            Lưu & Nhận cọc
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}