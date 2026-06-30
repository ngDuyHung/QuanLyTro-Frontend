import React, { useState, useEffect, useRef } from "react";
import JoditEditor from "jodit-react";
import { toast } from "react-toastify";
import settingService from "@/services/settingService";

const shortcodes = [
    { label: "Tên chủ trọ", code: "{{LANDLORD_NAME}}" },
    { label: "SĐT chủ trọ", code: "{{LANDLORD_PHONE}}" },
    { label: "Tên khách thuê", code: "{{TENANT_NAME}}" },
    { label: "CCCD khách thuê", code: "{{TENANT_CCCD}}" },
    { label: "SĐT khách thuê", code: "{{TENANT_PHONE}}" },
    { label: "Tên phòng", code: "{{ROOM_NAME}}" },
    { label: "Tên khu nhà", code: "{{PROPERTY_NAME}}" },
    { label: "Địa chỉ khu", code: "{{PROPERTY_ADDRESS}}" }, 
    { label: "Ngày bắt đầu ở", code: "{{START_DATE}}" }, 
    { label: "Giá thuê", code: "{{ROOM_PRICE}}" },
    { label: "Tiền cọc", code: "{{DEPOSIT}}" },
    { label: "Danh sách dịch vụ & Giá", code: "{{SERVICES_LIST}}" },
    { label: "Ngày, tháng, năm", code: "{{CURRENT_DAY}}, {{CURRENT_MONTH}}, {{CURRENT_YEAR}}" },
];

export default function ContractTemplateModal({ open, onClose }) {
    const editor = useRef(null);
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            fetchTemplate();
        }
    }, [open]);

    const fetchTemplate = async () => {
        setIsLoading(true);
        try {
            const response = await settingService.getContractTemplate();
            setContent(response.data?.data?.template || "");
        } catch (error) {
            console.error("Lỗi khi tải mẫu hợp đồng", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await settingService.saveContractTemplate({ template: content });
            toast.success("Đã lưu cấu hình mẫu hợp đồng thành công!");
            onClose();
        } catch (error) {
            console.error("Lỗi lưu mẫu", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Cấu hình thanh công cụ Jodit
    const config = {
        readonly: false,
        height: 500,
        placeholder: "Soạn thảo nội dung hợp đồng...",
        buttons: "bold,italic,underline,strikethrough,eraser,ul,ol,font,fontsize,paragraph,lineHeight,superscript,subscript,classSpan,file,image,video,spellcheck,cut,copy,paste,selectall,copyformat,hr,table,link,symbols,indent,outdent,left,brush,undo,redo,find,source,fullsize,preview,print",
        language: "vi"
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Cấu hình mẫu hợp đồng</h2>
                        <p className="text-[13px] text-slate-500 mt-0.5">Soạn thảo và thiết kế mẫu hợp đồng cho khu trọ của bạn.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
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
                            {/* Editor Area */}
                            <div className="flex-1 bg-white">
                                <JoditEditor
                                    ref={editor}
                                    value={content}
                                    config={config}
                                    onBlur={(newContent) => setContent(newContent)}
                                />
                            </div>

                            {/* Shortcodes Sidebar */}
                            <div className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-lg p-4 h-fit">
                                <h3 className="font-semibold text-slate-700 mb-3 text-[14px]">
                                    <i className="fa-solid fa-code text-brand mr-2"></i>Các biến tự động
                                </h3>
                                <p className="text-[12px] text-slate-500 mb-4">
                                    Copy và dán các mã sau vào vị trí tương ứng trong hợp đồng. Hệ thống sẽ tự động điền dữ liệu thật khi in PDF.
                                </p>
                                <div className="space-y-3">
                                    {shortcodes.map((item, idx) => (
                                        <div key={idx} className="flex flex-col gap-1">
                                            <span className="text-[12px] font-medium text-slate-600">{item.label}</span>
                                            <code className="text-[11px] bg-slate-100 text-pink-600 px-2 py-1 rounded select-all cursor-copy font-mono">
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
                    <button onClick={onClose} disabled={isSaving} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors">
                        Hủy
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 flex items-center justify-center gap-2">
                        {isSaving && <i className="fa-solid fa-spinner animate-spin"></i>}
                        Lưu mẫu hợp đồng
                    </button>
                </div>
            </div>
        </div>
    );
}