import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * ProtectedRoute Wrapper
 * Ensures that child routes are strictly inaccessible without a valid admin login token.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 16
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid #e2e8f0',
          borderTopColor: '#d4af37',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: '#64748b', fontSize: 14 }}>Verifying security credentials...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Strictly redirect to admin login if no valid token
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
