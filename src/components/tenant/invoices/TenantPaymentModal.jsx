import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantInvoiceService from "@/services/tenantInvoiceService";

export default function TenantPaymentModal({ open, invoice: initialInvoice, onClose, onSuccess }) {
    const [invoiceDetail, setInvoiceDetail] = useState(null);
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // State quản lý trạng thái Polling Auto-confirm
    const [isPolling, setIsPolling] = useState(false);

    // State upload minh chứng
    const [proofFile, setProofFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Khóa cuộn background khi mở Modal
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // 1. Fetch dữ liệu hóa đơn và cấu hình thanh toán
    useEffect(() => {
        if (!open || !initialInvoice?.id) {
            setInvoiceDetail(null);
            setPaymentConfig(null);
            setIsPolling(false);
            setProofFile(null);
            return;
        }

        const fetchPaymentData = async () => {
            setIsLoading(true);
            try {
                const [detailRes, configRes] = await Promise.all([
                    tenantInvoiceService.getById(initialInvoice.id),
                    tenantInvoiceService.getPaymentConfig(initialInvoice.id)
                ]);
                setInvoiceDetail(detailRes.data.data);
                setPaymentConfig(configRes.data.data);
            } catch (error) {
                toast.error("Không thể tải thông tin thanh toán.");
                onClose();
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaymentData();
    }, [open, initialInvoice, onClose]);

    // 2. Logic Polling kiểm tra trạng thái thanh toán tự động qua SePay
    useEffect(() => {
        let intervalId;
        const isAutoConfirmEnabled = paymentConfig?.sepay_config?.auto_confirm === true;
        const bankAccount = paymentConfig?.bank_accounts?.[0];

        if (open && invoiceDetail && bankAccount && isAutoConfirmEnabled) {
            setIsPolling(true);

            intervalId = setInterval(async () => {
                try {
                    const res = await tenantInvoiceService.checkPaymentStatus(invoiceDetail.id);
                    const statusData = res.data.data;

                    const currentPaid = Number(statusData.paid_amount);
                    const oldPaid = Number(invoiceDetail.paid_amount);

                    // Nếu số tiền đã trả tăng lên hoặc trạng thái chuyển thành 'paid' -> Dừng polling
                    if (currentPaid > oldPaid || statusData.status === 'paid') {
                        clearInterval(intervalId);
                        setIsPolling(false);

                        toast.success("Thanh toán thành công! Hệ thống đã ghi nhận.");
                        onSuccess?.();
                        onClose();
                    }
                } catch (error) {
                    console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
                }
            }, 3000); // Check mỗi 3 giây
        } else {
            setIsPolling(false);
        }

        return () => { if (intervalId) clearInterval(intervalId); };
    }, [open, invoiceDetail, paymentConfig, onSuccess, onClose]);

    // 3. Hàm sinh URL mã QR VietQR dựa trên template của SePay
    const generateQrCodeUrl = () => {
        if (!invoiceDetail || !paymentConfig || !paymentConfig.bank_accounts?.length) return null;

        const bankAccount = paymentConfig.bank_accounts[0];
        if (!bankAccount.sepay_qr_template) return null;

        let qr = bankAccount.sepay_qr_template;
        qr = qr.replace("{amount}", invoiceDetail.remaining_amount);
        qr = qr.replace("{invoice_code}", invoiceDetail.invoice_code);

        return qr;
    };

    const handleSubmitProof = async (e) => {
        e.preventDefault();
        if (!proofFile) {
            return toast.warning("Vui lòng đính kèm hình ảnh giao dịch thành công!");
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append("amount", invoiceDetail.remaining_amount); // Gửi mặc định toàn bộ nợ
            formData.append("transaction_date", new Date().toISOString().slice(0, 10)); // Ngày hôm nay
            formData.append("proof_image", proofFile);

            await tenantInvoiceService.submitProof(invoiceDetail.id, formData);

            toast.success("Đã gửi minh chứng thành công! Vui lòng chờ chủ trọ duyệt.");
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi gửi minh chứng.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const qrCodeUrl = generateQrCodeUrl();
    const bankAccount = paymentConfig?.bank_accounts?.[0];

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-slate-50 w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[900px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <i className="fa-solid fa-qrcode text-[18px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800">Thanh toán hóa đơn</h2>
                            <p className="text-[13px] font-semibold text-slate-500 mt-0.5">
                                Mã HĐ: <span className="text-primary">{invoiceDetail?.invoice_code}</span>
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Body Content */}
                <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 p-4 sm:p-6 bg-slate-50 flex flex-col sm:flex-row gap-6">
                    {isLoading || !invoiceDetail || !paymentConfig ? (
                        <div className="w-full h-[300px] flex flex-col justify-center items-center text-primary">
                            <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-3"></i>
                            <p className="text-sm font-medium text-slate-500">Đang khởi tạo cổng thanh toán...</p>
                        </div>
                    ) : (
                        <>
                            {/* NỬA TRÁI: THÔNG TIN HÓA ĐƠN CHI TIẾT */}
                            <div className="w-full sm:w-1/2 flex flex-col gap-4 border-b sm:border-b-0 sm:border-r border-slate-200 pb-6 sm:pb-0 sm:pr-6">
                                <h3 className="font-bold text-[15px] text-slate-800 flex items-center gap-2">
                                    <i className="fa-solid fa-file-invoice text-gray-400"></i> Chi tiết khoản thu
                                </h3>

                                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
                                        <span className="text-[13px] text-slate-500 font-medium">Kỳ hóa đơn</span>
                                        <span className="text-[13px] font-bold text-slate-800">{invoiceDetail.period_from} đến {invoiceDetail.period_to}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[13px] text-slate-500 font-medium">Hạn thanh toán</span>
                                        <span className="text-[13px] font-bold text-red-500">{invoiceDetail.due_date}</span>
                                    </div>
                                </div>

                                <ul className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                                    {invoiceDetail.items?.map(item => (
                                        <li key={item.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                            <div>
                                                <p className="font-semibold text-[13px] text-slate-800">{item.description}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    SL: {item.quantity} {item.unit} x {Number(item.unit_price_snapshot).toLocaleString()}đ
                                                </p>
                                            </div>
                                            <span className="font-bold text-[13px] text-slate-800">
                                                {Number(item.amount).toLocaleString()} đ
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-auto">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[12px] font-semibold text-red-600/70">TỔNG HÓA ĐƠN</span>
                                        <span className="text-[14px] font-bold text-red-400 line-through">{Number(invoiceDetail.total_amount).toLocaleString()} đ</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[12px] font-semibold text-green-600/70">ĐÃ THANH TOÁN</span>
                                        <span className="text-[14px] font-bold text-green-600">- {Number(invoiceDetail.paid_amount).toLocaleString()} đ</span>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-red-200/50 pt-2">
                                        <span className="text-[13px] font-bold text-red-800">CẦN THANH TOÁN</span>
                                        <div className="text-right">
                                            <span className="text-[24px] font-black text-red-600 leading-none block">
                                                {Number(invoiceDetail.remaining_amount).toLocaleString()}
                                            </span>
                                            <span className="text-[11px] font-bold text-red-500">VNĐ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NỬA PHẢI: QUÉT MÃ QR & UPLOAD MINH CHỨNG */}
                            <div className="w-full sm:w-1/2 flex flex-col">
                                {bankAccount ? (
                                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center shadow-sm relative overflow-hidden">
                                        {/* Thanh màu trang trí phía trên */}
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-green-300"></div>

                                        <h3 className="font-bold text-[15px] text-slate-800 mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-expand text-primary"></i> Quét mã thanh toán
                                        </h3>

                                        {/* HÌNH MÃ QR */}
                                        {qrCodeUrl ? (
                                            <div className="relative group mb-4">
                                                <div className="p-3 border-2 border-dashed border-primary/40 rounded-2xl bg-white relative overflow-hidden transition-all group-hover:border-primary">
                                                    <img
                                                        key={qrCodeUrl}
                                                        src={qrCodeUrl}
                                                        alt="QR Code"
                                                        className="w-[200px] h-[200px] object-contain animate-[fadeIn_0.5s_ease-out]"
                                                    />
                                                    {/* Tia quét xanh lá mờ ảo khi auto confirm đang bật */}
                                                    {isPolling && (
                                                        <div className="absolute top-0 left-0 w-full h-[3px] bg-green-400 shadow-[0_0_12px_3px_#4ade80] opacity-70 animate-[scanQR_2s_ease-in-out_infinite]"></div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-[200px] h-[200px] border-2 border-dashed border-red-200 bg-red-50 rounded-2xl flex flex-col items-center justify-center text-red-400 mb-4 text-center p-4">
                                                <i className="fa-solid fa-link-slash text-3xl mb-2"></i>
                                                <p className="text-[11px] font-medium">Chủ trọ chưa cấu hình<br />định dạng mã QR.</p>
                                            </div>
                                        )}

                                        {/* THÔNG TIN CHUYỂN KHOẢN (CHO PHÉP COPY) */}
                                        <div className="w-full bg-[#F8FAFC] p-3 rounded-lg border border-slate-100 text-[12px] space-y-2 mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Ngân hàng:</span>
                                                <span className="font-bold text-slate-800">{bankAccount.bank_code}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Số tài khoản:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-blue-600 text-[14px]">{bankAccount.account_number}</span>
                                                    <button onClick={() => {
                                                        navigator.clipboard.writeText(bankAccount.account_number);
                                                        toast.info("Đã copy Số tài khoản!");
                                                    }} className="text-gray-400 hover:text-primary transition-colors"><i className="fa-regular fa-copy"></i></button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Chủ tài khoản:</span>
                                                <span className="font-bold text-slate-800">{bankAccount.account_name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Nội dung CK:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800">{invoiceDetail.invoice_code}</span>
                                                    <button onClick={() => {
                                                        navigator.clipboard.writeText(invoiceDetail.invoice_code);
                                                        toast.info("Đã copy Nội dung CK!");
                                                    }} className="text-gray-400 hover:text-primary transition-colors"><i className="fa-regular fa-copy"></i></button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* TRẠNG THÁI KIỂM TRA HOẶC GỬI MINH CHỨNG */}
                                        {isPolling ? (
                                            <div className="w-full bg-[#F0FDF4] border border-green-200 rounded-lg p-3 text-center animate-pulse">
                                                <i className="fa-solid fa-circle-notch fa-spin text-primary text-xl mb-1.5 block"></i>
                                                <p className="text-[12px] font-bold text-primary">Hệ thống đang chờ nhận tiền...</p>
                                                <p className="text-[10px] text-green-700 mt-0.5">Vui lòng không đóng cửa sổ này sau khi quét mã.</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmitProof} className="w-full flex flex-col items-center">
                                                <div className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 text-center w-full mb-3 flex items-start gap-1.5">
                                                    <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                                                    <span className="text-left">Chế độ tự động xác nhận hiện không khả dụng. Bạn vui lòng tải lên ảnh chụp màn hình chuyển khoản thành công.</span>
                                                </div>

                                                <div className="w-full relative">
                                                    <input
                                                        type="file"
                                                        accept="image/png, image/jpeg, image/jpg"
                                                        onChange={(e) => setProofFile(e.target.files[0])}
                                                        className="w-full text-[12px] text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border border-slate-200 rounded-lg p-1 transition-colors focus:border-primary focus:outline-none"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || !proofFile}
                                                    className="mt-3 w-full py-2.5 bg-primary text-white rounded-lg text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primaryHover transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                                >
                                                    {isSubmitting ? (
                                                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang gửi...</>
                                                    ) : (
                                                        <><i className="fa-solid fa-paper-plane"></i> Gửi minh chứng duyệt tay</>
                                                    )}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 border-2 border-dashed border-red-200 bg-red-50 rounded-xl flex flex-col items-center justify-center text-red-500 p-6 text-center">
                                        <i className="fa-solid fa-building-columns text-[40px] mb-3 opacity-50"></i>
                                        <h3 className="font-bold text-[15px] mb-1">Chưa có thông tin ngân hàng</h3>
                                        <p className="text-[12px]">Chủ trọ hiện chưa thiết lập số tài khoản để nhận tiền thanh toán online.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Khai báo animation vào file css global (tùy chọn) 
                Nếu bạn đã cài plugin tailwind-scrollbar và cấu hình custom animation thì không cần
            */}
            <style jsx global>{`
                @keyframes scanQR {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}