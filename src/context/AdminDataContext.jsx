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

  // Primary state: database schema and sales agents initialized dynamically
  const [adminDb, setAdminDb] = useState(() => ({ homes: [], caskets: [], addons: [], packages: {}, fees: {} }));
  const [agents, setAgents] = useState([]);
  const [selectedHomeId, setSelectedHomeId] = useState('');

  // Load latest agents from backend API
  useEffect(() => {
    let mounted = true;
    fetchAgents().then(data => {
      if (mounted && Array.isArray(data)) {
        setAgents(data);
      }
    }).catch(err => {
      console.warn('Initial agents load failed:', err);
    });
    return () => { mounted = false; };
  }, []);

  // Refresh latest funeral homes from backend API
  const refreshHomes = useCallback(async (selectHomeId = null) => {
    try {
      const res = await api.get('/funeral-homes');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAdminDb(prev => ({
          ...prev,
          homes: res.data
        }));
        if (selectHomeId) {
          setSelectedHomeId(selectHomeId);
        } else {
          setSelectedHomeId(prev => {
            const stillExists = res.data.some(h => (h._id === prev || h.id === prev));
            return stillExists ? prev : (res.data[0]._id || res.data[0].id || '');
          });
        }
        return res.data;
      }
    } catch (err) {
      console.warn('Refreshing funeral homes failed:', err);
    }
    return [];
  }, []);

  // Initial load of funeral homes
  useEffect(() => {
    refreshHomes();
  }, [refreshHomes]);

  // Live services from MongoDB Atlas for selected funeral home
  const [serviceItems, setServiceItems] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Immediately clear all location-specific state arrays (packages, caskets, addons)
  const clearLocationData = useCallback(() => {
    setServiceItems([]);
    setAdminDb(prev => ({
      ...prev,
      caskets: [],
      addons: [],
      packages: {}
    }));
  }, []);

  // Load live catalog (services, caskets, addons) for active funeral home from backend API
  useEffect(() => {
    let mounted = true;
    if (!selectedHomeId) {
      clearLocationData();
      return;
    }

    // Immediately clear arrays for packages, caskets, and addons before new API fetch
    clearLocationData();
    setIsLoadingServices(true);

    // 1. Fetch live Services & Custom Packages
    Promise.allSettled([
      api.get(`/catalog/location/${selectedHomeId}?type=SERVICE`),
      api.get(`/funeral-homes/${selectedHomeId}/packages`)
    ])
      .then(([catalogRes, packagesRes]) => {
        if (!mounted) return;
        const catalogData = catalogRes.status === 'fulfilled' && Array.isArray(catalogRes.value.data) ? catalogRes.value.data : [];
        const homePackagesData = packagesRes.status === 'fulfilled' && Array.isArray(packagesRes.value.data) ? packagesRes.value.data : [];

        // Combine catalog items and funeral home custom packages without duplicate names
        const combined = [...catalogData];
        for (const hp of homePackagesData) {
          const hpId = hp._id || hp.id;
          const hpName = hp.packageName || hp.name || '';
          const existingIdx = combined.findIndex(
            c => (c._id || c.id) === hpId || (c.name && c.name.toLowerCase() === hpName.toLowerCase())
          );
          if (existingIdx >= 0) {
            combined[existingIdx] = {
              ...combined[existingIdx],
              packageName_es: hp.packageName_es || hp.name_es || combined[existingIdx].packageName_es || '',
              name_es: hp.packageName_es || hp.name_es || combined[existingIdx].name_es || '',
              category_es: hp.category_es || combined[existingIdx].category_es || '',
              section1Price: hp.section1Price !== undefined ? hp.section1Price : combined[existingIdx].section1Price,
              section2Price: hp.section2Price !== undefined ? hp.section2Price : combined[existingIdx].section2Price,
              itemizedServices: hp.itemizedServices || combined[existingIdx].itemizedServices,
              visitationHours: hp.visitationHours !== undefined ? Number(hp.visitationHours) : (combined[existingIdx].visitationHours ?? 3),
              displayOrder: hp.displayOrder !== undefined ? Number(hp.displayOrder) : (combined[existingIdx].displayOrder !== undefined ? Number(combined[existingIdx].displayOrder) : 0),
              isCustom: combined[existingIdx].isCustom || false,
            };
          } else {
            combined.push({
              _id: hpId,
              id: hpId,
              name: hpName,
              packageName: hpName,
              packageName_es: hp.packageName_es || hp.name_es || '',
              name_es: hp.packageName_es || hp.name_es || '',
              category: hp.category || 'Traditional',
              category_es: hp.category_es || '',
              section1Price: hp.section1Price,
              section2Price: hp.section2Price,
              itemizedServices: hp.itemizedServices,
              visitationHours: hp.visitationHours !== undefined ? Number(hp.visitationHours) : 3,
              displayOrder: hp.displayOrder !== undefined ? Number(hp.displayOrder) : 0,
              isCustom: true,
              funeralHomeId: selectedHomeId
            });
          }
        }

        combined.sort((a, b) => {
          const orderA = a.displayOrder !== undefined && a.displayOrder !== null ? Number(a.displayOrder) : 0;
          const orderB = b.displayOrder !== undefined && b.displayOrder !== null ? Number(b.displayOrder) : 0;
          if (orderA !== orderB) return orderA - orderB;
          return (a.packageName || a.name || '').localeCompare(b.packageName || b.name || '');
        });

        setServiceItems(combined);

        // Sync live prices into adminDb.packages so PackagePricingTable displays MongoDB values
        setAdminDb(prev => {
          const nextPackages = { ...(prev.packages || {}) };
          for (const item of combined) {
            const nameLower = (item.name || '').toLowerCase();
            let svcSlug = '';
            if (nameLower.includes('two-day') || nameLower.includes('two day') || nameLower.includes('2 day')) svcSlug = 'two_day';
            else if (nameLower.includes('one-day') || nameLower.includes('one day') || nameLower.includes('1 day')) svcSlug = 'one_day';
            else if (nameLower.includes('traditional cremation')) svcSlug = 'traditional_cremation';
            else if (nameLower.includes('memorial cremation')) svcSlug = 'memorial_cremation';
            else if (nameLower.includes('direct cremation')) svcSlug = 'direct_cremation';
            else if (nameLower.includes('ship out with') || nameLower.includes('ship traditional')) svcSlug = 'ship_traditional';
            else if (nameLower.includes('direct ship') || nameLower.includes('ship')) svcSlug = 'ship_direct';
            else svcSlug = item._id || item.id;

            const packageKey = `${selectedHomeId}|${svcSlug}`;
            nextPackages[packageKey] = {
              section1: item.section1Price !== null && item.section1Price !== undefined ? item.section1Price : (nextPackages[packageKey]?.section1 || 0),
              section2: item.section2Price !== null && item.section2Price !== undefined ? item.section2Price : (nextPackages[packageKey]?.section2 || 0),
              verified: true,
              catalogId: item._id || item.id,
              name: item.name,
              category: item.category,
              itemizedServices: item.itemizedServices,
              isCustom: item.isCustom || false
            };
          }
          return {
            ...prev,
            packages: nextPackages
          };
        });
      })
      .catch(err => {
        console.warn('Live catalog services load failed:', err);
      })
      .finally(() => {
        if (mounted) setIsLoadingServices(false);
      });

    // 2. Fetch live Caskets
    api.get(`/catalog/location/${selectedHomeId}?type=CASKET`)
      .then(res => {
        if (!mounted) return;
        const backendCaskets = Array.isArray(res.data)
          ? res.data
              .filter(item => item.listPrice !== null && item.listPrice !== undefined && Number(item.listPrice) > 0)
              .map(item => ({
                id: item._id || item.id,
                _id: item._id || item.id,
                name: item.name,
                itemName_es: item.itemName_es || item.name_es || '',
                name_es: item.itemName_es || item.name_es || '',
                price: Number(item.listPrice),
                listPrice: Number(item.listPrice),
                isActive: Boolean(item.isActive && Number(item.listPrice) > 0),
                description: item.specifications || '',
                specifications: item.specifications || '',
                image: item.imageUrl || '',
                imageUrl: item.imageUrl || '',
                home: item.assignedFuneralHomeId || item.funeralHomeId || selectedHomeId,
                assignedFuneralHomeId: item.assignedFuneralHomeId || item.funeralHomeId || selectedHomeId,
                funeralHomeId: item.assignedFuneralHomeId || item.funeralHomeId || selectedHomeId,
                assignedPackages: Array.isArray(item.assignedPackages) ? item.assignedPackages : [],
                isMandatory: Boolean(item.isMandatory),
                isFixedPrice: Boolean(item.isFixedPrice),
                type: item.type || 'Guaranteed',
                category: item.category || item.type || 'Guaranteed',
                assignment: activeHome?.name || item.assignment || 'Specific Location',
                taxable: true
              }))
          : [];
        setAdminDb(prev => ({ ...prev, caskets: backendCaskets }));
      })
      .catch(err => console.warn('Live caskets load failed:', err));

    // 3. Fetch live Add-ons
    api.get(`/catalog/location/${selectedHomeId}?type=ADDON`)
      .then(res => {
        if (!mounted) return;
        const backendAddons = Array.isArray(res.data)
          ? res.data
              .filter(item => {
                const hasDest = Boolean(item.hasDestinations && Array.isArray(item.destinations) && item.destinations.length > 0);
                const hasPrice = item.listPrice !== null && item.listPrice !== undefined && Number(item.listPrice) >= 0;
                return hasPrice || hasDest;
              })
              .map(item => ({
                id: item._id || item.id,
                _id: item._id || item.id,
                name: item.name,
                itemName_es: item.itemName_es || item.name_es || '',
                name_es: item.itemName_es || item.name_es || '',
                price: item.listPrice !== null && item.listPrice !== undefined ? Number(item.listPrice) : (item.price !== null && item.price !== undefined ? Number(item.price) : 0),
                listPrice: item.listPrice !== null && item.listPrice !== undefined ? Number(item.listPrice) : (item.price !== null && item.price !== undefined ? Number(item.price) : 0),
                isActive: Boolean(
                  item.isActive && ((item.listPrice !== null && Number(item.listPrice) >= 0) || (item.hasDestinations && item.destinations?.length > 0))
                ),
                description: item.specifications || '',
                specifications: item.specifications || '',
                home: item.assignedFuneralHomeId || item.funeralHomeId || selectedHomeId,
                assignedFuneralHomeId: item.assignedFuneralHomeId || item.funeralHomeId || selectedHomeId,
                funeralHomeId: item.assignedFuneralHomeId || item.funeralHomeId || selectedHomeId,
                assignedPackages: Array.isArray(item.assignedPackages) ? item.assignedPackages : [],
                isMandatory: Boolean(item.isMandatory),
                isFixedPrice: Boolean(item.isFixedPrice),
                hasDestinations: Boolean(item.hasDestinations),
                destinations: Array.isArray(item.destinations) ? item.destinations : [],
                type: item.type || 'Non-Guaranteed',
                category: item.category || item.type || 'Non-Guaranteed',
                assignment: activeHome?.name || item.assignment || 'Specific Location',
                taxable: false
              }))
          : [];
        setAdminDb(prev => ({ ...prev, addons: backendAddons }));
      })
      .catch(err => console.warn('Live addons load failed:', err));

    return () => { mounted = false; };
  }, [clearLocationData, selectedHomeId]);

  // Ensure selectedHomeId stays valid if homes list updates
  useEffect(() => {
    if (adminDb?.homes?.length > 0) {
      const exists = adminDb.homes.some(h => (h._id === selectedHomeId || h.id === selectedHomeId));
      if (!exists) {
        setSelectedHomeId(adminDb.homes[0]._id || adminDb.homes[0].id || '');
      }
    }
  }, [adminDb, selectedHomeId]);

  const activeHome = adminDb?.homes?.find(h => (h._id === selectedHomeId || h.id === selectedHomeId)) || adminDb?.homes?.[0] || null;

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

  const isMongoId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

  const handleCasketPriceChange = useCallback(async (casketId, newPrice) => {
    const priceNum = Math.max(0, Number(newPrice) || 0);
    const updatedCaskets = (adminDb.caskets || []).map(c => {
      if (c.id === casketId || c._id === casketId) {
        return { ...c, price: priceNum, listPrice: priceNum };
      }
      return c;
    });

    setAdminDb(prev => ({ ...prev, caskets: updatedCaskets }));

    try {
      if (isMongoId(casketId)) {
        await api.patch(`/catalog/${casketId}`, { listPrice: priceNum });
      }
      const res = await updatePrices(selectedHomeId, { caskets: updatedCaskets });
      if (res.success) {
        addToast(
          lang === 'es' ? 'Precio de ataúd guardado exitosamente.' : 'Casket price saved successfully.',
          'success'
        );
      }
    } catch (err) {
      console.warn('Backend patch casket price failed, saved locally:', err);
      addToast(lang === 'es' ? 'Precio guardado exitosamente.' : 'Price saved successfully.', 'success');
    }
  }, [addToast, adminDb.caskets, lang, selectedHomeId]);

  const handleAddonPriceChange = useCallback(async (addonId, newPrice) => {
    const priceNum = Math.max(0, Number(newPrice) || 0);
    const updatedAddons = (adminDb.addons || []).map(a => {
      if (a.id === addonId || a._id === addonId) {
        return { ...a, price: priceNum, listPrice: priceNum };
      }
      return a;
    });

    setAdminDb(prev => ({ ...prev, addons: updatedAddons }));

    try {
      if (isMongoId(addonId)) {
        await api.patch(`/catalog/${addonId}`, { listPrice: priceNum });
      }
      const res = await updatePrices(selectedHomeId, { addons: updatedAddons });
      if (res.success) {
        addToast(
          lang === 'es' ? 'Tarifa de adicional guardada exitosamente.' : 'Add-on rate saved successfully.',
          'success'
        );
      }
    } catch (err) {
      console.warn('Backend patch addon price failed, saved locally:', err);
      addToast(lang === 'es' ? 'Tarifa guardada exitosamente.' : 'Rate saved successfully.', 'success');
    }
  }, [addToast, adminDb.addons, lang, selectedHomeId]);

  const handlePackagePriceChange = useCallback(async (homeId, serviceId, sectionKey, amount) => {
    const val = Math.max(0, Number(amount) || 0);
    const packageKey = `${homeId}|${serviceId}`;
    const currentPkg = adminDb.packages?.[packageKey] || { section1: 0, section2: 0, verified: true };
    const updatedPkg = { ...currentPkg, [sectionKey]: val };

    // 1. Update state immediately for responsive admin UI
    setAdminDb(prev => ({
      ...prev,
      packages: {
        ...(prev.packages || {}),
        [packageKey]: updatedPkg
      }
    }));

    // 2. Persist to MongoDB Atlas via /catalog or /funeral-homes API
    try {
      let catalogId = currentPkg.catalogId || serviceId;
      if (!catalogId && Array.isArray(serviceItems)) {
        const matched = serviceItems.find(item => {
          const nameLower = (item.name || '').toLowerCase();
          if (serviceId === 'two_day' && nameLower.includes('two')) return true;
          if (serviceId === 'one_day' && nameLower.includes('one')) return true;
          if (serviceId === 'traditional_cremation' && nameLower.includes('traditional cremation')) return true;
          if (serviceId === 'memorial_cremation' && nameLower.includes('memorial cremation')) return true;
          if (serviceId === 'direct_cremation' && nameLower.includes('direct cremation')) return true;
          if (serviceId === 'ship_traditional' && nameLower.includes('ship out with')) return true;
          if (serviceId === 'ship_direct' && nameLower.includes('direct ship')) return true;
          return item._id === serviceId || item.id === serviceId;
        });
        if (matched) catalogId = matched._id || matched.id;
      }

      const effectiveId = catalogId || serviceId;

      if (effectiveId) {
        const fieldName = sectionKey === 'section1' ? 'section1Price' : 'section2Price';
        try {
          await api.patch(`/funeral-homes/${homeId}/packages/${effectiveId}`, {
            [fieldName]: val
          });
        } catch {
          try {
            await api.patch(`/catalog/${effectiveId}`, {
              [fieldName]: val
            });
          } catch (patchErr) {
            console.warn('API patch package error:', patchErr);
          }
        }

        setServiceItems(prev => prev.map(item => {
          if ((item._id || item.id) === effectiveId) {
            return {
              ...item,
              [fieldName]: val
            };
          }
          return item;
        }));
      }

      // Also persist to local storage cache as backup
      await updatePrices(homeId, {
        packages: {
          [packageKey]: updatedPkg
        }
      });

      addToast(
        lang === 'es' ? 'Paquete de servicio guardado exitosamente.' : 'Service package saved successfully.',
        'success'
      );
    } catch (err) {
      console.error('Failed to sync package price to backend:', err);
      addToast(formatErrorMessage(err), 'error');
    }
  }, [addToast, adminDb.packages, lang, serviceItems]);

  const handleAddServicePackage = useCallback(async ({ packageName, packageName_es, category, category_es, itemizedServices, section1Price, section2Price, visitationHours, displayOrder, homeId }) => {
    const targetHome = homeId || selectedHomeId;
    const s1 = Math.max(0, Number(section1Price) || 0);
    const s2 = Math.max(0, Number(section2Price) || 0);
    const vHours = visitationHours !== undefined ? Math.max(0, Number(visitationHours)) : 3;
    const dOrder = displayOrder !== undefined ? Math.max(0, Number(displayOrder)) : 0;

    try {
      const payload = {
        packageName: packageName.trim(),
        packageName_es: (packageName_es || '').trim(),
        name_es: (packageName_es || '').trim(),
        category: category.trim(),
        category_es: (category_es || '').trim(),
        itemizedServices: itemizedServices || {},
        section1Price: s1,
        section2Price: s2,
        visitationHours: vHours,
        displayOrder: dOrder,
      };

      const res = await api.post(`/funeral-homes/${targetHome}/packages`, payload);
      const created = res.data;
      const createdId = created._id || created.id || `custom_pkg_${Date.now()}`;

      const newServiceItem = {
        _id: createdId,
        id: createdId,
        name: created.packageName || packageName.trim(),
        packageName: created.packageName || packageName.trim(),
        packageName_es: created.packageName_es || packageName_es || '',
        name_es: created.packageName_es || packageName_es || '',
        category: created.category || category,
        category_es: created.category_es || category_es || '',
        itemizedServices: created.itemizedServices || itemizedServices || {},
        section1Price: s1,
        section2Price: s2,
        visitationHours: created.visitationHours !== undefined ? Number(created.visitationHours) : vHours,
        displayOrder: created.displayOrder !== undefined ? Number(created.displayOrder) : dOrder,
        isCustom: true,
        funeralHomeId: targetHome
      };

      setServiceItems(prev => {
        const next = [...prev, newServiceItem];
        next.sort((a, b) => {
          const orderA = a.displayOrder !== undefined && a.displayOrder !== null ? Number(a.displayOrder) : 0;
          const orderB = b.displayOrder !== undefined && b.displayOrder !== null ? Number(b.displayOrder) : 0;
          if (orderA !== orderB) return orderA - orderB;
          return (a.packageName || a.name || '').localeCompare(b.packageName || b.name || '');
        });
        return next;
      });

      const packageKey = `${targetHome}|${createdId}`;
      setAdminDb(prev => ({
        ...prev,
        packages: {
          ...(prev.packages || {}),
          [packageKey]: {
            section1: s1,
            section2: s2,
            verified: true,
            catalogId: createdId,
            name: newServiceItem.name,
            category: newServiceItem.category,
            isCustom: true
          }
        }
      }));

      addToast(
        lang === 'es' ? 'Paquete de servicio guardado exitosamente.' : 'Service package saved successfully.',
        'success'
      );
      return true;
    } catch (err) {
      console.error('Failed to create service package:', err);
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  }, [addToast, lang, selectedHomeId]);

  const handleUpdateServicePackage = useCallback(async ({ packageId, packageName, packageName_es, category, category_es, itemizedServices, section1Price, section2Price, visitationHours, displayOrder, homeId }) => {
    const targetHome = homeId || selectedHomeId;
    const s1 = Math.max(0, Number(section1Price) || 0);
    const s2 = Math.max(0, Number(section2Price) || 0);
    const vHours = visitationHours !== undefined ? Math.max(0, Number(visitationHours)) : 3;
    const dOrder = displayOrder !== undefined ? Math.max(0, Number(displayOrder)) : undefined;

    try {
      const payload = {
        packageName: packageName.trim(),
        packageName_es: (packageName_es || '').trim(),
        name_es: (packageName_es || '').trim(),
        category: category.trim(),
        category_es: (category_es || '').trim(),
        itemizedServices: itemizedServices || {},
        section1Price: s1,
        section2Price: s2,
        visitationHours: vHours,
        ...(dOrder !== undefined ? { displayOrder: dOrder } : {}),
      };

      try {
        await api.patch(`/funeral-homes/${targetHome}/packages/${packageId}`, payload);
      } catch (patchErr) {
        // Fallback: update in catalog or save as custom package
        try {
          await api.patch(`/catalog/${packageId}`, {
            name: packageName.trim(),
            packageName_es: (packageName_es || '').trim(),
            name_es: (packageName_es || '').trim(),
            category: category.trim(),
            category_es: (category_es || '').trim(),
            section1Price: s1,
            section2Price: s2,
            visitationHours: vHours,
            ...(dOrder !== undefined ? { displayOrder: dOrder } : {}),
          });
        } catch {
          // If neither exists by this ID, create it as a package for this home
          await api.post(`/funeral-homes/${targetHome}/packages`, payload);
        }
      }

      setServiceItems(prev => {
        const next = prev.map(item => {
          if ((item._id || item.id) === packageId) {
            return {
              ...item,
              name: packageName.trim(),
              packageName: packageName.trim(),
              packageName_es: packageName_es !== undefined ? packageName_es : item.packageName_es,
              name_es: packageName_es !== undefined ? packageName_es : item.name_es,
              category: category.trim(),
              category_es: category_es !== undefined ? category_es : item.category_es,
              itemizedServices: itemizedServices || item.itemizedServices || {},
              section1Price: s1,
              section2Price: s2,
              visitationHours: vHours,
              displayOrder: dOrder !== undefined ? dOrder : (item.displayOrder !== undefined ? Number(item.displayOrder) : 0),
            };
          }
          return item;
        });

        next.sort((a, b) => {
          const orderA = a.displayOrder !== undefined && a.displayOrder !== null ? Number(a.displayOrder) : 0;
          const orderB = b.displayOrder !== undefined && b.displayOrder !== null ? Number(b.displayOrder) : 0;
          if (orderA !== orderB) return orderA - orderB;
          return (a.packageName || a.name || '').localeCompare(b.packageName || b.name || '');
        });

        return next;
      });

      const packageKey = `${targetHome}|${packageId}`;
      setAdminDb(prev => ({
        ...prev,
        packages: {
          ...(prev.packages || {}),
          [packageKey]: {
            section1: s1,
            section2: s2,
            verified: true,
            catalogId: packageId,
            name: packageName.trim(),
            category: category.trim(),
            itemizedServices: itemizedServices || {},
            isCustom: true
          }
        }
      }));

      addToast(
        lang === 'es' ? 'Paquete de servicio actualizado correctamente.' : 'Service package updated successfully.',
        'success'
      );
      return true;
    } catch (err) {
      console.error('Failed to update service package:', err);
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  }, [addToast, lang, selectedHomeId]);

  const handleDeleteServicePackage = useCallback(async (homeId, packageId) => {
    const targetHome = homeId || selectedHomeId;
    try {
      await api.delete(`/funeral-homes/${targetHome}/packages/${packageId}`);

      setServiceItems(prev => prev.filter(item => (item._id || item.id) !== packageId));

      setAdminDb(prev => {
        const nextPackages = { ...(prev.packages || {}) };
        delete nextPackages[`${targetHome}|${packageId}`];
        return {
          ...prev,
          packages: nextPackages
        };
      });

      addToast(
        lang === 'es' ? 'Paquete de servicio eliminado exitosamente.' : 'Service package deleted successfully.',
        'success'
      );
      return true;
    } catch (err) {
      console.error('Failed to delete service package:', err);
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  }, [addToast, lang, selectedHomeId]);

  const handleAddItem = useCallback(async ({
    name,
    itemName_es,
    name_es,
    price,
    category,
    category_es,
    homeId,
    description = '',
    image = '',
    assignedFuneralHomeId,
    assignedPackages = [],
    isMandatory = false,
    isFixedPrice = false,
    hasDestinations = false,
    destinations = [],
    type = 'Guaranteed'
  }) => {
    const priceNum = Math.max(0, Number(price) || 0);
    const targetHome = (assignedFuneralHomeId && assignedFuneralHomeId !== '*') ? assignedFuneralHomeId : (homeId || selectedHomeId);
    const isDestActive = hasDestinations && Array.isArray(destinations) && destinations.length > 0;
    const isActive = priceNum > 0 || isDestActive;
    const esName = (itemName_es || name_es || '').trim();

    try {
      let createdBackendItem = null;
      try {
        const payload = {
          name: name.trim(),
          itemName_es: esName,
          name_es: esName,
          itemType: category === 'casket' ? 'CASKET' : 'ADDON',
          listPrice: priceNum,
          specifications: description,
          imageUrl: image,
          funeralHomeId: targetHome,
          assignedFuneralHomeId: targetHome,
          assignedPackages: Array.isArray(assignedPackages) ? assignedPackages : [],
          isMandatory: Boolean(isMandatory),
          isFixedPrice: Boolean(isFixedPrice),
          hasDestinations: Boolean(hasDestinations),
          destinations: Array.isArray(destinations) ? destinations : [],
          isActive: isActive,
          type: type || (category === 'casket' ? 'Guaranteed' : 'Non-Guaranteed'),
          assignment: 'Specific Location'
        };
        const res = await api.post('/catalog', payload);
        if (res.data) createdBackendItem = res.data;
      } catch (backendErr) {
        console.warn('Backend POST /catalog failed, fallback to local:', backendErr.message);
      }

      const id = createdBackendItem?._id || (category === 'casket' ? 'casket_' : 'addon_') + Date.now();

      if (category === 'casket') {
        const newCasket = {
          id,
          _id: id,
          name: name.trim(),
          itemName_es: esName,
          name_es: esName,
          price: priceNum,
          listPrice: priceNum,
          home: targetHome,
          assignedFuneralHomeId: targetHome,
          assignedPackages: Array.isArray(assignedPackages) ? assignedPackages : [],
          isMandatory: Boolean(isMandatory),
          isFixedPrice: Boolean(isFixedPrice),
          isActive: priceNum > 0,
          type: type || 'Guaranteed',
          category: type || 'Guaranteed',
          description: description || 'Custom catalog model',
          specifications: description || 'Custom catalog model',
          image: image || '',
          imageUrl: image || '',
          taxable: true
        };
        const updated = [...(adminDb.caskets || []), newCasket];
        await updatePrices(targetHome, { caskets: updated });
        setAdminDb(prev => ({ ...prev, caskets: updated }));
        addToast(
          lang === 'es' ? 'Ataúd guardado exitosamente.' : 'Casket saved successfully.',
          'success'
        );
        return true;
      } else {
        const newAddon = {
          id,
          _id: id,
          name: name.trim(),
          itemName_es: esName,
          name_es: esName,
          price: priceNum,
          listPrice: priceNum,
          home: targetHome,
          assignedFuneralHomeId: targetHome,
          assignedPackages: Array.isArray(assignedPackages) ? assignedPackages : [],
          isMandatory: Boolean(isMandatory),
          isFixedPrice: Boolean(isFixedPrice),
          hasDestinations: Boolean(hasDestinations),
          destinations: Array.isArray(destinations) ? destinations : [],
          isActive: isActive,
          type: type || 'Non-Guaranteed',
          category: type || 'Non-Guaranteed',
          description: description || '',
          specifications: description || '',
          taxable: type === 'Guaranteed'
        };
        const updated = [...(adminDb.addons || []), newAddon];
        await updatePrices(targetHome, { addons: updated });
        setAdminDb(prev => ({ ...prev, addons: updated }));
        addToast(
          lang === 'es' ? 'Servicio adicional guardado exitosamente.' : 'Add-on saved successfully.',
          'success'
        );
        return true;
      }
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  }, [addToast, adminDb.addons, adminDb.caskets, lang, selectedHomeId]);

  const handleUpdateItem = useCallback(async (itemId, itemType, updates) => {
    try {
      if (isMongoId(itemId)) {
        try {
          const patchPayload = {};
          if (updates.name !== undefined) patchPayload.name = updates.name;
          if (updates.itemName_es !== undefined || updates.name_es !== undefined) {
            patchPayload.itemName_es = updates.itemName_es !== undefined ? updates.itemName_es : updates.name_es;
            patchPayload.name_es = patchPayload.itemName_es;
          }
          if (updates.price !== undefined) {
            const p = Number(updates.price) || 0;
            patchPayload.listPrice = p;
            patchPayload.isActive = p > 0;
          }
          if (updates.specifications !== undefined || updates.description !== undefined) {
            patchPayload.specifications = updates.specifications || updates.description;
          }
          if (updates.image !== undefined) patchPayload.imageUrl = updates.image;
          if (updates.assignedFuneralHomeId !== undefined) {
            patchPayload.assignedFuneralHomeId = updates.assignedFuneralHomeId === '*' ? null : updates.assignedFuneralHomeId;
            patchPayload.funeralHomeId = patchPayload.assignedFuneralHomeId;
          }
          if (updates.assignedPackages !== undefined) {
            patchPayload.assignedPackages = updates.assignedPackages;
          }
          if (updates.isMandatory !== undefined) {
            patchPayload.isMandatory = Boolean(updates.isMandatory);
          }
          if (updates.isFixedPrice !== undefined) {
            patchPayload.isFixedPrice = Boolean(updates.isFixedPrice);
          }
          if (updates.hasDestinations !== undefined) {
            patchPayload.hasDestinations = Boolean(updates.hasDestinations);
          }
          if (updates.destinations !== undefined) {
            patchPayload.destinations = Array.isArray(updates.destinations) ? updates.destinations : [];
            if (updates.hasDestinations && updates.destinations.length > 0) {
              patchPayload.isActive = true;
            }
          }
          if (updates.isActive !== undefined) {
            patchPayload.isActive = Boolean(updates.isActive);
          }
          if (updates.type !== undefined) {
            patchPayload.type = updates.type;
          }
          await api.patch(`/catalog/${itemId}`, patchPayload);
        } catch (backendErr) {
          console.warn('Backend PATCH /catalog/:id failed:', backendErr.message);
        }
      }

      if (itemType === 'casket') {
        const updated = (adminDb.caskets || []).map(c => {
          if (c.id === itemId || c._id === itemId) {
            const newPrice = updates.price !== undefined ? Number(updates.price) : c.price;
            return {
              ...c,
              name: updates.name !== undefined ? updates.name : c.name,
              itemName_es: updates.itemName_es !== undefined ? updates.itemName_es : (c.itemName_es || c.name_es || ''),
              name_es: updates.itemName_es !== undefined ? updates.itemName_es : (c.name_es || c.itemName_es || ''),
              price: newPrice,
              listPrice: newPrice,
              isActive: updates.isActive !== undefined ? Boolean(updates.isActive) : (newPrice > 0),
              description: updates.specifications !== undefined ? updates.specifications : (updates.description !== undefined ? updates.description : c.description),
              specifications: updates.specifications !== undefined ? updates.specifications : (updates.description !== undefined ? updates.description : c.description),
              image: updates.image !== undefined ? updates.image : c.image,
              imageUrl: updates.image !== undefined ? updates.image : c.image,
              home: updates.assignedFuneralHomeId !== undefined ? updates.assignedFuneralHomeId : c.home,
              assignedFuneralHomeId: updates.assignedFuneralHomeId !== undefined ? updates.assignedFuneralHomeId : c.assignedFuneralHomeId,
              assignedPackages: updates.assignedPackages !== undefined ? updates.assignedPackages : c.assignedPackages,
              isMandatory: updates.isMandatory !== undefined ? Boolean(updates.isMandatory) : c.isMandatory,
              isFixedPrice: updates.isFixedPrice !== undefined ? Boolean(updates.isFixedPrice) : c.isFixedPrice,
              type: updates.type !== undefined ? updates.type : c.type
            };
          }
          return c;
        });
        await updatePrices(selectedHomeId, { caskets: updated });
        setAdminDb(prev => ({ ...prev, caskets: updated }));
        addToast(lang === 'es' ? 'Ataúd actualizado con éxito.' : 'Casket updated successfully.', 'success');
        return true;
      } else {
        const updated = (adminDb.addons || []).map(a => {
          if (a.id === itemId || a._id === itemId) {
            const newPrice = updates.price !== undefined ? Number(updates.price) : a.price;
            return {
              ...a,
              name: updates.name !== undefined ? updates.name : a.name,
              itemName_es: updates.itemName_es !== undefined ? updates.itemName_es : (a.itemName_es || a.name_es || ''),
              name_es: updates.itemName_es !== undefined ? updates.itemName_es : (a.name_es || a.itemName_es || ''),
              price: newPrice,
              listPrice: newPrice,
              isActive: updates.isActive !== undefined ? Boolean(updates.isActive) : (newPrice > 0 || (a.hasDestinations && a.destinations?.length > 0)),
              description: updates.specifications !== undefined ? updates.specifications : (updates.description !== undefined ? updates.description : a.description),
              specifications: updates.specifications !== undefined ? updates.specifications : (updates.description !== undefined ? updates.description : a.description),
              home: updates.assignedFuneralHomeId !== undefined ? updates.assignedFuneralHomeId : a.home,
              assignedFuneralHomeId: updates.assignedFuneralHomeId !== undefined ? updates.assignedFuneralHomeId : a.assignedFuneralHomeId,
              assignedPackages: updates.assignedPackages !== undefined ? updates.assignedPackages : a.assignedPackages,
              isMandatory: updates.isMandatory !== undefined ? Boolean(updates.isMandatory) : a.isMandatory,
              isFixedPrice: updates.isFixedPrice !== undefined ? Boolean(updates.isFixedPrice) : a.isFixedPrice,
              hasDestinations: updates.hasDestinations !== undefined ? Boolean(updates.hasDestinations) : a.hasDestinations,
              destinations: updates.destinations !== undefined ? updates.destinations : a.destinations,
              type: updates.type !== undefined ? updates.type : a.type
            };
          }
          return a;
        });
        await updatePrices(selectedHomeId, { addons: updated });
        setAdminDb(prev => ({ ...prev, addons: updated }));
        addToast(lang === 'es' ? 'Servicio adicional actualizado con éxito.' : 'Add-on updated successfully.', 'success');
        return true;
      }
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  }, [addToast, adminDb.addons, adminDb.caskets, lang, selectedHomeId]);

  const handleDeleteCasket = useCallback(async (casketId) => {
    try {
      if (isMongoId(casketId)) {
        try {
          await api.delete(`/catalog/${casketId}`);
        } catch (backendErr) {
          console.warn('Backend DELETE /catalog failed:', backendErr.message);
        }
      }
      const updated = (adminDb.caskets || []).filter(c => c.id !== casketId && c._id !== casketId);
      await updatePrices(selectedHomeId, { caskets: updated });
      setAdminDb(prev => ({ ...prev, caskets: updated }));
      addToast(lang === 'es' ? 'Ataúd eliminado exitosamente.' : 'Casket removed successfully.', 'success');
      return true;
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  }, [addToast, adminDb.caskets, lang, selectedHomeId]);

  const handleDeleteAddon = useCallback(async (addonId) => {
    try {
      if (isMongoId(addonId)) {
        try {
          await api.delete(`/catalog/${addonId}`);
        } catch (backendErr) {
          console.warn('Backend DELETE /catalog failed:', backendErr.message);
        }
      }
      const updated = (adminDb.addons || []).filter(a => a.id !== addonId && a._id !== addonId);
      await updatePrices(selectedHomeId, { addons: updated });
      setAdminDb(prev => ({ ...prev, addons: updated }));
      addToast(lang === 'es' ? 'Adicional eliminado exitosamente.' : 'Add-on removed successfully.', 'success');
      return true;
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
        serviceItems,
        isLoadingServices,

        // Homes
        refreshHomes,
        handleAddHome,
        handleUpdateHome,
        handleDeleteHome,

        // Pricing
        clearLocationData,
        handleCasketPriceChange,
        handleAddonPriceChange,
        handlePackagePriceChange,
        handleAddServicePackage,
        handleUpdateServicePackage,
        handleDeleteServicePackage,
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
