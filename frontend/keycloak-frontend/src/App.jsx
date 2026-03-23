import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';

import Login from './pages/Login';
import AuthSuccess from './pages/AuthSuccess';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import FeatureFlags from './pages/FeatureFlags';
import AuditLogs from './pages/AuditLogs';
import Subscription from './pages/Subscription';
import Tenants from './pages/Tenants';
import Settings from './pages/Settings';
import { PageLoader } from './components/common/LoadingSpinner';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader text="Authenticating..." />;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"         element={<Login />} />
      <Route path="/auth/success"  element={<AuthSuccess />} />
      <Route path="/"              element={<Navigate to="/dashboard" replace />} />

      <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/users"         element={<Users />} />
        <Route path="/analytics"     element={<Analytics />} />
        <Route path="/feature-flags" element={<FeatureFlags />} />
        <Route path="/audit-logs"    element={<AuditLogs />} />
        <Route path="/subscription"  element={<Subscription />} />
        <Route path="/tenants"       element={<Tenants />} />
        <Route path="/settings"      element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </TenantProvider>
    </AuthProvider>
  );
}
