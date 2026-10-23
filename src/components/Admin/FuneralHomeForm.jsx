import React, { useState } from 'react';
import InputField from '../common/InputField.jsx';
import Button from '../common/Button.jsx';

export default function FuneralHomeForm({ onAddHome, isSubmitting, lang }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [county, setCounty] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const success = await onAddHome({ name, city, zip, county });
    if (success) {
      setName('');
      setCity('');
      setZip('');
      setCounty('');
    }
  };

  return (
    <div style={{ background: '#f8fafc', padding: 22, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 28 }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 16, color: '#183655' }}>
        ➕ {lang === 'es' ? 'Agregar Nueva Funeraria' : 'Add New Funeral Home'}
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <InputField
            label={lang === 'es' ? 'Nombre de la Funeraria' : 'Funeral Home Name'}
            placeholder="e.g. Pacific Memorial"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <InputField
            label={lang === 'es' ? 'Ciudad' : 'City'}
            placeholder="e.g. Los Angeles"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <InputField
            label={lang === 'es' ? 'Código Postal (ZIP)' : 'ZIP'}
            placeholder="e.g. 90022"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
          />
          <InputField
            label={lang === 'es' ? 'Condado' : 'County'}
            placeholder="e.g. Los Angeles"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {lang === 'es' ? 'Guardar Funeraria' : 'Add Funeral Home'}
          </Button>
        </div>
      </form>
    </div>
  );
}
