import React, { useState } from "react";
import PushConfigTab from "@/components/settings/PushConfigTab";


export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("push"); // 'push' hoặc 'sepay'

    const tabClasses = (tab) =>
        `px-4 sm:px-5 py-3 text-[13px] sm:text-[14px] transition-colors border-b-2 -mb-[1px] whitespace-nowrap cursor-pointer ${activeTab === tab
            ? "font-bold text-brand border-brand"
            : "font-medium text-slate-500 hover:text-slate-800 border-transparent"
        }`;

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 lg:p-6 lg:pt-4 flex flex-col h-full bg-slate-50">

            {/* Header */}
            <div className="mb-4 lg:mb-5">
                <h1 className="text-[22px] font-bold text-slate-800">Cài đặt hệ thống </h1>
                <p className="text-[13px] text-slate-500 mt-1">Cấu hình thông báo.</p>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200">
                <button className={tabClasses("push")} onClick={() => setActiveTab("push")}>
                    <i className="fa-regular fa-bell mr-1.5"></i> Thông báo Push
                </button>
                {/* <button className={tabClasses("sepay")} onClick={() => setActiveTab("sepay")}>
                    <i className="fa-solid fa-money-bill-transfer mr-1.5"></i> Đang update...
                </button> */}
                {/* Sau này bạn nhúng tab mẫu hợp đồng, mẫu hóa đơn vào đây */}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 flex flex-col mt-4 lg:mt-0">
                {activeTab === "push" && <PushConfigTab />}
          
            </div>

        </div>
    );
}