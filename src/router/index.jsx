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
import InvoicesPage from "@/pages/landlord/InvoicesPage";
import UtilitiesPage from "@/pages/landlord/UtilitiesPage";
import BankAccountsPage from "@/pages/landlord/BankAccountsPage";
import FinancialTransactionsPage from "@/pages/landlord/FinancialTransactionsPage";
import ServicePricesPage from "@/pages/landlord/ServicePricesPage";
import NotificationsPage from "@/pages/landlord/NotificationsPage";
import AccountingLedgersPage from "@/pages/landlord/AccountingLedgersPage";
import IncidentsPage from "@/pages/landlord/IncidentsPage";
import ReportsPage from "@/pages/landlord/ReportsPage";
import SettingsPage from "@/pages/landlord/SettingsPage";

import TenantLayout from "@/layouts/TenantLayout";
import TenantDashboard from "@/pages/tenant/TenantDashboardPage";
import TenantInvoices from "@/pages/tenant/TenantInvoicesPage.jsx";
import TenantUtilitiesPage from "@/pages/tenant/TenantUtilitiesPage.jsx";
import TenantContractPage from "@/pages/tenant/TenantLeasesPage.jsx";
import TenantIncidentsPage from "@/pages/tenant/TenantIncidentsPage.jsx";
import TenantNotificationsPage from "@/pages/tenant/TenantNotificationsPage.jsx";
import TenantAccountPage from "@/pages/tenant/TenantAccountPage.jsx";
import TenantMembersPage from "@/pages/tenant/TenantMembersPage.jsx";

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
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="leases" element={<LeasesPage />} />
        <Route path="utilities" element={<UtilitiesPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="banks" element={<BankAccountsPage />} />
        <Route path="financial-transactions" element={<FinancialTransactionsPage />} />
        <Route path="accounting-ledgers" element={<AccountingLedgersPage />} />
        <Route path="service-prices" element={<ServicePricesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />

      </Route>

      {/* Tuyến đường của Người Thuê (Tenant) */}
      <Route
        path="/tenant/*"
        element={
          <ProtectedRoute allowedRoles={["tenant"]}>
            <TenantLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<TenantDashboard />} />
        <Route path="invoices" element={<TenantInvoices />} />
        <Route path="utilities" element={<TenantUtilitiesPage />} />
        <Route path="contracts" element={<TenantContractPage />} />
        <Route path="incidents" element={<TenantIncidentsPage />} />
        <Route path="notifications" element={<TenantNotificationsPage />} />
        <Route path="account" element={<TenantAccountPage />} />
        <Route path="members" element={<TenantMembersPage />} />
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
