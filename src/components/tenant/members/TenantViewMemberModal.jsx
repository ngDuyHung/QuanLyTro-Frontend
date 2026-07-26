import React, { useState } from "react";

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("vi-VN") : "—";

export default function TenantViewMemberModal({ open, member, onClose }) {
    const [fullImage, setFullImage] = useState(null);

    if (!open || !member) return null;

    const t = member.tenant || {}; // Fallback data

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-[17px] font-bold text-slate-800">Thông tin thành viên</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500"><i className="fa-solid fa-xmark text-xl"></i></button>
                </div>
                
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-brand/10 text-brand flex items-center justify-center text-2xl"><i className="fa-solid fa-user"></i></div>
                        <div>
                            <h3 className="text-[18px] font-bold text-slate-800">{t.full_name || member.full_name}</h3>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-bold mt-1 inline-block">{member.relationship_label}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 text-[13px]">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="block text-[11px] text-slate-400 font-bold mb-1 uppercase">SĐT</span><strong className="text-slate-800">{t.phone || member.phone}</strong></div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="block text-[11px] text-slate-400 font-bold mb-1 uppercase">CMND/CCCD</span><strong className="text-slate-800">{t.id_card_number || member.cccd || "—"}</strong></div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="block text-[11px] text-slate-400 font-bold mb-1 uppercase">Ngày vào ở</span><strong className="text-slate-800">{formatDate(member.move_in_date)}</strong></div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="block text-[11px] text-slate-400 font-bold mb-1 uppercase">Ghi chú</span><strong className="text-slate-800">{member.note || "—"}</strong></div>
                    </div>

                    <p className="text-[12px] font-bold text-slate-600 mb-2">Ảnh giấy tờ:</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div onClick={() => t.id_card_front_image && setFullImage(t.id_card_front_image)} className="aspect-[1.6/1] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer">
                            {t.id_card_front_image ? <img src={t.id_card_front_image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Chưa cập nhật</div>}
                        </div>
                        <div onClick={() => t.id_card_back_image && setFullImage(t.id_card_back_image)} className="aspect-[1.6/1] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer">
                            {t.id_card_back_image ? <img src={t.id_card_back_image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Chưa cập nhật</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Phóng to ảnh */}
            {fullImage && (
                <div onClick={() => setFullImage(null)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out">
                    <img src={fullImage} className="max-w-full max-h-full rounded-lg" />
                </div>
            )}
        </div>
    );
}