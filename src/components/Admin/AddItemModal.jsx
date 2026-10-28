import React, { useState, useEffect } from 'react';
import InputField from '../common/InputField.jsx';
import SelectDropdown from '../common/SelectDropdown.jsx';
import Button from '../common/Button.jsx';
import ImageUpload from './ImageUpload.jsx';

const DEFAULT_PACKAGE_OPTIONS = [
  'Two-day service',
  'One-day service',
  'Traditional Cremation',
  'Memorial Cremation',
  'Direct Cremation',
  'Forwarding of Remains'
];

export default function AddItemModal({
  isOpen,
  onClose,
  onAddItem,
  locationName = '',
  locationId = '',
  defaultCategory = 'casket',
  homes = [],
  serviceItems = [],
  lang = 'en'
}) {
  const [name, setName] = useState('');
  const [itemName_es, setItemName_es] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  // Casket assignment & packages
  const [assignedFuneralHomeId, setAssignedFuneralHomeId] = useState(locationId || '');
  const [assignedPackages, setAssignedPackages] = useState([]);

  // Add-on configuration flags
  const [isMandatory, setIsMandatory] = useState(false);
  const [isFixedPrice, setIsFixedPrice] = useState(false);
  const [type, setType] = useState('Non-Guaranteed'); // Default non-guaranteed for add-ons
  const [hasDestinations, setHasDestinations] = useState(false);
  const [destinations, setDestinations] = useState([
    { name: 'North America', defaultPrice: 1000 },
    { name: 'South America', defaultPrice: 1500 },
    { name: 'Europe', defaultPrice: 2000 },
    { name: 'Asia', defaultPrice: 2000 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Extract all available package choices (default + any custom ones)
  const availablePackages = React.useMemo(() => {
    const set = new Set(DEFAULT_PACKAGE_OPTIONS);
    if (Array.isArray(serviceItems)) {
      serviceItems.forEach(s => {
        const pName = s.packageName || s.name;
        if (pName) set.add(pName);
      });
    }
    return Array.from(set);
  }, [serviceItems]);

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
      setAssignedFuneralHomeId(locationId || '');
      setName('');
      setItemName_es('');
      setPrice('');
      setDescription('');
      setImage('');
      setAssignedPackages([]);
      setIsMandatory(false);
      setIsFixedPrice(false);
      setType(defaultCategory === 'casket' ? 'Guaranteed' : 'Non-Guaranteed');
      setHasDestinations(false);
      setDestinations([
        { name: 'North America', defaultPrice: 1000 },
        { name: 'South America', defaultPrice: 1500 },
        { name: 'Europe', defaultPrice: 2000 },
        { name: 'Asia', defaultPrice: 2000 }
      ]);
      setError('');
    }
  }, [isOpen, defaultCategory, locationId]);

  if (!isOpen) return null;

  const togglePackage = (pkg) => {
    setAssignedPackages(prev => {
      if (prev.includes(pkg)) {
        return prev.filter(p => p !== pkg);
      } else {
        return [...prev, pkg];
      }
    });
  };

  const selectAllPackages = () => {
    if (assignedPackages.length === availablePackages.length) {
      setAssignedPackages([]);
    } else {
      setAssignedPackages([...availablePackages]);
    }
  };

  const handleAddDestination = () => {
    setDestinations(prev => [...prev, { name: '', defaultPrice: 0 }]);
  };

  const handleRemoveDestination = (idx) => {
    setDestinations(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDestinationChange = (idx, field, value) => {
    setDestinations(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: field === 'defaultPrice' ? Math.max(0, Number(value) || 0) : value
      };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(lang === 'es' ? 'El nombre del artículo es obligatorio.' : 'Item name is required.');
      return;
    }

    if (category === 'addon' && hasDestinations) {
      const validDests = destinations.filter(d => (d.name || '').trim());
      if (validDests.length === 0) {
        setError(lang === 'es' ? 'Agregue al menos un destino con su precio.' : 'Please add at least one destination with a default price.');
        return;
      }
    } else {
      const parsedPrice = price === '' ? 0 : Number(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        setError(lang === 'es' ? 'Ingrese un precio válido.' : 'Please enter a valid price.');
        return;
      }
    }

    const resolvedPrice = (category === 'addon' && hasDestinations)
      ? (destinations[0]?.defaultPrice || 0)
      : (price === '' ? 0 : Number(price));

    setIsSubmitting(true);
    const success = await onAddItem({
      name,
      itemName_es: itemName_es.trim(),
      name_es: itemName_es.trim(),
      price: resolvedPrice,
      category,
      homeId: assignedFuneralHomeId || locationId,
      assignedFuneralHomeId: assignedFuneralHomeId || locationId,
      assignedPackages: category === 'casket' ? assignedPackages : [],
      isMandatory: category === 'addon' ? isMandatory : false,
      isFixedPrice: category === 'addon' ? isFixedPrice : false,
      hasDestinations: category === 'addon' ? hasDestinations : false,
      destinations: (category === 'addon' && hasDestinations)
        ? destinations.filter(d => (d.name || '').trim())
        : [],
      type: category === 'addon' ? type : 'Guaranteed',
      description,
      image: category === 'casket' ? image : ''
    });
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container add-item-modal"
        style={{ maxWidth: 620 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              ➕ {lang === 'es' ? 'Agregar Artículo al Catálogo' : 'Add Item to Catalog'}
            </h2>
            <p className="modal-subtitle">
              {category === 'casket'
                ? (lang === 'es' ? 'Configure modelo, asignación de funeraria y paquetes de servicio.' : 'Configure model, funeral home assignment, and applicable packages.')
                : (lang === 'es' ? 'Configure tarifas obligatorias, fijas y clasificación de garantía.' : 'Configure mandatory/fixed rates and guaranteed classification.')}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-body">
          {error && <div className="modal-alert-error">⚠️ {error}</div>}

          {/* Row 1: Item Type & List Price */}
          <div className="form-grid-two">
            <SelectDropdown
              label={lang === 'es' ? 'Tipo de Artículo' : 'Item Type'}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (e.target.value !== 'casket') setImage('');
              }}
              options={[
                ['casket', lang === 'es' ? '⚰️ Ataúd / Mercancía' : '⚰️ Casket / Merchandise'],
                ['addon', lang === 'es' ? '🌸 Servicio Adicional / Anticipo' : '🌸 Add-on Service / Cash Advance']
              ]}
            />
            <InputField
              label={hasDestinations ? (lang === 'es' ? 'Tarifa Base / Destino ($)' : 'Base Rate / Destination ($)') : (lang === 'es' ? 'Precio de Lista ($)' : 'List Price ($)')}
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={hasDestinations}
              hint={hasDestinations ? (lang === 'es' ? 'Determinado por el destino seleccionado abajo' : 'Determined by the destination selected below') : ''}
              required={!hasDestinations}
            />
          </div>

          {/* Row 2: Assigned Funeral Home Dropdown */}
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#334155' }}>
              {lang === 'es' ? 'Asignado a Funeraria' : 'Assigned Funeral Home'}
            </label>
            <select
              className="form-select"
              value={assignedFuneralHomeId || locationId}
              onChange={(e) => setAssignedFuneralHomeId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
            >
              {homes.map((h) => (
                <option key={h.id || h._id} value={h.id || h._id}>
                  🏛️ {h.name} {h.city ? `(${h.city})` : ''}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 11.5, color: '#64748b', display: 'block', marginTop: 4 }}>
              {lang === 'es'
                ? 'El artículo tiene precios y disponibilidad exclusivos para esta sede funeraria.'
                : 'All pricing and availability are strictly independent for this funeral home.'}
            </span>
          </div>

          {/* CASKET SPECIFIC: Multi-select Service Packages */}
          {category === 'casket' && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13, color: '#334155', margin: 0 }}>
                  {lang === 'es' ? 'Paquetes de Servicio Asignados' : 'Assigned Service Packages'}
                </label>
                <button
                  type="button"
                  onClick={selectAllPackages}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {assignedPackages.length === availablePackages.length
                    ? (lang === 'es' ? 'Deseleccionar todos' : 'Clear all')
                    : (lang === 'es' ? 'Seleccionar todos' : 'Select all')}
                </button>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 7,
                padding: '10px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                maxHeight: 140,
                overflowY: 'auto'
              }}>
                {availablePackages.map(pkg => {
                  const isSelected = assignedPackages.includes(pkg);
                  return (
                    <button
                      key={pkg}
                      type="button"
                      onClick={() => togglePackage(pkg)}
                      style={{
                        background: isSelected ? '#4f46e5' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#334155',
                        border: isSelected ? '1px solid #4338ca' : '1px solid #cbd5e1',
                        borderRadius: 20,
                        padding: '4px 11px',
                        fontSize: 12,
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{pkg}</span>
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: 11.5, color: '#64748b', display: 'block', marginTop: 4 }}>
                {assignedPackages.length === 0
                  ? (lang === 'es' ? '💡 Sin seleccionar = Disponible para todos los paquetes funerarios.' : '💡 None selected = Available for all funeral service packages.')
                  : (lang === 'es' ? `Asignado a ${assignedPackages.length} paquete(s) específico(s).` : `Mapped strictly to ${assignedPackages.length} selected package(s).`)}
              </span>
            </div>
          )}

          {/* ADD-ON SPECIFIC: Mandatory, Fixed Price & Classification */}
          {category === 'addon' && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 16
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 10 }}>
                ⚙️ {lang === 'es' ? 'Reglas de Cotización y Cobro' : 'Pricing & Funnel Rules'}
              </div>

              {/* Item Category dropdown */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  {lang === 'es' ? 'Categoría del Artículo' : 'Item Category'}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                >
                  <option value="Guaranteed">🛡️ {lang === 'es' ? 'Mercancía Garantizada' : 'Guaranteed Merchandise'}</option>
                  <option value="Non-Guaranteed">📋 {lang === 'es' ? 'Anticipo No Garantizado' : 'Non-Guaranteed Cash Advance'}</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                  />
                  <span>
                    <strong>{lang === 'es' ? 'Artículo Obligatorio (No se puede remover)' : 'Mandatory Item (Cannot be removed)'}</strong>
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isFixedPrice}
                    onChange={(e) => setIsFixedPrice(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                  />
                  <span>
                    <strong>{lang === 'es' ? '¿Es Precio Fijo?' : 'Is Fixed Price?'}</strong>
                    <span style={{ color: '#64748b', fontSize: 12, marginLeft: 4 }}>
                      {lang === 'es' ? '(No puede ser editado por el agente)' : '(Cannot be edited by agent)'}
                    </span>
                  </span>
                </label>

                {/* Destination Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1e293b', cursor: 'pointer', marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={hasDestinations}
                    onChange={(e) => setHasDestinations(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#0284c7' }}
                  />
                  <span>
                    <strong>{lang === 'es' ? '✈️ Requiere Selección de Destino (ej. Boleto de avión)' : '✈️ Requires Destination Selection (e.g., Airfare)'}</strong>
                  </span>
                </label>

                {/* Dynamic Destination List Builder */}
                {hasDestinations && (
                  <div style={{
                    marginTop: 8,
                    padding: '12px',
                    background: '#ffffff',
                    border: '1px solid #bae6fd',
                    borderRadius: 8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1' }}>
                        {lang === 'es' ? 'Destinos y Tarifas Predeterminadas' : 'Destinations & Default Rates'}
                      </span>
                      <button
                        type="button"
                        onClick={handleAddDestination}
                        style={{
                          background: '#e0f2fe',
                          border: '1px solid #7dd3fc',
                          color: '#0369a1',
                          borderRadius: 6,
                          padding: '3px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        + {lang === 'es' ? 'Agregar Destino' : 'Add Destination'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {destinations.map((dest, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder={lang === 'es' ? 'Nombre del destino (ej. North America)' : 'Destination name (e.g. North America)'}
                            value={dest.name}
                            onChange={(e) => handleDestinationChange(idx, 'name', e.target.value)}
                            style={{ flex: 2, padding: '7px 9px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                            <span style={{ fontSize: 13, color: '#64748b' }}>$</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={dest.defaultPrice}
                              onWheel={(e) => e.target.blur()}
                              onKeyDown={(e) => {
                                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => handleDestinationChange(idx, 'defaultPrice', e.target.value)}
                              style={{ width: '100%', padding: '7px 9px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDestination(idx)}
                            style={{
                              background: '#fee2e2',
                              border: '1px solid #fecaca',
                              color: '#b91c1c',
                              borderRadius: 6,
                              padding: '6px 9px',
                              fontSize: 12,
                              cursor: 'pointer'
                            }}
                            title={lang === 'es' ? 'Eliminar destino' : 'Remove destination'}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Upload for Caskets */}
          {category === 'casket' && (
            <div style={{ marginBottom: 14 }}>
              <ImageUpload
                label={lang === 'es' ? 'Fotografía del Ataúd / Mercancía' : 'Casket / Merchandise Photo'}
                value={image}
                onChange={(imgUrl) => setImage(imgUrl)}
                hint={lang === 'es'
                  ? 'Suba una foto clara del modelo de ataúd (JPG, PNG, WebP hasta 4MB).'
                  : 'Upload a clear photograph of the casket model (JPG, PNG, WebP up to 4MB).'}
              />
            </div>
          )}

          <InputField
            label={lang === 'es' ? 'Nombre del Artículo' : 'Item Name'}
            placeholder={category === 'casket' ? 'e.g. Royal Oak Hardwood' : 'e.g. Professional Limousine Service'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <InputField
            label={category === 'casket'
              ? (lang === 'es' ? 'Nombre del Ataúd (Español)' : 'Casket Name (Spanish)')
              : (lang === 'es' ? 'Nombre del Adicional (Español)' : 'Add-on Name (Spanish)')}
            placeholder={category === 'casket' ? 'e.g. Roble Real' : 'e.g. Servicio de Limusina Profesional'}
            value={itemName_es}
            onChange={(e) => setItemName_es(e.target.value)}
            hint={lang === 'es' ? 'Opcional — traducción visible para agentes y cotizaciones en español' : 'Optional — visible when language is set to Spanish'}
          />

          {category === 'casket' && (
            <InputField
              label={lang === 'es' ? 'Especificaciones / Material' : 'Specifications & Material'}
              placeholder="e.g. 18 Gauge Steel, Velvet Interior, Brushed Finish"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}

          <div className="modal-actions-footer">
            <Button
              variant="default"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={isSubmitting}
            >
              {lang === 'es' ? 'Agregar al Catálogo' : 'Add to Catalog'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
