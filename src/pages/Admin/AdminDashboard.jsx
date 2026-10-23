import React, { useState } from 'react';
import { useAdminUI } from '../../context/AdminUIContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/common/Button.jsx';
import InputField from '../../components/common/InputField.jsx';
import FuneralHomeForm from '../../components/Admin/FuneralHomeForm.jsx';
import PriceEditorTable from '../../components/Admin/PriceEditorTable.jsx';
import AddItemForm from '../../components/Admin/AddItemForm.jsx';
import {
  addFuneralHome,
  updatePrices,
  importCatalog,
  resetDemoData
} from '../../services/admin/adminService.js';
import { formatErrorMessage, getStoredDb } from '../../services/base/apiClient.js';

export default function AdminDashboard() {
  const { lang, addToast } = useAdminUI();
  const { adminUser } = useAuth();

  // Local admin database state for rapid inline editing
  const [adminDb, setAdminDb] = useState(() => getStoredDb());
  const [selectedHomeId, setSelectedHomeId] = useState(() => adminDb.homes?.[0]?.id || 'optima');
  const [activeTab, setActiveTab] = useState('caskets'); // 'caskets' | 'addons'
  const [itemFilter, setItemFilter] = useState('');
  const [isAddingHome, setIsAddingHome] = useState(false);

  // Derive active home id gracefully
  const activeHomeId = selectedHomeId || adminDb.homes?.[0]?.id || 'optima';

  // Handle adding funeral home via Admin Service
  const handleAddHome = async (homeData) => {
    setIsAddingHome(true);
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
      return true;
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return false;
    } finally {
      setIsAddingHome(false);
    }
  };

  // Handle casket price change via Admin Service
  const handleCasketPriceChange = async (casketId, newPrice) => {
    const priceNum = Math.max(0, Number(newPrice) || 0);
    const updatedCaskets = (adminDb.caskets || []).map(c => {
      if (c.id === casketId) {
        return { ...c, price: priceNum };
      }
      return c;
    });

    try {
      const res = await updatePrices(activeHomeId, { caskets: updatedCaskets });
      if (res.success) {
        setAdminDb(res.db);
        addToast(lang === 'es' ? 'Precio de ataúd actualizado.' : 'Casket price updated.', 'success');
      }
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
    }
  };

  // Handle add-on price change via Admin Service
  const handleAddonPriceChange = async (addonId, newPrice) => {
    const priceNum = Math.max(0, Number(newPrice) || 0);
    const updatedAddons = (adminDb.addons || []).map(a => {
      if (a.id === addonId) {
        return { ...a, price: priceNum };
      }
      return a;
    });

    try {
      const res = await updatePrices(activeHomeId, { addons: updatedAddons });
      if (res.success) {
        setAdminDb(res.db);
        addToast(lang === 'es' ? 'Tarifa de adicional actualizada.' : 'Add-on rate updated.', 'success');
      }
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
    }
  };

  // Handle adding new item (casket or addon)
  const handleAddItem = async ({ name, price, category }) => {
    const priceNum = Math.max(0, Number(price) || 0);
    const id = (category === 'casket' ? 'casket_' : 'addon_') + Date.now();

    try {
      if (category === 'casket') {
        const newCasket = {
          id,
          name: name.trim(),
          price: priceNum,
          home: activeHomeId,
          description: 'Custom added merchandise',
          taxable: true
        };
        const updated = [...(adminDb.caskets || []), newCasket];
        const res = await updatePrices(activeHomeId, { caskets: updated });
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
          home: activeHomeId,
          taxable: false
        };
        const updated = [...(adminDb.addons || []), newAddon];
        const res = await updatePrices(activeHomeId, { addons: updated });
        if (res.success) {
          setAdminDb(res.db);
          addToast(lang === 'es' ? 'Servicio adicional agregado.' : 'Add-on item added to catalog.', 'success');
          return true;
        }
      }
      return false;
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
      return false;
    }
  };

  // Export JSON catalog
  const handleExportJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(adminDb, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'memorial_express_pricing.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addToast(lang === 'es' ? 'Archivo JSON exportado.' : 'Pricing JSON exported.', 'success');
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
    }
  };

  // Import JSON catalog
  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        const res = await importCatalog(imported);
        if (res.success) {
          setAdminDb(res.db);
          addToast(lang === 'es' ? 'Catálogo importado exitosamente.' : 'Catalog imported successfully.', 'success');
        }
      } catch (err) {
        addToast(formatErrorMessage(err), 'error');
      }
    };
    reader.readAsText(file);
  };

  // Reset to default demo data
  const handleResetDemo = async () => {
    if (!window.confirm(lang === 'es' ? '¿Restaurar los precios y funerarias demo predeterminadas?' : 'Restore default demo pricing and funeral homes?')) {
      return;
    }
    try {
      const res = await resetDemoData();
      if (res.success) {
        setAdminDb(res.db);
        addToast(lang === 'es' ? 'Datos restablecidos.' : 'Data reset to defaults.', 'success');
      }
    } catch (err) {
      addToast(formatErrorMessage(err), 'error');
    }
  };

  // Filter caskets and addons for the selected home
  const visibleCaskets = (adminDb.caskets || []).filter(c => {
    const matchesHome = c.home === activeHomeId || c.home === '*' || !c.home;
    const matchesQuery = !itemFilter || c.name.toLowerCase().includes(itemFilter.toLowerCase());
    return matchesHome && matchesQuery;
  });

  const visibleAddons = (adminDb.addons || []).filter(a => {
    const matchesHome = a.home === activeHomeId || a.home === '*';
    const matchesQuery = !itemFilter || a.name.toLowerCase().includes(itemFilter.toLowerCase());
    return matchesHome && matchesQuery;
  });

  return (
    <div className="admin-panel">
      {/* Top Header / Control Toolbar */}
      <div className="admin-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 750, color: '#183655', margin: '0 0 6px' }}>
              🛠️ {lang === 'es' ? 'Panel de Precios y Funerarias' : 'Funeral Home & Pricing Control Panel'}
            </h1>
            <span style={{
              background: 'rgba(212, 175, 55, 0.15)',
              color: '#996515',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {adminUser?.username || 'Admin Session'}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>
            {lang === 'es'
              ? 'Administre funerarias asociadas, actualice tarifas de ataúdes y edite costos de anticipos.'
              : 'Add funeral homes, update individual casket rates, and modify add-on fee schedules.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={handleExportJson}>
            💾 {lang === 'es' ? 'Exportar JSON' : 'Export JSON'}
          </Button>

          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
            📂 {lang === 'es' ? 'Importar JSON' : 'Import JSON'}
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              style={{ display: 'none' }}
            />
          </label>

          <Button variant="danger" size="sm" onClick={handleResetDemo}>
            ↺ {lang === 'es' ? 'Restablecer Demo' : 'Reset Demo'}
          </Button>
        </div>
      </div>

      {/* FORM: ADD NEW FUNERAL HOME */}
      <FuneralHomeForm
        onAddHome={handleAddHome}
        isSubmitting={isAddingHome}
        lang={lang}
      />

      {/* SELECT FUNERAL HOME TO EDIT & SEARCH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#183655' }}>
            {lang === 'es' ? 'Funeraria Activa:' : 'Select Home:'}
          </span>
          <select
            value={selectedHomeId}
            onChange={(e) => setSelectedHomeId(e.target.value)}
            className="form-select"
            style={{ width: 240, padding: '8px 12px' }}
          >
            {(adminDb.homes || []).map(h => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city || 'CA'})
              </option>
            ))}
          </select>
        </div>

        {/* Tabs: Caskets vs Addons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'caskets' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('caskets')}
          >
            ⚰️ {lang === 'es' ? 'Ataúdes' : 'Caskets'} ({visibleCaskets.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'addons' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('addons')}
          >
            🌸 {lang === 'es' ? 'Adicionales' : 'Add-ons'} ({visibleAddons.length})
          </button>
        </div>
      </div>

      <InputField
        placeholder={lang === 'es' ? 'Filtrar artículos por nombre...' : 'Filter items by name...'}
        value={itemFilter}
        onChange={(e) => setItemFilter(e.target.value)}
      />

      {/* DATA GRID */}
      <PriceEditorTable
        activeTab={activeTab}
        caskets={visibleCaskets}
        addons={visibleAddons}
        onCasketPriceChange={handleCasketPriceChange}
        onAddonPriceChange={handleAddonPriceChange}
        lang={lang}
      />

      {/* FORM: ADD AN ITEM */}
      <AddItemForm
        onAddItem={handleAddItem}
        lang={lang}
      />
    </div>
  );
}
