import React, { useState, useEffect, useCallback } from 'react';
import { useAdminData } from '../../context/AdminDataContext.jsx';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import Button from '../../components/common/Button.jsx';
import AgentModal from '../../components/Admin/AgentModal.jsx';
import api from '../../services/api.js';

export default function AgentsManagement() {
  const {
    agents,
    adminDb,
    handleAddAgent,
    handleUpdateAgent,
    handleToggleAgentVerification,
    handleDeleteAgent
  } = useAdminData();
  const { lang, addToast } = useAdminUI();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'pending' | 'suspended'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [backendHomes, setBackendHomes] = useState([]);

  // Fetch live funeral homes from backend for the assignment dropdown
  useEffect(() => {
    let mounted = true;
    api.get('/funeral-homes')
      .then(res => {
        if (mounted && Array.isArray(res.data)) {
          setBackendHomes(res.data);
        }
      })
      .catch(err => {
        console.warn('Could not load funeral homes from backend:', err);
      });
    return () => { mounted = false; };
  }, []);

  const funeralHomes = backendHomes.length > 0 ? backendHomes : (adminDb?.homes || []);

  // Compute summary metrics
  const totalCount = agents.length;
  const verifiedCount = agents.filter(a => {
    const s = (a.verificationStatus || a.status || '').toLowerCase();
    return s === 'verified';
  }).length;
  const pendingCount = agents.filter(a => {
    const s = (a.verificationStatus || a.status || '').toLowerCase();
    return s === 'pending';
  }).length;
  const suspendedCount = agents.filter(a => {
    const s = (a.verificationStatus || a.status || '').toLowerCase();
    return s === 'suspended';
  }).length;

  // Filter agents by status chip & search query
  const filteredAgents = agents.filter(agent => {
    const status = (agent.verificationStatus || agent.status || '').toLowerCase();
    if (statusFilter !== 'all' && status !== statusFilter) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (agent.fullName || agent.name || '').toLowerCase().includes(q);
    const emailMatch = (agent.email || '').toLowerCase().includes(q);
    const licenseMatch = (agent.licenseId || '').toLowerCase().includes(q);
    const agentNumberMatch = (agent.agentNumber || '').toLowerCase().includes(q);
    const uplineMatch = (agent.uplineName || '').toLowerCase().includes(q);
    const territoryMatch = (agent.territory || '').toLowerCase().includes(q);
    const homeName = (typeof agent.assignedHome === 'object' ? agent.assignedHome?.name : agent.assignedHome) || '';
    const homeMatch = homeName.toLowerCase().includes(q);

    return nameMatch || emailMatch || licenseMatch || agentNumberMatch || uplineMatch || territoryMatch || homeMatch;
  });

  const handleOpenRegisterModal = () => {
    setEditingAgent(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (agent) => {
    setEditingAgent(agent);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
  };

  const handleSaveAgent = async (formData, existingId) => {
    if (existingId) {
      return handleUpdateAgent(existingId, formData);
    } else {
      return handleAddAgent(formData);
    }
  };

  const handleDelete = async (agent) => {
    const agentName = agent.fullName || agent.name || 'Sales Agent';
    const confirmMsg = lang === 'es'
      ? `¿Está seguro de eliminar al agente "${agentName}"?`
      : `Are you sure you want to remove agent "${agentName}"?`;

    if (window.confirm(confirmMsg)) {
      await handleDeleteAgent(agent.id || agent._id);
    }
  };

  const handleQuickStatusChange = async (agent, newStatus) => {
    const agentId = agent.id || agent._id;
    await handleToggleAgentVerification(agentId, newStatus);
  };

  return (
    <div className="agents-management-page">
      {/* Page Header */}
      <div className="agents-header-block">
        <h1 className="agents-header-title">
          {lang === 'es' ? 'Gestión de Agentes' : 'Agents Management'}
        </h1>
        <p className="agents-header-subtitle">
          {lang === 'es'
            ? 'Agregue, edite, verifique e inspeccione credenciales de agentes de ventas autorizados'
            : 'Add, edit, verify, and inspect licensed sales agent credentials'}
        </p>
      </div>

      {/* Summary Header Metrics Row */}
      <div className="agents-summary-row">
        <div
          className={`agents-summary-card ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
          title="Filter all agents"
        >
          <span className="agents-summary-label">
            {lang === 'es' ? 'Todos los Agentes' : 'All Agents'}
          </span>
          <span className="agents-summary-count">{totalCount}</span>
        </div>

        <div
          className={`agents-summary-card ${statusFilter === 'verified' ? 'active' : ''}`}
          onClick={() => setStatusFilter('verified')}
          title="Filter verified agents"
        >
          <span className="agents-summary-label">
            <span>✅</span> {lang === 'es' ? 'Verificados' : 'Verified'}
          </span>
          <span className="agents-summary-count">{verifiedCount}</span>
        </div>

        <div
          className={`agents-summary-card ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
          title="Filter pending review agents"
        >
          <span className="agents-summary-label">
            <span>⏳</span> {lang === 'es' ? 'Pendientes de Revisión' : 'Pending Review'}
          </span>
          <span className="agents-summary-count">{pendingCount}</span>
        </div>

        <div
          className={`agents-summary-card ${statusFilter === 'suspended' ? 'active' : ''}`}
          onClick={() => setStatusFilter('suspended')}
          title="Filter suspended agents"
        >
          <span className="agents-summary-label">
            <span>🚫</span> {lang === 'es' ? 'Suspendidos' : 'Suspended'}
          </span>
          <span className="agents-summary-count">{suspendedCount}</span>
        </div>
      </div>

      {/* Search Bar & Register Button Toolbar */}
      <div className="agents-toolbar">
        <div className="agents-search-input-wrapper">
          <input
            type="text"
            className="agents-search-input"
            placeholder={
              lang === 'es'
                ? 'Buscar agentes por nombre, correo, licencia o territorio...'
                : 'Search agents by name, email, license ID, or territory...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-register-agent"
          onClick={handleOpenRegisterModal}
        >
          <span>+</span> {lang === 'es' ? 'Registrar Agente' : 'Register Sales Agent'}
        </button>
      </div>

      {/* Agents Data Table Card */}
      <div className="agents-table-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="agents-table">
            <thead>
              <tr>
                <th>{lang === 'es' ? 'Agente de Ventas' : 'Sales Representative'}</th>
                <th>{lang === 'es' ? 'Información de Contacto' : 'Contact Information'}</th>
                <th>{lang === 'es' ? 'Licencia y Territorio' : 'License & Territory'}</th>
                <th>{lang === 'es' ? 'Ubicación Asignada' : 'Assigned Location'}</th>
                <th style={{ minWidth: 160 }}>{lang === 'es' ? 'Estado de Verificación' : 'Verification Status'}</th>
                <th style={{ width: 100, textAlign: 'center' }}>{lang === 'es' ? 'Acciones' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    {lang === 'es'
                      ? 'No se encontraron agentes de ventas con los criterios seleccionados.'
                      : 'No sales agents found matching current search and filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => {
                  const agentId = agent.id || agent._id;
                  const agentName = agent.fullName || agent.name || 'Sales Agent';
                  const initials = agentName.charAt(0).toUpperCase() || 'A';
                  const status = (agent.verificationStatus || agent.status || 'pending').toLowerCase();
                  const assignedLocationName =
                    (typeof agent.assignedHome === 'object' ? agent.assignedHome?.name : agent.assignedHome) ||
                    'Optima Funeral Home';

                  const joinedDate = agent.joinedDate || (agent.createdAt ? agent.createdAt.split('T')[0] : '2024-03-15');

                  return (
                    <tr key={agentId}>
                      {/* Sales Representative */}
                      <td>
                        <div className="agent-rep-cell">
                          <div className="agent-rep-avatar">
                            {initials}
                          </div>
                          <div>
                            <div className="agent-rep-name">{agentName}</div>
                            <div className="agent-rep-joined">
                              {lang === 'es' ? 'Registrado: ' : 'Joined: '}
                              {joinedDate}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Information */}
                      <td>
                        <div className="agent-contact-cell">
                          <div className="agent-contact-email">{agent.email}</div>
                          {agent.phone && (
                            <div className="agent-contact-phone">
                              <span>📞</span> {agent.phone}
                            </div>
                          )}
                          <div className="agent-contact-pass">
                            <span className="agent-contact-pass-label">
                              🔑 {lang === 'es' ? 'Clave:' : 'Pass:'}
                            </span>
                            <span className="agent-contact-pass-chip">
                              {agent.password || 'Agent1234!'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* License & Territory */}
                      <td>
                        <div>
                          <div className="agent-license-id">
                            <span>🆔</span> {agent.licenseId || 'CA-FD-98421'}
                            {agent.agentNumber && (
                              <span style={{ marginLeft: '6px', fontSize: '11px', background: '#e0e7ff', color: '#4338ca', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                #{agent.agentNumber}
                              </span>
                            )}
                          </div>
                          {agent.uplineName && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              <span>⬆️ {lang === 'es' ? 'Upline: ' : 'Upline: '}</span>{agent.uplineName}
                            </div>
                          )}
                          <div className="agent-territory">
                            <span>📍</span> {agent.territory || 'Southern California'}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Location */}
                      <td>
                        <span className="agent-location-tag">
                          <span>🏛️</span> {assignedLocationName}
                        </span>
                      </td>

                      {/* Verification Status */}
                      <td>
                        <div className="agent-status-cell">
                          <span className={`agent-status-badge ${status}`}>
                            {status === 'verified' && '✓ Verified'}
                            {status === 'pending' && '⏳ Pending'}
                            {status === 'suspended' && '🚫 Suspended'}
                          </span>

                          <select
                            value={status}
                            onChange={(e) => handleQuickStatusChange(agent, e.target.value)}
                            className="agent-status-dropdown"
                            title="Change verification status"
                          >
                            <option value="verified">✓ Set Verified</option>
                            <option value="pending">⏳ Set Pending</option>
                            <option value="suspended">🚫 Set Suspended</option>
                          </select>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="agent-action-buttons">
                          <button
                            type="button"
                            className="agent-action-btn edit"
                            onClick={() => handleOpenEditModal(agent)}
                            title="Edit sales agent"
                            aria-label="Edit agent"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="agent-action-btn delete"
                            onClick={() => handleDelete(agent)}
                            title="Delete sales agent"
                            aria-label="Delete agent"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Agent Modal */}
      <AgentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAgent}
        initialData={editingAgent}
        funeralHomes={funeralHomes}
        lang={lang}
      />
    </div>
  );
}
