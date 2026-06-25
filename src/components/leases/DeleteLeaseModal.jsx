import React, { useEffect } from "react";

export default function DeleteLeaseModal({
  open,
  lease,
  onClose,
  onConfirm,
  isDeleting = false,
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !lease) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
        {/* Modal Container */}
        <div className="bg-white w-full sm:max-w-[450px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">
          
          <div className="p-6 sm:p-7 flex flex-col items-center text-center">
            {/* Icon cảnh báo */}
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 ring-4 ring-red-50/50">
              <i className="fa-solid fa-file-circle-xmark text-3xl"></i>
            </div>

            <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-800 mb-2">
              Xóa hợp đồng?
            </h2>
            
            <p className="text-[14px] text-slate-500 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa <strong>HĐ #{lease.id}</strong> <br className="hidden sm:block" />
              của khách thuê <strong className="text-slate-800">{lease.tenant?.full_name || "—"}</strong> không?
            </p>

            <div className="bg-orange-50 border border-orange-100 p-3.5 rounded-xl text-[13px] text-orange-800 flex items-start gap-3 w-full text-left">
              <i className="fa-solid fa-circle-info mt-0.5 text-orange-500 shrink-0"></i>
              <div className="leading-relaxed">
                <p className="font-semibold mb-0.5">Lưu ý hệ thống:</p>
                <p>Chỉ có thể xóa hợp đồng <b>khi chưa phát sinh hóa đơn nào</b>. Hành động này sẽ xóa kèm chỉ số điện/nước ban đầu và không thể hoàn tác.</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="w-full sm:w-1/2 px-4 py-3 sm:py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-semibold hover:bg-slate-100 transition-colors disabled:opacity-70"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => onConfirm(lease.id)}
              disabled={isDeleting}
              className="w-full sm:w-1/2 px-4 py-3 sm:py-2.5 bg-red-500 text-white rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 sm:shadow-none"
            >
              {isDeleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang xóa...
                </>
              ) : (
                <>
                  <i className="fa-regular fa-trash-can text-[14px]"></i>
                  Xóa hợp đồng
                </>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </>
  );
}