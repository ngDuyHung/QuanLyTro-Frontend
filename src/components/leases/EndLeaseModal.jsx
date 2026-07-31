import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import leasesService from "@/services/leasesService";
import invoiceService from "@/services/invoiceService"; // Thêm dòng này để gọi API

export default function EndLeaseModal({ open, lease, onClose, onSuccess, onOpenCheckoutInvoice, onGoToInvoices }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State quản lý việc hoàn cọc
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundMethod, setRefundMethod] = useState("cash");

    // State quản lý kiểm tra nợ real-time
    const [totalDebt, setTotalDebt] = useState(0);
    const [isCheckingDebt, setIsCheckingDebt] = useState(false);

    useEffect(() => {
        if (open && lease) {
            document.body.style.overflow = "hidden";
            setRefundAmount(lease?.deposit || 0);
            setRefundMethod("cash");

            // TỰ ĐỘNG GỌI API ĐỂ KIỂM TRA NỢ MỚI NHẤT MỖI KHI MỞ BẢNG
            checkInvoiceDebt(lease.id);
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open, lease]);

    // --- HÀM GỌI API KIỂM TRA CÔNG NỢ ---
    const checkInvoiceDebt = async (leaseId) => {
        setIsCheckingDebt(true);
        try {
            // Lấy tất cả hóa đơn của hợp đồng này từ Database
            const res = await invoiceService.getAll({ lease_id: leaseId, per_page: 100 });
            const invoices = res.data?.data || [];

            // Lọc bỏ hóa đơn bị hủy
            const activeInvoices = invoices.filter(inv => inv.status !== 'cancelled');

            // Tính tổng nợ
            const debt = activeInvoices.reduce((sum, inv) => {
                // Hóa đơn nháp (draft) = nợ toàn bộ. Đã phát hành = nợ remaining_amount
                const remaining = inv.status === 'draft'
                    ? Number(inv.total_amount || 0)
                    : Number(inv.remaining_amount || 0);
                return sum + remaining;
            }, 0);

            setTotalDebt(debt);
        } catch (error) {
            console.error("Lỗi khi kiểm tra nợ hóa đơn:", error);
        } finally {
            setIsCheckingDebt(false);
        }
    };

    if (!open || !lease) return null;

    const handleConfirm = async () => {
        try {
            setIsSubmitting(true);
            await leasesService.end(lease.id, {
                refund_amount: Number(refundAmount) || 0,
                refund_method: refundMethod
            });
            toast.success("Hợp đồng đã được kết thúc thành công.");
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi kết thúc hợp đồng.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-white w-full sm:max-w-[480px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out] relative">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
                            <i className="fa-solid fa-door-open text-[16px]"></i>
                        </div>
                        <div>
                            <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-800">Kết thúc hợp đồng thuê</h2>
                            <p className="text-[12px] font-medium text-slate-500 mt-0.5">Phòng: {lease.room?.name} - {lease.tenant?.full_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="p-5 bg-slate-50 overflow-y-auto max-h-[70vh]">
                    {/* KIỂM TRA NỢ ĐỂ HIỂN THỊ UI PHÙ HỢP */}
                    {totalDebt > 0 ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm mb-4">
                            <div className="flex items-start gap-3">
                                <i className="fa-solid fa-circle-exclamation text-red-500 text-xl mt-0.5"></i>
                                <div className="text-[13px] text-red-700 leading-relaxed flex-1">
                                    <p className="font-bold mb-1">Cảnh báo: Khách đang còn nợ tiền!</p>
                                    <p>Khách thuê vẫn còn đang nợ tổng cộng <strong>{totalDebt.toLocaleString("vi-VN")}đ</strong>.</p>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-red-200/60 flex items-center justify-between gap-3">
                                <span className="text-[12px] font-medium opacity-80">
                                    * Nên thu tiền trước khi kết thúc
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose(); // BẮT BUỘC: Đóng modal để giải phóng scroll body
                                        setTimeout(() => {
                                            onGoToInvoices?.(lease.id); // Điều hướng sau khi modal đã đóng
                                        }, 100);
                                    }}
                                    className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg text-[12px] font-bold shadow-sm flex items-center gap-2 hover:bg-red-100 transition-colors"
                                >
                                    Đóng & Đi thu tiền
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 shadow-sm space-y-3 mb-4">
                            <div className="flex items-start gap-3">
                                <i className="fa-solid fa-circle-exclamation text-amber-500 text-xl mt-0.5"></i>
                                <div className="text-[13px] text-slate-700 leading-relaxed">
                                    <p className="font-bold text-slate-800 mb-1">Lưu ý trước khi thực hiện:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Trạng thái hợp đồng sẽ chuyển thành <strong>Đã kết thúc</strong>.</li>
                                        <li>Phòng sẽ được chuyển về <strong>Trống</strong> và cư dân <strong>Đã rời đi</strong>.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* PHÍM TẮT CHUYỂN HƯỚNG */}
                            <div className="mt-3 pt-3 border-t border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <span className="text-[12px] text-amber-700 font-medium">
                                    * Khách chưa chốt phí tháng cuối?
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onOpenCheckoutInvoice?.(lease)}
                                    className="px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg text-[12px] font-bold hover:bg-amber-100 transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-file-invoice-dollar"></i> Lập hóa đơn thanh lý
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Vùng xác nhận hoàn cọc */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <h3 className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <i className="fa-solid fa-money-bill-wave text-green-600"></i> Xác nhận hoàn trả tiền cọc
                        </h3>

                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                            <span className="text-[12px] text-slate-600 font-medium">Tiền cọc của khách:</span>
                            <span className="text-[14px] font-bold text-slate-800">{Number(lease.deposit || 0).toLocaleString("vi-VN")} đ</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] text-slate-500 font-semibold mb-1">Số tiền hoàn trả thực tế</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={refundAmount === 0 ? "" : Number(refundAmount).toLocaleString("vi-VN")}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/[^\d]/g, "");
                                            setRefundAmount(rawValue ? Number(rawValue) : 0);
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand font-semibold text-brand text-right"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">đ</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] text-slate-500 font-semibold mb-1">Hình thức trả</label>
                                <select
                                    value={refundMethod}
                                    onChange={(e) => setRefundMethod(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand text-slate-700"
                                >
                                    <option value="cash">Tiền mặt</option>
                                    <option value="transfer">Chuyển khoản</option>
                                </select>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-3 italic text-center">
                            *Hệ thống sẽ tự động sinh <strong className="text-slate-600">Phiếu Chi</strong> nếu số tiền lớn hơn 0.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 px-5 py-4 bg-white flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting || isCheckingDebt}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-bold hover:bg-slate-200 transition-colors disabled:opacity-70"
                    >
                        Bỏ qua
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting || isCheckingDebt}
                        className="px-6 py-2 bg-amber-600 text-white rounded-lg text-[13px] font-bold hover:bg-amber-700 flex items-center gap-2 transition-all shadow-md shadow-amber-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <><i className="fa-solid fa-spinner animate-spin"></i> Đang xử lý...</>
                        ) : (
                            <><i className="fa-solid fa-check-double"></i> Xác nhận kết thúc</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}