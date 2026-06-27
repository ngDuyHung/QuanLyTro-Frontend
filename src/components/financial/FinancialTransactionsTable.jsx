import React from "react";

// --- Helpers UI ---
const formatCurrency = (amount) => {
  return Number(amount).toLocaleString("vi-VN");
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const getDirectionConfig = (direction) => {
  if (direction === "income") {
    return { label: "Thu tiền", className: "text-green-600 bg-green-50 border-green-100", icon: "fa-arrow-down-long" };
  }
  return { label: "Chi tiền", className: "text-red-600 bg-red-50 border-red-100", icon: "fa-arrow-up-long" };
};

const getStatusConfig = (status) => {
  if (status === "cancelled") return { label: "Đã hủy", className: "bg-slate-100 text-slate-400 border-slate-200 line-through" };
  return { label: "Thành công", className: "bg-green-50 text-green-600 border-green-200" };
};

export default function FinancialTransactionsTable({
  transactions = [],
  properties = [],
  pagination,
  page,
  onPageChange,
  isLoading = false,
  propertyId,
  onPropertyIdChange,
  direction,
  onDirectionChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onOpenAddModal,
  onOpenViewModal,
  onOpenCancelModal,
}) {
  return (
    <>
      {/* THANH CÔNG CỤ */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          
          <select
            value={propertyId}
            onChange={(e) => onPropertyIdChange?.(e.target.value)}
            className="flex-1 lg:flex-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none"
          >
            <option value="">Khu nhà: Tất cả</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select
            value={direction}
            onChange={(e) => onDirectionChange?.(e.target.value)}
            className="flex-1 lg:flex-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] outline-none"
          >
            <option value="">Loại: Tất cả</option>
            <option value="income">Dòng tiền thu</option>
            <option value="expense">Dòng tiền chi</option>
          </select>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <input 
              type="date" value={dateFrom} onChange={(e) => onDateFromChange?.(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none"
            />
            <span className="text-slate-400">→</span>
            <input 
              type="date" value={dateTo} onChange={(e) => onDateToChange?.(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none"
            />
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="w-full lg:w-auto bg-brand text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm"
        >
          <i className="fa-solid fa-plus"></i> Tạo phiếu mới
        </button>
      </div>

      <div className="bg-transparent lg:bg-white border-none lg:border lg:border-slate-200 lg:rounded-xl shadow-none lg:shadow-sm overflow-hidden flex flex-col">
        
        {/* --- MOBILE VIEW (CARDS) --- */}
        <div className="lg:hidden flex flex-col gap-3 pb-4">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse"></div>
            ))
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-[13px]">Chưa có dữ liệu thu chi.</div>
          ) : (
            transactions.map((item) => {
              const dir = getDirectionConfig(item.direction);
              const status = getStatusConfig(item.status);
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${dir.className}`}>
                        <i className={`fa-solid ${dir.icon}`}></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-[14px]">{item.transaction_code}</span>
                        <span className="text-[11px] text-slate-500">{formatDate(item.transaction_date)}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${status.className}`}>{status.label}</span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-[13px] text-slate-600 line-clamp-2">{item.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1"><i className="fa-solid fa-house-chimney mr-1"></i>{item.room?.name || "Chi phí chung"} - {item.property?.name}</p>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Số tiền</span>
                        <span className={`text-[17px] font-black ${item.direction === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.direction === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => onOpenViewModal(item)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center"><i className="fa-regular fa-eye"></i></button>
                       {item.status !== 'cancelled' && (
                         <button onClick={() => onOpenCancelModal(item)} className="w-9 h-9 rounded-lg bg-white text-red-400 border border-red-100 flex items-center justify-center"><i className="fa-solid fa-ban"></i></button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* --- DESKTOP VIEW (TABLE) --- */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr className="text-[13px] font-semibold text-slate-600">
                <th className="py-4 px-4">Ngày / Mã</th>
                <th className="py-4 px-4">Loại</th>
                <th className="py-4 px-4">Nội dung / Phòng</th>
                <th className="py-4 px-4 text-right">Số tiền (đ)</th>
                <th className="py-4 px-4 text-center">Trạng thái</th>
                <th className="py-4 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {transactions.map((item) => {
                const dir = getDirectionConfig(item.direction);
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col font-medium">
                        <span className="text-slate-800">{formatDate(item.transaction_date)}</span>
                        <span className="text-[11px] text-slate-400">{item.transaction_code}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 border text-[11px] font-bold rounded-md flex items-center gap-1.5 w-fit ${dir.className}`}>
                        <i className={`fa-solid ${dir.icon} text-[10px]`}></i> {dir.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col max-w-[250px]">
                        <span className="text-slate-700 font-medium truncate">{item.description}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5 italic">{item.room?.name || "Chung"} - {item.property?.name}</span>
                      </div>
                    </td>
                    <td className={`py-4 px-4 text-right font-black text-[15px] ${item.direction === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.direction === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${getStatusConfig(item.status).className}`}>
                        {getStatusConfig(item.status).label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onOpenViewModal(item)} className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-brand transition-colors flex items-center justify-center"><i className="fa-regular fa-eye"></i></button>
                        {item.status !== 'cancelled' && (
                          <button onClick={() => onOpenCancelModal(item)} className="w-8 h-8 rounded border border-slate-200 text-slate-500 hover:text-red-500 transition-colors flex items-center justify-center"><i className="fa-solid fa-ban"></i></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex justify-between items-center">
          <span className="text-[12px] text-slate-500">Trang {page} / {pagination?.last_page || 1}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="w-8 h-8 rounded border border-slate-200 disabled:opacity-50"><i className="fa-solid fa-angle-left"></i></button>
            <button disabled={!pagination?.next_page_url} onClick={() => onPageChange(page + 1)} className="w-8 h-8 rounded border border-slate-200 disabled:opacity-50"><i className="fa-solid fa-angle-right"></i></button>
          </div>
        </div>
      </div>
    </>
  );
}