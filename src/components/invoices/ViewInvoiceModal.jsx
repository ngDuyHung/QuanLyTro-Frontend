import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import invoiceService from "@/services/invoiceService";
import settingService from "@/services/settingService";
import { toBlob } from "html-to-image";

export default function ViewInvoiceModal({ open, invoice: initialInvoice, onClose, onOpenPaymentModal }) {
    const [invoice, setInvoice] = useState(null);
    const [previewHtml, setPreviewHtml] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [exportingAction, setExportingAction] = useState(null); // null, 'download_pdf', 'share_pdf', 'share_image', 'share_pdf_image'
    // Khai báo ref để đánh dấu vùng giao diện thô cần chụp ảnh
    const invoiceRef = useRef(null);
    const receiptMobileRef = useRef(null);
    // Thêm state này để quản lý Tab trên Mobile
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
            // Thay vì gọi getTemplate, gọi API preview HTML mới tạo
            const [invoiceRes, previewRes] = await Promise.all([
                invoiceService.getById(id),
                invoiceService.getPreviewHtml(id) // <--- Thêm hàm gọi API này vào invoiceService
            ]);
            console.log("Chi tiết hóa đơn:", invoiceRes.data.data);
            console.log("Mẫu HTML hóa đơn:", previewRes.data.html);
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
        setExportingAction('download_pdf');
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
            setExportingAction(null);
        }
    };

    // 2. HÀM CHỈ MỞ BẢNG CHIA SẺ (ZALO, MESSENGER...)
    const handleSharePdf = async () => {
        setExportingAction('share_pdf');
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
            setExportingAction(null);
        }
    };




    // 3. HÀM CHIA SẺ ẢNH BẢN IN (PDF STYLE) QUA ZALO
    // const handleSharePdfImage = async () => {
    //     setExportingAction('share_pdf_image');
    //     try {
    //         const response = await invoiceService.exportPdfImage(invoice.id);
    //         const blob = new Blob([response.data], { type: 'image/png' });

    //         const fileName = `Ban_in_Hoa_don_${invoice?.invoice_code}.png`;
    //         const file = new File([blob], fileName, { type: "image/png" });

    //         if (navigator.canShare && navigator.canShare({ files: [file] })) {
    //             try {
    //                 await navigator.share({
    //                     title: `Hóa đơn phòng ${invoice?.room?.name}`,
    //                     text: `Gửi bạn bản in hóa đơn phòng ${invoice?.room?.name}.`,
    //                     files: [file],
    //                 });
    //                 toast.success("Đã mở bảng chia sẻ thành công!");
    //             } catch (shareError) {
    //                 // Bỏ qua lỗi nếu người dùng chủ động tắt bảng chia sẻ
    //                 if (shareError.name !== 'AbortError') {
    //                     toast.error("Lỗi khi mở bảng chia sẻ hệ thống.");
    //                     console.error("Lỗi chia sẻ:", shareError);
    //                 }
    //             }
    //         } else {
    //             const url = window.URL.createObjectURL(blob);
    //             const link = document.createElement("a");
    //             link.href = url;
    //             link.download = fileName;
    //             link.click();
    //             window.URL.revokeObjectURL(url);
    //             toast.warning("Đã tải ảnh bản in xuống máy.");
    //         }
    //     } catch (error) {
    //         console.error("Lỗi tải ảnh PDF:", error);
    //         toast.error("Có lỗi xảy ra khi tạo ảnh bản in.");
    //     } finally {
    //         setExportingAction(null);
    //     }
    // };

    const handleSharePdfImage = async () => {
        setExportingAction('share_pdf_image');
        try {
            if (!invoiceRef.current) return;

            // Chụp trực tiếp giao diện đang hiển thị thành file ảnh (cực nhanh)
            const blob = await toBlob(invoiceRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#ffffff' // <--- ÉP NỀN TRẮNG TẠI ĐÂY
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
                // Tải xuống nếu không share được
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


    // 4. HÀM CHIA SẺ BIÊN LAI ĐIỆN TỬ (GIAO DIỆN MOBILE)
    const handleShareMobileReceipt = async () => {
        setExportingAction('share_mobile_receipt');
        try {
            if (!receiptMobileRef.current) return;

            // Chụp vùng giao diện cột trái. 
            // Tiêm thêm style nền xám và padding để biên lai bo góc lọt thỏm giữa tấm ảnh cho đẹp mắt
            const blob = await toBlob(receiptMobileRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#f8fafc', // Màu nền xám nhạt Tailwind (slate-50)
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
                // Tải xuống nếu dùng trên máy tính hoặc không hỗ trợ share
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Lỗi tạo ảnh biên lai mobile:", error);
            toast.error("Có lỗi xảy ra khi tạo ảnh biên lai.");
        } finally {
            setExportingAction(null);
        }
    };

    if (!open) return null;

    return (
        <>
            <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all" onClick={onClose}>
                <div
                    className="bg-slate-100 w-full max-w-6xl h-[95vh] sm:h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]"
                    onClick={(e) => e.stopPropagation()}
                >
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

                    {/* Thanh Tabs trên Mobile (Ẩn trên màn hình Desktop) */}
                    <div className="flex lg:hidden border-b border-slate-200 bg-white shrink-0">
                        <button
                            onClick={() => setMobileTab("details")}
                            className={`flex-1 py-3 text-[14px] font-semibold text-center border-b-2 transition-colors ${mobileTab === "details"
                                ? "border-brand text-brand"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            <i className="fa-solid fa-list-ul mr-2"></i> Chi tiết
                        </button>
                        <button
                            onClick={() => setMobileTab("preview")}
                            className={`flex-1 py-3 text-[14px] font-semibold text-center border-b-2 transition-colors ${mobileTab === "preview"
                                ? "border-brand text-brand"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            <i className="fa-solid fa-file-pdf mr-2"></i> Bản in PDF
                        </button>
                    </div>

                    {/* Split view body */}
                    <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

                        {/* CỘT TRÁI: Giao diện thiết kế chuẩn phong cách App Mobile di động */}
                        <div className={`w-full flex-1 lg:w-[390px] lg:flex-none min-h-0 overflow-y-auto p-3 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 [&::-webkit-scrollbar]:hidden ${mobileTab === "details" ? "block" : "hidden"} lg:block`}>
                            {isLoading || !invoice ? (
                                <div className="flex justify-center items-center h-48 text-brand">
                                    <i className="fa-solid fa-spinner animate-spin text-xl"></i>
                                </div>
                            ) : (
                                <>
                                    <div ref={receiptMobileRef} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative">

                                        {/* 1. Tiêu đề Phòng & Tên khu trọ */}
                                        <div className="text-center pb-4">
                                            <h3 className="text-[22px] font-bold text-slate-800"><i className="fa-solid fa-home mr-2"></i> {invoice.room?.name || "—"}</h3>
                                            <p className="text-[14px] text-slate-500 mt-0.5">{invoice.property?.name || "—"}</p>
                                        </div>

                                        {/* 2. Khối thông tin Kỳ hạn, Ngày lập, Hạn nộp chia 3 cột */}
                                        <div className="grid grid-cols-3 border border-slate-200 rounded-xl p-3 text-center bg-white text-[13px] mb-5">
                                            <div>
                                                <span className="text-slate-500 block mb-0.5">Hóa đơn tháng</span>
                                                <span className="font-medium text-slate-800 block">
                                                    {(() => {
                                                        if (!invoice.period_from) return "—";
                                                        const d = new Date(invoice.period_from);
                                                        return `T.${d.getMonth() + 1}, ${d.getFullYear()}`;
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="border-x border-slate-200">
                                                <span className="text-slate-500 block mb-0.5">Ngày lập</span>
                                                <span className="font-medium text-slate-800 block">
                                                    {invoice.issue_date ? new Date(invoice.period_from).toLocaleDateString("vi-VN") : "—"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block mb-0.5">Đến ngày</span>
                                                <span className="font-medium text-slate-800 block">
                                                    {invoice.due_date ? new Date(invoice.period_to).toLocaleDateString("vi-VN") : "—"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 3. Khối Kính gửi khách hàng */}
                                        <div className="flex justify-between items-start text-[14px] border-b border-slate-200 pb-4 mb-4">
                                            <span className="text-slate-600">Kính gửi</span>
                                            <div className="text-right">
                                                {/* Ưu tiên Snapshot trước, nếu trống (hóa đơn cũ trước khi nâng cấp) thì lấy Relation */}
                                                <div className="font-bold text-slate-800">
                                                    {invoice.tenant_name_snapshot || invoice.lease?.tenant?.full_name || "—"}
                                                </div>
                                                <div className="text-[13px] text-slate-600 mt-1">
                                                    SĐT: {invoice.tenant_phone_snapshot || invoice.lease?.tenant?.phone || "—"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. Khối Lý do thu & Badge trạng thái thu tiền */}
                                        <div className="flex justify-between items-start text-[14px] border-b border-slate-200 pb-4 mb-2">
                                            <div>
                                                <span className="text-slate-600 block mb-1">Lý do thu</span>
                                                <span className="font-bold text-slate-800 block">
                                                    {invoice.invoice_type === "monthly" ? "Thu tiền hàng tháng" : "Thu chi phát sinh"}
                                                </span>
                                            </div>
                                            <div className="mt-1">
                                                {Number(invoice.remaining_amount) <= 0 || invoice.status === "paid" ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-slate-700 rounded-full text-[12px] font-medium border border-green-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Đã thu xong
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-slate-700 rounded-full text-[12px] font-medium border border-amber-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> {invoice.status_label || "Chưa thu đủ"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 5. Vùng Danh sách các khoản tiền chi tiết */}
                                        <div className="divide-y divide-slate-100">
                                            {invoice.items?.map((item) => {
                                                const isUtility = ["electricity", "water"].includes(item.charge_type);
                                                const meter = invoice.meter_readings?.find((m) => m.type === item.charge_type);
                                                const free = parseFloat(item.free_quantity_snapshot) || 0;
                                                const quantity = parseFloat(item.quantity) || 0;
                                                const price = Number(item.unit_price_snapshot) || 0;

                                                let subtitle = null;
                                                let calcBadge = null;

                                                // Xử lý text phụ và badge theo đúng mockup
                                                if (item.charge_type === 'room') {
                                                    subtitle = `${quantity} ${item.unit}, giá: ${price.toLocaleString()} đ`;
                                                } else if (isUtility && meter) {
                                                    subtitle = `Mới: ${meter.current_reading}, Cũ: ${meter.previous_reading}`;
                                                    if (free > 0) subtitle += ` - Miễn phí: ${free}`;
                                                    calcBadge = `${quantity} ${item.unit} x ${price.toLocaleString()}đ`;
                                                } else if (item.charge_type === 'deposit') {
                                                    subtitle = "Hoàn trả khi trả phòng nếu không phát sinh nợ/hư hỏng";
                                                } else {
                                                    subtitle = quantity > 1 ? `${quantity} ${item.unit} x ${price.toLocaleString()}đ` : null;
                                                }

                                                return (
                                                    <div key={item.id} className="py-4 first:pt-2 last:pb-4">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-slate-800 text-[15px]">{item.description}</h4>

                                                                {subtitle && (
                                                                    <p className="text-[14px] text-slate-600 mt-1">
                                                                        {subtitle}
                                                                    </p>
                                                                )}

                                                                {calcBadge && (
                                                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50/80 rounded-full text-[13px] text-slate-700">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-300"></span>
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

                                        {/* 6. Khối tóm tắt dòng tiền (Căn sát lề phải giống mẫu) */}
                                        <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col items-end gap-3 text-[14px]">
                                            <div className="flex items-center justify-between w-full ">
                                                <span className="text-slate-600">Tổng tiền dịch vụ</span>
                                                <span className="font-bold text-slate-800">{Number(invoice.total_amount).toLocaleString()} đ</span>
                                            </div>
                                            <div className="flex items-center justify-between w-full ">
                                                <span className="text-slate-600">Đã trả</span>
                                                <span className="font-bold text-green-600">{Number(invoice.paid_amount).toLocaleString()} đ</span>
                                            </div>
                                        </div>

                                        {/* 7. Hộp bo góc nổi bật cuối biên lai */}
                                        <div className="mt-6 bg-[#f5fbf7] border border-green-500 rounded-xl p-4 flex justify-between items-center text-[14px]">
                                            <div>
                                                <span className="text-slate-600 block mb-1">Số lần thanh toán</span>
                                                <span className="font-bold text-slate-800 block">{invoice.allocations?.length || 0} lần</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-slate-600 block mb-1">Tổng phải trả</span>
                                                {Number(invoice.remaining_amount) <= 0 ? (
                                                    <span className="font-bold text-green-600 block text-[15px]">Đã trả xong</span>
                                                ) : (
                                                    <span className="font-bold text-green-600 block text-[15px]">
                                                        {Number(invoice.remaining_amount).toLocaleString()} đ
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 8. Lời chú ý cuối trang */}
                                        <p className="mt-5 text-[14px] text-slate-800">
                                            <strong>* Chú ý:</strong> Vui lòng thanh toán đúng hạn và trước ngày {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("vi-VN") : "—"}
                                        </p>
                                    </div>

                                    {/* HỘP NÚT BẤM CHỨC NĂNG (NẰM NGOÀI VÙNG CHỤP ẢNH ĐỂ KHÔNG BỊ PHÁT SINH TRONG BIÊN LAI) */}
                                    <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col gap-2">

                                        {/* NÚT MỚI THÊM: CHIA SẺ BIÊN LAI ĐIỆN TỬ */}
                                        <button
                                            type="button"
                                            onClick={handleShareMobileReceipt}
                                            disabled={!!exportingAction}
                                            className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl text-[14px] font-bold hover:bg-indigo-100 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                        >
                                            {exportingAction === 'share_mobile_receipt' ? (
                                                <><i className="fa-solid fa-spinner animate-spin text-[15px]"></i> Đang tạo ảnh...</>
                                            ) : (
                                                <><i className="fa-solid fa-receipt text-[15px]"></i> Chia sẻ Biên lai điện tử</>
                                            )}
                                        </button>

                                        {/* Nút Thu Tiền Nhanh liên kết động từ trang quản lý chính (GIỮ NGUYÊN) */}
                                        {["issued", "partially_paid", "overdue"].includes(invoice.status) && Number(invoice.remaining_amount) > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => onOpenPaymentModal(invoice)}
                                                className="w-full py-3 bg-brand text-white rounded-xl text-[14px] font-bold hover:bg-green-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                <i className="fa-solid fa-sack-dollar text-[15px]"></i> Ghi nhận Thu tiền nhanh
                                            </button>
                                        )}

                                    </div>
                                </>
                            )}
                        </div>

                        {/* CỘT PHẢI: Màn hình xem trước bản in thực tế (Live Print Preview A5/A4 Sheet) */}
                        <div className={`flex-1 min-h-0 bg-slate-600 p-3 sm:p-5 flex-col items-center justify-between relative overflow-hidden ${mobileTab === "preview" ? "flex" : "hidden"} lg:flex`}>

                            {/* Thanh công cụ hành động nhanh đặt phía trên tờ giấy in */}
                            <div className="w-full max-w-[700px] mb-3 shrink-0 flex gap-2.5 justify-end">
                                <button
                                    onClick={handleSharePdf}
                                    disabled={!!exportingAction || isLoading || !previewHtml}
                                    className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    title="Gửi qua Zalo, Messenger..."
                                >
                                    {exportingAction === 'share_pdf' ? (
                                        <><i className="fa-solid fa-spinner animate-spin"></i> Đang tải...</>
                                    ) : (
                                        <><i className="fa-solid fa-share-nodes"></i> Chia sẻ tệp</>
                                    )}
                                </button>

                                <button
                                    onClick={handleSharePdfImage}
                                    disabled={!!exportingAction || isLoading || !previewHtml}
                                    className="px-3 sm:px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[13px] font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    title="Chụp ảnh tờ biên lai này và gửi"
                                >
                                    {exportingAction === 'share_pdf_image' ? (
                                        <><i className="fa-solid fa-spinner animate-spin"></i> Đang tạo ảnh...</>
                                    ) : (
                                        <><i className="fa-solid fa-image"></i> Gửi Ảnh Bản In</>
                                    )}
                                </button>

                                <button
                                    onClick={handleDownloadPdf}
                                    disabled={!!exportingAction || isLoading || !previewHtml}
                                    className="px-5 py-2.5 bg-brand text-white rounded-lg text-[13px] font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-black/20 disabled:opacity-50"
                                >
                                    {exportingAction === 'download_pdf' ? (
                                        <><i className="fa-solid fa-spinner animate-spin"></i> Đang tải...</>
                                    ) : (
                                        <><i className="fa-solid fa-download"></i> Tải PDF</>
                                    )}
                                </button>
                            </div>

                            {/* Vùng mô phỏng khổ giấy in thực tế */}
                            {/* Đổi overflow-y-auto thành overflow-auto để hỗ trợ cuộn ngang trên mobile */}
                            <div className="flex-1 w-full max-w-[700px] bg-slate-100 rounded-xl shadow-2xl overflow-auto p-4 sm:p-8 border border-slate-300 border-t-4 border-t-brand/80 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                                {isLoading ? (
                                    <div className="flex flex-col justify-center items-center h-full gap-3 text-slate-500">
                                        <i className="fa-solid fa-circle-notch animate-spin text-3xl text-brand"></i>
                                        <p className="text-[13px] font-medium">Đang đồng bộ mẫu phiếu...</p>
                                    </div>
                                ) : (
                                    // Ép cứng width 700px tại đây để form không bao giờ bị bóp méo
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
        </>
    );
}