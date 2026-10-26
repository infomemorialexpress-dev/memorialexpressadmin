import React, { useState, useEffect, useRef } from 'react';
import InputField from '../common/InputField.jsx';
import Button from '../common/Button.jsx';
import ImageUpload from './ImageUpload.jsx';
import api from '../../services/api.js';

export default function FuneralHomeModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  lang = 'en'
}) {
  const isEditing = Boolean(initialData?._id || initialData?.id);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'forms'

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    county: '',
    image: '',
    customNote: '',
    noteColor: '#008000',
    locations: [],
    customForms: []
  });

  const [chapelCity, setChapelCity] = useState('');
  const [chapelZip, setChapelZip] = useState('');
  const [chapelCounty, setChapelCounty] = useState('');
  const [chapelSurcharge, setChapelSurcharge] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Custom Release Form upload states
  const [newFormTitle, setNewFormTitle] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const pdfFileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      const chapelsList = Array.isArray(initialData.chapels) && initialData.chapels.length > 0
        ? initialData.chapels
        : (Array.isArray(initialData.locations) ? initialData.locations : []);

      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        address: initialData.streetAddress || initialData.address || '',
        city: initialData.city || '',
        zip: initialData.zipCode || initialData.zip || '',
        county: initialData.county || '',
        image: initialData.imageUrl || initialData.image || '',
        customNote: initialData.customNote || initialData.program || '',
        noteColor: initialData.noteColor || '#008000',
        locations: chapelsList.map(c => ({
          city: c.city || '',
          zip: c.zip || '',
          county: c.county || initialData.county || 'California',
          kind: c.kind || 'chapel',
          surcharge: Number(c.surcharge) || 0
        })),
        customForms: Array.isArray(initialData.customForms) ? initialData.customForms : []
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        city: '',
        zip: '',
        county: '',
        image: '',
        customNote: '',
        noteColor: '#008000',
        locations: [],
        customForms: []
      });
    }
    setFormError('');
    setChapelCity('');
    setChapelZip('');
    setChapelCounty('');
    setChapelSurcharge(0);
    setActiveTab('general');
    setNewFormTitle('');
    setSelectedPdfFile(null);
    setUploadError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddChapel = () => {
    if (!chapelCity.trim()) return;
    const newLoc = {
      city: chapelCity.trim(),
      zip: chapelZip.trim(),
      county: chapelCounty.trim() || formData.county || 'California',
      kind: 'chapel',
      surcharge: Math.max(0, Number(chapelSurcharge) || 0)
    };
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, newLoc]
    }));
    setChapelCity('');
    setChapelZip('');
    setChapelCounty('');
    setChapelSurcharge(0);
  };

  const handleRemoveLocation = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handlePdfFileSelect = (e) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedPdfFile(null);
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError(lang === 'es' ? 'Solo se permiten archivos PDF.' : 'Only PDF files are supported.');
      setSelectedPdfFile(null);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError(lang === 'es' ? 'El archivo no puede exceder 25 MB.' : 'File size cannot exceed 25 MB.');
      setSelectedPdfFile(null);
      return;
    }
    setSelectedPdfFile(file);
    if (!newFormTitle.trim()) {
      const suggested = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      setNewFormTitle(suggested);
    }
  };

  const handleUploadForm = async () => {
    setUploadError('');
    if (!newFormTitle.trim()) {
      setUploadError(lang === 'es' ? 'Ingrese un título para el formulario.' : 'Please enter a title for the form.');
      return;
    }
    if (!selectedPdfFile) {
      setUploadError(lang === 'es' ? 'Seleccione un archivo PDF para subir.' : 'Please select a PDF file to upload.');
      return;
    }

    setIsUploadingPdf(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', selectedPdfFile);

      const res = await api.post('/funeral-homes/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const returnedUrl = res.data?.fileUrl || res.data?.url;
      if (!returnedUrl) {
        throw new Error('Upload completed but no file URL was returned.');
      }

      // Prepend backend origin if relative path
      const origin = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
      const fullUrl = returnedUrl.startsWith('http') ? returnedUrl : `${origin}${returnedUrl}`;

      const newFormItem = {
        id: `form_${Date.now()}`,
        formTitle: newFormTitle.trim(),
        fileUrl: fullUrl
      };

      setFormData(prev => ({
        ...prev,
        customForms: [...(prev.customForms || []), newFormItem]
      }));

      setNewFormTitle('');
      setSelectedPdfFile(null);
      if (pdfFileInputRef.current) {
        pdfFileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading custom form:', err);
      setUploadError(err.userMessage || err.message || 'Failed to upload PDF file.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleRemoveForm = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      customForms: (prev.customForms || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError(lang === 'es' ? 'El nombre de la funeraria es obligatorio.' : 'Funeral home name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Affiliated chapels list
      const chapelsToSave = formData.locations.map(loc => ({
        city: loc.city.trim(),
        zip: loc.zip?.trim() || '',
        surcharge: Math.max(0, Number(loc.surcharge) || 0)
      }));

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        streetAddress: formData.address.trim(),
        city: formData.city.trim(),
        zipCode: formData.zip.trim(),
        county: formData.county.trim(),
        imageUrl: formData.image || null,
        customNote: formData.customNote?.trim() || '',
        noteColor: formData.noteColor || '#008000',
        program: formData.customNote?.trim() || '',
        chapels: chapelsToSave,
        customForms: formData.customForms || []
      };

      const targetId = initialData?._id || initialData?.id;
      const res = await onSave(payload, targetId);
      if (res?.success !== false) {
        onClose();
      }
    } catch (err) {
      setFormError(err.message || 'Error saving funeral home.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container funeral-home-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              {isEditing
                ? (lang === 'es' ? 'Editar Ubicación de Funeraria' : 'Edit Funeral Home Location')
                : (lang === 'es' ? 'Agregar Nueva Ubicación' : 'Add New Funeral Home Location')}
            </h2>
            <p className="modal-subtitle">
              {lang === 'es'
                ? 'Administre la fotografía de la sede, datos de contacto y capillas afiliadas.'
                : 'Manage facility photo, name, phone, address, and affiliated service chapels.'}
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

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '0 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'general' ? '3px solid #183655' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'general' ? '#183655' : '#64748b',
              fontWeight: activeTab === 'general' ? 700 : 550,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease-in-out',
            }}
          >
            🏢 {lang === 'es' ? 'Información General' : 'General Info'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('forms')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'forms' ? '3px solid #183655' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'forms' ? '#183655' : '#64748b',
              fontWeight: activeTab === 'forms' ? 700 : 550,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease-in-out',
            }}
          >
            📄 {lang === 'es' ? 'Formularios de Liberación' : 'Custom Release Forms'}
            <span
              style={{
                backgroundColor: activeTab === 'forms' ? '#183655' : '#e2e8f0',
                color: activeTab === 'forms' ? '#ffffff' : '#475569',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '10px',
              }}
            >
              {(formData.customForms || []).length}
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-body">
          {formError && (
            <div className="modal-alert-error">
              ⚠️ {formError}
            </div>
          )}

          {/* TAB 1: GENERAL INFORMATION */}
          {activeTab === 'general' && (
            <>
              {/* 1. Facility Photo Upload */}
              <div className="modal-section-photo">
                <ImageUpload
                  label={lang === 'es' ? 'Fotografía de la Sede / Fachada' : 'Facility Photo'}
                  value={formData.image}
                  onChange={(imgUrl) => handleChange('image', imgUrl)}
                  hint={lang === 'es' ? 'Suba una foto representativa de la funeraria o capilla (JPG, PNG, WebP).' : 'Upload a representative photo of the funeral home facade or chapel (JPG, PNG, WebP).'}
                />
              </div>

          {/* 2. Primary Information: Name and Direct Phone */}
          <div className="form-grid-two">
            <InputField
              label={lang === 'es' ? 'Nombre de la Funeraria' : 'Funeral Home Name'}
              placeholder="e.g. Pacific Crest Memorial"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
            <InputField
              label={lang === 'es' ? 'Teléfono Directo' : 'Phone'}
              placeholder="e.g. (323) 555-0120"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          {/* 2.5 Brief Note / Program with Color Picker */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '18px',
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 1fr) auto',
              gap: '16px',
              alignItems: 'end',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 650,
                  color: '#183655',
                  marginBottom: '6px',
                }}
              >
                {lang === 'es' ? 'Nota Breve / Programa' : 'Brief Note / Program'}
              </label>
              <input
                type="text"
                placeholder={lang === 'es' ? 'ej. Journey, Course...' : 'e.g. Journey or Course'}
                value={formData.customNote}
                onChange={(e) => handleChange('customNote', e.target.value)}
                className="form-input"
                style={{
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  width: '100%',
                  fontWeight: 700,
                  color: formData.noteColor || '#008000',
                  boxSizing: 'border-box',
                }}
              />
              {formData.customNote && (
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{lang === 'es' ? 'Vista previa:' : 'Live Preview:'}</span>
                  <span
                    style={{
                      color: formData.noteColor || '#008000',
                      fontWeight: 800,
                    }}
                  >
                    ● {formData.customNote}
                  </span>
                </div>
              )}
            </div>

            {/* Color Picker & Selector */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 650,
                  color: '#183655',
                  marginBottom: '6px',
                }}
              >
                {lang === 'es' ? 'Color del Texto' : 'Text Color'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={formData.noteColor || '#008000'}
                  onChange={(e) => handleChange('noteColor', e.target.value)}
                  style={{
                    width: '42px',
                    height: '42px',
                    padding: '2px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                  title="Pick text highlight color"
                />
                <select
                  value={formData.noteColor || '#008000'}
                  onChange={(e) => handleChange('noteColor', e.target.value)}
                  style={{
                    height: '42px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 650,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <option value="#008000">Green (#008000)</option>
                  <option value="#16a34a">Emerald (#16a34a)</option>
                  <option value="#2563eb">Blue (#2563eb)</option>
                  <option value="#7c3aed">Purple (#7c3aed)</option>
                  <option value="#d97706">Amber (#d97706)</option>
                  <option value="#dc2626">Red (#dc2626)</option>
                  <option value="#4b5563">Gray (#4b5563)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Address Information */}
          <InputField
            label={lang === 'es' ? 'Dirección Física' : 'Street Address'}
            placeholder="e.g. 4722 S Vermont Ave"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />

          <div className="form-grid-three">
            <InputField
              label={lang === 'es' ? 'Ciudad' : 'City'}
              placeholder="e.g. Los Angeles"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
            <InputField
              label={lang === 'es' ? 'Código Postal (ZIP)' : 'ZIP'}
              placeholder="e.g. 90011"
              value={formData.zip}
              onChange={(e) => handleChange('zip', e.target.value)}
            />
            <InputField
              label={lang === 'es' ? 'Condado' : 'County'}
              placeholder="e.g. Los Angeles"
              value={formData.county}
              onChange={(e) => handleChange('county', e.target.value)}
            />
          </div>

          {/* 4. Affiliated Chapels & Sub-Locations Tags with City, ZIP, and Surcharge */}
          <div className="sublocations-manager">
            <div className="sublocations-header">
              <span className="sublocations-title">
                🏛️ {lang === 'es' ? 'Capillas y Puntos de Servicio Asociados' : 'Affiliated Chapels & Sub-Locations'} ({formData.locations.length})
              </span>
              <span className="sublocations-hint">
                {lang === 'es'
                  ? 'Agregue capillas asociadas con su ciudad, código postal y recargo adicional si aplica.'
                  : 'Manage affiliated chapel locations with city, ZIP, and optional surcharge fee.'}
              </span>
            </div>

            {/* List of existing chapel tags */}
            {formData.locations.length > 0 ? (
              <div className="locations-chip-list">
                {formData.locations.map((loc, idx) => (
                  <div key={idx} className="location-chip">
                    <span className="chip-badge">
                      {loc.kind === 'funeral_home' ? 'Main' : 'Chapel'}
                    </span>
                    <span className="chip-city">{loc.city}</span>
                    {loc.zip && <span className="chip-zip">({loc.zip})</span>}
                    {Number(loc.surcharge) > 0 ? (
                      <span className="chip-surcharge">+${loc.surcharge.toLocaleString()}</span>
                    ) : (
                      <span className="chip-surcharge-zero">$0 Surcharge</span>
                    )}
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={() => handleRemoveLocation(idx)}
                      title="Remove chapel tag"
                      aria-label="Remove chapel tag"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-chapels-message">
                {lang === 'es'
                  ? 'No hay capillas adicionales agregadas.'
                  : 'No affiliated chapels added yet. Add one below.'}
              </div>
            )}

            {/* Subform to add a new chapel tag */}
            <div className="add-chapel-subform">
              <input
                type="text"
                placeholder={lang === 'es' ? 'Ciudad de la Capilla (ej. Paramount)' : 'Chapel City (e.g. Paramount)'}
                className="form-input sub-input"
                value={chapelCity}
                onChange={(e) => setChapelCity(e.target.value)}
              />
              <input
                type="text"
                placeholder="ZIP"
                className="form-input sub-input zip-input"
                value={chapelZip}
                onChange={(e) => setChapelZip(e.target.value)}
              />
              <input
                type="number"
                placeholder={lang === 'es' ? 'Recargo $' : 'Surcharge $'}
                className="form-input sub-input surcharge-input"
                value={chapelSurcharge || ''}
                onChange={(e) => setChapelSurcharge(e.target.value)}
                min="0"
                step="50"
              />
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={handleAddChapel}
                disabled={!chapelCity.trim()}
              >
                + {lang === 'es' ? 'Agregar Capilla' : 'Add Chapel'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: CUSTOM RELEASE FORMS */}
      {activeTab === 'forms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '22px' }}>📄</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e3a8a' }}>
                {lang === 'es' ? 'Formularios y Autorizaciones Legales' : 'Custom Release & Legal Documents'}
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#1e40af', lineHeight: 1.4 }}>
                {lang === 'es'
                  ? 'Suba documentos PDF de liberación (autorizaciones de cremación, traslado, etc.). Estos formularios estarán disponibles en el paso 7 del embudo del agente para recabar firmas digitales.'
                  : 'Upload PDF release forms and legal authorizations. These documents will appear in Step 7 of the Agent Funnel for digital client signatures and instant downloads.'}
              </p>
            </div>
          </div>

          {/* Form Uploader Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#183655' }}>
                ➕ {lang === 'es' ? 'Subir Nuevo Documento PDF' : 'Upload New Release Document (PDF)'}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                PDF max 50MB
              </span>
            </div>

            {uploadError && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                ⚠️ {uploadError}
              </div>
            )}

            <div
              className="custom-forms-upload-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                alignItems: 'end',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 650,
                    color: '#334155',
                    marginBottom: '5px',
                  }}
                >
                  {lang === 'es' ? 'Título del Formulario' : 'Form Title'} *
                </label>
                <input
                  type="text"
                  placeholder={lang === 'es' ? 'ej. Autorización de Cremación' : 'e.g. Cremation Release'}
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  className="form-input"
                  style={{
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    padding: '0 12px',
                    fontSize: '13px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 650,
                    color: '#334155',
                    marginBottom: '5px',
                  }}
                >
                  {lang === 'es' ? 'Seleccionar Archivo PDF' : 'Select PDF File'} *
                </label>
                <input
                  type="file"
                  ref={pdfFileInputRef}
                  accept="application/pdf,.pdf"
                  onChange={handlePdfFileSelect}
                  style={{
                    height: '40px',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    width: '100%',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <Button
                  variant="primary"
                  type="button"
                  onClick={handleUploadForm}
                  loading={isUploadingPdf}
                  disabled={!selectedPdfFile || !newFormTitle.trim()}
                  style={{
                    height: '40px',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                  }}
                >
                  {isUploadingPdf
                    ? (lang === 'es' ? 'Subiendo...' : 'Uploading...')
                    : (lang === 'es' ? '📤 Subir y Adjuntar' : '📤 Upload & Attach')}
                </Button>
              </div>
            </div>

            {selectedPdfFile && (
              <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                ✓ {lang === 'es' ? 'Archivo listo para subir:' : 'Ready to upload:'} {selectedPdfFile.name} ({(selectedPdfFile.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>

          {/* List of Attached Custom Forms */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#183655' }}>
                📁 {lang === 'es' ? 'Formularios Adjuntos a esta Funeraria' : 'Attached Forms for this Funeral Home'} ({(formData.customForms || []).length})
              </h4>
            </div>

            {(formData.customForms || []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(formData.customForms || []).map((form, idx) => (
                  <div
                    key={form.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          fontWeight: 800,
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        PDF
                      </span>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                          {form.formTitle}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', wordBreak: 'break-all' }}>
                          {form.fileUrl}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <a
                        href={form.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          color: '#183655',
                          fontSize: '12px',
                          fontWeight: 650,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {lang === 'es' ? 'Ver PDF ↗' : 'View PDF ↗'}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveForm(idx)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          fontSize: '12px',
                          fontWeight: 650,
                          cursor: 'pointer',
                        }}
                        title={lang === 'es' ? 'Eliminar formulario' : 'Remove form'}
                      >
                        🗑️ {lang === 'es' ? 'Eliminar' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  color: '#64748b',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📂</div>
                <div style={{ fontSize: '13.5px', fontWeight: 650, color: '#334155' }}>
                  {lang === 'es' ? 'No hay formularios adjuntos' : 'No custom release forms attached yet'}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  {lang === 'es'
                    ? 'Suba un documento PDF usando el formulario de arriba.'
                    : 'Upload a PDF release document using the form above.'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

          {/* Modal Actions Footer */}
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
              {isEditing
                ? (lang === 'es' ? 'Guardar Cambios' : 'Save Changes')
                : (lang === 'es' ? 'Crear Funeraria' : 'Create Location')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
