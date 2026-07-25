import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantUtilityService from "@/services/tenantUtilityService";

export default function TenantSubmitUtilityModal({ open, onClose, onSuccess }) {
    const [info, setInfo] = useState({ room_name: "", property_name: "", electricity_previous: 0, water_previous: 0 });
    const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10));

    // Nước
    const [waterReading, setWaterReading] = useState("");
    const [waterImage, setWaterImage] = useState(null);
    const [waterPreview, setWaterPreview] = useState("");

    // Điện
    const [elecReading, setElecReading] = useState("");
    const [elecImage, setElecImage] = useState(null);
    const [elecPreview, setElecPreview] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanningElec, setIsScanningElec] = useState(false);
    const [isScanningWater, setIsScanningWater] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState(null);

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            if (waterPreview) URL.revokeObjectURL(waterPreview);
            if (elecPreview) URL.revokeObjectURL(elecPreview);
        };
    }, [waterPreview, elecPreview]);

    // Fetch chỉ số cũ khi mở Modal
    useEffect(() => {
        if (open) {
            setWaterReading(""); setWaterImage(null); setWaterPreview("");
            setElecReading(""); setElecImage(null); setElecPreview("");
            setReadingDate(new Date().toISOString().slice(0, 10));

            const fetchPrev = async () => {
                setIsLoading(true);
                try {
                    const res = await tenantUtilityService.getCurrentReadings();
                    setInfo(res.data.data);
                } catch (error) {
                    toast.error("Không tải được chỉ số cũ.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPrev();
        }
    }, [open]);

    const handleImageChange = (type) => async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Lưu file và hiện ảnh preview
        if (type === "water") {
            setWaterImage(file);
            setWaterPreview(URL.createObjectURL(file));
        } else {
            setElecImage(file);
            setElecPreview(URL.createObjectURL(file));
        }
        e.target.value = ""; // Reset input

        // 2. Tự động gọi API quét OCR
        const formData = new FormData();
        formData.append("image", file);
        formData.append("type", type);

        const isElec = type === "electricity";
        isElec ? setIsScanningElec(true) : setIsScanningWater(true);

        try {
            const res = await tenantUtilityService.scanMeter(formData);
            const scannedReading = res.data?.data?.reading;
            console.log("Scanned reading:", scannedReading);
            if (scannedReading !== undefined && scannedReading !== null) {
                // Tự động điền số liệu vào input
                isElec ? setElecReading(scannedReading) : setWaterReading(scannedReading);
                toast.success(`Đã quét tự động chỉ số ${isElec ? 'Điện' : 'Nước'}!`);
            }
        } catch (error) {
            toast.warning(`Ảnh mờ hoặc không nhận diện được. Vui lòng nhập tay.`);
        } finally {
            isElec ? setIsScanningElec(false) : setIsScanningWater(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!elecReading && !waterReading) {
            return toast.warning("Vui lòng nhập chỉ số cho ít nhất 1 loại dịch vụ (Điện hoặc Nước).");
        }

        if (elecReading && Number(elecReading) < info.electricity_previous) {
            return toast.warning(`Chỉ số Điện mới không được nhỏ hơn số cũ (${info.electricity_previous}).`);
        }
        if (waterReading && Number(waterReading) < info.water_previous) {
            return toast.warning(`Chỉ số Nước mới không được nhỏ hơn số cũ (${info.water_previous}).`);
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("reading_date", readingDate);
            if (elecReading) formData.append("electricity_reading", elecReading);
            if (elecImage) formData.append("electricity_image", elecImage);
            if (waterReading) formData.append("water_reading", waterReading);
            if (waterImage) formData.append("water_image", waterImage);

            await tenantUtilityService.submitBatch(formData);
            toast.success("Đã gửi chỉ số thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi gửi số liệu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[750px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">

                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
                    <div>
                        <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800">Ghi chỉ số Điện / Nước</h2>
                        <p className="text-[12px] text-slate-500 mt-0.5">Phòng: {info.room_name} ({info.property_name})</p>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex justify-center items-center text-slate-500">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <label className="block text-[13px] font-bold text-slate-700 mb-2">Ngày chốt số <span className="text-red-500">*</span></label>
                            <input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-[13px] outline-none focus:border-brand" required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* CỘT ĐIỆN */}
                            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                                <h3 className="font-bold text-amber-600 mb-3 flex items-center gap-2"><i className="fa-solid fa-bolt"></i> CHỈ SỐ ĐIỆN</h3>
                                <div className="bg-slate-50 p-2.5 rounded border border-slate-100 flex justify-between mb-3 text-[13px]">
                                    <span className="text-slate-500">Số cũ tháng trước:</span>
                                    <span className="font-bold text-slate-700">{isLoading ? '...' : info.electricity_previous}</span>
                                </div>
                                <div className="mb-4 relative">
                                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Số điện mới (kWh)</label>
                                    <input type="number" min={info.electricity_previous} value={elecReading} onChange={(e) => setElecReading(e.target.value)} placeholder="Nhập số trên đồng hồ..." className="w-full px-3 py-2 border border-amber-300 rounded-lg text-[14px] font-bold outline-none focus:ring-1 focus:ring-amber-400" />
                                    {isScanningElec && (
                                        <div className="absolute right-3 bottom-2 text-amber-500">
                                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                                        </div>
                                    )}
                                </div>
                                <label className="block text-[12px] font-semibold text-slate-700 mb-1">Ảnh đồng hồ điện</label>
                                {elecPreview ? (
                                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
                                        <img
                                            src={elecPreview}
                                            alt="Điện"
                                            className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => setFullScreenImage(elecPreview)}
                                        />
                                        <button type="button" onClick={() => { setElecPreview(""); setElecImage(null); }} className="absolute top-2 right-2 w-7 h-7 bg-white text-red-500 rounded-full flex justify-center items-center shadow-md"><i className="fa-solid fa-trash text-xs"></i></button>
                                    </div>
                                ) : (
                                    <label className="border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition-colors flex flex-col items-center justify-center aspect-video rounded-lg cursor-pointer">
                                        <i className="fa-solid fa-camera text-2xl text-slate-300 mb-2"></i>
                                        <span className="text-[12px] font-medium text-slate-500">Chụp ảnh đồng hồ điện</span>
                                        <input type="file" accept="image/*" onChange={handleImageChange("electricity")} className="hidden" />
                                    </label>
                                )}
                            </div>

                            {/* CỘT NƯỚC */}
                            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                                <h3 className="font-bold text-blue-600 mb-3 flex items-center gap-2"><i className="fa-solid fa-droplet"></i> CHỈ SỐ NƯỚC</h3>
                                <div className="bg-slate-50 p-2.5 rounded border border-slate-100 flex justify-between mb-3 text-[13px]">
                                    <span className="text-slate-500">Số cũ tháng trước:</span>
                                    <span className="font-bold text-slate-700">{isLoading ? '...' : info.water_previous}</span>
                                </div>
                                <div className="mb-4 relative">
                                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Số nước mới (m³)</label>
                                    <input type="number" min={info.water_previous} value={waterReading} onChange={(e) => setWaterReading(e.target.value)} placeholder="Nhập số trên đồng hồ..." className="w-full px-3 py-2 border border-blue-300 rounded-lg text-[14px] font-bold outline-none focus:ring-1 focus:ring-blue-400" />
                                    {isScanningWater && (
                                        <div className="absolute right-3 bottom-2 text-amber-500">
                                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                                        </div>
                                    )}
                                </div>
                                <label className="block text-[12px] font-semibold text-slate-700 mb-1">Ảnh đồng hồ nước</label>
                                {waterPreview ? (
                                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
                                        <img
                                            src={waterPreview}
                                            alt="Nước"
                                            className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => setFullScreenImage(waterPreview)}
                                        />
                                        <button type="button" onClick={() => { setWaterPreview(""); setWaterImage(null); }} className="absolute top-2 right-2 w-7 h-7 bg-white text-red-500 rounded-full flex justify-center items-center shadow-md"><i className="fa-solid fa-trash text-xs"></i></button>
                                    </div>
                                ) : (
                                    <label className="border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-center justify-center aspect-video rounded-lg cursor-pointer">
                                        <i className="fa-solid fa-camera text-2xl text-slate-300 mb-2"></i>
                                        <span className="text-[12px] font-medium text-slate-500">Chụp ảnh đồng hồ nước</span>
                                        <input type="file" accept="image/*" onChange={handleImageChange("water")} className="hidden" />
                                    </label>
                                )}
                            </div>

                        </div>
                    </div>

                    <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-bold">Hủy</button>
                        <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-brand text-white rounded-lg text-[13px] font-bold shadow-sm flex items-center gap-2">
                            {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fa-solid fa-paper-plane"></i>}
                            Gửi báo cáo
                        </button>
                    </div>
                </form>
            </div>
            {/*  OVERLAY ZOOM ẢNH TOÀN MÀN HÌNH */}
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
                        alt="Phóng to"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-[zoomIn_0.2s_ease-out]"
                    />
                </div>
            )}
        </div>
    );
}