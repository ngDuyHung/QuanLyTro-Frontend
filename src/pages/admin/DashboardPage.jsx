import useAuthStore from "../../stores/authStore";

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-heading">Chào Admin, {user?.name}!</h1>
      <p className="text-body mt-2">Đây là trang quản trị hệ thống toàn bộ RentHub.</p>
      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700">
        Tính năng: Duyệt chủ trọ, quản lý người dùng, xem log hệ thống.
      </div>
    </div>
  );
}