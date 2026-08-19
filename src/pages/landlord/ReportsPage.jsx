import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import propertyService from "@/services/propertyService";
import reportService from "@/services/reportService";

import FinancialReportTab from "@/components/reports/FinancialReportTab";
import LedgerReportTab from "@/components/reports/LedgerReportTab";
import OccupancyReportTab from "@/components/reports/OccupancyReportTab";
import DebtReportTab from "@/components/reports/DebtReportTab";

export default function ReportsPage() {
    // --- 1. STATE BỘ LỌC (FILTERS) ---
    const [properties, setProperties] = useState([]);
    const [propertyId, setPropertyId] = useState(""); // "" là Tất cả khu nhà

    // Mặc định: Từ đầu tháng đến hôm nay
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date) => date.toISOString().split('T')[0];

    const [fromDate, setFromDate] = useState(formatDate(firstDay));
    const [toDate, setToDate] = useState(formatDate(today));

    // --- 2. STATE ĐIỀU HƯỚNG TABS & DATA ---
    const [activeTab, setActiveTab] = useState("financial");
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    // --- 3. FETCH DANH SÁCH KHU NHÀ ---
    const fetchProperties = useCallback(async () => {
        try {
            const res = await propertyService.getAll({ per_page: 100 });
            setProperties(res.data?.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách khu nhà.");
        }
    }, []);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    // --- 4. FETCH DỮ LIỆU BÁO CÁO ---
    const fetchReportData = useCallback(async () => {
        setIsLoading(true);
        setReportData(null);
        try {
            const params = {
                property_id: propertyId || undefined,
                from_date: fromDate,
                to_date: toDate,
            };

            let res;
            switch (activeTab) {
                case "financial":
                    res = await reportService.getFinancialReport(params);
                    break;
                case "ledger":
                    res = await reportService.getLedgerReport(params);
                    break;
                case "occupancy":
                    res = await reportService.getOccupancyReport(params);
                    break;
                case "debt":
                    res = await reportService.getDebtReport({ property_id: propertyId || undefined });
                    break;
                default:
                    return;
            }
            setReportData(res.data?.data || res.data);
        } catch (error) {
            console.error("Lỗi lấy báo cáo:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, propertyId, fromDate, toDate]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    // --- 5. HÀM XUẤT EXCEL ---
    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            const params = {
                property_id: propertyId || undefined,
                from_date: fromDate,
                to_date: toDate,
            };
            const response = await reportService.exportLedgerExcel(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            const fDate = fromDate.split("-").reverse().join("");
            const tDate = toDate.split("-").reverse().join("");
            link.setAttribute("download", `SoQuy_${fDate}-${tDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Xuất báo cáo thành công!");
        } catch (error) {
            toast.error("Không thể xuất file lúc này.");
        } finally {
            setIsExporting(false);
        }
    };

    const tabs = [
        { id: "financial", label: "Doanh thu & Chi phí", icon: "fa-chart-pie" },
        { id: "ledger", label: "Sổ quỹ tiền", icon: "fa-book" },
        { id: "occupancy", label: "Vận hành & Khai thác", icon: "fa-house-user" },
        { id: "debt", label: "Công nợ", icon: "fa-file-invoice-dollar" },
    ];

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-3 md:p-6 lg:p-6 pt-5 md:pt-6 flex flex-col h-full bg-slate-50">

            {/* HEADER & TABS ĐIỀU HƯỚNG */}
            <div className="mb-4 md:mb-6">
                {/* Dòng Tiêu đề và Nút chức năng */}
                <div className="flex justify-between items-center mb-4 md:mb-5">
                    <h1 className="text-lg md:text-xl font-bold text-slate-800">Báo cáo & Thống kê</h1>

                    {/* NÚT XUẤT EXCEL - Giao diện tự động thay đổi trên mobile vs desktop */}
                    {activeTab === "ledger" && (
                        <button
                            onClick={handleExportExcel}
                            disabled={isExporting || isLoading}
                            title="Xuất Excel"
                            className="bg-white border border-green-500 text-green-600 h-9 px-3 sm:h-auto sm:w-auto sm:px-4 sm:py-2 rounded-lg text-[13px] font-medium hover:bg-green-50 flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 shrink-0"
                        >
                            {isExporting ? (
                                <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                            ) : (
                                <i className="fa-regular fa-file-excel text-sm md:text-base"></i>
                            )}
                            <span className="block">Xuất Excel</span>
                        </button>

                    )}
                </div>

                {/* Thanh Tabs (Cuộn snap-x mượt mà trên Mobile) */}
                <div className="border-b border-slate-200">
                    <div className="flex overflow-x-auto no-scrollbar gap-4 md:gap-6 snap-x snap-mandatory">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`snap-start shrink-0 pb-2.5 md:pb-3 text-[13px] md:text-[14px] font-medium transition-colors border-b-2 whitespace-nowrap px-1 flex items-center gap-2 -mb-[1px] ${activeTab === tab.id
                                        ? "text-[#0e8b4d] border-[#0e8b4d]"
                                        : "text-slate-500 border-transparent hover:text-slate-800"
                                    }`}
                            >
                                <i className={`fa-solid ${tab.icon}`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* BỘ LỌC (FILTERS) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-5 md:mb-6 flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
                {/* Lọc Khu nhà */}
                <div className="w-full md:w-1/3">
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                        Khu nhà
                    </label>
                    <select
                        value={propertyId}
                        onChange={(e) => setPropertyId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0e8b4d] focus:ring-1 focus:ring-[#0e8b4d]"
                    >
                        <option value="">Tất cả khu nhà</option>
                        {properties.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Lọc Ngày tháng (Đưa về chung 1 hàng trên mobile) */}
                {activeTab !== "debt" && (
                    <div className="w-full md:w-2/3 flex items-center gap-3 md:gap-4">
                        <div className="flex-1 md:w-1/2">
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                                Từ ngày
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0e8b4d] focus:ring-1 focus:ring-[#0e8b4d]"
                            />
                        </div>
                        <div className="flex-1 md:w-1/2">
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                                Đến ngày
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0e8b4d] focus:ring-1 focus:ring-[#0e8b4d]"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* KHU VỰC HIỂN THỊ DỮ LIỆU TƯƠNG ỨNG VỚI TABS */}
            <div className="flex-1 min-h-0 flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <i className="fa-solid fa-spinner fa-spin text-3xl mb-3"></i>
                        <p className="text-[13px]">Đang tổng hợp dữ liệu báo cáo...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === "financial" && <FinancialReportTab data={reportData} />}
                        {activeTab === "ledger" && <LedgerReportTab data={reportData} />}
                        {activeTab === "occupancy" && <OccupancyReportTab data={reportData} />}
                        {activeTab === "debt" && <DebtReportTab data={reportData} />}
                    </>
                )}
            </div>

        </div>
    );
}