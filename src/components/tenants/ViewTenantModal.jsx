import React, { useEffect } from "react";

// Hàm helper để render nhãn trạng thái lịch sử
const getHistoryStatusConfig = (status) => {
    switch (status) {
        case "active":
            return { label: "Đang ở", className: "bg-emerald-50 text-emerald-600 border-emerald-200" };
        case "pending":
            return { label: "Chờ duyệt", className: "bg-amber-50 text-amber-600 border-amber-200" };
        case "left":
            return { label: "Đã rời đi", className: "bg-rose-50 text-rose-500 border-rose-200" };
        default:
            return { label: "Chưa rõ", className: "bg-slate-100 text-slate-500 border-slate-200" };
    }
};

// Hàm lấy chữ cái đầu làm Avatar
const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
};

export default function ViewTenantModal({ open, tenant, onClose }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open || !tenant) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 md:p-6 transition-all duration-300">
            {/* Modal Container: Mobile tràn viền dưới lên, PC bo góc giữa màn hình */}
            <div className="bg-slate-50 w-full sm:rounded-2xl shadow-2xl sm:max-w-[1000px] flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] animate-slide-up sm:animate-fade-in overflow-hidden relative rounded-t-2xl">

                {/* Header - Sticky */}
                <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[16px] shrink-0 border border-brand/20">
                            {getInitial(tenant.full_name)}
                        </div>
                        <div>
                            <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-800 leading-tight line-clamp-1">
                                {tenant.full_name}
                            </h2>
                            <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">
                                Hồ sơ khách thuê chi tiết
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors w-9 h-9 flex items-center justify-center rounded-full"
                        aria-label="Đóng"
                    >
                        <i className="fa-solid fa-xmark text-[20px]"></i>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT (7 phần) */}
                        <div className="lg:col-span-7 flex flex-col gap-6">

                            {/* 1. Tổng quan liên hệ */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                    <i className="fa-regular fa-address-card text-brand"></i>
                                    <h3 className="text-[14px] font-bold text-slate-800">Thông tin cá nhân</h3>
                                </div>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[12px] text-slate-500 font-medium">Số điện thoại</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px] font-semibold text-slate-800">{tenant.phone || "—"}</span>
                                            {tenant.phone && (
                                                <a href={`tel:${tenant.phone}`} className="text-brand hover:text-green-700 bg-green-50 w-6 h-6 rounded flex items-center justify-center transition-colors">
                                                    <i className="fa-solid fa-phone text-[10px]"></i>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[12px] text-slate-500 font-medium">CCCD / CMND</span>
                                        <span className="text-[14px] font-semibold text-slate-800">{tenant.id_card_number || "—"}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 sm:col-span-2">
                                        <span className="text-[12px] text-slate-500 font-medium">Email</span>
                                        <span className="text-[14px] font-semibold text-slate-800">{tenant.email || "Chưa cập nhật"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Cư trú hiện tại */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                    <i className="fa-solid fa-house-user text-blue-500"></i>
                                    <h3 className="text-[14px] font-bold text-slate-800">Trạng thái cư trú hiện tại</h3>
                                </div>
                                <div className="p-4">
                                    {tenant.current_residence ? (
                                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[12px] text-slate-500 font-medium">Khu nhà</span>
                                                    <span className="text-[14px] font-bold text-slate-800 line-clamp-1">{tenant.current_residence?.room?.property?.name || "—"}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[12px] text-slate-500 font-medium">Phòng</span>
                                                    <span className="text-[14px] font-bold text-slate-800">{tenant.current_residence?.room?.name || "—"}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[12px] text-slate-500 font-medium">Ngày vào ở</span>
                                                    <span className="text-[13px] font-semibold text-slate-700">{tenant.current_residence?.move_in_date || "—"}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[12px] text-slate-500 font-medium">Vai trò</span>
                                                    <div>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${tenant.current_residence?.role === "representative" ? "bg-purple-100 text-purple-700" : "bg-slate-200 text-slate-700"}`}>
                                                            {tenant.current_residence?.role === "representative" ? "Đại diện thuê" : "Người ở ghép"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                                <i className="fa-solid fa-house-circle-xmark text-xl"></i>
                                            </div>
                                            <p className="text-[13px] text-slate-500 font-medium">Khách thuê hiện không gắn với phòng nào.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. Hình ảnh giấy tờ */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                    <i className="fa-regular fa-images text-orange-500"></i>
                                    <h3 className="text-[14px] font-bold text-slate-800">Ảnh CCCD / CMND</h3>
                                </div>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[12px] font-semibold text-slate-600 text-center uppercase tracking-wide">Mặt trước</span>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 aspect-[8/5] relative group">
                                            {tenant.id_card_front_image ? (
                                                <img src={tenant.id_card_front_image} alt="Mặt trước" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                                    <i className="fa-regular fa-image text-2xl mb-1"></i>
                                                    <span className="text-[11px]">Không có ảnh</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[12px] font-semibold text-slate-600 text-center uppercase tracking-wide">Mặt sau</span>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 aspect-[8/5] relative group">
                                            {tenant.id_card_back_image ? (
                                                <img src={tenant.id_card_back_image} alt="Mặt sau" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                                    <i className="fa-regular fa-image text-2xl mb-1"></i>
                                                    <span className="text-[11px]">Không có ảnh</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>

                        </div>

                        {/* CỘT PHẢI: NHẬT KÝ THUÊ PHÒNG (5 phần) */}
                        <div className="lg:col-span-5 flex flex-col h-full">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                    <i className="fa-solid fa-clock-rotate-left text-brand"></i>
                                    <h3 className="text-[14px] font-bold text-slate-800">Nhật ký thuê phòng</h3>
                                </div>

                                <div className="p-4 sm:p-5 flex-1">
                                    {tenant.residence_history && tenant.residence_history.length > 0 ? (
                                        <div className="relative border-l-2 border-slate-200/60 ml-[9px] space-y-6 pb-2">
                                            {tenant.residence_history.map((history, index) => {
                                                const statusConfig = getHistoryStatusConfig(history.status);
                                                const isLatest = index === 0; // Highlight record mới nhất

                                                return (
                                                    <div key={history.id} className="relative pl-6">
                                                        {/* Chấm tròn timeline */}
                                                        <div className={`absolute -left-[6px] top-1.5 w-[14px] h-[14px] rounded-full ring-4 ring-white flex items-center justify-center ${isLatest ? 'bg-brand' : 'bg-slate-300'}`}>
                                                            {isLatest && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                        </div>

                                                        {/* Card nội dung */}
                                                        <div className={`p-3.5 rounded-xl border ${isLatest ? 'bg-white border-green-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]' : 'bg-slate-50/50 border-slate-100'}`}>
                                                            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                                                <div>
                                                                    <h4 className="font-bold text-[13px] text-slate-800 leading-tight">
                                                                        Phòng {history.room_name}
                                                                    </h4>
                                                                    <span className="text-[11px] text-slate-500 mt-0.5 block line-clamp-1">
                                                                        {history.property_name}
                                                                    </span>
                                                                </div>
                                                                <span className={`px-2 py-0.5 border text-[10px] font-semibold rounded ${statusConfig.className}`}>
                                                                    {statusConfig.label}
                                                                </span>
                                                            </div>

                                                            <div className="text-[12px] text-slate-600 mt-3 grid grid-cols-1 gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <i className="fa-solid fa-calendar-check w-4 text-center text-slate-400 text-[11px]"></i>
                                                                    <span className="font-medium text-slate-700">Vào: {history.move_in_date || "—"}</span>
                                                                </div>
                                                                {history.move_out_date && (
                                                                    <div className="flex items-center gap-2">
                                                                        <i className="fa-solid fa-calendar-xmark w-4 text-center text-slate-400 text-[11px]"></i>
                                                                        <span className="text-slate-500">Rời: {history.move_out_date}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2">
                                                                    <i className="fa-solid fa-user-tag w-4 text-center text-slate-400 text-[11px]"></i>
                                                                    <span>Vai trò: {history.role === 'representative' ? 'Đại diện' : 'Ở ghép'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                <i className="fa-solid fa-clipboard-list text-2xl text-slate-300"></i>
                                            </div>
                                            <p className="text-[13px] font-medium text-slate-600">Chưa có lịch sử lưu trú</p>
                                            <p className="text-[12px] text-slate-400 mt-1 max-w-[200px]">Thông tin các phòng khách từng ở sẽ hiển thị tại đây.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer - Sticky */}
                <div className="sticky bottom-0 z-20 border-t border-slate-200 px-4 sm:px-6 py-3.5 bg-white flex justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-bold hover:bg-slate-200 transition-colors"
                    >
                        Đóng cửa sổ
                    </button>
                </div>
            </div>
        </div>
    );
}