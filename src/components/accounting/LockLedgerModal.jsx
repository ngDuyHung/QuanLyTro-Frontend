import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import accountingLedgerService from "@/services/accountingLedgerService";

const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return "0";
    return Number(amount).toLocaleString("vi-VN");
};

export default function LockLedgerModal({ open, onClose, properties = [], onSuccess }) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // --- State Form (Top Bar) ---
    const [form, setForm] = useState({
        property_id: "",
        period_type: "month",
        period_year: currentYear,
        period_month: currentMonth,
        note: "",
    });

    // --- State Dữ liệu tổng (Client-side) ---
    const [allLedgerRows, setAllLedgerRows] = useState([]);
    
    // --- State Phân trang (Client-side) ---
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50; // Giới hạn 50 dòng mỗi trang để DOM không bị đơ

    // --- State UI ---
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientError, setClientError] = useState("");

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    useEffect(() => {
        if (open) {
            setForm({
                property_id: "",
                period_type: "month",
                period_year: currentYear,
                period_month: currentMonth,
                note: "",
            });
            setAllLedgerRows([]);
            setCurrentPage(1);
            setClientError("");
        }
    }, [open, currentYear, currentMonth]);

    if (!open) return null;

    // --- Handlers Top Bar ---
    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setForm(prev => {
            const newForm = { ...prev, [field]: value };
            if (field === "period_type" && value === "year") {
                newForm.period_month = "";
            }
            return newForm;
        });
        setClientError("");
    };

    const handlePreview = async () => {
        setClientError("");
        if (form.period_type === 'month' && !form.period_month) return setClientError("Vui lòng chọn tháng.");
        if (!form.period_year) return setClientError("Vui lòng nhập năm.");

        try {
            setIsLoadingPreview(true);
            const res = await accountingLedgerService.preview(form);
            const detailsWithId = (res.data?.data?.details || []).map((item, idx) => ({
                ...item,
                temp_id: Date.now() + idx,
            }));
            setAllLedgerRows(detailsWithId);
            setCurrentPage(1); // Reset về trang 1 khi lấy data mới
            
            if (detailsWithId.length === 0) toast.info("Không có giao dịch nào, bạn có thể thêm thủ công.");
            else toast.success(`Lấy thành công ${detailsWithId.length} dòng dữ liệu.`);
        } catch (error) {
            setClientError(error.response?.data?.message || "Không thể lấy trước dữ liệu.");
        } finally {
            setIsLoadingPreview(false);
        }
    };

    // --- Handlers Table Data (Excel-like) ---
    const handleAddRow = () => {
        const defaultDate = new Date().toISOString().slice(0, 10);
        const newRow = {
            temp_id: Date.now(),
            transaction_date: defaultDate,
            transaction_code: "",
            description: "",
            amount: 0
        };
        // Thêm vào đầu mảng để người dùng thấy ngay
        setAllLedgerRows([newRow, ...allLedgerRows]);
        setCurrentPage(1); // Nhảy về trang 1 để thấy dòng vừa thêm
    };

    const handleUpdateRow = (id, field, value) => {
        setAllLedgerRows(prev => prev.map(row => 
            row.temp_id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleRemoveRow = (id) => {
        setAllLedgerRows(prev => prev.filter(row => row.temp_id !== id));
        // Xử lý lùi trang nếu xóa hết dòng ở trang cuối
        const totalPagesAfterRemove = Math.ceil((allLedgerRows.length - 1) / rowsPerPage);
        if (currentPage > totalPagesAfterRemove && totalPagesAfterRemove > 0) {
            setCurrentPage(totalPagesAfterRemove);
        }
    };

    // --- Logic Phân Trang Client-side ---
    const totalPages = Math.ceil(allLedgerRows.length / rowsPerPage) || 1;
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return allLedgerRows.slice(start, start + rowsPerPage);
    }, [allLedgerRows, currentPage, rowsPerPage]);

    const totalRevenue = useMemo(() => {
        return allLedgerRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    }, [allLedgerRows]);

    // --- Xử lý Submit ---
    const handleSubmit = async () => {
        setClientError("");
        if (allLedgerRows.length === 0) return setClientError("Sổ kế toán phải có ít nhất 1 dòng dữ liệu.");

        const hasInvalidRow = allLedgerRows.some(r => !r.transaction_date || !r.description || r.amount < 0);
        if (hasInvalidRow) return setClientError("Vui lòng nhập đầy đủ Ngày, Diễn giải và Số tiền (không âm) cho các dòng.");

        const payload = {
            ...form,
            total_revenue: totalRevenue,
            details: allLedgerRows.map(r => ({
                transaction_date: r.transaction_date,
                transaction_code: r.transaction_code,
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 transition-all">
            <div className="bg-white w-full h-full sm:h-[90vh] max-w-[1200px] rounded-xl flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                
                {/* 1. HEADER */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                            <i className="fa-solid fa-file-invoice text-[15px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[16px] font-bold text-slate-800">Soạn & Chốt sổ kế toán (S1a-HKD)</h2>
                            <p className="text-[12px] text-slate-500">Lấy dữ liệu tự động hoặc nhập thủ công định dạng Excel</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* 2. TOP BAR (Filters & Actions) */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 flex flex-col gap-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-full sm:w-auto flex-1 min-w-[200px]">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Khu nhà (Hộ kinh doanh)</label>
                            <select value={form.property_id} onChange={handleChange("property_id")} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand">
                                <option value="">Toàn bộ hệ thống</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="w-[140px] shrink-0">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kỳ chốt <span className="text-red-500">*</span></label>
                            <select value={form.period_type} onChange={handleChange("period_type")} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand font-medium">
                                <option value="month">Theo Tháng</option>
                                <option value="year">Theo Năm</option>
                            </select>
                        </div>

                        {form.period_type === 'month' && (
                            <div className="w-[100px] shrink-0">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tháng <span className="text-red-500">*</span></label>
                                <select value={form.period_month} onChange={handleChange("period_month")} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand">
                                    {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="w-[100px] shrink-0">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Năm <span className="text-red-500">*</span></label>
                            <input type="number" value={form.period_year} onChange={handleChange("period_year")} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
                        </div>
                        
                        <div className="w-full sm:w-auto flex-1 min-w-[200px]">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Ghi chú (Nội bộ)</label>
                            <input type="text" value={form.note} onChange={handleChange("note")} placeholder="Ghi chú về kỳ này..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
                        {clientError && (
                            <div className="text-[12px] text-red-600 font-medium flex items-center">
                                <i className="fa-solid fa-circle-exclamation mr-1.5"></i> {clientError}
                            </div>
                        )}
                        <div className="flex gap-2 w-full sm:w-auto ml-auto">
                            <button onClick={handleAddRow} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                <i className="fa-solid fa-plus"></i> Thêm dòng
                            </button>
                            <button onClick={handlePreview} disabled={isLoadingPreview} className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 text-white rounded-lg text-[13px] font-semibold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2">
                                {isLoadingPreview ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fa-solid fa-cloud-arrow-down"></i>}
                                Tự động lấy dữ liệu
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. BẢNG DỮ LIỆU EXCEL-LIKE (Phần chiếm diện tích chính) */}
                <div className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50/50 relative">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm outline outline-1 outline-slate-200">
                            <tr className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                <th className="py-2.5 px-3 w-[50px] text-center border-r border-slate-200">STT</th>
                                <th className="py-2.5 px-4 w-[140px] border-r border-slate-200">Ngày ghi sổ</th>
                                <th className="py-2.5 px-4 w-[150px] border-r border-slate-200">Mã chứng từ (Tùy chọn)</th>
                                <th className="py-2.5 px-4 border-r border-slate-200">Diễn giải (Nội dung)</th>
                                <th className="py-2.5 px-4 w-[160px] text-right border-r border-slate-200">Số tiền (VNĐ)</th>
                                <th className="py-2.5 px-3 w-[50px] text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {allLedgerRows.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <i className="fa-regular fa-folder-open text-3xl mb-2 text-slate-300"></i>
                                            <p className="text-[13px]">Bảng dữ liệu đang trống. Hãy bấm "Tự động lấy dữ liệu" hoặc "Thêm dòng".</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map((row, idx) => {
                                    const actualIndex = (currentPage - 1) * rowsPerPage + idx + 1;
                                    return (
                                        <tr key={row.temp_id} className="border-b border-slate-200 hover:bg-blue-50/30 group">
                                            <td className="py-1.5 px-3 text-center text-[12px] text-slate-400 border-r border-slate-100 font-medium">{actualIndex}</td>
                                            <td className="py-1.5 px-1.5 border-r border-slate-100">
                                                <input
                                                    type="date"
                                                    value={row.transaction_date || ""}
                                                    onChange={(e) => handleUpdateRow(row.temp_id, 'transaction_date', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-brand rounded text-[13px] outline-none transition-colors"
                                                />
                                            </td>
                                            <td className="py-1.5 px-1.5 border-r border-slate-100">
                                                <input
                                                    type="text"
                                                    placeholder="VD: PT001"
                                                    value={row.transaction_code || ""}
                                                    onChange={(e) => handleUpdateRow(row.temp_id, 'transaction_code', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-brand rounded text-[13px] outline-none transition-colors uppercase placeholder:normal-case"
                                                />
                                            </td>
                                            <td className="py-1.5 px-1.5 border-r border-slate-100">
                                                <input
                                                    type="text"
                                                    placeholder="Nội dung khoản thu..."
                                                    value={row.description || ""}
                                                    onChange={(e) => handleUpdateRow(row.temp_id, 'description', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-brand rounded text-[13px] text-slate-700 font-medium outline-none transition-colors"
                                                />
                                            </td>
                                            <td className="py-1.5 px-1.5 border-r border-slate-100">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="0"
                                                    value={row.amount === 0 ? "" : Number(row.amount).toLocaleString("vi-VN")}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/[^\d]/g, "");
                                                        handleUpdateRow(row.temp_id, 'amount', rawValue ? Number(rawValue) : 0);
                                                    }}
                                                    className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-brand rounded text-[13px] font-bold text-brand text-right outline-none transition-colors"
                                                />
                                            </td>
                                            <td className="py-1.5 px-1.5 text-center">
                                                <button onClick={() => handleRemoveRow(row.temp_id)} tabIndex="-1" className="w-7 h-7 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center mx-auto opacity-0 group-hover:opacity-100 transition-all">
                                                    <i className="fa-solid fa-trash-can text-[12px]"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 4. THANH PHÂN TRANG CLIENT-SIDE */}
                {allLedgerRows.length > 0 && (
                    <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between">
                        <div className="text-[12px] text-slate-500 font-medium">
                            Tổng số <span className="font-bold text-slate-700">{allLedgerRows.length}</span> dòng
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[12px] text-slate-500">Trang {currentPage} / {totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                                    <i className="fa-solid fa-angle-left text-[11px]"></i>
                                </button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-7 h-7 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                                    <i className="fa-solid fa-angle-right text-[11px]"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. FOOTER & TỔNG TIỀN */}
                <div className="bg-white border-t border-slate-200 px-5 py-3.5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <span className="text-[13px] font-bold text-slate-600 uppercase text-center sm:text-left w-full sm:w-auto">
                            TỔNG DOANH THU CHỐT SỔ:
                        </span>
                        <span className="text-[20px] font-black text-brand text-center sm:text-left w-full sm:w-auto">
                            {formatCurrency(totalRevenue)} VNĐ
                        </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-70">
                            Hủy
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={isSubmitting || allLedgerRows.length === 0} className="flex-1 sm:flex-none px-6 py-2.5 bg-brand text-white rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm shadow-brand/30 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Xử lý...</> : <><i className="fa-solid fa-lock"></i> Lưu Chốt Sổ</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}