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
            // Gọi song song 2 API để tối ưu tốc độ phản hồi
            const [invoiceRes, templateRes] = await Promise.all([
                invoiceService.getById(id),
                settingService.getInvoiceTemplate()
            ]);

            const invoiceData = invoiceRes.data.data;
            const templateRaw = templateRes.data?.data?.template || "";

            setInvoice(invoiceData);

            // Biên dịch (compile) shortcodes ngay tại Frontend để phục vụ live preview
            if (templateRaw) {
                const compiled = compileTemplate(templateRaw, invoiceData);
                setPreviewHtml(compiled);
            } else {
                setPreviewHtml("<p class='text-center text-slate-400 py-10'>Chưa cấu hình mẫu hóa đơn.</p>");
            }

        } catch (error) {
            toast.error("Không thể tải thông tin chi tiết hóa đơn.");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm bóc tách dữ liệu và map vào các biến shortcode tương đương với Backend
    const compileTemplate = (template, data) => {
        // Định dạng ngày tháng an toàn
        const formatD = (str) => {
            if (!str) return "";
            const parts = str.split(' ')[0].split('-');
            return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : str;
        };

        const periodToParts = data.period_to ? data.period_to.split('-') : [];
        const monthYear = periodToParts.length >= 2 ? `${periodToParts[1]}/${periodToParts[0]}` : "";

        const statusLabel = {
            draft: 'Bản nháp',
            issued: 'Chờ thanh toán',
            partially_paid: 'Thanh toán một phần',
            paid: 'ĐÃ THANH TOÁN ĐỦ',
            overdue: 'Quá hạn thanh toán',
            cancelled: 'Hóa đơn đã hủy',
        }[data.status] || data.status;

        // Tự động sinh bảng chi tiết danh sách khoản thu
        let itemsTableHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; font-size: 13px;">
                <thead>
                    <tr style="background-color: #f8fafc;">
                        <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-weight: bold;">Nội dung thu</th>
                        <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: center; font-weight: bold;">Số lượng</th>
                        <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: right; font-weight: bold;">Đơn giá</th>
                        <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: right; font-weight: bold;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
        `;
        data.items?.forEach(item => {
            itemsTableHtml += `
                <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 10px;">${item.description}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">${parseFloat(item.quantity)} ${item.unit || ''}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">${Number(item.unit_price_snapshot).toLocaleString("vi-VN")}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right; font-weight: 500;">${Number(item.amount).toLocaleString("vi-VN")}</td>
                </tr>
            `;
        });
        itemsTableHtml += '</tbody></table>';

        const replacePairs = {
            "{{INVOICE_CODE}}": data.invoice_code || "",
            "{{STATUS}}": statusLabel,
            "{{MONTH_YEAR}}": monthYear,
            "{{CREATED_DATE}}": formatD(data.created_at),
            "{{DUE_DATE}}": data.due_date ? formatD(data.due_date) : "Không có",
            "{{LANDLORD_NAME}}": data.room?.property?.user?.name || "",
            "{{LANDLORD_PHONE}}": data.room?.property?.user?.phone || "",
            "{{TENANT_NAME}}": data.lease?.tenant?.full_name || "",
            "{{TENANT_PHONE}}": data.lease?.tenant?.phone || "",
            "{{ROOM_NAME}}": data.room?.name || "",
            "{{PROPERTY_NAME}}": data.property?.name || "",
            "{{PROPERTY_ADDRESS}}": data.property?.address || "",
            "{{SUBTOTAL}}": Number(data.subtotal_amount || 0).toLocaleString("vi-VN"),
            "{{DISCOUNT}}": Number(data.discount_amount || 0).toLocaleString("vi-VN"),
            "{{TOTAL_AMOUNT}}": Number(data.total_amount || 0).toLocaleString("vi-VN"),
            "{{PAID_AMOUNT}}": Number(data.paid_amount || 0).toLocaleString("vi-VN"),
            "{{REMAINING_AMOUNT}}": Number(data.remaining_amount || 0).toLocaleString("vi-VN"),
            "{{INVOICE_ITEMS_TABLE}}": itemsTableHtml
        };

        let compiled = template;
        Object.entries(replacePairs).forEach(([key, value]) => {
            compiled = compiled.replaceAll(key, value);
        });

        return compiled;
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
                    <div className="w-full lg:w-[400px] overflow-y-auto p-4 sm:p-5 border-r border-slate-200 bg-white shrink-0 [&::-webkit-scrollbar]:hidden">
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
                                    {invoice.items?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                            <span className="text-slate-600 truncate max-w-[180px]" title={item.description}>{item.description}</span>
                                            <span className="font-semibold text-slate-800">{Number(item.amount).toLocaleString()}đ</span>
                                        </div>
                                    ))}
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