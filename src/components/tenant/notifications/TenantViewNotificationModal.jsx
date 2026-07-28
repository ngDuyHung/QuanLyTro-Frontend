import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantNotificationService from "@/services/tenantNotificationService";

const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit' 
    });
};

const getTypeConfig = (type) => {
    switch (type) {
        case 'info': return { icon: 'fa-circle-info', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100', label: 'Thông tin' };
        case 'warning': return { icon: 'fa-triangle-exclamation', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', label: 'Cảnh báo' };
        case 'billing': return { icon: 'fa-file-invoice-dollar', color: 'text-green-600', bg: 'bg-green-50 border-green-100', label: 'Tài chính' };
        default: return { icon: 'fa-bell', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200', label: 'Thông báo' };
    }
};

export default function TenantViewNotificationModal({ open, notificationId, onClose }) {
    const [detail, setDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Xử lý khóa cuộn nền
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Fetch dữ liệu khi mở Modal
    useEffect(() => {
        if (open && notificationId) {
            const fetchDetail = async () => {
                setIsLoading(true);
                try {
                    const res = await tenantNotificationService.getById(notificationId);
                    setDetail(res.data?.data || res.data);
                } catch (error) {
                    toast.error("Không tải được nội dung thông báo.");
                    onClose();
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDetail();
        } else {
            setDetail(null);
        }
    }, [open, notificationId, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes fadeIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>

            <div className="bg-white w-full sm:max-w-[700px] h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">

                {/* Header (Mô phỏng giống ViewNotificationModal bên Chủ trọ) */}
                <div className="relative p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    {/* Nút đóng */}
                    <button type="button" onClick={onClose} className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-slate-400 z-10 hover:bg-slate-100 transition-colors">
                        <i className="fa-solid fa-xmark text-[14px]"></i>
                    </button>

                    {isLoading || !detail ? (
                         <div className="h-[50px] w-full bg-slate-200 animate-pulse rounded-lg"></div>
                    ) : (
                        <>
                            {/* Hàng Badge & Ngày */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 pr-8 sm:pr-0">
                                <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getTypeConfig(detail.type).bg} ${getTypeConfig(detail.type).color}`}>
                                    <i className={`fa-solid ${getTypeConfig(detail.type).icon} mr-1`}></i>
                                    {detail.type_label || getTypeConfig(detail.type).label}
                                </span>
                                {detail.is_pinned && (
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 uppercase tracking-wider">
                                        <i className="fa-solid fa-thumbtack mr-1"></i> Đã ghim
                                    </span>
                                )}
                                <span className="text-[12px] text-slate-400 font-medium sm:ml-auto">
                                    <i className="fa-regular fa-clock mr-1"></i> {formatDate(detail.created_at)}
                                </span>
                            </div>

                            {/* Tiêu đề thông báo */}
                            <h2 className="text-[20px] sm:text-[22px] font-extrabold text-slate-800 leading-tight pr-6 sm:pr-0">
                                {detail.title}
                            </h2>
                        </>
                    )}
                </div>

                {/* Body Content Render HTML (Áp dụng Typography chuẩn) */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white no-scrollbar">
                    {isLoading || !detail ? (
                        <div className="flex flex-col items-center justify-center h-full text-brand opacity-50">
                            <i className="fa-solid fa-spinner fa-spin text-3xl mb-3"></i>
                            <p className="text-sm font-medium">Đang tải nội dung...</p>
                        </div>
                    ) : (
                        // QUAN TRỌNG: Sử dụng dangerouslySetInnerHTML và prose của Tailwind
                        <div
                            className="prose prose-slate max-w-none 
                                       prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-slate-700
                                       prose-headings:text-slate-800 prose-headings:font-bold
                                       prose-img:rounded-xl prose-img:shadow-sm prose-img:mx-auto
                                       prose-strong:text-slate-800 prose-a:text-brand"
                            dangerouslySetInnerHTML={{ __html: detail.content }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-center sm:justify-end shrink-0">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[13px] font-bold active:bg-slate-100 hover:bg-slate-50 transition-colors shadow-sm">
                        Đã hiểu
                    </button>
                </div>

            </div>
        </div>
    );
}