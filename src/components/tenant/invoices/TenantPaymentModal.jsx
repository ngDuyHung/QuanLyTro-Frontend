import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantInvoiceService from "@/services/tenantInvoiceService";

export default function TenantPaymentModal({ open, invoice: initialInvoice, onClose, onSuccess }) {
    const [invoiceDetail, setInvoiceDetail] = useState(null);
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Đã thêm: State quản lý trạng thái Polling
    const [isPolling, setIsPolling] = useState(false);

    // 1. Fetch dữ liệu hóa đơn và cấu hình thanh toán
    useEffect(() => {
        if (!open || !initialInvoice?.id) {
            setInvoiceDetail(null);
            setPaymentConfig(null);
            setIsPolling(false);
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

    // 2. Logic Polling kiểm tra trạng thái thanh toán tự động
    useEffect(() => {
        let intervalId;
        // Đã sửa: Lấy auto_confirm từ đúng cấu trúc dữ liệu paymentConfig
        const isAutoConfirmEnabled = paymentConfig?.sepay_config?.auto_confirm === true;
        const bankAccount = paymentConfig?.bank_accounts?.[0];

        // Đã sửa: Bỏ các biến thừa (method, bankAccountId), chỉ check nếu Modal đang mở, có mã QR và auto_confirm = true
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
                        onSuccess?.(); // Refresh lại bảng danh sách bên dưới
                        onClose();    // Tự động đóng Modal
                    }
                } catch (error) {
                    console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
                }
            }, 3000); // Check mỗi 3 giây
        } else {
            setIsPolling(false);
        }

        // Cleanup function: Dọn dẹp interval khi Modal đóng hoặc component unmount
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [open, invoiceDetail, paymentConfig, onSuccess, onClose]);


    // 3. Hàm sinh URL mã QR dựa trên template của SePay
    const generateQrCodeUrl = () => {
        if (!invoiceDetail || !paymentConfig || !paymentConfig.bank_accounts?.length) return null;

        const bankAccount = paymentConfig.bank_accounts[0];
        if (!bankAccount.sepay_qr_template) return null;

        let qr = bankAccount.sepay_qr_template;
        qr = qr.replace("{amount}", invoiceDetail.remaining_amount);
        qr = qr.replace("{invoice_code}", invoiceDetail.invoice_code);

        return qr;
    };

    const qrCodeUrl = generateQrCodeUrl();
    const bankAccount = paymentConfig?.bank_accounts?.[0];

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white w-full max-w-4xl h-[85vh] flex flex-col rounded-xl">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h2 className="font-bold text-lg">Thanh toán Hóa đơn {invoiceDetail?.invoice_code}</h2>
                    <button onClick={onClose} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded font-semibold">
                        Đóng
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto flex p-4 gap-4">
                    {isLoading || !invoiceDetail || !paymentConfig ? (
                        <div className="w-full flex justify-center items-center">
                            <i className="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mr-2"></i>
                            <p>Đang tải dữ liệu thanh toán...</p>
                        </div>
                    ) : (
                        <>
                            {/* Nửa trái: Chi tiết Hóa đơn */}
                            <div className="w-1/2 border rounded-lg p-4 overflow-y-auto">
                                <h3 className="font-bold text-md mb-2 uppercase text-gray-700">Chi tiết các khoản phí</h3>
                                <p><strong>Phòng:</strong> {invoiceDetail.room?.name}</p>
                                <p><strong>Kỳ:</strong> {invoiceDetail.period_from} đến {invoiceDetail.period_to}</p>
                                <p><strong>Hạn nạp:</strong> {invoiceDetail.due_date}</p>

                                <ul className="divide-y mt-4 border-t border-b">
                                    {invoiceDetail.items?.map(item => (
                                        <li key={item.id} className="py-2 flex justify-between">
                                            <div>
                                                <p className="font-semibold">{item.description}</p>
                                                <p className="text-sm text-gray-500">
                                                    SL: {item.quantity} {item.unit} | Giá: {Number(item.unit_price_snapshot).toLocaleString()}đ
                                                </p>
                                            </div>
                                            <span className="font-medium text-gray-800">
                                                {Number(item.amount).toLocaleString()} đ
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="text-right mt-4 space-y-1">
                                    <p>Tổng hóa đơn: <strong>{Number(invoiceDetail.total_amount).toLocaleString()} đ</strong></p>
                                    <p>Đã trả: <strong className="text-green-600">{Number(invoiceDetail.paid_amount).toLocaleString()} đ</strong></p>
                                    <p className="text-lg mt-2">
                                        CẦN THANH TOÁN: <strong className="text-red-600">{Number(invoiceDetail.remaining_amount).toLocaleString()} đ</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Nửa phải: Thông tin Ngân hàng & QR Code */}
                            <div className="w-1/2 border rounded-lg p-4 bg-blue-50 flex flex-col items-center">
                                <h3 className="font-bold text-md mb-4 uppercase text-blue-800">Quét mã để thanh toán</h3>

                                {bankAccount ? (
                                    <div className="w-full text-center">
                                        {/* Thông tin Text */}
                                        <div className="bg-white p-3 rounded border text-left mb-4 text-sm space-y-1">
                                            <p>Ngân hàng: <strong>{bankAccount.bank_code}</strong></p>
                                            <p>Số tài khoản: <strong className="text-blue-600 text-base">{bankAccount.account_number}</strong></p>
                                            <p>Tên chủ thẻ: <strong>{bankAccount.account_name}</strong></p>
                                            <p>Số tiền: <strong className="text-red-500">{Number(invoiceDetail.remaining_amount).toLocaleString()} đ</strong></p>
                                            <p>Nội dung CK: <strong>{invoiceDetail.invoice_code}</strong></p>
                                        </div>

                                        {/* Hình QR */}
                                        {qrCodeUrl ? (
                                            <div className="bg-white p-2 border-2 border-dashed border-blue-300 inline-block rounded-lg">
                                                <img src={qrCodeUrl} alt="Mã QR Thanh Toán" className="w-64 h-64 object-contain" />
                                            </div>
                                        ) : (
                                            <p className="text-red-500 mt-4">Chủ trọ chưa cấu hình mẫu QR SePay.</p>
                                        )}

                                        {/* Trạng thái Polling/Chờ */}
                                        {isPolling ? (
                                            <div className="mt-6 flex items-center justify-center gap-2 text-green-600 font-medium animate-pulse">
                                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                <p>Hệ thống đang chờ nhận tiền tự động...</p>
                                            </div>
                                        ) : (
                                            // Trường hợp chủ trọ tắt Auto Confirm
                                            <div className="mt-6 text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                                                <p><i className="fa-solid fa-info-circle mr-1"></i> Sau khi chuyển khoản, vui lòng đợi chủ trọ xác nhận thủ công.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-red-500 mt-10">
                                        <i className="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
                                        <p>Chủ trọ chưa thiết lập tài khoản ngân hàng để nhận tiền.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}