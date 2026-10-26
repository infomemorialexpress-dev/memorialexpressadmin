import React from 'react';
import { formatMoney } from '../../utils/quoteLogic.js';

export default function PackagePricingTable({
  homeId,
  packages = {},
  serviceItems = [],
  isLoadingServices = false,
  onPackageChange,
  onDeletePackage,
  lang = 'en'
}) {
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

  const rows = (serviceItems || []).map((item) => {
    const serviceId = item._id || item.id;
    const serviceLabel = item.packageName || item.name || 'Funeral Service Package';
    const category = item.category || 'Traditional';
    const packageKey = `${homeId}|${serviceId}`;
    const pkg = packages[packageKey] || {};

    const s1 = Number(pkg.section1 !== undefined ? pkg.section1 : (item.section1Price ?? 0)) || 0;
    const s2 = Number(pkg.section2 !== undefined ? pkg.section2 : (item.section2Price ?? 0)) || 0;
    const total = s1 + s2;

    return {
      serviceId,
      serviceLabel,
      category,
      rawItem: item,
      s1,
      s2,
      total,
      packageKey,
      isCustom: Boolean(item.isCustom)
    };
  });

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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b', fontSize: '14px' }}>
                {lang === 'es'
                  ? 'No hay paquetes de servicios funerarios configurados en la base de datos para esta funeraria. Haga clic en "+ Agregar Artículo a esta Sede" para crear uno.'
                  : 'No funeral service packages configured in the database for this location yet. Click "+ Add Item to this Location" above to create one.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const { serviceId, serviceLabel, category, isCustom, s1, s2, total, packageKey } = row;

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
                        min="0"
                        step="1"
                        className="admin-table-input"
                        defaultValue={s1}
                        key={`${packageKey}_s1_${s1}`}
                        onWheel={(e) => e.target.blur()}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }}
                        onBlur={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          e.target.value = val;
                          onPackageChange(homeId, serviceId, 'section1', val);
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="table-input-currency">
                      <span className="currency-symbol">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="admin-table-input"
                        defaultValue={s2}
                        key={`${packageKey}_s2_${s2}`}
                        onWheel={(e) => e.target.blur()}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }}
                        onBlur={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          e.target.value = val;
                          onPackageChange(homeId, serviceId, 'section2', val);
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="total-highlight" style={{ fontSize: '15px', fontWeight: 750, color: '#183655' }}>
                      {formatMoney(total)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="delete-icon-btn"
                      onClick={() => {
                        if (
                          window.confirm(
                            lang === 'es'
                              ? `¿Eliminar paquete de servicio "${serviceLabel}" de la base de datos?`
                              : `Delete service package "${serviceLabel}" from the database?`
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
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
