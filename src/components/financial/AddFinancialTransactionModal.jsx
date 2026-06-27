import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import financialTransactionService from "@/services/financialTransactionService";
import roomService from "@/services/roomService";
import leasesService from "@/services/leasesService";
import bankAccountService from "@/services/bankAccountService"; // Đảm bảo bạn đã có service này

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
  lease_id: "",
  tenant_id: "",
  bank_account_id: "",
  direction: "income",
  category: "other_income",
  accounting_type: "revenue",
  amount: "",
  method: "cash",
  transaction_date: new Date().toISOString().slice(0, 10),
  transfer_content: "",
  bank_transaction_code: "",
  description: "",
  note: "",
};

export default function AddFinancialTransactionModal({ open, onClose, properties = [], onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [rooms, setRooms] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [activeLeases, setActiveLeases] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientError, setClientError] = useState("");

  // Tìm thông tin cấu hình danh mục kế toán hiện tại
  const currentConfig = TRANSACTION_CONFIG[form.direction]?.find(c => c.id === form.category);

  // Khóa cuộn trang nền khi mở Modal
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Reset form & tải danh sách tài khoản ngân hàng của chủ trọ
  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setClientError("");
      
      // Tải danh sách tài khoản ngân hàng phục vụ phương thức chuyển khoản
      bankAccountService.getAll({ per_page: 100 })
        .then(res => setBankAccounts(res.data.data || []))
        .catch(() => console.log("Không thể tải danh sách tài khoản ngân hàng"));
    }
  }, [open]);

  // Kéo danh sách phòng và danh sách hợp đồng hoạt động khi chọn Khu nhà
  useEffect(() => {
    if (!open || !form.property_id) {
      setRooms([]);
      setActiveLeases([]);
      return;
    }
    
    const fetchData = async () => {
      setIsLoadingRooms(true);
      try {
        const [roomsRes, leasesRes] = await Promise.all([
          roomService.getAll({ property_id: form.property_id, per_page: 100 }),
          leasesService.getAll({ property_id: form.property_id, status: "active", per_page: 100 })
        ]);
        setRooms(roomsRes.data.data || []);
        setActiveLeases(leasesRes.data.data || []);
      } catch (error) {
        toast.error("Lỗi tải dữ liệu phòng hoặc hợp đồng của khu nhà.");
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchData();
  }, [open, form.property_id]);

  // Xử lý logic tự động liên kết lease_id và tenant_id khi chủ trọ chọn một phòng cụ thể
  const handleRoomChange = (e) => {
    const selectedRoomId = e.target.value;
    
    if (!selectedRoomId) {
      setForm(prev => ({ ...prev, room_id: "", lease_id: "", tenant_id: "" }));
      return;
    }

    // Tìm hợp đồng active tương ứng với phòng này
    const matchedLease = activeLeases.find(l => Number(l.room_id) === Number(selectedRoomId));

    setForm(prev => ({
      ...prev,
      room_id: selectedRoomId,
      lease_id: matchedLease ? matchedLease.id : "",
      tenant_id: matchedLease ? (matchedLease.tenant_id || matchedLease.tenant?.id) : ""
    }));
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleDirectionChange = (direction) => {
    const defaultCategory = direction === "income" ? "other_income" : "other_expense";
    const defaultAccType = direction === "income" ? "revenue" : "expense";
    
    setForm(prev => ({
      ...prev,
      direction,
      category: defaultCategory,
      accounting_type: defaultAccType
    }));
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    const matchedConfig = TRANSACTION_CONFIG[form.direction].find(c => c.id === selectedCategory);
    
    setForm(prev => ({
      ...prev,
      category: selectedCategory,
      accounting_type: matchedConfig ? matchedConfig.accType : prev.accounting_type
    }));
  };

  const handleSubmit = async () => {
    setClientError("");
    if (!form.property_id) return setClientError("Vui lòng chọn Khu nhà phát sinh.");
    if (!form.amount || form.amount <= 0) return setClientError("Số tiền giao dịch phải lớn hơn 0.");
    if (form.method === "bank_transfer" && !form.bank_account_id) {
      return setClientError("Vui lòng chọn tài khoản ngân hàng thực hiện giao dịch.");
    }

    // Format lại các trường dữ liệu trống thành null để gửi lên Backend hợp lệ
    const payload = {
      ...form,
      room_id: form.room_id || null,
      lease_id: form.lease_id || null,
      tenant_id: form.tenant_id || null,
      bank_account_id: form.method === "bank_transfer" ? (form.bank_account_id || null) : null,
      transfer_content: form.method === "bank_transfer" ? (form.transfer_content || null) : null,
      bank_transaction_code: form.method === "bank_transfer" ? (form.bank_transaction_code || null) : null,
      description: form.description || null,
      note: form.note || null,
    };

    try {
      setIsSubmitting(true);
      await financialTransactionService.create(payload);
      toast.success("Đã lập phiếu thu/chi thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      setClientError(error.response?.data?.message || "Có lỗi xảy ra từ hệ thống backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lấy thông tin hiển thị của khách thuê đang ở phòng được chọn (nếu có)
  const currentLeaseInfo = activeLeases.find(l => Number(l.room_id) === Number(form.room_id));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
      <div className="bg-slate-50 w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-[750px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${form.direction === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <i className={`fa-solid ${form.direction === 'income' ? 'fa-arrow-down-long' : 'fa-arrow-up-long'} text-[16px]`}></i>
            </div>
            <div>
              <h2 className="text-[17px] sm:text-[18px] font-bold text-slate-800">
                {form.direction === 'income' ? 'Lập Phiếu Thu Quỹ' : 'Lập Phiếu Chi Quỹ'}
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">Ghi nhận biến động dòng tiền thủ công vào sổ quỹ.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body Form */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5 space-y-4">
          
          {/* Segmented Control Chuyển đổi Thu / Chi */}
          <div className="flex bg-slate-200/70 p-1 rounded-xl">
            <button 
              type="button"
              onClick={() => handleDirectionChange("income")}
              className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${form.direction === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              PHIẾU THU (TIỀN VÀO)
            </button>
            <button 
              type="button"
              onClick={() => handleDirectionChange("expense")}
              className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${form.direction === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              PHIẾU CHI (TIỀN RA)
            </button>
          </div>

          {clientError && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[13px] flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation shrink-0"></i> {clientError}
            </div>
          )}

          {/* KHỐI 1: ĐỐI TƯỢNG PHÁT SINH */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-1">1. Khu nhà & Đối tượng liên quan</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Khu nhà trọ <span className="text-red-500">*</span></label>
                <select value={form.property_id} onChange={handleChange("property_id")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand cursor-pointer">
                  <option value="">Chọn khu nhà</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Phòng trọ (Nếu thuộc phòng)</label>
                <select value={form.room_id} onChange={handleRoomChange} disabled={!form.property_id || isLoadingRooms} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand disabled:opacity-60 cursor-pointer">
                  <option value="">{isLoadingRooms ? "Đang tải phòng..." : "Chọn phòng phát sinh"}</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* Thông báo tự động map khách thuê giúp chủ trọ kiểm tra trực quan */}
            {form.room_id && currentLeaseInfo && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-[12px] text-blue-700 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                <i className="fa-solid fa-user-check text-[13px]"></i>
                <span>Gắn liên kết khách hàng: <strong>{currentLeaseInfo.tenant?.full_name}</strong> (Hợp đồng #{currentLeaseInfo.id})</span>
              </div>
            )}
          </div>

          {/* KHỐI 2: ĐỊNH KHOẢN KẾ TOÁN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Nghiệp vụ {form.direction === 'income' ? 'Thu' : 'Chi'} <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={handleCategoryChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand cursor-pointer mb-3">
                {TRANSACTION_CONFIG[form.direction].map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>

              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Bản chất kế toán (Hệ thống tự khóa)</label>
              <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[12px] text-slate-500 cursor-not-allowed font-medium flex items-center gap-2">
                <i className="fa-solid fa-lock text-[10px]"></i> {currentConfig?.accLabel}
              </div>
            </div>

            {/* KHỐI 3: GIÁ TRỊ & THỜI GIAN */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Số tiền phát sinh (đ) <span className="text-red-500">*</span></label>
                <input type="number" value={form.amount} onChange={handleChange("amount")} placeholder="Nhập số tiền thực tế" className={`w-full px-3 py-2 border rounded-lg text-[16px] font-bold outline-none focus:border-brand ${form.direction === 'income' ? 'bg-green-50/40 border-green-200 text-green-700' : 'bg-red-50/40 border-red-200 text-red-700'}`} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Phương thức</label>
                  <select value={form.method} onChange={handleChange("method")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand cursor-pointer">
                    <option value="cash">Tiền mặt</option>
                    <option value="bank_transfer">Chuyển khoản</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Ngày lập phiếu</label>
                  <input type="date" value={form.transaction_date} onChange={handleChange("transaction_date")} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 4: THÔNG TIN CHUYỂN KHOẢN NGÂN HÀNG (CHỈ HIỆN KHI CHỌN PHƯƠNG THỨC BANK_TRANSFER) */}
          {form.method === "bank_transfer" && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 animate-[fadeIn_0.2s_ease-out]">
              <h4 className="text-[13px] font-bold text-amber-600 uppercase tracking-wider mb-1"><i className="fa-solid fa-building-columns mr-1"></i> 2. Chi tiết dòng tiền ngân hàng</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Tài khoản thụ tiến <span className="text-red-500">*</span></label>
                  <select value={form.bank_account_id} onChange={handleChange("bank_account_id")} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand cursor-pointer">
                    <option value="">-- Chọn tài khoản --</option>
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.bank_code} - {b.account_number}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Mã giao dịch (FT/Ref)</label>
                  <input type="text" value={form.bank_transaction_code} onChange={handleChange("bank_transaction_code")} placeholder="Mã tham chiếu ngân hàng" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Nội dung chuyển khoản</label>
                  <input type="text" value={form.transfer_content} onChange={handleChange("transfer_content")} placeholder="Nội dung trên sao kê" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
                </div>
              </div>
            </div>
          )}

          {/* KHỐI 5: DIỄN GIẢI & GHI CHÚ NỘI BỘ */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Nội dung hiển thị phiếu (Mô tả)</label>
              <input type="text" value={form.description} onChange={handleChange("description")} placeholder="VD: Hoàn trả tiền cọc phòng 202 cho chị Linh..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Ghi chú kế toán nội bộ (Không in ra)</label>
              <textarea value={form.note} onChange={handleChange("note")} placeholder="Nhập thêm ghi chú chi tiết nếu có..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-brand min-h-[70px] resize-none"></textarea>
            </div>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="border-t border-slate-200 px-5 py-3.5 bg-white shrink-0 flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-70">
            Hủy bỏ
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className={`px-6 py-2.5 text-white rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-70 ${form.direction === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
          >
            {isSubmitting ? (
               <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Đang hạch toán...</>
            ) : (
               <><i className="fa-solid fa-floppy-disk"></i> Lưu {form.direction === 'income' ? 'Phiếu Thu' : 'Phiếu Chi'}</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}