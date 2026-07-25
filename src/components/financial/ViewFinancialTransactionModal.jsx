import React, { useEffect } from "react";

// --- Helpers định dạng hiển thị UI ---
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "0";
  return Number(amount).toLocaleString("vi-VN");
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDirectionStyle = (direction) => {
  if (direction === "income") {
    return {
      badge: "bg-green-50 text-green-700 border-green-200",
      amountColor: "text-green-600",
      icon: "fa-arrow-down-long",
      prefix: "+",
    };
  }
  return {
    badge: "bg-red-50 text-red-700 border-red-200",
    amountColor: "text-red-600",
    icon: "fa-arrow-up-long",
    prefix: "-",
  };
};

const getStatusStyle = (status) => {
  switch (status) {
    case "confirmed":
      return "bg-green-50 text-green-600 border-green-200";
    case "cancelled":
      return "bg-red-50 text-red-500 border-red-200 line-through";
    case "pending":
      return "bg-amber-50 text-amber-600 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

export default function ViewFinancialTransactionModal({ open, transaction, onClose }) {
  
  // Khóa cuộn trang nền khi mở Modal nhằm tối ưu UX cho mobile app
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open || !transaction) return null;

  const dirStyle = getDirectionStyle(transaction.direction);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
      <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[85vh] sm:max-w-[750px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[16px] font-bold text-slate-800 tracking-wider">
              {transaction.transaction_code}
            </span>
            <span className={`px-2 py-0.5 border text-[10px] font-bold rounded ${getStatusStyle(transaction.status)}`}>
              {transaction.status_label || (transaction.status === "cancelled" ? "Đã hủy" : transaction.status === "pending" ? "Đang chờ duyệt" : "Thành công")}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* BODY (NỘI DUNG PHIẾU THU CHI CHỈ TIẾT) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* KHỐI TRỌNG TÂM: SỐ TIỀN BẢN GHI */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${transaction.direction === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Số tiền giao dịch</span>
            <h3 className={`text-[26px] sm:text-[32px] font-black ${dirStyle.amountColor} tracking-tight leading-none`}>
              {dirStyle.prefix}{formatCurrency(transaction.amount)} <span className="text-[16px] font-normal text-slate-500">đ</span>
            </h3>
            <span className={`mt-2.5 px-3 py-0.5 border text-[11px] font-bold rounded-full flex items-center gap-1.5 ${dirStyle.badge}`}>
              <i className={`fa-solid ${dirStyle.icon} text-[10px]`}></i>
              {transaction.direction_label} • {transaction.category_label}
            </span>
          </div>

          {/* CHIA LAYOUT 2 CỘT TRÊN DESKTOP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* THÔNG TIN CHUNG */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Thông tin dòng tiền</h4>
              
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">Thời gian lập:</span>
                <span className="font-semibold text-slate-800">{formatDate(transaction.transaction_date)}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">Hình thức:</span>
                <span className="font-semibold text-slate-800">{transaction.method_label}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">Bản chất kế toán:</span>
                <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">{transaction.accounting_type}</span>
              </div>
            </div>

            {/* ĐỐI TƯỢNG HẠCH TOÁN */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Đối tượng hạch toán</h4>
              
              <div className="flex justify-between items-start text-[13px]">
                <span className="text-slate-500">Khu nhà / Phòng:</span>
                <div className="text-right flex flex-col">
                  <span className="font-bold text-slate-800">{transaction.room?.name || "Chi phí dùng chung"}</span>
                  <span className="text-[11px] text-slate-400">{transaction.property?.name}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">Người thực hiện:</span>
                <span className="font-semibold text-slate-800">{transaction.tenant?.full_name || "—"}</span>
              </div>
              {transaction.tenant?.phone && (
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-500">Số điện thoại:</span>
                  <span className="font-medium text-slate-700">{transaction.tenant.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* KHỐI NGÂN HÀNG (HIỆN KHI CÓ SỬ DỤNG TÀI KHOẢN NGÂN HÀNG TRÊN SAO KÊ) */}
          {(transaction.bank_account || transaction.bank_transaction_code) && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 animate-[fadeIn_0.2s_ease-out]">
              <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <i className="fa-solid fa-building-columns text-slate-400 text-[12px]"></i> Thông tin tài khoản &amp; Sao kê ngân hàng
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                {transaction.bank_account && (
                  <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Tài khoản chủ nhà</span>
                    <span className="font-bold text-slate-800 text-[13px]">
                      {transaction.bank_account.bank_code} • {transaction.bank_account.account_number}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">{transaction.bank_account.account_name}</span>
                  </div>
                )}
                <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 mb-0.5">Mã giao dịch ngân hàng</span>
                  <span className="font-mono text-[12px] text-slate-700 font-bold">{transaction.bank_transaction_code || "—"}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-400 mb-0.5">Nội dung chuyển khoản</span>
                  <span className="text-[12px] text-slate-700 font-medium truncate" title={transaction.transfer_content}>{transaction.transfer_content || "—"}</span>
                </div>
              </div>
            </div>
          )}

          {/* DANH SÁCH HÓA ĐƠN ĐƯỢC PHÂN BỔ (CẤN NỢ HOẶC THANH TOÁN HÓA ĐƠN) */}
          {transaction.allocations && transaction.allocations.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <i className="fa-solid fa-link text-slate-400 text-[12px]"></i> Hóa đơn đã được cấn trừ liên kết
              </h4>
              <div className="space-y-2.5">
                {transaction.allocations.map((alloc, idx) => (
                  <div key={idx} className="border border-slate-100 bg-slate-50/50 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-[13px] flex items-center gap-1">
                        <i className="fa-regular fa-file-lines text-slate-400"></i>
                        {alloc.invoice?.invoice_code || `Hóa đơn ID #${alloc.invoice_id}`}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        Tổng tiền: {formatCurrency(alloc.invoice?.total_amount)}đ | Còn nợ: {formatCurrency(alloc.invoice?.remaining_amount)}đ
                      </span>
                    </div>
                    <div className="text-left sm:text-right flex flex-col justify-center">
                      <span className="text-[11px] text-slate-400">Số tiền cấn trừ phiếu</span>
                      <span className="text-[14px] font-black text-brand">
                        {formatCurrency(alloc.allocated_amount || alloc.pivot?.allocated_amount)} đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MÔ TẢ & GHI CHÚ NỘI BỘ */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 text-[13px]">
            <div>
              <span className="block text-slate-400 font-bold text-[11px] uppercase tracking-wider mb-1">Nội dung hiển thị (Mô tả)</span>
              <p className="text-slate-700 font-medium bg-slate-50/70 px-3 py-2 rounded-lg border border-slate-100">{transaction.description || "Chưa có nội dung mô tả."}</p>
            </div>
            {transaction.note && (
              <div>
                <span className="block text-slate-400 font-bold text-[11px] uppercase tracking-wider mb-1">Ghi chú nội bộ</span>
                <p className="text-slate-600 bg-amber-50/30 text-amber-900 border border-amber-100 px-3 py-2 rounded-lg whitespace-pre-line italic">{transaction.note}</p>
              </div>
            )}
            
            {/* LÝ DO HỦY PHIẾU (NẾU TRẠNG THÁI HỦY) */}
            {transaction.status === "cancelled" && (
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-3.5 space-y-1 text-red-900 animate-[fadeIn_0.2s_ease-out]">
                <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                  <i className="fa-solid fa-triangle-exclamation"></i> Chi tiết lịch sử hủy bỏ
                </span>
                <p className="text-[13px] font-medium mt-1">
                  Lý do: <span className="italic">"{transaction.cancel_reason || "Không ghi nhận lý do"}"</span>
                </p>
                {transaction.cancelled_at && (
                  <span className="block text-[11px] text-red-400 mt-1">Thời gian hủy: {formatDate(transaction.cancelled_at)}</span>
                )}
              </div>
            )}
          </div>

        </div>

        {/* FOOTER MODAL */}
        <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 flex items-center justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg text-[13px] hover:bg-slate-200 active:bg-slate-300 transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
}