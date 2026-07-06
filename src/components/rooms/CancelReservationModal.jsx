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
    cancel_reason: "",
    is_refunding: false,
    refund_amount: "",
    payment_method: "cash",
};

export default function CancelReservationModal({
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
            setForm(initialForm);
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open || !room) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
            setForm((prev) => ({ ...prev, [name]: checked }));
        } else if (name === "refund_amount") {
            setForm((prev) => ({ ...prev, [name]: formatMoneyInput(value) }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = {
            room_id: room.id, // ID phòng (Hoặc truyền reservation_id nếu Backend API yêu cầu trực tiếp ID của reservation)
            cancel_reason: form.cancel_reason,
            refund_amount: form.is_refunding ? parseMoney(form.refund_amount) : 0,
            payment_method: form.is_refunding ? form.payment_method : "cash",
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
                <div className="bg-white w-full sm:max-w-[450px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">

                    {/* Header - Màu đỏ cảnh báo */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 bg-red-50 shrink-0">
                        <div>
                            <h3 className="text-[16px] font-bold text-red-700">
                                Hủy phiếu đặt cọc
                            </h3>
                            <p className="text-[13px] text-red-500 mt-0.5">
                                Phòng {room.name} sẽ trở về trạng thái Trống
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                        <form id="cancel-reservation-form" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                    Lý do hủy cọc <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="cancel_reason"
                                    required
                                    value={form.cancel_reason}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[14px] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                                >
                                    <option value="" disabled>-- Chọn lý do --</option>
                                    <option value="Khách đổi ý, không nhận phòng">Khách đổi ý, không nhận phòng (Tịch thu cọc)</option>
                                    <option value="Chủ trọ hủy">Chủ trọ không muốn cho thuê nữa</option>
                                    <option value="Khác">Lý do khác...</option>
                                </select>
                            </div>

                            {/* Tùy chọn Hoàn tiền */}
                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_refunding"
                                        checked={form.is_refunding}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                                    />
                                    <span className="text-[14px] font-medium text-slate-700">
                                        Hoàn trả lại tiền cọc cho khách
                                    </span>
                                </label>
                            </div>

                            {/* Các trường hiện ra nếu chọn Hoàn tiền */}
                            {form.is_refunding && (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mt-2">
                                    <div>
                                        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                            Số tiền hoàn <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="refund_amount"
                                            required={form.is_refunding}
                                            value={form.refund_amount}
                                            onChange={handleChange}
                                            inputMode="numeric"
                                            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[14px] text-red-600 font-semibold focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                                            placeholder="Nhập số tiền..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                            Hình thức chi <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="payment_method"
                                            value={form.payment_method}
                                            onChange={handleChange}
                                            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[14px] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                                        >
                                            <option value="cash">Tiền mặt</option>
                                            <option value="bank_transfer">Chuyển khoản</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[12px] text-slate-500 italic">
                                            <i className="fa-solid fa-info-circle mr-1"></i>
                                            Hệ thống sẽ tự động sinh 1 Phiếu Chi cho khoản hoàn tiền này.
                                        </p>
                                    </div>
                                </div>
                            )}
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
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            form="cancel-reservation-form"
                            disabled={isSubmitting || !form.cancel_reason}
                            className="px-8 py-2.5 bg-red-600 text-white rounded-xl text-[14px] font-bold hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <i className="fa-solid fa-ban"></i>
                            )}
                            Xác nhận Hủy cọc
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}