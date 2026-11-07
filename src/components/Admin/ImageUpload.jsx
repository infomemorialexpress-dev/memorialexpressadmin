import React, { useState, useRef } from 'react';
import api from '../../services/api.js';

export default function ImageUpload({
  label = 'Funeral Home Image',
  value = '',
  onChange,
  hint = 'Upload a photo (JPEG, PNG, WebP up to 10MB).'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleProcessFile = async (file) => {
    setUploadError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP, etc.).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Image size exceeds 20MB. Please choose a smaller photo.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append('file', file);

      let response;
      try {
        // Preferred image endpoint with Cloudinary adaptive storage
        response = await api.post('/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.min(95, Math.round((progressEvent.loaded * 90) / progressEvent.total));
              setUploadProgress(percent);
            }
          },
        });
      } catch (errPrimary) {
        console.warn('[ImageUpload] /upload/image failed, attempting fallback /upload endpoint:', errPrimary);
        // Fallback to generic upload endpoint
        response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      const uploadedUrl =
        response?.data?.secure_url ||
        response?.data?.fileUrl ||
        response?.data?.url;

      if (!uploadedUrl) {
        throw new Error('Upload succeeded on server, but no valid image URL was returned.');
      }

      setUploadProgress(100);
      if (onChange) {
        onChange(uploadedUrl);
      }
    } catch (err) {
      console.error('[ImageUpload] Failed to upload image:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.userMessage ||
        err?.message ||
        'Failed to upload image. Please check your network connection and try again.';
      setUploadError(errMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
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

      {isUploading ? (
        <div
          className="image-dropzone uploading"
          style={{
            cursor: 'wait',
            borderColor: '#183655',
            backgroundColor: '#f1f5f9',
            padding: '28px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid #cbd5e1',
              borderTopColor: '#183655',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div className="dropzone-text" style={{ textAlign: 'center' }}>
            <span className="dropzone-main" style={{ color: '#183655' }}>
              Uploading to Cloudinary... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
            </span>
            <span className="dropzone-sub">Securing and optimizing image in the cloud</span>
          </div>
        </div>
      ) : value ? (
        <div className="image-preview-card">
          <img
            src={value}
            alt="Preview"
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
              PNG, JPG, SVG, WebP up to 20MB
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
        disabled={isUploading}
      />

      {hint && !uploadError && !isUploading && <div className="form-hint">{hint}</div>}
      {uploadError && <div className="form-error" style={{ color: '#ef4444', marginTop: 6, fontSize: '0.85rem' }}>⚠️ {uploadError}</div>}
    </div>
  );
}
