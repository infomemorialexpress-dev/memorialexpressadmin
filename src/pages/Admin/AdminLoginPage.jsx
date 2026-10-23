import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import InputField from '../../components/common/InputField.jsx';
import Button from '../../components/common/Button.jsx';
import { BrandFeatherIcon } from '../../components/common/AdminHeader.jsx';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const { lang, addToast } = useAdminUI();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const credentials = { email: email.trim(), password };
      const res = await login(credentials);

      if (res.success) {
        addToast(
          lang === 'es' ? 'Acceso de administrador concedido.' : 'Admin credentials authorized.',
          'success'
        );
        navigate('/', { replace: true });
      } else {
        setError(res.error || (lang === 'es' ? 'Credenciales inválidas.' : 'Invalid email or password.'));
      }
    } catch (err) {
      console.error('[AdminLoginPage] Login error:', err);
      setError(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 460,
      margin: '60px auto',
      padding: '36px 32px',
      background: '#ffffff',
      borderRadius: 16,
      boxShadow: '0 10px 30px rgba(24, 54, 85, 0.08), 0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <BrandFeatherIcon
          style={{
            width: 60,
            height: 60,
            borderRadius: 12,
            boxShadow: '0 4px 14px rgba(24, 54, 85, 0.12)',
            display: 'inline-block',
            marginBottom: 14
          }}
        />

        <h2 style={{ color: '#183655', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
          🔒 {lang === 'es' ? 'Autenticación de Administrador' : 'Admin Security Gateway'}
        </h2>
        <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>
          {lang === 'es'
            ? 'Ingrese sus credenciales de administrador para gestionar tarifas y funerarias.'
            : 'Enter your administrator credentials to manage rates, caskets, and funeral home partners.'}
        </p>
      </div>

      {/* Simple Email and Password Login Form */}
      <form onSubmit={handleSubmit}>
        <InputField
          label={lang === 'es' ? 'Correo Electrónico' : 'Email'}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={lang === 'es' ? 'Ingrese su correo electrónico' : 'Enter email'}
          required
          autoFocus
        />

        <InputField
          label={lang === 'es' ? 'Contraseña' : 'Password'}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={lang === 'es' ? 'Ingrese su contraseña' : 'Enter password'}
          error={error}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
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
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#183655')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              title={
                showPassword
                  ? lang === 'es'
                    ? 'Ocultar contraseña'
                    : 'Hide password'
                  : lang === 'es'
                  ? 'Mostrar contraseña'
                  : 'Show password'
              }
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          }
        />

        <div style={{ marginTop: 22 }}>
          <Button variant="primary" type="submit" loading={isLoading} style={{ width: '100%' }}>
            {lang === 'es' ? 'Acceder al Panel' : 'Authorize & Open Dashboard'}
          </Button>
        </div>
      </form>
    </div>
  );
}
