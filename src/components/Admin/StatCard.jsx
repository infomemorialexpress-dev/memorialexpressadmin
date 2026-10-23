import React from 'react';

export default function StatCard({
  icon,
  label,
  value,
  subtext,
  badgeText,
  badgeType = 'default', // 'success', 'warning', 'info', 'default'
  onClick,
  accentColor = '#183655'
}) {
  const badgeClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    info: 'badge-info',
    default: 'badge-default'
  };

  return (
    <div
      className={`admin-stat-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ '--stat-accent': accentColor }}
    >
      <div className="stat-card-top">
        <div className="stat-icon-wrapper">
          {icon}
        </div>
        {badgeText && (
          <span className={`stat-badge ${badgeClasses[badgeType] || badgeClasses.default}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="stat-card-bottom">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
    </div>
  );
}
