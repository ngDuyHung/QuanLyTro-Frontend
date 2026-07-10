import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import accountingLedgerService from "@/services/accountingLedgerService";

// Helper format tiền tệ
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return "0";
    return Number(amount).toLocaleString("vi-VN");
};

export default function LockLedgerModal({ open, onClose, properties = [], onSuccess }) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // Tháng hiện tại (1-12)

    // --- State Form bên trái ---
    const [form, setForm] = useState({
        property_id: "",
        period_type: "month",
        period_year: currentYear,
        period_month: currentMonth,
        note: "",
    });

    // --- State Dữ liệu bên phải ---
    const [ledgerRows, setLedgerRows] = useState([]);
    const [hasPreviewed, setHasPreviewed] = useState(false);

    // --- State UI ---
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientError, setClientError] = useState("");

    // Khóa cuộn background khi mở modal
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Reset lại toàn bộ form khi mở modal
    useEffect(() => {
        if (open) {
            setForm({
                property_id: "",
                period_type: "month",
                period_year: currentYear,
                period_month: currentMonth,
                note: "",
            });
            setLedgerRows([]);
            setHasPreviewed(false);
            setClientError("");
        }
    }, [open, currentYear, currentMonth]);

    if (!open) return null;

    // --- Handlers cho Cột Trái (Form) ---
    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setForm(prev => {
            const newForm = { ...prev, [field]: value };
            // Nếu đổi loại kỳ thành Năm thì set tháng về rỗng
            if (field === "period_type" && value === "year") {
                newForm.period_month = "";
            }
            return newForm;
        });
        // Khi đổi tham số thì yêu cầu xem trước lại
        setHasPreviewed(false);
        setClientError("");
    };

    const handlePreview = async () => {
        setClientError("");
        if (form.period_type === 'month' && !form.period_month) {
            return setClientError("Vui lòng chọn tháng.");
        }
        if (!form.period_year) {
            return setClientError("Vui lòng nhập năm.");
        }

        try {
            setIsLoadingPreview(true);
            const res = await accountingLedgerService.preview(form);

            // Gắn thêm 1 ID tạm (temp_id) cho mỗi dòng để React dễ render và update
            const detailsWithId = (res.data?.data?.details || []).map((item, idx) => ({
                ...item,
                temp_id: Date.now() + idx,
            }));

            setLedgerRows(detailsWithId);
            setHasPreviewed(true);

            if (detailsWithId.length === 0) {
                toast.info("Không có giao dịch thu nào trong kỳ này.");
            } else {
                toast.success("Lấy dữ liệu thành công. Bạn có thể chỉnh sửa trước khi chốt.");
            }
        } catch (error) {
            setClientError(error.response?.data?.message || "Không thể lấy trước dữ liệu.");
        } finally {
            setIsLoadingPreview(false);
        }
    };

    // --- Handlers cho Cột Phải (Table Data) ---
    const handleAddRow = () => {
        // Lấy ngày đầu tiên của tháng làm mặc định (hoặc ngày hiện tại)
        const defaultDate = new Date().toISOString().slice(0, 10);

        setLedgerRows([
            ...ledgerRows,
            {
                temp_id: Date.now(),
                transaction_date: defaultDate,
                description: "Thu nhập khác...",
                amount: 0
            }
        ]);
    };

    const handleUpdateRow = (id, field, value) => {
        setLedgerRows(prev => prev.map(row => {
            if (row.temp_id === id) {
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const handleRemoveRow = (id) => {
        setLedgerRows(prev => prev.filter(row => row.temp_id !== id));
    };

    // Tính tổng doanh thu realtime
    const totalRevenue = ledgerRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

    // --- Xử lý Submit chốt sổ ---
    const handleSubmit = async () => {
        setClientError("");
        if (ledgerRows.length === 0) {
            return setClientError("Sổ kế toán phải có ít nhất 1 dòng dữ liệu.");
        }

        // Validate cơ bản cho các dòng
        const hasInvalidRow = ledgerRows.some(r => !r.transaction_date || !r.description || r.amount < 0);
        if (hasInvalidRow) {
            return setClientError("Vui lòng nhập đầy đủ Ngày, Diễn giải và Số tiền (không được âm) cho các dòng.");
        }

        const payload = {
            ...form,
            total_revenue: totalRevenue, // Gửi kèm theo để validation của Request không bắt lỗi (dù Backend tự tính lại)
            details: ledgerRows.map(r => ({
                transaction_date: r.transaction_date,
                description: r.description,
                amount: r.amount
            }))
        };

        try {
            setIsSubmitting(true);
            await accountingLedgerService.lock(payload);
            toast.success("Đã chốt sổ kế toán thành công!");
            onSuccess?.();
            onClose();
        } catch (error) {
            setClientError(error.response?.data?.message || "Có lỗi xảy ra khi chốt sổ.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[1100px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                            <i className="fa-solid fa-lock text-[16px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800">Chốt sổ kế toán (S1a-HKD)</h2>
                            <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">
                                Lấy dữ liệu và tùy chỉnh các khoản thu trước khi khóa sổ gửi cơ quan thuế.
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Body (Chia 2 cột) */}
                <div className="flex-1 overflow-y-auto sm:overflow-hidden flex flex-col sm:flex-row bg-slate-50">

                    {/* CỘT TRÁI: Tham số bộ lọc */}
                    <div className="w-full sm:w-[320px] lg:w-[360px] flex flex-col bg-white border-b sm:border-b-0 sm:border-r border-slate-200 shrink-0 p-5 overflow-y-auto">
                        <h3 className="text-[14px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[11px]">1</span>
                            Chọn kỳ chốt sổ
                        </h3>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Khu nhà (Tùy chọn)</label>
                                <select value={form.property_id} onChange={handleChange("property_id")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand">
                                    <option value="">Toàn bộ hệ thống</option>
                                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Loại kỳ <span className="text-red-500">*</span></label>
                                <select value={form.period_type} onChange={handleChange("period_type")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand font-medium">
                                    <option value="month">Chốt theo Tháng</option>
                                    <option value="year">Chốt theo Năm</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Năm <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        value={form.period_year}
                                        onChange={handleChange("period_year")}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand"
                                    />
                                </div>
                                {form.period_type === 'month' && (
                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Tháng <span className="text-red-500">*</span></label>
                                        <select value={form.period_month} onChange={handleChange("period_month")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand">
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Ghi chú (Hiển thị nội bộ)</label>
                                <textarea
                                    value={form.note}
                                    onChange={handleChange("note")}
                                    placeholder="Ghi chú về kỳ chốt này..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand min-h-[80px] resize-none"
                                />
                            </div>

                            {clientError && (
                                <div className="text-[12px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                                    <i className="fa-solid fa-circle-exclamation mr-1.5"></i> {clientError}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handlePreview}
                                disabled={isLoadingPreview}
                                className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-[13px] font-semibold hover:bg-slate-900 transition-colors mt-2 flex items-center justify-center gap-2"
                            >
                                {isLoadingPreview ? (
                                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang tải...</>
                                ) : (
                                    <><i className="fa-solid fa-cloud-arrow-down"></i> Lấy dữ liệu tự động</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* CỘT PHẢI: Bảng chi tiết (Editable) */}
                    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative">
                        <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-white">
                            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[11px]">2</span>
                                Dữ liệu chi tiết Sổ (Bản nháp)
                            </h3>
                            {hasPreviewed && (
                                <button
                                    onClick={handleAddRow}
                                    className="text-[12px] font-semibold text-brand bg-brand/10 hover:bg-brand/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <i className="fa-solid fa-plus"></i> Thêm dòng
                                </button>
                            )}
                        </div>

                        {!hasPreviewed ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <i className="fa-solid fa-wand-magic-sparkles text-[24px]"></i>
                                </div>
                                <p className="text-[14px] font-medium text-slate-600 mb-1">Chưa có dữ liệu</p>
                                <p className="text-[12px] text-center">Hãy chọn cấu hình ở cột bên trái và bấm <strong>"Lấy dữ liệu tự động"</strong>.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                                {/* Grid Header (Only PC) */}
                                <div className="hidden sm:grid grid-cols-[130px_1fr_140px_36px] gap-3 pb-2 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase mb-3 px-1">
                                    <div>A. Ngày tháng</div>
                                    <div>B. Diễn giải (Nội dung)</div>
                                    <div className="text-right">1. Số tiền (VNĐ)</div>
                                    <div></div>
                                </div>

                                {/* List Rows */}
                                <div className="flex flex-col gap-3">
                                    {ledgerRows.map((row) => (
                                        <div key={row.temp_id} className="bg-white sm:bg-transparent border border-slate-200 sm:border-transparent p-3 sm:p-0 rounded-xl sm:rounded-none flex flex-col sm:grid sm:grid-cols-[130px_1fr_140px_36px] gap-3 sm:items-center relative shadow-sm sm:shadow-none">

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase sm:hidden">Ngày ghi sổ</span>
                                                <input
                                                    type="date"
                                                    value={row.transaction_date}
                                                    onChange={(e) => handleUpdateRow(row.temp_id, 'transaction_date', e.target.value)}
                                                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase sm:hidden">Diễn giải</span>
                                                <input
                                                    type="text"
                                                    value={row.description}
                                                    placeholder="Nội dung thu..."
                                                    onChange={(e) => handleUpdateRow(row.temp_id, 'description', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand font-medium text-slate-700"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase sm:hidden">Số tiền (VNĐ)</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={row.amount === 0 ? "" : Number(row.amount).toLocaleString("vi-VN")}
                                                    placeholder="0"
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/[^\d]/g, "");
                                                        handleUpdateRow(row.temp_id, 'amount', rawValue ? Number(rawValue) : 0);
                                                    }}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand font-bold text-brand sm:text-right"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(row.temp_id)}
                                                className="absolute top-3 right-3 sm:static sm:w-9 sm:h-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                                            >
                                                <i className="fa-solid fa-trash-can text-[14px]"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tổng doanh thu Footer */}
                        {hasPreviewed && (
                            <div className="bg-white border-t border-slate-200 p-4 shrink-0 flex justify-between items-center">
                                <span className="text-[13px] font-bold text-slate-600 uppercase">Tổng cộng kỳ này:</span>
                                <span className="text-[18px] font-black text-brand">{formatCurrency(totalRevenue)} VNĐ</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Modal Actions */}
                <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 flex items-center justify-end gap-3 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
                        disabled={isSubmitting || !hasPreviewed || ledgerRows.length === 0}
                        className="px-6 py-2.5 bg-brand text-white rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-brand/30 hover:bg-green-700 transition-colors"
                    >
                        {isSubmitting ? (
                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang chốt sổ...</>
                        ) : (
                            <><i className="fa-solid fa-check"></i> Xác nhận Chốt Sổ</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}