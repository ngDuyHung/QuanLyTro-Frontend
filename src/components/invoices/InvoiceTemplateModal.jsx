import React, { useState, useEffect, useRef } from "react";
import JoditEditor from "jodit-react";
import { toast } from "react-toastify";
import settingService from "@/services/settingService";

const shortcodes = [
    { label: "Mã hóa đơn", code: "{{INVOICE_CODE}}" },
    { label: "Trạng thái hóa đơn", code: "{{STATUS}}" },
    { label: "Kỳ hóa đơn", code: "{{MONTH_YEAR}}" },
    { label: "Ngày lập", code: "{{CREATED_DATE}}" },
    { label: "Hạn thanh toán", code: "{{DUE_DATE}}" },
    { label: "Tên chủ trọ", code: "{{LANDLORD_NAME}}" },
    { label: "SĐT chủ trọ", code: "{{LANDLORD_PHONE}}" },
    { label: "Tên khách thuê", code: "{{TENANT_NAME}}" },
    { label: "SĐT khách", code: "{{TENANT_PHONE}}" },
    { label: "Tên phòng", code: "{{ROOM_NAME}}" },
    { label: "Khu nhà", code: "{{PROPERTY_NAME}}" },
    { label: "Tổng tiền phí", code: "{{SUBTOTAL}}" },
    { label: "Giảm trừ", code: "{{DISCOUNT}}" },
    { label: "Tổng cộng", code: "{{TOTAL_AMOUNT}}" },
    { label: "Đã thanh toán", code: "{{PAID_AMOUNT}}" },
    { label: "Còn nợ", code: "{{REMAINING_AMOUNT}}" },
    { label: "BẢNG CHI TIẾT PHÍ", code: "{{INVOICE_ITEMS_TABLE}}" },
];

export default function InvoiceTemplateModal({ open, onClose }) {
    const editor = useRef(null);
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) fetchTemplate();
    }, [open]);

    const fetchTemplate = async () => {
        setIsLoading(true);
        try {
            const response = await settingService.getInvoiceTemplate();
            setContent(response.data?.data?.template || "");
        } catch (error) {
            toast.error("Không thể tải mẫu hóa đơn.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Ép kiểu chắc chắn là string (nếu null/undefined thì truyền chuỗi rỗng) để tránh lỗi PHP 500
            const payloadContent = content || ""; 
            await settingService.saveInvoiceTemplate({ template: payloadContent });
            toast.success("Đã lưu cấu hình mẫu hóa đơn thành công!");
            onClose();
        } catch (error) {
            toast.error("Có lỗi xảy ra khi lưu mẫu.");
        } finally {
            setIsSaving(false);
        }
    };

    // Đã copy Full bộ thanh công cụ mượt mà từ Contract sang
    const config = {
        readonly: false,
        height: 500,
        placeholder: "Soạn thảo nội dung phiếu thu/hóa đơn...",
        buttons: "bold,italic,underline,strikethrough,eraser,ul,ol,font,fontsize,paragraph,lineHeight,superscript,subscript,classSpan,file,image,video,spellcheck,cut,copy,paste,selectall,copyformat,hr,table,link,symbols,indent,outdent,left,brush,undo,redo,find,source,fullsize,preview,print",
        language: "vi"
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
            {/* Đã cập nhật class animate-in fade-in zoom-in-95 giống hệt Hợp đồng */}
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-[18px] font-bold text-slate-800">Cấu hình mẫu phiếu in hóa đơn</h2>
                        <p className="text-[13px] text-slate-500 mt-0.5">Sử dụng công cụ soạn thảo để thiết kế mẫu phiếu thu tiền phòng.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64 text-brand">
                            <i className="fa-solid fa-spinner animate-spin text-2xl"></i>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Editor */}
                            <div className="flex-1 bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
                                <JoditEditor 
                                    ref={editor} 
                                    value={content} 
                                    config={config} 
                                    onBlur={(newContent) => setContent(newContent || "")} 
                                />
                            </div>

                            {/* Shortcodes Sidebar */}
                            <div className="w-full lg:w-[280px] shrink-0 bg-white border border-slate-200 rounded-lg p-4 h-fit shadow-sm">
                                <h3 className="font-semibold text-slate-700 mb-3 text-[14px]">
                                    <i className="fa-solid fa-code text-brand mr-2"></i>Biến tự động điền
                                </h3>
                                <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
                                    Copy mã bên dưới dán vào vị trí muốn hiển thị dữ liệu trên hóa đơn. Đặc biệt mã <strong className="text-brand">BẢNG CHI TIẾT PHÍ</strong> sẽ tự động tạo bảng các khoản tiền điện, nước, phòng...
                                </p>
                                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                                    {shortcodes.map((item, idx) => (
                                        <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                                            <span className="text-[12px] font-medium text-slate-600">{item.label}</span>
                                            <code className="text-[11px] bg-slate-100 text-pink-600 px-2 py-1.5 rounded select-all cursor-copy font-mono block truncate">
                                                {item.code}
                                            </code>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 shrink-0 bg-white">
                    <button onClick={onClose} disabled={isSaving} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors">
                        Đóng
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 flex items-center gap-2">
                        {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                        Lưu mẫu
                    </button>
                </div>
            </div>
        </div>
    );
}