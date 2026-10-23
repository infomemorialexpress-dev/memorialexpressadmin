import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAdminUI } from '../../context/AdminUIContext.jsx';

export default function AdminTopNav({ onToggleMobileSidebar }) {
  const { lang } = useAdminUI();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: lang === 'es' ? 'Panel de Control' : 'Dashboard Overview',
          subtitle: lang === 'es' ? 'Métricas del sistema y accesos directos' : 'System metrics, quick stats & quick links'
        };
      case '/funeral-homes':
        return {
          title: lang === 'es' ? 'Gestión de Funerarias' : 'Funeral Homes & Locations',
          subtitle: lang === 'es' ? 'Administre funerarias asociadas, capillas e imágenes' : 'Add, edit, and organize funeral home partners & facility photos'
        };
      case '/pricing':
        return {
          title: lang === 'es' ? 'Gestión de Precios por Ubicación' : 'Location-Based Pricing',
          subtitle: lang === 'es' ? 'Tarifas de ataúdes, servicios y adicionales por funeraria' : 'Custom price lists for caskets, service packages, and add-ons'
        };
      case '/users':
        return {
          title: lang === 'es' ? 'Gestión de Agentes' : 'Agents Management',
          subtitle: lang === 'es' ? 'Verifique, active y administre agentes de ventas autorizados' : 'Add, edit, verify, and inspect licensed sales agent credentials'
        };
      case '/settings':
        return {
          title: lang === 'es' ? 'Configuración del Sistema' : 'System Settings',
          subtitle: lang === 'es' ? 'Preferencias de idioma, seguridad y credenciales de administrador' : 'Language preferences, security credentials & system settings'
        };
      default:
        return {
          title: 'Memorial Express Admin',
          subtitle: 'Administration Portal'
        };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="admin-topnav">
      <div className="topnav-left">
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Navigation Sidebar"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="page-heading-block">
          <h1 className="page-main-title">{title}</h1>
          <span className="page-main-subtitle">{subtitle}</span>
        </div>
      </div>
    </header>
  );
}
