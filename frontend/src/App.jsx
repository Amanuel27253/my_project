import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { StockRequestsPage } from './pages/StockRequestsPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { DistributionPage } from './pages/DistributionPage';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AdminPage } from './pages/AdminPage';
import { AuditLogPage } from './pages/AuditLogPage';

// Enterprise Role Modules
import { ZoneExpertPage } from './pages/ZoneExpertPage';
import { WoredaOfficerPage } from './pages/WoredaOfficerPage';
import { KebeleOfficerPage } from './pages/KebeleOfficerPage';
import { StorekeeperPage } from './pages/StorekeeperPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Dual-Mode Authentication Gateway (Civil Service vs System Admin) */}
          <Route path="/login" element={<LoginPage />} />

          {/* 3. DEDICATED SYSTEM ADMIN CONSOLE (Option A / Approach 2)
                 Strictly gated for System Administrators (RBAC & Separation of Duties) */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminPage />} />
            <Route path="audit-logs" element={<AuditLogPage />} />
          </Route>

          {/* Legacy route alias for audit logs -> redirects to admin console */}
          <Route path="/audit-logs" element={<Navigate to="/admin/audit-logs" replace />} />

          {/* 4. CIVIL SERVICE OPERATIONAL WORKSPACE
                 Tailored for Zone, Woreda, Kebele & Storekeeper Staff */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />

            {/* Governance Workstations */}
            <Route
              path="zone"
              element={
                <ProtectedRoute allowedRoles={['ZONE_EXPERT', 'zone_officer', 'SYSTEM_ADMIN', 'admin']}>
                  <ZoneExpertPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="woreda"
              element={
                <ProtectedRoute allowedRoles={['WOREDA_OFFICER', 'woreda_officer', 'ZONE_EXPERT', 'zone_officer', 'SYSTEM_ADMIN', 'admin']}>
                  <WoredaOfficerPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="kebele"
              element={
                <ProtectedRoute allowedRoles={['KEBELE_OFFICER', 'kebele_officer', 'SYSTEM_ADMIN', 'admin']}>
                  <KebeleOfficerPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="store"
              element={
                <ProtectedRoute allowedRoles={['STOREKEEPER', 'store_manager', 'SYSTEM_ADMIN', 'admin']}>
                  <StorekeeperPage />
                </ProtectedRoute>
              }
            />

            {/* Operational Activities */}
            <Route path="beneficiaries" element={<BeneficiariesPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="requests" element={<StockRequestsPage />} />
            <Route path="distribution" element={<DistributionPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
