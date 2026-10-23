import React, { useState } from 'react';
import InputField from '../common/InputField.jsx';
import SelectDropdown from '../common/SelectDropdown.jsx';
import Button from '../common/Button.jsx';

export default function AddItemForm({ onAddItem, lang }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('casket');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setIsSubmitting(true);
    const success = await onAddItem({ name, price, category });
    setIsSubmitting(false);

    if (success) {
      setName('');
      setPrice('');
    }
  };

  return (
    <div style={{ marginTop: 28, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
      <h4 style={{ margin: '0 0 12px', fontSize: 15, color: '#183655' }}>
        ➕ {lang === 'es' ? 'Agregar Nuevo Artículo al Catálogo' : 'Add Item to Catalog'}
      </h4>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <InputField
            label={lang === 'es' ? 'Nombre del Artículo' : 'Item Name'}
            placeholder="e.g. Premium Floral Spray"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <InputField
            label={lang === 'es' ? 'Precio ($)' : 'Price ($)'}
            type="number"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <SelectDropdown
            label={lang === 'es' ? 'Categoría' : 'Category'}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              ['casket', lang === 'es' ? 'Ataúd' : 'Casket'],
              ['addon', lang === 'es' ? 'Servicio Adicional' : 'Add-on']
            ]}
          />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="primary" type="submit" loading={isSubmitting} style={{ width: '100%' }}>
              {lang === 'es' ? 'Agregar Artículo' : 'Add Item'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
