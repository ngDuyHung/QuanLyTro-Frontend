import React, { useState } from "react";
import BankAccountsTab from "@/components/banks/BankAccountsTab";
import SepayConfigTab from "@/components/banks/SePayConfigTab";
import SepayTransactionsTab from "@/components/banks/SepayTransactionsTab";
// --- CÁC COMPONENT CON TẠM THỜI (SKELETONS) ---
// Chúng ta sẽ tách các component này ra file riêng ở các bước tiếp theo




// --- MAIN PAGE COMPONENT ---
export default function BankSettingsPage() {
    // Quản lý tab hiện tại: 'accounts' | 'sepay_config' | 'sepay_transactions'
    const [activeTab, setActiveTab] = useState("accounts");

    // Cấu hình các mục Tab bao gồm ID, Tiêu đề và Icon tương ứng
    const tabsConfig = [
        {
            id: "accounts",
            label: "Tài khoản ngân hàng",
            icon: "fa-solid fa-building-columns",
        },
        {
            id: "sepay_config",
            label: "Cấu hình tự động SePay",
            icon: "fa-solid fa-gear",
        },
        {
            id: "sepay_transactions",
            label: "Lịch sử giao dịch",
            icon: "fa-solid fa-money-bill-transfer",
        },
    ];

    return (
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 lg:p-6 pt-6 flex flex-col h-full bg-slate-50">

            {/* Tiêu đề trang */}
            <div className="mb-6">
                <h1 className="text-[22px] font-bold text-slate-800">Cấu hình ngân hàng & Thanh toán</h1>
                <p className="text-[13px] text-slate-500 mt-1">
                    Quản lý tài khoản ngân hàng nhận tiền trọ và thiết lập đối soát tự động qua cổng kết nối SePay.
                </p>
            </div>

            {/* Khu vực Tabs Navigation - Hỗ trợ vuốt ngang mượt mà trên Mobile */}
            <div className="shrink-0 bg-white border border-slate-200 border-b-0 rounded-t-xl">
                <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] whitespace-nowrap px-2 md:px-4">
                    {tabsConfig.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-[13px] font-semibold border-b-2 transition-all duration-200 outline-none select-none ${isActive
                                    ? "border-brand text-brand bg-brand/5 sm:bg-transparent"
                                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                                    }`}
                            >
                                <i className={`${tab.icon} text-[14px] ${isActive ? "text-brand" : "text-slate-400"}`}></i>
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Vùng hiển thị nội dung động theo Tab được chọn */}
            <div className="flex-1 min-h-0 flex flex-col">
                {activeTab === "accounts" && <BankAccountsTab />}
                {activeTab === "sepay_config" && <SepayConfigTab />}
                {activeTab === "sepay_transactions" && <SepayTransactionsTab />}
            </div>

        </div>
    );
}