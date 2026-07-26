import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantProfileService from "@/services/tenantProfileService";

export default function TenantAccountPage() {
    // Đã xóa useAuth ở đây
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fullScreenImage, setFullScreenImage] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const res = await tenantProfileService.getProfile();
                setProfile(res.data?.data || res.data);
            } catch (error) {
                toast.error("Không thể tải thông tin hồ sơ của bạn.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50 text-brand">
                <i className="fa-solid fa-circle-notch animate-spin text-3xl mb-3"></i>
                <p className="text-[14px] font-medium text-slate-500">Đang tải thông tin tài khoản...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50">
                <i className="fa-solid fa-id-card-clip text-5xl text-slate-300 mb-4"></i>
                <h2 className="text-[18px] font-bold text-slate-700 mb-1">Chưa liên kết hồ sơ</h2>
                <p className="text-[13px] text-slate-500 max-w-md text-center">Tài khoản của bạn hiện chưa được gắn với hồ sơ khách thuê nào. Vui lòng liên hệ Chủ trọ để được cập nhật vào hệ thống.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-8 flex flex-col h-full bg-slate-50">
            
            <div className="mb-6 shrink-0">
                <h1 className="text-[22px] font-bold text-slate-800">Tài khoản của tôi</h1>
                <p className="text-[13px] text-slate-500 mt-1">Quản lý thông tin định danh và bảo mật tài khoản.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* CARD 1: THÔNG TIN TÀI KHOẢN (USER) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-brand/10 text-brand flex items-center justify-center text-3xl mb-4">
                        <i className="fa-solid fa-user-shield"></i>
                    </div>
                    {/* Dùng trực tiếp profile.full_name */}
                    <h2 className="text-[18px] font-bold text-slate-800">{profile.full_name}</h2>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[11px] font-bold mt-2">Khách thuê phòng</span>
                    
                    <div className="w-full mt-6 space-y-3 text-left">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[13px] text-slate-500 flex items-center gap-2"><i className="fa-solid fa-phone text-slate-400"></i> Đăng nhập</span>
                            {/* Dùng trực tiếp profile.phone */}
                            <span className="text-[13px] font-bold text-slate-800">{profile.phone}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[13px] text-slate-500 flex items-center gap-2"><i className="fa-solid fa-comment-dots text-slate-400"></i> Zalo</span>
                            {/* Kiểm tra zalo_id thông qua relationship user */}
                            {profile.user?.zalo_id ? (
                                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Đã liên kết</span>
                            ) : (
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded">Chưa liên kết</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* CARD 2: THÔNG TIN ĐỊNH DANH (TENANT) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-[15px] font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
                        <i className="fa-regular fa-id-card text-brand"></i> Hồ sơ lưu trú
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Họ và tên</label>
                            <div className="text-[14px] font-bold text-slate-800">{profile.full_name}</div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Số điện thoại liên hệ</label>
                            <div className="text-[14px] font-medium text-slate-800">{profile.phone}</div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                            <div className="text-[14px] font-medium text-slate-800">{profile.email || <span className="italic text-slate-400">Chưa cập nhật</span>}</div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Số CMND / CCCD</label>
                            <div className="text-[14px] font-bold text-brand">{profile.id_card_number}</div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Hình ảnh giấy tờ (Đã cung cấp)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Mặt trước */}
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col items-center">
                                <span className="text-[12px] font-semibold text-slate-600 mb-2">Mặt trước CCCD</span>
                                <div className="w-full aspect-[1.6/1] bg-slate-200 rounded-lg overflow-hidden relative group">
                                    {profile.id_card_front_image ? (
                                        <>
                                            <img src={profile.id_card_front_image} alt="Mặt trước" className="w-full h-full object-cover" />
                                            <div 
                                                onClick={() => setFullScreenImage(profile.id_card_front_image)}
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                                            >
                                                <i className="fa-solid fa-magnifying-glass-plus text-white text-2xl"></i>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400"><i className="fa-regular fa-image text-3xl"></i></div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Mặt sau */}
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col items-center">
                                <span className="text-[12px] font-semibold text-slate-600 mb-2">Mặt sau CCCD</span>
                                <div className="w-full aspect-[1.6/1] bg-slate-200 rounded-lg overflow-hidden relative group">
                                    {profile.id_card_back_image ? (
                                        <>
                                            <img src={profile.id_card_back_image} alt="Mặt sau" className="w-full h-full object-cover" />
                                            <div 
                                                onClick={() => setFullScreenImage(profile.id_card_back_image)}
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                                            >
                                                <i className="fa-solid fa-magnifying-glass-plus text-white text-2xl"></i>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400"><i className="fa-regular fa-image text-3xl"></i></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                        <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                        <p className="text-[12px] text-blue-700 leading-relaxed">
                            Thông tin này được quản lý bởi Chủ trọ. Nếu phát hiện sai sót hoặc có nhu cầu cập nhật hồ sơ, vui lòng liên hệ trực tiếp với Chủ trọ để được điều chỉnh.
                        </p>
                    </div>

                </div>
            </div>

            {/* OVERLAY ZOOM ẢNH */}
            {fullScreenImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-10 cursor-zoom-out animate-[fadeIn_0.2s_ease-out]" 
                    onClick={() => setFullScreenImage(null)}
                >
                    <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-3xl sm:text-4xl hover:text-gray-300 transition-colors w-12 h-12 flex items-center justify-center">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    <img 
                        src={fullScreenImage} 
                        alt="Phóng to CCCD" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-[zoomIn_0.2s_ease-out]" 
                    />
                </div>
            )}
        </div>
    );
}