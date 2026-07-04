import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import invoiceService from "@/services/invoiceService";
import settingService from "@/services/settingService";

export default function ViewInvoiceModal({ open, invoice: initialInvoice, onClose }) {
    const [invoice, setInvoice] = useState(null);
    const [previewHtml, setPreviewHtml] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    // Tải đồng thời cả Chi tiết hóa đơn và Mẫu hóa đơn từ hệ thống
    useEffect(() => {
        if (open && initialInvoice?.id) {
            fetchInvoiceAndTemplate(initialInvoice.id);
        } else {
            setInvoice(null);
            setPreviewHtml("");
        }
    }, [open, initialInvoice]);

    const fetchInvoiceAndTemplate = async (id) => {
        setIsLoading(true);
        try {
            // Thay vì gọi getTemplate, gọi API preview HTML mới tạo
            const [invoiceRes, previewRes] = await Promise.all([
                invoiceService.getById(id),
                invoiceService.getPreviewHtml(id) // <--- Thêm hàm gọi API này vào invoiceService
            ]);

            setInvoice(invoiceRes.data.data);
            setPreviewHtml(previewRes.data.html); // Gán thẳng cục HTML backend trả về
        } catch (error) {
            toast.error("Không thể tải thông tin chi tiết hóa đơn.");
            console.error("Lỗi khi tải hóa đơn hoặc mẫu:", error);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };



    // 1. HÀM CHỈ TẢI XUỐNG PDF
    const handleDownloadPdf = async () => {
        setIsExporting(true);
        try {
            const response = await invoiceService.exportPdf(invoice.id);

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const fileName = `Hoa_don_${invoice.invoice_code}.pdf`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Đã tải xuống hóa đơn PDF thành công.");
        } catch (error) {
            toast.error("Có lỗi xảy ra khi kết xuất tệp PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    // 2. HÀM CHỈ MỞ BẢNG CHIA SẺ (ZALO, MESSENGER...)
    const handleSharePdf = async () => {
        setIsExporting(true);
        try {
            const response = await invoiceService.exportPdf(invoice.id);

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const fileName = `Hoa_don_${invoice.invoice_code}.pdf`;
            const file = new File([blob], fileName, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: `Hóa đơn phòng ${invoice.room?.name}`,
                        text: `Gửi bạn phiếu thu tiền phòng kỳ ${invoice.invoice_code}.`,
                        files: [file],
                    });
                    toast.success("Đã mở bảng chia sẻ thành công!");
                } catch (shareError) {
                    if (shareError.name !== 'AbortError') {
                        toast.error("Lỗi khi mở bảng chia sẻ hệ thống.");
                    }
                }
            } else {
                // Nếu trình duyệt không hỗ trợ share file, báo lỗi nhẹ nhàng
                toast.warning("Thiết bị hoặc trình duyệt này chưa hỗ trợ chia sẻ file trực tiếp. Vui lòng bấm Tải PDF.");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tạo file để chia sẻ.");
        } finally {
            setIsExporting(false);
        }
    };
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
            <div className="bg-slate-100 w-full max-w-6xl h-[95vh] sm:h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[16px]">
                            <i className="fa-solid fa-receipt"></i>
                        </div>
                        <div>
                            <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-800">Quản lý & In hóa đơn chi tiết</h2>
                            <p className="text-[12px] text-slate-500 font-medium">Mã tra cứu: {initialInvoice?.invoice_code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors flex items-center justify-center">
                        <i className="fa-solid fa-xmark text-md"></i>
                    </button>
                </div>

                {/* Split view body */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

                    {/* CỘT TRÁI: Giao diện dữ liệu thô của hệ thống (System Dashboard View) */}
                    <div className="w-full lg:w-[400px] max-h-[40vh] lg:max-h-none overflow-y-auto p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white shrink-0 [&::-webkit-scrollbar]:hidden">
                        {isLoading || !invoice ? (
                            <div className="flex justify-center items-center h-48 text-brand">
                                <i className="fa-solid fa-spinner animate-spin text-xl"></i>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50 text-[13px]">
                                    <div className="flex justify-between"><span className="text-slate-400">Khu trọ:</span><span className="font-semibold text-slate-800">{invoice.property?.name}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Mã phòng:</span><span className="font-bold text-brand">Phòng {invoice.room?.name}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Khách đại diện:</span><span className="font-semibold text-slate-800">{invoice.lease?.tenant?.full_name || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Chu kỳ đóng:</span><span className="font-medium text-slate-600">{invoice.period_from} ~ {invoice.period_to}</span></div>
                                </div>

                                {/* Khối chi tiết thành tiền */}
                                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[13px]">
                                    <h4 className="font-bold text-slate-700 mb-2 uppercase text-[11px] tracking-wider text-slate-400">Dòng tiền chi tiết</h4>
                                    {invoice.items?.map(item => {
                                        const isUtility = ['electricity', 'water'].includes(item.charge_type);
                                        const meter = invoice.meter_readings?.find(m => m.type === item.charge_type);
                                        const free = parseFloat(item.free_quantity_snapshot) || 0;

                                        return (
                                            <div key={item.id} className="flex flex-col py-2 border-b border-slate-100 last:border-0">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-slate-700 truncate max-w-[180px]" title={item.description}>{item.description}</span>
                                                    <span className="font-bold text-slate-800">{Number(item.amount).toLocaleString()}đ</span>
                                                </div>

                                                {/* Dòng chú thích siêu gọn gàng */}
                                                {isUtility && meter && (
                                                    <div className="text-[10px] text-slate-500 font-mono bg-slate-100/80 w-fit px-1.5 py-0.5 mt-1 rounded border border-slate-200">
                                                        Cũ: {meter.previous_reading} ➔ Mới: {meter.current_reading} {free > 0 && ` (-${free} free)`}
                                                    </div>
                                                )}
                                                {!isUtility && free > 0 && (
                                                    <div className="text-[10px] text-slate-500 bg-emerald-50 text-emerald-600 border border-emerald-100 w-fit px-1.5 py-0.5 mt-1 rounded">
                                                        Miễn phí: {free} {item.unit}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-black text-slate-800 text-[14px]">
                                        <span>Tổng hóa đơn:</span><span>{Number(invoice.total_amount).toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between text-green-600 font-bold">
                                        <span>Đã thu:</span><span>{Number(invoice.paid_amount).toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between text-red-500 font-black text-[15px] pt-1 border-t border-dashed border-slate-300">
                                        <span>Còn nợ:</span><span>{Number(invoice.remaining_amount).toLocaleString()}đ</span>
                                    </div>
                                </div>

                                {/* --- KHỐI LỊCH SỬ ĐÓNG TIỀN: ĐẶT DƯỚI CỤM TÓM TẮT DÒNG TIỀN --- */}
                                {invoice?.allocations && invoice.allocations.length > 0 && (
                                    <div className="hidden md:block bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col shrink-0 animate-[fadeIn_0.2s_ease-out]">
                                        {/* Tiêu đề khối */}
                                        <h4 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <i className="fa-solid fa-clock-rotate-left text-slate-400 text-[13px]"></i>
                                                Lịch sử đóng tiền
                                            </div>
                                            <span className="bg-slate-100 text-slate-500 font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                {invoice.allocations.length} lần
                                            </span>
                                        </h4>

                                        {/* Danh sách cuộn nội bộ - Khống chế chiều cao hiển thị vừa khít 2 giao dịch */}
                                        <div className="space-y-2 overflow-y-auto max-h-[240px] pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded">
                                            {invoice.allocations.map((alloc, idx) => {
                                                const tx = alloc.financial_transaction;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[12px] hover:bg-slate-100/70 transition-colors"
                                                    >
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-slate-700 font-mono truncate max-w-[100px]">
                                                                    {tx?.transaction_code || `Phiếu #${alloc.financial_transaction_id}`}
                                                                </span>
                                                                <span className="text-[9px] bg-slate-200/80 text-slate-500 px-1 rounded font-semibold whitespace-nowrap">
                                                                    {tx?.method_label || "Tiền mặt"}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                                                                {alloc.allocated_at ? new Date(alloc.allocated_at).toLocaleDateString('vi-VN') : "—"}
                                                            </span>
                                                        </div>

                                                        <div className="text-right flex flex-col justify-center shrink-0 pl-2">
                                                            <span className="font-extrabold text-green-600 text-[13px]">
                                                                +{Number(alloc.allocated_amount).toLocaleString('vi-VN')}đ
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* CỘT PHẢI: Màn hình xem trước bản in thực tế (Live Print Preview A5/A4 Sheet) */}
                    <div className="flex-1 min-h-0 bg-slate-600 p-3 sm:p-5 flex flex-col items-center justify-between relative overflow-hidden">

                        {/* Thanh công cụ hành động nhanh đặt phía trên tờ giấy in */}
                        <div className="w-full max-w-[700px] mb-3 shrink-0 flex gap-2.5 justify-end">
                            <button
                                onClick={handleSharePdf}
                                disabled={isExporting || isLoading || !previewHtml}
                                className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                title="Gửi qua Zalo, Messenger..."
                            >
                                <i className="fa-solid fa-share-nodes"></i> Chia sẻ
                            </button>

                            <button
                                onClick={handleDownloadPdf}
                                disabled={isExporting || isLoading || !previewHtml}
                                className="px-5 py-2.5 bg-brand text-white rounded-lg text-[13px] font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-black/20 disabled:opacity-50"
                            >
                                {isExporting ? (
                                    <><i className="fa-solid fa-spinner animate-spin"></i> Đang tải...</>
                                ) : (
                                    <><i className="fa-solid fa-download"></i> Tải PDF</>
                                )}
                            </button>
                        </div>

                        {/* Vùng mô phỏng khổ giấy in thực tế */}
                        <div className="flex-1 w-full max-w-[700px] bg-white rounded-xl shadow-2xl overflow-y-auto p-6 sm:p-8 border border-slate-300 border-t-4 border-t-brand/80 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center h-full gap-3 text-white">
                                    <i className="fa-solid fa-circle-notch animate-spin text-3xl text-brand"></i>
                                    <p className="text-[13px] font-medium text-slate-400">Đang đồng bộ mẫu phiếu...</p>
                                </div>
                            ) : (
                                // Render mã HTML thô từ template đã map dữ liệu thực
                                <div
                                    className="preview-document-content-target"
                                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                                />
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}