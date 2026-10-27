import React, { useState, useEffect } from 'react';

export default function AgentModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  funeralHomes = [],
  lang = 'en'
}) {
  const isEditing = Boolean(initialData?.id || initialData?._id);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    licenseId: '',
    territory: '',
    agentNumber: '',
    uplineName: '',
    assignedHome: '',
    status: 'pending' // 'verified' | 'pending' | 'suspended'
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      const matchedInitialHome = funeralHomes.find(
        h => (h._id && (h._id === initialData.assignedHomeId || h._id === initialData.assignedHome?._id || h._id === initialData.assignedHome)) ||
             (h.id && (h.id === initialData.assignedHomeId || h.id === initialData.assignedHome?.id || h.id === initialData.assignedHome)) ||
             (h.name && (h.name === initialData.assignedHome || h.name === initialData.assignedHome?.name))
      );
      const homeIdVal = matchedInitialHome ? (matchedInitialHome._id || matchedInitialHome.id) : (initialData.assignedHomeId || '');

      const agentStatus = (initialData.verificationStatus || initialData.status || 'pending').toLowerCase();

      setFormData({
        fullName: initialData.fullName || initialData.name || '',
        email: initialData.email || '',
        password: '',
        phone: initialData.phone || '',
        licenseId: initialData.licenseId || '',
        territory: initialData.territory || '',
        agentNumber: initialData.agentNumber || '',
        uplineName: initialData.uplineName || '',
        assignedHome: homeIdVal,
        status: agentStatus
      });
      setConfirmPassword('');
    } else {
      const defaultHomeId = funeralHomes[0]?._id || funeralHomes[0]?.id || '';
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        licenseId: '',
        territory: '',
        agentNumber: '',
        uplineName: '',
        assignedHome: defaultHomeId,
        status: 'pending'
      });
      setConfirmPassword('');
    }
    setFormError('');
    setShowPassword(false);
  }, [initialData, isOpen, funeralHomes]);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = 'Agent';
    for (let i = 0; i < 4; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    generated += '26!';
    setFormData(prev => ({ ...prev, password: generated }));
    setConfirmPassword(generated);
    setShowPassword(true);
  };

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim()) {
      setFormError(lang === 'es' ? 'El nombre completo es obligatorio.' : 'Full name is required.');
      return;
    }

    if (!formData.email.trim()) {
      setFormError(lang === 'es' ? 'El correo electrónico es obligatorio.' : 'Email address is required.');
      return;
    }

    if (!isEditing && !formData.password.trim()) {
      setFormError(lang === 'es' ? 'La contraseña de acceso es obligatoria para nuevos agentes.' : 'Login password is required for new sales agents.');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setFormError(lang === 'es' ? 'La contraseña debe tener al menos 6 caracteres.' : 'Password must be at least 6 characters long.');
      return;
    }

    if (formData.password && confirmPassword && formData.password !== confirmPassword) {
      setFormError(lang === 'es' ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find matching funeral home by ID or name
      const matchedHome = funeralHomes.find(
        h => (h._id && h._id === formData.assignedHome) ||
             (h.id && h.id === formData.assignedHome) ||
             h.name === formData.assignedHome
      );

      const targetHomeId = matchedHome
        ? (matchedHome._id || matchedHome.id)
        : (formData.assignedHome && formData.assignedHome.match(/^[0-9a-fA-F]{24}$/) ? formData.assignedHome : null);

      const isVerified = formData.status === 'verified';

      const payload = {
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        licenseId: formData.licenseId.trim(),
        territory: formData.territory.trim(),
        assignedHomeId: targetHomeId,
        assignedHome: targetHomeId,
        agentNumber: formData.agentNumber.trim(),
        uplineName: formData.uplineName.trim(),
        status: formData.status,
        verificationStatus: formData.status.toUpperCase(),
        isActive: isVerified
      };

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await onSave(payload, initialData?.id || initialData?._id);
      if (res?.success !== false) {
        onClose();
      }
    } catch (err) {
      setFormError(err.message || 'Error saving agent record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="agent-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="agent-modal-header">
          <div>
            <h2 className="agent-modal-title">
              {isEditing
                ? (lang === 'es' ? 'Editar Agente de Ventas' : 'Edit Sales Agent')
                : (lang === 'es' ? 'Registrar Nuevo Agente' : 'Register New Sales Agent')}
            </h2>
            <p className="agent-modal-subtitle">
              {lang === 'es'
                ? 'Configure credenciales de acceso, contraseña, licencias, funeraria asignada y verificación.'
                : 'Configure agent login credentials, password, licensing, assigned home, and verification standing.'}
            </p>
          </div>
          <button
            type="button"
            className="agent-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="agent-modal-body">
            {formError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                ⚠️ {formError}
              </div>
            )}

            {/* Row 1: Full Name & Email Address */}
            <div className="agent-form-row-2">
              <div className="agent-form-group">
                <label className="agent-form-label">
                  <span>{lang === 'es' ? 'Nombre Completo' : 'Full Name'} <span className="req">*</span></span>
                </label>
                <input
                  type="text"
                  className="agent-form-input"
                  placeholder="e.g. Carlos Mendoza"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  required
                />
              </div>

              <div className="agent-form-group">
                <label className="agent-form-label">
                  <span>{lang === 'es' ? 'Correo Electrónico' : 'Email Address'} <span className="req">*</span></span>
                </label>
                <input
                  type="email"
                  className="agent-form-input"
                  placeholder="agent@memorialexpress.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Row 2: Agent Login Password & Confirm Password */}
            <div className="agent-form-row-2">
              <div className="agent-form-group">
                <label className="agent-form-label">
                  <span>
                    {lang === 'es' ? 'Contraseña de Acceso' : 'Agent Login Password'}
                    {!isEditing && <span className="req">*</span>}
                  </span>
                  <button
                    type="button"
                    className="agent-pwd-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span>{showPassword ? '🙈' : '👁️'}</span>
                    <span>{showPassword ? (lang === 'es' ? 'Ocultar' : 'Hide') : (lang === 'es' ? 'Mostrar' : 'Show')}</span>
                  </button>
                </label>

                <div className="agent-pwd-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="agent-form-input"
                    style={{ flex: 1 }}
                    placeholder={
                      isEditing
                        ? '••••••••••'
                        : (lang === 'es' ? 'Mín. 6 caracteres' : 'Min. 6 characters')
                    }
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required={!isEditing}
                  />
                  <button
                    type="button"
                    className="btn-generate-pwd"
                    onClick={handleGeneratePassword}
                    title="Generate random strong password"
                  >
                    <span>🎲</span> {lang === 'es' ? 'Generar' : 'Generate'}
                  </button>
                </div>

                <span className="agent-form-hint">
                  {isEditing
                    ? (lang === 'es' ? 'Solo complete si desea cambiar la contraseña.' : 'Only enter if you wish to change the password.')
                    : (lang === 'es' ? 'Usada por el agente para iniciar sesión.' : 'Used by the agent to log into the quoter app.')}
                </span>
              </div>

              <div className="agent-form-group">
                <label className="agent-form-label">
                  <span>{lang === 'es' ? 'Confirmar Contraseña' : 'Confirm Password'}</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="agent-form-input"
                  placeholder={isEditing ? '••••••••••' : (lang === 'es' ? 'Repita la contraseña' : 'Repeat password')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span className="agent-form-hint">
                  {lang === 'es' ? 'Debe coincidir con la contraseña ingresada' : 'Must match the password entered'}
                </span>
              </div>
            </div>

            {/* Row 3: Phone Number & Agent License ID */}
            <div className="agent-form-row-2">
              <div className="agent-form-group">
                <label className="agent-form-label">
                  <span>{lang === 'es' ? 'Número de Teléfono' : 'Phone Number'}</span>
                </label>
                <input
                  type="text"
                  className="agent-form-input"
                  placeholder="(323) 555-0192"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              <div className="agent-form-group">
                <label className="agent-form-label">
                  <span>{lang === 'es' ? 'Número de Licencia (ID)' : 'Agent License ID'}</span>
                </label>
                <input
                  type="text"
                  className="agent-form-input"
                  placeholder="CA-FD-98421"
                  value={formData.licenseId}
                  onChange={(e) => handleChange('licenseId', e.target.value)}
                />
              </div>
            </div>

            {/* Row 3.5: Agent Number & Upline's Name */}
            <div className="agent-form-row-2">
              <div className="agent-form-group">
                <label className="agent-form-label">
                  <span>{lang === 'es' ? 'Número de Agente' : 'Agent Number'}</span>
                </label>
                <input
                  type="text"
                  className="agent-form-input"
                  placeholder="e.g. AG-10023"
                  value={formData.agentNumber}
                  onChange={(e) => handleChange('agentNumber', e.target.value)}
                />
              </div>

              <div className="agent-form-group">
                <label className="agent-form-label">
                  <span>{lang === 'es' ? 'Nombre del Upline' : "Upline's Name"}</span>
                </label>
                <input
                  type="text"
                  className="agent-form-input"
                  placeholder="e.g. John Doe / Regional Director"
                  value={formData.uplineName}
                  onChange={(e) => handleChange('uplineName', e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Territory / Region & Primary Assigned Home */}
            <div className="agent-form-row-2">
              <div className="agent-form-group">
                <label className="agent-form-label">
                  <span>{lang === 'es' ? 'Territorio / Región' : 'Territory / Region'}</span>
                </label>
                <input
                  type="text"
                  className="agent-form-input"
                  placeholder="e.g. East Los Angeles & Montebello"
                  value={formData.territory}
                  onChange={(e) => handleChange('territory', e.target.value)}
                />
              </div>

              <div className="agent-form-group">
                <label className="agent-form-label">
                  <span>{lang === 'es' ? 'Funeraria Asignada' : 'Primary Assigned Home'}</span>
                </label>
                <select
                  className="agent-form-input"
                  value={formData.assignedHome}
                  onChange={(e) => handleChange('assignedHome', e.target.value)}
                >
                  <option value="">{lang === 'es' ? 'Todas las Funerarias (*)' : 'All Funeral Homes (*)'}</option>
                  {funeralHomes.map((home) => (
                    <option key={home._id || home.id} value={home._id || home.id}>
                      {home.name} {home.city ? `(${home.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 5: Verification Status Radio Cards */}
            <div className="agent-form-group">
              <label className="agent-form-label">
                <span>{lang === 'es' ? 'Estado de Verificación' : 'Verification Status'}</span>
              </label>
              <div className="status-radio-cards-row">
                {/* Verified Card */}
                <label
                  className={`status-radio-card verified ${formData.status === 'verified' ? 'selected' : ''}`}
                  onClick={() => handleChange('status', 'verified')}
                >
                  <input
                    type="radio"
                    name="verificationStatus"
                    value="verified"
                    checked={formData.status === 'verified'}
                    onChange={() => handleChange('status', 'verified')}
                  />
                  <div>
                    <div className="status-card-title">
                      <span>✅</span> {lang === 'es' ? 'Verificado' : 'Verified'}
                    </div>
                    <div className="status-card-desc">
                      {lang === 'es' ? 'Acceso total a cotizaciones' : 'Full quote generation access'}
                    </div>
                  </div>
                </label>

                {/* Pending Review Card */}
                <label
                  className={`status-radio-card pending ${formData.status === 'pending' ? 'selected' : ''}`}
                  onClick={() => handleChange('status', 'pending')}
                >
                  <input
                    type="radio"
                    name="verificationStatus"
                    value="pending"
                    checked={formData.status === 'pending'}
                    onChange={() => handleChange('status', 'pending')}
                  />
                  <div>
                    <div className="status-card-title">
                      <span>⏳</span> {lang === 'es' ? 'En Revisión' : 'Pending Review'}
                    </div>
                    <div className="status-card-desc">
                      {lang === 'es' ? 'En espera de aprobación' : 'Awaiting admin review'}
                    </div>
                  </div>
                </label>

                {/* Suspended Card */}
                <label
                  className={`status-radio-card suspended ${formData.status === 'suspended' ? 'selected' : ''}`}
                  onClick={() => handleChange('status', 'suspended')}
                >
                  <input
                    type="radio"
                    name="verificationStatus"
                    value="suspended"
                    checked={formData.status === 'suspended'}
                    onChange={() => handleChange('status', 'suspended')}
                  />
                  <div>
                    <div className="status-card-title">
                      <span>🚫</span> {lang === 'es' ? 'Suspendido' : 'Suspended'}
                    </div>
                    <div className="status-card-desc">
                      {lang === 'es' ? 'Acceso deshabilitado' : 'Login disabled'}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="agent-modal-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (lang === 'es' ? 'Guardando...' : 'Saving...')
                : isEditing
                ? (lang === 'es' ? 'Guardar Cambios' : 'Save Changes')
                : (lang === 'es' ? 'Agregar Agente' : 'Add Agent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
