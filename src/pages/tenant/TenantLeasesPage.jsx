import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import tenantLeaseService from "@/services/tenantLeaseService";

const formatCurrency = (amount) => Number(amount || 0).toLocaleString("vi-VN");
const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN");
};

export default function TenantLeasesPage() {
    const [leases, setLeases] = useState([]);
    const [selectedLeaseId, setSelectedLeaseId] = useState("");
    
    // Chi tiết hợp đồng đang chọn
    const [leaseDetail, setLeaseDetail] = useState(null);
    const [previewHtml, setPreviewHtml] = useState("");
    
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    
    const [mobileTab, setMobileTab] = useState("details"); // 'details' | 'document'

    // 1. Tải danh sách hợp đồng (chỉ lấy ID, Tên phòng để làm menu chọn)
    useEffect(() => {
        const fetchLeases = async () => {
            setIsLoadingList(true);
            try {
                // Lấy toàn bộ hợp đồng (đang active lên đầu)
                const response = await tenantLeaseService.getAll({ per_page: 100 });
                const data = response.data.data || [];
                setLeases(data);
                
                // Mặc định chọn hợp đồng đầu tiên (mới nhất/đang active)
                if (data.length > 0) {
                    setSelectedLeaseId(data[0].id);
                }
            } catch (error) {
                toast.error("Không thể tải dữ liệu hợp đồng.");
            } finally {
                setIsLoadingList(false);
            }
        };
        fetchLeases();
    }, []);

    // 2. Tải chi tiết và Bản in HTML mỗi khi ID hợp đồng thay đổi
    useEffect(() => {
        if (!selectedLeaseId) {
            setLeaseDetail(null);
            setPreviewHtml("");
            return;
        }

        const fetchDetail = async () => {
            setIsLoadingDetail(true);
            try {
                const [detailRes, htmlRes] = await Promise.all([
                    tenantLeaseService.getById(selectedLeaseId),
                    tenantLeaseService.getPreviewHtml(selectedLeaseId)
                ]);
                setLeaseDetail(detailRes.data.data);
                setPreviewHtml(htmlRes.data.html);
            } catch (error) {
                toast.error("Không thể tải chi tiết hợp đồng.");
            } finally {
                setIsLoadingDetail(false);
            }
        };

        fetchDetail();
    }, [selectedLeaseId]);

    // Trạng thái Loading ban đầu
    if (isLoadingList) {
        return (
            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50 text-brand">
                <i className="fa-solid fa-circle-notch animate-spin text-3xl mb-3"></i>
                <p className="text-[14px] font-medium text-slate-500">Đang đồng bộ dữ liệu hợp đồng...</p>
            </div>
        );
    }

    // Trạng thái Rỗng (Chưa từng thuê phòng nào)
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

    // GIAO DIỆN CHÍNH
    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 flex flex-col h-full bg-slate-50">
            
            {/* Header & Dropdown chuyển đổi hợp đồng (Nếu có nhiều hơn 1) */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-800">Hợp đồng của tôi</h1>
                    <p className="text-[13px] text-slate-500 mt-1">Xem thông tin lưu trú, dịch vụ và văn bản thỏa thuận.</p>
                </div>

                {leases.length > 1 && (
                    <div className="w-full sm:w-auto relative">
                        <select 
                            value={selectedLeaseId} 
                            onChange={(e) => setSelectedLeaseId(e.target.value)}
                            className="w-full sm:w-[250px] pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-brand shadow-sm outline-none focus:border-brand appearance-none cursor-pointer"
                        >
                            {leases.map(l => (
                                <option key={l.id} value={l.id}>
                                    Phòng {l.room?.name} {l.status === 'active' ? '(Đang thuê)' : '(Đã cũ)'}
                                </option>
                            ))}
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
                    </div>
                )}
            </div>

            {/* Khung chứa nội dung chia 2 cột */}
            <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row relative">
                
                {/* Loader khi đang chuyển đổi giữa các hợp đồng */}
                {isLoadingDetail && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <i className="fa-solid fa-spinner animate-spin text-2xl text-brand"></i>
                    </div>
                )}

                {/* Tabs cho Mobile */}
                <div className="flex lg:hidden border-b border-slate-200 bg-slate-50 shrink-0">
                    <button 
                        onClick={() => setMobileTab("details")} 
                        className={`flex-1 py-3 text-[13px] font-bold transition-colors ${mobileTab === "details" ? "bg-white text-brand border-b-2 border-brand" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        <i className="fa-solid fa-list-ul mr-1.5"></i> Tổng quan
                    </button>
                    <button 
                        onClick={() => setMobileTab("document")} 
                        className={`flex-1 py-3 text-[13px] font-bold transition-colors ${mobileTab === "document" ? "bg-white text-brand border-b-2 border-brand" : "text-slate-500 hover:text-slate-700"}`}
                    >
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
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${leaseDetail.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                        {leaseDetail.status === 'active' ? 'Đang hiệu lực' : 'Đã kết thúc'}
                                    </span>
                                </div>
                                <p className="text-[20px] font-black text-slate-800 leading-tight mb-1">{leaseDetail.room?.name}</p>
                                <p className="text-[12px] text-slate-500"><i className="fa-solid fa-location-dot mr-1"></i> {leaseDetail.room?.property?.name}</p>
                            </div>

                            {/* Chi tiết Tài chính & Thời gian */}
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
                                    {/* Đại diện */}
                                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><i className="fa-solid fa-user-tie"></i></div>
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-800 leading-none">{leaseDetail.tenant?.full_name}</p>
                                            <p className="text-[11px] text-slate-500 mt-1">Đại diện hợp đồng • {leaseDetail.tenant?.phone}</p>
                                        </div>
                                    </div>
                                    {/* Thành viên */}
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
                                <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
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
        </div>
    );
}