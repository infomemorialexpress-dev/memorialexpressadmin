import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminUIProvider, useAdminUI } from './context/AdminUIContext.jsx';
import { AdminDataProvider } from './context/AdminDataContext.jsx';
import Toast from './components/common/Toast.jsx';
import ProtectedRoute from './components/Admin/ProtectedRoute.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';

// Dedicated screen pages
import DashboardPage from './pages/Admin/DashboardPage.jsx';
import FuneralHomesPage from './pages/Admin/FuneralHomesPage.jsx';
import PricingManagementPage from './pages/Admin/PricingManagementPage.jsx';
import UsersPage from './pages/Admin/UsersPage.jsx';
import AgentsManagement from './pages/Admin/AgentsManagement.jsx';
import Settings from './pages/Admin/Settings.jsx';
import AdminLoginPage from './pages/Admin/AdminLoginPage.jsx';

function AdminAppLayout() {
  const { toasts, removeToast } = useAdminUI();

  return (
    <div className="admin-root-shell">
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<AdminLoginPage />} />

        {/* Protected Dashboard Screens inside persistent Sidebar Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/funeral-homes"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <FuneralHomesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <PricingManagementPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AgentsManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/agents"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AgentsManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Centralized Toast Notifications Container */}
      <div className="toast-container noprint">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminUIProvider>
          <AdminDataProvider>
            <AdminAppLayout />
          </AdminDataProvider>
        </AdminUIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
