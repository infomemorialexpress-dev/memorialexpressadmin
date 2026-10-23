import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';
import AdminTopNav from './AdminTopNav.jsx';

export default function AdminLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileOpen(prev => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="admin-layout-shell">
      {/* Persistent Left Sidebar */}
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Main Content Area */}
      <div className="admin-main-viewport">
        <AdminTopNav onToggleMobileSidebar={toggleMobileSidebar} />

        <main className="admin-content-container">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
