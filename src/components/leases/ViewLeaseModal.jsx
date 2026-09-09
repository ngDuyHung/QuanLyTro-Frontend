import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import leasesService from "@/services/leasesService";

export default function ViewLeaseModal({ open, lease: initialLease, onClose }) {
    const [lease, setLease] = useState(null);
    const [previewHtml, setPreviewHtml] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    // Thêm state này để quản lý Tab trên Mobile giống ViewInvoiceModal
    const [mobileTab, setMobileTab] = useState("details");

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    useEffect(() => {
        if (open && initialLease?.id) {
            fetchLeaseAndTemplate(initialLease.id);
        } else {
            setLease(null);
            setPreviewHtml("");
        }
    }, [open, initialLease]);

    const fetchLeaseAndTemplate = async (id) => {
        setIsLoading(true);
        try {
            const [leaseRes, previewRes] = await Promise.all([
                leasesService.getById(id),
                leasesService.getPreviewHtml(id)
            ]);
            setLease(leaseRes.data.data);
            setPreviewHtml(previewRes.data.html);
        } catch (error) {
            toast.error("Không thể tải chi tiết hợp đồng.");
            console.error(error);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        setIsExporting(true);
        try {
            const response = await leasesService.exportPdf(lease.id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const fileName = `Hop_dong_${lease.id}.pdf`;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Đã tải xuống hợp đồng PDF thành công.");
        } catch (error) {
            toast.error("Có lỗi xảy ra khi kết xuất tệp PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleSharePdf = async () => {
        setIsExporting(true);
        try {
            const response = await leasesService.exportPdf(lease.id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const fileName = `Hop_dong_${lease.id}.pdf`;
            const file = new File([blob], fileName, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: `Hợp đồng phòng ${lease.room?.name}`,
                        text: `Gửi bạn bản sao hợp đồng thuê phòng.`,
                        files: [file],
                    });
                    toast.success("Đã mở bảng chia sẻ thành công!");
                } catch (shareError) {
                    if (shareError.name !== 'AbortError') toast.error("Lỗi khi mở bảng chia sẻ.");
                }
            } else {
                toast.warning("Trình duyệt không hỗ trợ chia sẻ trực tiếp. Vui lòng Tải PDF.");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tạo file để chia sẻ.");
        } finally {
            setIsExporting(false);
        }
    };

    if (!open) return null;

    return (
        <>
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
            
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all" onClick={onClose}>
                <div 
                    className="bg-slate-100 w-full max-w-6xl h-[95vh] sm:h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]"
                    onClick={(e) => e.stopPropagation()}
                >

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[16px] border border-blue-100">
                                <i className="fa-solid fa-file-signature"></i>
                            </div>
                            <div>
                                <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-800">Quản lý & In hợp đồng</h2>
                                <p className="text-[12px] text-slate-500 font-medium">Mã HĐ: #{initialLease?.id}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors">
                            <i className="fa-solid fa-xmark text-md"></i>
                        </button>
                    </div>

                    {/* Thanh Tabs trên Mobile (Ẩn trên màn hình Desktop) */}
                    <div className="flex lg:hidden border-b border-slate-200 bg-white shrink-0">
                        <button
                            onClick={() => setMobileTab("details")}
                            className={`flex-1 py-3 text-[14px] font-semibold text-center border-b-2 transition-colors ${mobileTab === "details"
                                ? "border-brand text-brand"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            <i className="fa-solid fa-list-ul mr-2"></i> Chi tiết
                        </button>
                        <button
                            onClick={() => setMobileTab("preview")}
                            className={`flex-1 py-3 text-[14px] font-semibold text-center border-b-2 transition-colors ${mobileTab === "preview"
                                ? "border-brand text-brand"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            <i className="fa-solid fa-file-pdf mr-2"></i> Bản in PDF
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

                        {/* CỘT TRÁI: System Data View */}
                        <div className={`w-full flex-1 lg:w-[400px] lg:flex-none min-h-0 overflow-y-auto p-4 sm:p-5 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 [&::-webkit-scrollbar]:hidden ${mobileTab === "details" ? "block" : "hidden"} lg:block`}>
                            {isLoading || !lease ? (
                                <div className="flex justify-center items-center h-48 text-brand">
                                    <i className="fa-solid fa-spinner animate-spin text-xl"></i>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50 text-[13px]">
                                        <div className="flex justify-between"><span className="text-slate-400">Khu trọ:</span><span className="font-semibold text-slate-800">{lease.room?.property?.name}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Mã phòng:</span><span className="font-bold text-brand">{lease.room?.name}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Khách đại diện:</span><span className="font-semibold text-slate-800">{lease.tenant?.full_name}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">SĐT liên hệ:</span><span className="font-medium text-slate-800">{lease.tenant?.phone}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Số CCCD:</span><span className="font-medium text-slate-800">{lease.tenant?.id_card_number}</span></div>
                                    </div>

                                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[13px]">
                                        <h4 className="font-bold mb-2 uppercase text-[11px] tracking-wider text-slate-400">Điều khoản tài chính</h4>

                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="font-semibold text-slate-700">Giá thuê phòng</span>
                                            <span className="font-bold text-slate-800">{Number(lease.room_price || 0).toLocaleString()}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="font-semibold text-slate-700">Tiền cọc</span>
                                            <span className="font-bold text-brand">{Number(lease.deposit || 0).toLocaleString()}đ</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="font-semibold text-slate-700">Ngày thu tiền</span>
                                            <span className="font-bold text-slate-800">Ngày {lease.billing_day || 1} hàng tháng</span>
                                        </div>
                                        <div className="flex flex-col py-2 border-b border-slate-100 last:border-0">
                                            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider mb-1.5">Dịch vụ đính kèm</span>
                                            <div className="flex flex-col gap-1.5">
                                                {lease.service_items?.map(svc => (
                                                    <div
                                                        key={svc.id}
                                                        className="flex justify-between items-center text-[12px] bg-slate-50 border border-slate-200/60 px-2.5 py-1.5 rounded-lg"
                                                    >
                                                        <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                                                            {svc.service_type_label || svc.service_type}
                                                        </span>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                                                                SL: {svc.quantity}
                                                            </span>
                                                            <span className="font-bold text-slate-800 min-w-[65px] text-right">
                                                                {svc.custom_price != null
                                                                    ? `${Number(svc.custom_price).toLocaleString()}đ`
                                                                    : 'Giá chung'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!lease.service_items || lease.service_items.length === 0) && (
                                                    <span className="text-[12px] text-slate-400 italic">Không có dịch vụ đính kèm</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pt-2 mt-2 flex flex-col gap-1 text-[12px]">
                                            <div className="flex justify-between text-slate-500">
                                                <span>Bắt đầu:</span><span>{new Date(lease.start_date).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500">
                                                <span>Kết thúc:</span><span>{lease.end_date ? new Date(lease.end_date).toLocaleDateString('vi-VN') : "Không thời hạn"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CỘT PHẢI: HTML Preview */}
                        <div className={`flex-1 min-h-0 bg-slate-600 p-3 sm:p-5 flex-col items-center justify-between relative overflow-hidden ${mobileTab === "preview" ? "flex" : "hidden"} lg:flex`}>
                            <div className="w-full max-w-[700px] mb-3 shrink-0 flex gap-2.5 justify-end">
                                <button onClick={handleSharePdf} disabled={isExporting || isLoading || !previewHtml} className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
                                    <i className="fa-solid fa-share-nodes"></i> Chia sẻ
                                </button>
                                <button onClick={handleDownloadPdf} disabled={isExporting || isLoading || !previewHtml} className="px-5 py-2.5 bg-brand text-white rounded-lg text-[13px] font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-black/20 disabled:opacity-50">
                                    {isExporting ? <><i className="fa-solid fa-spinner animate-spin"></i> Đang tải...</> : <><i className="fa-solid fa-download"></i> Tải PDF</>}
                                </button>
                            </div>

                            <div className="flex-1 w-full max-w-[700px] bg-slate-100 rounded-xl shadow-2xl overflow-auto p-4 sm:p-8 border border-slate-300 border-t-4 border-t-blue-500 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                                {isLoading ? (
                                    <div className="flex flex-col justify-center items-center h-full gap-3 text-slate-500">
                                        <i className="fa-solid fa-circle-notch animate-spin text-3xl text-blue-500"></i>
                                        <p className="text-[13px] font-medium">Đang đồng bộ mẫu hợp đồng...</p>
                                    </div>
                                ) : (
                                    <div 
                                        className="preview-document-content-target bg-white mx-auto shadow-sm"
                                        style={{ width: '700px', minWidth: '700px', padding: '20px' }} 
                                        dangerouslySetInnerHTML={{ __html: previewHtml }} 
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}