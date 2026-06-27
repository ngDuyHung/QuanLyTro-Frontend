import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import invoiceService from "@/services/invoiceService";

export default function DeleteInvoiceModal({
    open,
    invoice,
    onClose,
    onSuccess,
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientError, setClientError] = useState("");

    // Khóa cuộn background khi mở modal
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Reset lỗi mỗi khi mở modal mới
    useEffect(() => {
        if (open) {
            setClientError("");
        }
    }, [open]);

    if (!open || !invoice) return null;

    const handleDelete = async () => {
        setClientError("");
        try {
            setIsSubmitting(true);
            
            // Gọi API xóa cứng (chỉ áp dụng cho draft)
            await invoiceService.delete(invoice.id);

            toast.success("Đã xóa hóa đơn nháp thành công!");
            onSuccess?.(); // Tải lại danh sách
            onClose();
        } catch (error) {
            setClientError(error.response?.data?.message || "Có lỗi xảy ra khi xóa hóa đơn.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white w-full max-w-[400px] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out] relative">
                
                <div className="p-6 flex flex-col items-center text-center">
                    {/* Icon thùng rác cảnh báo */}
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
                        <i className="fa-solid fa-trash-can text-[24px]"></i>
                    </div>
                    
                    <h2 className="text-[18px] font-bold text-slate-800 mb-2">Xóa hóa đơn nháp?</h2>
                    
                    <p className="text-[13px] text-slate-500 leading-relaxed">
                        Bạn có chắc chắn muốn xóa vĩnh viễn hóa đơn <span className="font-bold text-slate-700">{invoice.invoice_code}</span> của phòng <span className="font-bold text-slate-700">{invoice.room?.name}</span> không? Hành động này không thể hoàn tác.
                    </p>

                    {clientError && (
                        <div className="mt-4 w-full bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-[12px] flex items-center justify-center gap-2">
                            <i className="fa-solid fa-circle-exclamation"></i> {clientError}
                        </div>
                    )}
                </div>

                {/* Nút thao tác (dàn ngang chia đôi) */}
                <div className="border-t border-slate-100 flex items-center bg-slate-50">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={isSubmitting} 
                        className="flex-1 py-3.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors disabled:opacity-70 border-r border-slate-200"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        type="button" 
                        onClick={handleDelete}
                        disabled={isSubmitting} 
                        className="flex-1 py-3.5 text-[14px] font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <><span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span> Đang xóa...</>
                        ) : (
                            "Xóa vĩnh viễn"
                        )}
                    </button>
                </div>
                
            </div>
        </div>
    );
}