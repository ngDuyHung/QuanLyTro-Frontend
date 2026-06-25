import React, { useEffect } from "react";

export default function DeleteUtilityModal({
  open,
  reading,
  onClose,
  onConfirm,
  isDeleting = false,
}) {
  // Khóa cuộn trang khi mở Modal
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

  if (!open || !reading) return null;

  const typeLabel = reading.type === "electricity" ? "chỉ số Điện" : "chỉ số Nước";
  const typeIcon = reading.type === "electricity" ? "fa-bolt text-amber-500" : "fa-droplet text-blue-500";

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
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 ring-4 ring-red-50/50 relative">
              <i className="fa-solid fa-triangle-exclamation text-3xl"></i>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <i className={`fa-solid ${typeIcon} text-[12px]`}></i>
              </div>
            </div>

            <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-800 mb-2">
              Xóa bản ghi này?
            </h2>
            
            <p className="text-[14px] text-slate-500 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa <strong>{typeLabel}</strong> của <br className="hidden sm:block" />
              <strong className="text-slate-800">Phòng {reading.room_name}</strong> - kỳ chốt ngày <strong className="text-slate-800">{reading.reading_date}</strong> không?
            </p>

            <div className="bg-orange-50 border border-orange-100 p-3.5 rounded-xl text-[13px] text-orange-800 flex items-start gap-3 w-full text-left">
              <i className="fa-solid fa-circle-info mt-0.5 text-orange-500 shrink-0"></i>
              <div className="leading-relaxed">
                <p className="font-semibold mb-0.5">Lưu ý quan trọng:</p>
                <p>Hành động này sẽ xóa vĩnh viễn dữ liệu và <b>hình ảnh đồng hồ</b> đã tải lên. Không thể hoàn tác sau khi xóa.</p>
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
              onClick={() => onConfirm(reading.id)}
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
                  Xóa dữ liệu
                </>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </>
  );
}