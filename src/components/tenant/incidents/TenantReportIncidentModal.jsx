import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import tenantIncidentService from "@/services/tenantIncidentService";

const initialForm = { title: "", description: "", category: "furniture", priority: "normal" };

export default function TenantReportIncidentModal({ open, onClose, onSuccess }) {
    const [form, setForm] = useState(initialForm);
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setForm(initialForm);
            setFiles([]);
            setPreviews([]);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
            previews.forEach(p => URL.revokeObjectURL(p));
        };
    }, [open]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            return toast.warning("Chỉ được tải lên tối đa 5 ảnh.");
        }
        setFiles(prev => [...prev, ...selectedFiles]);
        setPreviews(prev => [...prev, ...selectedFiles.map(f => URL.createObjectURL(f))]);
        e.target.value = "";
    };

    const removeImage = (index) => {
        URL.revokeObjectURL(previews[index]);
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return toast.warning("Vui lòng nhập tiêu đề sự cố.");

        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append("title", form.title);
            payload.append("description", form.description);
            payload.append("category", form.category);
            payload.append("priority", form.priority);
            files.forEach(file => payload.append("images[]", file));

            await tenantIncidentService.create(payload);
            toast.success("Báo cáo sự cố thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi gửi báo cáo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 transition-all">
            <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl animate-[slideUp_0.3s_ease-out]">
                
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
                    <h2 className="text-[17px] font-bold text-red-600 flex items-center gap-2"><i className="fa-solid fa-triangle-exclamation"></i> Báo cáo sự cố</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="w-8 h-8 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><i className="fa-solid fa-xmark"></i></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-1">Tiêu đề (Tóm tắt lỗi) <span className="text-red-500">*</span></label>
                        <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="VD: Bồn cầu bị nghẹt nước" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] focus:border-red-400 focus:outline-none" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-bold text-slate-700 mb-1">Khu vực / Loại lỗi <span className="text-red-500">*</span></label>
                            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] focus:border-red-400 focus:outline-none">
                                <option value="electrical">Điện (Bóng đèn, chập chờn...)</option>
                                <option value="water">Nước (Ống vỡ, bồn cầu...)</option>
                                <option value="furniture">Nội thất (Giường, tủ, cửa...)</option>
                                <option value="security">An ninh (Ổ khóa, cửa nẻo...)</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold text-slate-700 mb-1">Độ ưu tiên xử lý <span className="text-red-500">*</span></label>
                            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] focus:border-red-400 focus:outline-none">
                                <option value="low">Thấp (Có thể đợi)</option>
                                <option value="normal">Bình thường</option>
                                <option value="high">Cao (Cần sớm)</option>
                                <option value="emergency">Khẩn cấp (Ngay lập tức)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-1">Mô tả chi tiết</label>
                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Mô tả cụ thể tình trạng để thợ chuẩn bị đồ nghề..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] focus:border-red-400 focus:outline-none min-h-[80px]"></textarea>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-[13px] font-bold text-slate-700">Ảnh đính kèm (Tối đa 5 ảnh)</label>
                            <span className="text-[11px] text-slate-400">{files.length}/5 ảnh</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {previews.map((src, idx) => (
                                <div key={idx} className="w-20 h-20 bg-black rounded-lg relative overflow-hidden group border border-slate-200">
                                    <img src={src} alt="Preview" className="w-full h-full object-cover opacity-80" />
                                    <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white"><i className="fa-solid fa-trash"></i></button>
                                </div>
                            ))}
                            {files.length < 5 && (
                                <button type="button" onClick={() => fileInputRef.current.click()} className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors">
                                    <i className="fa-solid fa-plus mb-1"></i><span className="text-[10px] font-semibold">Thêm ảnh</span>
                                </button>
                            )}
                            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        </div>
                    </div>
                </form>

                <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-bold">Hủy</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-red-500 text-white rounded-lg text-[13px] font-bold hover:bg-red-600 flex items-center gap-2">
                        {isSubmitting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>} Gửi báo cáo
                    </button>
                </div>
            </div>
        </div>
    );
}