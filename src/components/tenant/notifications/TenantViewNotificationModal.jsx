import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantNotificationService from "@/services/tenantNotificationService";

const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit' });
};

const getTypeConfig = (type) => {
    switch (type) {
        case 'info': return { icon: 'fa-circle-info', color: 'text-blue-500', bg: 'bg-blue-50', label: 'Thông tin' };
        case 'warning': return { icon: 'fa-triangle-exclamation', color: 'text-amber-500', bg: 'bg-amber-50', label: 'Cảnh báo' };
        case 'billing': return { icon: 'fa-file-invoice-dollar', color: 'text-green-500', bg: 'bg-green-50', label: 'Tài chính' };
        default: return { icon: 'fa-bell', color: 'text-slate-500', bg: 'bg-slate-100', label: 'Thông báo' };
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
                .animate-slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @media (min-width: 640px) {
                    .sm\\:animate-fade-in {
                        animation: fadeIn 0.2s ease-out forwards;
                    }
                }
            `}</style>

            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-[fadeIn_0.2s_ease-out]">
                <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in relative">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                        <h2 className="text-[16px] font-bold text-slate-700 uppercase tracking-wider">Chi tiết thông báo</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-red-500 flex justify-center items-center transition-colors shadow-sm"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar bg-white">
                        {isLoading || !detail ? (
                            <div className="h-40 flex flex-col justify-center items-center text-slate-400">
                                <i className="fa-solid fa-spinner animate-spin text-2xl text-brand mb-2"></i>
                                <p className="text-[13px]">Đang tải nội dung...</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex gap-2 items-center mb-3">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded ${getTypeConfig(detail.type).bg} ${getTypeConfig(detail.type).color}`}>
                                        <i className={`fa-solid ${getTypeConfig(detail.type).icon} mr-1`}></i>
                                        {detail.type_label || getTypeConfig(detail.type).label}
                                    </span>
                                    <span className="text-[12px] text-slate-400 font-medium">
                                        <i className="fa-regular fa-clock mr-1"></i> {formatDate(detail.created_at)}
                                    </span>
                                </div>

                                <h1 className="text-[20px] sm:text-[22px] font-black text-slate-800 leading-snug mb-5">
                                    {detail.is_pinned && <i className="fa-solid fa-thumbtack text-red-500 mr-2 rotate-45"></i>}
                                    {detail.title}
                                </h1>

                                <div className="text-[14px] sm:text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    {detail.content}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}