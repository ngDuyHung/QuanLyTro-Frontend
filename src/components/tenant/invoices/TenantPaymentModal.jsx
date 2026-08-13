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

    // State quản lý kết quả hiển thị màn hình thành công & đếm ngược
    const [paymentResult, setPaymentResult] = useState(null); // { status: 'full' | 'partial', amount: number, progress: number }
    const [countdown, setCountdown] = useState(0);

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
            setPaymentResult(null);
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

        if (open && invoiceDetail && bankAccount && isAutoConfirmEnabled && !paymentResult) {
            setIsPolling(true);

            intervalId = setInterval(async () => {
                try {
                    const res = await tenantInvoiceService.checkPaymentStatus(invoiceDetail.id);
                    const statusData = res.data.data;

                    const currentPaid = Number(statusData.paid_amount);
                    const oldPaid = Number(invoiceDetail.paid_amount);

                    // NẾU CÓ TIỀN VÀO MỚI HOẶC ĐÃ PAID
                    if (currentPaid > oldPaid || statusData.status === 'paid') {
                        clearInterval(intervalId);
                        setIsPolling(false);

                        const paidJustNow = currentPaid - oldPaid;
                        const isFullyPaid = statusData.status === 'paid' || currentPaid >= Number(invoiceDetail.total_amount);
                        const progressPercent = Math.round((currentPaid / Number(invoiceDetail.total_amount)) * 100);

                        // 1. Lưu state để LẬT THẺ sang mặt Success
                        setPaymentResult({
                            status: isFullyPaid ? 'full' : 'partial',
                            amount: paidJustNow > 0 ? paidJustNow : Number(invoiceDetail.remaining_amount),
                            progress: progressPercent
                        });

                        // 2. Cập nhật Hóa đơn bên trái
                        setInvoiceDetail(prev => ({
                            ...prev,
                            paid_amount: statusData.paid_amount,
                            remaining_amount: statusData.remaining_amount || (Number(prev.total_amount) - currentPaid)
                        }));

                        toast.success("Hệ thống đã nhận được tiền!");
                        onSuccess?.();

                        // 3. Xử lý Trả 1 phần -> Đếm ngược 4s lật lại QR
                        if (!isFullyPaid) {
                            setCountdown(4);
                            const timer = setInterval(() => {
                                setCountdown(prev => {
                                    if (prev <= 1) {
                                        clearInterval(timer);
                                        setPaymentResult(null);
                                        return 0;
                                    }
                                    return prev - 1;
                                });
                            }, 1000);
                        }
                    }
                } catch (error) {
                    console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
                }
            }, 3000);
        } else {
            setIsPolling(false);
        }

        return () => { if (intervalId) clearInterval(intervalId); };
    }, [open, invoiceDetail, paymentConfig, onSuccess, paymentResult]);

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
            formData.append("amount", invoiceDetail.remaining_amount);
            formData.append("transaction_date", new Date().toISOString().slice(0, 10));
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
                                Mã HĐ: <span className="text-primary">{invoiceDetail?.invoice_code || "..."}</span>
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
                        /* SKELETON LOADING UI */
                        <div className="w-full flex flex-col sm:flex-row gap-6 animate-pulse p-2">
                            <div className="w-full sm:w-1/2 flex flex-col gap-4 border-b sm:border-b-0 sm:border-r border-slate-200 pb-6 sm:pb-0 sm:pr-6">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                                    <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
                                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                                        <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                    </div>
                                    <div className="p-4 space-y-4 flex-1">
                                        <div className="h-10 bg-slate-100 rounded w-full"></div>
                                        <div className="h-10 bg-slate-100 rounded w-full"></div>
                                        <div className="h-10 bg-slate-100 rounded w-5/6"></div>
                                    </div>
                                    <div className="px-4 py-5 bg-white border-t-2 border-dashed border-slate-100 mt-auto">
                                        <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
                                        <div className="h-8 bg-slate-200 rounded w-1/3 ml-auto"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full sm:w-1/2 flex flex-col">
                                <div className="flex-1 bg-white border border-slate-100 rounded-xl p-5 flex flex-col items-center shadow-sm">
                                    <div className="h-5 bg-slate-200 rounded w-2/5 mb-6"></div>
                                    <div className="w-[200px] h-[200px] bg-slate-100 rounded-2xl mb-6"></div>
                                    <div className="w-full space-y-3 mb-6 bg-slate-50 p-4 rounded-lg">
                                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                        <div className="h-4 bg-slate-200 rounded w-4/5"></div>
                                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                                    </div>
                                    <div className="w-full h-[44px] bg-slate-200 rounded-lg mt-auto"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* NỬA TRÁI: THÔNG TIN HÓA ĐƠN CHI TIẾT */}
                            <div className="w-full sm:w-1/2 flex flex-col gap-4 border-b sm:border-b-0 sm:border-r border-slate-200 pb-6 sm:pb-0 sm:pr-6 relative">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-[16px] text-slate-800 flex items-center gap-2">
                                        <i className="fa-solid fa-file-invoice text-primary"></i> Chi tiết khoản thu
                                    </h3>
                                    {Number(invoiceDetail.remaining_amount) <= 0 ? (
                                        <span className="px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-[11px] font-bold uppercase tracking-wide">Đã thanh toán</span>
                                    ) : Number(invoiceDetail.paid_amount) > 0 ? (
                                        <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-wide">Thanh toán 1 phần</span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide">Chưa thanh toán</span>
                                    )}
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[13px] text-slate-500 font-medium">Kỳ hóa đơn</span>
                                            <span className="text-[13px] font-bold text-slate-800">{invoiceDetail.period_from} - {invoiceDetail.period_to}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] text-slate-500 font-medium">Hạn thanh toán</span>
                                            <span className="text-[13px] font-bold text-red-500">{invoiceDetail.due_date}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 flex-1 overflow-y-auto max-h-[200px] sm:max-h-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        <ul className="divide-y divide-slate-100/80">
                                            {invoiceDetail.items?.map(item => (
                                                <li key={item.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-start">
                                                    <div className="pr-3">
                                                        <p className="font-bold text-[13px] text-slate-800">{item.description}</p>
                                                        <p className="text-[12px] text-slate-500 mt-0.5">
                                                            {item.quantity} {item.unit} x {Number(item.unit_price_snapshot).toLocaleString()}đ
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-[14px] text-slate-800 whitespace-nowrap">
                                                        {Number(item.amount).toLocaleString()} đ
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="px-4 py-4 bg-white border-t-2 border-dashed border-slate-200 mt-auto">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[12px] font-medium text-slate-500">TỔNG CỘNG</span>
                                            <span className="text-[14px] font-semibold text-slate-500">{Number(invoiceDetail.total_amount).toLocaleString()} đ</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[12px] font-medium text-slate-500">ĐÃ THANH TOÁN</span>
                                            <span className="text-[14px] font-semibold text-green-600">- {Number(invoiceDetail.paid_amount).toLocaleString()} đ</span>
                                        </div>

                                        <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                                            <span className="text-[12px] font-bold text-slate-600 mb-1">CẦN THANH TOÁN</span>
                                            <div className="text-right flex items-baseline gap-1">
                                                <span className="text-[28px] font-black text-primary leading-none tracking-tight">
                                                    {Number(invoiceDetail.remaining_amount).toLocaleString()}
                                                </span>
                                                <span className="text-[14px] font-bold text-primary/80 underline decoration-2 underline-offset-2">đ</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NỬA PHẢI: CONTAINER 3D LẬT THẺ */}
                            <div className="w-full sm:w-1/2 flex flex-col relative perspective-[1000px] min-h-[500px] sm:min-h-0">
                                <div className={`w-full h-full relative duration-700 ease-[cubic-bezier(0.4,0.2,0.2,1)] [transform-style:preserve-3d] ${paymentResult ? '[transform:rotateY(180deg)]' : ''}`}>

                                    {/* MẶT TRƯỚC: MÃ QR & CHUYỂN KHOẢN */}
                                    <div className="absolute inset-0 [backface-visibility:hidden] bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center shadow-sm overflow-hidden flex-1">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-green-300"></div>

                                        <h3 className="font-bold text-[15px] text-slate-800 mb-4 flex items-center gap-2 shrink-0">
                                            <i className="fa-solid fa-expand text-primary"></i> Quét mã thanh toán
                                        </h3>

                                        {bankAccount ? (
                                            <>
                                                {qrCodeUrl ? (
                                                    <div className="relative group mb-4 shrink-0">
                                                        <div className="p-3 border-2 border-dashed border-primary/40 rounded-2xl bg-white relative overflow-hidden transition-all group-hover:border-primary">
                                                            <img
                                                                key={qrCodeUrl}
                                                                src={qrCodeUrl}
                                                                alt="QR Code"
                                                                className="w-[180px] h-[180px] object-contain animate-[fadeIn_0.5s_ease-out]"
                                                            />
                                                            {isPolling && (
                                                                <div className="absolute top-0 left-0 w-full h-[3px] bg-green-400 shadow-[0_0_12px_3px_#4ade80] opacity-70 animate-[scanQR_2s_ease-in-out_infinite]"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-[180px] h-[180px] border-2 border-dashed border-red-200 bg-red-50 rounded-2xl flex flex-col items-center justify-center text-red-400 mb-4 text-center p-4 shrink-0">
                                                        <i className="fa-solid fa-link-slash text-3xl mb-2"></i>
                                                        <p className="text-[11px] font-medium">Chủ trọ chưa cấu hình<br />định dạng mã QR.</p>
                                                    </div>
                                                )}

                                                <div className="w-full bg-[#F8FAFC] p-3 rounded-lg border border-slate-100 text-[12px] space-y-2 mb-4 overflow-y-auto [&::-webkit-scrollbar]:hidden">
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

                                                {isPolling ? (
                                                    <div className="w-full bg-[#F0FDF4] border border-green-200 rounded-lg p-3 text-center animate-pulse mt-auto">
                                                        <i className="fa-solid fa-circle-notch fa-spin text-primary text-xl mb-1.5 block"></i>
                                                        <p className="text-[12px] font-bold text-primary">Hệ thống đang chờ nhận tiền...</p>
                                                        <p className="text-[10px] text-green-700 mt-0.5">Vui lòng không đóng cửa sổ này sau khi quét mã.</p>
                                                    </div>
                                                ) : (
                                                    <form onSubmit={handleSubmitProof} className="w-full flex flex-col items-center mt-auto">
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
                                            </>
                                        ) : (
                                            <div className="flex-1 w-full border-2 border-dashed border-red-200 bg-red-50 rounded-xl flex flex-col items-center justify-center text-red-500 p-6 text-center">
                                                <i className="fa-solid fa-building-columns text-[40px] mb-3 opacity-50"></i>
                                                <h3 className="font-bold text-[15px] mb-1">Chưa có thông tin ngân hàng</h3>
                                                <p className="text-[12px]">Chủ trọ hiện chưa thiết lập số tài khoản để nhận tiền thanh toán online.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* MẶT SAU: MÀN HÌNH THÀNH CÔNG */}
                                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white border border-green-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-sm overflow-hidden flex-1">
                                        <div className={`absolute top-0 left-0 w-full h-1.5 ${paymentResult?.status === 'full' ? 'bg-green-500' : 'bg-amber-400'}`}></div>

                                        {paymentResult && (
                                            <div className="svg-success-container mb-4 relative">
                                                <svg className="checkmark w-24 h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                                    <circle className={`checkmark__circle ${paymentResult.status === 'full' ? 'stroke-green-500' : 'stroke-amber-400'}`} cx="26" cy="26" r="25" fill="none" strokeWidth="2" strokeMiterlimit="10" />
                                                    <path className={`checkmark__check ${paymentResult.status === 'full' ? 'stroke-green-500' : 'stroke-amber-400'}`} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" strokeWidth="3" />
                                                </svg>
                                                {paymentResult.status === 'full' && (
                                                    <div className="absolute inset-0 animate-[ping_0.5s_ease-out] opacity-20 bg-green-400 rounded-full"></div>
                                                )}
                                            </div>
                                        )}

                                        <h3 className="text-[20px] font-bold text-slate-800 mb-1">
                                            {paymentResult?.status === 'full' ? 'Giao dịch thành công!' : 'Đã nhận một phần!'}
                                        </h3>
                                        <p className="text-[13px] text-slate-500 mb-6">Hệ thống vừa ghi nhận khoản tiền</p>

                                        <div className="text-[36px] font-black mb-8 tracking-tight overflow-hidden flex items-center justify-center h-[40px]">
                                            <span className={`animate-[slideUpMoney_0.5s_ease-out_forwards] translate-y-10 ${paymentResult?.status === 'full' ? 'text-green-600' : 'text-amber-500'}`}>
                                                + {Number(paymentResult?.amount).toLocaleString()} <span className="text-[20px] font-bold">đ</span>
                                            </span>
                                        </div>

                                        {paymentResult?.status === 'partial' ? (
                                            <div className="w-full mt-auto">
                                                <div className="flex justify-between text-[11px] font-bold mb-1.5">
                                                    <span className="text-amber-600">Đã thanh toán {paymentResult.progress}%</span>
                                                    <span className="text-slate-500">Còn nợ</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                                                    <div className="h-full bg-amber-400 transition-all duration-1000 ease-out" style={{ width: `${paymentResult.progress}%` }}></div>
                                                </div>

                                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center relative overflow-hidden">
                                                    <div className="relative z-10">
                                                        <p className="text-[12px] font-medium text-amber-700">Tạo mã QR mới sau <span className="font-bold text-amber-900">{countdown}s</span>...</p>
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 h-1 bg-amber-200 transition-all ease-linear" style={{ width: `${(countdown / 4) * 100}%`, transitionDuration: '1s' }}></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={onClose} className="mt-auto w-full py-3.5 bg-green-500 text-white rounded-lg text-[14px] font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 active:scale-[0.98]">
                                                Hoàn tất & Đóng
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @keyframes scanQR {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes slideUpMoney {
                    0% { transform: translateY(40px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .checkmark__circle {
                    stroke-dasharray: 166;
                    stroke-dashoffset: 166;
                    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
                .checkmark__check {
                    transform-origin: 50% 50%;
                    stroke-dasharray: 48;
                    stroke-dashoffset: 48;
                    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards;
                }
                @keyframes stroke {
                    100% { stroke-dashoffset: 0; }
                }
                .perspective-\\[1000px\\] { perspective: 1000px; }
            `}</style>
        </div>
    );
}