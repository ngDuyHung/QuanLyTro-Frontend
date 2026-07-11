import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import incidentService from "@/services/incidentService";

export default function ResolveIncidentModal({
    open,
    onClose,
    incident,
    onSuccess,
}) {
    const [form, setForm] = useState({
        repair_cost: "",
        payer: "none",
        images: [],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrls, setPreviewUrls] = useState([]);
    const fileInputRef = useRef(null);

    // Reset dữ liệu mỗi khi mở form
    useEffect(() => {
        if (open && incident) {
            setForm({
                repair_cost: "",
                payer: "none",
                images: [],
            });
            setPreviewUrls([]);
        } else {
            // Clear memory
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        }
    }, [open, incident]);

    if (!open || !incident) return null;

    // Format tiền tệ khi gõ
    const handleCostChange = (e) => {
        const value = e.target.value.replace(/\D/g, ""); // Chỉ lấy số
        setForm(prev => ({ ...prev, repair_cost: value }));
    };

    const handlePayerChange = (e) => {
        const newPayer = e.target.value;
        setForm(prev => ({
            ...prev,
            payer: newPayer,
            // Nếu chọn "Không mất phí", tự động clear số tiền về 0
            repair_cost: newPayer === "none" ? "" : prev.repair_cost
        }));
    };

    // --- Logic Upload Ảnh (Tương tự Create Modal) ---
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        if (form.images.length + selectedFiles.length > 5) {
            toast.warning("Chỉ được tải lên tối đa 5 ảnh nghiệm thu.");
            return;
        }

        const validFiles = selectedFiles.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.warning(`File ${file.name} vượt quá 5MB.`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            setForm(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));
            const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveImage = (indexToRemove) => {
        setForm(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
        URL.revokeObjectURL(previewUrls[indexToRemove]);
        setPreviewUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    // --- Submit Dữ liệu ---
    const handleSubmit = async () => {
        const cost = parseInt(form.repair_cost || "0", 10);

        if (form.payer !== "none" && cost <= 0) {
            return toast.warning("Vui lòng nhập chi phí sửa chữa lớn hơn 0.");
        }

        setIsSubmitting(true);
        try {
            // Khởi tạo FormData vì có file ảnh
            const formData = new FormData();
            formData.append("repair_cost", form.payer === "none" ? 0 : cost);
            formData.append("payer", form.payer);

            form.images.forEach((file) => {
                formData.append("images[]", file);
            });

            await incidentService.resolve(incident.id, formData);

            toast.success("Chốt sự cố thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Lỗi khi chốt sự cố:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] max-h-[100dvh] flex flex-col overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-green-50 shrink-0">
                    <div>
                        <h2 className="text-[16px] font-bold text-green-700">Nghiệm thu sự cố</h2>
                        <p className="text-[12px] text-green-600 mt-0.5">Xác nhận hoàn thành và chốt chi phí</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-100 text-green-600 transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto custom-scrollbar">

                    {/* Thông tin tóm tắt */}
                    <div className="mb-5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-[13px] text-slate-500 mb-1">Đang chốt sự cố:</p>
                        <p className="text-[14px] font-bold text-slate-800 line-clamp-2">{incident.title}</p>
                        <p className="text-[12px] font-medium text-brand mt-1">
                            <i className="fa-solid fa-location-dot mr-1"></i>
                            {incident.room?.name || 'Khu vực chung'} - {incident.property?.name}
                        </p>
                    </div>

                    <div className="space-y-5">
                        {/* Ai là người chịu phí */}
                        <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                Bên chịu chi phí sửa chữa <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="payer"
                                        value="none"
                                        checked={form.payer === "none"}
                                        onChange={handlePayerChange}
                                        className="w-4 h-4 text-brand"
                                    />
                                    <span className="text-[13px] text-slate-700 font-medium">Không mất phí sửa chữa</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="payer"
                                        value="landlord"
                                        checked={form.payer === "landlord"}
                                        onChange={handlePayerChange}
                                        className="w-4 h-4 text-brand"
                                    />
                                    <span className="text-[13px] text-slate-700 font-medium">Chủ trọ thanh toán (Tạo phiếu chi)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="payer"
                                        value="tenant"
                                        checked={form.payer === "tenant"}
                                        onChange={handlePayerChange}
                                        className="w-4 h-4 text-brand"
                                    />
                                    <span className="text-[13px] text-slate-700 font-medium">Khách thuê đền bù (Cộng vào hóa đơn)</span>
                                </label>
                            </div>
                        </div>

                        {/* Nhập số tiền (Ẩn nếu chọn Không mất phí) */}
                        {form.payer !== "none" && (
                            <div className="animate-fade-in-up">
                                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                                    Tổng chi phí (VNĐ) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={form.repair_cost ? Number(form.repair_cost).toLocaleString('vi-VN') : ""}
                                        onChange={handleCostChange}
                                        placeholder="0"
                                        className="w-full h-10 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-[14px] font-semibold text-slate-800 outline-none focus:border-brand transition-colors text-right"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">
                                        đ
                                    </span>
                                </div>

                                {/* Helper Text Động */}
                                {form.payer === "landlord" && (
                                    <p className="text-[11px] font-medium text-blue-600 mt-1.5 flex items-start gap-1">
                                        <i className="fa-solid fa-circle-info mt-0.5"></i>
                                        Hệ thống sẽ tự động tạo 01 Phiếu Chi cho Khu nhà này.
                                    </p>
                                )}
                                {form.payer === "tenant" && (
                                    <p className="text-[11px] font-medium text-orange-600 mt-1.5 flex items-start gap-1">
                                        <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                                        Chi phí này sẽ tự động được cộng vào kỳ hóa đơn tiếp theo của phòng.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Upload hình ảnh sau khi sửa (Tùy chọn) */}
                        <div>
                            <div className="flex justify-between items-end mb-1.5">
                                <label className="block text-[13px] font-semibold text-slate-700">
                                    Ảnh nghiệm thu (sau sửa chữa)
                                </label>
                                <span className="text-[11px] text-slate-500">
                                    {form.images.length}/5 ảnh
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden group">
                                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                            >
                                                <i className="fa-solid fa-trash-can text-[11px]"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {form.images.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-brand hover:border-brand hover:bg-brand/5 transition-colors"
                                    >
                                        <i className="fa-solid fa-plus mb-1 text-[12px]"></i>
                                    </button>
                                )}
                            </div>
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

                {/* Footer */}
                <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 flex items-center justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-70"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 flex items-center gap-2 shadow-sm transition-colors disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Đang xử lý...</>
                        ) : (
                            <><i className="fa-solid fa-check-double"></i> Chốt sự cố</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}