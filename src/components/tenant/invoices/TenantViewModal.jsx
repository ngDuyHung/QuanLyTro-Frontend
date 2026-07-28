import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import tenantInvoiceService from "@/services/tenantInvoiceService";
import { toBlob } from "html-to-image";

export default function TenantViewModal({ open, invoice: initialInvoice, onClose }) {
    const [invoice, setInvoice] = useState(null);
    const [previewHtml, setPreviewHtml] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [exportingAction, setExportingAction] = useState(null);

    // Khai báo ref để đánh dấu vùng giao diện cần chụp ảnh
    const invoiceRef = useRef(null);
    const receiptMobileRef = useRef(null);

    // Quản lý Tab trên Mobile
    const [mobileTab, setMobileTab] = useState("details");

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
            const [invoiceRes, previewRes] = await Promise.all([
                tenantInvoiceService.getById(id),
                tenantInvoiceService.getPreviewHtml(id)
            ]);
            setInvoice(invoiceRes.data.data);
            setPreviewHtml(previewRes.data.html);
        } catch (error) {
            toast.error("Không thể tải thông tin chi tiết hóa đơn.");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    // HÀM CHIA SẺ ẢNH BẢN IN (PDF STYLE)
    const handleSharePdfImage = async () => {
        setExportingAction('share_pdf_image');
        try {
            if (!invoiceRef.current) return;

            // Chụp trực tiếp giao diện đang hiển thị thành file ảnh
            const blob = await toBlob(invoiceRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#ffffff'
            });
            const fileName = `Ban_in_Hoa_don_${invoice?.invoice_code}.png`;
            const file = new File([blob], fileName, { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Hóa đơn phòng ${invoice?.room?.name}`,
                    text: `Gửi bạn bản in hóa đơn phòng ${invoice?.room?.name}.`,
                    files: [file],
                });
                toast.success("Đã mở bảng chia sẻ thành công!");
            } else {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tạo ảnh bản in.");
        } finally {
            setExportingAction(null);
        }
    };

    // HÀM CHIA SẺ BIÊN LAI ĐIỆN TỬ (GIAO DIỆN MOBILE)
    const handleShareMobileReceipt = async () => {
        setExportingAction('share_mobile_receipt');
        try {
            if (!receiptMobileRef.current) return;

            const blob = await toBlob(receiptMobileRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#f8fafc',
                style: {
                    padding: '24px',
                    margin: '0'
                }
            });

            const fileName = `Bien_lai_${invoice?.invoice_code}.png`;
            const file = new File([blob], fileName, { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Biên lai phòng ${invoice?.room?.name}`,
                    text: `Gửi bạn biên lai điện tử phòng ${invoice?.room?.name}.`,
                    files: [file],
                });
                toast.success("Đã mở bảng chia sẻ thành công!");
            } else {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tạo ảnh biên lai.");
        } finally {
            setExportingAction(null);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
            <div className="bg-slate-100 w-full max-w-6xl h-[95vh] sm:h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[16px]">
                            <i className="fa-solid fa-receipt"></i>
                        </div>
                        <div>
                            <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-800">Chi tiết Biên lai điện tử</h2>
                            <p className="text-[12px] text-slate-500 font-medium">Mã tra cứu: {initialInvoice?.invoice_code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors flex items-center justify-center">
                        <i className="fa-solid fa-xmark text-md"></i>
                    </button>
                </div>

                {/* Thanh Tabs trên Mobile */}
                <div className="flex lg:hidden border-b border-slate-200 bg-white shrink-0">
                    <button
                        onClick={() => setMobileTab("details")}
                        className={`flex-1 py-3 text-[14px] font-semibold text-center border-b-2 transition-colors ${mobileTab === "details"
                            ? "border-primary text-primary"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <i className="fa-solid fa-list-ul mr-2"></i> Chi tiết
                    </button>
                    <button
                        onClick={() => setMobileTab("preview")}
                        className={`flex-1 py-3 text-[14px] font-semibold text-center border-b-2 transition-colors ${mobileTab === "preview"
                            ? "border-primary text-primary"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <i className="fa-solid fa-file-pdf mr-2"></i> Bản in
                    </button>
                </div>

                {/* Split view body */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

                    {/* CỘT TRÁI: Giao diện Mobile */}
                    <div className={`w-full flex-1 lg:w-[390px] lg:flex-none min-h-0 overflow-y-auto p-4 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 [&::-webkit-scrollbar]:hidden ${mobileTab === "details" ? "block" : "hidden"} lg:block`}>
                        {isLoading || !invoice ? (
                            <div className="flex justify-center items-center h-48 text-primary">
                                <i className="fa-solid fa-spinner animate-spin text-xl"></i>
                            </div>
                        ) : (
                            <>
                                <div ref={receiptMobileRef} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative">

                                    <div className="text-center pb-4">
                                        <h3 className="text-[22px] font-bold text-slate-800">Phòng {invoice.room?.name || "—"}</h3>
                                        <p className="text-[14px] text-slate-500 mt-0.5">{invoice.property?.name || "—"}</p>
                                    </div>

                                    <div className="grid grid-cols-3 border border-slate-200 rounded-xl p-3 text-center bg-white text-[13px] mb-5">
                                        <div>
                                            <span className="text-slate-500 block mb-0.5">Kỳ hóa đơn</span>
                                            <span className="font-medium text-slate-800 block">
                                                {(() => {
                                                    if (!invoice.period_to) return "—";
                                                    const d = new Date(invoice.period_to);
                                                    return `T.${d.getMonth() + 1}, ${d.getFullYear()}`;
                                                })()}
                                            </span>
                                        </div>
                                        <div className="border-x border-slate-200">
                                            <span className="text-slate-500 block mb-0.5">Ngày lập</span>
                                            <span className="font-medium text-slate-800 block">
                                                {invoice.issue_date ? new Date(invoice.period_to).toLocaleDateString("vi-VN") : "—"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block mb-0.5">Hạn nộp</span>
                                            <span className="font-medium text-slate-800 block">
                                                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("vi-VN") : "—"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start text-[14px] border-b border-slate-200 pb-4 mb-4">
                                        <span className="text-slate-600">Khách thuê</span>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-800">{invoice.lease?.tenant?.full_name || "—"}</div>
                                            <div className="text-[13px] text-slate-600 mt-1">SĐT: {invoice.lease?.tenant?.phone || "—"}</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start text-[14px] border-b border-slate-200 pb-4 mb-2">
                                        <div>
                                            <span className="text-slate-600 block mb-1">Trạng thái</span>
                                            <span className="font-bold text-slate-800 block">Thu tiền phòng</span>
                                        </div>
                                        <div className="mt-1">
                                            {Number(invoice.remaining_amount) <= 0 || invoice.status === "paid" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[12px] font-medium border border-green-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Đã thanh toán
                                                </span>
                                            ) : invoice.status === "cancelled" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-[12px] font-medium border border-gray-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Đã hủy
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[12px] font-medium border border-amber-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Còn nợ tiền
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {invoice.items?.map((item) => {
                                            const isUtility = ["electricity", "water"].includes(item.charge_type);
                                            const meter = invoice.meter_readings?.find((m) => m.type === item.charge_type);
                                            const free = parseFloat(item.free_quantity_snapshot) || 0;
                                            const quantity = parseFloat(item.quantity) || 0;
                                            const price = Number(item.unit_price_snapshot) || 0;

                                            let subtitle = null;
                                            let calcBadge = null;

                                            if (item.charge_type === 'room') {
                                                subtitle = `${quantity} ${item.unit}, giá: ${price.toLocaleString()} đ`;
                                            } else if (isUtility && meter) {
                                                subtitle = `Số mới: ${meter.current_reading}, Số cũ: ${meter.previous_reading}`;
                                                if (free > 0) subtitle += ` - Miễn phí: ${free}`;
                                                calcBadge = `${quantity} ${item.unit} x ${price.toLocaleString()}đ`;
                                            } else {
                                                subtitle = quantity > 1 ? `${quantity} ${item.unit} x ${price.toLocaleString()}đ` : null;
                                            }

                                            return (
                                                <div key={item.id} className="py-4 first:pt-2 last:pb-4">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-slate-800 text-[15px]">{item.description}</h4>
                                                            {subtitle && <p className="text-[14px] text-slate-600 mt-1">{subtitle}</p>}
                                                            {calcBadge && (
                                                                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full text-[13px] text-primary font-medium">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                                                                    {calcBadge}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-[13px] text-slate-600 block mb-1">Thành tiền</span>
                                                            <span className="font-bold text-slate-800 text-[15px] block">
                                                                {Number(item.amount).toLocaleString()} đ
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col items-end gap-3 text-[14px]">
                                        <div className="flex items-center justify-between w-full sm:w-[220px]">
                                            <span className="text-slate-600">Tổng cộng</span>
                                            <span className="font-bold text-slate-800">{Number(invoice.total_amount).toLocaleString()} đ</span>
                                        </div>
                                        <div className="flex items-center justify-between w-full sm:w-[220px]">
                                            <span className="text-slate-600">Đã thanh toán</span>
                                            <span className="font-bold text-primary">{Number(invoice.paid_amount).toLocaleString()} đ</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 bg-[#f5fbf7] border border-primary/40 rounded-xl p-4 flex justify-between items-center text-[14px]">
                                        <div>
                                            <span className="text-slate-600 block mb-1">Cần thanh toán</span>
                                        </div>
                                        <div className="text-right">
                                            {Number(invoice.remaining_amount) <= 0 ? (
                                                <span className="font-bold text-primary block text-[15px]">Đã hoàn tất</span>
                                            ) : (
                                                <span className="font-bold text-red-500 block text-[15px]">
                                                    {Number(invoice.remaining_amount).toLocaleString()} đ
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Nút chia sẻ Zalo */}
                                <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={handleShareMobileReceipt}
                                        disabled={!!exportingAction}
                                        className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl text-[14px] font-bold hover:bg-indigo-100 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                        {exportingAction === 'share_mobile_receipt' ? (
                                            <><i className="fa-solid fa-spinner animate-spin text-[15px]"></i> Đang tạo ảnh...</>
                                        ) : (
                                            <><i className="fa-solid fa-receipt text-[15px]"></i> Chia sẻ tóm tắt qua Zalo</>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* CỘT PHẢI: Bản in khổ A5/A4 */}
                    <div className={`flex-1 min-h-0 bg-slate-600 p-3 sm:p-5 flex-col items-center justify-between relative overflow-hidden ${mobileTab === "preview" ? "flex" : "hidden"} lg:flex`}>
                        <div className="w-full max-w-[700px] mb-3 shrink-0 flex gap-2.5 justify-end">
                            <button
                                onClick={handleSharePdfImage}
                                disabled={!!exportingAction || isLoading || !previewHtml}
                                className="px-5 py-2.5 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-[#097340] transition-all flex items-center gap-2 shadow-lg shadow-black/20 disabled:opacity-50"
                            >
                                {exportingAction === 'share_pdf_image' ? (
                                    <><i className="fa-solid fa-spinner animate-spin"></i> Đang tải...</>
                                ) : (
                                    <><i className="fa-solid fa-download"></i> Tải ảnh bản in</>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 w-full max-w-[700px] bg-slate-100 rounded-xl shadow-2xl overflow-auto p-4 sm:p-8 border border-slate-300 border-t-4 border-t-primary/80 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center h-full gap-3 text-slate-500">
                                    <i className="fa-solid fa-circle-notch animate-spin text-3xl text-primary"></i>
                                    <p className="text-[13px] font-medium">Đang tải mẫu in...</p>
                                </div>
                            ) : (
                                <div
                                    ref={invoiceRef}
                                    className="preview-document-content-target bg-white mx-auto shadow-sm"
                                    style={{ width: '700px', minWidth: '700px', padding: '20px' }}
                                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}