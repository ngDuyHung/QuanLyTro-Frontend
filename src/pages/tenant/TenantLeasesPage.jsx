import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantLeaseService from "@/services/tenantLeaseService";
import useTenantStore from "@/stores/tenantStore";

const formatCurrency = (amount) => Number(amount || 0).toLocaleString("vi-VN");
const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN");
};

export default function TenantLeasesPage() {

    // LẤY ID HỢP ĐỒNG ĐANG CHỌN TỪ STORE TOÀN CỤC
    // LẤY ĐẦY ĐỦ CÁC BIẾN TỪ STORE TOÀN CỤC
    const { currentLeaseId, leases, setLeases, setCurrentLeaseId } = useTenantStore();

    // Chi tiết hợp đồng đang chọn
    const [leaseDetail, setLeaseDetail] = useState(null);
    const [previewHtml, setPreviewHtml] = useState("");


    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    const [mobileTab, setMobileTab] = useState("details"); // 'details' | 'document'

    // State cho chức năng Đăng ký trả phòng
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [checkoutDate, setCheckoutDate] = useState("");
    const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

    // STATE QUẢN LÝ LOADING CHO NÚT TẢI PDF
    const [isExporting, setIsExporting] = useState(false);


    // 3. TẢI CHI TIẾT & BẢN IN HTML MỖI KHI ĐỔI PHÒNG TRÊN HEADER
    useEffect(() => {
        if (!currentLeaseId) {
            setLeaseDetail(null);
            setPreviewHtml("");
            return;
        }

        const fetchDetail = async () => {
            setIsLoadingDetail(true);
            try {
                const [detailRes, htmlRes] = await Promise.all([
                    tenantLeaseService.getById(currentLeaseId),
                    tenantLeaseService.getPreviewHtml(currentLeaseId)
                ]);
                setLeaseDetail(detailRes.data?.data || detailRes.data);
                setPreviewHtml(htmlRes.data?.html || htmlRes.data);
            } catch (error) {
                toast.error("Không thể tải chi tiết hợp đồng.");
            } finally {
                setIsLoadingDetail(false);
            }
        };

        fetchDetail();
    }, [currentLeaseId]);


    // HÀM XỬ LÝ TẢI PDF 
    const handleDownloadPdf = async () => {
        setIsExporting(true);
        try {
            const response = await tenantLeaseService.exportPdf(currentLeaseId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const fileName = `Hop_dong_phong_${leaseDetail?.room?.name || currentLeaseId}.pdf`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Đã tải xuống hợp đồng PDF thành công.");
        } catch (error) {
            toast.error("Có lỗi xảy ra khi kết xuất tệp PDF. Vui lòng thử lại sau.");
        } finally {
            setIsExporting(false);
        }
    };

    // Tính toán cảnh báo 10 ngày
    const getCheckoutWarning = () => {
        if (!checkoutDate) return null;
        const selected = new Date(checkoutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = selected - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { type: 'error', msg: 'Không thể chọn ngày trong quá khứ.' };
        if (diffDays < 10) return { type: 'warning', msg: `Bạn báo trước ${diffDays} ngày. Theo quy định cần báo trước ít nhất 10 ngày, bạn có thể bị mất cọc.` };
        return { type: 'success', msg: 'Ngày trả phòng hợp lệ theo quy định hợp đồng.' };
    };

    // Xử lý submit đăng ký
    const handleRegisterCheckout = async (e) => {
        e.preventDefault();
        const warning = getCheckoutWarning();
        if (warning?.type === 'error') {
            toast.error(warning.msg);
            return;
        }

        setIsSubmittingCheckout(true);
        try {
            await tenantLeaseService.registerCheckout(currentLeaseId, { move_out_date: checkoutDate }); // Sửa thành currentLeaseId
            toast.success("Đăng ký trả phòng thành công!");
            setIsCheckoutModalOpen(false);

            // Cập nhật State cục bộ không cần load lại API
            setLeaseDetail(prev => ({ ...prev, move_out_notice_date: checkoutDate }));
            // Sửa thành currentLeaseId để cập nhật cái tag "(Sắp trả phòng)" trên Header
            setLeases(leases.map(l => l.id === currentLeaseId ? { ...l, move_out_notice_date: checkoutDate } : l));
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi đăng ký trả phòng.");
        } finally {
            setIsSubmittingCheckout(false);
        }
    };


    if (leases.length === 0) {
        return (
            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50">
                <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-300 mb-4">
                    <i className="fa-solid fa-file-contract text-3xl"></i>
                </div>
                <h2 className="text-[18px] font-bold text-slate-700 mb-1">Không có dữ liệu</h2>
                <p className="text-[13px] text-slate-500">Bạn chưa có hợp đồng thuê phòng nào trong hệ thống.</p>
            </div>
        );
    }

    const warningStatus = getCheckoutWarning();

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 flex flex-col h-full bg-slate-50 relative">

            {/* Header & Dropdown */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Hợp đồng của tôi</h1>
                    <p className="text-[13px] text-slate-500 mt-1">Xem thông tin lưu trú, dịch vụ và văn bản thỏa thuận.</p>
                </div>

               
            </div>

            <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row relative">

                {isLoadingDetail && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <i className="fa-solid fa-spinner animate-spin text-2xl text-brand"></i>
                    </div>
                )}

                <div className="flex lg:hidden border-b border-slate-200 bg-slate-50 shrink-0">
                    <button onClick={() => setMobileTab("details")} className={`flex-1 py-3 text-[13px] font-bold transition-colors ${mobileTab === "details" ? "bg-white text-brand border-b-2 border-brand" : "text-slate-500 hover:text-slate-700"}`}>
                        <i className="fa-solid fa-list-ul mr-1.5"></i> Tổng quan
                    </button>
                    <button onClick={() => setMobileTab("document")} className={`flex-1 py-3 text-[13px] font-bold transition-colors ${mobileTab === "document" ? "bg-white text-brand border-b-2 border-brand" : "text-slate-500 hover:text-slate-700"}`}>
                        <i className="fa-solid fa-file-signature mr-1.5"></i> Văn bản
                    </button>
                </div>

                {/* CỘT TRÁI: THÔNG TIN TỔNG QUAN */}
                <div className={`w-full lg:w-[380px] lg:flex-none flex-col bg-white border-r border-slate-100 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${mobileTab === "details" ? "flex" : "hidden"} lg:flex overflow-y-auto`}>
                    {leaseDetail && (
                        <div className="p-5 space-y-6">

                            {/* Card Tóm tắt Trạng thái */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${leaseDetail.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</span>
                                    <div className="flex gap-2">
                                        {leaseDetail.move_out_notice_date && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                                Sắp trả phòng
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${leaseDetail.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {leaseDetail.status === 'active' ? 'Đang hiệu lực' : 'Đã kết thúc'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[20px] font-black text-slate-800 leading-tight mb-1">{leaseDetail.room?.name}</p>
                                <p className="text-[12px] text-slate-500"><i className="fa-solid fa-location-dot mr-1"></i> {leaseDetail.room?.property?.name}</p>
                            </div>

                            {/* Section Đăng ký trả phòng */}
                            {leaseDetail.status === 'active' && (
                                <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                    <div>
                                        <h3 className="text-[13px] font-bold text-slate-800"><i className="fa-solid fa-person-walking-luggage mr-1.5 text-orange-500"></i> Đăng ký trả phòng</h3>
                                        <p className="text-[11px] text-slate-500 mt-1">Thông báo rời đi trước 10 ngày theo hợp đồng.</p>
                                    </div>

                                    {leaseDetail.move_out_notice_date ? (
                                        <div className="bg-white p-3 rounded-lg border border-orange-100 text-[13px]">
                                            <span className="text-slate-500 block mb-1">Ngày dự kiến rời đi:</span>
                                            <strong className="text-orange-600 text-[15px]">{formatDate(leaseDetail.move_out_notice_date)}</strong>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsCheckoutModalOpen(true)}
                                            className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[13px] font-bold transition-colors shadow-sm"
                                        >
                                            Đăng ký rời đi
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Chi tiết Tài chính */}
                            <div>
                                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><i className="fa-solid fa-wallet"></i> Thông tin cơ bản</h3>
                                <div className="space-y-3 text-[13px] bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                                    <div className="flex justify-between items-center"><span className="text-slate-500">Giá thuê phòng:</span> <strong className="text-slate-800">{formatCurrency(leaseDetail.room_price)} đ/tháng</strong></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-500">Tiền thế chân:</span> <strong className="text-slate-800">{formatCurrency(leaseDetail.deposit)} đ</strong></div>
                                    <div className="w-full h-px bg-slate-50"></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-500">Ngày bắt đầu:</span> <strong className="text-slate-800">{formatDate(leaseDetail.start_date)}</strong></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-500">Ngày chốt tiền:</span> <strong className="text-slate-800">Ngày {leaseDetail.billing_day} hàng tháng</strong></div>
                                </div>
                            </div>

                            {/* Dịch vụ đang sử dụng */}
                            <div>
                                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><i className="fa-solid fa-boxes-packing"></i> Dịch vụ đăng ký</h3>
                                <div className="space-y-2">
                                    {leaseDetail.service_items?.length > 0 ? leaseDetail.service_items.map(srv => (
                                        <div key={srv.id} className="flex justify-between items-center bg-slate-50 px-3.5 py-2.5 rounded-lg border border-slate-100 text-[13px]">
                                            <span className="text-slate-700 font-medium flex items-center gap-2">
                                                <i className="fa-solid fa-check text-green-500"></i> {srv.service_type_label}
                                            </span>
                                            <span className="font-bold text-brand">{srv.custom_price ? `${formatCurrency(srv.custom_price)} đ` : 'Giá niêm yết'}</span>
                                        </div>
                                    )) : <p className="text-[12px] text-slate-400 italic p-3 bg-slate-50 rounded-lg text-center">Không đăng ký dịch vụ kèm theo.</p>}
                                </div>
                            </div>

                            {/* Cư dân lưu trú */}
                            <div>
                                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><i className="fa-solid fa-users"></i> Danh sách thành viên</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><i className="fa-solid fa-user-tie"></i></div>
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-800 leading-none">{leaseDetail.tenant?.full_name}</p>
                                            <p className="text-[11px] text-slate-500 mt-1">Đại diện hợp đồng • {leaseDetail.tenant?.phone}</p>
                                        </div>
                                    </div>
                                    {leaseDetail.members?.map(m => (
                                        <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><i className="fa-solid fa-user"></i></div>
                                            <div>
                                                <p className="text-[13px] font-bold text-slate-800 leading-none">{m.full_name}</p>
                                                <p className="text-[11px] text-slate-500 mt-1">{m.relationship_label} • {m.phone}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: BẢN IN HỢP ĐỒNG */}
                <div className={`flex-1 bg-slate-200/50 p-2 sm:p-5 flex-col items-center overflow-auto ${mobileTab === "document" ? "flex" : "hidden"} lg:flex`}>
                    <div className="w-full max-w-[800px] bg-white rounded-xl shadow-md p-4 sm:p-10 min-h-full border border-slate-200 relative">
                        {previewHtml ? (
                            <>
                                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
                                    {/* NÚT TẢI PDF MỚI THÊM */}
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={isExporting}
                                        className="w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 bg-brand text-white hover:bg-green-700 rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                                        title="Tải PDF"
                                    >
                                        {isExporting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-download"></i>}
                                        <span className="hidden sm:inline">{isExporting ? 'Đang tải...' : 'Tải PDF'}</span>
                                    </button>

                                    {/* NÚT IN BẢN CỨNG CŨ */}
                                    <button
                                        onClick={() => window.print()}
                                        className="w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 bg-slate-100 text-slate-600 hover:text-brand hover:bg-green-50 border border-slate-200 rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5"
                                        title="In hợp đồng"
                                    >
                                        <i className="fa-solid fa-print"></i> <span className="hidden sm:inline">In bản cứng</span>
                                    </button>
                                </div>
                                <div className="preview-document-content-target text-black mt-6 sm:mt-0" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                            </>
                        ) : (
                            <div className="flex flex-col justify-center items-center h-full text-slate-400">
                                <i className="fa-solid fa-file-signature text-4xl mb-3 text-slate-200"></i>
                                <p className="text-[13px]">Bản in hợp đồng chưa sẵn sàng.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* MODAL ĐĂNG KÝ TRẢ PHÒNG */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-[16px] font-bold text-slate-800">Đăng ký trả phòng</h3>
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleRegisterCheckout} className="p-5 space-y-4">
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Ngày dự kiến rời đi</label>
                                <input
                                    type="date"
                                    required
                                    value={checkoutDate}
                                    onChange={(e) => setCheckoutDate(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl text-[14px] focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-shadow"
                                />
                            </div>

                            {/* Cảnh báo Realtime */}
                            {warningStatus && (
                                <div className={`p-3 rounded-lg text-[13px] flex items-start gap-2 border ${warningStatus.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                    warningStatus.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                                        'bg-green-50 border-green-200 text-green-700'
                                    }`}>
                                    <i className={`fa-solid mt-0.5 ${warningStatus.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
                                    <span>{warningStatus.msg}</span>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsCheckoutModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
                                    Hủy bỏ
                                </button>
                                <button type="submit" disabled={isSubmittingCheckout || warningStatus?.type === 'error'} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                                    {isSubmittingCheckout ? 'Đang xử lý...' : 'Xác nhận trả phòng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}