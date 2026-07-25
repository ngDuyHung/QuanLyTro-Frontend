import React from "react";

export default function TenantInvoicesTable({
    invoices = [],
    isLoading,
    pagination,
    page,
    onPageChange,
    status,
    onStatusChange,
    month,
    onMonthChange,
    onOpenPaymentModal,
    onOpenViewModal
}) {
    // TODO: Ráp bộ lọc (Kỳ, Trạng thái) UI vào đây

    return (
        <div className="bg-white border border-slate-200 rounded-xl flex-1 flex flex-col">
            {/* Vùng Lọc tạm thời */}
            <div className="p-4 border-b flex gap-4">
                <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="border p-2">
                    <option value="">Tất cả trạng thái</option>
                    <option value="issued">Đã phát hành (Chưa trả)</option>
                    <option value="partially_paid">Trả một phần</option>
                    <option value="paid">Đã thu đủ</option>
                    <option value="overdue">Quá hạn</option>
                </select>
                <input type="month" value={month} onChange={(e) => onMonthChange(e.target.value)} className="border p-2"/>
            </div>

            {/* Vùng Table */}
            <div className="p-4 overflow-auto flex-1">
                {isLoading ? (
                    <p>Đang tải dữ liệu...</p>
                ) : invoices.length === 0 ? (
                    <p>Bạn không có hóa đơn nào.</p>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Mã HĐ</th>
                                <th className="p-2">Tổng tiền</th>
                                <th className="p-2">Còn nợ</th>
                                <th className="p-2">Trạng thái</th>
                                <th className="p-2">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(invoice => (
                                <tr key={invoice.id} className="border-b hover:bg-slate-50">
                                    <td className="p-2">{invoice.invoice_code}</td>
                                    <td className="p-2">{Number(invoice.total_amount).toLocaleString()} đ</td>
                                    <td className="p-2 text-red-500 font-bold">{Number(invoice.remaining_amount).toLocaleString()} đ</td>
                                    <td className="p-2">{invoice.status}</td>
                                    <td className="p-2">
                                        {/* Logic tách Modal: Nếu paid thì gọi View, ngược lại gọi Payment */}
                                        {invoice.status === 'paid' ? (
                                            <button 
                                                onClick={() => onOpenViewModal(invoice)}
                                                className="px-3 py-1 bg-gray-100 border rounded"
                                            >
                                                Xem Biên Lai
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => onOpenPaymentModal(invoice)}
                                                className="px-3 py-1 bg-brand text-white rounded"
                                            >
                                                Thanh toán
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* TODO: Ráp Phân trang UI vào đây */}
        </div>
    );
}