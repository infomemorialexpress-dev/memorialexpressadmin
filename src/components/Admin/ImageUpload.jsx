import React, { useState, useRef } from 'react';

export default function ImageUpload({
  label = 'Funeral Home Image',
  value = '',
  onChange,
  hint = 'Upload a photo of the funeral home facade, chapel, or facility logo (JPEG, PNG, WebP up to 4MB).'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleProcessFile = (file) => {
    setUploadError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP, etc.).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Image size exceeds 4MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (onChange) {
        onChange(dataUrl);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleProcessFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleProcessFile(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-wrapper">
      <label className="form-label">
        <span>{label}</span>
      </label>

      {value ? (
        <div className="image-preview-card">
          <img
            src={value}
            alt="Funeral home facility preview"
            className="uploaded-preview-img"
          />
          <div className="image-preview-overlay">
            <button
              type="button"
              className="btn-overlay-action change"
              onClick={() => fileInputRef.current?.click()}
            >
              🔄 Change Photo
            </button>
            <button
              type="button"
              className="btn-overlay-action remove"
              onClick={handleRemove}
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`image-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <div className="dropzone-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#183655" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className="dropzone-text">
            <span className="dropzone-main">
              Click to browse or drag & drop photo
            </span>
            <span className="dropzone-sub">
              PNG, JPG, SVG, WebP up to 4MB
            </span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {hint && !uploadError && <div className="form-hint">{hint}</div>}
      {uploadError && <div className="form-error">{uploadError}</div>}
    </div>
  );
}
