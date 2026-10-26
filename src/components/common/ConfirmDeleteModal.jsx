import React from 'react';
import Button from './Button.jsx';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  itemName = '',
  itemType = '',
  confirmText,
  cancelText,
  isDeleting = false,
  isLoading = false,
  lang = 'en'
}) {
  if (!isOpen) return null;

  const handleClose = onClose || onCancel;
  const busy = Boolean(isDeleting || isLoading);

  const defaultTitle = lang === 'es' ? '¿Confirmar eliminación?' : 'Confirm Deletion?';
  const defaultConfirmText = lang === 'es' ? 'Eliminar definitivamente' : 'Delete';
  const defaultCancelText = lang === 'es' ? 'Cancelar' : 'Cancel';

  return (
    <div
      className="modal-backdrop"
      onClick={!busy ? handleClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div
        className="modal-container confirm-delete-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          padding: '24px',
          animation: 'modalSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0
            }}
          >
            🗑️
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              {title || defaultTitle}
            </h3>
            <div style={{ margin: 0, fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
              {message ? (
                message
              ) : (
                <>
                  {lang === 'es'
                    ? '¿Está seguro de que desea eliminar '
                    : 'Are you sure you want to delete '}
                  {itemName ? (
                    <strong style={{ color: '#0f172a' }}>"{itemName}"</strong>
                  ) : itemType ? (
                    itemType
                  ) : (
                    lang === 'es' ? 'este elemento' : 'this item'
                  )}?{' '}
                  <span style={{ display: 'block', marginTop: 4, color: '#dc2626', fontWeight: 500, fontSize: '12.5px' }}>
                    {lang === 'es' ? '⚠️ Esta acción no se puede deshacer.' : '⚠️ This action cannot be undone.'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <Button
            variant="secondary"
            type="button"
            onClick={handleClose}
            disabled={busy}
            style={{ minWidth: '90px' }}
          >
            {cancelText || defaultCancelText}
          </Button>
          <Button
            variant="danger"
            type="button"
            onClick={onConfirm}
            loading={busy}
            style={{ minWidth: '100px' }}
          >
            {confirmText || defaultConfirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
