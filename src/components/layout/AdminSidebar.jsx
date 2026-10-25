import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import { BrandFeatherIcon } from '../common/AdminHeader.jsx';

export default function AdminSidebar({ isMobileOpen, onCloseMobile }) {
  const { adminUser, logout } = useAuth();
  const { lang } = useAdminUI();

  const navItems = [
    {
      to: '/',
      label: lang === 'es' ? 'Panel Principal' : 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      ),
      end: true
    },
    {
      to: '/funeral-homes',
      label: lang === 'es' ? 'Funerarias' : 'Funeral Homes',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 10h1" />
          <path d="M14 10h1" />
          <path d="M9 14h1" />
          <path d="M14 14h1" />
          <path d="M9 21v-4h6v4" />
        </svg>
      )
    },
    {
      to: '/pricing',
      label: lang === 'es' ? 'Gestión de Precios' : 'Pricing Management',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      )
    },
    {
      to: '/users',
      label: lang === 'es' ? 'Agentes' : 'Agents',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      to: '/settings',
      label: lang === 'es' ? 'Configuración' : 'Settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner">
            <BrandFeatherIcon className="sidebar-brand-icon" />
            <div className="brand-text-block">
              <div className="brand-primary-title">MEMORIAL EXPRESS</div>
              <div className="brand-admin-badge">
                <span className="badge-dot" />
                <span>ADMIN PANEL</span>
              </div>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">
            {lang === 'es' ? 'MENÚ PRINCIPAL' : 'MAIN MENU'}
          </div>
          <ul className="sidebar-menu">
            {navItems.map((item) => (
              <li key={item.to} className="sidebar-menu-item">
                <NavLink
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                  }}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer User Info & Logout */}
        <div className="sidebar-footer">
          <div className="user-profile-badge" title={adminUser?.username || 'Administrator'}>
            <div className="user-avatar-circle">
              {(adminUser?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="user-info-text">
              <span className="user-name">{adminUser?.username || 'Administrator'}</span>
              <span className="user-role">Super Admin</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={logout}
            title={lang === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{lang === 'es' ? 'Salir' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
