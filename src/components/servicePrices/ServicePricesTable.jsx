import React from "react";

// Hàm helper map Icon và màu sắc tương ứng cho từng loại dịch vụ trọ
const getServiceConfig = (type) => {
    switch (type) {
        case "electricity":
            return { label: "Tiền điện", icon: "fa-bolt", color: "text-amber-500 bg-amber-50 border-amber-200" };
        case "water":
            return { label: "Tiền nước", icon: "fa-droplet", color: "text-blue-500 bg-blue-50 border-blue-200" };
        case "internet":
            return { label: "Internet / Wifi", icon: "fa-wifi", color: "text-indigo-500 bg-indigo-50 border-indigo-200" };
        case "garbage":
            return { label: "Tiền rác", icon: "fa-trash-can", color: "text-emerald-500 bg-emerald-50 border-emerald-200" };
        default:
            return { label: "Khác", icon: "fa-gears", color: "text-slate-500 bg-slate-50 border-slate-200" };
    }
};

export default function ServicePricesTable({
    prices = [],
    properties = [],
    pagination,
    page,
    onPageChange,
    isLoading,
    propertyId,
    onPropertyIdChange,
    onOpenAddModal,
    onDeletePrice,
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
            
            {/* Thanh công cụ lọc & Nút thêm mới */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="text-[13px] font-semibold text-slate-500 mr-1">Phạm vi áp dụng:</div>
                    <select
                        value={propertyId}
                        onChange={(e) => onPropertyIdChange(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 focus:outline-none focus:border-brand min-w-[200px]"
                    >
                        <option value="">Mặc định toàn hệ thống</option>
                        {properties.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={onOpenAddModal}
                    className="w-full sm:w-auto px-4 py-2 bg-brand hover:bg-green-700 text-white font-semibold rounded-xl sm:rounded-lg text-[13px] flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition-colors"
                >
                    <i className="fa-solid fa-plus text-[12px]"></i>
                    Thiết lập đơn giá mới
                </button>
            </div>

            {/* Vùng hiển thị dữ liệu bảng */}
            <div className="flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[12px] font-bold uppercase tracking-wider">
                            <th className="px-5 py-3.5">Loại dịch vụ</th>
                            <th className="px-5 py-3.5">Đơn giá định mức</th>
                            <th className="px-5 py-3.5">Miễn phí ban đầu</th>
                            <th className="px-5 py-3.5">Ngày hiệu lực</th>
                            <th className="px-5 py-3.5">Ghi chú</th>
                            <th className="px-5 py-3.5 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700 font-medium">
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="text-center py-12 text-slate-400">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></span>
                                        Đang đồng bộ bảng giá...
                                    </div>
                                </td>
                            </tr>
                        ) : prices.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-12 text-slate-400">
                                    Chưa có cấu hình giá riêng cho phạm vi này. Hệ thống sẽ tự động dùng giá mặc định.
                                </td>
                            </tr>
                        ) : (
                            prices.map((price) => {
                                const config = getServiceConfig(price.service_type);
                                return (
                                    <tr key={price.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-[12px] font-bold ${config.color}`}>
                                                <i className={`fa-solid ${config.icon}`}></i>
                                                {price.service_type_label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-900 font-bold">
                                            {price.unit_price.toLocaleString()} đ
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500">
                                            {price.free_units > 0 
                                                ? `${price.free_units} (${price.free_unit_type_label})` 
                                                : "Không có"}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">
                                            {price.effective_date || "---"}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-400 font-normal max-w-[200px] truncate">
                                            {price.note || "---"}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {price.property_id && (
                                                    <button
                                                        onClick={() => onDeletePrice(price.id)}
                                                        className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                                                        title="Xóa giá cấu hình riêng"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-[14px]"></i>
                                                    </button>
                                                )}
                                                {!price.property_id && (
                                                    <span className="text-[11px] text-slate-400 font-normal italic">Hệ thống gốc</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang hệ thống */}
            {pagination && pagination.total_pages > 1 && (
                <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <span className="text-[12px] text-slate-500 font-medium">
                        Hiển thị trang {page} / {pagination.total_pages} (Tổng cộng {pagination.total} bản ghi)
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={page === 1}
                            onClick={() => onPageChange(page - 1)}
                            className="w-8 h-8 rounded flex items-center justify-center text-slate-400 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            <i className="fa-solid fa-angle-left text-[12px]"></i>
                        </button>
                        <button className="w-8 h-8 rounded flex items-center justify-center bg-brand text-white font-bold text-[13px]">
                            {page}
                        </button>
                        <button
                            disabled={page === pagination.total_pages}
                            onClick={() => onPageChange(page + 1)}
                            className="w-8 h-8 rounded flex items-center justify-center text-slate-400 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            <i className="fa-solid fa-angle-right text-[12px]"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}