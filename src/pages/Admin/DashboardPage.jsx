import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../../context/AdminDataContext.jsx';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import StatCard from '../../components/Admin/StatCard.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';
import { StatCardsSkeleton } from '../../components/common/SkeletonLoader.jsx';

export default function DashboardPage() {
  const {
    adminDb,
    agents,
    setSelectedHomeId,
    handleToggleAgentVerification
  } = useAdminData();
  const { lang } = useAdminUI();
  const navigate = useNavigate();

  // Live dashboard summary state from backend GET /api/dashboard/summary
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/dashboard/summary');
      if (res.data) {
        setSummaryData(res.data);
      }
    } catch (err) {
      console.warn('[Dashboard] Could not fetch summary from backend, using context fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  const homes = adminDb?.homes || [];
  const caskets = adminDb?.caskets || [];
  const addons = adminDb?.addons || [];

  // Metrics from API aggregation with context fallback
  const counts = summaryData?.counts || {
    totalAgents: agents.length,
    verifiedAgents: agents.filter(a => (a.verificationStatus || a.status || '').toLowerCase() === 'verified').length,
    pendingAgents: agents.filter(a => (a.verificationStatus || a.status || '').toLowerCase() === 'pending').length,
    suspendedAgents: agents.filter(a => (a.verificationStatus || a.status || '').toLowerCase() === 'suspended').length,
    totalHomes: homes.length,
    totalChapels: homes.reduce((acc, h) => acc + (h.locations?.length || 1), 0),
    totalCaskets: caskets.length,
    totalAddons: addons.length,
    totalServices: 0
  };

  const pendingAgentsCount = counts.pendingAgents;

  const handleNavigateToPricing = (homeId) => {
    setSelectedHomeId(homeId);
    navigate('/pricing');
  };

  const displayHomes = summaryData?.recentHomes && summaryData.recentHomes.length > 0
    ? summaryData.recentHomes
    : homes.slice(0, 4);

  const displayAgents = summaryData?.recentAgents && summaryData.recentAgents.length > 0
    ? summaryData.recentAgents
    : agents.slice(0, 5);

  return (
    <div className="dashboard-page">
      {/* Pending Agent Verification Alert Banner - Rendered ONLY if pendingAgents > 0 */}
      {pendingAgentsCount > 0 && (
        <div className="dashboard-alert-banner">
          <div className="alert-content-left">
            <span className="alert-icon">⚠️</span>
            <div>
              <div className="alert-title">
                {lang === 'es'
                  ? `${pendingAgentsCount} Agente(s) en espera de verificación`
                  : `${pendingAgentsCount} Sales Agent(s) Awaiting Verification`}
              </div>
              <div className="alert-description">
                {lang === 'es'
                  ? 'Nuevos agentes han solicitado acceso al cotizador funerario. Revise sus credenciales y licencias.'
                  : 'New sales agents have requested authorization to generate quotes. Inspect their credentials.'}
              </div>
            </div>
          </div>
          <div className="alert-actions">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/users')}
            >
              {lang === 'es' ? 'Revisar Agentes →' : 'Review Agents →'}
            </Button>
          </div>
        </div>
      )}

      {/* System Statistics Cards Grid - Actual Aggregated Counts */}
      {isLoading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <div className="stats-grid">
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          label={lang === 'es' ? 'Total de Agentes' : 'Total Sales Agents'}
          value={counts.totalAgents}
          subtext={
            lang === 'es'
              ? `${counts.verifiedAgents} verificados • ${counts.pendingAgents} pendientes`
              : `${counts.verifiedAgents} verified • ${counts.pendingAgents} pending`
          }
          badgeText={`${counts.verifiedAgents}/${counts.totalAgents} Active`}
          badgeType="success"
          accentColor="#183655"
          onClick={() => navigate('/users')}
        />

        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 10h1" />
              <path d="M14 10h1" />
              <path d="M9 14h1" />
              <path d="M14 14h1" />
              <path d="M9 21v-4h6v4" />
            </svg>
          }
          label={lang === 'es' ? 'Funerarias Asociadas' : 'Funeral Home Locations'}
          value={counts.totalHomes}
          subtext={
            lang === 'es'
              ? `${counts.totalChapels} capillas y puntos de servicio`
              : `${counts.totalChapels} chapels & service points across CA`
          }
          badgeText={`${counts.totalHomes} Homes`}
          badgeType="info"
          accentColor="#253851"
          onClick={() => navigate('/funeral-homes')}
        />

        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
          label={lang === 'es' ? 'Catálogo de Ataúdes' : 'Casket Merchandise'}
          value={counts.totalCaskets}
          subtext={
            lang === 'es'
              ? 'Modelos configurados en el catálogo'
              : 'Models configured in catalog'
          }
          badgeText="Catalog"
          badgeType="default"
          accentColor="#996515"
          onClick={() => navigate('/pricing')}
        />

        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          }
          label={lang === 'es' ? 'Servicios y Adicionales' : 'Add-on Services & Fees'}
          value={counts.totalAddons}
          subtext={
            lang === 'es'
              ? 'Flores, anticipos y servicios especiales'
              : 'Flowers, dove release, cash advances'
          }
          badgeText="Active"
          badgeType="success"
          accentColor="#145633"
          onClick={() => navigate('/pricing')}
        />
      </div>
      )}

      {/* Two-Column Content Overview */}
      <div className="dashboard-content-split">
        {/* Left Column: Funeral Homes Overview (Mapped from Backend Aggregation) */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2 className="dashboard-card-title">
                🏛️ {lang === 'es' ? 'Funerarias y Puntos de Servicio' : 'Funeral Homes & Service Points'}
              </h2>
              <p className="dashboard-card-desc">
                {lang === 'es'
                  ? 'Red de funerarias asociadas y centros de atención autorizados'
                  : 'Active network locations and chapels available in quote generator'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/funeral-homes')}
            >
              {lang === 'es' ? 'Ver Todas →' : 'Manage All →'}
            </Button>
          </div>

          <div className="homes-overview-list">
            {displayHomes.map((home) => (
              <div key={home.id || home._id} className="home-overview-item">
                <div className="home-item-photo">
                  {home.image ? (
                    <img src={home.image} alt={home.name} />
                  ) : (
                    <div className="home-item-placeholder">
                      🏛️
                    </div>
                  )}
                </div>

                <div className="home-item-info">
                  <div className="home-item-name">{home.name}</div>
                  <div className="home-item-location">
                    📍 {home.city || 'California'}, {home.zip || ''} • {home.county || 'County'}
                  </div>
                  <div className="home-item-chapels">
                    {home.chapelsCount || home.locations?.length || 1} {lang === 'es' ? 'sedes / capillas' : 'locations/chapels'}
                  </div>
                </div>

                <div className="home-item-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleNavigateToPricing(home.id || home._id)}
                    title={lang === 'es' ? 'Configurar precios de esta funeraria' : 'Configure pricing for this home'}
                  >
                    🏷️ {lang === 'es' ? 'Precios' : 'Pricing'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Agent Status List (Quick Admin Actions completely removed) */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2 className="dashboard-card-title">
                👥 {lang === 'es' ? 'Estado de Agentes Recientes' : 'Sales Agents Status'}
              </h2>
              <p className="dashboard-card-desc">
                {lang === 'es'
                  ? 'Verificación y estado de licencias de representantes'
                  : 'Recent agent activations and verification overview'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/users')}
            >
              {lang === 'es' ? 'Gestionar Agentes →' : 'View All →'}
            </Button>
          </div>

          <div className="agents-quick-list">
            {displayAgents.map((agent) => {
              const status = (agent.verificationStatus || agent.status || 'pending').toLowerCase();
              const agentId = agent.id || agent._id;
              const agentName = agent.fullName || agent.name || 'Sales Agent';
              const initial = agentName.charAt(0).toUpperCase();

              return (
                <div key={agentId} className="agent-quick-item">
                  <div className="agent-avatar-mini">
                    {initial}
                  </div>
                  <div className="agent-quick-details">
                    <div className="agent-quick-name">{agentName}</div>
                    <div className="agent-quick-meta">
                      {agent.email} • ID: {agent.licenseId || 'N/A'}
                    </div>
                  </div>
                  <div className="agent-quick-status">
                    <span className={`status-pill ${status}`}>
                      {status === 'verified'
                        ? '✓ Verified'
                        : status === 'pending'
                        ? '⏳ Pending'
                        : '🚫 Suspended'}
                    </span>
                    {status === 'pending' && (
                      <button
                        type="button"
                        className="quick-verify-btn"
                        onClick={async () => {
                          await handleToggleAgentVerification(agentId, 'verified');
                          fetchDashboardSummary();
                        }}
                        title="Quick verify agent"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
