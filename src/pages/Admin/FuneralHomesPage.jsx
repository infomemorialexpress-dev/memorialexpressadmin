import React, { useState, useEffect, useCallback } from 'react';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import { useAdminData } from '../../context/AdminDataContext.jsx';
import Button from '../../components/common/Button.jsx';
import InputField from '../../components/common/InputField.jsx';
import FuneralHomeModal from '../../components/Admin/FuneralHomeModal.jsx';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal.jsx';
import DuplicateFuneralHomeModal from '../../components/Admin/DuplicateFuneralHomeModal.jsx';
import api from '../../services/api.js';
import { FuneralHomeAdminCardSkeleton } from '../../components/common/SkeletonLoader.jsx';
import ShimmerImage from '../../components/common/ShimmerImage.jsx';

export default function FuneralHomesPage() {
  const { lang, addToast } = useAdminUI();
  const { refreshHomes, setSelectedHomeId } = useAdminData() || {};

  const [homes, setHomes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHome, setEditingHome] = useState(null);
  const [duplicatingHome, setDuplicatingHome] = useState(null);
  const [deletingHome, setDeletingHome] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch list of funeral homes from NestJS Backend: GET /funeral-homes
  const fetchHomes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/funeral-homes');
      const data = Array.isArray(response.data) ? response.data : [];
      setHomes(data);
    } catch (err) {
      console.error('Error fetching funeral homes:', err);
      const msg =
        err.userMessage ||
        (lang === 'es'
          ? 'No se pudieron cargar las funerarias. Verifique la conexión con el servidor.'
          : 'Could not load funeral homes. Please check server connection.');
      setError(msg);
      setHomes([]);
    } finally {
      setIsLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchHomes();
  }, [fetchHomes]);

  // Filter funeral homes dynamically
  const filteredHomes = homes.filter((h) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = h.name?.toLowerCase().includes(q);
    const cityMatch = h.city?.toLowerCase().includes(q);
    const zipMatch = (h.zipCode || h.zip)?.toLowerCase().includes(q);
    const countyMatch = h.county?.toLowerCase().includes(q);
    const addressMatch = (h.streetAddress || h.address)?.toLowerCase().includes(q);
    const chapels = h.chapels || h.locations || [];
    const chapelsMatch = chapels.some((c) => c.city?.toLowerCase().includes(q));
    return nameMatch || cityMatch || zipMatch || countyMatch || addressMatch || chapelsMatch;
  });

  const handleOpenAddModal = () => {
    setEditingHome(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (home) => {
    setEditingHome(home);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHome(null);
  };

  // Create or Update funeral home via API: POST /funeral-homes or PATCH /funeral-homes/:id
  const handleSaveHome = async (homePayload, existingId) => {
    try {
      if (existingId) {
        const response = await api.patch(`/funeral-homes/${existingId}`, homePayload);
        const updated = response.data;
        setHomes((prev) =>
          prev.map((h) => ((h._id === existingId || h.id === existingId) ? updated : h))
        );
        refreshHomes?.(existingId);
        addToast?.(
          lang === 'es'
            ? `Funeraria "${updated.name}" actualizada con éxito.`
            : `Funeral home "${updated.name}" updated successfully.`,
          'success'
        );
      } else {
        const response = await api.post('/funeral-homes', homePayload);
        const created = response.data;
        const newHomeId = created._id || created.id;
        setHomes((prev) => [created, ...prev]);
        refreshHomes?.(newHomeId);
        setSelectedHomeId?.(newHomeId);
        addToast?.(
          lang === 'es'
            ? `Funeraria "${created.name}" creada con éxito.`
            : `Funeral home "${created.name}" created successfully.`,
          'success'
        );
      }
      return { success: true };
    } catch (err) {
      console.error('Error saving funeral home:', err);
      const msg =
        err.userMessage ||
        (lang === 'es' ? 'Error al guardar la funeraria.' : 'Error saving funeral home.');
      addToast?.(msg, 'error');
      throw new Error(msg);
    }
  };

  // State for tracking active/draft toggles
  const [updatingHomeId, setUpdatingHomeId] = useState(null);

  // Toggle active/draft status via PATCH /funeral-homes/:id
  const handleToggleActive = async (home) => {
    const homeId = home._id || home.id;
    const nextStatus = !Boolean(home.isActive);
    setUpdatingHomeId(homeId);

    // Optimistic UI update
    setHomes((prev) =>
      prev.map((h) => ((h._id === homeId || h.id === homeId) ? { ...h, isActive: nextStatus } : h))
    );

    try {
      const response = await api.patch(`/funeral-homes/${homeId}`, { isActive: nextStatus });
      const updated = response.data;
      setHomes((prev) =>
        prev.map((h) => ((h._id === homeId || h.id === homeId) ? { ...h, ...updated, isActive: nextStatus } : h))
      );
      refreshHomes?.(homeId);
      addToast?.(
        lang === 'es'
          ? `Funeraria "${home.name}" cambiada a ${nextStatus ? 'Activa' : 'Borrador'}.`
          : `Funeral home "${home.name}" set to ${nextStatus ? 'Active' : 'Draft'}.`,
        'success'
      );
    } catch (err) {
      console.error('Error toggling funeral home active status:', err);
      // Revert optimistic update
      setHomes((prev) =>
        prev.map((h) => ((h._id === homeId || h.id === homeId) ? { ...h, isActive: !nextStatus } : h))
      );
      addToast?.(
        lang === 'es'
          ? 'Error al actualizar el estado de la funeraria.'
          : 'Failed to update funeral home status.',
        'error'
      );
    } finally {
      setUpdatingHomeId(null);
    }
  };

  // Delete funeral home via API: DELETE /funeral-homes/:id
  const handleConfirmDelete = async () => {
    if (!deletingHome) return;
    const homeId = deletingHome._id || deletingHome.id;
    setIsDeleting(true);
    try {
      await api.delete(`/funeral-homes/${homeId}`);
      setHomes((prev) => prev.filter((h) => h._id !== homeId && h.id !== homeId));
      refreshHomes?.();
      addToast?.(
        lang === 'es'
          ? `Funeraria "${deletingHome.name}" eliminada exitosamente.`
          : `Funeral home "${deletingHome.name}" deleted successfully.`,
        'success'
      );
    } catch (err) {
      console.error('Error deleting funeral home:', err);
      addToast?.(
        err.userMessage ||
          (lang === 'es'
            ? 'Error al eliminar la funeraria del servidor.'
            : 'Error deleting funeral home from server.'),
        'error'
      );
    } finally {
      setIsDeleting(false);
      setDeletingHome(null);
    }
  };

  const handleDuplicated = (newHome) => {
    setHomes((prev) => [newHome, ...prev]);
    const newHomeId = newHome._id || newHome.id;
    refreshHomes?.(newHomeId);
    addToast?.(
      lang === 'es'
        ? `Funeraria "${newHome.name}" duplicada exitosamente con todo su catálogo y paquetes.`
        : `Funeral home "${newHome.name}" duplicated successfully with all catalog items and packages.`,
      'success'
    );
  };

  return (
    <div className="funeral-homes-page">
      {/* 1. Page Header & Action Bar */}
      <div className="page-toolbar">
        <div className="toolbar-search">
          <InputField
            placeholder={
              lang === 'es'
                ? 'Buscar por nombre, ciudad, dirección, código postal...'
                : 'Search by funeral home name, city, address, or ZIP...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <Button
            variant="primary"
            onClick={handleOpenAddModal}
            className="btn-add-home"
          >
            ➕ {lang === 'es' ? 'Agregar Nueva Funeraria' : 'Add Funeral Home'}
          </Button>
        </div>
      </div>

      {/* 2. Error Banner with Retry */}
      {error && (
        <div className="page-alert-banner page-alert-error" style={{ marginBottom: 16 }}>
          <span>⚠️ {error}</span>
          <Button variant="secondary" size="sm" onClick={fetchHomes} style={{ marginLeft: 16 }}>
            🔄 {lang === 'es' ? 'Reintentar' : 'Retry'}
          </Button>
        </div>
      )}

      {/* 3. Stats Summary Strip */}
      {!isLoading && (
        <div className="homes-stats-strip">
          <span className="strip-item">
            <strong>{homes.length}</strong>{' '}
            {lang === 'es' ? 'Funerarias Registradas' : 'Registered Locations'}
          </span>
          <span className="strip-divider">•</span>
          <span className="strip-item">
            <strong>
              {homes.reduce((sum, h) => {
                const chapels = h.chapels || h.locations;
                return sum + (Array.isArray(chapels) && chapels.length > 0 ? chapels.length : 1);
              }, 0)}
            </strong>{' '}
            {lang === 'es' ? 'Capillas y Puntos de Servicio' : 'Total Service Chapels'}
          </span>
          <span className="strip-divider">•</span>
          <span className="strip-item">
            <strong>
              {homes.filter((h) => Boolean(h.imageUrl || h.image)).length}
            </strong>{' '}
            {lang === 'es' ? 'Con Fotografía' : 'With Facility Photos'}
          </span>
        </div>
      )}

      {/* 4. Main Content: Loading Shimmer Skeleton, Empty State, or Cards Grid */}
      {isLoading ? (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: '#183655', fontWeight: 650, fontSize: '14px' }}>
            <div className="app-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
            <span>{lang === 'es' ? 'Cargando funerarias desde la base de datos...' : 'Loading funeral homes from database...'}</span>
          </div>
          <FuneralHomeAdminCardSkeleton count={6} />
        </div>
      ) : filteredHomes.length === 0 ? (
        <div className="empty-results-card">
          <div className="empty-icon">🏛️</div>
          <h3>{lang === 'es' ? 'No se encontraron funerarias' : 'No funeral homes found'}</h3>
          <p>
            {searchQuery.trim()
              ? (lang === 'es'
                  ? 'Intente con otro término de búsqueda o limpie el filtro.'
                  : 'Try adjusting your search criteria.')
              : (lang === 'es'
                  ? 'Aún no hay funerarias registradas en la base de datos. Comience agregando la primera sede.'
                  : 'No funeral homes registered in the database yet. Get started by adding your first location.')}
          </p>
          <Button variant="primary" onClick={handleOpenAddModal}>
            ➕ {lang === 'es' ? 'Crear Primera Funeraria' : 'Add First Location'}
          </Button>
        </div>
      ) : (
        <div className="funeral-homes-grid">
          {filteredHomes.map((home) => {
            const homeId = home._id || home.id;
            const photo = home.imageUrl || home.image;
            const chapels = home.chapels || home.locations || [];
            const chapelsCount = chapels.length > 0 ? chapels.length : 1;
            const street = home.streetAddress || home.address || '';
            const zip = home.zipCode || home.zip || '';

            return (
              <div key={homeId} className="funeral-home-card">
                {/* Facility Image Section */}
                <div className="card-image-wrapper">
                  {photo ? (
                    <ShimmerImage
                      src={photo}
                      alt={home.name}
                      className="card-facility-img"
                      width="100%"
                      height="100%"
                      objectFit="cover"
                    />
                  ) : (
                    <div className="card-image-fallback">
                      <div className="fallback-icon">🏛️</div>
                      <span className="fallback-text">
                        {lang === 'es' ? 'Sin Fotografía de Sede' : 'No Photo Uploaded'}
                      </span>
                      <button
                        type="button"
                        className="upload-prompt-btn"
                        onClick={() => handleOpenEditModal(home)}
                      >
                        📷 {lang === 'es' ? 'Subir Foto' : 'Upload Photo'}
                      </button>
                    </div>
                  )}

                  <div className="card-badge-overlay">
                    <span
                      className={`verified-pill ${home.isActive ? 'active-pill' : 'draft-pill'}`}
                      style={{
                        backgroundColor: home.isActive ? '#ecfdf5' : '#fef3c7',
                        color: home.isActive ? '#047857' : '#b45309',
                        border: `1.5px solid ${home.isActive ? '#a7f3d0' : '#fde68a'}`,
                        fontWeight: 700,
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      {home.isActive
                        ? (lang === 'es' ? '✓ Activa' : '✓ Active')
                        : (lang === 'es' ? '📝 Borrador' : '📝 Draft')}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <div className="card-title-row">
                    <h3 className="card-title">{home.name}</h3>
                  </div>

                  {(home.customNote || home.program) && (
                    <div
                      style={{
                        color: home.noteColor || '#008000',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span style={{ fontSize: '9px' }}>●</span>
                      <span>{home.customNote || home.program}</span>
                    </div>
                  )}

                  <div className="card-meta-list">
                    <div className="meta-row">
                      <span className="meta-icon" aria-hidden="true">📍</span>
                      <span className="meta-text">
                        {street ? `${street}, ` : ''}
                        {home.city || 'California'}{zip ? `, ${zip}` : ''}
                      </span>
                    </div>

                    {home.phone && (
                      <div className="meta-row">
                        <span className="meta-icon" aria-hidden="true">📞</span>
                        <span className="meta-text">{home.phone}</span>
                      </div>
                    )}

                    <div className="meta-row">
                      <span className="meta-icon" aria-hidden="true">🏛️</span>
                      <span className="meta-text">
                        {chapelsCount}{' '}
                        {lang === 'es'
                          ? 'capilla(s) y centros de servicio'
                          : 'chapel(s) & service points'}
                      </span>
                    </div>
                  </div>

                  {/* Affiliated Chapels preview tags */}
                  {chapels.length > 0 && (
                    <div className="chapels-tag-cloud">
                      {chapels.slice(0, 4).map((c, idx) => (
                        <span key={idx} className="chapel-tag">
                          {c.city} {Number(c.surcharge) > 0 ? `(+$${c.surcharge})` : ''}
                        </span>
                      ))}
                      {chapels.length > 4 && (
                        <span className="chapel-tag more">
                          +{chapels.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer: Active/Draft Toggle & Action buttons */}
                <div className="card-actions-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  {/* Toggle Switch Component (Active / Draft) */}
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: updatingHomeId === homeId ? 'wait' : 'pointer',
                      userSelect: 'none',
                      margin: 0,
                    }}
                    title={
                      home.isActive
                        ? (lang === 'es' ? 'Haga clic para cambiar a Borrador (ocultar de agentes)' : 'Click to set as Draft (hide from agents)')
                        : (lang === 'es' ? 'Haga clic para Publicar (visible para agentes)' : 'Click to Publish (visible to agents)')
                    }
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '38px',
                        height: '20px',
                        backgroundColor: home.isActive ? '#10b981' : '#cbd5e1',
                        borderRadius: '20px',
                        transition: 'background-color 0.2s ease',
                        opacity: updatingHomeId === homeId ? 0.6 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(home.isActive)}
                        disabled={updatingHomeId === homeId}
                        onChange={() => handleToggleActive(home)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: home.isActive ? '20px' : '2px',
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: home.isActive ? '#047857' : '#64748b',
                        minWidth: '42px',
                      }}
                    >
                      {home.isActive
                        ? (lang === 'es' ? 'Activa' : 'Active')
                        : (lang === 'es' ? 'Borrador' : 'Draft')}
                    </span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenEditModal(home)}
                      className="btn-edit-home"
                    >
                      ✏️ {lang === 'es' ? 'Editar' : 'Edit'}
                    </Button>

                    <button
                      type="button"
                      className="duplicate-icon-btn"
                      onClick={() => setDuplicatingHome(home)}
                      title={lang === 'es' ? 'Duplicar funeraria' : 'Duplicate location'}
                      aria-label="Duplicate location"
                    >
                      📋
                    </button>

                    <button
                      type="button"
                      className="delete-icon-btn"
                      onClick={() => setDeletingHome(home)}
                      title={lang === 'es' ? 'Eliminar funeraria' : 'Delete location'}
                      aria-label="Delete location"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Funeral Home Modal */}
      <FuneralHomeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveHome}
        initialData={editingHome}
        lang={lang}
      />

      {/* Confirm Delete Popup */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingHome)}
        onClose={() => setDeletingHome(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingHome?.name}
        title={lang === 'es' ? '¿Eliminar Funeraria?' : 'Delete Funeral Home?'}
        isDeleting={isDeleting}
        lang={lang}
      />

      {/* Duplicate Funeral Home Modal */}
      <DuplicateFuneralHomeModal
        isOpen={Boolean(duplicatingHome)}
        onClose={() => setDuplicatingHome(null)}
        home={duplicatingHome}
        onDuplicated={handleDuplicated}
        lang={lang}
      />
    </div>
  );
}
