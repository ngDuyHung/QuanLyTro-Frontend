import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import authService from "@/services/authService";
import useAuthStore from "@/stores/authStore";

export default function UserProfileModal({ open, onClose }) {
  const { user, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' hoặc 'security'

  // --- STATE TAB PROFILE ---
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- STATE TAB SECURITY ---
  const [securityForm, setSecurityForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Gán dữ liệu ban đầu
  useEffect(() => {
    if (open && user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
      });
      setSecurityForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      setActiveTab("profile");
    }
  }, [open, user]);

  if (!open) return null;

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await authService.updateProfile(profileForm);
      toast.success(res.data?.message || "Cập nhật hồ sơ thành công!");
      
      // Cập nhật lại store
      if (res.data?.user) {
         setAuth(res.data.user, useAuthStore.getState().token);
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật hồ sơ");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Submit Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (securityForm.new_password !== securityForm.new_password_confirmation) {
      return toast.warning("Xác nhận mật khẩu mới không khớp!");
    }
    
    setIsUpdatingPassword(true);
    try {
      const res = await authService.changePassword(securityForm);
      toast.success(res.data?.message || "Đổi mật khẩu thành công!");
      onClose();
    } catch (error) {
      // Xử lý lỗi validation từ server
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach(err => toast.error(err[0]));
      } else {
        toast.error(error.response?.data?.message || "Lỗi khi đổi mật khẩu");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all">
        <div className="bg-white w-full sm:max-w-[500px] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
            <h2 className="text-[18px] font-bold text-slate-800">Tài khoản của tôi</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <i className="fa-solid fa-xmark text-[16px]"></i>
            </button>
          </div>

          {/* TABS */}
          <div className="flex px-5 pt-4 bg-slate-50 border-b border-slate-200 gap-4">
            <button
              className={`pb-3 px-1 text-[14px] font-semibold border-b-2 transition-colors ${activeTab === 'profile' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('profile')}
            >
              Hồ sơ cá nhân
            </button>
            <button
              className={`pb-3 px-1 text-[14px] font-semibold border-b-2 transition-colors ${activeTab === 'security' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('security')}
            >
              Bảo mật
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 flex-1 min-h-[350px]">
            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="flex flex-col h-full">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{user?.name}</h3>
                      <p className="text-[13px] text-slate-500">Quyền: {user?.role_label || 'Chủ trọ'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Tên hiển thị</label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      required
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Số điện thoại (Đăng nhập)</label>
                    <input
                      type="text"
                      value={user?.phone || ''}
                      disabled
                      className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-[14px] text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email liên hệ</label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      placeholder="Chưa cập nhật"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-brand"
                    />
                  </div>

                  {/* THÔNG TIN LIÊN KẾT ZALO */}
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm"><i className="fa-solid fa-comment-dots"></i></div>
                        <div>
                           <p className="text-[13px] font-semibold text-slate-800">Liên kết Zalo</p>
                           <p className="text-[11px] text-slate-500">{user?.zalo_id ? 'Đã liên kết' : 'Chưa liên kết'}</p>
                        </div>
                     </div>
                     {user?.zalo_id && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Đã xác thực</span>}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full py-2.5 bg-brand text-white rounded-lg font-bold text-[14px] shadow-sm hover:bg-green-700 transition-colors disabled:opacity-70"
                  >
                    {isUpdatingProfile ? "Đang lưu..." : "Lưu thông tin"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <form onSubmit={handleUpdatePassword} className="flex flex-col h-full">
                <div className="flex-1 space-y-4">
                  <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg flex items-start gap-2 mb-2">
                    <i className="fa-solid fa-shield-halved text-orange-500 mt-0.5"></i>
                    <p className="text-[12px] text-orange-800">
                      Mật khẩu phải có độ dài tối thiểu 6 ký tự. Vui lòng ghi nhớ mật khẩu mới để đăng nhập cho lần sau.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      name="current_password"
                      value={securityForm.current_password}
                      onChange={handleSecurityChange}
                      required
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Mật khẩu mới</label>
                    <input
                      type="password"
                      name="new_password"
                      value={securityForm.new_password}
                      onChange={handleSecurityChange}
                      required
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      name="new_password_confirmation"
                      value={securityForm.new_password_confirmation}
                      onChange={handleSecurityChange}
                      required
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-bold text-[14px] shadow-sm hover:bg-slate-900 transition-colors disabled:opacity-70"
                  >
                    {isUpdatingPassword ? "Đang đổi..." : "Cập nhật mật khẩu"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}