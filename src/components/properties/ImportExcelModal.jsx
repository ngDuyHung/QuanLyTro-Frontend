// src/components/properties/ImportExcelModal.jsx
import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import importService from "@/services/importService";

export default function ImportExcelModal({ open, onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [importReport, setImportReport] = useState(null); // State lưu báo cáo lỗi

  if (!open) return null;

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const response = await importService.downloadTemplate();
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Mau_Nhap_Lieu_Khu_Nha.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Tải file mẫu thành công!");
    } catch (error) {
      toast.error("Không thể tải file mẫu. Vui lòng thử lại.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    event.target.value = null; // Reset
    setImportReport(null);     // Xóa báo cáo lỗi cũ khi upload file mới

    // Validate Frontend
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error("Vui lòng chọn file đúng định dạng Excel (.xlsx, .xls, .csv)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dung lượng file không được vượt quá 10MB");
      return;
    }

    try {
      setIsUploading(true);
      const response = await importService.importMasterData(file);
      
      // Nếu thành công 100%
      const report = response.data?.data || {};
      toast.success(`Nhập dữ liệu thành công ${report.success_count || 0} dòng!`);
      
      onSuccess(); 
      setTimeout(() => onClose(), 1000); 
    } catch (error) {
      // Bắt lỗi 422/400 từ Backend trả về chứa danh sách failed
      const responseData = error.response?.data;
      
      if (responseData && responseData.data && responseData.data.failed_count > 0) {
        // Lưu data lỗi vào state để hiển thị UI
        setImportReport(responseData.data);
        toast.warning(`Có ${responseData.data.failed_count} dòng dữ liệu bị lỗi!`);
      } else {
        // Lỗi hệ thống khác
        toast.error(responseData?.message || "Lỗi hệ thống khi import dữ liệu.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={!isUploading && !isDownloading ? onClose : undefined}
      ></div>

      {/* Modal Content - Tăng max-w-4xl cho PC */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-[16px] font-bold text-slate-800">Nhập dữ liệu khu nhà (Excel)</h3>
          <button
            onClick={onClose}
            disabled={isUploading || isDownloading}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Body - Chia 2 cột trên md (PC) */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* CỘT TRÁI: Hướng dẫn & Tải mẫu */}
          <div className="p-6 md:border-r border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-[12px] font-bold">1</span>
              <h4 className="font-bold text-slate-700">Chuẩn bị file dữ liệu</h4>
            </div>
            
            <p className="text-[13px] text-slate-600 mb-6 leading-relaxed">
              Vui lòng tải xuống file Excel mẫu của hệ thống. Bạn cần điền đầy đủ và chính xác thông tin Khu nhà, Phòng và Khách thuê theo đúng cấu trúc cột đã được định dạng sẵn.
            </p>

            <button
              onClick={handleDownloadTemplate}
              disabled={isUploading || isDownloading}
              className="flex items-center gap-4 w-full p-4 rounded-xl border border-green-200 bg-white hover:border-green-400 hover:shadow-md transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xl group-hover:bg-green-100 transition-colors">
                {isDownloading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-download"></i>}
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-800 group-hover:text-green-700">Tải xuống file mẫu</h4>
                <p className="text-[12px] text-slate-500 mt-0.5">Định dạng chuẩn (.xlsx)</p>
              </div>
            </button>
          </div>

          {/* CỘT PHẢI: Upload & Hiển thị lỗi */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-[12px] font-bold">2</span>
              <h4 className="font-bold text-slate-700">Tải lên hệ thống</h4>
            </div>

            <button
              onClick={handleTriggerUpload}
              disabled={isUploading || isDownloading}
              className="flex items-center gap-4 w-full p-4 rounded-xl border border-dashed border-brand bg-brand/5 hover:bg-brand/10 hover:border-brand-dark transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-white text-brand shadow-sm flex items-center justify-center text-xl transition-colors">
                {isUploading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-brand group-hover:text-brand-dark">Chọn file để tải lên</h4>
                <p className="text-[12px] text-slate-500 mt-0.5">Kéo thả hoặc click (Max: 10MB)</p>
              </div>
            </button>

            {/* HIỂN THỊ DANH SÁCH LỖI NẾU CÓ */}
            {importReport && importReport.failed_count > 0 && (
              <div className="mt-5 border border-red-200 rounded-xl overflow-hidden flex flex-col max-h-[220px]">
                <div className="bg-red-50 px-4 py-2.5 border-b border-red-200 flex justify-between items-center shrink-0">
                  <span className="text-[13px] font-bold text-red-600">
                    <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
                    Đã phát hiện {importReport.failed_count} lỗi
                  </span>
                  <span className="text-[12px] text-green-600 font-semibold">
                    Thành công: {importReport.success_count || 0}
                  </span>
                </div>
                
                <div className="p-4 bg-white overflow-y-auto no-scrollbar">
                  <ul className="space-y-3">
                    {importReport.errors.map((err, idx) => (
                      <li key={idx} className="text-[13px] text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                        <span className="font-bold text-red-500 mr-2">Dòng {err.row}:</span>
                        {err.messages.map((msg, i) => (
                          <span key={i} className="block mt-0.5 text-[12.5px] leading-relaxed text-slate-600">- {msg}</span>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
            />
          </div>
        </div>

      </div>
    </div>
  );
}