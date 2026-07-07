import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import sepayTransactionService from "@/services/sepayTransactionService";
import MatchTransactionModal from "./MatchTransactionModal";

export default function SepayTransactionsTab() {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);

    // Bộ lọc
    const [statusFilter, setStatusFilter] = useState("");

    // Modal State
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

    const fetchTransactions = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = { page, per_page: 15 };
            if (statusFilter) params.match_status = statusFilter;

            const res = await sepayTransactionService.getAll(params);
            setTransactions(res.data.data || []);
            setPagination(res.data.meta || null);
        } catch (error) {
            toast.error("Lỗi khi tải lịch sử giao dịch.");
        } finally {
            setIsLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Format ngày giờ
    const formatDateTime = (dateStr) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Style cho từng loại Trạng thái
    const getStatusStyle = (status) => {
        switch (status) {
            case 'matched': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[11px] font-bold"><i className="fa-solid fa-check mr-1"></i>Đã đối soát</span>;
            case 'partially_matched': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[11px] font-bold"><i className="fa-solid fa-star-half-stroke mr-1"></i>Khớp 1 phần</span>;
            case 'need_review': return <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-[11px] font-bold"><i className="fa-solid fa-triangle-exclamation mr-1"></i>Cần kiểm tra</span>;
            case 'ignored': return <span className="px-2 py-1 bg-slate-200 text-slate-500 rounded text-[11px] font-bold"><i className="fa-solid fa-ban mr-1"></i>Đã bỏ qua</span>;
            case 'duplicated': return <span className="px-2 py-1 bg-slate-100 text-slate-500 border border-slate-300 rounded text-[11px] font-bold"><i className="fa-solid fa-copy mr-1"></i>Trùng lặp</span>;
            default: return <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-[11px] font-bold"><i className="fa-solid fa-clock-rotate-left mr-1"></i>Chưa đối soát</span>;
        }
    };

    // Hàm Thử lại (Retry)
    const handleRetry = async (id) => {
        try {
            await sepayTransactionService.retry(id);
            toast.success("Đã thử xử lý lại giao dịch!");
            fetchTransactions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi thử lại.");
        }
    };

    // Hàm Bỏ qua (Ignore)
    const handleIgnore = async (id) => {
        const reason = window.prompt("Nhập lý do bỏ qua (Tùy chọn, VD: Giao dịch cá nhân):");
        if (reason === null) return; // Bấm Cancel

        try {
            await sepayTransactionService.ignore(id, { reason });
            toast.success("Đã bỏ qua giao dịch.");
            fetchTransactions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi bỏ qua.");
        }
    };

    // Mở Modal Ghép nối
    const handleOpenMatch = (txn) => {
        setSelectedTransaction(txn);
        setIsMatchModalOpen(true);
    };

    return (
        <div className="p-4 md:p-5 bg-white border border-t-0 border-slate-200 rounded-b-xl animate-[fadeIn_0.2s_ease-out] flex-1 flex flex-col h-full">

            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 shrink-0">
                <div>
                    <h3 className="text-[16px] font-bold text-slate-800">Lịch sử nhận tiền (SePay)</h3>
                    <p className="text-[12px] text-slate-500 mt-1">Danh sách các biến động số dư được đẩy về từ ngân hàng.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] outline-none focus:border-brand shadow-sm w-full sm:w-[180px]"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="unmatched">Chưa đối soát</option>
                        <option value="need_review">Cần kiểm tra (Lỗi)</option>
                        <option value="matched">Đã đối soát</option>
                        <option value="partially_matched">Đối soát 1 phần</option>
                        <option value="ignored">Đã bỏ qua</option>
                    </select>
                    <button onClick={fetchTransactions} className="px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg shadow-sm border border-slate-200 transition-colors" title="Tải lại">
                        <i className="fa-solid fa-rotate-right"></i>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="overflow-x-auto flex-1 pb-2">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1400px]">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="py-3 px-4 text-[12px] font-bold text-slate-600 w-[100px]">ID</th>
                                <th className="py-3 px-4 text-[12px] font-bold text-slate-600 w-[150px]">Thời gian & NH</th>
                                <th className="py-3 px-4 text-[12px] font-bold text-slate-600 w-[180px]">Mã GD & Người gửi</th>
                                <th className="py-3 px-4 text-[12px] font-bold text-slate-600 text-right w-[140px]">Số tiền (đ)</th>
                                <th className="py-3 px-4 text-[12px] font-bold text-slate-600 max-w-[300px]">Nội dung chuyển </th>
                                <th className="py-3 px-4 text-[12px] font-bold text-slate-600 w-[200px]">Mã thanh toán đã tách</th>
                                <th className="py-3 px-4 text-[12px] font-bold text-slate-600 max-w-[300px]">Mô tả </th>
                                <th className="py-3 px-4 text-[12px] font-bold text-slate-600 w-[200px]">Trạng thái </th>
                                <th className="py-3 px-4 text-[12px] font-bold text-slate-600 w-[300px]">Ghi chú lỗi</th>
                                <th className="py-3 px-4 text-[12px] font-bold text-slate-600 text-center w-[160px]">Xử lý</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px]">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-100 animate-pulse">
                                        <td colSpan={10} className="py-3 px-4"><div className="h-12 bg-slate-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-12 px-4 text-center text-slate-400 bg-slate-50/50">
                                        <i className="fa-solid fa-money-bill-transfer text-3xl mb-2 opacity-30"></i>
                                        <p className="text-[13px]">Không có giao dịch nào phù hợp.</p>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors group items-start">

                                        {/* cột 0: ID giao dịch */}
                                        < td className="py-3 px-4 align-top" >
                                            <div className="font-mono text-[12px] text-slate-700">{txn.provider_transaction_id}</div>
                                        </td>

                                        {/* Cột 1: Thời gian & NH */}
                                        < td className="py-3 px-4 align-top" >
                                            <div className="font-semibold text-slate-700">{formatDateTime(txn.transaction_time)}</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">
                                                Tới NH: <span className="font-bold text-brand">{txn.bank_account?.bank_code || 'Không rõ'}</span>
                                            </div>
                                        </td>

                                        {/* Cột 2: Mã GD & Người gửi (Mới thêm) */}
                                        < td td className="py-3 px-4 align-top" >
                                            <div className="font-mono text-slate-700 text-[12px]" title="Mã giao dịch / Mã tham chiếu">
                                                {txn.reference_code || '---'}
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1" title="Số tài khoản người gửi">
                                                <i className="fa-regular fa-credit-card text-[10px]"></i>
                                                <span className="font-semibold">{txn.account_number || 'Khách vãng lai'}</span>
                                            </div>
                                        </td>

                                        {/* Cột 3: Số tiền */}
                                        <td className="py-3 px-4 text-right align-top">
                                            <div className={`font-black text-[14px] ${txn.transfer_type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                                                {txn.transfer_type === 'in' ? '+' : '-'}{Number(txn.transfer_amount).toLocaleString()}
                                            </div>
                                            {/* Nếu đối soát 1 phần, hiển thị số dư */}
                                            {txn.match_status === 'partially_matched' && (
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    Còn dư: {(Number(txn.transfer_amount) - Number(txn.matched_amount)).toLocaleString()}
                                                </div>
                                            )}
                                        </td>

                                        {/* Cột 4: Nội dung */}
                                        <td className="py-3 px-4 align-top w-[250px]">
                                            <textarea
                                                readOnly
                                                // Thêm min-h để không bị kéo nhỏ xíu
                                                className="w-[220px] min-h-[44px] text-[12px] p-2 bg-white border border-slate-200 rounded text-slate-800 font-mono resize-y focus:outline-brand shadow-sm"
                                                rows={2}
                                                value={txn.content || 'Không có nội dung'}
                                                title="Kéo góc dưới bên phải để xem thêm"
                                            />
                                        </td>
                                        {/* Cột 5: Mã thanh toán đã tách */}
                                        <td className="py-3 px-4 align-top w-[200px]">
                                            <div className="text-[12px] text-slate-600">
                                                {txn.matched_payment_code || 'Chưa tách'}
                                            </div>
                                        </td>

                                        {/* Cột 6: Mô tả */}
                                        <td className="py-3 px-4 align-top w-[250px]">
                                            <textarea
                                                readOnly
                                                className="w-[220px] min-h-[44px] text-[11px] p-2 bg-slate-50 border border-slate-200 rounded text-slate-500 italic resize-y focus:outline-brand shadow-sm"
                                                rows={2}
                                                value={txn.description || 'Không có mô tả'}
                                                title="Kéo góc dưới bên phải để xem thêm"
                                            />
                                        </td>

                                        {/* Cột 7: Trạng thái & Hóa đơn */}
                                        <td className="py-3 px-4 align-top w-[150px]">
                                            <div className="flex flex-col gap-2">
                                                <div>{getStatusStyle(txn.match_status)}</div>
                                                {txn.matched_payment_code && (
                                                    <div className="text-[11px] text-brand font-semibold px-2 py-1 bg-brand/10 rounded w-fit">
                                                        <i className="fa-solid fa-link mr-1"></i> {txn.matched_payment_code}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Cột 8: Ghi chú lỗi */}
                                        <td className="py-3 px-4 align-top w-[250px] ">
                                            {txn.error_message ? (
                                                <div
                                                    className="w-[220px] text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-200"
                                                    title={txn.error_message} // Vẫn giữ title để di chuột vào là xem được toàn bộ lỗi
                                                >
                                                    {/* Sử dụng line-clamp-2 để bẻ dòng tự nhiên và giới hạn tối đa 2 dòng */}
                                                    <div className="line-clamp-2 whitespace-normal break-words ">
                                                        <i className="fa-solid fa-circle-exclamation mr-1"></i>{txn.error_message}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-[11px] italic whitespace-nowrap">Không có lỗi</span>
                                            )}
                                        </td>

                                        {/* Cột 9: Nút Xử lý */}
                                        <td className="py-3 px-4 align-top text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {['unmatched', 'need_review', 'partially_matched'].includes(txn.match_status) ? (
                                                    <>
                                                        {/* Tạm thời bỏ chức năng ghép tay */}
                                                        {/* <button
                                                            onClick={() => handleOpenMatch(txn)}
                                                            className="px-2.5 py-1.5 bg-brand text-white hover:bg-green-700 rounded text-[11px] font-semibold shadow-sm transition-colors"
                                                            title="Ghép tay vào hóa đơn"
                                                        >
                                                            <i className="fa-solid fa-link mr-1"></i>Ghép
                                                        </button> */}
                                                        <button
                                                            onClick={() => handleRetry(txn.id)}
                                                            className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 rounded text-[11px] font-semibold transition-colors"
                                                            title="Hệ thống quét lại nội dung CK"
                                                        >
                                                            Thử lại
                                                        </button>
                                                        {/* Nút thùng rác hiện rõ hơn 1 chút */}
                                                        <button
                                                            onClick={() => handleIgnore(txn.id)}
                                                            className="w-7 h-7 flex items-center justify-center bg-white text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-500 border border-slate-200 rounded transition-colors"
                                                            title="Bỏ qua giao dịch này"
                                                        >
                                                            <i className="fa-solid fa-trash-can text-[11px]"></i>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic mt-1 inline-block">Đã khóa thao tác</span>
                                                )}
                                            </div>
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                    <span className="text-[12px] text-slate-500">
                        Tổng cộng: {pagination?.total || 0} giao dịch
                    </span>
                    <div className="flex gap-1">
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 border border-slate-200 hover:bg-white bg-transparent disabled:opacity-50">
                            <i className="fa-solid fa-angle-left text-[11px]"></i>
                        </button>
                        <button className="w-7 h-7 rounded flex items-center justify-center bg-brand text-white font-semibold text-[12px]">
                            {page}
                        </button>
                        <button disabled={!pagination?.next_page_url} onClick={() => setPage(page + 1)} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 border border-slate-200 hover:bg-white bg-transparent disabled:opacity-50">
                            <i className="fa-solid fa-angle-right text-[11px]"></i>
                        </button>
                    </div>
                </div>
            </div >

            {/* Modal */}
            < MatchTransactionModal
                open={isMatchModalOpen}
                transaction={selectedTransaction}
                onClose={() => {
                    setIsMatchModalOpen(false);
                    setSelectedTransaction(null);
                }
                }
                onSuccess={fetchTransactions}
            />
        </div >
    );
}