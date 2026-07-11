import React, { useState, useEffect } from "react";
import incidentService from "@/services/incidentService";

// --- Helpers UI ---
const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("vi-VN");
};

const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit' });
};

const getStatusConfig = (status) => {
    switch (status) {
        case "pending": return { label: "Chờ tiếp nhận", className: "bg-amber-50 text-amber-600 border-amber-200", icon: "fa-hourglass-half" };
        case "processing": return { label: "Đang xử lý", className: "bg-blue-50 text-blue-600 border-blue-200", icon: "fa-screwdriver-wrench" };
        case "resolved": return { label: "Đã giải quyết", className: "bg-green-50 text-green-600 border-green-200", icon: "fa-circle-check" };
        case "cancelled": return { label: "Đã hủy", className: "bg-slate-100 text-slate-500 border-slate-200", icon: "fa-ban" };
        default: return { label: status, className: "bg-slate-50 text-slate-600 border-slate-200" };
    }
};

const getPriorityConfig = (priority) => {
    switch (priority) {
        case "emergency": return { label: "Khẩn cấp", className: "bg-red-50 text-red-600 border-red-200" };
        case "high": return { label: "Nghiêm trọng", className: "bg-orange-50 text-orange-600 border-orange-200" };
        case "normal": return { label: "Bình thường", className: "bg-blue-50 text-blue-600 border-blue-200" };
        case "low": return { label: "Thấp", className: "bg-slate-50 text-slate-600 border-slate-200" };
        default: return { label: priority, className: "bg-slate-50 text-slate-600" };
    }
};

export default function ViewIncidentModal({
    open,
    onClose,
    incident, // Dữ liệu cơ bản truyền từ Table
}) {
    const [data, setData] = useState(incident);
    const [isLoading, setIsLoading] = useState(false);

    // Xử lý khóa cuộn màn hình nền
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

    // Fetch dữ liệu chi tiết nhất khi mở modal
    useEffect(() => {
        if (open && incident) {
            setData(incident); // Set tạm dữ liệu cũ để xem ngay
            setIsLoading(true);
            incidentService.getById(incident.id)
                .then(res => {
                    setData(res.data?.data || res.data || res);
                })
                .catch(err => console.error("Lỗi lấy chi tiết sự cố:", err))
                .finally(() => setIsLoading(false));
        }
    }, [open, incident]);

    if (!open || !data) return null;

    const statusConfig = getStatusConfig(data.status);
    const priorityConfig = getPriorityConfig(data.priority);

    // Render danh sách ảnh
    const renderImageGallery = (images, title) => {
        if (!images || images.length === 0) return null;
        
        return (
            <div className="mb-5 sm:mb-4">
                <p className="text-[13px] font-semibold text-slate-700 mb-2 sm:mb-2">{title}</p>
                <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {images.map((img) => (
                        <a 
                            key={img.id} 
                            href={img.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="relative w-[70px] h-[70px] sm:w-20 sm:h-20 rounded-lg border border-slate-200 overflow-hidden group block shadow-sm"
                        >
                            <img src={img.url} alt="Incident" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <i className="fa-solid fa-magnifying-glass-plus text-white text-[14px] sm:text-lg"></i>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        );
    };

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
                .animate-progress-indeterminate {
                    width: 50%;
                    animation: progress 1.5s infinite linear;
                    transform-origin: 0% 50%;
                }
                @keyframes progress {
                    0% { transform: translateX(-100%) scaleX(0.2); }
                    50% { transform: translateX(0%) scaleX(0.5); }
                    100% { transform: translateX(200%) scaleX(0.2); }
                }
            `}</style>

            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
                <div className="bg-white w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in relative">
                    
                    {/* Loader lớp phủ khi đang call API */}
                    {isLoading && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 z-10 overflow-hidden">
                            <div className="h-full bg-brand animate-progress-indeterminate"></div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-800">Sự cố #{data.id}</h2>
                            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-medium border ${statusConfig.className}`}>
                                <i className={`fa-solid ${statusConfig.icon} mr-1 sm:mr-1.5`}></i>
                                {statusConfig.label}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors bg-white sm:bg-transparent shadow-sm sm:shadow-none"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 bg-white">
                        <div className="space-y-5 sm:space-y-6">
                            
                            {/* 1. Tiêu đề và Mô tả */}
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="text-[16px] sm:text-[18px] font-bold text-slate-800 leading-snug">{data.title}</h3>
                                    <span className={`shrink-0 px-2 py-1 sm:px-2.5 rounded-md text-[10px] sm:text-[11px] font-medium border ${priorityConfig.className}`}>
                                        {priorityConfig.label}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1.5 text-[12px] text-slate-500 mb-3">
                                    <span><i className="fa-solid fa-layer-group mr-1.5"></i> {data.category_label || "Khác"}</span>
                                    <span><i className="fa-regular fa-clock mr-1.5"></i> {formatDate(data.created_at)}</span>
                                </div>
                                <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] sm:text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line">
                                    {data.description || <span className="italic text-slate-400">Không có mô tả chi tiết.</span>}
                                </div>
                            </div>

                            {/* 2. Thông tin liên quan (Lưới 2 cột) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="p-3 border border-slate-200 rounded-xl">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">Vị trí sự cố</p>
                                    <p className="text-[13px] sm:text-[14px] font-bold text-slate-800">
                                        {data.room?.name || "Khu vực chung"}
                                    </p>
                                    <p className="text-[11px] sm:text-[12px] text-slate-500 mt-0.5">{data.property?.name}</p>
                                </div>
                                <div className="p-3 border border-slate-200 rounded-xl">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">Người báo cáo</p>
                                    {data.reporter ? (
                                        <>
                                            <p className="text-[13px] sm:text-[14px] font-bold text-slate-800">{data.reporter.full_name}</p>
                                            <p className="text-[11px] sm:text-[12px] text-slate-500 mt-0.5"><i className="fa-solid fa-phone mr-1"></i> {data.reporter.phone}</p>
                                        </>
                                    ) : (
                                        <p className="text-[13px] sm:text-[14px] font-bold text-slate-800">Chủ trọ / Quản lý</p>
                                    )}
                                </div>
                            </div>

                            {/* 3. Dữ liệu tài chính (Chỉ hiện khi đã chốt) */}
                            {(data.status === 'resolved' || data.status === 'cancelled') && (
                                <div className={`p-3.5 sm:p-4 rounded-xl border ${data.status === 'cancelled' ? 'bg-slate-50 border-slate-200' : 'bg-brand/5 border-brand/20'}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                                        <p className="text-[13px] font-bold text-slate-800">
                                            <i className="fa-solid fa-wallet text-brand mr-1.5"></i> Kết quả xử lý
                                        </p>
                                        {data.resolved_at && (
                                            <span className="text-[11px] text-slate-500">
                                                Chốt lúc: {formatDate(data.resolved_at)}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {data.status === 'cancelled' ? (
                                        <p className="text-[12px] sm:text-[13px] text-slate-600 italic">Sự cố này đã bị hủy bỏ và không phát sinh chi phí.</p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-[13px] sm:text-[14px]">
                                                <span className="text-slate-600">Tổng chi phí:</span>
                                                <span className="font-bold text-slate-800">{formatCurrency(data.repair_cost)} đ</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[12px] sm:text-[13px]">
                                                <span className="text-slate-500">Bên thanh toán:</span>
                                                <span className="font-semibold text-slate-700">{data.payer_label}</span>
                                            </div>
                                            
                                            {/* Trích xuất liên kết dòng tiền (Khóa ngoại) */}
                                            {data.payer === 'landlord' && data.financial_transaction_id && (
                                                <div className="mt-1.5 sm:mt-2 p-2 bg-white border border-blue-100 rounded-lg text-[11px] sm:text-[12px] flex items-center justify-between">
                                                    <span className="text-slate-600"><i className="fa-solid fa-receipt text-blue-500 mr-1.5"></i> Đã xuất phiếu chi</span>
                                                    <span className="font-semibold text-blue-600">#{data.financial_transaction_id}</span>
                                                </div>
                                            )}
                                            {data.payer === 'tenant' && (
                                                <div className="mt-1.5 sm:mt-2 p-2 bg-white border border-orange-100 rounded-lg text-[11px] sm:text-[12px] flex items-center justify-between">
                                                    <span className="text-slate-600">
                                                        <i className="fa-solid fa-file-invoice-dollar text-orange-500 mr-1.5"></i> 
                                                        {data.invoice_id ? "Đã cộng vào hóa đơn" : "Đang nợ, chờ hóa đơn tới"}
                                                    </span>
                                                    {data.invoice_id && (
                                                        <span className="font-semibold text-orange-600">#{data.invoice_id}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 4. Hình ảnh (Before / After) */}
                            <div className="border-t border-slate-100 pt-4 sm:pt-5">
                                {renderImageGallery(data.images?.before_repair, "Ảnh tình trạng (Trước khi sửa)")}
                                {renderImageGallery(data.images?.after_repair, "Ảnh nghiệm thu (Sau khi sửa)")}
                                
                                {(!data.images?.before_repair?.length && !data.images?.after_repair?.length) && (
                                    <p className="text-[12px] sm:text-[13px] text-slate-400 italic text-center pb-2">Không có hình ảnh đính kèm.</p>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 px-4 sm:px-5 py-4 sm:py-3.5 bg-white sm:bg-slate-50 shrink-0 sticky bottom-0 z-20 flex justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:shadow-none">
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-slate-100 sm:bg-white border sm:border-slate-200 text-slate-600 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-bold sm:font-semibold hover:bg-slate-200 sm:hover:bg-slate-100 transition-colors sm:shadow-sm"
                        >
                            Đóng cửa sổ
                        </button>
                    </div>
                    
                </div>
            </div>
        </>
    );
}