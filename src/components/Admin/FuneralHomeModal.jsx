import React, { useState, useEffect } from 'react';
import InputField from '../common/InputField.jsx';
import Button from '../common/Button.jsx';
import ImageUpload from './ImageUpload.jsx';

export default function FuneralHomeModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  lang = 'en'
}) {
  const isEditing = Boolean(initialData?._id || initialData?.id);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    county: '',
    image: '',
    locations: []
  });

  const [chapelCity, setChapelCity] = useState('');
  const [chapelZip, setChapelZip] = useState('');
  const [chapelCounty, setChapelCounty] = useState('');
  const [chapelSurcharge, setChapelSurcharge] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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
        locations: chapelsList.map(c => ({
          city: c.city || '',
          zip: c.zip || '',
          county: c.county || initialData.county || 'California',
          kind: c.kind || 'chapel',
          surcharge: Number(c.surcharge) || 0
        }))
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
        locations: []
      });
    }
    setFormError('');
    setChapelCity('');
    setChapelZip('');
    setChapelCounty('');
    setChapelSurcharge(0);
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
        chapels: chapelsToSave
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

        <form onSubmit={handleSubmit} className="modal-form-body">
          {formError && (
            <div className="modal-alert-error">
              ⚠️ {formError}
            </div>
          )}

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
