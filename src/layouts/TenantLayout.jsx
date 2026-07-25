import { Outlet, Link } from "react-router-dom";
import useAuthStore from "@/stores/authStore";

export default function TenantLayout() {
  const logout = useAuthStore((state) => state.clearAuth); // Giả sử bạn có hàm clearAuth trong store

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar bên trái */}
      <aside style={{ width: "250px", borderRight: "1px solid #ccc", padding: "16px" }}>
        <h3>Menu Người Thuê</h3>
        <nav style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
          <Link to="/tenant/dashboard">Trang chủ</Link>
          <Link to="/tenant/invoices">Hóa đơn</Link>
          <Link to="/tenant/utilities">Điện nước</Link>
          <Link to="/tenant/contracts">Hợp đồng</Link>
          <Link to="/tenant/incidents">Yêu cầu sửa chữa</Link>
          <Link to="/tenant/notifications">Thông báo</Link>
          <Link to="/tenant/payment-history">Lịch sử thanh toán</Link>
          <Link to="/tenant/account">Tài khoản</Link>
        </nav>
        
        <button 
          onClick={logout} 
          style={{ marginTop: "30px", color: "red", cursor: "pointer" }}
        >
          Đăng xuất
        </button>
      </aside>

      {/* Nội dung chính bên phải */}
      <main style={{ flex: 1, padding: "24px" }}>
        {/* Outlet sẽ render các component con (Dashboard, Invoices,...) dựa vào URL */}
        <Outlet /> 
      </main>
    </div>
  );
}