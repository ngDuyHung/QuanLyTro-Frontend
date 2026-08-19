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
    const [dragActiveWater, setDragActiveWater] = useState(false);
    const [scanStatusWater, setScanStatusWater] = useState("idle"); // idle | scanning | success | error

    // Điện
    const [elecReading, setElecReading] = useState("");
    const [elecImage, setElecImage] = useState(null);
    const [elecPreview, setElecPreview] = useState("");
    const [dragActiveElec, setDragActiveElec] = useState(false);
    const [scanStatusElec, setScanStatusElec] = useState("idle");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState(null);

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Dùng useRef để giữ link ảnh và chỉ xóa khi Component Unmount (Đóng Modal)
    const elecRef = React.useRef("");
    const waterRef = React.useRef("");

    useEffect(() => {
        elecRef.current = elecPreview;
        waterRef.current = waterPreview;
    }, [elecPreview, waterPreview]);

    useEffect(() => {
        return () => {
            // Chỉ chạy lệnh dọn rác này khi Modal bị tắt hẳn đi
            if (elecRef.current) URL.revokeObjectURL(elecRef.current);
            if (waterRef.current) URL.revokeObjectURL(waterRef.current);
        };
    }, []); // Mảng rỗng [] rất quan trọng!

    useEffect(() => {
        if (open) {
            setWaterReading(""); setWaterImage(null); setWaterPreview(""); setScanStatusWater("idle");
            setElecReading(""); setElecImage(null); setElecPreview(""); setScanStatusElec("idle");
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

    // --- XỬ LÝ DRAG & DROP ---
    const handleDrag = (type) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            type === "electricity" ? setDragActiveElec(true) : setDragActiveWater(true);
        } else if (e.type === "dragleave") {
            type === "electricity" ? setDragActiveElec(false) : setDragActiveWater(false);
        }
    };

    const handleDrop = (type) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        type === "electricity" ? setDragActiveElec(false) : setDragActiveWater(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0], type);
        }
    };

    // --- XỬ LÝ ẢNH & GỌI API QUÉT ---
    const processFile = async (file, type) => {
        if (!file) return;
        const isElec = type === "electricity";

        if (isElec) {
            setElecImage(file);
            setElecPreview(URL.createObjectURL(file));
            setScanStatusElec("scanning");
        } else {
            setWaterImage(file);
            setWaterPreview(URL.createObjectURL(file));
            setScanStatusWater("scanning");
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("type", type);

        try {
            const res = await tenantUtilityService.scanMeter(formData);
            const scannedReading = res.data?.data?.reading;
            if (scannedReading !== undefined && scannedReading !== null) {
                if (isElec) {
                    setElecReading(scannedReading);
                    setScanStatusElec("success");
                } else {
                    setWaterReading(scannedReading);
                    setScanStatusWater("success");
                }
                toast.success(`Đã quét tự động chỉ số ${isElec ? 'Điện' : 'Nước'}!`);
            }
        } catch (error) {
            isElec ? setScanStatusElec("error") : setScanStatusWater("error");
            toast.warning(`Ảnh mờ hoặc không nhận diện được. Vui lòng nhập tay.`);
            setTimeout(() => {
                isElec ? setScanStatusElec("idle") : setScanStatusWater("idle");
            }, 3000);
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

    // Component Render UI EKYC Scanning Overlay
    const EkycOverlay = ({ status }) => {
        if (status === "idle") return null;
        return (
            // Thêm class `pointer-events-none` ở đây để chặn không cho thẻ div này hứng sự kiện click
            <div className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center transition-all duration-300
                ${status === "scanning" ? "bg-black/60 backdrop-blur-[3px]" : ""}
                ${status === "error" ? "ekyc-shake ring-4 ring-red-500 ring-inset bg-black/40" : ""}
                ${status === "success" ? "ring-4 ring-green-500 ring-inset bg-transparent" : ""}
            `}>
                {/* 4 Góc ngắm */}
                {(status === "scanning" || status === "error") && (
                    <>
                        <div className={`absolute top-4 left-4 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 rounded-tl-lg ${status === 'error' ? 'border-red-500' : 'border-brand'}`}></div>
                        <div className={`absolute top-4 right-4 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 rounded-tr-lg ${status === 'error' ? 'border-red-500' : 'border-brand'}`}></div>
                        <div className={`absolute bottom-4 left-4 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 rounded-bl-lg ${status === 'error' ? 'border-red-500' : 'border-brand'}`}></div>
                        <div className={`absolute bottom-4 right-4 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 rounded-br-lg ${status === 'error' ? 'border-red-500' : 'border-brand'}`}></div>
                    </>
                )}

                {/* Tia laser chạy dọc */}
                {status === "scanning" && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-400 shadow-[0_0_15px_4px_rgba(74,222,128,0.7)] ekyc-scan-line"></div>
                )}

                {/* Trạng thái Text / Icon */}
                {status === "scanning" && (
                    <div className="flex flex-col items-center justify-center">
                        <i className="fa-solid fa-circle-notch fa-spin text-brand text-3xl mb-3"></i>
                        <div className="text-white font-medium text-[12px] sm:text-[14px] animate-pulse tracking-wide">AI đang phân tích...</div>
                    </div>
                )}
                {status === "success" && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-[zoomIn_0.3s_ease-out]">
                        <i className="fa-solid fa-check text-white text-xl"></i>
                    </div>
                )}
                {status === "error" && (
                    <div className="text-white font-bold text-[12px] sm:text-[14px] bg-red-500/90 px-4 py-2 rounded-full drop-shadow-md">
                        <i className="fa-solid fa-triangle-exclamation mr-2"></i>Không nhận diện được
                    </div>
                )}
            </div>
        );
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm sm:p-4 transition-all">
            {/* CSS Animation Inject */}
            <style>{`
                @keyframes ekycScan {
                    0% { top: 5%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 95%; opacity: 0; }
                }
                @keyframes ekycShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    50% { transform: translateX(4px); }
                    75% { transform: translateX(-4px); }
                }
                .ekyc-scan-line { animation: ekycScan 2s linear infinite; }
                .ekyc-shake { animation: ekycShake 0.4s ease-in-out; }
            `}</style>

            <div className="bg-slate-50 w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[800px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                    <div>
                        <h2 className="text-[17px] sm:text-[20px] font-bold text-slate-800">Cập nhật điện nước</h2>
                        <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">Phòng {info.room_name} • {info.property_name}</p>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex justify-center items-center text-slate-500 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

                        {/* Hướng dẫn Call to Action */}
                        <div className="bg-indigo-50/80 border border-indigo-100 p-3 rounded-xl flex items-center justify-center gap-2 shadow-sm">
                            <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
                            <p className="text-[13px] sm:text-[14px] text-indigo-800 font-medium">
                                Chụp rõ nét đồng hồ để AI tự động nhận diện
                            </p>
                        </div>

                        {/* Row: Ngày chốt số */}
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                            <label className="text-[13px] sm:text-[14px] font-bold text-slate-700 whitespace-nowrap">Ngày chốt số:</label>
                            <input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} className="w-[150px] sm:w-[200px] px-3 py-2 border rounded-lg text-[13px] sm:text-[14px] font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-center" required />
                        </div>

                        {/* Grid 2 cột: Điện & Nước */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-6">

                            {/* --- CỘT ĐIỆN --- */}
                            <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center"><i className="fa-solid fa-bolt text-sm"></i></div>
                                    <h3 className="font-bold text-slate-800 text-[14px] sm:text-[16px]">ĐIỆN</h3>
                                </div>

                                <div className="bg-slate-50 py-2 px-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:justify-between items-center mb-4 text-[12px] sm:text-[13px] text-center">
                                    <span className="text-slate-500 mb-0.5 sm:mb-0">Số tháng trước</span>
                                    <span className="font-bold text-slate-700 text-[14px]">{isLoading ? '...' : info.electricity_previous}</span>
                                </div>

                                {/* Khu vực Ảnh / Camera */}
                                <div className="flex-1 flex flex-col">
                                    {elecPreview ? (
                                        <div className="w-full h-full relative cursor-pointer" onClick={() => setFullScreenImage(elecPreview)}>
                                            <div className="relative w-full aspect-[4/5] sm:aspect-video bg-black rounded-xl overflow-hidden group mb-4 shadow-inner" >
                                                <EkycOverlay status={scanStatusElec} />

                                                {/* Container Click Ảnh kèm icon kính lúp */}
                                                <img src={elecPreview} alt="Điện" className="w-full h-full object-cover group-hover:opacity-60 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <i className="fa-solid fa-magnifying-glass-plus text-white text-3xl drop-shadow-md"></i>
                                                </div>
                                            </div>

                                            <button type="button" onClick={(e) => {
                                                e.stopPropagation();
                                                setElecPreview(""); setElecImage(null); setScanStatusElec("idle"); setElecReading("");
                                            }} className="absolute top-2 right-2 z-20 w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex justify-center items-center shadow-md backdrop-blur-md transition-all">
                                                <i className="fa-solid fa-trash text-[12px]"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className={`mb-4 border-2 border-dashed ${dragActiveElec ? 'border-brand bg-green-50' : 'border-slate-300 bg-slate-50'} hover:bg-slate-100 hover:border-slate-400 transition-all flex flex-col items-center justify-center aspect-[4/5] sm:aspect-video rounded-xl cursor-pointer group`}
                                            onDragEnter={handleDrag("electricity")} onDragOver={handleDrag("electricity")} onDragLeave={handleDrag("electricity")} onDrop={handleDrop("electricity")}
                                        >
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white shadow-sm border border-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-105 group-hover:text-brand transition-all">
                                                <i className="fa-solid fa-camera text-xl"></i>
                                            </div>
                                            <span className="text-[12px] sm:text-[13px] font-semibold text-slate-600 text-center">Chụp ảnh</span>
                                            <span className="text-[11px] text-slate-400 mt-1 hidden sm:block">Hoặc kéo thả vào đây</span>
                                            <input type="file" accept="image/*" capture="environment" onChange={(e) => processFile(e.target.files?.[0], "electricity")} className="hidden" />
                                        </label>
                                    )}

                                    {/* Input Nhập Số ĐIỆN */}
                                    <div className="mt-auto relative">
                                        <i className="fa-solid fa-pen absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] pointer-events-none"></i>

                                        <input
                                            type="text" /* Đổi thành text để chặn các lỗi ngầm của trình duyệt */
                                            inputMode="numeric" /* Vẫn giữ lệnh này để Mobile mở bàn phím Numpad */
                                            value={elecReading}
                                            onChange={(e) => {
                                                // Lọc bỏ toàn bộ ký tự không phải là số (0-9)
                                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                setElecReading(numericValue);
                                            }}
                                            placeholder="Nhập số mới..."
                                            className={`w-full pl-9 pr-10 py-3 border rounded-xl text-[15px] sm:text-[18px] font-bold text-center outline-none transition-all ${scanStatusElec === 'success' ? 'border-green-500 bg-green-50 text-green-700 shadow-[0_0_0_4px_rgba(34,197,94,0.1)]' : 'border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20'}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-slate-400 pointer-events-none">kWh</span>
                                    </div>
                                </div>
                            </div>

                            {/* --- CỘT NƯỚC --- */}
                            <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"><i className="fa-solid fa-droplet text-sm"></i></div>
                                    <h3 className="font-bold text-slate-800 text-[14px] sm:text-[16px]">NƯỚC</h3>
                                </div>

                                <div className="bg-slate-50 py-2 px-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:justify-between items-center mb-4 text-[12px] sm:text-[13px] text-center">
                                    <span className="text-slate-500 mb-0.5 sm:mb-0">Số tháng trước</span>
                                    <span className="font-bold text-slate-700 text-[14px]">{isLoading ? '...' : info.water_previous}</span>
                                </div>

                                {/* Khu vực Ảnh / Camera */}
                                <div className="flex-1 flex flex-col">
                                    {waterPreview ? (
                                        <div className="relative w-full aspect-[4/5] sm:aspect-video bg-black rounded-xl overflow-hidden group mb-4 shadow-inner"
                                            onClick={() => setFullScreenImage(waterPreview)}>
                                            <EkycOverlay status={scanStatusWater} />

                                            {/* Container Click Ảnh kèm icon kính lúp */}
                                            <div className="w-full h-full relative cursor-pointer" >
                                                <img src={waterPreview} alt="Nước" className="w-full h-full object-cover group-hover:opacity-60 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <i className="fa-solid fa-magnifying-glass-plus text-white text-3xl drop-shadow-md"></i>
                                                </div>
                                            </div>

                                            <button type="button" onClick={(e) => { 
                                                e.stopPropagation();
                                                setWaterPreview(""); setWaterImage(null); setScanStatusWater("idle"); setWaterReading(""); }} className="absolute top-2 right-2 z-20 w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex justify-center items-center shadow-md backdrop-blur-md transition-all">
                                                <i className="fa-solid fa-trash text-[12px]"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className={`mb-4 border-2 border-dashed ${dragActiveWater ? 'border-brand bg-green-50' : 'border-slate-300 bg-slate-50'} hover:bg-slate-100 hover:border-slate-400 transition-all flex flex-col items-center justify-center aspect-[4/5] sm:aspect-video rounded-xl cursor-pointer group`}
                                            onDragEnter={handleDrag("water")} onDragOver={handleDrag("water")} onDragLeave={handleDrag("water")} onDrop={handleDrop("water")}
                                        >
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white shadow-sm border border-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-105 group-hover:text-brand transition-all">
                                                <i className="fa-solid fa-camera text-xl"></i>
                                            </div>
                                            <span className="text-[12px] sm:text-[13px] font-semibold text-slate-600 text-center">Chụp ảnh</span>
                                            <span className="text-[11px] text-slate-400 mt-1 hidden sm:block">Hoặc kéo thả vào đây</span>
                                            <input type="file" accept="image/*" capture="environment" onChange={(e) => processFile(e.target.files?.[0], "water")} className="hidden" />
                                        </label>
                                    )}

                                    {/* Input Nhập Số NƯỚC */}
                                    <div className="mt-auto relative">
                                        <i className="fa-solid fa-pen absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] pointer-events-none"></i>

                                        <input
                                            type="text" /* Đổi thành text */
                                            inputMode="numeric"
                                            value={waterReading}
                                            onChange={(e) => {
                                                // Lọc bỏ toàn bộ ký tự không phải là số (0-9)
                                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                setWaterReading(numericValue);
                                            }}
                                            placeholder="Nhập số mới..."
                                            className={`w-full pl-9 pr-10 py-3 border rounded-xl text-[15px] sm:text-[18px] font-bold text-center outline-none transition-all ${scanStatusWater === 'success' ? 'border-green-500 bg-green-50 text-green-700 shadow-[0_0_0_4px_rgba(34,197,94,0.1)]' : 'border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20'}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-slate-400 pointer-events-none">m³</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-slate-200 px-4 sm:px-6 py-4 bg-white shrink-0 flex items-center justify-between sm:justify-end gap-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)] z-20 relative">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-none px-6 py-3 sm:py-2.5 bg-slate-100 text-slate-700 rounded-xl text-[14px] font-bold hover:bg-slate-200 transition-colors">Đóng</button>
                        <button type="submit" disabled={isSubmitting} className="flex-[2] sm:flex-none px-8 py-3 sm:py-2.5 bg-brand text-white rounded-xl text-[14px] font-bold shadow-md hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
                            {isSubmitting ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fa-solid fa-arrow-up-from-bracket"></i>}
                            Xác nhận Gửi
                        </button>
                    </div>
                </form>
            </div>

            {/* OVERLAY ZOOM ẢNH TOÀN MÀN HÌNH */}
            {fullScreenImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-10 cursor-zoom-out animate-[fadeIn_0.2s_ease-out]" onClick={() => setFullScreenImage(null)}>
                    <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-white text-3xl sm:text-4xl transition-colors w-12 h-12 flex items-center justify-center bg-black/50 rounded-full">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    <img src={fullScreenImage} alt="Phóng to" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-[zoomIn_0.2s_ease-out]" />
                </div>
            )}
        </div>
    );
}