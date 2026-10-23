import React from 'react';
import { LEGACY_DATA } from '../../utils/legacyData.js';
import { formatMoney } from '../../utils/quoteLogic.js';

export default function PackagePricingTable({
  homeId,
  packages = {},
  onPackageChange,
  lang = 'en'
}) {
  const serviceList = LEGACY_DATA.SERVICES || [];

  return (
    <div className="table-responsive-wrapper">
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
          {serviceList.map(([serviceId, serviceLabel]) => {
            const packageKey = `${homeId}|${serviceId}`;
            const pkg = packages[packageKey] || { section1: 0, section2: 0, verified: true };
            const s1 = Number(pkg.section1) || 0;
            const s2 = Number(pkg.section2) || 0;
            const total = s1 + s2;

            const isCremation = serviceId.includes('cremation');
            const isShip = serviceId.includes('ship');

            return (
              <tr key={serviceId}>
                <td>
                  <div style={{ fontWeight: 650, color: '#183655' }}>
                    {serviceLabel}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>
                    Key: {packageKey}
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
