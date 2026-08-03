import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import publicService from '@/services/publicService';

const formatCurrency = (value) => {
    if (!value) return "Đang cập nhật";
    return new Intl.NumberFormat('vi-VN').format(value);
};

// Từ điển Tiện ích phòng
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

// Từ điển Dịch vụ / Chi phí hàng tháng
const SERVICES_MAP = {
    electricity: { label: "Điện", icon: "fa-bolt", unit: "kWh" },
    water: { label: "Nước", icon: "fa-droplet", unit: "khối / người" },
    internet: { label: "Internet", icon: "fa-wifi", unit: "phòng" },
    garbage: { label: "Rác", icon: "fa-trash", unit: "phòng" },
    parking: { label: "Giữ xe", icon: "fa-motorcycle", unit: "chiếc" },
    elevator: { label: "Thang máy", icon: "fa-elevator", unit: "người" },
    management: { label: "Phí quản lý", icon: "fa-user-tie", unit: "phòng" },
    cleaning: { label: "Vệ sinh", icon: "fa-broom", unit: "phòng" },
};

export default function PublicRoomDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [similarRooms, setSimilarRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImage, setActiveImage] = useState("");
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            try {
                // Lấy chi tiết phòng hiện tại
                const res = await publicService.getRoomDetail(id);
                const roomData = res.data.data;
                setRoom(roomData);

                // Thiết lập ảnh mặc định
                const cover = roomData.images?.find(i => i.is_cover)?.image_url;
                const first = roomData.images?.[0]?.image_url;
                setActiveImage(cover || first || "");

                // Lấy danh sách gợi ý
                const similarRes = await publicService.getRooms({ per_page: 5 });
                const filteredSimilar = similarRes.data.data
                    .filter(r => String(r.id) !== String(id))
                    .slice(0, 4);
                
                setSimilarRooms(filteredSimilar);
                
            } catch (error) {
                console.error("Lỗi lấy chi tiết phòng:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    // ==========================================
    // KHỐI SKELETON LOADING CAO CẤP
    // ==========================================
    if (isLoading) {
        return (
            <div className="flex flex-col flex-1 w-full text-slate-800 pb-12 bg-[#f8fafc]">
                {/* Skeleton Breadcrumb */}
                <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-8">
                    <div className="max-w-[1200px] mx-auto flex items-center gap-2">
                        <div className="w-16 h-4 bg-slate-200 animate-pulse rounded"></div>
                        <i className="fa-solid fa-angle-right text-[10px] text-slate-300"></i>
                        <div className="w-24 h-4 bg-slate-200 animate-pulse rounded"></div>
                        <i className="fa-solid fa-angle-right text-[10px] text-slate-300"></i>
                        <div className="w-20 h-4 bg-slate-200 animate-pulse rounded"></div>
                    </div>
                </div>

                {/* Skeleton Main Content */}
                <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-6 lg:py-8 flex flex-col lg:flex-row gap-8 lg:gap-10">
                    {/* Cột trái */}
                    <div className="flex-1 min-w-0 flex flex-col gap-6">
                        {/* Ảnh Gallery */}
                        <div className="flex flex-col gap-3">
                            <div className="w-full h-[300px] md:h-[450px] bg-slate-200 animate-pulse rounded-xl border border-slate-100"></div>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-[80px] h-[60px] bg-slate-200 animate-pulse rounded-md shrink-0 border-2 border-transparent"></div>
                                ))}
                            </div>
                        </div>

                        {/* Card Thông tin (Bài báo) */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                            <div className="p-5 md:p-6 border-b border-slate-50">
                                <div className="w-32 h-6 bg-slate-200 animate-pulse rounded-full mb-4"></div>
                                <div className="w-3/4 h-8 md:h-10 bg-slate-200 animate-pulse rounded-lg mb-4"></div>
                                <div className="w-1/2 h-4 bg-slate-200 animate-pulse rounded mb-6"></div>
                                <div className="flex gap-10">
                                    <div className="w-28 h-12 bg-slate-200 animate-pulse rounded-lg"></div>
                                    <div className="w-24 h-12 bg-slate-200 animate-pulse rounded-lg"></div>
                                    <div className="w-24 h-12 bg-slate-200 animate-pulse rounded-lg"></div>
                                </div>
                            </div>
                            <div className="p-5 md:p-6 border-b border-slate-50">
                                <div className="w-40 h-6 bg-slate-200 animate-pulse rounded mb-4"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-8 bg-slate-200 animate-pulse rounded"></div>)}
                                </div>
                            </div>
                            <div className="p-5 md:p-6">
                                <div className="w-40 h-6 bg-slate-200 animate-pulse rounded mb-4"></div>
                                <div className="w-full h-32 bg-slate-200 animate-pulse rounded-lg"></div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải */}
                    <aside className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
                        {/* Card Chủ Trọ */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-200 animate-pulse rounded-full mb-3"></div>
                            <div className="w-32 h-5 bg-slate-200 animate-pulse rounded mb-2"></div>
                            <div className="w-20 h-4 bg-slate-200 animate-pulse rounded mb-4"></div>
                            <div className="w-24 h-6 bg-slate-200 animate-pulse rounded-full mb-5"></div>
                            <div className="w-full h-12 bg-slate-200 animate-pulse rounded-xl mb-3"></div>
                            <div className="w-full h-12 bg-slate-200 animate-pulse rounded-xl"></div>
                        </div>
                        {/* Card Phòng Gợi ý */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                            <div className="w-32 h-5 bg-slate-200 animate-pulse rounded mb-6"></div>
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-[85px] h-[85px] bg-slate-200 animate-pulse rounded-xl shrink-0"></div>
                                        <div className="flex-1 flex flex-col justify-center gap-2">
                                            <div className="w-full h-4 bg-slate-200 animate-pulse rounded"></div>
                                            <div className="w-3/4 h-3 bg-slate-200 animate-pulse rounded"></div>
                                            <div className="w-1/2 h-4 bg-slate-200 animate-pulse rounded mt-1"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    // ==========================================
    // HIỂN THỊ LỖI NẾU KHÔNG TÌM THẤY PHÒNG
    // ==========================================
    if (!room) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 text-3xl mb-4">
                    <i className="fa-solid fa-house-chimney-crack"></i>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy phòng!</h2>
                <p className="text-slate-500 mb-6">Phòng trọ này có thể đã được thuê hoặc bị ẩn bởi chủ nhà.</p>
                <button onClick={() => navigate('/')} className="bg-[#0e8b4d] text-white px-6 py-2.5 rounded-lg font-bold shadow-sm">
                    Quay lại trang tìm kiếm
                </button>
            </div>
        );
    }

    const images = room.images || [];
    const services = room.property?.service_prices || [];

    // ==========================================
    // RENDER DATA THỰC TẾ
    // ==========================================
    return (
        <div className="flex flex-col flex-1 w-full text-slate-800 pb-12">
            
            {/* BREADCRUMB */}
            <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-8">
                <div className="max-w-[1200px] mx-auto text-[13px] text-slate-500 font-medium flex items-center gap-2">
                    <Link to="/" className="hover:text-[#0e8b4d] transition-colors">Trang chủ</Link>
                    <i className="fa-solid fa-angle-right text-[10px]"></i>
                    <span className="text-slate-800 font-semibold">{room.property?.name || 'Khu nhà'}</span>
                    <i className="fa-solid fa-angle-right text-[10px]"></i>
                    <span className="text-slate-500">Phòng {room.name}</span>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-6 lg:py-8 flex flex-col lg:flex-row gap-8 lg:gap-10">

                {/* CỘT TRÁI: CHI TIẾT */}
                <div className="flex-1 min-w-0 flex flex-col gap-6">

                    {/* 1. GALLERY HÌNH ẢNH */}
                    <div className="flex flex-col gap-3">
                        <div className="w-full h-[300px] md:h-[450px] bg-slate-100 rounded-xl overflow-hidden relative group border border-slate-200">
                            {activeImage ? (
                                <>
                                    <img src={activeImage} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setIsZoomed(true)} alt={`Phòng ${room.name}`} />
                                    <button onClick={() => setIsZoomed(true)} className="absolute bottom-4 right-4 bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <i className="fa-solid fa-expand"></i>
                                    </button>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                    <i className="fa-regular fa-image text-5xl mb-3"></i>
                                    <span>Chưa có hình ảnh</span>
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img.image_url}
                                        onClick={() => setActiveImage(img.image_url)}
                                        className={`w-[80px] h-[60px] object-cover rounded-md cursor-pointer border-2 transition-all shrink-0 ${activeImage === img.image_url ? 'border-[#0e8b4d] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        alt={`Thumb ${idx}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. KHỐI THÔNG TIN CHÍNH DẠNG "BÀI BÁO" LỚN */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        
                        {/* 2.1 Tiêu đề & Cấu trúc Giá - Nằm trên cùng */}
                        <div className="p-5 md:p-6 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                {room.is_new && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[12px] font-bold border border-orange-200">
                                        Mới đăng
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[12px] font-bold border border-emerald-200">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Còn phòng trống
                                </span>
                            </div>

                            <h1 className="text-[22px] md:text-[28px] font-bold text-[#111827] leading-tight mb-2">
                                Cho thuê phòng trọ {room.name} {room.floor_number ? `- Tầng ${room.floor_number}` : ''}
                            </h1>
                            
                            <div className="flex items-center gap-2 text-[14px] text-slate-500 font-medium mb-5">
                                <i className="fa-solid fa-location-dot text-[#0e8b4d]"></i>
                                <span>{room.property?.address || 'Đang cập nhật địa chỉ'}</span>
                                <a href={`https://maps.google.com/?q=${room.property?.address || ''}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold ml-1">
                                    Xem bản đồ
                                </a>
                            </div>

                            {/* Cụm thông số nổi bật */}
                            <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-2">
                                <div>
                                    <p className="text-[12px] text-slate-500 font-medium mb-1">Mức giá</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[24px] md:text-[32px] font-extrabold text-[#ef4444] leading-none tracking-tight">
                                            {formatCurrency(room.current_price)}
                                        </span>
                                        <span className="text-[15px] font-bold text-slate-500">đ/tháng</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[12px] text-slate-500 font-medium mb-1">Diện tích</p>
                                    <span className="text-[20px] md:text-[24px] font-bold text-slate-800 leading-none">
                                        {room.area ? `${room.area} m²` : '--'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[12px] text-slate-500 font-medium mb-1">Tiền cọc</p>
                                    <span className="text-[20px] md:text-[24px] font-bold text-slate-800 leading-none">
                                        {formatCurrency(room.deposit_amount)} đ
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2.2 Đặc điểm tin đăng */}
                        <div className="p-5 md:p-6 border-b border-slate-100">
                            <h3 className="text-[18px] font-bold text-slate-800 mb-4">Đặc điểm phòng trọ</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-[14px]">
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 md:border-transparent md:py-0">
                                    <span className="text-slate-500 flex items-center gap-2"><i className="fa-solid fa-layer-group w-5 text-center"></i> Vị trí tầng</span>
                                    <span className="font-semibold text-slate-800">{room.floor_number === 0 ? 'Tầng trệt' : room.floor_number ? `Tầng ${room.floor_number}` : 'Không xác định'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 md:border-transparent md:py-0">
                                    <span className="text-slate-500 flex items-center gap-2"><i className="fa-solid fa-users w-5 text-center"></i> Sức chứa</span>
                                    <span className="font-semibold text-slate-800">{room.max_occupants ? `Tối đa ${room.max_occupants} người` : 'Không giới hạn'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 md:border-transparent md:py-0">
                                    <span className="text-slate-500 flex items-center gap-2"><i className="fa-solid fa-people-arrows w-5 text-center"></i> Ở ghép</span>
                                    <span className="font-semibold text-slate-800">{room.allow_shared ? 'Cho phép' : 'Không cho phép'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 md:border-transparent md:py-0">
                                    <span className="text-slate-500 flex items-center gap-2"><i className="fa-regular fa-calendar-plus w-5 text-center"></i> Ngày đăng</span>
                                    <span className="font-semibold text-slate-800">{new Date(room.created_at).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2.3 Chi phí hàng tháng */}
                        {services && services.length > 0 && (
                            <div className="p-5 md:p-6 border-b border-slate-100">
                                <h3 className="text-[18px] font-bold text-slate-800 mb-4">Chi phí hàng tháng</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                                    {services.map((srv, index) => {
                                        const serviceInfo = SERVICES_MAP[srv.service_type] || { label: srv.service_type_label, icon: 'fa-tag', unit: 'tháng' };
                                        return (
                                            <div key={index} className="flex justify-between items-center py-3 border-b border-dashed border-slate-200">
                                                <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                                                    <i className={`fa-solid ${serviceInfo.icon} w-5 text-center text-slate-400`}></i>
                                                    <span className="text-[14px]">{serviceInfo.label}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-slate-800 text-[14px]">{formatCurrency(srv.unit_price)}đ</span>
                                                    <span className="text-slate-500 text-[13px]"> / {serviceInfo.unit}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 2.4 Tiện ích */}
                        {room.amenities && room.amenities.length > 0 && (
                            <div className="p-5 md:p-6 border-b border-slate-100">
                                <h3 className="text-[18px] font-bold text-slate-800 mb-4">Tiện ích nội khu</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4">
                                    {room.amenities.map(amenityKey => {
                                        const amenity = AMENITIES_LIST.find(a => a.value === amenityKey);
                                        if (!amenity) return null;
                                        return (
                                            <div key={amenityKey} className="flex items-center gap-3">
                                                <i className={`fa-solid ${amenity.icon} text-[#0e8b4d] text-[16px] w-6 text-center`}></i>
                                                <span className="text-[14px] font-medium text-slate-700">{amenity.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 2.5 Mô tả chi tiết */}
                        {room.description && (
                            <div className="p-5 md:p-6">
                                <h3 className="text-[18px] font-bold text-slate-800 mb-4">Thông tin mô tả</h3>
                                <div className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                                    {room.description}
                                </div>
                            </div>
                        )}

                    </div>

                </div>

                {/* CỘT PHẢI: LIÊN HỆ & PHÒNG TƯƠNG TỰ */}
                <aside className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
                    
                    {/* Card Chủ Trọ */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 text-3xl mb-3">
                                <i className="fa-solid fa-user-tie"></i>
                            </div>
                            <h3 className="text-[18px] font-bold text-slate-800">{room.landlord?.name || 'Quản lý'}</h3>
                            <p className="text-[13px] text-slate-500 mt-1">Chủ nhà</p>

                            <div className="flex flex-wrap justify-center items-center gap-2 mt-3">
                                <span className="bg-[#e6f4eb] text-[#0e8b4d] border border-[#0e8b4d]/20 text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                                    <i className="fa-solid fa-circle-check"></i> Đăng tin từ hệ thống
                                </span>
                            </div>
                        </div>

                        <div className="pt-5 flex flex-col gap-3">
                            <a href={`tel:${room.landlord?.phone || ''}`} className="w-full bg-[#0e8b4d] hover:bg-green-700 text-white py-3.5 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                                <i className="fa-solid fa-phone-volume"></i> {room.landlord?.phone || 'Liên hệ ngay'}
                            </a>

                            <a href={`https://zalo.me/${room.landlord?.phone || ''}`} target="_blank" rel="noreferrer" className="w-full bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 py-3.5 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                                Nhắn tin Zalo
                            </a>
                        </div>
                    </div>

                    {/* Khối gợi ý Phòng trống khác */}
                    {similarRooms.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                                    <i className="fa-solid fa-house-chimney text-[#0e8b4d]"></i> Gợi ý phòng khác
                                </h3>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                {similarRooms.map(simRoom => {
                                    const coverImg = simRoom.images?.find(i => i.is_cover)?.image_url || simRoom.images?.[0]?.image_url;
                                    return (
                                        <Link to={`/phong-tro/${simRoom.id}`} key={simRoom.id} className="flex gap-3 group">
                                            {/* Thumbnail */}
                                            <div className="w-[85px] h-[85px] rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 relative">
                                                {coverImg ? (
                                                    <img src={coverImg} alt={`Phòng ${simRoom.name}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <i className="fa-regular fa-image text-xl"></i>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Thông tin thu gọn */}
                                            <div className="flex flex-col justify-center flex-1 min-w-0">
                                                <h4 className="text-[14px] font-bold text-slate-800 line-clamp-1 group-hover:text-[#0e8b4d] transition-colors">
                                                    Phòng {simRoom.name}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 mt-1 truncate">
                                                    <i className="fa-solid fa-location-dot mr-1"></i>
                                                    {simRoom.property?.name || 'Đang cập nhật'}
                                                </p>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <p className="text-[14px] font-bold text-[#ef4444] leading-none">
                                                        {formatCurrency(simRoom.current_price)}<span className="text-[10px] text-slate-500 font-medium">đ/th</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <Link to="/" className="w-full block text-center text-[#0e8b4d] text-[13px] font-semibold hover:underline">
                                    Xem tất cả phòng trống <i className="fa-solid fa-arrow-right ml-1"></i>
                                </Link>
                            </div>
                        </div>
                    )}
                </aside>

            </main>

            {/* FULLSCREEN ZOOM IMAGE OVERLAY */}
            {isZoomed && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setIsZoomed(false)}>
                    <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full text-white text-xl flex items-center justify-center transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    <img src={activeImage} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain cursor-zoom-out" />
                </div>
            )}
        </div>
    );
}