import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import invoiceService from "@/services/invoiceService";
import bankAccountService from "@/services/bankAccountService";
import sepayConfigService from "@/services/sepayConfigService";

// Hàm lấy thời gian hiện tại theo định dạng YYYY-MM-DDThh:mm:ss (local time)
const getCurrentDateTimeLocal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 19); // Lấy đến giây: YYYY-MM-DDThh:mm:ss
};

// Hàm chuyển đổi ngày bất kỳ thành datetime-local (đặt mặc định 12:00 trưa)
const formatToDateTimeLocal = (dateString) => {
    if (!dateString) return getCurrentDateTimeLocal();
    const date = new Date(dateString);
    date.setHours(12, 0, 0, 0); // Đặt mặc định 12h trưa cho các giao dịch quá khứ
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 19);
};


export default function PaymentInvoiceModal({
    open,
    invoice,
    onClose,
    onSuccess,
    onOpenViewModal,
}) {
    const [amount, setAmount] = useState("");
    const [displayAmount, setDisplayAmount] = useState("");
    const [transactionDate, setTransactionDate] = useState(getCurrentDateTimeLocal());
    const [method, setMethod] = useState("bank_transfer"); // Mặc định là chuyển khoản để show QR
    const [bankAccountId, setBankAccountId] = useState("");
    const [note, setNote] = useState("");

    const [bankAccounts, setBankAccounts] = useState([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientError, setClientError] = useState("");
    const [fullScreenImage, setFullScreenImage] = useState(null);
    // state lưu cấu hình SePay
    const [sepayConfig, setSepayConfig] = useState(null);
    const [isPolling, setIsPolling] = useState(false);

    // Khóa cuộn background
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // === LOGIC TÌM GIAO DỊCH PENDING & HÀM DUYỆT ===
    const pendingAllocation = invoice?.allocations?.find(
        (a) => a.financial_transaction?.status === 'pending'
    );
    const pendingTx = pendingAllocation?.financial_transaction;


    // Xác định ngày làm mốc (Ưu tiên Hạn thanh toán, nếu không có thì lấy Ngày chốt kỳ)
    const targetDateStr = invoice?.due_date || invoice?.period_to;

    // Kiểm tra xem hóa đơn này có phải là hóa đơn cũ (trong quá khứ) hay không
    //useMemo để tránh tính toán lại mỗi lần render, chỉ khi targetDateStr thay đổi mới tính toán lại
    const isOldInvoice = React.useMemo(() => {
        if (!targetDateStr) return false;

        const targetDate = new Date(targetDateStr);
        const today = new Date();

        // Đưa cả 2 về đầu ngày (00:00:00) để so sánh thuần túy theo lịch (bỏ qua giờ phút)
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        return targetDate.getTime() < today.getTime();
    }, [targetDateStr]);

    // Hàm set ngày về hiện tại
    const setDateToNow = () => {
        setTransactionDate(getCurrentDateTimeLocal());
    };

    // Hàm set ngày lùi về hạn chót hóa đơn
    const setDateToInvoiceDue = () => {
        // Đã xóa bỏ invoice?.issue_date để đồng nhất với biến targetDateStr của nút bấm
        const targetDate = invoice?.due_date || invoice?.period_to;
        if (targetDate) {
            const date = new Date(targetDate);
            date.setHours(12, 0, 0, 0); // Đặt 12h trưa
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            setTransactionDate(date.toISOString().slice(0, 19));
        }
    };

    const handleApprovePending = async () => {
        try {
            setIsSubmitting(true);
            await invoiceService.approveTransaction(pendingTx.id);
            toast.success("Đã xác nhận nhận tiền thành công!");
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi duyệt giao dịch.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectPending = async () => {
        const reason = window.prompt("Nhập lý do từ chối (Ví dụ: Ảnh mờ, chưa nhận được tiền):");
        if (reason === null) return; // Bấm Cancel ở hộp thoại prompt

        try {
            setIsSubmitting(true);
            await invoiceService.cancelTransaction(pendingTx.id, { cancel_reason: reason || "Từ chối xác nhận" });
            toast.info("Đã từ chối minh chứng của khách.");
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi từ chối giao dịch.");
        } finally {
            setIsSubmitting(false);
        }
    };
    // === KẾT THÚC ===

    // ---  useEffect KHI MỞ MODAL ---
    useEffect(() => {
        if (open && invoice) {
            const defaultAmount = invoice.remaining_amount || 0;
            setAmount(defaultAmount);
            setDisplayAmount(Number(defaultAmount).toLocaleString("vi-VN")); // Format có dấu chấm

            setTransactionDate(getCurrentDateTimeLocal());
            setMethod("bank_transfer");
            setNote("");
            setClientError("");
            fetchBankAccounts();

            // Lấy cấu hình SePay để hiển thị QR Code nếu có
            sepayConfigService.getConfig()
                .then(res => setSepayConfig(res.data.data))
                .catch(() => console.log("Không thể lấy cấu hình SePay"));
        }
    }, [open, invoice]);

    // --- LOGIC POLLING SIÊU NHẸ ---
    useEffect(() => {
        let intervalId;
        const isAutoConfirmEnabled = sepayConfig?.auto_confirm == true;

        if (open && method === "bank_transfer" && bankAccountId && invoice && isAutoConfirmEnabled) {
            setIsPolling(true);

            intervalId = setInterval(async () => {
                try {
                    // Gọi API mini siêu nhẹ thay vì getById
                    const res = await sepayConfigService.checkPaymentStatus(invoice.id);
                    const statusData = res.data.data;

                    // Ép kiểu về Number trước khi so sánh lớn hơn
                    const currentPaid = Number(statusData.paid_amount);
                    const oldPaid = Number(invoice.paid_amount);

                    if (currentPaid > oldPaid || statusData.status === 'paid') {
                        clearInterval(intervalId);
                        setIsPolling(false);

                        toast.success("Đã nhận được thanh toán chuyển khoản.");
                        onSuccess?.();
                        onClose();
                    }
                } catch (error) {
                    console.error("Lỗi khi polling trạng thái:", error);
                }
            }, 3000);
        } else {
            setIsPolling(false);
        }

        return () => { if (intervalId) clearInterval(intervalId); };
    }, [open, method, bankAccountId, invoice, sepayConfig, onSuccess, onClose]);

    // ---  HÀM XỬ LÝ KHI GÕ NHẬP TIỀN ---
    const handleAmountChange = (e) => {
        // Xóa tất cả các ký tự không phải là số (để tránh lỗi khi gõ chữ)
        const rawValue = e.target.value.replace(/\D/g, "");
        if (!rawValue) {
            setAmount("");
            setDisplayAmount("");
            return;
        }
        const numericValue = Number(rawValue);
        setAmount(numericValue);
        setDisplayAmount(numericValue.toLocaleString("vi-VN")); // Cập nhật lại UI có dấu chấm
    };

    const fetchBankAccounts = async () => {
        try {
            setIsLoadingBanks(true);
            const res = await bankAccountService.getAll();
            const banks = res.data.data || [];
            setBankAccounts(banks);

            // Tự động chọn ngân hàng mặc định đầu tiên nếu có
            if (banks.length > 0) {
                const defaultBank = banks.find(b => b.is_default) || banks[0];
                setBankAccountId(defaultBank.id);
            } else {
                setBankAccountId("");
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách ngân hàng:", error);
        } finally {
            setIsLoadingBanks(false);
        }
    };

    // Logic sinh link ảnh QR Code
    const generateQrCodeUrl = () => {
        if (method !== "bank_transfer" || !bankAccountId || !amount) return null;

        const selectedBank = bankAccounts.find(b => b.id === Number(bankAccountId));
        if (!selectedBank || !selectedBank.sepay_qr_template) return null;

        // Thay thế số tiền và mã hóa đơn vào template URL
        let qrUrl = selectedBank.sepay_qr_template;
        qrUrl = qrUrl.replace("{amount}", amount);
        qrUrl = qrUrl.replace("{invoice_code}", invoice?.invoice_code || "");

        return qrUrl;
    };

    const qrCodeUrl = generateQrCodeUrl();

    // Submit lưu thu tiền
    const handleSubmit = async (e) => {
        e.preventDefault();
        setClientError("");

        const payAmount = Number(amount);
        if (payAmount <= 0) return setClientError("Số tiền thu phải lớn hơn 0.");
        if (payAmount > invoice.remaining_amount) return setClientError(`Không được thu vượt quá số nợ (${invoice.remaining_amount.toLocaleString()} đ).`);
        if (method === "bank_transfer" && !bankAccountId) return setClientError("Vui lòng chọn ngân hàng nhận tiền.");

        // --- CHẶN NGÀY THU HỢP LÝ ---
        const txDateObj = new Date(transactionDate);
        const limitDateStr = invoice.issue_date || invoice.period_from;

        if (limitDateStr) {
            const limitDateObj = new Date(limitDateStr);
            limitDateObj.setHours(0, 0, 0, 0); // Đưa về 0h00 để chỉ so sánh ngày

            if (txDateObj.getTime() < limitDateObj.getTime()) {
                return setClientError(`Ngày thu không được trước ngày lập hóa đơn (${limitDateObj.toLocaleDateString('vi-VN')}).`);
            }
        }

        try {
            setIsSubmitting(true);
            const payload = {
                amount: payAmount,
                transaction_date: transactionDate.replace('T', ' '),
                method: method,
                bank_account_id: method === "bank_transfer" ? bankAccountId : null,
                note: note
            };

            await invoiceService.receivePayment(invoice.id, payload);

            toast.success("Ghi nhận thu tiền thành công!");
            onSuccess?.();
            onClose();
        } catch (error) {
            setClientError(error.response?.data?.message || "Có lỗi xảy ra khi ghi nhận thu tiền.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open || !invoice) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-slate-50 w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[800px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] relative">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                            <i className="fa-solid fa-hand-holding-dollar text-[18px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800">Thu tiền hóa đơn </h2>
                            <p className="text-[13px] font-semibold text-slate-500 mt-0.5">
                                Mã HĐ: <span className="text-brand">{invoice.invoice_code}</span> - {invoice.room?.name}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Form & QR */}
                <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
                    <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 p-5 bg-slate-50 flex flex-col sm:flex-row gap-6">

                        {/* Form nhập liệu HOẶC Giao diện duyệt */}
                        <div className="w-full sm:w-1/2 flex flex-col gap-4">
                            {/* --- KHỐI KỲ THANH TOÁN & CHI TIẾT  --- */}
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[13px] font-medium text-slate-500">
                                    Kỳ thanh toán: <span className="font-bold text-slate-800">
                                        {invoice.period_from ? (() => {
                                            const d = new Date(invoice.period_from);
                                            return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
                                        })() : "—"}
                                    </span>
                                </span>

                                {onOpenViewModal && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenViewModal(invoice)}
                                        className="text-[13px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 group active:scale-95 transition-all"
                                    >
                                        Xem chi tiết <i className="fa-solid fa-arrow-right-long text-[11px] group-hover:translate-x-1 transition-transform"></i>
                                    </button>
                                )}
                            </div>
                            {/* --- KHỐI KỲ THANH TOÁN & CHI TIẾT --- */}

                            {pendingTx ? (
                                // --- NẾU CÓ PENDING -> HIỆN GIAO DIỆN DUYỆT ẢNH ---
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
                                    <h3 className="font-bold text-amber-800 text-[15px] mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-clock-rotate-left"></i> Khách báo đã chuyển khoản
                                    </h3>

                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-amber-100 text-[13px] text-slate-700 space-y-2 mb-4">
                                        <p>Số tiền báo cáo: <strong className="text-red-500 text-[15px]">{Number(pendingTx.amount).toLocaleString()} đ</strong></p>
                                        <p>Thời gian: <strong>{new Date(pendingTx.transaction_date).toLocaleString('vi-VN')}</strong></p>
                                        {pendingTx.note && <p>Ghi chú của khách: <span className="italic">"{pendingTx.note}"</span></p>}
                                    </div>

                                    <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-100 relative min-h-[250px]">
                                        {pendingTx.proof_image ? (
                                            <img
                                                src={pendingTx.proof_image}
                                                alt="Minh chứng"
                                                className="max-w-full max-h-[300px] object-contain cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => setFullScreenImage(pendingTx.proof_image)}
                                            />
                                        ) : (
                                            <span className="text-slate-400 text-[12px]"><i className="fa-solid fa-image text-3xl block mb-2 text-center"></i> Không đính kèm ảnh</span>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-amber-200/50 shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleRejectPending}
                                            disabled={isSubmitting}
                                            className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg text-[13px] font-bold hover:bg-red-50 disabled:opacity-50"
                                        >
                                            Từ chối
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleApprovePending}
                                            disabled={isSubmitting}
                                            className="flex-[2] py-2.5 bg-brand text-white rounded-lg text-[13px] font-bold shadow-sm shadow-green-600/30 hover:bg-green-700 flex justify-center items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fa-solid fa-check-double"></i>}
                                            Đã nhận được tiền
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // --- NẾU KHÔNG CÓ PENDING -> HIỆN FORM NHẬP TIỀN THỦ CÔNG NHƯ CŨ ---
                                <>
                                    {/* Bảng tóm tắt số tiền */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="text-[12px] text-slate-500 font-semibold mb-1">CẦN THANH TOÁN</p>
                                            <p className="text-[22px] font-black text-red-500 leading-none">
                                                {Number(invoice.remaining_amount).toLocaleString()} đ
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] text-slate-400 mb-1">Tổng HĐ: {Number(invoice.total_amount).toLocaleString()} đ</p>
                                            <p className="text-[11px] text-slate-400">Đã trả: {Number(invoice.paid_amount).toLocaleString()} đ</p>
                                        </div>
                                    </div>

                                    {clientError && (
                                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-[13px] flex items-center gap-2">
                                            <i className="fa-solid fa-circle-exclamation"></i> {clientError}
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex justify-between items-end mb-1.5">
                                            <label className="block text-[12px] font-semibold text-slate-700">
                                                Số tiền khách trả <span className="text-red-500">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAmount(invoice.remaining_amount);
                                                    setDisplayAmount(Number(invoice.remaining_amount).toLocaleString("vi-VN"));
                                                }}
                                                className="text-[11px] font-semibold text-brand hover:underline"
                                            >
                                                Điền toàn bộ nợ
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={displayAmount}
                                                onChange={handleAmountChange}
                                                onFocus={(e) => e.target.select()}
                                                className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-300 rounded-lg text-[16px] font-bold text-slate-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-[13px]">VNĐ</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Ngày thu <span className="text-red-500">*</span></label>
                                        <input
                                            type="datetime-local"
                                            step="1"
                                            value={transactionDate}
                                            onChange={(e) => setTransactionDate(e.target.value)}
                                            // readOnly
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] outline-none focus:border-brand"
                                        />
                                        {/* NÚT CHỌN NHANH DÀNH CHO NHẬP LIỆU CŨ */}
                                        {isOldInvoice && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={setDateToNow}
                                                    className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 transition-colors"
                                                >
                                                    <i className="fa-solid fa-clock text-slate-400 mr-1"></i> Bây giờ
                                                </button>

                                                {/* Chỉ render nút Lùi ngày khi hàm isOldInvoice trả về TRUE */}
                                                <button
                                                    type="button"
                                                    onClick={setDateToInvoiceDue}
                                                    className="text-[11px] px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 transition-colors"
                                                    title="Dùng cho việc nhập liệu sổ sách các tháng cũ"
                                                >
                                                    <i className="fa-solid fa-clock-rotate-left mr-1"></i> Lùi về hạn HĐ
                                                    ({new Date(targetDateStr).toLocaleDateString("vi-VN")})
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate-700 mb-2">Phương thức <span className="text-red-500">*</span></label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${method === 'bank_transfer' ? 'border-brand bg-brand/5' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                                <input type="radio" name="pay_method" value="bank_transfer" checked={method === 'bank_transfer'} onChange={() => setMethod('bank_transfer')} className="hidden" />
                                                <i className={`fa-solid fa-building-columns text-[20px] ${method === 'bank_transfer' ? 'text-brand' : 'text-slate-400'}`}></i>
                                                <span className={`text-[12px] font-semibold ${method === 'bank_transfer' ? 'text-brand' : 'text-slate-600'}`}>Chuyển khoản</span>
                                            </label>
                                            <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${method === 'cash' ? 'border-brand bg-brand/5' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                                <input type="radio" name="pay_method" value="cash" checked={method === 'cash'} onChange={() => setMethod('cash')} className="hidden" />
                                                <i className={`fa-solid fa-money-bill-wave text-[20px] ${method === 'cash' ? 'text-brand' : 'text-slate-400'}`}></i>
                                                <span className={`text-[12px] font-semibold ${method === 'cash' ? 'text-brand' : 'text-slate-600'}`}>Tiền mặt</span>
                                            </label>
                                        </div>
                                    </div>

                                    {method === "bank_transfer" && (
                                        <div className="animate-[fadeIn_0.3s_ease-out]">
                                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Ngân hàng nhận <span className="text-red-500">*</span></label>
                                            <select
                                                value={bankAccountId}
                                                onChange={(e) => setBankAccountId(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] outline-none focus:border-brand"
                                            >
                                                <option value="">{isLoadingBanks ? "Đang tải..." : "Chọn ngân hàng"}</option>
                                                {bankAccounts.map(b => (
                                                    <option key={b.id} value={b.id}>{b.bank_code} - {b.account_number} ({b.account_name})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Ghi chú (Tùy chọn)</label>
                                        <input
                                            type="text"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="Ví dụ: Khách thanh toán tháng 6"
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[13px] outline-none focus:border-brand"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Cột phải: Vùng hiển thị QR Code */}
                        <div className="w-full sm:w-1/2 flex flex-col">
                            {method === "bank_transfer" ? (
                                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-green-300"></div>
                                    {qrCodeUrl ? (
                                        <>
                                            <h3 className="text-[14px] font-bold text-slate-800 mb-4 text-center uppercase">Quét mã để thanh toán</h3>
                                            <div className="p-2 border-2 border-dashed border-brand/40 rounded-xl bg-white mb-4 relative overflow-hidden group">
                                                <img
                                                    key={qrCodeUrl} // Magic React: Thay đổi key sẽ ép component render lại để chạy hiệu ứng
                                                    src={qrCodeUrl}
                                                    alt="QR Code Thanh Toán"
                                                    // Thêm hiệu ứng nháy mờ (fade-in) mỗi khi số tiền đổi -> URL đổi -> Key đổi
                                                    className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] object-contain animate-[fadeIn_0.4s_ease-out]"
                                                />
                                                {/* Hiệu ứng tia quét xanh lá chạy ngang khi update */}
                                                <div key={`scan-${amount}`} className="absolute top-0 left-0 w-full h-1 bg-green-400 shadow-[0_0_8px_2px_#4ade80] opacity-0 animate-[slideDown_1s_ease-in-out_1]"></div>
                                            </div>
                                            {/* Thông báo trạng thái */}
                                            {isPolling ? (
                                                <div className="flex flex-col items-center gap-1 mb-2 text-brand text-[12px] font-semibold animate-pulse">
                                                    <div className="flex items-center gap-2">
                                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                        <span>Hệ thống đang chờ quét mã...</span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 font-normal">Sẽ tự động đóng khi nhận được tiền.</span>
                                                </div>
                                            ) : (
                                                method === "bank_transfer" && sepayConfig && !sepayConfig.auto_confirm && (
                                                    <div className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 text-center mx-4 mb-3">
                                                        <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                                                        Chế độ tự động duyệt đang <b>TẮT</b>.<br />Sau khi khách chuyển khoản, bạn cần tự xác nhận.
                                                    </div>
                                                )
                                            )}

                                            {/* Thêm 2 nút Copy (Dành cho trường hợp khách không quét được QR) */}
                                            <div className="flex gap-2 w-full px-2 sm:px-6 mb-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const selectedBank = bankAccounts.find(b => b.id === Number(bankAccountId));
                                                        navigator.clipboard.writeText(selectedBank?.account_number);
                                                        toast.info("Đã copy Số tài khoản!");
                                                    }}
                                                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[12px] font-semibold rounded transition-colors"
                                                >
                                                    <i className="fa-regular fa-copy"></i> Số TK
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Thay thế logic bóc tách Tiền tố Hóa đơn giống như Backend
                                                        const selectedBank = bankAccounts.find(b => b.id === Number(bankAccountId));
                                                        // Rút trích tiền tố từ URL QR cho chính xác
                                                        const match = selectedBank?.sepay_qr_template?.match(/des=([^\{]+)/);
                                                        const prefix = match ? match[1] : "HD";
                                                        //navigator.clipboard.writeText(`${prefix}${invoice?.invoice_code}`); 
                                                        navigator.clipboard.writeText(`${invoice?.invoice_code}`);// tạm bỏ tiền tố prefix
                                                        toast.info("Đã copy Nội dung CK!");
                                                    }}
                                                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[12px] font-semibold rounded transition-colors"
                                                >
                                                    <i className="fa-regular fa-copy"></i> Nội dung
                                                </button>
                                            </div>

                                            <p className="text-[12px] text-slate-500 text-center px-4 leading-relaxed">
                                                Khách quét mã bằng App ngân hàng.<br />Nội dung và số tiền tự động cập nhật.
                                            </p>
                                        </>
                                    ) : (
                                        <div className="text-center text-slate-400 flex flex-col items-center">
                                            <i className="fa-solid fa-qrcode text-[40px] mb-3 opacity-20"></i>
                                            <p className="text-[13px]">Vui lòng nhập số tiền và chọn ngân hàng để tạo mã QR.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 text-center">
                                    <i className="fa-solid fa-money-bills text-[40px] mb-3 opacity-20"></i>
                                    <p className="text-[13px] font-semibold text-slate-500">Thanh toán Tiền mặt</p>
                                    <p className="text-[12px] mt-1 max-w-[200px]">Bạn đang chọn ghi nhận thu tiền trực tiếp. Bấm Lưu để chốt công nợ.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 flex items-center justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-70">
                            Đóng cửa sổ
                        </button>

                        {/* Ẩn nút submit form đi nếu đang ở giao diện Duyệt ảnh */}
                        {!pendingTx && (
                            <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-brand text-white rounded-lg text-[13px] font-semibold hover:bg-green-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                                {isSubmitting ? (
                                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang lưu...</>
                                ) : (
                                    <><i className="fa-solid fa-check"></i> Xác nhận thu</>
                                )}
                            </button>
                        )}
                    </div>
                </form>

            </div>
            {/* BỔ SUNG OVERLAY ZOOM ẢNH TOÀN MÀN HÌNH */}
            {fullScreenImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-10 cursor-zoom-out animate-[fadeIn_0.2s_ease-out]"
                    onClick={() => setFullScreenImage(null)}
                >
                    <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-3xl sm:text-4xl hover:text-gray-300 transition-colors w-12 h-12 flex items-center justify-center">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    <img
                        src={fullScreenImage}
                        alt="Phóng to"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-[zoomIn_0.2s_ease-out]"
                    />
                </div>
            )}
        </div>
    );
}