import React, { useState, useEffect } from "react";
import tenantUtilityService from "@/services/tenantUtilityService";

const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("vi-VN");
};

export default function TenantViewUtilityModal({ open, reading: initialReading, onClose }) {
    const [reading, setReading] = useState(null);
    const [fullScreenImage, setFullScreenImage] = useState(null);

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    useEffect(() => {
        if (open && initialReading?.id) {
            tenantUtilityService.getById(initialReading.id)
                .then(res => setReading(res.data.data))
                .catch(() => onClose());
        } else {
            setReading(null);
        }
    }, [open, initialReading]);

    if (!open || !reading) return null;

    const isElec = reading.type === 'electricity';
    const conf = isElec ? { label: "Điện", unit: "kWh", color: "amber" } : { label: "Nước", unit: "m³", color: "blue" };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-slate-50 w-full max-w-xl h-auto max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200 bg-white">
                    <h2 className={`font-bold text-lg text-${conf.color}-600`}>Chi tiết số {conf.label}</h2>
                    <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full text-slate-500 flex justify-center items-center"><i className="fa-solid fa-xmark"></i></button>
                </div>

                <div className="p-5 overflow-y-auto">
                    <div className="bg-white border rounded-xl p-4 shadow-sm text-center mb-4">
                        <p className="text-slate-500 text-sm mb-2">Ngày chốt: <b>{formatDate(reading.reading_date)}</b></p>
                        <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-lg">
                            <div><p className="text-xs text-slate-400">Số cũ</p><p className="font-bold text-slate-700">{reading.previous_reading}</p></div>
                            <i className="fa-solid fa-arrow-right text-slate-300"></i>
                            <div><p className="text-xs text-slate-400">Số mới</p><p className="font-bold text-slate-800 text-lg">{reading.current_reading}</p></div>
                        </div>
                        <div className={`mt-3 p-3 bg-${conf.color}-50 border border-${conf.color}-100 rounded-lg flex justify-between items-center`}>
                            <span className="font-bold text-slate-700">Tiêu thụ:</span>
                            <span className={`text-xl font-black text-${conf.color}-600`}>{reading.usage} <span className="text-sm font-normal">{conf.unit}</span></span>
                        </div>
                    </div>

                    <p className="font-bold text-sm mb-2 text-slate-700">Ảnh đồng hồ thực tế</p>
                    <div className="w-full bg-black rounded-xl aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                        {reading.meter_image ? (
                            <img 
                                src={reading.meter_image}
                                alt="Đồng hồ" 
                                className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setFullScreenImage(reading.meter_image)}
                            />
                        ) : (
                            <p className="text-slate-500 text-sm"><i className="fa-solid fa-image text-2xl block mb-2 text-center"></i> Không có ảnh minh chứng</p>
                        )}
                    </div>
                </div>
            </div>

            {/* OVERLAY ZOOM ẢNH */}
            {fullScreenImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-10 cursor-zoom-out" 
                    onClick={() => setFullScreenImage(null)}
                >
                    <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"><i className="fa-solid fa-xmark"></i></button>
                    <img src={fullScreenImage} alt="Zoom" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                </div>
            )}
        </div>
    );
}