import React, { useState, useEffect } from "react";

export default function LeaveRoomModal({
  isOpen,
  onClose,
  onConfirm,
  tenant,
  isLoading = false,
}) {
  const [moveOutDate, setMoveOutDate] = useState("");

  // Tự động set ngày mặc định là hôm nay khi mở Modal
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setMoveOutDate(today);
    }
  }, [isOpen]);

  if (!isOpen || !tenant) return null;

  // Trích xuất thông tin để hiển thị cho thân thiện
  const tenantName = tenant.name || tenant.full_name;
  const currentResidence = tenant.current_residence || null;
  const roomName = tenant.room || currentResidence?.room?.name || "phòng hiện tại";
  
  // Xác định lease_id để gửi lên API
  const leaseId = tenant.lease_id || currentResidence?.lease_id || currentResidence?.lease?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!leaseId) {
      alert("Không tìm thấy thông tin hợp đồng của khách thuê này!");
      return;
    }
    
    // Gửi data lên component cha
    onConfirm(tenant.id, {
      lease_id: leaseId,
      move_out_date: moveOutDate,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-person-walking-arrow-right text-[13px]"></i>
            </span>
            Xác nhận rời phòng
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5">
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl mb-5">
              <p className="text-[13.5px] text-orange-800 leading-relaxed">
                Bạn đang xác nhận cho khách ở ghép <strong>{tenantName}</strong> rời khỏi <strong>{roomName}</strong>. 
                Hệ thống sẽ cập nhật ngày rời đi và cập nhật lại trạng thái chủ nhà có thể xóa người ở ghép sau khi đã rời đi.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="moveOutDate" className="text-[13px] font-semibold text-slate-700">
                Ngày rời đi thực tế <span className="text-red-500">*</span>
              </label>
              <input
                id="moveOutDate"
                type="date"
                required
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-700 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-shadow"
              />
              <p className="text-[11.5px] text-slate-500 mt-1">
                Mặc định là ngày hôm nay. Bạn có thể lùi ngày nếu khách đã đi từ trước.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading || !moveOutDate}
              className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-sm shadow-orange-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : (
                <i className="fa-solid fa-check"></i>
              )}
              {isLoading ? "Đang xử lý..." : "Xác nhận rời đi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}