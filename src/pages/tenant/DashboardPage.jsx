import useAuthStore from "../../stores/authStore";

export default function TenantDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-heading">Chào bạn, {user?.name}!</h1>
      <p className="text-body mt-2">Xem thông tin hợp đồng và hóa đơn cần thanh toán.</p>
    </div>
  );
}