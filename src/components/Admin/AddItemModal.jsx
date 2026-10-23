import React, { useState } from 'react';
import InputField from '../common/InputField.jsx';
import SelectDropdown from '../common/SelectDropdown.jsx';
import Button from '../common/Button.jsx';
import ImageUpload from './ImageUpload.jsx';

export default function AddItemModal({
  isOpen,
  onClose,
  onAddItem,
  locationName = '',
  locationId = '',
  defaultCategory = 'casket',
  lang = 'en'
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(lang === 'es' ? 'El nombre del artículo es obligatorio.' : 'Item name is required.');
      return;
    }

    if (!price || Number(price) < 0) {
      setError(lang === 'es' ? 'Ingrese un precio válido.' : 'Please enter a valid price.');
      return;
    }

    setIsSubmitting(true);
    const success = await onAddItem({
      name,
      price,
      category,
      homeId: locationId,
      description,
      image: category === 'casket' ? image : ''
    });
    setIsSubmitting(false);

    if (success) {
      setName('');
      setPrice('');
      setDescription('');
      setImage('');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container add-item-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              ➕ {lang === 'es' ? 'Agregar Artículo al Catálogo' : 'Add Item to Catalog'}
            </h2>
            <p className="modal-subtitle">
              {lang === 'es'
                ? `Asignado exclusivamente a: ${locationName}`
                : `Adding exclusively for: ${locationName}`}
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
              label={lang === 'es' ? 'Precio de Lista ($)' : 'List Price ($)'}
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          {/* Conditionally render Image Upload only when Item Type is Casket / Merchandise */}
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
            label={lang === 'es' ? 'Especificaciones / Material' : 'Specifications & Material'}
            placeholder="e.g. 18 Gauge Steel, Velvet Interior, Brushed Finish"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

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
