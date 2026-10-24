import React from 'react';

/**
 * Basic Shimmer Line / Block
 */
export function SkeletonBlock({ width = '100%', height = '16px', borderRadius = '6px', style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius,
        flexShrink: 0,
        ...style
      }}
    />
  );
}

/**
 * Skeleton for Funeral Home Cards in Admin FuneralHomesPage
 */
export function FuneralHomeAdminCardSkeleton({ count = 6 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
        marginTop: '16px'
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-box"
          style={{
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1.5px solid #e8eef5'
          }}
        >
          {/* Facility Photo Frame */}
          <SkeletonBlock height="150px" borderRadius="10px" />

          {/* Title & Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonBlock width="65%" height="20px" borderRadius="4px" />
            <SkeletonBlock width="25%" height="18px" borderRadius="12px" />
          </div>

          {/* Location details */}
          <SkeletonBlock width="80%" height="13px" />
          <SkeletonBlock width="50%" height="13px" />

          {/* Chapels tags */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <SkeletonBlock width="70px" height="22px" borderRadius="6px" />
            <SkeletonBlock width="85px" height="22px" borderRadius="6px" />
          </div>

          {/* Actions row */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <SkeletonBlock width="50%" height="34px" borderRadius="6px" />
            <SkeletonBlock width="50%" height="34px" borderRadius="6px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Stat Metric Cards in Dashboard
 */
export function StatCardsSkeleton({ count = 4 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-box"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <SkeletonBlock width="50%" height="14px" />
            <SkeletonBlock width="24px" height="24px" borderRadius="6px" />
          </div>
          <SkeletonBlock width="40%" height="28px" borderRadius="4px" />
          <SkeletonBlock width="65%" height="12px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Data Table Rows (Pricing, Agents, Users)
 */
export function TableRowsSkeleton({ columns = 5, rows = 6 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0' }}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '12px 16px',
            backgroundColor: rIdx % 2 === 0 ? '#f8fafc' : '#ffffff',
            borderRadius: '6px'
          }}
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <SkeletonBlock
              key={cIdx}
              width={cIdx === 0 ? '30%' : cIdx === columns - 1 ? '15%' : '20%'}
              height="16px"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
