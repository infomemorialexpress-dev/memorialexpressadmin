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
  const [category, setCategory] = useState('Traditional');

  // Itemized Services Breakdown state
  const [arrangements, setArrangements] = useState('2050');
  const [transfer, setTransfer] = useState('695');
  const [embalming, setEmbalming] = useState('525');
  const [otherPreparation, setOtherPreparation] = useState('200');
  const [visitation, setVisitation] = useState('300');
  const [funeralService, setFuneralService] = useState('150');
  const [eveningService, setEveningService] = useState('0');
  const [familyCar, setFamilyCar] = useState('0');
  const [funeralCoach, setFuneralCoach] = useState('375');
  const [utilityVehicles, setUtilityVehicles] = useState('100');

  // Exactly 3 custom 'Other Services' rows
  const [otherServices, setOtherServices] = useState([
    { name: '', price: '' },
    { name: '', price: '' },
    { name: '', price: '' }
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
        setCategory(editingPackage.category || 'Traditional');

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
              price: rawOthers[0]?.price !== undefined && rawOthers[0]?.price !== null ? String(rawOthers[0].price) : ''
            },
            {
              name: rawOthers[1]?.name || '',
              price: rawOthers[1]?.price !== undefined && rawOthers[1]?.price !== null ? String(rawOthers[1].price) : ''
            },
            {
              name: rawOthers[2]?.name || '',
              price: rawOthers[2]?.price !== undefined && rawOthers[2]?.price !== null ? String(rawOthers[2].price) : ''
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
            { name: '', price: '' },
            { name: '', price: '' },
            { name: '', price: '' }
          ]);
        }

        const s2 = editingPackage.section2Price !== undefined
          ? editingPackage.section2Price
          : (editingPackage.s2 ?? 0);
        setSection2Price(String(s2));
      } else {
        // Reset to default new package baseline
        setPackageName('');
        setCategory('Traditional');
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
          { name: '', price: '' },
          { name: '', price: '' },
          { name: '', price: '' }
        ]);
        setPackageSavings('1000');
        setSection2Price('0');
      }
      setError('');
    }
  }, [editingPackage, isOpen]);

  if (!isOpen) return null;

  // Numerical values
  const numArrangements = Math.max(0, Number(arrangements) || 0);
  const numTransfer = Math.max(0, Number(transfer) || 0);
  const numEmbalming = Math.max(0, Number(embalming) || 0);
  const numOtherPreparation = Math.max(0, Number(otherPreparation) || 0);
  const numVisitation = Math.max(0, Number(visitation) || 0);
  const numFuneralService = Math.max(0, Number(funeralService) || 0);
  const numEveningService = Math.max(0, Number(eveningService) || 0);
  const numFamilyCar = Math.max(0, Number(familyCar) || 0);
  const numFuneralCoach = Math.max(0, Number(funeralCoach) || 0);
  const numUtilityVehicles = Math.max(0, Number(utilityVehicles) || 0);
  const numPackageSavings = Math.max(0, Number(packageSavings) || 0);
  const numSection2 = Math.max(0, Number(section2Price) || 0);

  // Custom 3 other services formatted
  const otherServicesFormatted = otherServices.map((o) => ({
    name: (o.name || '').trim(),
    price: Math.max(0, Number(o.price) || 0)
  }));
  const totalOtherServices = otherServicesFormatted.reduce((acc, o) => acc + o.price, 0);

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

    setIsSubmitting(true);
    try {
      const payload = {
        packageId: editingPackage ? (editingPackage._id || editingPackage.id || editingPackage.serviceId) : undefined,
        packageName: packageName.trim(),
        category,
        itemizedServices: {
          arrangements: numArrangements,
          transfer: numTransfer,
          embalming: numEmbalming,
          otherPreparation: numOtherPreparation,
          visitation: numVisitation,
          funeralService: numFuneralService,
          eveningService: numEveningService,
          familyCar: numFamilyCar,
          funeralCoach: numFuneralCoach,
          utilityVehicles: numUtilityVehicles,
          otherServices: otherServicesFormatted,
          packageSavings: numPackageSavings,
        },
        section1Price: totalSection1,
        section2Price: numSection2,
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
              {editingPackage
                ? (lang === 'es' ? '✏️ Editar Paquete de Servicios Funerarios' : '✏️ Edit Funeral Service Package')
                : (lang === 'es' ? '📋 Agregar Paquete de Servicios Funerarios' : '📋 Add Funeral Service Package')}
            </h2>
            <p className="modal-subtitle">
              {editingPackage
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

          {/* Top Inputs: Package Name & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', marginBottom: 18 }}>
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
                type="number"
                min="0"
                step="1"
                placeholder="2050"
                value={arrangements}
                onChange={(e) => setArrangements(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Traslado (25 millas) ($)' : 'Transfer (25 miles) ($)'}
                type="number"
                min="0"
                step="1"
                placeholder="695"
                value={transfer}
                onChange={(e) => setTransfer(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Embalsamamiento / refrigeración ($)' : 'Embalming / refrigeration ($)'}
                type="number"
                min="0"
                step="1"
                placeholder="525"
                value={embalming}
                onChange={(e) => setEmbalming(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Otra preparación ($)' : 'Other preparation ($)'}
                type="number"
                min="0"
                step="1"
                placeholder="200"
                value={otherPreparation}
                onChange={(e) => setOtherPreparation(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Velación (3 horas) ($)' : 'Visitation (3 hours) ($)'}
                type="number"
                min="0"
                step="1"
                placeholder="300"
                value={visitation}
                onChange={(e) => setVisitation(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Servicio funerario / memorial ($)' : 'Funeral/memorial service ($)'}
                type="number"
                min="0"
                step="1"
                placeholder="150"
                value={funeralService}
                onChange={(e) => setFuneralService(e.target.value)}
              />

              {/* NEW: Evening Service */}
              <InputField
                label={lang === 'es' ? 'Servicio nocturno ($)' : 'Evening Service ($)'}
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={eveningService}
                onChange={(e) => setEveningService(e.target.value)}
              />

              {/* NEW: Family Car */}
              <InputField
                label={lang === 'es' ? 'Auto familiar ($)' : 'Family car ($)'}
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={familyCar}
                onChange={(e) => setFamilyCar(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Carroza funeraria ($)' : 'Funeral coach ($)'}
                type="number"
                min="0"
                step="1"
                placeholder="375"
                value={funeralCoach}
                onChange={(e) => setFuneralCoach(e.target.value)}
              />

              {/* Dedicated Utility Vehicles */}
              <InputField
                label={lang === 'es' ? 'Vehículos utilitarios ($)' : 'Utility Vehicles ($)'}
                type="number"
                min="0"
                step="1"
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
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 2fr) minmax(130px, 1fr)',
                    gap: '12px',
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
                        ? `Nombre de Servicio #${idx + 1}`
                        : `Service Name #${idx + 1}`
                    }
                    placeholder={
                      idx === 0
                        ? (lang === 'es' ? 'ej. Escolta de limusina' : 'e.g. Limousine Escort')
                        : idx === 1
                        ? (lang === 'es' ? 'ej. Auto de flores' : 'e.g. Flower Car')
                        : (lang === 'es' ? 'ej. Servicio conmemorativo adicional' : 'e.g. Additional Memorial Service')
                    }
                    value={otherServices[idx].name}
                    onChange={(e) => handleOtherServiceChange(idx, 'name', e.target.value)}
                    style={{ marginBottom: 0 }}
                  />

                  <InputField
                    label={
                      lang === 'es'
                        ? `Precio ($)`
                        : `Price ($)`
                    }
                    type="number"
                    min="0"
                    step="1"
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
              type="number"
              min="0"
              step="1"
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
              type="number"
              min="0"
              step="1"
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
