import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantInvoiceService from "@/services/tenantInvoiceService";

export default function TenantViewModal({ open, invoice: initialInvoice, onClose }) {
    const [previewHtml, setPreviewHtml] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!open || !initialInvoice?.id) {
            setPreviewHtml("");
            return;
        }

        const fetchPreview = async () => {
            setIsLoading(true);
            try {
                const res = await tenantInvoiceService.getPreviewHtml(initialInvoice.id);
                setPreviewHtml(res.data.html);
            } catch (error) {
                toast.error("Không thể tải bản in hóa đơn.");
                onClose();
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreview();
    }, [open, initialInvoice, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-slate-100 w-full max-w-3xl h-[90vh] flex flex-col rounded-xl overflow-hidden">
                <div className="flex justify-between items-center bg-white p-4 border-b">
                    <h2 className="font-bold">Biên lai điện tử</h2>
                    <button onClick={onClose}>Đóng</button>
                </div>

                <div className="flex-1 overflow-auto p-8 flex justify-center">
                    {isLoading ? (
                        <p>Đang đồng bộ mẫu phiếu...</p>
                    ) : (
                        /* TODO: Căn chỉnh UI lại giống hệt ViewInvoiceModal bên chủ nhà */
                        <div 
                            className="bg-white shadow-sm"
                            style={{ width: '700px', padding: '20px' }}
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}