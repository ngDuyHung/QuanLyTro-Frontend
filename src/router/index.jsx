import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import AuthLayout from "@/layouts/AuthLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import LandlordLayout from "@/layouts/LandlordLayout";
import LandlordDashboard from "@/pages/landlord/DashboardPage";
import PropertiesPage from "@/pages/landlord/PropertiesPage";
import RoomsPage from "@/pages/landlord/RoomsPage";
import TenantsPage from "@/pages/landlord/TenantsPage";
import LeasesPage from "@/pages/landlord/LeasesPage";
import UtilitiesPage from "@/pages/landlord/UtilitiesPage";
// Component bảo vệ Route: Chỉ cho vào nếu có Token và đúng Role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/unauthorized" replace />;

  return children;
};

// Component tạm để test luồng
const Placeholder = ({ title }) => (
  <div className="p-8 text-2xl font-bold">{title}</div>
);

export default function AppRouter() {
  return (
    <Routes>
      {/* Tuyến đường công khai (Auth) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/zalo" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Tuyến đường của Chủ Trọ (Landlord) */}
      <Route
        path="/landlord/*"
        element={
          <ProtectedRoute allowedRoles={["landlord"]}>
            <LandlordLayout />
          </ProtectedRoute>
        }
      >
      {/* Nơi chứa nội dung Page */}
        <Route path="dashboard" element={<LandlordDashboard />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="leases" element={<LeasesPage />} />
        <Route path="utilities" element={<UtilitiesPage/>} />
      </Route>

      {/* Tuyến đường của Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Routes>
              <Route
                path="dashboard"
                element={<Placeholder title="Dashboard Admin" />}
              />
            </Routes>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/unauthorized"
        element={<Placeholder title="403 - Bạn không có quyền truy cập!" />}
      />
      <Route
        path="*"
        element={<Placeholder title="404 - Không tìm thấy trang!" />}
      />
    </Routes>
  );
}
