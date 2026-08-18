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
        include_deposit: false, // Thêm logic Gộp tiền cọc
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
                include_deposit: false,
            });
            setAllLedgerRows([]);
            setCurrentPage(1);
            setClientError("");
        }
    }, [open, currentYear, currentMonth]);

    if (!open) return null;

    // --- Handlers Top Bar ---
    const handleChange = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
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
        // Thêm vào cuối mảng thay vì đầu mảng để luồng nhập liệu tự nhiên hơn
        const newRows = [...allLedgerRows, newRow];
        setAllLedgerRows(newRows);
        // Chuyển đến trang cuối cùng để thấy dòng vừa thêm
        setCurrentPage(Math.ceil(newRows.length / rowsPerPage));
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            {/* Trên Mobile sẽ full 100vh 100vw, bỏ bo góc */}
            <div className="bg-white w-full h-full sm:h-[90vh] max-w-[1200px] rounded-none sm:rounded-xl flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.15s_ease-out]">

                {/* 1. HEADER (Siêu mỏng trên Mobile) */}
                <div className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                            <i className="fa-solid fa-file-invoice text-[14px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[14px] sm:text-[16px] font-bold text-slate-800 leading-tight">Soạn & Chốt sổ kế toán</h2>
                            <p className="text-[11px] sm:text-[12px] text-slate-500 hidden sm:block">Lấy dữ liệu tự động hoặc nhập thủ công định dạng Excel</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* 2. TOP BAR / FILTERS (Được tối ưu Grid cho nhỏ gọn) */}
                <div className="bg-slate-50 border-b border-slate-200 p-2 sm:p-4 shrink-0 flex flex-col gap-2">
                    {/* Dòng 1: Các Selectors */}
                    <div className="grid grid-cols-3 sm:flex flex-wrap items-end gap-2">
                        {/* Khu nhà (Chiếm 3 cột trên mobile để full width, Flex-1 trên PC) */}
                        <div className="col-span-3 sm:col-span-1 sm:flex-1 min-w-[150px]">
                            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-0.5">Khu nhà</label>
                            <select value={form.property_id} onChange={handleChange("property_id")} className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-white border border-slate-200 rounded-lg text-[12px] sm:text-[13px] outline-none focus:border-brand">
                                <option value="">Toàn bộ hệ thống</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="col-span-1 sm:w-[120px] shrink-0">
                            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-0.5">Kỳ <span className="text-red-500">*</span></label>
                            <select value={form.period_type} onChange={handleChange("period_type")} className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-white border border-slate-200 rounded-lg text-[12px] sm:text-[13px] outline-none focus:border-brand font-medium">
                                <option value="month">Tháng</option>
                                <option value="year">Năm</option>
                            </select>
                        </div>

                        {form.period_type === 'month' ? (
                            <div className="col-span-1 sm:w-[90px] shrink-0">
                                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-0.5">Tháng <span className="text-red-500">*</span></label>
                                <select value={form.period_month} onChange={handleChange("period_month")} className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-white border border-slate-200 rounded-lg text-[12px] sm:text-[13px] outline-none focus:border-brand">
                                    {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="col-span-1 sm:w-[90px] shrink-0"></div> // Placeholder giữ layout grid
                        )}

                        <div className="col-span-1 sm:w-[90px] shrink-0">
                            <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-0.5">Năm <span className="text-red-500">*</span></label>
                            <input type="number" value={form.period_year} onChange={handleChange("period_year")} className="w-full px-2 py-2 sm:px-3 sm:py-2 bg-white border border-slate-200 rounded-lg text-[12px] sm:text-[13px] outline-none focus:border-brand" />
                        </div>
                    </div>

                    {/* Dòng 2: Ghi chú, Checkbox và Nút Fetch */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 mt-1">

                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                            <input
                                type="text"
                                value={form.note}
                                onChange={handleChange("note")}
                                placeholder="Ghi chú nội bộ..."
                                className="w-full sm:max-w-[250px] px-2 py-2 sm:px-3 sm:py-2 bg-white border border-slate-200 rounded-lg text-[12px] sm:text-[13px] outline-none focus:border-brand"
                            />

                            {/* Checkbox Gộp tiền cọc (Thiết kế tinh gọn) */}
                            <label className="flex items-center gap-2 cursor-pointer group py-1 sm:py-0 px-1 sm:px-0">
                                <input
                                    type="checkbox"
                                    checked={form.include_deposit}
                                    onChange={handleChange("include_deposit")}
                                    className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand accent-brand cursor-pointer"
                                />
                                <span className="text-[11.5px] sm:text-[12px] font-medium sm:font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
                                    Bao gồm Tiền cọc (Giữ hộ)
                                </span>
                            </label>
                        </div>

                        {/* Nút Fetch Data */}
                        <button
                            onClick={handlePreview}
                            disabled={isLoadingPreview}
                            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 text-white rounded-lg text-[12px] sm:text-[13px] font-semibold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            {isLoadingPreview ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <i className="fa-solid fa-cloud-arrow-down"></i>
                            )}
                            Tự động lấy dữ liệu
                        </button>
                    </div>

                    {clientError && (
                        <div className="text-[11px] sm:text-[12px] text-red-600 font-medium flex items-center mt-0.5">
                            <i className="fa-solid fa-circle-exclamation mr-1.5"></i> {clientError}
                        </div>
                    )}
                </div>

                {/* 3. BẢNG DỮ LIỆU "DENSE SPREADSHEET" */}
                {/* overflow-x-auto giúp cuộn ngang, touch-pan-x giúp vuốt mượt trên mobile */}
                <div className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50/50 relative touch-pan-x touch-pan-y">
                    <table className="w-full text-left border-collapse min-w-[750px] sm:min-w-[900px]">
                        <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm outline outline-1 outline-slate-200">
                            <tr className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                <th className="py-2 px-1 sm:py-2.5 sm:px-3 w-[40px] sm:w-[50px] text-center border-r border-slate-200">STT</th>
                                <th className="py-2 px-2 sm:py-2.5 sm:px-4 w-[110px] sm:w-[140px] border-r border-slate-200">Ngày</th>
                                <th className="py-2 px-2 sm:py-2.5 sm:px-4 w-[120px] sm:w-[150px] border-r border-slate-200">Mã (Tùy chọn)</th>
                                <th className="py-2 px-2 sm:py-2.5 sm:px-4 border-r border-slate-200">Diễn giải (Nội dung)</th>
                                <th className="py-2 px-2 sm:py-2.5 sm:px-4 w-[130px] sm:w-[160px] text-right border-r border-slate-200">Số tiền (VNĐ)</th>
                                <th className="py-2 px-1 sm:py-2.5 sm:px-3 w-[35px] sm:w-[50px] text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {allLedgerRows.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-10 sm:py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <i className="fa-regular fa-folder-open text-2xl sm:text-3xl mb-2 text-slate-300"></i>
                                            <p className="text-[12px] sm:text-[13px]">Bảng dữ liệu trống.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRows.map((row, idx) => {
                                    const actualIndex = (currentPage - 1) * rowsPerPage + idx + 1;
                                    return (
                                        <tr key={row.temp_id} className="border-b border-slate-200 hover:bg-blue-50/30 group">
                                            <td className="py-1 px-1 sm:py-1.5 sm:px-3 text-center text-[11px] sm:text-[12px] text-slate-400 border-r border-slate-100 font-medium">
                                                {actualIndex}
                                            </td>
                                            <td className="py-1 px-1 sm:py-1.5 border-r border-slate-100">
                                                <input
                                                    type="date"
                                                    value={row.transaction_date || ""}
                                                    onChange={(e) => handleUpdateRow(row.temp_id, 'transaction_date', e.target.value)}
                                                    className="w-full px-1.5 py-1 sm:px-2 sm:py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-brand rounded text-[12px] sm:text-[13px] outline-none transition-colors"
                                                />
                                            </td>
                                            <td className="py-1 px-1 sm:py-1.5 border-r border-slate-100">
                                                <input
                                                    type="text"
                                                    placeholder="VD: PT001"
                                                    value={row.transaction_code || ""}
                                                    onChange={(e) => handleUpdateRow(row.temp_id, 'transaction_code', e.target.value)}
                                                    className="w-full px-1.5 py-1 sm:px-2 sm:py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-brand rounded text-[12px] sm:text-[13px] outline-none transition-colors uppercase placeholder:normal-case"
                                                />
                                            </td>
                                            <td className="py-1 px-1 sm:py-1.5 border-r border-slate-100">
                                                <input
                                                    type="text"
                                                    placeholder="Nội dung..."
                                                    value={row.description || ""}
                                                    onChange={(e) => handleUpdateRow(row.temp_id, 'description', e.target.value)}
                                                    className="w-full px-1.5 py-1 sm:px-2 sm:py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-brand rounded text-[12px] sm:text-[13px] text-slate-700 font-medium outline-none transition-colors"
                                                />
                                            </td>
                                            <td className="py-1 px-1 sm:py-1.5 border-r border-slate-100">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="0"
                                                    value={row.amount === 0 ? "" : Number(row.amount).toLocaleString("vi-VN")}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/[^\d]/g, "");
                                                        handleUpdateRow(row.temp_id, 'amount', rawValue ? Number(rawValue) : 0);
                                                    }}
                                                    className="w-full px-1.5 py-1 sm:px-2 sm:py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-brand rounded text-[12px] sm:text-[13px] font-bold text-brand text-right outline-none transition-colors"
                                                />
                                            </td>
                                            <td className="py-1 px-1 sm:py-1.5 text-center">
                                                {/* Ép luôn hiện màu đỏ nhạt trên Mobile, hiện rõ khi Hover trên PC */}
                                                <button
                                                    onClick={() => handleRemoveRow(row.temp_id)}
                                                    tabIndex="-1"
                                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded text-red-400 sm:text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center mx-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all active:scale-90"
                                                >
                                                    <i className="fa-solid fa-trash-can text-[11px] sm:text-[12px]"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 4. THANH PHÂN TRANG */}
                {allLedgerRows.length > 0 && (
                    <div className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between">
                        <div className="text-[11px] sm:text-[12px] text-slate-500 font-medium">
                            <span className="hidden sm:inline">Tổng số</span> <span className="font-bold text-slate-700">{allLedgerRows.length}</span> <span className="hidden sm:inline">dòng</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-[11px] sm:text-[12px] text-slate-500">Trang {currentPage} / {totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                                    <i className="fa-solid fa-angle-left text-[10px] sm:text-[11px]"></i>
                                </button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                                    <i className="fa-solid fa-angle-right text-[10px] sm:text-[11px]"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. STICKY BOTTOM FOOTER */}
                <div className="bg-white border-t border-slate-200 px-3 py-2 sm:px-5 sm:py-3.5 shrink-0 flex items-center justify-between gap-2 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">

                    <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-3 flex-1 min-w-0">
                        <span className="text-[11px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-tight">
                            Tổng<span className="hidden sm:inline"> doanh thu</span>:
                        </span>
                        <span className="text-[16px] sm:text-[20px] font-black text-brand leading-tight truncate pr-2">
                            {formatCurrency(totalRevenue)} <span className="text-[12px] sm:text-[14px]">đ</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Nút thêm dòng được dời xuống đây để dễ thao tác trên mobile */}
                        <button
                            onClick={handleAddRow}
                            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-100 text-slate-700 rounded-lg text-[12px] sm:text-[13px] font-semibold hover:bg-slate-200 flex items-center gap-1.5 transition-colors active:scale-95"
                        >
                            <i className="fa-solid fa-plus"></i> <span>Thêm dòng</span>
                        </button>

                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="hidden sm:block px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-70"
                        >
                            Hủy
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || allLedgerRows.length === 0}
                            className="px-4 py-2 sm:px-6 sm:py-2.5 bg-brand text-white rounded-lg text-[12px] sm:text-[13px] font-bold flex items-center gap-1.5 shadow-sm shadow-brand/30 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {isSubmitting ? (
                                <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> <span className="hidden sm:inline">Xử lý...</span></>
                            ) : (
                                <><i className="fa-solid fa-lock"></i> <span className="hidden sm:inline">Lưu Chốt Sổ</span><span className="sm:hidden">Lưu</span></>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}