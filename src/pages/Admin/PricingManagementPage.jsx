import React, { useState } from 'react';
import { useAdminData } from '../../context/AdminDataContext.jsx';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import Button from '../../components/common/Button.jsx';
import InputField from '../../components/common/InputField.jsx';
import PackagePricingTable from '../../components/Admin/PackagePricingTable.jsx';
import AddItemModal from '../../components/Admin/AddItemModal.jsx';
import EditItemModal from '../../components/Admin/EditItemModal.jsx';
import { formatMoney } from '../../utils/quoteLogic.js';

export default function PricingManagementPage() {
  const {
    adminDb,
    selectedHomeId,
    setSelectedHomeId,
    activeHome,
    serviceItems,
    isLoadingServices,
    handlePackagePriceChange,
    handleAddItem,
    handleUpdateItem,
    handleDeleteCasket,
    handleDeleteAddon
  } = useAdminData();
  const { lang } = useAdminUI();

  const [activeTab, setActiveTab] = useState('caskets'); // 'caskets' | 'services' | 'addons'
  const [filterQuery, setFilterQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemType, setEditingItemType] = useState('casket');

  const homes = adminDb?.homes || [];
  const currentHomeId = selectedHomeId || homes[0]?.id || 'optima';

  // Filter caskets exclusively for this location (or global '*')
  const visibleCaskets = (adminDb.caskets || []).filter((c) => {
    const matchesHome = c.home === currentHomeId || c.home === '*' || !c.home;
    const matchesQuery = !filterQuery || c.name?.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesHome && matchesQuery;
  });

  // Filter addons exclusively for this location (or global '*')
  const visibleAddons = (adminDb.addons || []).filter((a) => {
    const matchesHome = a.home === currentHomeId || a.home === '*';
    const matchesQuery = !filterQuery || a.name?.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesHome && matchesQuery;
  });

  const handleOpenEditModal = (item, type = 'casket') => {
    setEditingItem(item);
    setEditingItemType(type);
    setIsEditModalOpen(true);
  };

  return (
    <div className="pricing-management-page">
      {/* 1. LOCATION SELECTION HEADER */}
      <div className="location-selector-card">
        <div className="selector-left">
          <div className="location-icon-bubble">
            🏛️
          </div>
          <div className="selector-text">
            <label htmlFor="funeral-home-select" className="selector-label">
              {lang === 'es' ? 'Seleccionar Funeraria para Precios:' : 'Select Target Funeral Home:'}
            </label>
            <div className="select-container">
              <select
                id="funeral-home-select"
                value={currentHomeId}
                onChange={(e) => setSelectedHomeId(e.target.value)}
                className="form-select location-dropdown"
              >
                {homes.map((home) => (
                  <option key={home.id} value={home.id}>
                    {home.name} ({home.city || 'CA'}{home.zip ? ` - ${home.zip}` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {activeHome && (
          <div className="selected-home-pill">
            <span className="home-dot" />
            <span className="home-badge-title">
              {activeHome.name}
            </span>
            <span className="home-badge-details">
              📍 {activeHome.city || 'CA'} • {activeHome.locations?.length || 1} {lang === 'es' ? 'capillas' : 'chapels'}
            </span>
          </div>
        )}
      </div>

      {/* 2. TAB CONTROLS & ACTIONS TOOLBAR */}
      <div className="pricing-toolbar-card">
        <div className="tabs-navigation">
          <button
            type="button"
            className={`pricing-tab-btn ${activeTab === 'caskets' ? 'active' : ''}`}
            onClick={() => setActiveTab('caskets')}
          >
            ⚰️ {lang === 'es' ? 'Ataúdes y Urnas' : 'Caskets & Merchandise'}
            <span className="tab-count-badge">{visibleCaskets.length}</span>
          </button>

          <button
            type="button"
            className={`pricing-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            📋 {lang === 'es' ? 'Paquetes de Servicios' : 'Service Packages'}
            <span className="tab-count-badge">7</span>
          </button>

          <button
            type="button"
            className={`pricing-tab-btn ${activeTab === 'addons' ? 'active' : ''}`}
            onClick={() => setActiveTab('addons')}
          >
            🌸 {lang === 'es' ? 'Servicios Adicionales' : 'Add-on Fees'}
            <span className="tab-count-badge">{visibleAddons.length}</span>
          </button>
        </div>

        <div className="toolbar-right-actions">
          {activeTab !== 'services' && (
            <InputField
              placeholder={lang === 'es' ? 'Filtrar por nombre...' : 'Filter items by name...'}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{ minWidth: 220, margin: 0 }}
            />
          )}

          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            ➕ {lang === 'es' ? 'Agregar Artículo a esta Sede' : 'Add Item to this Location'}
          </Button>
        </div>
      </div>

      {/* 3. TAB PANELS */}
      <div className="pricing-content-panel">
        {/* TAB 1: CASKETS & MERCHANDISE */}
        {activeTab === 'caskets' && (
          <div className="pricing-table-container">
            <div className="panel-subheading">
              <div>
                <h3 className="panel-title">
                  ⚰️ {lang === 'es' ? 'Lista de Precios de Ataúdes' : 'Casket & Merchandise Rates'}
                </h3>
                <p className="panel-desc">
                  {lang === 'es'
                    ? `Precios de ataúdes asignados a ${activeHome?.name || 'esta funeraria'}. Haga clic en el lápiz para editar o actualizar el precio.`
                    : `Casket models available for ${activeHome?.name || 'this location'}. Click the edit icon to modify specifications or rates.`}
                </p>
              </div>
            </div>

            <div className="table-responsive-wrapper">
              <table className="admin-data-grid">
                <thead>
                  <tr>
                    <th>{lang === 'es' ? 'Modelo de Ataúd' : 'Casket / Merchandise Model'}</th>
                    <th>{lang === 'es' ? 'Material y Acabado' : 'Specifications & Material'}</th>
                    <th style={{ width: 140 }}>{lang === 'es' ? 'Asignación' : 'Assignment'}</th>
                    <th style={{ width: 150 }}>{lang === 'es' ? 'Precio de Lista ($)' : 'List Price ($)'}</th>
                    <th style={{ width: 100, textAlign: 'center' }}>{lang === 'es' ? 'Acción' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCaskets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-table-cell">
                        {lang === 'es'
                          ? 'No se encontraron ataúdes para esta funeraria o filtro.'
                          : 'No casket items found for this location or filter query.'}
                      </td>
                    </tr>
                  ) : (
                    visibleCaskets.map((casket) => (
                      <tr key={casket.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {casket.image ? (
                              <img
                                src={casket.image}
                                alt={casket.name}
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: 'cover',
                                  borderRadius: 6,
                                  border: '1px solid #e2e8f0',
                                  flexShrink: 0
                                }}
                              />
                            ) : (
                              <div style={{
                                width: 40,
                                height: 40,
                                background: '#f1f5f9',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 18,
                                flexShrink: 0
                              }}>
                                ⚰️
                              </div>
                            )}
                            <div className="item-primary-name">{casket.name}</div>
                          </div>
                        </td>
                        <td>
                          <div className="item-spec-text">
                            {casket.specifications || casket.description || 'Standard funeral merchandise'}
                          </div>
                        </td>
                        <td>
                          <span className={`scope-badge ${casket.home === '*' ? 'global' : 'location'}`}>
                            {casket.home === '*' ? 'Global (*)' : (activeHome?.name || casket.home)}
                          </span>
                        </td>
                        <td>
                          <span className="price-tag-plain" style={{ fontWeight: 600, fontSize: 14.5, color: '#183655' }}>
                            ${Number(casket.price || 0).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="edit-icon-btn"
                              onClick={() => handleOpenEditModal(casket, 'casket')}
                              title={lang === 'es' ? 'Editar ataúd' : 'Edit casket'}
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: 6,
                                padding: '5px 8px',
                                cursor: 'pointer',
                                fontSize: 13,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="delete-icon-btn"
                              onClick={() => {
                                if (window.confirm(lang === 'es' ? `¿Eliminar ataúd "${casket.name}"?` : `Delete casket "${casket.name}"?`)) {
                                  handleDeleteCasket(casket.id);
                                }
                              }}
                              title={lang === 'es' ? 'Eliminar ataúd' : 'Delete casket from catalog'}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICE PACKAGES */}
        {activeTab === 'services' && (
          <div className="pricing-table-container">
            <div className="panel-subheading">
              <div>
                <h3 className="panel-title">
                  📋 {lang === 'es' ? 'Tarifas de Paquetes Funerarios' : 'Funeral Service Package Schedule'}
                </h3>
                <p className="panel-desc">
                  {lang === 'es'
                    ? `Tarifas fijas de Sección 1 (Servicios profesionales) y Sección 2 (Instalaciones y equipo) para ${activeHome?.name || 'esta funeraria'}.`
                    : `Section 1 (Professional service fees) and Section 2 (Facilities & automotive) base rates for ${activeHome?.name || 'this location'}.`}
                </p>
              </div>
            </div>

            <PackagePricingTable
              homeId={currentHomeId}
              packages={adminDb.packages || {}}
              serviceItems={serviceItems}
              isLoadingServices={isLoadingServices}
              onPackageChange={handlePackagePriceChange}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 3: ADD-ONS & CASH ADVANCES */}
        {activeTab === 'addons' && (
          <div className="pricing-table-container">
            <div className="panel-subheading">
              <div>
                <h3 className="panel-title">
                  🌸 {lang === 'es' ? 'Servicios Adicionales y Anticipos' : 'Add-on Services & Cash Advances'}
                </h3>
                <p className="panel-desc">
                  {lang === 'es'
                    ? `Costos de flores, libro de condolencias, suelta de palomas y servicios complementarios para ${activeHome?.name || 'esta funeraria'}.`
                    : `Optional add-on merchandise and third-party cash advances for ${activeHome?.name || 'this location'}.`}
                </p>
              </div>
            </div>

            <div className="table-responsive-wrapper">
              <table className="admin-data-grid">
                <thead>
                  <tr>
                    <th>{lang === 'es' ? 'Nombre del Servicio Adicional' : 'Add-on Item Name'}</th>
                    <th style={{ width: 140 }}>{lang === 'es' ? 'Asignación' : 'Assignment'}</th>
                    <th style={{ width: 150 }}>{lang === 'es' ? 'Tarifa ($)' : 'Rate ($)'}</th>
                    <th style={{ width: 100, textAlign: 'center' }}>{lang === 'es' ? 'Acción' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAddons.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-table-cell">
                        {lang === 'es'
                          ? 'No se encontraron servicios adicionales para esta funeraria o filtro.'
                          : 'No add-on items found for this location or filter query.'}
                      </td>
                    </tr>
                  ) : (
                    visibleAddons.map((addon) => (
                      <tr key={addon.id}>
                        <td>
                          <div className="item-primary-name">{addon.name}</div>
                          {addon.description && (
                            <div className="item-spec-text" style={{ fontSize: 12, color: '#64748b' }}>
                              {addon.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`scope-badge ${addon.home === '*' ? 'global' : 'location'}`}>
                            {addon.home === '*' ? 'Global (*)' : (activeHome?.name || addon.home)}
                          </span>
                        </td>
                        <td>
                          <span className="price-tag-plain" style={{ fontWeight: 600, fontSize: 14.5, color: '#183655' }}>
                            ${Number(addon.price || 0).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="edit-icon-btn"
                              onClick={() => handleOpenEditModal(addon, 'addon')}
                              title={lang === 'es' ? 'Editar adicional' : 'Edit add-on'}
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: 6,
                                padding: '5px 8px',
                                cursor: 'pointer',
                                fontSize: 13,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="delete-icon-btn"
                              onClick={() => {
                                if (window.confirm(lang === 'es' ? `¿Eliminar adicional "${addon.name}"?` : `Delete add-on "${addon.name}"?`)) {
                                  handleDeleteAddon(addon.id);
                                }
                              }}
                              title={lang === 'es' ? 'Eliminar adicional' : 'Delete add-on from catalog'}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL: ADD ITEM FOR THIS LOCATION */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={handleAddItem}
        locationName={activeHome?.name || 'Selected Funeral Home'}
        locationId={currentHomeId}
        defaultCategory={activeTab === 'addons' ? 'addon' : 'casket'}
        lang={lang}
      />

      {/* 5. MODAL: EDIT ITEM */}
      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSaveItem={async (updatedData, type) => {
          return await handleUpdateItem(updatedData.id, type, updatedData);
        }}
        item={editingItem}
        itemType={editingItemType}
        lang={lang}
      />
    </div>
  );
}
