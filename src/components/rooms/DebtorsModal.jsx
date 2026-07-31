import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import roomService from "@/services/roomService";

const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
};

export default function DebtorsModal({ open, onClose, propertyId }) {
  const [debtors, setDebtors] = useState([]);
  const [summary, setSummary] = useState({ total_overdue_amount: 0, total_bad_tenants: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDebtors();
    } else {
      setDebtors([]);
      setSummary({ total_overdue_amount: 0, total_bad_tenants: 0 });
    }
  }, [open, propertyId]);

  const fetchDebtors = async () => {
    try {
      setIsLoading(true);
      const response = await roomService.getDebtors({ property_id: propertyId || undefined });
      if (response.data.success) {
        setDebtors(response.data.data);
        setSummary(response.data.summary);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách khách nợ.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-red-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-inner shadow-red-200">
              <i className="fa-solid fa-user-ninja text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Danh sách Khách hay nợ</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Chỉ hiển thị khách hay nợ, trả trễ từ 2 lần trở lên.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar bg-slate-50/30">
          {/* <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-users-slash text-xl"></i>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Số khách vi phạm</p>
                <p className="text-2xl font-bold text-slate-800">{summary.total_bad_tenants} <span className="text-[14px] font-medium text-slate-500 normal-case">người</span></p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm shadow-red-50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-sack-dollar text-xl"></i>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-red-400 uppercase tracking-wider mb-1">Tổng tiền ĐÃ QUÁ HẠN</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_overdue_amount)}</p>
              </div>
            </div>
          </div> */}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[12px] text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-[35%]">Khách thuê</th>
                    <th className="py-3.5 px-4 w-[40%]">Chi tiết vi phạm</th>
                    <th className="py-3.5 px-4 text-right w-[25%]">Đang nợ (Tổng)</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] align-top">
                  {isLoading ? (
                    <tr>
                      <td colSpan="3" className="py-10 text-center text-slate-400">
                        <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>Đang phân tích dữ liệu...</p>
                      </td>
                    </tr>
                  ) : debtors.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-14 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                          <i className="fa-solid fa-shield-heart text-3xl"></i>
                        </div>
                        <p className="font-bold text-slate-700 text-lg">Khu trọ an toàn!</p>
                        <p className="text-slate-500 mt-1">Không có khách nào trả trễ hay nợ quá hạn.</p>
                      </td>
                    </tr>
                  ) : (
                    debtors.map((debtor) => (
                      <tr key={debtor.room_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800 text-[14px]">{debtor.tenant_name}</p>
                          <p className="text-[12px] text-slate-500 mt-1 flex items-center gap-1.5">
                            <i className="fa-solid fa-door-open text-slate-400"></i> {debtor.room_name} 
                            <span className="text-slate-300">|</span> 
                            <i className="fa-solid fa-phone text-slate-400"></i> {debtor.tenant_phone}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <ul className="space-y-2">
                            {debtor.violation_details.map((detail, idx) => {
                              const isOverdueNow = detail.includes('Đang nợ');
                              return (
                                <li key={idx} className="flex items-start gap-2 text-[12px]">
                                  <i className={`mt-0.5 text-[11px] ${isOverdueNow ? 'fa-solid fa-circle-exclamation text-red-500' : 'fa-solid fa-clock-rotate-left text-amber-500'}`}></i>
                                  <span className={isOverdueNow ? 'font-semibold text-red-600' : 'text-slate-600'}>
                                    {detail}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {debtor.total_unpaid_amount > 0 ? (
                             <div className="flex flex-col items-end">
                               <span className="text-[15px] font-bold text-red-600">{formatCurrency(debtor.total_unpaid_amount)}</span>
                               {debtor.current_overdue_amount > 0 && (
                                  <span className="text-[11px] text-slate-500 mt-0.5 border-t border-slate-200 pt-0.5 inline-block">
                                    Quá hạn: <span className="text-red-500 font-semibold">{formatCurrency(debtor.current_overdue_amount)}</span>
                                  </span>
                               )}
                             </div>
                          ) : (
                            <span className="text-emerald-500 font-semibold text-[13px] bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">Không nợ</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-[14px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95">
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}