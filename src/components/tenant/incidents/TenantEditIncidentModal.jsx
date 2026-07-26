import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantIncidentService from "@/services/tenantIncidentService";

export default function TenantEditIncidentModal({ open, incident, onClose, onSuccess }) {
    const [form, setForm] = useState({ title: "", description: "", category: "other", priority: "normal" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && incident) {
            setForm({ title: incident.title, description: incident.description || "", category: incident.category, priority: incident.priority });
        }
    }, [open, incident]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await tenantIncidentService.update(incident.id, form); // Chỉ gửi JSON
            toast.success("Cập nhật thành công!");
            onSuccess();
            onClose();
        } catch (error) { toast.error("Có lỗi xảy ra."); }
        finally { setIsSubmitting(false); }
    };

    if (!open || !incident) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
            <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl flex flex-col overflow-hidden animate-[fadeIn_0.2s]">
                <div className="px-5 py-4 border-b flex justify-between items-center"><h2 className="font-bold text-slate-800">Sửa thông tin sự cố</h2><button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button></div>
                <div className="p-5 space-y-4">
                    <div><label className="block text-[12px] font-bold mb-1">Tiêu đề</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-[13px] outline-none" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-bold mb-1">Danh mục</label>
                            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-[13px] outline-none"><option value="electrical">Điện</option><option value="water">Nước</option><option value="furniture">Nội thất</option><option value="security">An ninh</option><option value="other">Khác</option></select>
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold mb-1">Ưu tiên</label>
                            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-[13px] outline-none"><option value="low">Thấp</option><option value="normal">Bình thường</option><option value="high">Cao</option><option value="emergency">Khẩn cấp</option></select>
                        </div>
                    </div>
                    <div><label className="block text-[12px] font-bold mb-1">Mô tả</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-[13px] outline-none min-h-[80px]"></textarea></div>
                </div>
                <div className="p-4 border-t bg-slate-50 flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-white border rounded text-[13px] font-bold">Hủy</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded text-[13px] font-bold">Lưu thay đổi</button></div>
            </form>
        </div>
    );
}