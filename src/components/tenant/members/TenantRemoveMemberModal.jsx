import React, { useState } from "react";
import { toast } from "react-toastify";
import tenantMemberService from "@/services/tenantMemberService";

export default function TenantRemoveMemberModal({ open, member, onClose, onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!open || !member) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await tenantMemberService.remove(member.tenant_id);
            toast.success(`Đã ghi nhận ${member.tenant?.full_name || 'thành viên'} rời phòng.`);
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-2xl flex flex-col shadow-2xl p-6 text-center animate-[zoomIn_0.2s_ease-out]">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-3xl mx-auto mb-4">
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </div>
                <h2 className="text-[18px] font-bold text-slate-800 mb-2">Xác nhận rời phòng</h2>
                <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
                    Bạn có chắc chắn ghi nhận <strong>{member.tenant?.full_name || member.full_name}</strong> đã rời khỏi phòng không? <br/>Hành động này không thể hoàn tác.
                </p>
                
                <div className="flex gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-bold hover:bg-slate-200">Hủy</button>
                    <button onClick={handleConfirm} disabled={isSubmitting} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-[13px] font-bold hover:bg-red-600 flex items-center justify-center gap-2 shadow-sm">
                        {isSubmitting ? <i className="fa-solid fa-spinner fa-spin"></i> : "Xác nhận"}
                    </button>
                </div>
            </div>
        </div>
    );
}