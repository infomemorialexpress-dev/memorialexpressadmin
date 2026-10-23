import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authenticateAdmin,
  verifyAdminSession,
  logoutAdmin,
  getStoredAdminToken
} from '../services/admin/adminService.js';
import { formatErrorMessage } from '../services/base/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredAdminToken());
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredAdminToken()));
  const [isLoading, setIsLoading] = useState(true);

  // Validate session on initial mount
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const storedToken = getStoredAdminToken();
        if (!storedToken) {
          if (isMounted) {
            setIsAuthenticated(false);
            setToken(null);
            setAdminUser(null);
            setIsLoading(false);
          }
          return;
        }

        const res = await verifyAdminSession(storedToken);
        if (isMounted) {
          if (res.valid) {
            setIsAuthenticated(true);
            setToken(storedToken);
            setAdminUser(res.admin);
          } else {
            setIsAuthenticated(false);
            setToken(null);
            setAdminUser(null);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[AuthContext] Verification failed:', err);
        if (isMounted) {
          setIsAuthenticated(false);
          setToken(null);
          setIsLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in administrator with PIN or credentials
   */
  const login = async (credentials) => {
    try {
      const res = await authenticateAdmin(credentials);
      if (res.success && res.token) {
        setToken(res.token);
        setIsAuthenticated(true);
        setAdminUser(res.admin);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (err) {
      return {
        success: false,
        error: formatErrorMessage(err)
      };
    }
  };

  /**
   * Log out administrator
   */
  const logout = async () => {
    await logoutAdmin();
    setToken(null);
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        adminUser,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
