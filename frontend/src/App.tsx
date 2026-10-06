import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import ForecastPage from './pages/ForecastPage';
import EmergencyPage from './pages/EmergencyPage';
import BloodBankPage from './pages/BloodBankPage';
import CapacityPage from './pages/CapacityPage';
import NationalReservePage from './pages/NationalReservePage';
import AuditAlertsPage from './pages/AuditAlertsPage';
import CorridorPage from './pages/CorridorPage';
import MasterAdminPage from './pages/MasterAdminPage';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bhissm-bg flex items-center justify-center font-mono text-xs text-bhissm-secondary">
        INITIALIZING SECURE SESSION...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="forecast" element={<ForecastPage />} />
              <Route path="emergency" element={<EmergencyPage />} />
              <Route path="blood-bank" element={<BloodBankPage />} />
              <Route path="capacity" element={<CapacityPage />} />
              <Route path="national-reserve" element={<NationalReservePage />} />
              <Route path="audit-alerts" element={<AuditAlertsPage />} />
              <Route path="corridor" element={<CorridorPage />} />
              <Route path="admin/master-data" element={<MasterAdminPage />} />
              <Route path="master-data" element={<MasterAdminPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
