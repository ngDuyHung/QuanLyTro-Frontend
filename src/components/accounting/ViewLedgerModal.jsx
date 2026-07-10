import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import accountingLedgerService from "@/services/accountingLedgerService";
import settingService from "@/services/settingService";

const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("vi-VN") + " đ";
};

export default function ViewLedgerModal({ open, ledger, onClose }) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (open && ledger) {
            fetchDetail();
        }
    }, [open, ledger]);

    const fetchDetail = async () => {
        try {
            setIsLoading(true);
            const res = await accountingLedgerService.getById(ledger.id);
            setData(res.data.data);
        } catch (error) {
            toast.error("Không thể tải chi tiết sổ kế toán.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPdf = async () => {
        try {
            setIsExporting(true);
            const blob = await settingService.exportLedgerPdf(ledger.id);
            const url = window.URL.createObjectURL(new Blob([blob.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `So_Ke_Toan_${ledger.period_year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Không thể xuất file PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    if (!open || !ledger) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:max-w-[800px] rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-[17px] font-bold text-slate-800">Chi tiết sổ kế toán</h2>
                        <p className="text-[12px] text-slate-500">
                            {ledger.period_type === 'month' ? `Tháng ${ledger.period_month}` : 'Năm'} / {ledger.period_year}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <i className="fa-solid fa-spinner animate-spin text-brand text-2xl"></i>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 text-[12px] font-bold text-slate-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Ngày</th>
                                        <th className="px-4 py-3">Diễn giải</th>
                                        <th className="px-4 py-3 text-right">Số tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data?.details?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-[13px]">{item.transaction_date}</td>
                                            <td className="px-4 py-3 text-[13px] text-slate-700">{item.description}</td>
                                            <td className="px-4 py-3 text-[13px] font-semibold text-right">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                    <tr>
                                        <td colSpan="2" className="px-4 py-3 text-[13px] text-right">TỔNG CỘNG:</td>
                                        <td className="px-4 py-3 text-[14px] text-brand text-right">{formatCurrency(ledger.total_revenue)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0 bg-white">
                    <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200">
                        Đóng
                    </button>
                    <button onClick={handleExportPdf} disabled={isExporting} className="px-6 py-2.5 bg-brand text-white rounded-lg text-[13px] font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-brand/20">
                        {isExporting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-file-pdf"></i>}
                        Xuất PDF S1a-HKD
                    </button>
                </div>
            </div>
        </div>
    );
}