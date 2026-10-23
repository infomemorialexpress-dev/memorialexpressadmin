import React, { useState, useEffect } from 'react';
import InputField from '../common/InputField.jsx';
import Button from '../common/Button.jsx';
import ImageUpload from './ImageUpload.jsx';

export default function EditItemModal({
  isOpen,
  onClose,
  onSaveItem,
  item = null,
  itemType = 'casket', // 'casket' | 'addon'
  lang = 'en'
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [image, setImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isCasket = itemType === 'casket' || item?.category === 'casket' || item?.itemType === 'CASKET';

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setPrice(item.price !== undefined ? item.price : (item.listPrice !== undefined ? item.listPrice : ''));
      setSpecifications(item.specifications || item.description || '');
      setImage(item.imageUrl || item.image || '');
    } else {
      setName('');
      setPrice('');
      setSpecifications('');
      setImage('');
    }
    setError('');
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(lang === 'es' ? 'El nombre del artículo es obligatorio.' : 'Item name is required.');
      return;
    }

    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      setError(lang === 'es' ? 'Ingrese un precio válido.' : 'Please enter a valid price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedData = {
        id: item.id || item._id,
        name: name.trim(),
        price: Number(price),
        specifications: specifications.trim(),
        description: specifications.trim(),
        image: isCasket ? image : '',
        imageUrl: isCasket ? image : ''
      };

      const success = await onSaveItem(updatedData, itemType);
      if (success !== false) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Error updating item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container edit-item-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540 }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              ✏️ {lang === 'es' ? 'Editar Artículo del Catálogo' : 'Edit Catalog Item'}
            </h2>
            <p className="modal-subtitle">
              {lang === 'es'
                ? `Actualice el nombre, especificaciones y precio de: ${item.name}`
                : `Update name, specifications, and list price for: ${item.name}`}
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

          {/* Conditionally render Image Upload only when Item Type is Casket / Merchandise */}
          {isCasket && (
            <div style={{ marginBottom: 14 }}>
              <ImageUpload
                label={lang === 'es' ? 'Fotografía del Ataúd / Mercancía' : 'Casket / Merchandise Photo'}
                value={image}
                onChange={(imgUrl) => setImage(imgUrl)}
                hint={lang === 'es'
                  ? 'Suba o reemplace la foto del ataúd (JPG, PNG, WebP hasta 4MB).'
                  : 'Upload or replace the casket photograph (JPG, PNG, WebP up to 4MB).'}
              />
            </div>
          )}

          <div className="form-grid-two">
            <InputField
              label={lang === 'es' ? 'Nombre del Artículo' : 'Item Name'}
              placeholder="e.g. Royal Oak Hardwood"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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

          <InputField
            label={lang === 'es' ? 'Especificaciones y Material' : 'Specifications & Material'}
            placeholder="e.g. Solid Oak, Rosetan Velvet interior, Polished Finish"
            value={specifications}
            onChange={(e) => setSpecifications(e.target.value)}
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
              {lang === 'es' ? 'Guardar Cambios' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
