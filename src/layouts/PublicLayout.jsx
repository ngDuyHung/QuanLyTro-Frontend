import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function PublicLayout() {
    const location = useLocation();
    
    // Kiểm tra xem có đang ở trang chủ (Tìm phòng) không
    const isHome = location.pathname === '/';

    return (
        <div className="flex flex-col min-h-screen font-['Inter'] bg-[#f8fafc] text-[#1e293b]">
            {/* HEADER - Nâng cấp hiệu ứng Glassmorphism (Kính mờ) */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-[72px] sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between shrink-0 transition-all">
                <Link to="/" className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 md:gap-3 relative z-10 min-w-0">
                        <img src="/icon-logo.png" alt="Logo" className="w-10 h-10 md:w-14 md:h-14 shrink-0" />
                        <div className="min-w-0">
                            <h1 className="text-[15px] md:text-xl font-bold text-[#0e8b4d] leading-tight truncate">
                                Nhà Trọ Kiêu Giang
                            </h1>
                            <p className="hidden sm:block text-[11px] md:text-xs text-slate-500 font-medium truncate">
                                Quản lý nhà trọ thông minh
                            </p>
                        </div>
                    </div>
                </Link>

                <nav className="hidden md:flex h-full items-center gap-8 shrink-0">
                    {/* Menu động: Chỉ sáng lên khi đang ở đúng trang */}
                    <Link 
                        to="/" 
                        className={`flex items-center gap-2 text-[14px] h-full pt-[3px] transition-colors ${isHome ? 'font-bold text-slate-800 border-b-[3px] border-[#0e8b4d]' : 'font-medium text-slate-500 hover:text-[#0e8b4d] border-b-[3px] border-transparent'}`}
                    >
                        <i className={`fa-solid fa-magnifying-glass text-[15px] ${isHome ? 'text-[#0e8b4d]' : 'text-slate-400'}`}></i> Tìm phòng
                    </Link>
                    <a 
                        href="#footer" 
                        className="flex items-center gap-2 text-[14px] font-medium text-slate-500 hover:text-[#0e8b4d] transition-colors h-full border-b-[3px] border-transparent"
                    >
                        <i className="fa-solid fa-headset text-slate-400 text-[15px]"></i> Hỗ trợ
                    </a>
                </nav>

                <div className="flex items-center justify-end gap-6 flex-1">
                    <Link to="/login" className="bg-[#0e8b4d] hover:bg-green-700 text-white px-3.5 md:px-4 py-2 md:py-2.5 rounded-lg text-[12px] md:text-[13px] font-bold flex items-center gap-2 transition-transform active:scale-[0.98] shadow-sm shadow-[#0e8b4d]/20 whitespace-nowrap">
                        <i className="fa-solid fa-right-to-bracket text-[13px] md:text-[14px]"></i>
                        <span className="hidden sm:inline">Đăng nhập hệ thống</span>
                        <span className="sm:hidden">Đăng nhập</span>
                    </Link>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col w-full relative z-10">
                <Outlet />
            </div>

            {/* FOOTER */}
            <footer id="footer" className="bg-white border-t border-slate-200 pt-12 pb-8 mt-auto shrink-0 relative z-20">
                <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
                    {/* Cột 1: Thông tin */}
                    <div className="flex flex-col gap-4">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/icon-logo.png" alt="Logo" className="w-10 h-10" />
                            <h2 className="text-[16px] md:text-[18px] font-bold text-[#0e8b4d]">Nhà Trọ Kiêu Giang</h2>
                        </Link>
                        <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                            Hệ thống quản lý và tìm kiếm phòng trọ thông minh. Giúp khách thuê dễ dàng tìm được không gian sống lý tưởng, minh bạch và an toàn.
                        </p>
                    </div>

                    {/* Cột 2: Liên kết */}
                    <div>
                        <h3 className="text-[15px] font-bold text-slate-800 mb-4 uppercase tracking-wide">Liên kết nhanh</h3>
                        <ul className="space-y-3 text-[13px] text-slate-500 font-medium">
                            <li>
                                <Link to="/" className="hover:text-[#0e8b4d] transition-colors flex items-center gap-2 w-fit">
                                    <i className="fa-solid fa-angle-right text-[10px] text-slate-300"></i> Tìm phòng trống
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-[#0e8b4d] transition-colors flex items-center gap-2 w-fit">
                                    <i className="fa-solid fa-angle-right text-[10px] text-slate-300"></i> Đăng nhập quản lý
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="hover:text-[#0e8b4d] transition-colors flex items-center gap-2 w-fit">
                                    <i className="fa-solid fa-angle-right text-[10px] text-slate-300"></i> Điều khoản & Chính sách
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Cột 3: Liên hệ - Tối ưu UX cho Mobile (Click-to-Call / Click-to-Mail) */}
                    <div>
                        <h3 className="text-[15px] font-bold text-slate-800 mb-4 uppercase tracking-wide">Liên hệ hỗ trợ</h3>
                        <ul className="space-y-4 text-[13px] text-slate-500 font-medium">
                            <li className="flex items-start gap-3">
                                <div className="w-6 flex justify-center shrink-0">
                                    <i className="fa-solid fa-location-dot text-[#0e8b4d] mt-0.5 text-[14px]"></i>
                                </div>
                                <span className="leading-relaxed">Thành phố Hồ Chí Minh, Việt Nam</span>
                            </li>
                            <li className="flex items-center gap-3 group w-fit">
                                <div className="w-6 flex justify-center shrink-0">
                                    <i className="fa-solid fa-phone text-[#0e8b4d] text-[14px] group-hover:animate-bounce"></i>
                                </div>
                                <a href="tel:19001234" className="hover:text-[#0e8b4d] transition-colors">1900 1234 (8:00 - 20:00)</a>
                            </li>
                            <li className="flex items-center gap-3 w-fit">
                                <div className="w-6 flex justify-center shrink-0">
                                    <i className="fa-solid fa-envelope text-[#0e8b4d] text-[14px]"></i>
                                </div>
                                <a href="mailto:hotro@kieugiang.vn" className="hover:text-[#0e8b4d] transition-colors">hotro@kieugiang.vn</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright & Social */}
                <div className="max-w-[1400px] mx-auto px-6 mt-10 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[12px] text-slate-400 font-medium text-center md:text-left">
                        © {new Date().getFullYear()} Hệ thống quản lý Nhà Trọ Kiêu Giang. All rights reserved.
                    </p>
                    <div className="flex items-center gap-5 text-slate-400">
                        {/* Thêm màu sắc nhận diện khi hover */}
                        <a href="#" className="hover:text-[#1877F2] hover:-translate-y-1 transition-all" title="Facebook">
                            <i className="fa-brands fa-facebook text-[20px]"></i>
                        </a>
                        <a href="#" className="hover:text-[#0068FF] hover:-translate-y-1 transition-all" title="Zalo">
                            {/* Bạn có thể thay fa-zalo bằng hình ảnh SVG Zalo thật nếu fontawesome không hiển thị */}
                            <i className="fa-solid fa-comment-dots text-[20px]"></i> 
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}