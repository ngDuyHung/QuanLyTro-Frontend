import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import leasesService from "@/services/leasesService";

export default function EndLeaseModal({ open, lease, onClose, onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open || !lease) return null;

    const handleConfirm = async () => {
        try {
            setIsSubmitting(true);
            await leasesService.end(lease.id);
            toast.success("Hợp đồng đã được kết thúc thành công.");
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi kết thúc hợp đồng.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-white w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out] relative">
                
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
                            <i className="fa-solid fa-door-open text-[16px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-800">Kết thúc hợp đồng thuê</h2>
                            <p className="text-[12px] font-medium text-slate-500 mt-0.5">Phòng: {lease.room?.name} - {lease.tenant?.full_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Nội dung cảnh báo */}
                <div className="p-5 bg-slate-50">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
                        <div className="flex items-start gap-3">
                            <i className="fa-solid fa-circle-exclamation text-amber-500 text-xl mt-0.5"></i>
                            <div className="text-[13px] text-slate-600 leading-relaxed">
                                <p className="font-bold text-slate-800 mb-1">Lưu ý trước khi thực hiện:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Trạng thái hợp đồng sẽ chuyển thành <strong>Đã kết thúc</strong>.</li>
                                    <li>Trạng thái phòng sẽ được chuyển về <strong>Trống</strong>.</li>
                                    <li>Toàn bộ cư dân trong hợp đồng sẽ được ghi nhận là <strong>Đã rời đi</strong>.</li>
                                    <li>Bạn nên thực hiện <strong>Chốt hóa đơn cuối</strong> trước khi bấm kết thúc.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-[12px] text-red-600 font-medium text-center italic">
                            Hành động này không thể hoàn tác sau khi xác nhận.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 px-5 py-4 bg-white flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        disabled={isSubmitting} 
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-bold hover:bg-slate-200 transition-colors disabled:opacity-70"
                    >
                        Bỏ qua
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={isSubmitting} 
                        className="px-6 py-2 bg-amber-600 text-white rounded-lg text-[13px] font-bold hover:bg-amber-700 flex items-center gap-2 transition-all shadow-md shadow-amber-600/20 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <><i className="fa-solid fa-spinner animate-spin"></i> Đang xử lý...</>
                        ) : (
                            <><i className="fa-solid fa-check-double"></i> Xác nhận kết thúc</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}