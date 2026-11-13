import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

import { LoginPage } from './pages/LoginPage';
import { PublicPortalPage } from './pages/PublicPortalPage';
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
          {/* 1. Public Citizen Portal (Zero Login Required) */}
          <Route path="/public" element={<PublicPortalPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />

            {/* Enterprise Role Modules */}
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

            {/* Core Operations */}
            <Route path="beneficiaries" element={<BeneficiariesPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="requests" element={<StockRequestsPage />} />
            <Route path="distribution" element={<DistributionPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="alerts" element={<AlertsPage />} />

            {/* Admin Only Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'admin']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'admin']}>
                  <AuditLogPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
