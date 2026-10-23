import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import memorialExpressLogo from '../../assets/memorial_express_icon.svg';

export function BrandFeatherIcon({ className, style }) {
  return (
    <img
      src={memorialExpressLogo}
      alt="Memorial Express Logo"
      className={className}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        borderRadius: 8,
        ...style
      }}
    />
  );
}

export default function AdminHeader() {
  const { isAuthenticated, logout, adminUser } = useAuth();
  const { lang, setLanguage } = useAdminUI();

  const handleLanguageToggle = () => {
    setLanguage(lang === 'es' ? 'en' : 'es');
  };

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <BrandFeatherIcon className="brand-logo-img" />
        <div>
          <div className="brand-title">MEMORIAL EXPRESS ADMIN</div>
          <div className="brand-subtitle">
            {lang === 'es' ? 'Panel de Control y Precios' : 'Pricing & Funeral Homes Management'}
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="lang-toggle-btn"
          onClick={handleLanguageToggle}
          title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
          <span>{lang === 'es' ? '🇺🇸 English' : '🇲🇽 Español'}</span>
        </button>

        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: 'rgba(212, 175, 55, 0.15)',
              color: '#d4af37',
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 6
            }}>
              👤 {adminUser?.username || 'Admin'}
            </span>
            <button
              type="button"
              className="nav-link-btn"
              style={{ background: 'rgba(212, 175, 55, 0.12)', color: '#d4af37', borderColor: 'rgba(212, 175, 55, 0.35)' }}
              onClick={logout}
              title="Logout from Admin Dashboard"
            >
              🚪 {lang === 'es' ? 'Cerrar Sesión' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
