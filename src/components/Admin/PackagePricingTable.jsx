import React from 'react';
import { formatMoney } from '../../utils/quoteLogic.js';

// Canonical base services definition
const CANONICAL_SERVICES = [
  { id: 'direct_cremation', label: 'Direct cremation', category: 'Cremation', defaultS1: 0, defaultS2: 0 },
  { id: 'ship_direct', label: 'Direct ship out', category: 'Ship-Out', defaultS1: 0, defaultS2: 0 },
  { id: 'memorial_cremation', label: 'Memorial cremation', category: 'Cremation', defaultS1: 0, defaultS2: 0 },
  { id: 'one_day', label: 'One-day service funeral', category: 'Traditional', defaultS1: 0, defaultS2: 0 },
  { id: 'ship_traditional', label: 'Ship out with funeral', category: 'Ship-Out', defaultS1: 0, defaultS2: 0 },
  { id: 'traditional_cremation', label: 'Traditional cremation', category: 'Cremation', defaultS1: 0, defaultS2: 0 },
  { id: 'two_day', label: 'Two-day service', category: 'Traditional', defaultS1: 0, defaultS2: 0 },
];

export default function PackagePricingTable({
  homeId,
  packages = {},
  serviceItems = [],
  isLoadingServices = false,
  onPackageChange,
  onDeletePackage,
  lang = 'en'
}) {
  // Identify canonical slugs
  const canonicalSlugs = new Set(CANONICAL_SERVICES.map(s => s.id));

  // Build full dynamic list: standard services first, then any custom service packages
  const standardRows = CANONICAL_SERVICES.map(std => {
    // Check if live item exists in serviceItems matching this canonical service
    const matchedItem = (serviceItems || []).find(item => {
      const nameLower = (item.name || item.packageName || '').toLowerCase();
      if (std.id === 'direct_cremation' && nameLower.includes('direct cremation')) return true;
      if (std.id === 'ship_direct' && nameLower.includes('direct ship')) return true;
      if (std.id === 'memorial_cremation' && nameLower.includes('memorial cremation')) return true;
      if (std.id === 'one_day' && nameLower.includes('one')) return true;
      if (std.id === 'ship_traditional' && nameLower.includes('ship out with')) return true;
      if (std.id === 'traditional_cremation' && nameLower.includes('traditional cremation')) return true;
      if (std.id === 'two_day' && nameLower.includes('two')) return true;
      return false;
    });

    return {
      serviceId: std.id,
      serviceLabel: matchedItem?.name || matchedItem?.packageName || std.label,
      category: matchedItem?.category || std.category,
      rawItem: matchedItem || null,
      isCustom: false,
      defaultS1: std.defaultS1,
      defaultS2: std.defaultS2,
    };
  });

  // Extract custom packages from serviceItems
  const customRows = (serviceItems || [])
    .filter(item => {
      const nameLower = (item.name || item.packageName || '').toLowerCase();
      const matchesStandard =
        nameLower.includes('direct cremation') ||
        nameLower.includes('direct ship') ||
        nameLower.includes('memorial cremation') ||
        nameLower.includes('one-day') ||
        nameLower.includes('one day') ||
        nameLower.includes('ship out with') ||
        nameLower.includes('traditional cremation') ||
        nameLower.includes('two-day') ||
        nameLower.includes('two day');

      return item.isCustom || (!matchesStandard && !canonicalSlugs.has(item._id || item.id));
    })
    .map(item => {
      const id = item._id || item.id;
      return {
        serviceId: id,
        serviceLabel: item.packageName || item.name || 'Custom Package',
        category: item.category || 'Traditional',
        rawItem: item,
        isCustom: true,
        defaultS1: Number(item.section1Price) || 0,
        defaultS2: Number(item.section2Price) || 0,
      };
    });

  const fullList = [...standardRows, ...customRows];

  const getCategoryBadge = (categoryStr) => {
    const cat = String(categoryStr || 'Traditional').toLowerCase();
    if (cat.includes('cremat')) {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 650,
            backgroundColor: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a',
            textTransform: 'capitalize'
          }}
        >
          {lang === 'es' ? 'Cremación' : 'Cremation'}
        </span>
      );
    }
    if (cat.includes('ship')) {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 650,
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
            textTransform: 'capitalize'
          }}
        >
          {lang === 'es' ? 'Traslado' : 'Ship-Out'}
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 650,
          backgroundColor: '#eff6ff',
          color: '#1d4ed8',
          border: '1px solid #dbeafe',
          textTransform: 'capitalize'
        }}
      >
        {lang === 'es' ? 'Tradicional' : 'Traditional'}
      </span>
    );
  };

  return (
    <div className="table-responsive-wrapper">
      {isLoadingServices && (
        <div style={{ padding: '8px 12px', fontSize: '12px', color: '#183655', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <span className="app-spinner" style={{ width: '13px', height: '13px', borderWidth: '2px', borderColor: '#cbd5e1', borderTopColor: '#183655' }} />
          {lang === 'es' ? 'Sincronizando paquetes con la base de datos...' : 'Syncing service packages with database...'}
        </div>
      )}
      <table className="admin-data-grid">
        <thead>
          <tr>
            <th>{lang === 'es' ? 'Paquete de Servicio Funerario' : 'Funeral Service Package'}</th>
            <th style={{ width: 140 }}>{lang === 'es' ? 'Categoría' : 'Category'}</th>
            <th style={{ width: 160 }}>
              {lang === 'es' ? 'Sección 1 (Servicios)' : 'Section 1 (Services)'}
            </th>
            <th style={{ width: 160 }}>
              {lang === 'es' ? 'Sección 2 (Instalaciones)' : 'Section 2 (Facilities)'}
            </th>
            <th style={{ width: 150, textAlign: 'right' }}>
              {lang === 'es' ? 'Tarifa Total Base' : 'Total Package Rate'}
            </th>
            <th style={{ width: 80, textAlign: 'center' }}>
              {lang === 'es' ? 'Acción' : 'Action'}
            </th>
          </tr>
        </thead>
        <tbody>
          {fullList.map((row) => {
            const { serviceId, serviceLabel, category, rawItem, isCustom, defaultS1, defaultS2 } = row;
            const packageKey = `${homeId}|${serviceId}`;
            const pkg = packages[packageKey] || {};

            // Value resolution priority: package entry -> rawItem -> defaultS
            const s1 = Number(pkg.section1 !== undefined ? pkg.section1 : (rawItem?.section1Price ?? defaultS1)) || 0;
            const s2 = Number(pkg.section2 !== undefined ? pkg.section2 : (rawItem?.section2Price ?? defaultS2)) || 0;
            const total = s1 + s2;

            return (
              <tr key={serviceId}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 650, color: '#183655' }}>
                      {serviceLabel}
                    </div>
                    {isCustom && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {lang === 'es' ? 'Personalizado' : 'Custom'}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {getCategoryBadge(category)}
                </td>
                <td>
                  <div className="table-input-currency">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      step="1"
                      className="admin-table-input"
                      defaultValue={s1}
                      key={`${packageKey}_s1_${s1}`}
                      onBlur={(e) => onPackageChange(homeId, serviceId, 'section1', e.target.value)}
                    />
                  </div>
                </td>
                <td>
                  <div className="table-input-currency">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      step="1"
                      className="admin-table-input"
                      defaultValue={s2}
                      key={`${packageKey}_s2_${s2}`}
                      onBlur={(e) => onPackageChange(homeId, serviceId, 'section2', e.target.value)}
                    />
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="total-highlight" style={{ fontSize: '15px', fontWeight: 750, color: '#183655' }}>
                    {formatMoney(total)}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {isCustom ? (
                    <button
                      type="button"
                      className="delete-icon-btn"
                      onClick={() => {
                        if (
                          window.confirm(
                            lang === 'es'
                              ? `¿Eliminar paquete de servicio "${serviceLabel}"?`
                              : `Delete service package "${serviceLabel}"?`
                          )
                        ) {
                          if (onDeletePackage) {
                            onDeletePackage(serviceId);
                          }
                        }
                      }}
                      title={lang === 'es' ? 'Eliminar paquete' : 'Delete package'}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: '#dc2626',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      🗑️
                    </button>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
