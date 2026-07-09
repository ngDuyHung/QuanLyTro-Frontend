import React, { useEffect } from "react";

export default function ViewNotificationModal({ open, notification, onClose }) {

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open || !notification) return null;

    const getTypeColor = (type) => {
        switch (type) {
            case "warning": return "text-amber-600 bg-amber-50 border-amber-100";
            case "billing": return "text-red-600 bg-red-50 border-red-100";
            default: return "text-blue-600 bg-blue-50 border-blue-100";
        }
    };

    const dateStr = new Date(notification.created_at).toLocaleDateString("vi-VN", {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes fadeIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
            
            <div className="bg-white w-full sm:max-w-[700px] h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">

                {/* Header */}
                <div className="relative p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    {/* Nút đóng */}
                    <button type="button" onClick={onClose} className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-slate-400 z-10 hover:bg-slate-100 transition-colors">
                        <i className="fa-solid fa-xmark text-[14px]"></i>
                    </button>

                    {/* Hàng Badge & Ngày: thêm pr-8 chặn va chạm nút đóng absolute */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 pr-8 sm:pr-0">
                        <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getTypeColor(notification.type)}`}>
                            {notification.type_label}
                        </span>
                        {notification.is_pinned && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 uppercase tracking-wider">
                                <i className="fa-solid fa-thumbtack mr-1"></i> Đã ghim
                            </span>
                        )}
                        {/* sm:ml-auto giúp đẩy ngày sang phải khi lên PC, mobile đi liền hàng gọn gàng */}
                        <span className="text-[12px] text-slate-400 font-medium sm:ml-auto">{dateStr}</span>
                    </div>

                    {/* Tiêu đề thông báo: Thêm pr-6 tránh sát nút đóng ở mobile */}
                    <h2 className="text-[20px] sm:text-[22px] font-extrabold text-slate-800 leading-tight pr-6 sm:pr-0">
                        {notification.title}
                    </h2>
                    
                    <div className="flex items-center gap-2 mt-3 py-2 px-3 bg-white/60 rounded-lg border border-slate-100 w-fit">
                        <i className="fa-solid fa-paper-plane text-brand text-[11px]"></i>
                        <span className="text-[12px] text-slate-500 font-medium">Gửi đến:</span>
                        <span className="text-[12px] text-slate-800 font-bold">{notification.target_type_label}</span>
                    </div>
                </div>

                {/* Content Render HTML */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white no-scrollbar">
                    <div
                        className="prose prose-slate max-w-none 
                                   prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-slate-600
                                   prose-headings:text-slate-800 prose-headings:font-bold
                                   prose-img:rounded-xl prose-img:shadow-lg
                                   prose-strong:text-slate-800"
                        dangerouslySetInnerHTML={{ __html: notification.content }}
                    />
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-center sm:justify-end shrink-0">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[14px] font-bold active:bg-slate-100 transition-colors shadow-sm">
                        Đóng xem trước
                    </button>
                </div>

            </div>
        </div>
    );
}