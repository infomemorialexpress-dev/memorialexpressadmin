import React, { createContext, useContext, useState, useCallback } from 'react';

const AdminUIContext = createContext(null);

export function AdminUIProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('memorial_admin_lang') || 'en');
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
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
