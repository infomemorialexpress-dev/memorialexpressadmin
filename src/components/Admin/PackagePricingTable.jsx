import React from 'react';
import { LEGACY_DATA } from '../../utils/legacyData.js';
import { formatMoney } from '../../utils/quoteLogic.js';

export default function PackagePricingTable({
  homeId,
  packages = {},
  serviceItems = [],
  isLoadingServices = false,
  onPackageChange,
  lang = 'en'
}) {
  // If backend returns serviceItems, map them to standard tuples; otherwise fallback to LEGACY_DATA.SERVICES
  const serviceList = (Array.isArray(serviceItems) && serviceItems.length > 0)
    ? serviceItems.map(item => {
        const nameLower = (item.name || '').toLowerCase();
        let svcSlug = '';
        if (nameLower.includes('two-day') || nameLower.includes('two day') || nameLower.includes('2 day')) svcSlug = 'two_day';
        else if (nameLower.includes('one-day') || nameLower.includes('one day') || nameLower.includes('1 day')) svcSlug = 'one_day';
        else if (nameLower.includes('traditional cremation')) svcSlug = 'traditional_cremation';
        else if (nameLower.includes('memorial cremation')) svcSlug = 'memorial_cremation';
        else if (nameLower.includes('direct cremation')) svcSlug = 'direct_cremation';
        else if (nameLower.includes('ship out with') || nameLower.includes('ship traditional')) svcSlug = 'ship_traditional';
        else if (nameLower.includes('direct ship') || nameLower.includes('ship')) svcSlug = 'ship_direct';
        else svcSlug = item._id;

        return [svcSlug, item.name, item];
      })
    : (LEGACY_DATA.SERVICES || []).map(([id, label]) => [id, label, null]);

  return (
    <div className="table-responsive-wrapper">
      {isLoadingServices && (
        <div style={{ padding: '8px 12px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #cbd5e1', borderTopColor: '#183655', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          {lang === 'es' ? 'Sincronizando paquetes con MongoDB Atlas...' : 'Syncing service packages with MongoDB Atlas...'}
        </div>
      )}
      <table className="admin-data-grid">
        <thead>
          <tr>
            <th>{lang === 'es' ? 'Paquete de Servicio Funerario' : 'Funeral Service Package'}</th>
            <th style={{ width: 140 }}>{lang === 'es' ? 'Tipo' : 'Category'}</th>
            <th style={{ width: 160 }}>
              {lang === 'es' ? 'Sección 1 (Servicios)' : 'Section 1 (Services)'}
            </th>
            <th style={{ width: 160 }}>
              {lang === 'es' ? 'Sección 2 (Instalaciones)' : 'Section 2 (Facilities)'}
            </th>
            <th style={{ width: 150, textAlign: 'right' }}>
              {lang === 'es' ? 'Tarifa Total Base' : 'Total Package Rate'}
            </th>
          </tr>
        </thead>
        <tbody>
          {serviceList.map(([serviceId, serviceLabel, rawItem]) => {
            const packageKey = `${homeId}|${serviceId}`;
            const pkg = packages[packageKey] || {};
            
            // Priority: packages[packageKey] -> rawItem -> 0
            const s1 = Number(pkg.section1 !== undefined ? pkg.section1 : (rawItem?.section1Price ?? 0)) || 0;
            const s2 = Number(pkg.section2 !== undefined ? pkg.section2 : (rawItem?.section2Price ?? 0)) || 0;
            const total = s1 + s2;
            const hasAtlasRecord = Boolean(pkg.catalogId || rawItem?._id);

            const isCremation = serviceId.includes('cremation');
            const isShip = serviceId.includes('ship');

            return (
              <tr key={serviceId}>
                <td>
                  <div style={{ fontWeight: 650, color: '#183655', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {serviceLabel}
                    {hasAtlasRecord && (
                      <span
                        title="Live MongoDB Atlas Record"
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          padding: '1px 6px',
                          borderRadius: '10px',
                        }}
                      >
                        MongoDB
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>
                    ID: {rawItem?._id ? `${rawItem._id.slice(-6)} (${packageKey})` : packageKey}
                  </div>
                </td>
                <td>
                  <span
                    className={`badge-tag ${
                      isCremation ? 'cremation' : isShip ? 'ship' : 'traditional'
                    }`}
                  >
                    {isCremation
                      ? (lang === 'es' ? 'Cremación' : 'Cremation')
                      : isShip
                      ? (lang === 'es' ? 'Traslado' : 'Ship-Out')
                      : (lang === 'es' ? 'Tradicional' : 'Traditional')}
                  </span>
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
                  <span className="total-highlight">
                    {formatMoney(total)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
