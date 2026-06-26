import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import invoiceService from "@/services/invoiceService";
import sepayTransactionService from "@/services/sepayTransactionService";

export default function MatchTransactionModal({ open, transaction, onClose, onSuccess }) {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

    useEffect(() => {
        if (open) {
            setSelectedInvoiceId("");
            fetchUnpaidInvoices();
        }
    }, [open]);

    // Lấy các hóa đơn Đã phát hành, Trả 1 phần hoặc Quá hạn
    const fetchUnpaidInvoices = async () => {
        try {
            setIsLoading(true);
            // Gọi API lấy hóa đơn (Có thể cần điều chỉnh params tùy backend của bạn)
            // Lấy nhiều một chút để chủ trọ dễ chọn
            const res = await invoiceService.getAll({ per_page: 100 }); 
            const allInvoices = res.data.data || [];
            
            // Lọc ra các hóa đơn còn nợ
            const unpaid = allInvoices.filter(inv => 
                ['issued', 'partially_paid', 'overdue'].includes(inv.status) && 
                Number(inv.remaining_amount) > 0
            );
            setInvoices(unpaid);
        } catch (error) {
            toast.error("Không thể tải danh sách hóa đơn.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedInvoiceId) return toast.warning("Vui lòng chọn một hóa đơn để ghép nối.");

        try {
            setIsSubmitting(true);
            await sepayTransactionService.match(transaction.id, { invoice_id: selectedInvoiceId });
            toast.success("Ghép nối hóa đơn thành công!");
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi ghép nối giao dịch.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open || !transaction) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white w-full max-w-[500px] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
                    <div>
                        <h2 className="text-[17px] font-bold text-slate-800">Đối soát thủ công</h2>
                        <p className="text-[12px] text-slate-500 mt-0.5">Ghép nối giao dịch vào hóa đơn còn nợ</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="w-8 h-8 rounded-full bg-white text-slate-500 hover:bg-slate-200 shadow-sm flex items-center justify-center">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    {/* Tóm tắt giao dịch đang chọn */}
                    <div className="bg-brand/5 border border-brand/20 p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="text-[11px] text-slate-500 font-semibold mb-1">SỐ TIỀN NHẬN</p>
                            <p className="text-[18px] font-black text-brand">+{Number(transaction.transfer_amount).toLocaleString()} đ</p>
                        </div>
                        <div className="text-right max-w-[60%]">
                            <p className="text-[11px] text-slate-500 font-semibold mb-1">NỘI DUNG</p>
                            <p className="text-[12px] font-mono text-slate-700 truncate" title={transaction.content}>{transaction.content}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[13px] font-semibold text-slate-700 mb-2">Chọn hóa đơn cần thanh toán <span className="text-red-500">*</span></label>
                        <select 
                            value={selectedInvoiceId}
                            onChange={(e) => setSelectedInvoiceId(e.target.value)}
                            disabled={isLoading}
                            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-[13px] outline-none focus:border-brand"
                        >
                            <option value="">{isLoading ? "Đang tải danh sách..." : "-- Chọn hóa đơn --"}</option>
                            {invoices.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                    Phòng {inv.room?.name} - {inv.invoice_code} (Nợ: {Number(inv.remaining_amount).toLocaleString()} đ)
                                </option>
                            ))}
                        </select>
                        {invoices.length === 0 && !isLoading && (
                            <p className="text-[12px] text-red-500 mt-1.5"><i className="fa-solid fa-circle-info"></i> Hiện không có hóa đơn nào đang nợ để đối soát.</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-2">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting || !selectedInvoiceId} className="px-6 py-2 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                            {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fa-solid fa-link"></i>}
                            Xác nhận ghép
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}