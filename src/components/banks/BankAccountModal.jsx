import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import bankAccountService from "@/services/bankAccountService";

const initialForm = {
    bank_name: "",
    bank_code: "",
    account_number: "",
    account_name: "",
    branch: "",
    is_default: false,
};

export default function BankAccountModal({ open, onClose, onSuccess, account = null }) {
    const [form, setForm] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientError, setClientError] = useState("");

    // --- State cho Dropdown Ngân hàng ---
    const [banks, setBanks] = useState([]);
    const [searchBank, setSearchBank] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // 1. Fetch danh sách ngân hàng từ VietQR (Chuẩn chung của các hệ thống thanh toán VN)
    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await fetch("https://api.vietqr.io/v2/banks");
                const data = await res.json();
                if (data.code === "00") {
                    setBanks(data.data);
                }
            } catch (error) {
                console.error("Lỗi tải danh sách ngân hàng VietQR:", error);
            }
        };
        fetchBanks();
    }, []);

    // 2. Xử lý click ra ngoài để đóng dropdown ngân hàng
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Khóa cuộn background khi mở Modal
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Nạp dữ liệu khi mở Modal
    useEffect(() => {
        if (open) {
            setClientError("");
            if (account) {
                setForm({
                    bank_name: account.bank_name || "",
                    bank_code: account.bank_code || "",
                    account_number: account.account_number || "",
                    account_name: account.account_name || "",
                    branch: account.branch || "",
                    is_default: account.is_default ? true : false,
                });
                setSearchBank(account.bank_code); // Hiển thị mã ngân hàng cũ lên ô search
            } else {
                setForm(initialForm);
                setSearchBank("");
            }
            setIsDropdownOpen(false);
        }
    }, [open, account]);

    const handleChange = (field) => (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSelectBank = (bank) => {
        setForm(prev => ({
            ...prev,
            bank_code: bank.shortName, // Mã chuẩn (VD: VCB, MB)
            bank_name: bank.name       // Tên đầy đủ
        }));
        setSearchBank(bank.shortName); // Gắn tên ngắn vào input hiển thị
        setIsDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setClientError("");

        if (!form.bank_name || !form.bank_code || !form.account_number || !form.account_name) {
            return setClientError("Vui lòng điền đầy đủ các trường bắt buộc (*).");
        }

        try {
            setIsSubmitting(true);
            if (account) {
                await bankAccountService.update(account.id, form);
                toast.success("Cập nhật tài khoản thành công!");
            } else {
                await bankAccountService.create(form);
                toast.success("Thêm tài khoản ngân hàng thành công!");
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            setClientError(error.response?.data?.message || "Có lỗi xảy ra khi lưu thông tin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Lọc ngân hàng theo từ khóa search
    const filteredBanks = banks.filter(b => 
        b.shortName?.toLowerCase().includes(searchBank.toLowerCase()) || 
        b.name?.toLowerCase().includes(searchBank.toLowerCase()) ||
        b.code?.includes(searchBank)
    );

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-slate-50 w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[500px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">
                
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                            <i className="fa-solid fa-building-columns text-[18px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800">
                                {account ? "Cập nhật tài khoản" : "Thêm tài khoản mới"}
                            </h2>
                            <p className="text-[12px] text-slate-500 mt-0.5">
                                Thông tin để khách thuê thanh toán tiền phòng
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
                    <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 p-5">
                        
                        {clientError && (
                            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-[13px] flex items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation"></i> {clientError}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Ô tìm kiếm ngân hàng tích hợp VietQR */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Ngân hàng thụ hưởng <span className="text-red-500">*</span></label>
                                <div 
                                    className="relative flex items-center"
                                    onClick={() => setIsDropdownOpen(true)}
                                >
                                    {/* Hiển thị Logo ngân hàng đã chọn (nếu có) */}
                                    {form.bank_code && !isDropdownOpen && (
                                        <div className="absolute left-3 w-6 h-6 rounded bg-white overflow-hidden flex items-center justify-center">
                                            <img 
                                                src={banks.find(b => b.shortName === form.bank_code)?.logo} 
                                                alt="bank_logo" 
                                                className="w-full h-full object-contain" 
                                            />
                                        </div>
                                    )}
                                    <input 
                                        type="text" 
                                        value={isDropdownOpen ? searchBank : (form.bank_name || searchBank)} 
                                        onChange={(e) => {
                                            setSearchBank(e.target.value);
                                            setIsDropdownOpen(true);
                                        }}
                                        placeholder="Gõ tên viết tắt (VD: VCB, MB, ACB...)" 
                                        className={`w-full ${form.bank_code && !isDropdownOpen ? 'pl-11' : 'pl-3'} pr-8 py-2 bg-white border border-slate-300 rounded-lg text-[13px] outline-none focus:border-brand cursor-text`} 
                                    />
                                    <i className={`fa-solid fa-chevron-down absolute right-3 text-[11px] text-slate-400 pointer-events-none transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                                </div>

                                {/* Dropdown List */}
                                {isDropdownOpen && (
                                    <div className="absolute top-[100%] mt-1 left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[220px] overflow-y-auto animate-[fadeIn_0.1s_ease-out]">
                                        {filteredBanks.length === 0 ? (
                                            <div className="p-3 text-center text-[12px] text-slate-500">Không tìm thấy ngân hàng.</div>
                                        ) : (
                                            <ul className="py-1">
                                                {filteredBanks.map(bank => (
                                                    <li 
                                                        key={bank.id} 
                                                        onClick={() => handleSelectBank(bank)}
                                                        className="px-3 py-2 hover:bg-brand/10 cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 shrink-0 bg-white border border-slate-100 rounded p-0.5 flex items-center justify-center">
                                                            <img src={bank.logo} alt={bank.shortName} className="max-w-full max-h-full object-contain" />
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-[13px] font-bold text-slate-700">{bank.shortName}</span>
                                                            <span className="text-[11px] text-slate-500 truncate">{bank.name}</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Số tài khoản <span className="text-red-500">*</span></label>
                                <input type="text" value={form.account_number} onChange={handleChange("account_number")} placeholder="Nhập số tài khoản" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-mono tracking-wider outline-none focus:border-brand" />
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Tên chủ tài khoản <span className="text-red-500">*</span></label>
                                <input type="text" value={form.account_name} onChange={handleChange("account_name")} placeholder="VD: NGUYEN VAN A" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] uppercase outline-none focus:border-brand" />
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Chi nhánh (Tùy chọn)</label>
                                <input type="text" value={form.branch} onChange={handleChange("branch")} placeholder="VD: Chi nhánh Tân Bình" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] outline-none focus:border-brand" />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-brand/5 border border-brand/20 rounded-lg mt-2">
                                <input type="checkbox" checked={form.is_default} onChange={handleChange("is_default")} className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand" />
                                <span className="text-[13px] font-semibold text-brand">Đặt làm tài khoản mặc định nhận tiền</span>
                            </label>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-70">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                            {isSubmitting ? (
                                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang lưu...</>
                            ) : (
                                <><i className="fa-solid fa-check"></i> {account ? "Lưu thay đổi" : "Thêm tài khoản"}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}