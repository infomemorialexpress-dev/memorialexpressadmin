import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStoredDb,
  saveStoredDb,
  formatErrorMessage
} from '../services/base/apiClient.js';
import {
  addFuneralHome,
  updateFuneralHome,
  deleteFuneralHome,
  updatePrices,
  importCatalog,
  resetDemoData,
  getStoredAgents,
  saveStoredAgents,
  fetchAgents,
  addAgent,
  updateAgent,
  setAgentVerificationStatus,
  deleteAgent
} from '../services/admin/adminService.js';
import { useAdminUI } from './AdminUIContext.jsx';
import api from '../services/api.js';

const AdminDataContext = createContext(null);

export function AdminDataProvider({ children }) {
  const { lang, addToast } = useAdminUI();

  // Primary state: database schema and sales agents
  const [adminDb, setAdminDb] = useState(() => getStoredDb());
  const [agents, setAgents] = useState(() => getStoredAgents());
  const [selectedHomeId, setSelectedHomeId] = useState(() => {
    const db = getStoredDb();
    return db?.homes?.[0]?.id || 'optima';
  });

  // Load latest agents from backend API
  useEffect(() => {
    let mounted = true;
    fetchAgents().then(data => {
      if (mounted && Array.isArray(data) && data.length > 0) {
        setAgents(data);
      }
    }).catch(err => {
      console.warn('Initial agents load failed:', err);
    });
    return () => { mounted = false; };
  }, []);

  // Load latest funeral homes from backend API
  useEffect(() => {
    let mounted = true;
    api.get('/funeral-homes')
      .then(res => {
        if (mounted && Array.isArray(res.data) && res.data.length > 0) {
          setAdminDb(prev => ({
            ...prev,
            homes: res.data
          }));
        }
      })
      .catch(err => {
        console.warn('Initial funeral homes load failed:', err);
      });
    return () => { mounted = false; };
  }, []);

  // Ensure selectedHomeId stays valid if homes list updates
  useEffect(() => {
    if (adminDb?.homes?.length > 0) {
      const exists = adminDb.homes.some(h => h.id === selectedHomeId);
      if (!exists) {
        setSelectedHomeId(adminDb.homes[0].id);
      }
    }
  }, [adminDb, selectedHomeId]);

  const activeHome = adminDb?.homes?.find(h => h.id === selectedHomeId) || adminDb?.homes?.[0] || null;

  /* =========================================================================
     FUNERAL HOMES HANDLERS
     ========================================================================= */

  const handleAddHome = useCallback(async (homeData) => {
    try {
      const res = await addFuneralHome(homeData);
      const updatedDb = getStoredDb();
      setAdminDb(updatedDb);
      setSelectedHomeId(res.home.id);
      addToast(
        lang === 'es'
          ? `Funeraria "${res.home.name}" agregada exitosamente.`
          : `Funeral home "${res.home.name}" added successfully.`,
        'success'
      );
      return { success: true, home: res.home };
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return { success: false, error: formatErrorMessage(err) };
    }
  }, [addToast, lang]);

  const handleUpdateHome = useCallback(async (homeId, updates) => {
    try {
      const res = await updateFuneralHome(homeId, updates);
      setAdminDb(getStoredDb());
      addToast(
        lang === 'es'
          ? `Funeraria "${res.home.name}" actualizada.`
          : `Funeral home "${res.home.name}" updated.`,
        'success'
      );
      return { success: true, home: res.home };
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return { success: false, error: formatErrorMessage(err) };
    }
  }, [addToast, lang]);

  const handleDeleteHome = useCallback(async (homeId) => {
    try {
      const homeToDelete = adminDb?.homes?.find(h => h.id === homeId);
      await deleteFuneralHome(homeId);
      const updatedDb = getStoredDb();
      setAdminDb(updatedDb);
      if (selectedHomeId === homeId && updatedDb.homes?.length > 0) {
        setSelectedHomeId(updatedDb.homes[0].id);
      }
      addToast(
        lang === 'es'
          ? `Funeraria "${homeToDelete?.name || homeId}" eliminada.`
          : `Funeral home "${homeToDelete?.name || homeId}" removed.`,
        'success'
      );
      return { success: true };
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return { success: false };
    }
  }, [addToast, adminDb?.homes, lang, selectedHomeId]);

  /* =========================================================================
     PRICING & CATALOG HANDLERS
     ========================================================================= */

  const handleCasketPriceChange = useCallback(async (casketId, newPrice) => {
    const priceNum = Math.max(0, Number(newPrice) || 0);
    const updatedCaskets = (adminDb.caskets || []).map(c => {
      if (c.id === casketId) {
        return { ...c, price: priceNum };
      }
      return c;
    });

    try {
      const res = await updatePrices(selectedHomeId, { caskets: updatedCaskets });
      if (res.success) {
        setAdminDb(res.db);
        addToast(lang === 'es' ? 'Precio de ataúd actualizado.' : 'Casket price updated.', 'success');
      }
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
    }
  }, [addToast, adminDb.caskets, lang, selectedHomeId]);

  const handleAddonPriceChange = useCallback(async (addonId, newPrice) => {
    const priceNum = Math.max(0, Number(newPrice) || 0);
    const updatedAddons = (adminDb.addons || []).map(a => {
      if (a.id === addonId) {
        return { ...a, price: priceNum };
      }
      return a;
    });

    try {
      const res = await updatePrices(selectedHomeId, { addons: updatedAddons });
      if (res.success) {
        setAdminDb(res.db);
        addToast(lang === 'es' ? 'Tarifa de adicional actualizada.' : 'Add-on rate updated.', 'success');
      }
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
    }
  }, [addToast, adminDb.addons, lang, selectedHomeId]);

  const handlePackagePriceChange = useCallback(async (homeId, serviceId, sectionKey, amount) => {
    const val = Math.max(0, Number(amount) || 0);
    const packageKey = `${homeId}|${serviceId}`;
    const currentPkg = adminDb.packages?.[packageKey] || { section1: 0, section2: 0, verified: true };
    const updatedPkg = { ...currentPkg, [sectionKey]: val };

    try {
      const res = await updatePrices(homeId, {
        packages: {
          [packageKey]: updatedPkg
        }
      });
      if (res.success) {
        setAdminDb(res.db);
        addToast(
          lang === 'es' ? 'Paquete de servicio actualizado.' : 'Service package rate updated.',
          'success'
        );
      }
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
    }
  }, [addToast, adminDb.packages, lang]);

  const handleAddItem = useCallback(async ({ name, price, category, homeId, description = '', image = '' }) => {
    const priceNum = Math.max(0, Number(price) || 0);
    const targetHome = homeId || selectedHomeId;
    const id = (category === 'casket' ? 'casket_' : 'addon_') + Date.now();

    try {
      if (category === 'casket') {
        const newCasket = {
          id,
          name: name.trim(),
          price: priceNum,
          home: targetHome,
          description: description || 'Custom catalog model',
          image: image || '',
          taxable: true
        };
        const updated = [...(adminDb.caskets || []), newCasket];
        const res = await updatePrices(targetHome, { caskets: updated });
        if (res.success) {
          setAdminDb(res.db);
          addToast(lang === 'es' ? 'Ataúd agregado al catálogo.' : 'Casket added to catalog.', 'success');
          return true;
        }
      } else {
        const newAddon = {
          id,
          name: name.trim(),
          price: priceNum,
          home: targetHome,
          taxable: false
        };
        const updated = [...(adminDb.addons || []), newAddon];
        const res = await updatePrices(targetHome, { addons: updated });
        if (res.success) {
          setAdminDb(res.db);
          addToast(lang === 'es' ? 'Servicio adicional agregado.' : 'Add-on added to catalog.', 'success');
          return true;
        }
      }
      return false;
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  }, [addToast, adminDb.addons, adminDb.caskets, lang, selectedHomeId]);

  const handleUpdateItem = useCallback(async (itemId, itemType, updates) => {
    try {
      if (itemType === 'casket') {
        const updated = (adminDb.caskets || []).map(c => {
          if (c.id === itemId) {
            return {
              ...c,
              name: updates.name !== undefined ? updates.name : c.name,
              price: updates.price !== undefined ? Number(updates.price) : c.price,
              description: updates.specifications !== undefined ? updates.specifications : (updates.description !== undefined ? updates.description : c.description),
              image: updates.image !== undefined ? updates.image : c.image
            };
          }
          return c;
        });
        const res = await updatePrices(selectedHomeId, { caskets: updated });
        if (res.success) {
          setAdminDb(res.db);
          addToast(lang === 'es' ? 'Ataúd actualizado con éxito.' : 'Casket updated successfully.', 'success');
          return true;
        }
      } else {
        const updated = (adminDb.addons || []).map(a => {
          if (a.id === itemId) {
            return {
              ...a,
              name: updates.name !== undefined ? updates.name : a.name,
              price: updates.price !== undefined ? Number(updates.price) : a.price,
              description: updates.specifications !== undefined ? updates.specifications : (updates.description !== undefined ? updates.description : a.description)
            };
          }
          return a;
        });
        const res = await updatePrices(selectedHomeId, { addons: updated });
        if (res.success) {
          setAdminDb(res.db);
          addToast(lang === 'es' ? 'Servicio adicional actualizado.' : 'Add-on updated successfully.', 'success');
          return true;
        }
      }
      return false;
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  }, [addToast, adminDb.addons, adminDb.caskets, lang, selectedHomeId]);

  const handleDeleteCasket = useCallback(async (casketId) => {
    try {
      const updated = (adminDb.caskets || []).filter(c => c.id !== casketId);
      const res = await updatePrices(selectedHomeId, { caskets: updated });
      if (res.success) {
        setAdminDb(res.db);
        addToast(lang === 'es' ? 'Ataúd eliminado.' : 'Casket removed.', 'success');
        return true;
      }
      return false;
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  }, [addToast, adminDb.caskets, lang, selectedHomeId]);

  const handleDeleteAddon = useCallback(async (addonId) => {
    try {
      const updated = (adminDb.addons || []).filter(a => a.id !== addonId);
      const res = await updatePrices(selectedHomeId, { addons: updated });
      if (res.success) {
        setAdminDb(res.db);
        addToast(lang === 'es' ? 'Adicional eliminado.' : 'Add-on removed.', 'success');
        return true;
      }
      return false;
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  }, [addToast, adminDb.addons, lang, selectedHomeId]);

  /* =========================================================================
     SALES AGENTS (USER MANAGEMENT) HANDLERS
     ========================================================================= */

  const handleAddAgent = useCallback(async (agentData) => {
    try {
      const res = await addAgent(agentData);
      setAgents(res.allAgents);
      addToast(
        lang === 'es'
          ? `Agente "${res.agent.name}" registrado exitosamente.`
          : `Sales agent "${res.agent.name}" registered successfully.`,
        'success'
      );
      return { success: true, agent: res.agent };
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return { success: false, error: formatErrorMessage(err) };
    }
  }, [addToast, lang]);

  const handleUpdateAgent = useCallback(async (agentId, updates) => {
    try {
      const res = await updateAgent(agentId, updates);
      setAgents(res.allAgents);
      addToast(
        lang === 'es'
          ? `Datos del agente "${res.agent.name}" actualizados.`
          : `Agent "${res.agent.name}" updated successfully.`,
        'success'
      );
      return { success: true, agent: res.agent };
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return { success: false, error: formatErrorMessage(err) };
    }
  }, [addToast, lang]);

  const handleToggleAgentVerification = useCallback(async (agentId, newStatus) => {
    try {
      const res = await setAgentVerificationStatus(agentId, newStatus);
      setAgents(res.allAgents);
      addToast(
        lang === 'es'
          ? `Estado del agente cambiado a "${newStatus}".`
          : `Agent verification set to "${newStatus}".`,
        'success'
      );
      return { success: true };
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return { success: false };
    }
  }, [addToast, lang]);

  const handleDeleteAgent = useCallback(async (agentId) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      const res = await deleteAgent(agentId);
      setAgents(res.allAgents);
      addToast(
        lang === 'es'
          ? `Agente "${agent?.name || agentId}" eliminado.`
          : `Agent "${agent?.name || agentId}" removed.`,
        'success'
      );
      return { success: true };
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return { success: false };
    }
  }, [addToast, agents, lang]);

  /* =========================================================================
     GLOBAL BACKUP / RESTORE HANDLERS
     ========================================================================= */

  const handleExportJson = useCallback(() => {
    try {
      const payload = {
        database: adminDb,
        agents: agents,
        exportedAt: new Date().toISOString()
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'memorial_express_admin_backup.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addToast(lang === 'es' ? 'Archivo JSON exportado.' : 'Pricing & agents JSON exported.', 'success');
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
    }
  }, [addToast, adminDb, agents, lang]);

  const handleImportJson = useCallback((e) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        const catalogData = imported.database || imported;
        const res = await importCatalog(catalogData);
        if (res.success) {
          setAdminDb(res.db);
          if (Array.isArray(imported.agents)) {
            saveStoredAgents(imported.agents);
            setAgents(imported.agents);
          }
          addToast(lang === 'es' ? 'Catálogo importado exitosamente.' : 'Catalog imported successfully.', 'success');
        }
      } catch (err) {
        addToast(formatErrorMessage(err), 'error');
      }
    };
    reader.readAsText(file);
  }, [addToast, lang]);

  const handleResetDemo = useCallback(async () => {
    if (!window.confirm(lang === 'es' ? '¿Restaurar los precios, agentes y funerarias predeterminadas?' : 'Restore default demo pricing, agents, and funeral homes?')) {
      return;
    }
    try {
      const res = await resetDemoData();
      if (res.success) {
        setAdminDb(res.db);
        setAgents(res.agents);
        setSelectedHomeId(res.db?.homes?.[0]?.id || 'optima');
        addToast(lang === 'es' ? 'Datos restablecidos a los valores predeterminados.' : 'Data reset to defaults.', 'success');
      }
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
    }
  }, [addToast, lang]);

  return (
    <AdminDataContext.Provider
      value={{
        adminDb,
        agents,
        selectedHomeId,
        setSelectedHomeId,
        activeHome,

        // Homes
        handleAddHome,
        handleUpdateHome,
        handleDeleteHome,

        // Pricing
        handleCasketPriceChange,
        handleAddonPriceChange,
        handlePackagePriceChange,
        handleAddItem,
        handleUpdateItem,
        handleDeleteCasket,
        handleDeleteAddon,

        // Agents
        handleAddAgent,
        handleUpdateAgent,
        handleToggleAgentVerification,
        handleDeleteAgent,

        // Database
        handleExportJson,
        handleImportJson,
        handleResetDemo
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
}
