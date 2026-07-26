import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantMemberService from "@/services/tenantMemberService";

export default function TenantEditMemberModal({ open, member, onClose, onSuccess }) {
    const [formData, setFormData] = useState({});
    const [frontImg, setFrontImg] = useState(null);
    const [backImg, setBackImg] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && member) {
            setFormData({
                full_name: member.tenant?.full_name || member.full_name || "",
                phone: member.tenant?.phone || member.phone || "",
                id_card_number: member.tenant?.id_card_number || member.cccd || "",
                relationship: member.relationship || "friend",
                move_in_date: member.move_in_date ? member.move_in_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
                note: member.note || ""
            });
            // Nếu có URL ảnh cũ, biến nó thành object có URL để hiện
            setFrontImg(member.tenant?.id_card_front_image ? { preview: member.tenant.id_card_front_image, isOld: true } : null);
            setBackImg(member.tenant?.id_card_back_image ? { preview: member.tenant.id_card_back_image, isOld: true } : null);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [open, member]);

    const handleImageUpload = async (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'front') {
            setFrontImg(Object.assign(file, { preview: URL.createObjectURL(file), isOld: false }));
            setIsScanning(true);
            try {
                const res = await tenantMemberService.scanIdCard(file);
                const { full_name, id_card_number } = res.data?.data || res.data;
                if (full_name || id_card_number) {
                    setFormData(prev => ({ ...prev, full_name: full_name || prev.full_name, id_card_number: id_card_number || prev.id_card_number }));
                    toast.success("Cập nhật số CCCD từ ảnh!");
                }
            } catch (error) {} finally { setIsScanning(false); }
        } else {
            setBackImg(Object.assign(file, { preview: URL.createObjectURL(file), isOld: false }));
        }
        e.target.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append("_method", "PUT"); // Laravel requires PUT simulation via POST
            Object.keys(formData).forEach(key => formData[key] && data.append(key, formData[key]));
            if (frontImg && !frontImg.isOld) data.append("id_card_front_image", frontImg);
            if (backImg && !backImg.isOld) data.append("id_card_back_image", backImg);

            // Vì update vào member, cần truyền id của tenant
            await tenantMemberService.update(member.tenant_id, data);
            toast.success("Cập nhật thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-[17px] font-bold text-slate-800">Sửa thông tin thành viên</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center aspect-[1.6/1] overflow-hidden hover:border-brand transition-colors group">
                            {frontImg ? <img src={frontImg.preview} className="w-full h-full object-cover" /> : (
                                <div className="text-center p-4"><i className="fa-solid fa-camera text-2xl text-slate-300 mb-2"></i><p className="text-[11px] font-medium text-slate-500">Đổi CCCD Trước</p></div>
                            )}
                            {isScanning && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><i className="fa-solid fa-spinner animate-spin text-brand text-2xl"></i></div>}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'front')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center aspect-[1.6/1] overflow-hidden hover:border-brand transition-colors group">
                            {backImg ? <img src={backImg.preview} className="w-full h-full object-cover" /> : (
                                <div className="text-center p-4"><i className="fa-solid fa-camera text-2xl text-slate-300 mb-2"></i><p className="text-[11px] font-medium text-slate-500">Đổi CCCD Sau</p></div>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'back')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                            <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:border-brand outline-none" />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                            <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:border-brand outline-none" />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 mb-1">Số CCCD <span className="text-red-500">*</span></label>
                            <input required type="text" value={formData.id_card_number} onChange={e => setFormData({...formData, id_card_number: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:border-brand outline-none" />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-slate-600 mb-1">Mối quan hệ <span className="text-red-500">*</span></label>
                            <select value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:border-brand outline-none bg-white">
                                <option value="friend">Bạn bè / Ở ghép</option>
                                <option value="spouse">Vợ / Chồng</option>
                                <option value="child">Con cái</option>
                                <option value="parent">Bố / Mẹ</option>
                                <option value="sibling">Anh / Chị / Em</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-[12px] font-bold text-slate-600 mb-1">Ghi chú thêm</label>
                            <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] focus:border-brand outline-none" />
                        </div>
                    </div>
                </form>
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-600 hover:bg-slate-50">Hủy</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-brand text-white rounded-lg text-[13px] font-bold shadow-sm flex items-center gap-2">
                        {isSubmitting && <i className="fa-solid fa-spinner fa-spin"></i>} Cập nhật
                    </button>
                </div>
            </div>
        </div>
    );
}