import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import publicService from '@/services/publicService';

// Helper format tiền tệ
const formatCurrency = (value) => {
    if (!value) return "0";
    return new Intl.NumberFormat('vi-VN').format(value);
};

// Cấu hình danh mục tiện ích map với DB
const AMENITIES_LIST = [
    { value: "air_conditioner", label: "Máy lạnh", icon: "fa-snowflake" },
    { value: "heater", label: "Nóng lạnh", icon: "fa-fire" },
    { value: "wifi", label: "Wifi", icon: "fa-wifi" },
    { value: "cooking", label: "Nấu ăn", icon: "fa-kitchen-set" },
    { value: "camera", label: "Camera", icon: "fa-video" },
    { value: "balcony", label: "Ban công", icon: "fa-sun" },
    { value: "mezzanine", label: "Gác lửng", icon: "fa-stairs" },
    { value: "parking", label: "Giữ xe", icon: "fa-motorcycle" },
    { value: "free_hours", label: "Giờ tự do", icon: "fa-clock" },
];

export default function PublicRoomSearchPage() {
    const [rooms, setRooms] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // State lưu trữ các tham số lọc UI
    const [filters, setFilters] = useState({
        location: "",
        priceRange: "", // Thay thế min_price, max_price
        areaRange: "",  // Thay thế min_area, max_area
        amenities: [],
        sort: "newest",
        page: 1,
    });

    // Hàm Build API Params từ UI Filters
    const buildApiParams = (currentFilters) => {
        const params = {
            location: currentFilters.location,
            amenities: currentFilters.amenities,
            sort: currentFilters.sort,
            page: currentFilters.page,
        };

        // Map Price Range
        if (currentFilters.priceRange === 'under_2') params.max_price = 2000000;
        if (currentFilters.priceRange === '2_to_3') { params.min_price = 2000000; params.max_price = 3000000; }
        if (currentFilters.priceRange === '3_to_5') { params.min_price = 3000000; params.max_price = 5000000; }
        if (currentFilters.priceRange === 'over_5') params.min_price = 5000000;

        // Map Area Range
        if (currentFilters.areaRange === 'under_20') params.max_area = 20;
        if (currentFilters.areaRange === '20_to_30') { params.min_area = 20; params.max_area = 30; }
        if (currentFilters.areaRange === 'over_30') params.min_area = 30;

        return params;
    };

    // Gọi API lấy dữ liệu
    const fetchRooms = async (currentFilters) => {
        setIsLoading(true);
        try {
            const apiParams = buildApiParams(currentFilters);
            const response = await publicService.getRooms(apiParams);
            setRooms(response.data.data);
            setPagination(response.data.meta);
        } catch (error) {
            console.error("Lỗi lấy danh sách phòng:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Tự động gọi API lần đầu và khi đổi trang/sắp xếp
    useEffect(() => {
        fetchRooms(filters);
    }, [filters.sort, filters.page]);

    // Hàm xử lý áp dụng bộ lọc (Khi bấm nút Lọc)
    const handleApplyFilters = () => {
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchRooms({ ...filters, page: 1 });
    };

    // Hàm Xóa lọc: Reset state và gọi API ngay lập tức
    const handleClearFilters = () => {
        const emptyFilters = {
            location: "", priceRange: "", areaRange: "", amenities: [], sort: "newest", page: 1
        };
        setFilters(emptyFilters);
        fetchRooms(emptyFilters);
    };

    // Toggle Checkbox tiện ích
    const handleToggleAmenity = (val) => {
        setFilters(prev => {
            const has = prev.amenities.includes(val);
            return {
                ...prev,
                amenities: has ? prev.amenities.filter(a => a !== val) : [...prev.amenities, val]
            };
        });
    };

    // Cuộn mượt mà đến bộ lọc bên cột phải
    const scrollToAdvancedFilter = () => {
        const filterSection = document.getElementById('advanced-filter');
        if (filterSection) {
            filterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <React.Fragment>

            {/* BANNER & THANH TÌM KIẾM NHANH */}
            <div className="bg-[#f4f7fb] pt-8 md:pt-10 pb-8 md:pb-12 px-4 md:px-8 border-b border-slate-200">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-10">

                    <div className="hidden lg:block w-[280px] shrink-0">
                        <img src="/nhatro.png" alt="nha tro" className="w-full h-auto object-contain" onError={(e) => { e.target.style.display = 'none' }} />
                    </div>

                    <div className="flex-1 flex flex-col w-full">
                        <div className="mb-6 md:mb-8 text-center md:text-left">
                            <h2 className="text-[24px] md:text-[28px] font-bold text-[#111827] mb-2 tracking-tight">Tìm phòng trọ phù hợp, nhanh chóng và dễ dàng</h2>
                            <p className="text-[14px] md:text-[15px] text-slate-500 font-medium">Hàng ngàn phòng trọ từ hệ thống của chúng tôi trên khắp thành phố</p>
                        </div>

                        {/* THANH TÌM KIẾM NGANG */}
                        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2 flex flex-col md:flex-row items-center w-full">

                            {/* Ô Địa điểm */}
                            <div className="flex-[1.5] w-full px-5 py-2 md:border-r border-slate-100 cursor-text">
                                <p className="text-[12px] font-medium text-slate-400 mb-1">Bạn muốn tìm ở đâu?</p>
                                <div className="flex items-center gap-2 relative">
                                    <i className="fa-solid fa-location-dot text-[#0e8b4d] text-[14px]"></i>
                                    <input
                                        type="text"
                                        value={filters.location}
                                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                        placeholder="Nhập khu vực, tên đường..."
                                        className="w-full text-[14px] font-semibold text-slate-700 placeholder-slate-300 bg-transparent focus:outline-none truncate"
                                    />
                                    {filters.location && (
                                        <button onClick={() => setFilters({ ...filters, location: "" })} className="absolute right-0 text-slate-300 hover:text-slate-500">
                                            <i className="fa-solid fa-circle-xmark"></i>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Ô Khoảng giá (PC) - Dropdown */}
                            <div className="hidden md:flex flex-1 flex-col justify-center px-5 py-2 border-r border-slate-100 group relative">
                                <p className="text-[12px] font-medium text-slate-400 mb-1">Khoảng giá</p>
                                <select 
                                    value={filters.priceRange} 
                                    onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                                    className="w-full text-[13px] font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer appearance-none outline-none"
                                >
                                    <option value="">Tất cả mức giá</option>
                                    <option value="under_2">Dưới 2 triệu</option>
                                    <option value="2_to_3">Từ 2 - 3 triệu</option>
                                    <option value="3_to_5">Từ 3 - 5 triệu</option>
                                    <option value="over_5">Trên 5 triệu</option>
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 mt-1.5 text-[10px] text-slate-400 pointer-events-none group-hover:text-[#0e8b4d]"></i>
                            </div>

                            {/* Ô Diện tích (PC) - Dropdown */}
                            <div className="hidden md:flex flex-1 flex-col justify-center px-5 py-2 border-r border-slate-100 group relative">
                                <p className="text-[12px] font-medium text-slate-400 mb-1">Diện tích</p>
                                <select 
                                    value={filters.areaRange} 
                                    onChange={(e) => setFilters({ ...filters, areaRange: e.target.value })}
                                    className="w-full text-[13px] font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer appearance-none outline-none"
                                >
                                    <option value="">Tất cả diện tích</option>
                                    <option value="under_20">Dưới 20 m²</option>
                                    <option value="20_to_30">Từ 20 - 30 m²</option>
                                    <option value="over_30">Trên 30 m²</option>
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 mt-1.5 text-[10px] text-slate-400 pointer-events-none group-hover:text-[#0e8b4d]"></i>
                            </div>

                            {/* Nút cuộn Lọc thêm (PC) */}
                            <button onClick={scrollToAdvancedFilter} className="hidden md:flex flex-1 px-5 py-2 group pr-6 flex-col justify-center cursor-pointer hover:bg-slate-50 transition-colors rounded-l-lg">
                                <p className="text-[12px] font-medium text-slate-400 mb-1 text-left w-full">Lọc thêm</p>
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-[13px] font-semibold text-slate-600 truncate">
                                        {filters.amenities.length > 0 ? `Đã chọn ${filters.amenities.length} tiện ích` : 'Tiện ích...'}
                                    </span>
                                    <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-[#0e8b4d]"></i>
                                </div>
                            </button>

                            <button onClick={handleApplyFilters} className="w-full md:w-auto mt-2 md:mt-0 bg-[#0e8b4d] hover:bg-green-700 text-white h-[48px] px-8 rounded-xl text-[14px] font-bold transition-colors whitespace-nowrap shrink-0 ml-1">
                                Tìm phòng
                            </button>
                        </div>

                        {/* Hỗ trợ UX Mobile: Nút mở bộ lọc nhanh */}
                        <div className="md:hidden mt-3 text-center">
                            <button onClick={scrollToAdvancedFilter} className="text-[#0e8b4d] text-[13px] font-semibold flex items-center justify-center gap-1.5 mx-auto bg-white px-4 py-2 rounded-full shadow-sm border border-[#0e8b4d]/20">
                                <i className="fa-solid fa-sliders"></i> Bộ lọc nâng cao
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-8 flex flex-col lg:flex-row gap-8 flex-1">

                {/* CỘT TRÁI: DANH SÁCH PHÒNG */}
                <div className="flex-1 flex flex-col min-h-[500px]">

                    {/* TOOLBAR SẮP XẾP */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-[18px] md:text-[20px] font-bold text-[#111827]">Phòng trọ gợi ý cho bạn</h2>
                            <span className="bg-[#e6f4eb] text-[#0e8b4d] text-[12px] font-bold px-2.5 py-1 rounded-full">{pagination?.total || 0} phòng</span>
                        </div>

                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 xl:pb-0">
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => setFilters({ ...filters, sort: 'newest' })}
                                    className={filters.sort === 'newest'
                                        ? "bg-[#e6f4eb] text-[#0e8b4d] border border-[#0e8b4d]/30 px-4 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap"
                                    }>
                                    {filters.sort === 'newest' && <i className="fa-solid fa-location-dot text-[11px]"></i>} Mới nhất
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, sort: 'price_asc' })}
                                    className={filters.sort === 'price_asc'
                                        ? "bg-[#e6f4eb] text-[#0e8b4d] border border-[#0e8b4d]/30 px-4 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap"
                                    }>
                                    Giá thấp đến cao
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, sort: 'price_desc' })}
                                    className={filters.sort === 'price_desc'
                                        ? "bg-[#e6f4eb] text-[#0e8b4d] border border-[#0e8b4d]/30 px-4 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap"
                                    }>
                                    Giá cao đến thấp
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* DANH SÁCH CARD PHÒNG */}
                    <div className="flex flex-col gap-4">
                        {isLoading ? (
                            /* SKELETON LOADING UI */
                            Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-5 shadow-sm animate-pulse">
                                    <div className="w-full md:w-[260px] h-[200px] md:h-[160px] shrink-0 flex gap-1 relative rounded-lg overflow-hidden">
                                        <div className="w-[65%] h-full bg-slate-200"></div>
                                        <div className="w-[35%] h-full flex flex-col gap-1">
                                            <div className="h-1/2 bg-slate-200"></div>
                                            <div className="h-1/2 bg-slate-200"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col sm:flex-row justify-between gap-4">
                                        <div className="flex flex-col justify-between py-0.5 flex-1">
                                            <div>
                                                <div className="h-5 bg-slate-200 rounded-md w-3/4 mb-3"></div>
                                                <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                                                <div className="flex gap-5 mb-4">
                                                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                                                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <div className="h-6 w-16 bg-slate-200 rounded-md"></div>
                                                    <div className="h-6 w-20 bg-slate-200 rounded-md"></div>
                                                    <div className="h-6 w-16 bg-slate-200 rounded-md"></div>
                                                </div>
                                            </div>
                                            <div className="h-6 bg-slate-200 rounded-md w-32 mt-4 sm:mt-2"></div>
                                        </div>
                                        <div className="sm:w-[150px] shrink-0 flex flex-col items-end justify-between py-0.5 border-t sm:border-t-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-slate-100">
                                            <div className="h-5 w-5 bg-slate-200 rounded hidden sm:block"></div>
                                            <div className="flex items-center gap-2.5 w-full mt-auto mb-4">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                                                <div className="flex flex-col gap-1.5 flex-1">
                                                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                                                    <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                                                </div>
                                            </div>
                                            <div className="w-full h-8 bg-slate-200 rounded-lg"></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : rooms.length === 0 ? (
                            <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-2xl mb-4">
                                    <i className="fa-solid fa-house-chimney-crack"></i>
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-1">Không tìm thấy phòng nào!</h3>
                                <p className="text-sm text-slate-500 mb-4">Vui lòng thử thay đổi bộ lọc hoặc khu vực tìm kiếm.</p>
                                <button onClick={handleClearFilters} className="text-[#0e8b4d] font-semibold text-sm hover:underline">Xóa tất cả bộ lọc</button>
                            </div>
                        ) : (
                            rooms.map((room) => {
                                const coverImg = room.images?.find(img => img.is_cover)?.image_url || room.images?.[0]?.image_url;
                                const subImages = room.images?.filter(img => !img.is_cover).slice(0, 2) || [];

                                return (
                                    <div key={room.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-5 shadow-sm hover:shadow-md transition-shadow group">

                                        {/* KHỐI ẢNH */}
                                        <div className="w-full md:w-[260px] h-[200px] md:h-[160px] shrink-0 flex gap-1 relative rounded-lg overflow-hidden">
                                            {room.is_new && (
                                                <span className="absolute top-2 left-2 bg-[#0e8b4d] text-white text-[10px] font-bold px-2 py-1 rounded z-10 shadow-sm">Mới đăng</span>
                                            )}

                                            <div className="w-[65%] h-full bg-slate-100 relative">
                                                {coverImg ? <img src={coverImg} className="absolute inset-0 w-full h-full object-cover" alt="room cover" /> : <div className="absolute inset-0 bg-slate-200 flex items-center justify-center"><i className="fa-solid fa-image text-slate-400 text-2xl"></i></div>}
                                            </div>
                                            <div className="w-[35%] h-full flex flex-col gap-1">
                                                <div className="h-1/2 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                                                    {subImages[0] ? <img src={subImages[0].image_url} className="absolute inset-0 w-full h-full object-cover" alt="room pic 1" /> : <i className="fa-solid fa-door-open text-slate-300"></i>}
                                                </div>
                                                <div className="h-1/2 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                                                    {subImages[1] ? <img src={subImages[1].image_url} className="absolute inset-0 w-full h-full object-cover" alt="room pic 2" /> : <i className="fa-solid fa-couch text-slate-300"></i>}
                                                    {room.images?.length > 3 && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[11px] font-bold">+{room.images.length - 3}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* THÔNG TIN PHÒNG */}
                                        <div className="flex-1 flex flex-col sm:flex-row justify-between gap-4">

                                            <div className="flex flex-col justify-between py-0.5 flex-1">
                                                <div>
                                                    <Link to={`/phong-tro/${room.id}`} className="text-[16px] md:text-[18px] font-bold text-[#111827] mb-1.5 cursor-pointer hover:text-[#0e8b4d] transition-colors line-clamp-1 block">
                                                        Phòng {room.name} {room.floor_number ? `- Tầng ${room.floor_number}` : '- Tầng Trệt'}
                                                    </Link>
                                                    <p className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5 mb-2.5 line-clamp-1">
                                                        <i className="fa-solid fa-location-dot text-[#0e8b4d]/70 text-[12px]"></i> {room.property?.address || 'Đang cập nhật'}
                                                    </p>

                                                    <div className="flex items-center gap-5 text-[13px] text-slate-600 font-medium mb-3">
                                                        <span className="flex items-center gap-1.5"><i className="fa-regular fa-square text-slate-400 text-[12px]"></i> {room.area || '--'} m²</span>
                                                        <span className="flex items-center gap-1.5"><i className="fa-solid fa-user-group text-slate-400 text-[12px]"></i> {room.max_occupants ? `Tối đa ${room.max_occupants} người` : 'Không giới hạn'}</span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {room.amenities?.slice(0, 5).map(amenityKey => {
                                                            const amenity = AMENITIES_LIST.find(a => a.value === amenityKey);
                                                            if (!amenity) return null;
                                                            return (
                                                                <span key={amenityKey} className="bg-slate-100 text-slate-500 text-[11px] font-medium px-2 py-1 rounded-md flex items-center gap-1 border border-slate-200/60">
                                                                    <i className={`fa-solid ${amenity.icon} text-[10px]`}></i> {amenity.label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="text-[#ef4444] font-bold text-[18px] md:text-[20px] mt-4 sm:mt-2">
                                                    {formatCurrency(room.current_price)} <span className="text-[13px] font-medium text-slate-500">đ/tháng</span>
                                                </div>
                                            </div>

                                            {/* CỘT TÁC VỤ LIÊN HỆ */}
                                            <div className="sm:w-[150px] shrink-0 flex flex-col items-end justify-between py-0.5 border-t sm:border-t-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-slate-100">
                                                <button className="text-slate-300 hover:text-red-500 transition-colors hidden sm:block" title="Lưu tin">
                                                    <i className="fa-regular fa-heart text-[20px]"></i>
                                                </button>

                                                <div className="flex items-center gap-2.5 w-full mt-auto mb-4">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                                                        <i className="fa-solid fa-user-tie text-[13px]"></i>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <p className="text-[12px] font-bold text-slate-800 leading-tight truncate">{room.landlord?.name || 'Quản lý'}</p>
                                                        <p className="text-[11px] font-bold text-[#0e8b4d] mt-0.5 truncate">{room.landlord?.phone || 'Liên hệ'}</p>
                                                    </div>
                                                </div>

                                                <Link to={`/phong-tro/${room.id}`} className="w-full bg-[#e6f4eb] text-[#0e8b4d] hover:bg-[#0e8b4d] hover:text-white py-2 rounded-lg text-[13px] font-bold transition-colors text-center block shadow-sm border border-[#0e8b4d]/20">
                                                    Xem chi tiết
                                                </Link>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* PHÂN TRANG */}
                    {pagination?.last_page > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="px-3 md:px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"><i className="fa-solid fa-angle-left mr-1"></i> Trước</button>
                            <span className="text-sm font-bold text-[#0e8b4d] bg-[#e6f4eb] px-4 py-2 rounded-lg border border-[#0e8b4d]/20">{filters.page} / {pagination.last_page}</span>
                            <button disabled={filters.page >= pagination.last_page} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="px-3 md:px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm">Sau <i className="fa-solid fa-angle-right ml-1"></i></button>
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: BỘ LỌC NÂNG CAO */}
                <aside id="advanced-filter" className="w-full lg:w-[300px] shrink-0 flex flex-col gap-6">

                    {/* BANNER THÔNG TIN */}
                    <div className="bg-[#e6f4eb] rounded-xl p-5 border border-[#0e8b4d]/20 flex flex-col relative overflow-hidden shadow-sm">
                        <h3 className="text-[16px] font-bold text-[#0e8b4d] mb-3 relative z-10">Thuê phòng an tâm</h3>
                        <ul className="space-y-2 mb-5 relative z-10">
                            <li className="flex items-start gap-2 text-[12px] text-slate-700 font-medium">
                                <i className="fa-solid fa-circle-check mt-0.5 text-[14px] text-[#0e8b4d]"></i> Làm việc trực tiếp với chủ trọ
                            </li>
                            <li className="flex items-start gap-2 text-[12px] text-slate-700 font-medium">
                                <i className="fa-solid fa-circle-check mt-0.5 text-[14px] text-[#0e8b4d]"></i> Quản lý bằng hệ thống phần mềm
                            </li>
                            <li className="flex items-start gap-2 text-[12px] text-slate-700 font-medium">
                                <i className="fa-solid fa-circle-check mt-0.5 text-[14px] text-[#0e8b4d]"></i> Hóa đơn điện tử minh bạch
                            </li>
                        </ul>
                        <div className="absolute -right-4 -bottom-4 text-[#0e8b4d]/10 text-7xl rotate-[-15deg]">
                            <i className="fa-solid fa-shield-halved"></i>
                        </div>
                    </div>

                    {/* KHỐI BỘ LỌC */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                            <h3 className="text-[16px] font-bold text-[#111827]">Bộ lọc tìm kiếm</h3>
                            <button onClick={handleClearFilters} className="text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors bg-red-50 px-2 py-1 rounded">Xóa lọc</button>
                        </div>

                        <div className="flex flex-col gap-5">
                            <div>
                                <label className="block text-[12px] font-bold text-slate-700 mb-2">Khoảng giá (VNĐ/tháng)</label>
                                <div className="relative">
                                    <select 
                                        value={filters.priceRange} 
                                        onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[13px] rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0e8b4d] focus:border-[#0e8b4d] block px-3 py-2.5 hover:border-slate-300 transition-colors outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="">Tất cả mức giá</option>
                                        <option value="under_2">Dưới 2 triệu</option>
                                        <option value="2_to_3">Từ 2 - 3 triệu</option>
                                        <option value="3_to_5">Từ 3 - 5 triệu</option>
                                        <option value="over_5">Trên 5 triệu</option>
                                    </select>
                                    <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] pointer-events-none"></i>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-bold text-slate-700 mb-2">Diện tích (m²)</label>
                                <div className="relative">
                                    <select 
                                        value={filters.areaRange} 
                                        onChange={(e) => setFilters({ ...filters, areaRange: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[13px] rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0e8b4d] focus:border-[#0e8b4d] block px-3 py-2.5 hover:border-slate-300 transition-colors outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="">Tất cả diện tích</option>
                                        <option value="under_20">Dưới 20 m²</option>
                                        <option value="20_to_30">Từ 20 - 30 m²</option>
                                        <option value="over_30">Trên 30 m²</option>
                                    </select>
                                    <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] pointer-events-none"></i>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-bold text-slate-700 mb-3">Tiện ích phòng</label>
                                <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                                    {AMENITIES_LIST.map((amenity) => (
                                        <label key={amenity.value} className="flex items-center gap-2.5 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.amenities.includes(amenity.value)}
                                                    onChange={() => handleToggleAmenity(amenity.value)}
                                                    className="peer appearance-none w-4 h-4 border border-slate-300 rounded-[4px] bg-slate-50 checked:bg-[#0e8b4d] checked:border-[#0e8b4d] focus:outline-none focus:ring-2 focus:ring-[#0e8b4d]/20 transition-all cursor-pointer group-hover:border-[#0e8b4d]/50"
                                                />
                                                <i className="fa-solid fa-check absolute text-white text-[10px] opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                                            </div>
                                            <span className="text-[13px] text-slate-600 font-medium select-none group-hover:text-slate-900 transition-colors">{amenity.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button onClick={handleApplyFilters} className="bg-[#0e8b4d] hover:bg-green-700 text-white w-full py-3 rounded-lg text-[14px] font-bold transition-colors shadow-sm mt-6 flex justify-center items-center gap-2">
                            <i className="fa-solid fa-filter"></i> Áp dụng bộ lọc
                        </button>
                    </div>

                </aside>
            </main>

        </React.Fragment>
    );
}