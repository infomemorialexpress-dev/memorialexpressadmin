import React from 'react';

export default function InputField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  error = '',
  hint = '',
  id,
  name,
  disabled = false,
  required = false,
  min,
  max,
  step,
  className = '',
  autoFocus = false,
  style = {},
  rightElement = null,
  onWheel,
  onKeyDown
}) {
  const isNumberType = type === 'number';
  const effectiveMin = isNumberType ? (min !== undefined ? min : '0') : min;

  const handleKeyDown = (e) => {
    if (isNumberType) {
      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
      }
    }
    if (onKeyDown) onKeyDown(e);
  };

  const handleWheel = (e) => {
    if (isNumberType) {
      e.target.blur();
    }
    if (onWheel) onWheel(e);
  };

  const handleChange = (e) => {
    if (isNumberType) {
      const val = e.target.value;
      if (val !== '' && Number(val) < 0) {
        e.target.value = '0';
      }
    }
    if (onChange) onChange(e);
  };

  return (
    <div className={`form-group ${className}`} style={style}>
      {label && (
        <label htmlFor={id} className="form-label">
          <span>{label} {required && <span style={{ color: '#dc2626' }}>*</span>}</span>
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          placeholder={placeholder}
          disabled={disabled}
          min={effectiveMin}
          max={max}
          step={step}
          autoFocus={autoFocus}
          className={`form-input ${error ? 'has-error' : ''}`}
          style={rightElement ? { paddingRight: 42, width: '100%' } : { width: '100%' }}
        />
        {rightElement && (
          <div style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            {rightElement}
          </div>
        )}
      </div>
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
