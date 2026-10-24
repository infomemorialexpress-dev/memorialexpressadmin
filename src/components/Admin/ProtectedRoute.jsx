import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

/**
 * ProtectedRoute Wrapper
 * Ensures that child routes are strictly inaccessible without a valid admin login token.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <LoadingSpinner
        size="lg"
        color="accent"
        fullHeight
        label="Verifying security credentials..."
        subtext="Memorial Express Admin Portal"
      />
    );
  }

  if (!isAuthenticated) {
    // Strictly redirect to admin login if no valid token
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
