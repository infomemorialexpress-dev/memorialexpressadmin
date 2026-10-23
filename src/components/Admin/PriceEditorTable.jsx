import React from 'react';
import { formatMoney } from '../../utils/quoteLogic.js';

export default function PriceEditorTable({
  activeTab, // 'caskets' | 'addons'
  caskets = [],
  addons = [],
  onCasketPriceChange,
  onAddonPriceChange,
  lang = 'en'
}) {
  if (activeTab === 'caskets') {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-data-grid">
          <thead>
            <tr>
              <th>{lang === 'es' ? 'Ataúd / Mercancía' : 'Casket / Model'}</th>
              <th>{lang === 'es' ? 'Detalles y Material' : 'Specifications'}</th>
              <th>{lang === 'es' ? 'Precio de Lista ($)' : 'Price ($)'}</th>
              <th>{lang === 'es' ? 'Precio Actual' : 'Current'}</th>
            </tr>
          </thead>
          <tbody>
            {caskets.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>
                  {lang === 'es' ? 'No se encontraron ataúdes para este filtro.' : 'No caskets found for this filter.'}
                </td>
              </tr>
            ) : (
              caskets.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 650, color: '#183655' }}>{c.name}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{c.description || 'Standard model'}</td>
                  <td>
                    <input
                      type="number"
                      step="1"
                      className="admin-table-input"
                      defaultValue={c.price}
                      onBlur={(e) => onCasketPriceChange(c.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: '#16803b', fontWeight: 600 }}>
                      {formatMoney(c.price)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-data-grid">
        <thead>
          <tr>
            <th>{lang === 'es' ? 'Servicio Adicional' : 'Item Name'}</th>
            <th>{lang === 'es' ? 'Funeraria Asignada' : 'Assigned Home'}</th>
            <th>{lang === 'es' ? 'Tarifa ($)' : 'Rate ($)'}</th>
            <th>{lang === 'es' ? 'Precio Actual' : 'Current'}</th>
          </tr>
        </thead>
        <tbody>
          {addons.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>
                {lang === 'es' ? 'No se encontraron adicionales para este filtro.' : 'No add-ons found for this filter.'}
              </td>
            </tr>
          ) : (
            addons.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 650, color: '#183655' }}>{a.name}</td>
                <td style={{ color: '#64748b', fontSize: 12 }}>{a.home === '*' ? 'All Homes (*)' : a.home}</td>
                <td>
                  <input
                    type="number"
                    step="1"
                    className="admin-table-input"
                    defaultValue={a.price}
                    onBlur={(e) => onAddonPriceChange(a.id, e.target.value)}
                  />
                </td>
                <td>
                  <span style={{ fontSize: 12, color: '#16803b', fontWeight: 600 }}>
                    {formatMoney(a.price)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
