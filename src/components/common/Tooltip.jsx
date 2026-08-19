import React, { useState, useEffect, useRef } from 'react';

export default function Tooltip({ content, children }) {
    const [isOpen, setIsOpen] = useState(false);
    const tooltipRef = useRef(null);

    // Bật/tắt Tooltip khi click
    const toggleTooltip = (e) => {
        e.stopPropagation(); // Ngăn chặn nổi bọt sự kiện
        setIsOpen(!isOpen);
    };

    // Tự động đóng Tooltip khi người dùng bấm ra vùng ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div 
            className="relative inline-flex items-center align-middle cursor-pointer" 
            ref={tooltipRef} 
            onClick={toggleTooltip}
        >
            {/* Nếu có truyền children (như nút [Xem]), thì render children. Nếu không, hiển thị icon (?) mặc định */}
            {children ? children : (
                <i className={`fa-regular fa-circle-question transition-colors ml-1.5 text-[13px] ${isOpen ? 'text-[#0e8b4d]' : 'text-slate-400 hover:text-slate-600'}`}></i>
            )}

            {/* Popover hiển thị nội dung */}
            {isOpen && (
                <div 
                    className="absolute bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 w-max max-w-[250px] sm:max-w-[300px] bg-slate-800 text-white text-[12px] md:text-[13px] leading-relaxed p-3 rounded-xl shadow-2xl z-[999] font-normal normal-case tracking-normal whitespace-normal text-left animate-[fadeIn_0.2s_ease-out]"
                    onClick={(e) => e.stopPropagation()} // Bấm vào trong tooltip không bị tắt
                >
                    {content}
                    {/* Mũi tên trỏ xuống */}
                    <div className="absolute top-full left-4 sm:left-1/2 sm:-translate-x-1/2 border-[6px] border-transparent border-t-slate-800"></div>
                </div>
            )}
        </div>
    );
}