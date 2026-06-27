import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import financialTransactionService from "@/services/financialTransactionService";

export default function CancelFinancialTransactionModal({
  open,
  transaction,
  onClose,
  onSuccess,
}) {
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientError, setClientError] = useState("");

  // Khóa cuộn trang khi mở modal
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Reset trạng thái khi mở modal mới
  useEffect(() => {
    if (open) {
      setCancelReason("");
      setClientError("");
    }
  }, [open]);

  if (!open || !transaction) return null;

  const handleCancel = async () => {
    setClientError("");
    
    if (!cancelReason.trim()) {
      return setClientError("Vui lòng nhập lý do hủy bỏ phiếu này.");
    }

    try {
      setIsSubmitting(true);
      
      // Gọi API cancel đã refactor ở Backend (truyền ID và body kèm cancel_reason)
      await financialTransactionService.cancel(transaction.id, {
        cancel_reason: cancelReason,
      });

      toast.success("Đã hủy phiếu thu/chi thành công!");
      onSuccess?.(); // Tải lại danh sách sổ quỹ
      onClose();
    } catch (error) {
      setClientError(error.response?.data?.message || "Có lỗi xảy ra khi hủy phiếu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 transition-all">
      <div className="bg-white w-full sm:max-w-[450px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] relative">
        
        <div className="p-6 flex flex-col items-center text-center">
          {/* Icon Cảnh báo lỗi / Hủy bỏ */}
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 border border-red-100">
            <i className="fa-solid fa-ban text-[22px]"></i>
          </div>
          
          <h2 className="text-[18px] font-bold text-slate-800 mb-2">Hủy bỏ phiếu thu/chi?</h2>
          
          <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
            Bạn đang yêu cầu hủy phiếu <span className="font-bold text-slate-700">{transaction.transaction_code}</span>. 
            Hành động này sẽ đảo ngược dòng tiền và không thể khôi phục lại trạng thái cũ.
          </p>

          {clientError && (
            <div className="w-full mb-4 bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-[12px] flex items-center gap-2 text-left">
              <i className="fa-solid fa-circle-exclamation shrink-0"></i> {clientError}
            </div>
          )}

          {/* Ô nhập lý do bắt buộc */}
          <div className="w-full text-left">
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Lý do hủy phiếu <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy (ví dụ: Sai số tiền, khách đổi ý, nhập nhầm phòng...)"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-red-500 min-h-[80px] resize-none text-slate-700 shadow-inner"
              maxLength={255}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Cụm nút bấm tương tác nhanh */}
        <div className="border-t border-slate-100 flex items-center bg-slate-50 sticky bottom-0">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting} 
            className="flex-1 py-3.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors disabled:opacity-70 border-r border-slate-200 active:bg-slate-200"
          >
            Bỏ qua
          </button>
          <button 
            type="button" 
            onClick={handleCancel}
            disabled={isSubmitting} 
            className="flex-1 py-3.5 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 active:bg-red-100"
          >
            {isSubmitting ? (
              <><span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span> Đang xử lý...</>
            ) : (
              "Xác nhận hủy"
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}