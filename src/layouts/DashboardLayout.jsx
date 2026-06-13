import { Outlet, useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import { toast } from "react-toastify";

export default function DashboardLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    toast.info("Đã đăng xuất");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex">
      {/* Sidebar đơn giản */}
      <aside className="w-64 bg-[#111c43] text-white hidden md:flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <span className="text-xl font-bold">Quản lý Nhà trọ</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="p-3 bg-blue-600 rounded-lg cursor-pointer">Dashboard</div>
          <div className="p-3 hover:bg-white/5 rounded-lg cursor-pointer">Thông báo</div>
          <div className="p-3 hover:bg-white/5 rounded-lg cursor-pointer">Hồ sơ</div>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full py-2 text-red-400 hover:text-red-300">
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
           <span className="font-medium text-heading">Hệ thống Quản lý Nhà trọ</span>
           <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{user?.name}</span>
              <div className="w-10 h-10 bg-primary-light text-primary rounded-full flex items-center justify-center font-bold">
                {user?.name?.charAt(0)}
              </div>
           </div>
        </header>
        
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}