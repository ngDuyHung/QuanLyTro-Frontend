import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import propertyService from "@/services/propertyService";

export default function LedgerConfigModal({ open, onClose, properties = [], onSuccess }) {
    const [selectedPropertyId, setSelectedPropertyId] = useState("");
    const [formData, setFormData] = useState({
        tax_code: "",
        representative_name: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tự động chọn khu nhà đầu tiên nếu danh sách có dữ liệu khi mở modal
    useEffect(() => {
        if (open && properties.length > 0 && !selectedPropertyId) {
            setSelectedPropertyId(String(properties[0].id));
        }
    }, [open, properties, selectedPropertyId]);

    // Khi đổi khu nhà (hoặc qua click list bên trái), tự động điền data hiện tại
    useEffect(() => {
        if (selectedPropertyId) {
            const prop = properties.find(p => p.id === Number(selectedPropertyId));
            if (prop) {
                setFormData({
                    tax_code: prop.tax_code || "",
                    representative_name: prop.representative_name || ""
                });
            }
        } else {
            setFormData({ tax_code: "", representative_name: "" });
        }
    }, [selectedPropertyId, properties]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPropertyId) {
            return toast.warning("Vui lòng chọn khu nhà để cấu hình.");
        }

        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                _method: "PUT" // Laravel Method Spoofing
            };
            
            await propertyService.update(selectedPropertyId, payload);
            toast.success("Đã cập nhật thông tin pháp lý thành công!");
            onSuccess?.(); // Tải lại danh sách khu nhà ở component cha để cập nhật trạng thái mới
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể cập nhật thông tin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-[850px] h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[fadeIn_0.2s_ease-out]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <i className="fa-solid fa-file-signature text-[16px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[17px] font-bold text-slate-800">Cấu hình Sổ kế toán doanh thu</h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">Mẫu S1a-HKD theo Thông tư 152/2025/TT-BTC</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Split Content Body */}
                <div className="flex flex-1 overflow-hidden bg-slate-50 flex-col md:flex-row">
                    
                    {/* CỘT TRÁI: DÀNH RIÊNG XEM DANH SÁCH BẢNG CẤU HÌNH */}
                    <div className="w-full md:w-[320px] bg-white border-b md:border-b-0 md:border-r border-slate-100 flex flex-col overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-100 shrink-0">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Danh sách khu nhà trọ</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 [&::-webkit-scrollbar]:hidden">
                            {properties.length === 0 ? (
                                <p className="text-slate-400 text-center py-4 text-[13px] italic">Chưa có khu nhà nào.</p>
                            ) : (
                                properties.map((p) => {
                                    const isSelected = String(p.id) === selectedPropertyId;
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => setSelectedPropertyId(String(p.id))}
                                            className={`p-3 rounded-xl cursor-pointer transition-all border ${
                                                isSelected
                                                    ? "bg-brand/5 border-brand/30 ring-1 ring-brand/20"
                                                    : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <span className={`text-[13px] font-bold block truncate ${isSelected ? "text-brand" : "text-slate-700"}`}>
                                                    {p.name}
                                                </span>
                                                {p.is_ledger_configured ? (
                                                    <span className="shrink-0 text-[10px] font-semibold bg-green-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                                                        Đã xong
                                                    </span>
                                                ) : (
                                                    <span className="shrink-0 text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                                        Chưa có
                                                    </span>
                                                )}
                                            </div>
                                            {p.is_ledger_configured && (
                                                <div className="mt-2 text-[11px] text-slate-400 space-y-0.5 font-medium">
                                                    <p className="truncate"><i className="fa-solid fa-id-card text-[10px] mr-1"></i>MST: {p.tax_code}</p>
                                                    <p className="truncate"><i className="fa-solid fa-user-tie text-[10px] mr-1"></i>ĐD: {p.representative_name}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI: FORM CHỈNH SỬA CHO KHU ĐANG CHỌN */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                        <div className="p-6 flex flex-col gap-5 flex-1">
                            
                            <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl flex gap-3 text-[13px] text-blue-800 leading-relaxed shadow-sm">
                                <i className="fa-solid fa-circle-info mt-0.5 text-blue-500 text-[14px]"></i>
                                <p>Thông tin pháp lý dưới đây phục vụ cho mục đích in ấn. Hệ thống sẽ tự động điền vào phần tiêu đề dòng, mã số thuế và chữ ký người đại diện khi kết xuất file PDF báo cáo tài chính.</p>
                            </div>

                            {selectedPropertyId ? (
                                <>
                                    <div className="bg-slate-100/80 p-3 rounded-lg border border-slate-200/60 text-[13px]">
                                        <span className="text-slate-500 font-medium">Khu nhà đang cấu hình:</span>{" "}
                                        <span className="font-bold text-slate-800">
                                            {properties.find(p => p.id === Number(selectedPropertyId))?.name}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Mã số thuế hộ kinh doanh</label>
                                        <input
                                            type="text"
                                            name="tax_code"
                                            value={formData.tax_code}
                                            onChange={handleChange}
                                            placeholder="Nhập mã số thuế (nếu có)..."
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand shadow-sm uppercase placeholder:normal-case font-mono tracking-wider focus:ring-1 focus:ring-brand"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Người đại diện (Chủ hộ kinh doanh) <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="representative_name"
                                            value={formData.representative_name}
                                            onChange={handleChange}
                                            placeholder="VD: NGUYỄN VĂN A"
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand shadow-sm uppercase placeholder:normal-case font-bold focus:ring-1 focus:ring-brand"
                                            required
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                                    <i className="fa-solid fa-arrow-pointer text-2xl animate-bounce"></i>
                                    <p className="text-[13px] font-medium">Vui lòng chọn một khu nhà từ danh sách bên trái để cấu hình.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer gắn liền trong form bên phải */}
                        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex justify-end gap-2.5 shrink-0 sticky bottom-0 z-10">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                Đóng
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || !selectedPropertyId} 
                                className="px-6 py-2.5 text-[13px] font-bold text-white bg-brand hover:bg-green-700 rounded-lg transition-colors shadow-sm shadow-brand/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? <><i className="fa-solid fa-spinner animate-spin"></i> Đang cập nhật...</> : "Lưu cấu hình"}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}