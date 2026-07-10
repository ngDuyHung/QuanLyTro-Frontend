import React, { useState } from "react";
import { toast } from "react-toastify";
import accountingLedgerService from "@/services/accountingLedgerService";

export default function DeleteLedgerModal({ open, ledger, onClose, onSuccess }) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!open || !ledger) return null;

    // Helper render kỳ hiển thị
    const periodLabel = ledger.period_type === 'month'
        ? `Tháng ${ledger.period_month}/${ledger.period_year}`
        : `Năm ${ledger.period_year}`;

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await accountingLedgerService.delete(ledger.id);
            toast.success("Đã hủy chốt sổ kế toán thành công.");
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể xóa sổ kế toán này.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">

                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
                        <i className="fa-solid fa-triangle-exclamation text-[28px]"></i>
                    </div>
                    <h2 className="text-[18px] font-bold text-slate-800 mb-2">Hủy chốt sổ kế toán?</h2>
                    <p className="text-[13px] text-slate-500 leading-relaxed">
                        Bạn có chắc chắn muốn hủy sổ kế toán <strong>{periodLabel}</strong> của khu <strong>{ledger.property_name || "Toàn hệ thống"}</strong> không?
                        <br />
                        <span className="text-red-500 mt-1 block">Dữ liệu các dòng thu của sổ này sẽ bị xóa vĩnh viễn (Không ảnh hưởng đến hóa đơn gốc).</span>
                    </p>
                </div>

                <div className="px-6 py-4 bg-slate-50 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Quay lại
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm shadow-red-600/30 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? <><i className="fa-solid fa-spinner animate-spin"></i> Đang xử lý</> : "Xác nhận Hủy"}
                    </button>
                </div>
            </div>
        </div>
    );
}