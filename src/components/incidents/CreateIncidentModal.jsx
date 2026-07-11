import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import incidentService from "@/services/incidentService";
import roomService from "@/services/roomService";

const initialForm = {
    property_id: "",
    room_id: "",
    title: "",
    description: "",
    category: "electrical",
    priority: "normal",
    images: [],
};

export default function CreateIncidentModal({
    open,
    onClose,
    properties = [],
    onSuccess,
}) {
    const [form, setForm] = useState(initialForm);
    const [rooms, setRooms] = useState([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State lưu URL preview để hiển thị ảnh ngay khi chọn
    const [previewUrls, setPreviewUrls] = useState([]);
    const fileInputRef = useRef(null);

    // Xử lý khóa cuộn màn hình nền khi mở Modal
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            setForm(initialForm);
            setRooms([]);
            setPreviewUrls([]);
        } else {
            document.body.style.overflow = "";
            // Dọn dẹp bộ nhớ URL ảo khi đóng modal
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    // Lấy danh sách phòng khi chọn Khu nhà
    useEffect(() => {
        if (form.property_id) {
            const fetchRooms = async () => {
                setIsLoadingRooms(true);
                try {
                    const res = await roomService.getByProperty(form.property_id, { per_page: 100 });
                    setRooms(res.data?.data || res.data || []);
                } catch (error) {
                    console.error("Lỗi lấy danh sách phòng:", error);
                } finally {
                    setIsLoadingRooms(false);
                }
            };
            fetchRooms();
        } else {
            setRooms([]);
            setForm(prev => ({ ...prev, room_id: "" }));
        }
    }, [form.property_id]);

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Xử lý khi chọn file ảnh
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        // Validate số lượng
        if (form.images.length + selectedFiles.length > 5) {
            toast.warning("Chỉ được tải lên tối đa 5 ảnh.");
            return;
        }

        // Validate dung lượng (< 5MB)
        const validFiles = selectedFiles.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.warning(`File ${file.name} vượt quá 5MB.`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            setForm(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));

            // Tạo URL preview
            const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        }

        // Reset input để chọn lại file trùng tên vẫn nhận
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Xóa ảnh khỏi danh sách chờ upload
    const handleRemoveImage = (indexToRemove) => {
        setForm(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));

        URL.revokeObjectURL(previewUrls[indexToRemove]);
        setPreviewUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = async () => {
        // Basic Frontend Validation
        if (!form.property_id) return toast.warning("Vui lòng chọn khu nhà.");
        if (!form.title.trim()) return toast.warning("Vui lòng nhập tiêu đề sự cố.");
        if (!form.category) return toast.warning("Vui lòng chọn phân loại.");
        if (!form.priority) return toast.warning("Vui lòng chọn mức độ ưu tiên.");

        setIsSubmitting(true);
        try {
            // FIX LỖI UPLOAD ẢNH: Phải tạo FormData thay vì gửi JSON thông thường
            const formData = new FormData();
            formData.append("property_id", form.property_id);
            if (form.room_id) formData.append("room_id", form.room_id);
            formData.append("title", form.title);
            formData.append("description", form.description || "");
            formData.append("category", form.category);
            formData.append("priority", form.priority);

            // Nạp mảng file vào FormData dưới dạng images[] để Laravel nhận diện
            form.images.forEach((file) => {
                formData.append("images[]", file);
            });

            await incidentService.create(formData);
            toast.success("Báo cáo sự cố thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Lỗi khi tạo sự cố:", error);
            // Lỗi 422 đã được interceptor trong api.js tự động xử lý
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @media (min-width: 640px) {
                    .sm\\:animate-fade-in {
                        animation: fadeIn 0.2s ease-out forwards;
                    }
                }
            `}</style>

            {/* OVERLAY & CONTAINER (Responsive Bottom Sheet on Mobile, Modal on Desktop) */}
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
                <div className="bg-white w-full sm:max-w-[600px] max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in">
                    
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                        <div>
                            <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-800">Báo cáo sự cố mới</h2>
                            <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">Tạo phiếu yêu cầu sửa chữa, bảo trì thiết bị</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                        <div className="space-y-5">
                            
                            {/* Vị trí sự cố */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                        Khu nhà <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="property_id"
                                        value={form.property_id}
                                        onChange={handleChange}
                                        className="w-full h-11 sm:h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] sm:text-[13px] outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                                    >
                                        <option value="">-- Chọn khu nhà --</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5 flex justify-between">
                                        <span>Phòng</span>
                                        {isLoadingRooms && <i className="fa-solid fa-spinner fa-spin text-brand"></i>}
                                    </label>
                                    <select
                                        name="room_id"
                                        value={form.room_id}
                                        onChange={handleChange}
                                        disabled={!form.property_id || isLoadingRooms}
                                        className="w-full h-11 sm:h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] sm:text-[13px] outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="">Khu vực chung (Hành lang, nhà xe...)</option>
                                        {rooms.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Tiêu đề */}
                            <div>
                                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                    Tiêu đề sự cố <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="VD: Cháy bóng đèn phòng khách, Rò rỉ ống nước..."
                                    className="w-full h-11 sm:h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] sm:text-[13px] outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                                />
                            </div>

                            {/* Phân loại & Mức độ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                        Phân loại <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        className="w-full h-11 sm:h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] sm:text-[13px] outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                                    >
                                        <option value="electrical">Điện</option>
                                        <option value="water">Nước</option>
                                        <option value="furniture">Nội thất (Giường, tủ...)</option>
                                        <option value="security">An ninh (Cửa, khóa...)</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                        Mức độ ưu tiên <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="priority"
                                        value={form.priority}
                                        onChange={handleChange}
                                        className="w-full h-11 sm:h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] sm:text-[13px] outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                                    >
                                        <option value="low">Thấp</option>
                                        <option value="normal">Bình thường</option>
                                        <option value="high">Nghiêm trọng</option>
                                        <option value="emergency">Khẩn cấp (Cần xử lý ngay)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Mô tả chi tiết */}
                            <div>
                                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                    Mô tả chi tiết
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Mô tả cụ thể tình trạng hỏng hóc..."
                                    className="w-full p-3 bg-white border border-slate-300 rounded-lg text-[14px] sm:text-[13px] outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors resize-none custom-scrollbar"
                                ></textarea>
                            </div>

                            {/* Upload hình ảnh */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-[13px] font-semibold text-slate-700">
                                        Hình ảnh báo cáo
                                    </label>
                                    <span className="text-[11px] sm:text-[12px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                                        {form.images.length}/5 ảnh (Max 5MB)
                                    </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-3">
                                    {/* Các ảnh preview */}
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-slate-200 overflow-hidden group shadow-sm">
                                            <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg active:scale-95 transition-transform"
                                                >
                                                    <i className="fa-solid fa-trash-can text-[12px] sm:text-[14px]"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Nút thêm ảnh */}
                                    {form.images.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-brand hover:border-brand hover:bg-brand/5 active:bg-slate-100 transition-colors"
                                        >
                                            <i className="fa-solid fa-camera mb-1 text-lg"></i>
                                            <span className="text-[11px] sm:text-[12px] font-medium">Thêm ảnh</span>
                                        </button>
                                    )}
                                </div>
                                
                                {/* Input file ẩn */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    className="hidden"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Footer - Responsive Buttons */}
                    <div className="border-t border-slate-200 px-4 sm:px-5 py-4 sm:py-3.5 bg-white shrink-0 sticky bottom-0 z-20 flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:shadow-none">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-1/2 sm:w-auto px-5 py-3 sm:py-2.5 bg-slate-100 text-slate-600 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-semibold hover:bg-slate-200 transition-colors text-center disabled:opacity-70"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-1/2 sm:w-auto sm:flex-1 px-6 py-3 sm:py-2.5 bg-brand text-white rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-bold hover:bg-brand-dark flex items-center justify-center gap-2 shadow-lg shadow-brand/30 disabled:opacity-70 transition-all"
                        >
                            {isSubmitting ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Đang lưu...</>
                            ) : (
                                <><i className="fa-solid fa-paper-plane"></i> Gửi báo cáo</>
                            )}
                        </button>
                    </div>
                    
                </div>
            </div>
        </>
    );
}