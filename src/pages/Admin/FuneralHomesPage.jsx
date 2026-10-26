import React, { useState, useEffect, useCallback } from 'react';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import { useAdminData } from '../../context/AdminDataContext.jsx';
import Button from '../../components/common/Button.jsx';
import InputField from '../../components/common/InputField.jsx';
import FuneralHomeModal from '../../components/Admin/FuneralHomeModal.jsx';
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

  // Delete funeral home via API: DELETE /funeral-homes/:id
  const handleDelete = async (home) => {
    const homeId = home._id || home.id;
    const confirmMsg =
      lang === 'es'
        ? `¿Está seguro de eliminar la funeraria "${home.name}"? Esta acción no se puede deshacer.`
        : `Are you sure you want to delete funeral home "${home.name}"? This action cannot be undone.`;

    if (window.confirm(confirmMsg)) {
      try {
        await api.delete(`/funeral-homes/${homeId}`);
        setHomes((prev) => prev.filter((h) => h._id !== homeId && h.id !== homeId));
        refreshHomes?.();
        addToast?.(
          lang === 'es'
            ? `Funeraria "${home.name}" eliminada exitosamente.`
            : `Funeral home "${home.name}" deleted successfully.`,
          'info'
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
      }
    }
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
                    <span className="verified-pill">
                      ✓ {lang === 'es' ? 'Activa' : 'Active Location'}
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

                {/* Card Actions Footer: ONLY Edit button and Delete icon */}
                <div className="card-actions-footer">
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
                    className="delete-icon-btn"
                    onClick={() => handleDelete(home)}
                    title={lang === 'es' ? 'Eliminar funeraria' : 'Delete location'}
                    aria-label="Delete location"
                  >
                    🗑️
                  </button>
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
    </div>
  );
}
