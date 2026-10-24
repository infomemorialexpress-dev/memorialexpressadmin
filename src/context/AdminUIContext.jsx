import React, { createContext, useContext, useState, useCallback } from 'react';

const AdminUIContext = createContext(null);

export function AdminUIProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('memorial_admin_lang') || 'en');
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration + 300);
    }
  }, []);

  const setLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('memorial_admin_lang', newLang);
  };

  return (
    <AdminUIContext.Provider
      value={{
        lang,
        setLanguage,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </AdminUIContext.Provider>
  );
}

export function useAdminUI() {
  const context = useContext(AdminUIContext);
  if (!context) {
    throw new Error('useAdminUI must be used within an AdminUIProvider');
  }
  return context;
}
