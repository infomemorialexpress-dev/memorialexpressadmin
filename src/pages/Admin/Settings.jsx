import React, { useState, useEffect } from 'react';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import InputField from '../../components/common/InputField.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function Settings() {
  const { lang, setLanguage, addToast } = useAdminUI();
  const { adminUser } = useAuth();

  // Admin Profile state from GET /auth/me
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Fetch admin profile details via GET /auth/me
  useEffect(() => {
    let isMounted = true;

    async function fetchAdminProfile() {
      try {
        setIsProfileLoading(true);
        const res = await api.get('/auth/me');
        if (isMounted && res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        console.warn('[Settings] Failed to fetch profile from GET /auth/me:', err);
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    }

    fetchAdminProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    addToast(
      newLang === 'es'
        ? 'Idioma del panel cambiado a Español (MX)'
        : 'System language set to English (US)',
      'success'
    );
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      const msg = lang === 'es'
        ? 'Por favor complete todos los campos de contraseña.'
        : 'Please fill in all password fields.';
      setFeedbackMessage({ type: 'error', text: msg });
      addToast(msg, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = lang === 'es'
        ? 'La nueva contraseña y la confirmación no coinciden.'
        : 'New password and confirm password do not match.';
      setFeedbackMessage({ type: 'error', text: msg });
      addToast(msg, 'error');
      return;
    }

    if (newPassword.length < 8) {
      const msg = lang === 'es'
        ? 'La nueva contraseña debe tener al menos 8 caracteres.'
        : 'New password must be at least 8 characters long.';
      setFeedbackMessage({ type: 'error', text: msg });
      addToast(msg, 'error');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const response = await api.patch('/auth/change-password', {
        currentPassword,
        newPassword
      });

      const successMsg = response.data?.message ||
        (lang === 'es' ? 'Contraseña actualizada exitosamente.' : 'Password updated successfully.');

      setFeedbackMessage({
        type: 'success',
        text: successMsg
      });

      addToast(successMsg, 'success');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      let errorMsg = err.userMessage;
      if (err.response?.status === 401) {
        const msg = String(err.response?.data?.message || err.userMessage || '').toLowerCase();
        if (msg.includes('current password')) {
          errorMsg = lang === 'es'
            ? 'La contraseña actual no coincide.'
            : 'Current password does not match.';
        } else {
          errorMsg = lang === 'es'
            ? 'Sesión no autorizada o expirada. Por favor vuelva a iniciar sesión.'
            : 'Unauthorized or session expired. Please log in again.';
        }
      } else if (!errorMsg) {
        errorMsg = lang === 'es'
          ? 'Error al actualizar la contraseña. Verifique su contraseña actual.'
          : 'Failed to update password. Please verify your current password.';
      }

      setFeedbackMessage({
        type: 'error',
        text: errorMsg
      });

      addToast(errorMsg, 'error');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Profile display helpers
  const displayEmail = profile?.email || adminUser?.email || adminUser?.username || 'admin@memorialexpress.com';
  const displayRole = profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : (profile?.role || 'Super Admin');
  const displayStatus = profile?.status || 'Active & Authorized';
  const renderPasswordToggle = (isVisible, onToggle, fieldLabel) => (
    <button
      type="button"
      onClick={onToggle}
      style={{
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        transition: 'color 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#183655')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
      title={
        isVisible
          ? (lang === 'es' ? 'Ocultar contraseña' : 'Hide password')
          : (lang === 'es' ? 'Mostrar contraseña' : 'Show password')
      }
      aria-label={isVisible ? `Hide ${fieldLabel}` : `Show ${fieldLabel}`}
    >
      {isVisible ? (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* CARD 1: LANGUAGE PREFERENCES */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="header-icon-bubble">
              🌐
            </div>
            <div>
              <h2 className="settings-card-title">
                {lang === 'es' ? 'Preferencia de Idioma del Sistema' : 'Language Preferences'}
              </h2>
              <p className="settings-card-desc">
                {lang === 'es'
                  ? 'Seleccione el idioma principal para la consola administrativa, reportes y cotizadores.'
                  : 'Choose your preferred language for the administrative console and reporting tools.'}
              </p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="language-options-grid">
              {/* English Option */}
              <div
                className={`language-choice-card ${lang === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
                role="button"
                tabIndex={0}
              >
                <div className="choice-left">
                  <span className="choice-flag">🇺🇸</span>
                  <div>
                    <div className="choice-name">English (US)</div>
                    <div className="choice-desc">
                      Standard English interface for Memorial Express
                    </div>
                  </div>
                </div>

                <div className="choice-badge">
                  {lang === 'en' ? (
                    <span className="active-tag">✓ Active</span>
                  ) : (
                    <span className="select-tag">Select</span>
                  )}
                </div>
              </div>

              {/* Spanish (MX Español) Option */}
              <div
                className={`language-choice-card ${lang === 'es' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('es')}
                role="button"
                tabIndex={0}
              >
                <div className="choice-left">
                  <span className="choice-flag">🇲🇽</span>
                  <div>
                    <div className="choice-name">Español (MX)</div>
                    <div className="choice-desc">
                      Interfaz en español para el panel de administración
                    </div>
                  </div>
                </div>

                <div className="choice-badge">
                  {lang === 'es' ? (
                    <span className="active-tag">✓ Activo</span>
                  ) : (
                    <span className="select-tag">Seleccionar</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: ADMINISTRATOR SESSION (Reordered to 2nd position, Encryption row removed) */}
        <div className="settings-card info-card">
          <div className="settings-card-header">
            <div className="header-icon-bubble">
              👤
            </div>
            <div>
              <h2 className="settings-card-title">
                {lang === 'es' ? 'Sesión de Administrador' : 'Administrator Session'}
              </h2>
              <p className="settings-card-desc">
                {lang === 'es'
                  ? 'Detalles de la cuenta autenticada y permisos asignados.'
                  : 'Authenticated account details and security standing.'}
              </p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="admin-profile-details">
              <div className="profile-detail-row">
                <span className="detail-label">Username:</span>
                <span className="detail-value font-bold">{displayEmail}</span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value role-badge">{displayRole}</span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-active">● {displayStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: CHANGE PASSWORD FORM (Reordered to 3rd / last position) */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="header-icon-bubble">
              🔒
            </div>
            <div>
              <h2 className="settings-card-title">
                {lang === 'es' ? 'Cambiar Contraseña' : 'Change Password'}
              </h2>
              <p className="settings-card-desc">
                {lang === 'es'
                  ? 'Actualice su contraseña de acceso administrativo para mantener la seguridad del sistema.'
                  : 'Update your administrator account password. Choose a strong and unique password.'}
              </p>
            </div>
          </div>

          <div className="settings-card-body">
            {feedbackMessage && (
              <div className={`feedback-alert ${feedbackMessage.type}`}>
                {feedbackMessage.type === 'success' ? '✓ ' : '⚠️ '}
                {feedbackMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="password-form" noValidate>
              <InputField
                id="current-password"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                label={lang === 'es' ? 'Contraseña Actual' : 'Current Password'}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                rightElement={renderPasswordToggle(
                  showCurrentPassword,
                  () => setShowCurrentPassword((prev) => !prev),
                  'Current password'
                )}
              />

              <div className="form-grid-two">
                <InputField
                  id="new-password"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  label={lang === 'es' ? 'Nueva Contraseña' : 'New Password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  hint={
                    lang === 'es'
                      ? 'Mínimo 8 caracteres, combinando letras y números.'
                      : 'Must be at least 8 characters long with letters and numbers.'
                  }
                  required
                  rightElement={renderPasswordToggle(
                    showNewPassword,
                    () => setShowNewPassword((prev) => !prev),
                    'New password'
                  )}
                />

                <InputField
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  label={lang === 'es' ? 'Confirmar Nueva Contraseña' : 'Confirm Password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  rightElement={renderPasswordToggle(
                    showConfirmPassword,
                    () => setShowConfirmPassword((prev) => !prev),
                    'Confirm password'
                  )}
                />
              </div>

              {/* Password Requirement Badges */}
              <div className="password-guidelines-box">
                <div className="guidelines-title">
                  {lang === 'es' ? 'Requisitos de Seguridad:' : 'Security Guidelines:'}
                </div>
                <div className="guidelines-chips">
                  <span className="guideline-chip">✓ 8+ Characters</span>
                  <span className="guideline-chip">✓ Letters & Numbers</span>
                  <span className="guideline-chip">✓ Special characters allowed</span>
                </div>
              </div>

              <div className="password-form-actions">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  className="btn-update-password"
                  loading={isSubmittingPassword}
                  disabled={isSubmittingPassword}
                >
                  🔒 {isSubmittingPassword
                    ? (lang === 'es' ? 'Actualizando...' : 'Updating...')
                    : (lang === 'es' ? 'Actualizar Contraseña' : 'Update Password')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
