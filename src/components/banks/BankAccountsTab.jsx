import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import bankAccountService from "@/services/bankAccountService";
import BankAccountModal from "./BankAccountModal";

export default function BankAccountsTab() {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null); // null = Thêm mới, object = Sửa

    const fetchAccounts = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await bankAccountService.getAll();
            setAccounts(response.data.data || []);
        } catch (error) {
            toast.error("Lỗi khi tải danh sách ngân hàng.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleOpenCreate = () => {
        setSelectedAccount(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (account) => {
        setSelectedAccount(account);
        setIsModalOpen(true);
    };

    const handleDelete = async (id, bankCode) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${bankCode} này không? Hành động này không thể hoàn tác.`)) return;
        
        try {
            await bankAccountService.delete(id);
            toast.success("Đã xóa tài khoản thành công!");
            fetchAccounts(); // Render lại danh sách
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể xóa tài khoản này.");
        }
    };

    // Hàm format số tài khoản để hiển thị đẹp hơn (cách nhau mỗi 4 số)
    const formatAccountNumber = (number) => {
        return number?.toString().replace(/(.{4})/g, '$1 ').trim();
    };

    return (
        <div className="p-4 md:p-5 bg-white border border-t-0 border-slate-200 rounded-b-xl animate-[fadeIn_0.2s_ease-out] flex-1 flex flex-col">
            
            {/* Header của Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-[16px] font-bold text-slate-800">Danh sách tài khoản ngân hàng</h3>
                    <p className="text-[12px] text-slate-500 mt-1">Cấu hình thẻ ngân hàng nhận tiền thanh toán và tạo QR tự động.</p>
                </div>
                <button 
                    onClick={handleOpenCreate}
                    className="w-full sm:w-auto bg-brand text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-600/20"
                >
                    <i className="fa-solid fa-plus"></i> Thêm tài khoản
                </button>
            </div>

            {/* Nội dung: Loading, Trống, hoặc Grid Thẻ */}
            <div className="flex-1">
                {isLoading ? (
                    // Skeleton Loading
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-[200px] bg-slate-100 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : accounts.length === 0 ? (
                    // Trạng thái trống
                    <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                        <i className="fa-solid fa-building-columns text-4xl text-slate-300 mb-3"></i>
                        <p className="text-[14px] font-semibold text-slate-600">Chưa có tài khoản ngân hàng nào</p>
                        <p className="text-[12px] text-slate-500 mt-1 mb-4 max-w-[300px]">Hãy thêm tài khoản để hệ thống có thể tạo mã QR tự động trên hóa đơn cho khách thuê.</p>
                        <button onClick={handleOpenCreate} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                            Thêm ngay
                        </button>
                    </div>
                ) : (
                    // Grid Thẻ Ngân hàng
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {accounts.map((acc) => (
                            <div 
                                key={acc.id} 
                                className={`relative overflow-hidden rounded-2xl p-5 shadow-sm border transition-all duration-300 group hover:shadow-md ${
                                    acc.is_default 
                                    ? "bg-gradient-to-br from-brand to-green-700 border-transparent text-white" 
                                    : "bg-white border-slate-200 text-slate-800 hover:border-brand/40"
                                }`}
                            >
                                {/* Nền icon trang trí góc trên phải */}
                                <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 pointer-events-none ${acc.is_default ? 'bg-white' : 'bg-brand'}`}></div>
                                <i className={`fa-solid fa-building-columns absolute top-4 right-5 text-4xl opacity-10 pointer-events-none ${acc.is_default ? 'text-white' : 'text-slate-800'}`}></i>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[18px] uppercase tracking-wide">{acc.bank_code}</span>
                                        <span className={`text-[11px] ${acc.is_default ? 'text-green-100' : 'text-slate-500'}`}>{acc.bank_name}</span>
                                    </div>
                                    {acc.is_default && (
                                        <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider">
                                            MẶC ĐỊNH
                                        </span>
                                    )}
                                </div>

                                {/* Số tài khoản & Chủ thẻ */}
                                <div className="mb-4">
                                    <div className={`font-mono text-[20px] sm:text-[22px] tracking-[0.15em] mb-1 drop-shadow-sm ${acc.is_default ? 'text-white' : 'text-slate-700'}`}>
                                        {formatAccountNumber(acc.account_number)}
                                    </div>
                                    <div className={`text-[13px] uppercase font-semibold tracking-wider ${acc.is_default ? 'text-green-100' : 'text-slate-500'}`}>
                                        {acc.account_name}
                                    </div>
                                </div>

                                {/* Thanh công cụ Sửa/Xóa (Hiện khi hover trên PC, luôn hiện trên Mobile) */}
                                <div className="flex justify-end gap-2 mt-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                                    <button 
                                        onClick={() => handleOpenEdit(acc)}
                                        className={`w-8 h-8 rounded flex items-center justify-center transition-colors backdrop-blur-sm ${
                                            acc.is_default 
                                            ? "bg-white/20 hover:bg-white/30 text-white" 
                                            : "bg-slate-100 hover:bg-brand hover:text-white text-slate-600"
                                        }`}
                                        title="Chỉnh sửa"
                                    >
                                        <i className="fa-solid fa-pen text-[12px]"></i>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(acc.id, acc.bank_code)}
                                        className={`w-8 h-8 rounded flex items-center justify-center transition-colors backdrop-blur-sm ${
                                            acc.is_default 
                                            ? "bg-white/20 hover:bg-red-500/80 text-white" 
                                            : "bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600"
                                        }`}
                                        title="Xóa tài khoản"
                                    >
                                        <i className="fa-solid fa-trash-can text-[12px]"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BankAccountModal 
                open={isModalOpen}
                account={selectedAccount}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedAccount(null);
                }}
                onSuccess={fetchAccounts}
            />
        </div>
    );
}