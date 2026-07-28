import React from "react";

export default function TenantInvoicesTable({
    invoices = [],
    isLoading,
    pagination,
    page,
    onPageChange,
    onOpenPaymentModal,
    onOpenViewModal
}) {
    // 1. Hàm helper: Tách tháng và năm trực tiếp từ chuỗi (tránh lỗi lệch múi giờ của JS Date)
    const getMonthYear = (dateString) => {
        if (!dateString) return { month: "--", year: "----" };
        // API trả về định dạng "YYYY-MM-DD" (VD: "2025-08-01") -> Cắt chuỗi lấy luôn vị trí năm và tháng
        const parts = dateString.split("-");
        if (parts.length >= 2) {
            return {
                month: parts[1],
                year: parts[0]
            };
        }
        return { month: "--", year: "----" };
    };

    // 2. Hàm helper: Format ngày Việt Nam
    const formatDate = (dateString) => {
        if (!dateString) return "Đang cập nhật";
        return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // 3. Hàm cấu hình UI theo trạng thái hóa đơn
    const getStatusConfig = (status) => {
        switch (status) {
            case 'issued':
            case 'partially_paid':
                return {
                    label: "Chưa thanh toán",
                    cardClass: "border-gray-200 hover:shadow-md",
                    hasLeftBorder: true,
                    badgeClass: "bg-[#F0FDF4] text-primary",
                    amountClass: "text-primary",
                    icon: null
                };
            case 'paid':
                return {
                    label: "Đã thanh toán",
                    cardClass: "border-gray-100 hover:border-gray-200",
                    hasLeftBorder: false,
                    badgeClass: "bg-[#F0FDF4] text-primary",
                    amountClass: "text-gray-900",
                    icon: "fa-regular fa-circle-check"
                };
            case 'overdue':
                return {
                    label: "Quá hạn",
                    cardClass: "border-gray-100 hover:border-gray-200",
                    hasLeftBorder: false,
                    badgeClass: "bg-red-50 text-red-500",
                    amountClass: "text-red-500",
                    icon: "fa-solid fa-circle-exclamation"
                };
            case 'cancelled':
                return {
                    label: "Đã hủy",
                    cardClass: "border-gray-100 hover:border-gray-200 opacity-70",
                    hasLeftBorder: false,
                    badgeClass: "bg-gray-100 text-gray-600",
                    amountClass: "text-gray-900",
                    icon: "fa-solid fa-chevron-down text-[10px]"
                };
            default:
                return {
                    label: "Bản nháp",
                    cardClass: "border-gray-100",
                    hasLeftBorder: false,
                    badgeClass: "bg-gray-100 text-gray-600",
                    amountClass: "text-gray-500",
                    icon: null
                };
        }
    };

    return (
        <div className="flex-1 flex flex-col">
            <div className="p-6 space-y-4 flex-1">
                {isLoading ? (
                    // Hiệu ứng Skeleton Loading mô phỏng Card
                    [1, 2, 3].map(i => (
                        <div key={i} className="flex items-center p-4 border border-gray-100 rounded-xl bg-white">
                            <div className="w-16 h-16 rounded-lg bg-slate-200 animate-pulse shrink-0"></div>
                            <div className="ml-5 flex-1 space-y-2.5">
                                <div className="w-24 h-5 bg-slate-200 animate-pulse rounded"></div>
                                <div className="w-48 h-4 bg-slate-200 animate-pulse rounded"></div>
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                                <div className="text-right space-y-2">
                                    <div className="w-24 h-6 bg-slate-200 animate-pulse rounded ml-auto"></div>
                                    <div className="w-32 h-8 bg-slate-200 animate-pulse rounded-lg"></div>
                                </div>
                                <div className="w-4 h-4 bg-slate-200 animate-pulse rounded"></div>
                            </div>
                        </div>
                    ))
                ) : invoices.length === 0 ? (
                    // Trạng thái trống
                    <div className="pb-8 pt-10 flex flex-col items-center justify-center text-gray-400 text-sm gap-3 h-full">
                        <i className="fa-regular fa-folder-open text-4xl mb-2 text-gray-300"></i>
                        <p>Không có dữ liệu hóa đơn nào phù hợp.</p>
                    </div>
                ) : (
                    // Danh sách Card Hóa Đơn
                    <>
                        {invoices.map(invoice => {
                            const { month, year } = getMonthYear(invoice.period_from);
                            const config = getStatusConfig(invoice.status);

                            // Xác định số tiền hiển thị: Đã hủy/Đã trả thì hiện tổng tiền, đang nợ thì hiện số tiền CÒN NỢ
                            const isResolved = invoice.status === 'paid' || invoice.status === 'cancelled';
                            const displayAmount = isResolved ? invoice.total_amount : invoice.remaining_amount;

                            // Kiểm tra giao dịch đang chờ duyệt
                            const isPending = invoice.allocations?.some(
                                (a) => a.financial_transaction?.status === 'pending'
                            );

                            return (
                                <div key={invoice.id} className={`flex items-center p-4 border rounded-xl relative transition bg-white ${config.cardClass}`}>
                                    {/* Viền trái cho hóa đơn chưa thanh toán */}
                                    {config.hasLeftBorder && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl"></div>
                                    )}

                                   {/* Date Box (Giao diện Cuốn Lịch) */}
                                    <div className={`w-16 h-16 rounded-lg border flex flex-col shrink-0 overflow-hidden ${
                                        invoice.status === 'cancelled' ? 'border-gray-200 opacity-70' : 'border-gray-200 shadow-sm'
                                    }`}>
                                        {/* Gáy lịch (Header) */}
                                        <div className={`py-0 mt-[-4px] my-0 text-center border-b ${
                                            invoice.status === 'cancelled' ? 'bg-gray-100 border-gray-200' : 'bg-primary/10 border-primary/20'
                                        }`}>
                                            <span className={`text-[9px] font-bold tracking-widest uppercase ${
                                                invoice.status === 'cancelled' ? 'text-gray-500' : 'text-primary'
                                            }`}>
                                                THÁNG
                                            </span>
                                        </div>
                                        
                                        {/* Thân lịch (Body) */}
                                        <div className={`flex-1 flex flex-col items-center justify-center ${
                                            invoice.status === 'cancelled' ? 'bg-gray-50' : 'bg-white'
                                        }`}>
                                            <span className={`text-xl font-black leading-none ${
                                                invoice.status === 'cancelled' ? 'text-gray-400' : 'text-gray-900'
                                            }`}>
                                                {month}
                                            </span>
                                            <span className={`text-[9px] font-semibold mt-0.5 ${
                                                invoice.status === 'cancelled' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>
                                                {year}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="ml-5 flex-1 flex flex-col justify-center">
                                        <div className="mb-1.5">
                                            <span className={`${config.badgeClass} text-xs font-semibold px-2.5 py-1 rounded-md inline-flex items-center gap-1.5`}>
                                                {config.label} {config.icon && <i className={config.icon}></i>}
                                            </span>
                                        </div>
                                        <div className={`flex flex-col sm:flex-row sm:gap-6 gap-1 text-[13px]`}>
                                            <p className={invoice.status === 'cancelled' ? 'text-gray-400' : 'text-gray-500'}>
                                                Kỳ hóa đơn: <span className={`${invoice.status === 'cancelled' ? '' : 'text-gray-900'} font-medium`}>{formatDate(invoice.period_from)} - {formatDate(invoice.period_to)}</span>
                                            </p>

                                            {/* Logic hiển thị Ngày tháng phụ thuộc trạng thái */}
                                            {invoice.status === 'paid' ? (
                                                <p className="text-gray-500">Thanh toán: <span className="text-gray-600 font-medium">{formatDate(invoice.updated_at)}</span></p>
                                            ) : invoice.status === 'cancelled' ? (
                                                <p className="text-gray-400">Đã hủy: <span className="font-medium">{formatDate(invoice.updated_at)}</span></p>
                                            ) : (
                                                <p className="text-gray-500">
                                                    Hạn thanh toán: <span className={`${invoice.status === 'overdue' ? 'text-red-500 font-bold' : 'text-gray-900 font-medium'}`}>
                                                        {formatDate(invoice.due_date)} {invoice.status === 'overdue' && "(Đã quá hạn)"}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action & Amount */}
                                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 ml-4">
                                        <div className="text-right">
                                            <p className={`text-xl font-bold ${config.amountClass}`}>
                                                {Number(displayAmount).toLocaleString('vi-VN')}
                                                <span className="text-base underline ml-0.5 font-semibold">đ</span>
                                            </p>

                                            {/* Nút thao tác tương ứng trạng thái */}
                                            <div className="mt-2">
                                                {isPending ? (
                                                    <button disabled className="w-full bg-amber-50 text-amber-600 border border-amber-200 text-[12px] sm:text-[13px] font-medium py-1.5 px-3 sm:px-4 rounded-lg flex justify-center items-center gap-1.5 cursor-not-allowed">
                                                        <i className="fa-solid fa-clock-rotate-left"></i> Chờ duyệt
                                                    </button>
                                                ) : invoice.status === 'paid' ? (
                                                    <button onClick={() => onOpenViewModal(invoice)} className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[12px] sm:text-[13px] font-medium py-1.5 px-3 sm:px-4 rounded-lg transition flex items-center justify-center gap-2">
                                                        <i className="fa-solid fa-print"></i> Biên lai
                                                    </button>
                                                ) : (invoice.status === 'issued' || invoice.status === 'partially_paid' || invoice.status === 'overdue') ? (
                                                    <button onClick={() => onOpenPaymentModal(invoice)} className="w-full bg-primary hover:bg-[#097340] text-white text-[12px] sm:text-[13px] font-medium py-1.5 px-3 sm:px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-sm shadow-primary/20">
                                                        <i className="fa-regular fa-credit-card"></i> Thanh toán
                                                    </button>
                                                ) : (
                                                    <button onClick={() => onOpenViewModal(invoice)} className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[12px] sm:text-[13px] font-medium py-1.5 px-3 sm:px-4 rounded-lg transition">
                                                        Xem chi tiết
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Mũi tên điều hướng nhỏ gọn trên Mobile */}
                                        <i className="fa-solid fa-chevron-right text-gray-300 hidden sm:block"></i>
                                    </div>
                                </div>
                            );
                        })}

                        {/* End of data indicator */}
                        <div className="pb-4 pt-2 flex items-center justify-center text-gray-400 text-sm gap-2">
                            <i className="fa-regular fa-file-lines"></i> Không còn dữ liệu
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}