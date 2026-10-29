import React, { useState, useEffect } from 'react';
import InputField from '../common/InputField.jsx';
import Button from '../common/Button.jsx';
import api from '../../services/api.js';

export default function DuplicateFuneralHomeModal({
  isOpen,
  onClose,
  home,
  onDuplicated,
  lang = 'en',
}) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && home) {
      setName(home.name ? `${home.name} (Copy)` : '');
      setAddress(home.streetAddress || home.address || '');
      setCity(home.city || '');
      setPhone(home.phone || '');
      setError('');
    }
  }, [isOpen, home]);

  if (!isOpen || !home) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(
        lang === 'es'
          ? 'El nombre de la nueva funeraria es obligatorio.'
          : 'New funeral home name is required.'
      );
      return;
    }

    setIsSubmitting(true);
    setError('');

    const targetId = home._id || home.id;
    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        streetAddress: address.trim(),
        city: city.trim(),
        phone: phone.trim(),
      };

      const response = await api.post(`/funeral-homes/${targetId}/duplicate`, payload);
      const duplicated = response.data;
      onDuplicated(duplicated);
      onClose();
    } catch (err) {
      console.error('Error duplicating funeral home:', err);
      const msg =
        err.response?.data?.message ||
        err.userMessage ||
        (lang === 'es'
          ? 'Error al duplicar la funeraria. Intente nuevamente.'
          : 'Failed to duplicate funeral home. Please try again.');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={!isSubmitting ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          padding: '24px',
          animation: 'modalSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
              📋 {lang === 'es' ? 'Duplicar Funeraria' : 'Duplicate Funeral Home'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              {lang === 'es'
                ? `Copia completa del catálogo, ataúdes, adicionales y paquetes de "${home.name}".`
                : `Complete copy of catalog, caskets, add-ons, and packages from "${home.name}".`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '13px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <InputField
            label={lang === 'es' ? 'Nombre de la Nueva Funeraria *' : 'New Funeral Home Name *'}
            placeholder="e.g. Western Funeral Home - Downey"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <InputField
            label={lang === 'es' ? 'Dirección' : 'Street Address'}
            placeholder="e.g. 8350 Florence Ave suite 700"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <InputField
              label={lang === 'es' ? 'Ciudad' : 'City'}
              placeholder="e.g. Downey"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <InputField
              label={lang === 'es' ? 'Teléfono' : 'Phone'}
              placeholder="e.g. 5622944400"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '8px',
              paddingTop: '14px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (lang === 'es' ? 'Duplicando...' : 'Duplicating...')
                : (lang === 'es' ? 'Duplicar Ahora' : 'Duplicate Location')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
