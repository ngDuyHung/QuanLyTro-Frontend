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

    // Khi đổi khu nhà, tự động điền data hiện tại của khu nhà đó vào form
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
            // Gọi API update property (chỉ gửi 2 trường cần update)
            await propertyService.update(selectedPropertyId, formData);
            toast.success("Đã cập nhật thông tin pháp lý thành công!");
            onSuccess?.(); // Trigger fetchProperties lại ở component cha
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể cập nhật thông tin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <i className="fa-solid fa-file-signature text-[16px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[17px] font-bold text-slate-800">Cấu hình Sổ kế toán</h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">Mẫu S1a-HKD theo TT 152/2025/TT-BTC</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 flex flex-col gap-5 bg-slate-50">
                        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg flex gap-3 text-[13px] text-blue-800">
                            <i className="fa-solid fa-circle-info mt-0.5"></i>
                            <p>Thông tin này sẽ được in trực tiếp lên phần Header và Chữ ký của file PDF Sổ kế toán.</p>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Chọn khu nhà (Hộ kinh doanh) <span className="text-red-500">*</span></label>
                            <select
                                value={selectedPropertyId}
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand shadow-sm"
                                required
                            >
                                <option value="" disabled>-- Chọn khu nhà cần cấu hình --</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Mã số thuế</label>
                            <input
                                type="text"
                                name="tax_code"
                                value={formData.tax_code}
                                onChange={handleChange}
                                placeholder="VD: 8394857392"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand shadow-sm uppercase placeholder:normal-case"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Người đại diện (Chủ hộ kinh doanh)</label>
                            <input
                                type="text"
                                name="representative_name"
                                value={formData.representative_name}
                                onChange={handleChange}
                                placeholder="VD: NGUYỄN VĂN A"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-brand shadow-sm uppercase placeholder:normal-case"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting || !selectedPropertyId} className="px-6 py-2.5 text-[13px] font-bold text-white bg-brand hover:bg-green-700 rounded-lg transition-colors shadow-sm shadow-brand/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            {isSubmitting ? <><i className="fa-solid fa-spinner animate-spin"></i> Đang lưu...</> : "Lưu cấu hình"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}