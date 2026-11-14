import React, { useState, useEffect } from 'react';
import { useAdminData } from '../../context/AdminDataContext.jsx';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import Button from '../../components/common/Button.jsx';
import InputField from '../../components/common/InputField.jsx';
import PackagePricingTable from '../../components/Admin/PackagePricingTable.jsx';
import AddItemModal from '../../components/Admin/AddItemModal.jsx';
import AddServicePackageModal from '../../components/Admin/AddServicePackageModal.jsx';
import EditItemModal from '../../components/Admin/EditItemModal.jsx';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal.jsx';
import { formatMoney } from '../../utils/quoteLogic.js';

export default function PricingManagementPage() {
  const {
    adminDb,
    selectedHomeId,
    setSelectedHomeId,
    activeHome,
    serviceItems,
    isLoadingServices,
    refreshHomes,
    clearLocationData,
    handlePackagePriceChange,
    handleAddServicePackage,
    handleUpdateServicePackage,
    handleDeleteServicePackage,
    handleAddItem,
    handleUpdateItem,
    handleDeleteCasket,
    handleDeleteAddon
  } = useAdminData();
  const { lang } = useAdminUI();

  // Automatically fetch latest funeral homes whenever opening Pricing Management
  useEffect(() => {
    if (typeof refreshHomes === 'function') {
      refreshHomes();
    }
  }, [refreshHomes]);

  const [activeTab, setActiveTab] = useState('caskets'); // 'caskets' | 'services' | 'addons'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemType, setEditingItemType] = useState('casket');
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'casket' | 'addon' | 'package', id, name }
  const [isDeleting, setIsDeleting] = useState(false);

  const homes = adminDb?.homes || [];
  const currentHomeId = selectedHomeId || homes[0]?._id || homes[0]?.id || '';
  const activeHomeName = activeHome?.name || (homes.find(h => (h._id === currentHomeId || h.id === currentHomeId))?.name) || 'Selected Funeral Home';

  // Filter caskets for this location (items returned by API for this location, including unpriced and legacy)
  const visibleCaskets = (adminDb.caskets || []).filter((c) => {
    if (!c) return false;
    const itemHome = c.funeralHomeId || c.assignedFuneralHomeId || c.home;
    const matchesHome =
      !itemHome ||
      itemHome === '*' ||
      itemHome === 'all' ||
      itemHome === 'Global (*)' ||
      !currentHomeId ||
      String(itemHome) === String(currentHomeId) ||
      String(itemHome).toLowerCase() === String(currentHomeId).toLowerCase() ||
      (activeHome?.name && String(itemHome).toLowerCase() === String(activeHome.name).toLowerCase());
    return matchesHome;
  });

  // Filter addons for this location (items returned by API for this location, including unpriced)
  const visibleAddons = (adminDb.addons || []).filter((a) => {
    if (!a) return false;
    const itemHome = a.funeralHomeId || a.assignedFuneralHomeId || a.home;
    const matchesHome =
      !itemHome ||
      itemHome === '*' ||
      itemHome === 'all' ||
      itemHome === 'Global (*)' ||
      !currentHomeId ||
      String(itemHome) === String(currentHomeId) ||
      String(itemHome).toLowerCase() === String(currentHomeId).toLowerCase() ||
      (activeHome?.name && String(itemHome).toLowerCase() === String(activeHome.name).toLowerCase());
    return matchesHome;
  });

  const resolvePackageName = (pkgIdentifier) => {
    if (!pkgIdentifier) return '';
    if (typeof pkgIdentifier === 'object') {
      return pkgIdentifier.packageName || pkgIdentifier.name || '';
    }
    const str = String(pkgIdentifier).trim();

    // 1. Check in activeHome's servicePackages
    const homePackages = activeHome?.servicePackages || [];
    const matchedInActiveHome = homePackages.find(
      sp => String(sp._id || sp.id) === str || sp.name === str || sp.packageName === str
    );
    if (matchedInActiveHome) {
      return matchedInActiveHome.name || matchedInActiveHome.packageName || '';
    }

    // 2. Check across all homes in adminDb.homes
    for (const h of (adminDb?.homes || [])) {
      const matchInHome = (h?.servicePackages || []).find(
        sp => String(sp._id || sp.id) === str || sp.name === str || sp.packageName === str
      );
      if (matchInHome) {
        return matchInHome.name || matchInHome.packageName || '';
      }
    }

    // 3. Check in serviceItems array
    const matchedService = (serviceItems || []).find(
      s => String(s._id || s.id) === str || String(s.packageId) === str || s.name === str || s.packageName === str
    );
    if (matchedService) {
      return matchedService.packageName || matchedService.name || '';
    }

    // 4. Check in adminDb.packages map
    if (adminDb?.packages) {
      for (const [key, pkg] of Object.entries(adminDb.packages)) {
        if (key.includes(str) || String(pkg?.catalogId) === str || String(pkg?.serviceId) === str || String(pkg?.id) === str) {
          return pkg?.name || pkg?.packageName || '';
        }
      }
    }

    // 5. If it looks like a Mongo ObjectId (24 hex characters), do not display raw hex hash
    if (/^[0-9a-fA-F]{24}$/.test(str)) {
      return '';
    }

    return str;
  };

  const handleOpenEditModal = (item, type = 'casket') => {
    setEditingItem(item);
    setEditingItemType(type);
    setIsEditModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'casket') {
        await handleDeleteCasket(deleteTarget.id);
      } else if (deleteTarget.type === 'addon') {
        await handleDeleteAddon(deleteTarget.id);
      } else if (deleteTarget.type === 'package') {
        await handleDeleteServicePackage(currentHomeId, deleteTarget.id);
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
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
                onChange={(e) => {
                  const newHomeId = e.target.value;
                  if (typeof clearLocationData === 'function') {
                    clearLocationData();
                  }
                  setSelectedHomeId(newHomeId);
                }}
                className="form-select location-dropdown"
              >
                {homes.map((home) => {
                  const homeId = home._id || home.id;
                  return (
                    <option key={homeId} value={homeId}>
                      {home.name} ({home.city || 'CA'}{(home.zipCode || home.zip) ? ` - ${home.zipCode || home.zip}` : ''})
                    </option>
                  );
                })}
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
              📍 {activeHome.city || 'CA'} • {(activeHome.chapels || activeHome.locations)?.length || 0} {lang === 'es' ? 'capillas' : 'chapels'}
            </span>
          </div>
        )}
      </div>

      {/* PROMINENT CURRENTLY MANAGING HEADER */}
      <div
        className="currently-managing-banner"
        style={{
          background: 'linear-gradient(135deg, #183655 0%, #1e4976 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '16px 22px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(24, 54, 85, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderLeft: '6px solid #10b981',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
            }}
          >
            🏛️
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.3px',
                lineHeight: 1.25,
              }}
            >
              {lang === 'es' ? 'Administrando Actualmente: ' : 'Currently Managing: '}
              <span style={{ color: '#38bdf8' }}>{activeHomeName}</span>
            </h2>
            <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginTop: '4px' }}>
              📍 {activeHome?.streetAddress || activeHome?.address ? `${activeHome?.streetAddress || activeHome?.address}, ` : ''}{activeHome?.city || 'CA'}{activeHome?.zipCode ? ` ${activeHome?.zipCode}` : ''}
              {activeHome?.phone ? ` • 📞 ${activeHome.phone}` : ''}
            </div>
          </div>
        </div>

        {activeHome && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: activeHome.isActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                color: activeHome.isActive ? '#6ee7b7' : '#fcd34d',
                border: `1px solid ${activeHome.isActive ? '#10b981' : '#f59e0b'}`,
              }}
            >
              {activeHome.isActive ? (lang === 'es' ? '✓ Activa para Agentes' : '✓ Active for Agents') : (lang === 'es' ? '📝 Borrador (Oculta)' : '📝 Draft (Hidden)')}
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
            <span className="tab-count-badge">
              {(serviceItems || []).length}
            </span>
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
          <Button
            variant="primary"
            onClick={() => {
              if (activeTab === 'services') {
                setEditingPackage(null);
                setIsAddPackageModalOpen(true);
              } else {
                setIsAddModalOpen(true);
              }
            }}
          >
            + {lang === 'es' ? 'Agregar Artículo a esta Sede' : 'Add Item to this Location'}
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
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    marginBottom: '10px',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🏛️</span>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '15.5px',
                      fontWeight: 800,
                      color: '#15803d',
                    }}
                  >
                    {lang === 'es' ? 'Administrando Actualmente: ' : 'Currently Managing: '}
                    <span style={{ color: '#14532d', textDecoration: 'underline' }}>{activeHomeName}</span>
                  </h2>
                </div>

                <h3 className="panel-title">
                  ⚰️ {lang === 'es' ? 'Lista de Precios de Ataúdes' : 'Casket & Merchandise Rates'}
                </h3>
                <p className="panel-desc">
                  {lang === 'es'
                    ? `Precios de ataúdes asignados a ${activeHomeName}. Haga clic en el lápiz para editar o actualizar el precio.`
                    : `Casket models available for ${activeHomeName}. Click the edit icon to modify specifications or rates.`}
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
                    <th style={{ width: 130 }}>{lang === 'es' ? 'Estado' : 'Status'}</th>
                    <th style={{ width: 150 }}>{lang === 'es' ? 'Precio de Lista ($)' : 'List Price ($)'}</th>
                    <th style={{ width: 100, textAlign: 'center' }}>{lang === 'es' ? 'Acción' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCaskets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-table-cell">
                        {lang === 'es'
                          ? 'No se encontraron ataúdes para esta funeraria o filtro.'
                          : 'No casket items found for this location or filter query.'}
                      </td>
                    </tr>
                  ) : (
                    visibleCaskets.map((casket) => {
                      const hasValidPrice = casket.price !== null && casket.price !== undefined && casket.price !== '' && !isNaN(Number(casket.price));
                      const numericPrice = hasValidPrice ? Number(casket.price) : null;
                      const isPriceZero = hasValidPrice && numericPrice === 0;
                      const isPriceSet = hasValidPrice && numericPrice >= 0;
                      const isIncluded = Boolean(casket.isIncluded);
                      const isItemActive = (isPriceSet || isIncluded) && (casket.isActive !== false || isPriceZero || isIncluded);

                      return (
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
                              <div>
                                <div className="item-primary-name">{casket?.name}</div>
                                {Array.isArray(casket?.assignedPackages) && casket.assignedPackages.length > 0 && (() => {
                                  const resolvedPackageNames = casket.assignedPackages
                                    .map(resolvePackageName)
                                    .filter(Boolean);
                                  if (resolvedPackageNames.length === 0) return null;
                                  return (
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                      📦 {resolvedPackageNames.join(', ')}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="item-spec-text">
                              {[
                                casket?.constructionAndType || casket?.constructionType,
                                casket?.exteriorColor,
                                casket?.interiorFabricAndColor || casket?.interiorFabricColor,
                                casket?.manufacturer ? `Mfg: ${casket.manufacturer}` : '',
                                casket?.modelNumber ? `Model: ${casket.modelNumber}` : ''
                              ].filter(Boolean).join(' • ') || casket?.specifications || casket?.description || 'Standard funeral merchandise'}
                            </div>
                          </td>
                          <td>
                            <span className="scope-badge location">
                              {activeHome?.name || casket.home}
                            </span>
                          </td>
                          <td>
                            {isItemActive ? (
                              <span style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                ✓ {lang === 'es' ? 'Activo' : 'Active'}
                              </span>
                            ) : (
                              <span style={{
                                background: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }} title={lang === 'es' ? 'Ingrese un precio para activar este artículo para los agentes' : 'Enter a price to activate this item for agents'}>
                                ⚠️ {lang === 'es' ? 'Inactivo (Falta precio)' : 'Inactive (Set price)'}
                              </span>
                            )}
                          </td>
                          <td>
                            {isIncluded ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 10px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  letterSpacing: '0.5px',
                                  background: isItemActive ? '#ecfdf5' : '#f1f5f9',
                                  color: isItemActive ? '#047857' : '#475569',
                                  border: isItemActive ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                                }}
                                title={lang === 'es' ? 'Incluido (INCL)' : 'Included (INCL)'}
                              >
                                INCL
                              </span>
                            ) : isPriceSet ? (
                              <span className="price-tag-plain" style={{ fontWeight: 600, fontSize: 14.5, color: '#183655' }}>
                                ${Number(casket.price).toLocaleString()}
                              </span>
                            ) : (
                              <span style={{ fontWeight: 600, fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                                {lang === 'es' ? 'Sin precio' : 'Blank'}
                              </span>
                            )}
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
                              onClick={() => setDeleteTarget({ type: 'casket', id: casket.id, name: casket.name })}
                              title={lang === 'es' ? 'Eliminar ataúd' : 'Delete casket'}
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
              onEditPackage={(pkg) => {
                setEditingPackage(pkg);
                setIsAddPackageModalOpen(true);
              }}
              onDuplicatePackage={(pkg) => {
                const copiedData = { ...pkg };
                delete copiedData._id;
                delete copiedData.id;
                delete copiedData.packageId;
                delete copiedData.serviceId;
                delete copiedData.catalogId;
                delete copiedData.createdAt;
                delete copiedData.updatedAt;

                const baseName = pkg.packageName || pkg.name || '';
                const baseNameEs = pkg.packageName_es || pkg.name_es || '';
                const copySuffix = lang === 'es' ? '(Copia)' : '(Copy)';
                const copyName = baseName ? `${baseName} ${copySuffix}` : '';
                const copyNameEs = baseNameEs ? `${baseNameEs} (Copia)` : '';

                setEditingPackage({
                  ...copiedData,
                  isDuplicate: true,
                  isEdit: false,
                  packageName: copyName,
                  name: copyName,
                  packageName_es: copyNameEs,
                  name_es: copyNameEs
                });
                setIsAddPackageModalOpen(true);
              }}
              onDeletePackage={(packageId, packageName) => {
                setDeleteTarget({ type: 'package', id: packageId, name: packageName });
              }}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 3: ADD-ONS & CASH ADVANCES */}
        {activeTab === 'addons' && (
          <div className="pricing-table-container">
            <div className="panel-subheading">
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    marginBottom: '10px',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🏛️</span>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '15.5px',
                      fontWeight: 800,
                      color: '#15803d',
                    }}
                  >
                    {lang === 'es' ? 'Administrando Actualmente: ' : 'Currently Managing: '}
                    <span style={{ color: '#14532d', textDecoration: 'underline' }}>{activeHomeName}</span>
                  </h2>
                </div>

                <h3 className="panel-title">
                  🌸 {lang === 'es' ? 'Servicios Adicionales y Anticipos' : 'Add-on Services & Cash Advances'}
                </h3>
                <p className="panel-desc">
                  {lang === 'es'
                    ? `Costos de flores, libro de condolencias, suelta de palomas y servicios complementarios para ${activeHomeName}.`
                    : `Optional add-on merchandise and third-party cash advances for ${activeHomeName}.`}
                </p>
              </div>
            </div>

            <div className="table-responsive-wrapper">
              <table className="admin-data-grid">
                <thead>
                  <tr>
                    <th>{lang === 'es' ? 'Nombre del Servicio Adicional' : 'Add-on Item Name'}</th>
                    <th style={{ width: 140 }}>{lang === 'es' ? 'Asignación' : 'Assignment'}</th>
                    <th style={{ width: 130 }}>{lang === 'es' ? 'Estado' : 'Status'}</th>
                    <th style={{ width: 170 }}>{lang === 'es' ? 'Tarifa ($)' : 'Rate ($)'}</th>
                    <th style={{ width: 100, textAlign: 'center' }}>{lang === 'es' ? 'Acción' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAddons.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-table-cell">
                        {lang === 'es'
                          ? 'No se encontraron servicios adicionales para esta funeraria o filtro.'
                          : 'No add-on items found for this location or filter query.'}
                      </td>
                    </tr>
                  ) : (
                    visibleAddons.map((addon) => {
                      const hasDestinations = Boolean(addon.hasDestinations && addon.destinations?.length > 0);
                      const hasValidPrice = addon.price !== null && addon.price !== undefined && addon.price !== '' && !isNaN(Number(addon.price));
                      const numericPrice = hasValidPrice ? Number(addon.price) : null;
                      const isPriceZero = hasValidPrice && numericPrice === 0;
                      const isPriceSet = hasValidPrice && numericPrice >= 0;
                      const isIncluded = Boolean(addon.isIncluded);
                      const isItemActive = hasDestinations || ((isPriceSet || isIncluded) && (addon.isActive !== false || isPriceZero || isIncluded));

                      return (
                        <tr key={addon.id}>
                          <td>
                            <div className="item-primary-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {addon.name}
                              {addon.isMandatory && (
                                <span style={{
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 4
                                }}>
                                  {lang === 'es' ? 'OBLIGATORIO' : 'MANDATORY'}
                                </span>
                              )}
                              {hasDestinations && (
                                <span style={{
                                  background: '#e0f2fe',
                                  color: '#0369a1',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 4
                                }}>
                                  ✈️ {lang === 'es' ? 'DESTINOS' : 'DESTINATIONS'}
                                </span>
                              )}
                            </div>
                            {addon.description && (
                              <div className="item-spec-text" style={{ fontSize: 12, color: '#64748b' }}>
                                {addon.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="scope-badge location">
                              {activeHome?.name || addon.home}
                            </span>
                          </td>
                          <td>
                            {isItemActive ? (
                              <span style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                ✓ {lang === 'es' ? 'Activo' : 'Active'}
                              </span>
                            ) : (
                              <span style={{
                                background: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }} title={lang === 'es' ? 'Ingrese un precio o configure destinos para activar este artículo' : 'Enter a price or configure destinations to activate this item'}>
                                ⚠️ {lang === 'es' ? 'Inactivo (Falta precio)' : 'Inactive (Set price)'}
                              </span>
                            )}
                          </td>
                          <td>
                            {hasDestinations ? (
                              <div>
                                <span style={{ fontWeight: 600, fontSize: 13, color: '#0284c7' }}>
                                  ✈️ {addon.destinations.length} {lang === 'es' ? 'destinos' : 'destinations'}
                                </span>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                  {addon.destinations.map(d => `${d.name}: ${Number(d.defaultPrice) === 0 ? 'INCL' : `$${d.defaultPrice}`}`).join(' • ')}
                                </div>
                              </div>
                            ) : isIncluded ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 10px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  letterSpacing: '0.5px',
                                  background: isItemActive ? '#ecfdf5' : '#f1f5f9',
                                  color: isItemActive ? '#047857' : '#475569',
                                  border: isItemActive ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                                }}
                                title={lang === 'es' ? 'Incluido (INCL)' : 'Included (INCL)'}
                              >
                                INCL
                              </span>
                            ) : isPriceSet ? (
                              <span className="price-tag-plain" style={{ fontWeight: 600, fontSize: 14.5, color: '#183655' }}>
                                ${Number(addon.price).toLocaleString()}
                              </span>
                            ) : (
                              <span style={{ fontWeight: 600, fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                                {lang === 'es' ? 'Sin precio' : 'Blank'}
                              </span>
                            )}
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
                              onClick={() => setDeleteTarget({ type: 'addon', id: addon.id, name: addon.name })}
                              title={lang === 'es' ? 'Eliminar adicional' : 'Delete add-on'}
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
        homes={homes}
        serviceItems={serviceItems}
        lang={lang}
      />

      {/* 5. MODAL: ADD / EDIT CUSTOM SERVICE PACKAGE */}
      <AddServicePackageModal
        isOpen={isAddPackageModalOpen}
        onClose={() => {
          setIsAddPackageModalOpen(false);
          setEditingPackage(null);
        }}
        onSavePackage={async (pkgData) => {
          const isEditMode = Boolean(
            editingPackage &&
            !editingPackage.isDuplicate &&
            editingPackage.isEdit !== false &&
            (pkgData.packageId || editingPackage._id || editingPackage.id)
          );
          if (isEditMode) {
            return await handleUpdateServicePackage({
              ...pkgData,
              packageId: pkgData.packageId || editingPackage._id || editingPackage.id || editingPackage.serviceId,
              homeId: currentHomeId
            });
          }
          return await handleAddServicePackage({ ...pkgData, homeId: currentHomeId });
        }}
        editingPackage={editingPackage}
        locationName={activeHome?.name || 'Selected Funeral Home'}
        locationId={currentHomeId}
        lang={lang}
      />

      {/* 6. MODAL: EDIT ITEM */}
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
        locationId={currentHomeId}
        homes={homes}
        serviceItems={serviceItems}
        lang={lang}
      />

      {/* 7. MODAL: CONFIRM DELETION POPUP */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.name}
        title={
          deleteTarget?.type === 'casket'
            ? (lang === 'es' ? '¿Eliminar Ataúd?' : 'Delete Casket?')
            : deleteTarget?.type === 'package'
            ? (lang === 'es' ? '¿Eliminar Paquete de Servicio?' : 'Delete Service Package?')
            : (lang === 'es' ? '¿Eliminar Servicio Adicional?' : 'Delete Add-on Item?')
        }
        isDeleting={isDeleting}
        lang={lang}
      />
    </div>
  );
}
