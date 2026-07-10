import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import accountingLedgerService from "@/services/accountingLedgerService";
import settingService from "@/services/settingService";

export default function ViewLedgerModal({ open, ledger, onClose }) {
    const [htmlContent, setHtmlContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (open && ledger) {
            fetchPreviewHtml();
        }
    }, [open, ledger]);

    const fetchPreviewHtml = async () => {
        try {
            setIsLoading(true);
            const res = await accountingLedgerService.getPreviewHtml(ledger.id);
            setHtmlContent(res.data.data.html);
        } catch (error) {
            toast.error("Không thể tải bản xem trước sổ kế toán.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPdf = async () => {
        try {
            setIsExporting(true);
            const blob = await settingService.exportLedgerPdf(ledger.id);
            const url = window.URL.createObjectURL(new Blob([blob.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `So_Ke_Toan_S1a_HKD_${ledger.period_year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Không thể xuất file PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    if (!open || !ledger) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 transition-all">
            <div className="bg-slate-100 w-full h-full sm:h-[92vh] sm:max-w-[850px] sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                
                {/* Header Toolbar */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <i className="fa-solid fa-print text-[14px] sm:text-[16px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[14px] sm:text-[16px] font-bold text-slate-800 leading-tight">Bản xem trước văn bản</h2>
                            <p className="text-[11px] sm:text-[12px] text-slate-500 mt-0.5">Mẫu sổ S1a-HKD chuẩn Bộ Tài Chính</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <i className="fa-solid fa-xmark text-[14px]"></i>
                    </button>
                </div>

                {/* Khu vực giấy ảo */}
                <div className="flex-1 overflow-y-auto bg-slate-200/70 p-2 sm:p-6 flex justify-start sm:justify-center items-start">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center w-full h-full py-20 gap-3 text-slate-400">
                            <i className="fa-solid fa-spinner animate-spin text-3xl text-brand"></i>
                            <p className="text-[13px] font-medium text-slate-500">Đang tạo khuôn mẫu giấy...</p>
                        </div>
                    ) : (
                        <div className="bg-white mx-auto shadow-xl border border-slate-300/60 w-full max-w-[794px] min-h-full sm:min-h-[1123px] p-4 sm:p-10 md:p-12 overflow-x-auto sm:rounded-sm relative">
                            
                            {/* Ép CSS để phục hồi đường viền bảng bị Tailwind ẩn mất */}
                            <style>{`
                                .ledger-html-render table[border="1"] {
                                    border: 1px solid black !important;
                                }
                                .ledger-html-render table[border="1"] th,
                                .ledger-html-render table[border="1"] td {
                                    border: 1px solid black !important;
                                }
                            `}</style>

                            {/* Nội dung HTML được inject từ Backend */}
                            <div 
                                className="ledger-html-render min-w-[650px] sm:min-w-0 text-black selection:bg-blue-100"
                                dangerouslySetInnerHTML={{ __html: htmlContent }} 
                            />
                            
                        </div>
                    )}
                </div>

                {/* Footer Toolbar */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white border-t border-slate-200 flex justify-end items-center gap-3 shrink-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-100 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-200 transition-colors"
                    >
                        Đóng lại
                    </button>
                    <button 
                        onClick={handleExportPdf} 
                        disabled={isExporting || isLoading} 
                        className="px-5 py-2 sm:px-6 sm:py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-opacity-90 flex items-center gap-2 shadow-sm disabled:opacity-60 transition-colors"
                    >
                        {isExporting ? (
                            <i className="fa-solid fa-spinner animate-spin"></i>
                        ) : (
                            <i className="fa-solid fa-download"></i>
                        )}
                        Tải file PDF
                    </button>
                </div>

            </div>
        </div>
    );
}