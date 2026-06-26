import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import bankAccountService from "@/services/bankAccountService";
import BankAccountModal from "./BankAccountModal";

export default function BankAccountManager() {
    const [bankAccounts, setBankAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State quản lý Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    
    // State hiển thị QR Preview
    const [previewQr, setPreviewQr] = useState(null);

    const fetchBanks = async () => {
        try {
            setIsLoading(true);
            const res = await bankAccountService.getAll();
            setBankAccounts(res.data.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách tài khoản.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBanks();
    }, []);

    const handleEdit = (bank) => {
        setEditData(bank);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này? Sẽ không thể khôi phục.")) return;
        try {
            await bankAccountService.delete(id);
            toast.success("Xóa tài khoản thành công!");
            fetchBanks();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa tài khoản.");
        }
    };

    // Hàm sinh QR Preview test thử với 10,000đ
    const handlePreviewQr = (template) => {
        let url = template.replace("{amount}", "10000").replace("{invoice_code}", "TEST1234");
        setPreviewQr(url);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 max-w-[800px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-[16px] font-bold text-slate-800">Tài khoản ngân hàng</h3>
                    <p className="text-[12px] text-slate-500">Quản lý các tài khoản nhận tiền chuyển khoản từ khách thuê.</p>
                </div>
                <button 
                    onClick={() => { setEditData(null); setIsModalOpen(true); }}
                    className="px-4 py-2 bg-brand text-white text-[13px] font-bold rounded-lg hover:bg-brand-dark transition-colors shadow-sm flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus"></i> Thêm tài khoản
                </button>
            </div>

            {isLoading ? (
                <div className="py-10 text-center text-slate-400 text-[13px] animate-pulse">Đang tải dữ liệu...</div>
            ) : bankAccounts.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center">
                    <i className="fa-solid fa-building-columns text-[40px] text-slate-300 mb-3"></i>
                    <p className="text-[14px] font-bold text-slate-600 mb-1">Chưa có tài khoản nào</p>
                    <p className="text-[12px] text-slate-400">Hãy thêm tài khoản để khách thuê có thể quét mã QR thanh toán.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bankAccounts.map((bank) => (
                        <div key={bank.id} className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-md overflow-hidden group">
                            {/* Nền họa tiết trang trí */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                            
                            {/* Default Badge */}
                            {bank.is_default && (
                                <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                                    <i className="fa-solid fa-check"></i> Mặc định
                                </div>
                            )}

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-[13px] text-slate-300 mb-3 font-semibold">
                                    <i className="fa-solid fa-building-columns"></i> {bank.bank_name} ({bank.bank_code})
                                </div>
                                <div className="text-[20px] font-mono tracking-widest font-black mb-1">
                                    {bank.account_number}
                                </div>
                                <div className="text-[14px] font-bold text-slate-200 uppercase tracking-wide">
                                    {bank.account_name}
                                </div>
                            </div>

                            {/* Tool overlay xuất hiện khi hover */}
                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                                <button onClick={() => handlePreviewQr(bank.sepay_qr_template)} className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center hover:bg-brand hover:text-white transition-colors" title="Xem trước QR">
                                    <i className="fa-solid fa-qrcode text-[16px]"></i>
                                </button>
                                <button onClick={() => handleEdit(bank)} className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors" title="Sửa">
                                    <i className="fa-solid fa-pen text-[15px]"></i>
                                </button>
                                <button onClick={() => handleDelete(bank.id)} className="w-10 h-10 rounded-full bg-white text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors" title="Xóa">
                                    <i className="fa-solid fa-trash-can text-[15px]"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Render Modal Thêm/Sửa */}
            <BankAccountModal 
                open={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                editData={editData}
                onSuccess={fetchBanks}
            />

            {/* Modal Xem Trước QR nhỏ */}
            {previewQr && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setPreviewQr(null)}>
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-[300px] w-full text-center" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[15px] font-bold text-slate-800 mb-2">QR Code Mẫu</h4>
                        <p className="text-[12px] text-slate-500 mb-4">Mẫu QR tự động điền sẵn 10.000đ và nội dung TEST1234.</p>
                        <div className="border border-slate-200 rounded-lg p-2 mb-4">
                            <img src={previewQr} alt="QR Template" className="w-full h-auto object-contain" />
                        </div>
                        <button onClick={() => setPreviewQr(null)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold rounded-lg transition-colors">
                            Đóng lại
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}