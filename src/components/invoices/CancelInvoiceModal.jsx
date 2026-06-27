import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import invoiceService from "@/services/invoiceService";

export default function CancelInvoiceModal({
    open,
    invoice,
    onClose,
    onSuccess,
}) {
    const [cancelReason, setCancelReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientError, setClientError] = useState("");

    // Khóa cuộn background khi mở modal
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Reset trạng thái mỗi khi mở modal mới
    useEffect(() => {
        if (open) {
            setCancelReason("");
            setClientError("");
        }
    }, [open]);

    if (!open || !invoice) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setClientError("");

        if (!cancelReason.trim()) {
            return setClientError("Vui lòng nhập lý do hủy hóa đơn.");
        }

        try {
            setIsSubmitting(true);
            
            // Khớp chính xác API: cancel: (id, data) => api.post(`/invoices/${id}/cancel`, data)
            const payload = { cancel_reason: cancelReason.trim() };
            await invoiceService.cancel(invoice.id, payload);

            toast.success("Hủy hóa đơn thành công!");
            onSuccess?.(); // Gọi fetchInvoices() để nạp lại danh sách
            onClose();
        } catch (error) {
            setClientError(error.response?.data?.message || "Có lỗi xảy ra khi hủy hóa đơn.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-white w-full sm:max-w-[500px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] relative">
                
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                            <i className="fa-solid fa-ban text-[16px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-800">Hủy hóa đơn đã phát hành</h2>
                            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">
                                Mã HĐ: <span className="text-red-500">{invoice.invoice_code}</span> - Phòng: {invoice.room?.name}
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={isSubmitting} 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Form & Nội dung */}
                <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                    <div className="p-5 bg-slate-50 flex flex-col gap-4">
                        
                        {/* Hộp cảnh báo nghiệp vụ */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-800 text-[12px] flex items-start gap-2.5 leading-relaxed">
                            <i className="fa-solid fa-triangle-exclamation text-[14px] mt-0.5 shrink-0 text-amber-600"></i>
                            <div>
                                <p className="font-bold mb-0.5">Cảnh báo hành động nghiêm trọng!</p>
                                <p>Hóa đơn sau khi hủy sẽ <strong className="text-red-600">không thể khôi phục</strong>. Toàn bộ công nợ đã ghi nhận trong kỳ này của khách thuê sẽ bị xóa bỏ hoàn toàn khỏi hệ thống báo cáo.</p>
                            </div>
                        </div>

                        {/* Thông báo lỗi từ Backend / Client validation */}
                        {clientError && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-lg text-[13px] flex items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation"></i> {clientError}
                            </div>
                        )}

                        {/* Ô nhập lý do */}
                        <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                                Lý do hủy hóa đơn <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Nhập lý do cụ thể (Ví dụ: Tính sai chỉ số điện nước, khách đổi lịch thanh toán...)"
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-[100px] resize-none leading-relaxed text-slate-800"
                                required
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 flex items-center justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isSubmitting} 
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-70"
                        >
                            Đóng
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="px-5 py-2 bg-red-600 text-white rounded-lg text-[13px] font-semibold hover:bg-red-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-sm shadow-red-600/20"
                        >
                            {isSubmitting ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang hủy...</>
                            ) : (
                                <><i className="fa-solid fa-ban"></i> Xác nhận hủy</>
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}