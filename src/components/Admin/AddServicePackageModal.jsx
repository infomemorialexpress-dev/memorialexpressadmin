import React, { useState, useEffect } from 'react';
import InputField from '../common/InputField.jsx';
import SelectDropdown from '../common/SelectDropdown.jsx';
import Button from '../common/Button.jsx';
import { formatMoney } from '../../utils/quoteLogic.js';

export default function AddServicePackageModal({
  isOpen,
  onClose,
  onSavePackage,
  editingPackage = null,
  locationName = '',
  locationId = '',
  lang = 'en'
}) {
  const [packageName, setPackageName] = useState('');
  const [packageName_es, setPackageName_es] = useState('');
  const [category, setCategory] = useState('Traditional');
  const [category_es, setCategory_es] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');

  // Itemized Services Breakdown state
  const [arrangements, setArrangements] = useState('2050');
  const [transfer, setTransfer] = useState('695');
  const [embalming, setEmbalming] = useState('525');
  const [otherPreparation, setOtherPreparation] = useState('200');
  const [visitation, setVisitation] = useState('300');
  const [visitationHours, setVisitationHours] = useState('3');
  const [funeralService, setFuneralService] = useState('150');
  const [eveningService, setEveningService] = useState('0');
  const [familyCar, setFamilyCar] = useState('0');
  const [funeralCoach, setFuneralCoach] = useState('375');
  const [utilityVehicles, setUtilityVehicles] = useState('100');

  // Exactly 6 custom 'Other Services' rows
  const [otherServices, setOtherServices] = useState([
    { name: '', customName_es: '', price: '' },
    { name: '', customName_es: '', price: '' },
    { name: '', customName_es: '', price: '' },
    { name: '', customName_es: '', price: '' },
    { name: '', customName_es: '', price: '' },
    { name: '', customName_es: '', price: '' }
  ]);

  const [packageSavings, setPackageSavings] = useState('1000');

  // Section 2 Facilities & Automotive
  const [section2Price, setSection2Price] = useState('0');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleOtherServiceChange = (index, field, value) => {
    setOtherServices(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Pre-fill fields whenever modal opens or editingPackage changes
  useEffect(() => {
    if (isOpen) {
      if (editingPackage) {
        setPackageName(editingPackage.packageName || editingPackage.name || editingPackage.serviceLabel || '');
        setPackageName_es(editingPackage.packageName_es || editingPackage.name_es || '');
        setCategory(editingPackage.category || 'Traditional');
        setCategory_es(editingPackage.category_es || '');

        const itemized = editingPackage.itemizedServices;
        if (itemized && Object.keys(itemized).length > 0) {
          setArrangements(String(itemized.arrangements ?? '0'));
          setTransfer(String(itemized.transfer ?? '0'));
          setEmbalming(String(itemized.embalming ?? '0'));
          setOtherPreparation(String(itemized.otherPreparation ?? '0'));
          setVisitation(String(itemized.visitation ?? '0'));
          setFuneralService(String(itemized.funeralService ?? '0'));
          setEveningService(String(itemized.eveningService ?? '0'));
          setFamilyCar(String(itemized.familyCar ?? '0'));
          setFuneralCoach(String(itemized.funeralCoach ?? '0'));
          setUtilityVehicles(String(itemized.utilityVehicles ?? '0'));
          setPackageSavings(String(itemized.packageSavings ?? '0'));

          const rawOthers = Array.isArray(itemized.otherServices) ? itemized.otherServices : [];
          setOtherServices([
            {
              name: rawOthers[0]?.name || '',
              customName_es: rawOthers[0]?.customName_es || rawOthers[0]?.name_es || '',
              price: rawOthers[0]?.price !== undefined && rawOthers[0]?.price !== null ? String(rawOthers[0].price) : ''
            },
            {
              name: rawOthers[1]?.name || '',
              customName_es: rawOthers[1]?.customName_es || rawOthers[1]?.name_es || '',
              price: rawOthers[1]?.price !== undefined && rawOthers[1]?.price !== null ? String(rawOthers[1].price) : ''
            },
            {
              name: rawOthers[2]?.name || '',
              customName_es: rawOthers[2]?.customName_es || rawOthers[2]?.name_es || '',
              price: rawOthers[2]?.price !== undefined && rawOthers[2]?.price !== null ? String(rawOthers[2].price) : ''
            },
            {
              name: rawOthers[3]?.name || '',
              customName_es: rawOthers[3]?.customName_es || rawOthers[3]?.name_es || '',
              price: rawOthers[3]?.price !== undefined && rawOthers[3]?.price !== null ? String(rawOthers[3].price) : ''
            },
            {
              name: rawOthers[4]?.name || '',
              customName_es: rawOthers[4]?.customName_es || rawOthers[4]?.name_es || '',
              price: rawOthers[4]?.price !== undefined && rawOthers[4]?.price !== null ? String(rawOthers[4].price) : ''
            },
            {
              name: rawOthers[5]?.name || '',
              customName_es: rawOthers[5]?.customName_es || rawOthers[5]?.name_es || '',
              price: rawOthers[5]?.price !== undefined && rawOthers[5]?.price !== null ? String(rawOthers[5].price) : ''
            }
          ]);
        } else {
          // If no previous itemized breakdown was stored, place existing section1 price in arrangements
          const s1 = editingPackage.section1Price !== undefined
            ? editingPackage.section1Price
            : (editingPackage.s1 ?? 2050);
          setArrangements(String(s1));
          setTransfer('0');
          setEmbalming('0');
          setOtherPreparation('0');
          setVisitation('0');
          setFuneralService('0');
          setEveningService('0');
          setFamilyCar('0');
          setFuneralCoach('0');
          setUtilityVehicles('0');
          setPackageSavings('0');
          setOtherServices([
            { name: '', customName_es: '', price: '' },
            { name: '', customName_es: '', price: '' },
            { name: '', customName_es: '', price: '' },
            { name: '', customName_es: '', price: '' },
            { name: '', customName_es: '', price: '' },
            { name: '', customName_es: '', price: '' }
          ]);
        }

        const s2 = editingPackage.section2Price !== undefined
          ? editingPackage.section2Price
          : (editingPackage.s2 ?? 0);
        setSection2Price(String(s2));
        setVisitationHours(String(editingPackage.visitationHours ?? '3'));
        setDisplayOrder(String(editingPackage.displayOrder !== undefined && editingPackage.displayOrder !== null ? editingPackage.displayOrder : '1'));
      } else {
        // Reset to default new package baseline
        setPackageName('');
        setPackageName_es('');
        setCategory('Traditional');
        setCategory_es('');
        setDisplayOrder('1');
        setArrangements('2050');
        setTransfer('695');
        setEmbalming('525');
        setOtherPreparation('200');
        setVisitation('300');
        setFuneralService('150');
        setEveningService('0');
        setFamilyCar('0');
        setFuneralCoach('375');
        setUtilityVehicles('100');
        setOtherServices([
          { name: '', customName_es: '', price: '' },
          { name: '', customName_es: '', price: '' },
          { name: '', customName_es: '', price: '' },
          { name: '', customName_es: '', price: '' },
          { name: '', customName_es: '', price: '' },
          { name: '', customName_es: '', price: '' }
        ]);
        setPackageSavings('1000');
        setSection2Price('0');
        setVisitationHours('3');
      }
      setError('');
    }
  }, [editingPackage, isOpen]);

  if (!isOpen) return null;

  const isDuplicate = Boolean(editingPackage?.isDuplicate);
  const isEditing = Boolean(editingPackage && !isDuplicate);

  // Helper for numeric aggregation: ignore non-numeric strings (e.g. "incl", "n/a") as 0
  const parseNum = (val) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, val);
    const cleaned = String(val).replace(/[\$,]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  };

  // Numerical values for aggregation & subtotals
  const numArrangements = parseNum(arrangements);
  const numTransfer = parseNum(transfer);
  const numEmbalming = parseNum(embalming);
  const numOtherPreparation = parseNum(otherPreparation);
  const numVisitation = parseNum(visitation);
  const numFuneralService = parseNum(funeralService);
  const numEveningService = parseNum(eveningService);
  const numFamilyCar = parseNum(familyCar);
  const numFuneralCoach = parseNum(funeralCoach);
  const numUtilityVehicles = parseNum(utilityVehicles);
  const numPackageSavings = parseNum(packageSavings);
  const numSection2 = parseNum(section2Price);

  // Custom 3 other services formatted
  const otherServicesFormatted = otherServices.map((o) => ({
    name: (o.name || '').trim(),
    customName_es: (o.customName_es || o.name_es || '').trim(),
    name_es: (o.customName_es || o.name_es || '').trim(),
    price: String(o.price ?? '').trim()
  }));
  const totalOtherServices = otherServicesFormatted.reduce((acc, o) => acc + parseNum(o.price), 0);

  // Dynamic calculations
  const grossServices =
    numArrangements +
    numTransfer +
    numEmbalming +
    numOtherPreparation +
    numVisitation +
    numFuneralService +
    numEveningService +
    numFamilyCar +
    numFuneralCoach +
    numUtilityVehicles +
    totalOtherServices;

  const totalSection1 = Math.max(0, grossServices - numPackageSavings);
  const grandTotalPackageRate = totalSection1 + numSection2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!packageName.trim()) {
      setError(lang === 'es' ? 'El nombre del paquete es obligatorio.' : 'Package Name is required.');
      return;
    }

    if (!displayOrder || isNaN(parseInt(displayOrder, 10))) {
      setError(lang === 'es' ? 'El orden de visualización es obligatorio y debe ser un número.' : 'Display Order is required and must be a valid number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        packageId: isEditing ? (editingPackage._id || editingPackage.id || editingPackage.serviceId) : undefined,
        packageName: packageName.trim(),
        packageName_es: (packageName_es || '').trim(),
        name_es: (packageName_es || '').trim(),
        category,
        category_es: (category_es || '').trim(),
        displayOrder: Math.max(0, parseInt(displayOrder, 10) || 0),
        itemizedServices: {
          arrangements: String(arrangements ?? '').trim() || '0',
          transfer: String(transfer ?? '').trim() || '0',
          embalming: String(embalming ?? '').trim() || '0',
          otherPreparation: String(otherPreparation ?? '').trim() || '0',
          visitation: String(visitation ?? '').trim() || '0',
          funeralService: String(funeralService ?? '').trim() || '0',
          eveningService: String(eveningService ?? '').trim() || '0',
          familyCar: String(familyCar ?? '').trim() || '0',
          funeralCoach: String(funeralCoach ?? '').trim() || '0',
          utilityVehicles: String(utilityVehicles ?? '').trim() || '0',
          otherServices: otherServicesFormatted,
          packageSavings: String(packageSavings ?? '').trim() || '0',
        },
        section1Price: totalSection1,
        section2Price: numSection2,
        visitationHours: Math.max(0, Number(visitationHours) || 3),
        homeId: locationId
      };

      const success = await onSavePackage(payload);

      if (success) {
        onClose();
      }
    } catch (err) {
      setError(err?.message || (lang === 'es' ? 'Error al guardar el paquete.' : 'Failed to save package.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container add-service-package-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 760, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              {isEditing
                ? (lang === 'es' ? '✏️ Editar Paquete de Servicios Funerarios' : '✏️ Edit Funeral Service Package')
                : (lang === 'es' ? '📋 Agregar Paquete de Servicios Funerarios' : '📋 Add Funeral Service Package')}
            </h2>
            <p className="modal-subtitle">
              {isEditing
                ? (lang === 'es'
                    ? `Editar desglose y tarifas de Sección I para: ${locationName}`
                    : `Edit Itemized Section I Breakdown & Rates for: ${locationName}`)
                : (lang === 'es'
                    ? `Desglose detallado de Sección I para: ${locationName}`
                    : `Itemized Section I Breakdown & Rates for: ${locationName}`)}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {error && <div className="modal-alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

          {/* Top Inputs: Package Name, Category & Display Order */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px', gap: '14px', marginBottom: 12 }}>
            <InputField
              label={lang === 'es' ? 'Nombre del Paquete' : 'Package Name'}
              placeholder={lang === 'es' ? 'ej. One-Day Service Funeral' : 'e.g. One-Day Service Funeral'}
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              required
              autoFocus
            />

            <SelectDropdown
              label={lang === 'es' ? 'Categoría' : 'Category'}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                ['Traditional', lang === 'es' ? 'Tradicional (Traditional)' : 'Traditional'],
                ['Cremation', lang === 'es' ? 'Cremación (Cremation)' : 'Cremation'],
                ['Ship-Out', lang === 'es' ? 'Traslado (Ship-Out)' : 'Ship-Out']
              ]}
            />

            <InputField
              label={lang === 'es' ? 'Orden' : 'Display Order'}
              type="number"
              min="0"
              placeholder="1"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              required
              hint={lang === 'es' ? 'ej. 1, 2, 3' : 'e.g. 1, 2, 3'}
            />
          </div>

          {/* Optional Spanish Localization Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', marginBottom: 18 }}>
            <InputField
              label={lang === 'es' ? 'Nombre del Paquete (Español)' : 'Package Name (Spanish)'}
              placeholder={lang === 'es' ? 'ej. Servicio Funerario de Un Día' : 'e.g. One-Day Service Funeral (ES)'}
              value={packageName_es}
              onChange={(e) => setPackageName_es(e.target.value)}
              hint={lang === 'es' ? 'Opcional — traducción visible para agentes y clientes en español' : 'Optional — visible when language is set to Spanish'}
            />

            <InputField
              label={lang === 'es' ? 'Categoría (Español)' : 'Category (Spanish)'}
              placeholder={lang === 'es' ? 'ej. Tradicional' : 'e.g. Tradicional'}
              value={category_es}
              onChange={(e) => setCategory_es(e.target.value)}
              hint={lang === 'es' ? 'Opcional' : 'Optional'}
            />
          </div>

          {/* Itemized Services Breakdown Card (Section 1 Standard Inputs) */}
          <div
            style={{
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '16px 18px',
              backgroundColor: '#ffffff',
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: '1.5px solid #f1f5f9',
              }}
            >
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#183655' }}>
                📝 {lang === 'es' ? 'Sección I — Servicios Estándar' : 'Section I — Standard Services'}
              </span>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                {lang === 'es' ? 'Tarifas individuales para cada concepto' : 'Enter rates for each service component'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px 16px' }}>
              <InputField
                label={lang === 'es' ? 'Arreglos y personal profesional ($)' : 'Arrangements and professional staff ($)'}
                type="text"
                placeholder="2050"
                value={arrangements}
                onChange={(e) => setArrangements(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Traslado (25 millas) ($)' : 'Transfer (25 miles) ($)'}
                type="text"
                placeholder="695"
                value={transfer}
                onChange={(e) => setTransfer(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Embalsamamiento / refrigeración ($)' : 'Embalming / refrigeration ($)'}
                type="text"
                placeholder="525"
                value={embalming}
                onChange={(e) => setEmbalming(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Otra preparación ($)' : 'Other preparation ($)'}
                type="text"
                placeholder="200"
                value={otherPreparation}
                onChange={(e) => setOtherPreparation(e.target.value)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '12px', alignItems: 'flex-start' }}>
                <InputField
                  label={lang === 'es' ? `Velación (${visitationHours || 3}h) ($)` : `Visitation (${visitationHours || 3}h) ($)`}
                  type="text"
                  placeholder="300"
                  value={visitation}
                  onChange={(e) => setVisitation(e.target.value)}
                />

                <InputField
                  label={lang === 'es' ? 'Horas' : 'Hours'}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="3"
                  value={visitationHours}
                  onChange={(e) => setVisitationHours(e.target.value)}
                  hint={lang === 'es' ? 'Duración' : 'Duration'}
                />
              </div>

              <InputField
                label={lang === 'es' ? 'Servicio funerario / memorial ($)' : 'Funeral/memorial service ($)'}
                type="text"
                placeholder="150"
                value={funeralService}
                onChange={(e) => setFuneralService(e.target.value)}
              />

              {/* NEW: Evening Service */}
              <InputField
                label={lang === 'es' ? 'Servicio nocturno ($)' : 'Evening Service ($)'}
                type="text"
                placeholder="0"
                value={eveningService}
                onChange={(e) => setEveningService(e.target.value)}
              />

              {/* NEW: Family Car */}
              <InputField
                label={lang === 'es' ? 'Auto familiar ($)' : 'Family car ($)'}
                type="text"
                placeholder="0"
                value={familyCar}
                onChange={(e) => setFamilyCar(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Carroza funeraria ($)' : 'Funeral coach ($)'}
                type="text"
                placeholder="375"
                value={funeralCoach}
                onChange={(e) => setFuneralCoach(e.target.value)}
              />

              {/* Dedicated Utility Vehicles */}
              <InputField
                label={lang === 'es' ? 'Vehículos utilitarios ($)' : 'Utility Vehicles ($)'}
                type="text"
                placeholder="100"
                value={utilityVehicles}
                onChange={(e) => setUtilityVehicles(e.target.value)}
              />
            </div>
          </div>

          {/* NEW: Other Services Section (Exactly 3 Custom Rows) */}
          <div
            style={{
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '16px 18px',
              backgroundColor: '#f8fafc',
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: '1.5px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#183655' }}>
                  ✨ {lang === 'es' ? 'Otros Servicios Personalizados' : 'Other Services'}
                </span>
                <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginTop: 2 }}>
                  {lang === 'es'
                    ? 'Agregue hasta 3 conceptos adicionales con su nombre y tarifa'
                    : 'Add up to 3 custom itemized services with custom name and price'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0284c7',
                  backgroundColor: '#e0f2fe',
                  padding: '3px 8px',
                  borderRadius: 6
                }}
              >
                3 {lang === 'es' ? 'filas disponibles' : 'custom rows'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(110px, 0.8fr)',
                    gap: '10px',
                    alignItems: 'end',
                    backgroundColor: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <InputField
                    label={
                      lang === 'es'
                        ? `Nombre #${idx + 1}`
                        : `Service Name #${idx + 1}`
                    }
                    placeholder={
                      idx === 0
                        ? (lang === 'es' ? 'ej. Escolta de limusina' : 'e.g. Limousine Escort')
                        : idx === 1
                        ? (lang === 'es' ? 'ej. Auto de flores' : 'e.g. Flower Car')
                        : idx === 2
                        ? (lang === 'es' ? 'ej. Servicio memorial extra' : 'e.g. Additional Memorial Service')
                        : idx === 3
                        ? (lang === 'es' ? 'ej. Millas adicionales' : 'e.g. Additional Miles')
                        : idx === 4
                        ? (lang === 'es' ? 'ej. Servicio fin de semana' : 'e.g. Weekend / Evening Service')
                        : (lang === 'es' ? 'ej. Cargo de proceso especial' : 'e.g. Special Process Fee')
                    }
                    value={otherServices[idx].name}
                    onChange={(e) => handleOtherServiceChange(idx, 'name', e.target.value)}
                    style={{ marginBottom: 0 }}
                  />

                  <InputField
                    label={
                      lang === 'es'
                        ? `Nombre en Español #${idx + 1}`
                        : `Spanish Name #${idx + 1}`
                    }
                    placeholder={
                      idx === 0
                        ? (lang === 'es' ? 'ej. Escolta de limusina' : 'e.g. Escolta de limusina')
                        : idx === 1
                        ? (lang === 'es' ? 'ej. Auto de flores' : 'e.g. Auto de flores')
                        : idx === 2
                        ? (lang === 'es' ? 'ej. Servicio memorial extra' : 'e.g. Servicio memorial extra')
                        : idx === 3
                        ? (lang === 'es' ? 'ej. Millas adicionales' : 'e.g. Millas adicionales')
                        : idx === 4
                        ? (lang === 'es' ? 'ej. Servicio fin de semana' : 'e.g. Servicio fin de semana')
                        : (lang === 'es' ? 'ej. Cargo de proceso especial' : 'e.g. Cargo de proceso especial')
                    }
                    value={otherServices[idx].customName_es || ''}
                    onChange={(e) => handleOtherServiceChange(idx, 'customName_es', e.target.value)}
                    style={{ marginBottom: 0 }}
                  />

                  <InputField
                    label={
                      lang === 'es'
                        ? `Precio ($)`
                        : `Price ($)`
                    }
                    type="text"
                    placeholder="0"
                    value={otherServices[idx].price}
                    onChange={(e) => handleOtherServiceChange(idx, 'price', e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Package Savings input (Highlighted) */}
          <div
            style={{
              marginBottom: 18,
              padding: '12px 14px',
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '8px',
            }}
          >
            <InputField
              label={lang === 'es' ? '📉 Descuento / Ahorro del Paquete ($) — Se resta de Sección 1' : '📉 Package Savings ($) — Subtracted from Section 1'}
              type="text"
              placeholder="1000"
              value={packageSavings}
              onChange={(e) => setPackageSavings(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>

          {/* Section 2: Facilities */}
          <div style={{ marginBottom: 18 }}>
            <InputField
              label={lang === 'es' ? 'Sección II: Instalaciones y Automotores ($)' : 'Section II: Facilities & Automotive ($)'}
              type="text"
              placeholder="0"
              value={section2Price}
              onChange={(e) => setSection2Price(e.target.value)}
            />
          </div>

          {/* Dynamic Calculator Box */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '12px',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: 6 }}>
              <span>
                {lang === 'es'
                  ? 'Subtotal Servicios Brutos (Estándar + Otros Servicios):'
                  : 'Gross Services Subtotal (Standard + Other Services):'}
              </span>
              <span style={{ fontWeight: 650 }}>{formatMoney(grossServices)}</span>
            </div>

            {totalOtherServices > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#0369a1', marginBottom: 6 }}>
                <span>• {lang === 'es' ? 'Incluye Otros Servicios:' : 'Includes Other Services:'}</span>
                <span style={{ fontWeight: 600 }}>+{formatMoney(totalOtherServices)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#b91c1c', marginBottom: 8 }}>
              <span>{lang === 'es' ? '(-) Ahorro de Paquete (Package Savings):' : '(-) Package Savings:'}</span>
              <span style={{ fontWeight: 650 }}>-{formatMoney(numPackageSavings)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14.5px',
                fontWeight: 700,
                color: '#0f766e',
                paddingTop: 8,
                borderTop: '1px solid #e2e8f0',
                marginBottom: 8,
              }}
            >
              <span>{lang === 'es' ? 'TOTAL SERVICIOS SECCIÓN 1:' : 'TOTAL SECTION 1 SERVICES:'}</span>
              <span style={{ fontSize: '16px', fontWeight: 800 }}>{formatMoney(totalSection1)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 8,
                borderTop: '1.5px solid #94a3b8',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  {lang === 'es' ? 'TARIFA TOTAL DEL PAQUETE' : 'TOTAL PACKAGE RATE'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Section 1 ({formatMoney(totalSection1)}) + Section 2 ({formatMoney(numSection2)})
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#183655' }}>
                {formatMoney(grandTotalPackageRate)}
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="modal-actions-footer" style={{ marginTop: 20 }}>
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>

            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (lang === 'es' ? 'Guardando...' : 'Saving...')
                : editingPackage
                  ? (lang === 'es' ? 'Guardar Cambios' : 'Save Changes')
                  : (lang === 'es' ? 'Guardar Paquete' : 'Save Package')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
