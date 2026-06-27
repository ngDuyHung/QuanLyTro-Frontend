import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import financialTransactionService from "@/services/financialTransactionService";
import roomService from "@/services/roomService";

// --- CẤU HÌNH LIÊN KẾT DANH MỤC & BẢN CHẤT KẾ TOÁN ---
const TRANSACTION_CONFIG = {
  income: [
    { id: "holding_deposit", label: "Thu cọc giữ chỗ", accType: "liability_in", accLabel: "Nhận cọc (Tăng nợ phải trả)" },
    { id: "security_deposit", label: "Thu cọc thế chân", accType: "liability_in", accLabel: "Nhận cọc (Tăng nợ phải trả)" },
    { id: "deposit_forfeit", label: "Tịch thu tiền cọc", accType: "revenue", accLabel: "Doanh thu" },
    { id: "damage_fee", label: "Phí đền bù hư hại", accType: "revenue", accLabel: "Doanh thu" },
    { id: "other_income", label: "Thu nhập khác", accType: "revenue", accLabel: "Doanh thu" },
  ],
  expense: [
    { id: "refund_security_deposit", label: "Hoàn trả cọc thế chân", accType: "liability_out", accLabel: "Hoàn cọc (Giảm nợ phải trả)" },
    { id: "repair", label: "Chi sửa chữa vật chất", accType: "expense", accLabel: "Chi phí" },
    { id: "operation", label: "Chi phí vận hành", accType: "expense", accLabel: "Chi phí" },
    { id: "other_expense", label: "Chi phí khác", accType: "expense", accLabel: "Chi phí" },
  ]
};

const initialForm = {
  property_id: "",
  room_id: "",
  direction: "income",
  category: "other_income",
  accounting_type: "revenue",
  amount: "",
  method: "cash",
  transaction_date: new Date().toISOString().slice(0, 10),
  description: "",
};

export default function AddFinancialTransactionModal({ open, onClose, properties = [], onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientError, setClientError] = useState("");

  // Tự động tìm config hiện tại để hiển thị Label cho Accounting Type
  const currentConfig = TRANSACTION_CONFIG[form.direction]?.find(c => c.id === form.category);

  // Khóa cuộn trang khi mở Modal
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Reset form khi mở
  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setClientError("");
    }
  }, [open]);

  // Kéo danh sách phòng khi chọn Khu nhà
  useEffect(() => {
    if (!open || !form.property_id) {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      try {
        const res = await roomService.getAll({ property_id: form.property_id, per_page: 100 });
        setRooms(res.data.data || []);
      } catch (error) {
        toast.error("Lỗi tải danh sách phòng.");
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [open, form.property_id]);

  // Xử lý thay đổi input thông thường
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Logic đặc biệt: Đổi Thu/Chi sẽ reset lại Danh mục (Category)
  const handleDirectionChange = (direction) => {
    const defaultCategory = direction === "income" ? "other_income" : "other_expense";
    const defaultAccType = direction === "income" ? "revenue" : "expense";
    
    setForm((prev) => ({
      ...prev,
      direction,
      category: defaultCategory,
      accounting_type: defaultAccType
    }));
  };

  // Logic đặc biệt: Đổi Category sẽ tự động map đúng Accounting Type
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    const matchedConfig = TRANSACTION_CONFIG[form.direction].find(c => c.id === selectedCategory);
    
    setForm((prev) => ({
      ...prev,
      category: selectedCategory,
      accounting_type: matchedConfig ? matchedConfig.accType : prev.accounting_type
    }));
  };

  const handleSubmit = async () => {
    setClientError("");
    if (!form.property_id) return setClientError("Vui lòng chọn Khu nhà.");
    if (!form.amount || form.amount <= 0) return setClientError("Số tiền phải lớn hơn 0.");

    try {
      setIsSubmitting(true);
      await financialTransactionService.create(form);
      toast.success("Đã tạo phiếu thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      setClientError(error.response?.data?.message || "Có lỗi xảy ra khi tạo phiếu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
      <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[700px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${form.direction === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <i className={`fa-solid ${form.direction === 'income' ? 'fa-arrow-down-long' : 'fa-arrow-up-long'} text-[16px]`}></i>
            </div>
            <div>
              <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-800">
                {form.direction === 'income' ? 'Lập Phiếu Thu' : 'Lập Phiếu Chi'}
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5 hidden sm:block">Ghi nhận dòng tiền vào/ra ngoài hệ thống hóa đơn.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body (Form Scrollable) */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5">
          
          {/* Nút Tab chuyển đổi Thu / Chi (Giao diện Segmented Control) */}
          <div className="flex bg-slate-200/70 p-1 rounded-xl mb-6">
            <button 
              onClick={() => handleDirectionChange("income")}
              className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${form.direction === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              DÒNG TIỀN THU
            </button>
            <button 
              onClick={() => handleDirectionChange("expense")}
              className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${form.direction === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              DÒNG TIỀN CHI
            </button>
          </div>

          {clientError && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i> {clientError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Cột 1: Thông tin đối tượng */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Khu nhà phát sinh <span className="text-red-500">*</span></label>
                <select value={form.property_id} onChange={handleChange("property_id")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand cursor-pointer">
                  <option value="">Chọn khu nhà</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Phòng (Tùy chọn)</label>
                <select value={form.room_id} onChange={handleChange("room_id")} disabled={!form.property_id || isLoadingRooms} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand disabled:opacity-60 cursor-pointer">
                  <option value="">{isLoadingRooms ? "Đang tải..." : "Chọn phòng liên quan"}</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* Cột 2: Phân loại kế toán */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
               <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Danh mục {form.direction === 'income' ? 'Thu' : 'Chi'} <span className="text-red-500">*</span></label>
               <select value={form.category} onChange={handleCategoryChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand cursor-pointer mb-4">
                 {TRANSACTION_CONFIG[form.direction].map(item => (
                   <option key={item.id} value={item.id}>{item.label}</option>
                 ))}
               </select>

               <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Bản chất kế toán (Tự động)</label>
               <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[13px] text-slate-600 cursor-not-allowed font-medium flex items-center gap-2">
                 <i className="fa-solid fa-lock text-[10px] text-slate-400"></i> {currentConfig?.accLabel}
               </div>
            </div>

            {/* Cột 3: Số tiền & Phương thức */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
               <div>
                 <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Số tiền (VNĐ) <span className="text-red-500">*</span></label>
                 <input type="number" value={form.amount} onChange={handleChange("amount")} placeholder="VD: 500000" className={`w-full px-3 py-2 border rounded-lg text-[15px] font-bold outline-none focus:border-brand ${form.direction === 'income' ? 'bg-green-50/50 border-green-200 text-green-700' : 'bg-red-50/50 border-red-200 text-red-700'}`} />
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Phương thức</label>
                   <select value={form.method} onChange={handleChange("method")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand">
                     <option value="cash">Tiền mặt</option>
                     <option value="bank_transfer">Chuyển khoản</option>
                     <option value="other">Khác</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Ngày GD</label>
                   <input type="date" value={form.transaction_date} onChange={handleChange("transaction_date")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
                 </div>
               </div>
            </div>

            {/* Nội dung diễn giải */}
            <div className="sm:col-span-2 bg-white p-4 rounded-xl border border-slate-200">
               <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Nội dung diễn giải</label>
               <input type="text" value={form.description} onChange={handleChange("description")} placeholder="VD: Khách phòng 102 chuyển khoản tiền cọc giữ chỗ..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
            </div>

          </div>
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-slate-200 px-5 py-4 bg-white shrink-0 flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200 disabled:opacity-70 transition-colors">
            Hủy bỏ
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className={`px-6 py-2.5 text-white rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-70 transition-colors shadow-sm ${form.direction === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}
          >
            {isSubmitting ? (
               <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang lưu...</>
            ) : (
               <><i className="fa-solid fa-floppy-disk"></i> Lưu {form.direction === 'income' ? 'Phiếu Thu' : 'Phiếu Chi'}</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}