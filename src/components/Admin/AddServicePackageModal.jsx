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

  // Itemized Services Breakdown state (default values matching One-Day Funeral baseline)
  const [arrangements, setArrangements] = useState('2050');
  const [transfer, setTransfer] = useState('695');
  const [embalming, setEmbalming] = useState('525');
  const [otherPreparation, setOtherPreparation] = useState('200');
  const [visitation, setVisitation] = useState('300');
  const [funeralService, setFuneralService] = useState('150');
  const [funeralCoach, setFuneralCoach] = useState('375');
  const [utilityVehicles, setUtilityVehicles] = useState('100');
  const [packageSavings, setPackageSavings] = useState('1000');

  // Section 2 Facilities & Automotive
  const [section2Price, setSection2Price] = useState('0');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
          setFuneralCoach(String(itemized.funeralCoach ?? '0'));
          setUtilityVehicles(String(itemized.utilityVehicles ?? '0'));
          setPackageSavings(String(itemized.packageSavings ?? '0'));
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
          setFuneralCoach('0');
          setUtilityVehicles('0');
          setPackageSavings('0');
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
        setFuneralCoach('375');
        setUtilityVehicles('100');
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
  const numFuneralCoach = Math.max(0, Number(funeralCoach) || 0);
  const numUtilityVehicles = Math.max(0, Number(utilityVehicles) || 0);
  const numPackageSavings = Math.max(0, Number(packageSavings) || 0);
  const numSection2 = Math.max(0, Number(section2Price) || 0);

  // Dynamic calculations
  const grossServices =
    numArrangements +
    numTransfer +
    numEmbalming +
    numOtherPreparation +
    numVisitation +
    numFuneralService +
    numFuneralCoach +
    numUtilityVehicles;

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
          funeralCoach: numFuneralCoach,
          utilityVehicles: numUtilityVehicles,
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
        style={{ maxWidth: 720, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
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

          {/* Itemized Services Breakdown Card (Section 1) */}
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
                📝 {lang === 'es' ? 'Sección I — Servicios Detallados' : 'Section I — Itemized Services'}
              </span>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                {lang === 'es' ? 'Tarifas individuales para cada concepto' : 'Enter rates for each service component'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
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

              <InputField
                label={lang === 'es' ? 'Carroza funeraria ($)' : 'Funeral coach ($)'}
                type="number"
                min="0"
                step="1"
                placeholder="375"
                value={funeralCoach}
                onChange={(e) => setFuneralCoach(e.target.value)}
              />

              <InputField
                label={lang === 'es' ? 'Vehículos utilitarios / otros ($)' : 'Utility vehicles / other ($)'}
                type="number"
                min="0"
                step="1"
                placeholder="100"
                value={utilityVehicles}
                onChange={(e) => setUtilityVehicles(e.target.value)}
              />
            </div>

            {/* Package Savings input (Highlighted) */}
            <div
              style={{
                marginTop: 14,
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
              <span>{lang === 'es' ? 'Subtotal Servicios Brutos (8 conceptos):' : 'Gross Services Subtotal (8 items):'}</span>
              <span style={{ fontWeight: 650 }}>{formatMoney(grossServices)}</span>
            </div>

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
