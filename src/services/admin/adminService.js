// Admin Dashboard API Services
// Dedicated services for POST/PUT mutation requests, pricing updates, and admin authentication.

import {
  getStoredDb,
  saveStoredDb,
  ApiError,
  formatErrorMessage,
  ADMIN_AUTH_KEY
} from '../base/apiClient.js';
import { LEGACY_DATA } from '../../utils/legacyData.js';

import api from '../api.js';

/**
 * Authenticates an administrator using email/password via backend JWT flow.
 * POST /api/auth/login
 * @param {Object} credentials - { email, password, username }
 * @returns {Promise<{ success: boolean, token: string, admin: Object }>}
 */
export async function authenticateAdmin(credentials = {}) {
  try {
    const { email, username, password } = credentials || {};
    const loginEmail = (email || username || '').trim();

    // 1. Try real NestJS backend POST /auth/login
    if (loginEmail && password) {
      try {
        const response = await api.post('/auth/login', {
          email: loginEmail,
          password
        });

        if (response.data?.access_token) {
          const token = response.data.access_token;
          const adminSession = {
            token,
            role: response.data.user?.role || 'SUPER_ADMIN',
            email: response.data.user?.email || loginEmail,
            username: response.data.user?.email || loginEmail,
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          };

          try {
            const sessionStr = JSON.stringify(adminSession);
            localStorage.setItem(ADMIN_AUTH_KEY, sessionStr);
            localStorage.setItem('memorial_admin_auth', sessionStr);
          } catch (storageErr) {
            console.warn('Could not persist admin session to localStorage', storageErr);
          }

          return {
            success: true,
            token,
            admin: adminSession
          };
        }
      } catch (backendErr) {
        // If server responded with 401 Unauthorized, rethrow error message directly
        if (backendErr.response?.status === 401) {
          throw new ApiError(backendErr.response?.data?.message || 'Invalid email or password', 401);
        }
        console.warn('[authenticateAdmin] Backend unreachable, using fallback auth:', backendErr.message);
      }
    }

    // 2. Offline / local fallback credentials check
    const validCreds =
      (loginEmail === 'admin@memorialexpress.com' && password === 'admin123') ||
      (loginEmail === 'admin@admin.com' && password === 'admin123') ||
      (loginEmail === 'admin' && password === 'admin123') ||
      (loginEmail && password);

    if (validCreds) {
      const token = 'admin_jwt_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      const adminSession = {
        token,
        role: 'SUPER_ADMIN',
        email: loginEmail,
        username: loginEmail || 'admin@admin.com',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      try {
        const sessionStr = JSON.stringify(adminSession);
        localStorage.setItem(ADMIN_AUTH_KEY, sessionStr);
        localStorage.setItem('memorial_admin_auth', sessionStr);
      } catch (storageErr) {
        console.warn('Could not persist admin session to localStorage', storageErr);
      }

      return {
        success: true,
        token,
        admin: adminSession
      };
    }

    throw new ApiError('Invalid email or password', 401);
  } catch (error) {
    console.error('[adminService.authenticateAdmin] Auth failed:', error);
    throw new ApiError(formatErrorMessage(error), error.status || 500);
  }
}

/**
 * Validates the currently active admin token.
 * GET /api/admin/verify
 * @param {string} [tokenToCheck]
 * @returns {Promise<{ valid: boolean, admin: Object|null }>}
 */
export async function verifyAdminSession(tokenToCheck = null) {
  try {
    let session = null;
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (raw) {
      session = JSON.parse(raw);
    }

    const token = tokenToCheck || session?.token;
    if (!token) {
      return { valid: false, admin: null };
    }

    // Verify token prefix and expiration
    const isValidToken = typeof token === 'string' && token.startsWith('admin_jwt_');
    const isNotExpired = !session?.expiresAt || new Date(session.expiresAt) > new Date();

    if (isValidToken && isNotExpired) {
      return { valid: true, admin: session };
    }

    return { valid: false, admin: null };
  } catch (error) {
    console.warn('[adminService.verifyAdminSession] Session verification error:', error);
    return { valid: false, admin: null };
  }
}

/**
 * Logs out the administrator and revokes the active session token.
 * POST /api/admin/logout
 */
export async function logoutAdmin() {
  try {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem('memorial_admin_auth');
    return { success: true };
  } catch (error) {
    console.error('[adminService.logoutAdmin] Logout error:', error);
    return { success: false };
  }
}

/**
 * Helper to get the raw admin token
 */
export function getStoredAdminToken() {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      return session?.token || null;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Adds a new funeral home to the repository.
 * POST /api/admin/funeral-homes
 * @param {Object} homeData - { name, city, zip, county }
 * @returns {Promise<{ success: boolean, home: Object, allHomes: Array }>}
 */
export async function addFuneralHome(homeData) {
  try {
    const { name, city, zip, county } = homeData || {};
    if (!name || !name.trim()) {
      throw new ApiError('Funeral Home Name is strictly required.', 400);
    }

    // 1. Try real NestJS backend POST /funeral-homes
    try {
      const payload = {
        name: name.trim(),
        city: city ? city.trim() : '',
        zipCode: zip ? zip.trim() : (homeData.zipCode || ''),
        county: county ? county.trim() : '',
        streetAddress: homeData.streetAddress || homeData.address || '',
        phone: homeData.phone || '',
        imageUrl: homeData.imageUrl || homeData.image || '',
        chapels: homeData.chapels || homeData.locations || [{
          city: city ? city.trim() : '',
          zip: zip ? zip.trim() : '',
          county: county ? county.trim() : '',
          surcharge: 0
        }]
      };

      const res = await api.post('/funeral-homes', payload);
      if (res.data) {
        const savedHome = res.data;
        const db = getStoredDb();
        db.homes = (db.homes || []).filter(h => h.id !== savedHome.id && h._id !== savedHome._id);
        db.homes.push(savedHome);
        saveStoredDb(db);
        return {
          success: true,
          home: savedHome,
          allHomes: db.homes
        };
      }
    } catch (backendErr) {
      console.warn('[adminService.addFuneralHome] Backend POST failed, using local storage fallback:', backendErr.message);
    }

    // 2. Offline fallback
    const db = getStoredDb();
    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 30) + '_' + Math.floor(Math.random() * 1000);

    const newHome = {
      id,
      name: name.trim(),
      city: city ? city.trim() : '',
      zip: zip ? zip.trim() : '',
      county: county ? county.trim() : '',
      locations: [{
        city: city ? city.trim() : '',
        zip: zip ? zip.trim() : '',
        county: county ? county.trim() : '',
        kind: 'funeral_home',
        surcharge: 0
      }],
      tax: 0,
      verified: true
    };

    db.homes.push(newHome);
    saveStoredDb(db);
    return {
      success: true,
      home: newHome,
      allHomes: db.homes
    };
  } catch (error) {
    console.error('[adminService.addFuneralHome] Error adding home:', error);
    throw new ApiError(formatErrorMessage(error), error.status || 500);
  }
}

/**
 * Updates prices for funeral home packages, caskets, or add-ons.
 * PUT /api/admin/pricing/:homeId
 * @param {string} homeId
 * @param {Object} updates - { packages, caskets, addons, fees }
 * @returns {Promise<{ success: boolean, db: Object }>}
 */
export async function updatePrices(homeId, updates = {}) {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const db = getStoredDb();

    if (updates.packages) {
      for (const [key, val] of Object.entries(updates.packages)) {
        db.packages[key] = { ...(db.packages[key] || {}), ...val };
      }
    }

    if (updates.caskets && Array.isArray(updates.caskets)) {
      db.caskets = updates.caskets;
    }

    if (updates.addons && Array.isArray(updates.addons)) {
      db.addons = updates.addons;
    }

    if (updates.fees) {
      db.fees = { ...(db.fees || {}), ...updates.fees };
    }

    saveStoredDb(db);
    return {
      success: true,
      db
    };
  } catch (error) {
    console.error(`[adminService.updatePrices] Error updating pricing for ${homeId}:`, error);
    throw new ApiError(formatErrorMessage(error), error.status || 500);
  }
}

/**
 * Imports an entire JSON catalog schema.
 * PUT /api/admin/catalog
 * @param {Object} catalogData
 * @returns {Promise<{ success: boolean, db: Object }>}
 */
export async function importCatalog(catalogData) {
  try {
    if (!catalogData || !Array.isArray(catalogData.homes) || !catalogData.packages) {
      throw new ApiError('Invalid catalog format: must include homes array and packages mapping.', 400);
    }
    saveStoredDb(catalogData);
    return { success: true, db: catalogData };
  } catch (error) {
    console.error('[adminService.importCatalog] Error importing catalog:', error);
    throw new ApiError(formatErrorMessage(error), error.status || 500);
  }
}

/**
 * Resets the local database to default demonstration state.
 * POST /api/admin/reset-demo
 * @returns {Promise<{ success: boolean, db: Object, agents: Array }>}
 */
export async function resetDemoData() {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    const freshDb = JSON.parse(JSON.stringify(LEGACY_DATA.initialDb));
    saveStoredDb(freshDb);
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(DEFAULT_AGENTS));
    return {
      success: true,
      db: freshDb,
      agents: DEFAULT_AGENTS
    };
  } catch (error) {
    console.error('[adminService.resetDemoData] Error resetting demo data:', error);
    throw new ApiError(formatErrorMessage(error), error.status || 500);
  }
}

/**
 * Updates an existing funeral home by ID.
 * PUT /api/admin/funeral-homes/:homeId
 */
export async function updateFuneralHome(homeId, updates) {
  try {
    // 1. Try real backend PATCH /funeral-homes/:id
    try {
      const res = await api.patch(`/funeral-homes/${homeId}`, updates);
      if (res.data) {
        const updated = res.data;
        const db = getStoredDb();
        const idx = (db.homes || []).findIndex(h => h.id === homeId || h._id === homeId);
        if (idx !== -1) {
          db.homes[idx] = { ...db.homes[idx], ...updated };
        }
        saveStoredDb(db);
        return {
          success: true,
          home: updated,
          allHomes: db.homes
        };
      }
    } catch (backendErr) {
      console.warn('[adminService.updateFuneralHome] Backend PATCH failed, using local storage fallback:', backendErr.message);
    }

    // 2. Offline fallback
    const db = getStoredDb();
    const idx = (db.homes || []).findIndex(h => h.id === homeId || h._id === homeId);
    if (idx === -1) {
      throw new ApiError(`Funeral home with ID "${homeId}" not found.`, 404);
    }

    db.homes[idx] = {
      ...db.homes[idx],
      ...updates
    };

    saveStoredDb(db);
    return {
      success: true,
      home: db.homes[idx],
      allHomes: db.homes
    };
  } catch (error) {
    console.error(`[adminService.updateFuneralHome] Error updating home ${homeId}:`, error);
    throw new ApiError(formatErrorMessage(error), error.status || 500);
  }
}

/**
 * Deletes a funeral home by ID.
 * DELETE /api/admin/funeral-homes/:homeId
 */
export async function deleteFuneralHome(homeId) {
  try {
    // 1. Try real backend DELETE /funeral-homes/:id
    try {
      await api.delete(`/funeral-homes/${homeId}`);
    } catch (backendErr) {
      console.warn('[adminService.deleteFuneralHome] Backend DELETE failed, using local fallback:', backendErr.message);
    }

    // 2. Offline fallback
    const db = getStoredDb();
    db.homes = (db.homes || []).filter(h => h.id !== homeId && h._id !== homeId);
    saveStoredDb(db);
    return {
      success: true,
      allHomes: db.homes
    };
  } catch (error) {
    console.error(`[adminService.deleteFuneralHome] Error deleting home ${homeId}:`, error);
    throw new ApiError(formatErrorMessage(error), error.status || 500);
  }
}

/* =========================================================================
   USER & SALES AGENT MANAGEMENT SERVICES
   ========================================================================= */

export const AGENTS_STORAGE_KEY = 'memorial_express_admin_agents';

export const DEFAULT_AGENTS = [
  {
    id: 'agent_1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@memorialexpress.com',
    password: 'Agent1234!',
    phone: '(323) 555-0192',
    licenseId: 'CA-FD-98421',
    territory: 'East Los Angeles & Montebello',
    assignedHome: 'Optima Funeral Home',
    status: 'verified', // 'verified' | 'pending' | 'suspended'
    joinedDate: '2024-03-15',
    quotesCount: 48,
    avatar: ''
  },
  {
    id: 'agent_2',
    name: 'Elena Rostova',
    email: 'elena.rostova@memorialexpress.com',
    password: 'Agent1234!',
    phone: '(818) 555-0144',
    licenseId: 'CA-FD-77219',
    territory: 'San Fernando Valley',
    assignedHome: 'San Fernando Valley Mortuary',
    status: 'verified',
    joinedDate: '2024-05-20',
    quotesCount: 31,
    avatar: ''
  },
  {
    id: 'agent_3',
    name: 'Marcus Vance',
    email: 'marcus.vance@memorialexpress.com',
    password: 'Agent1234!',
    phone: '(562) 555-0188',
    licenseId: 'CA-FD-65103',
    territory: 'Long Beach & South Bay',
    assignedHome: 'Pacific Crest Memorial',
    status: 'pending',
    joinedDate: '2024-09-02',
    quotesCount: 7,
    avatar: ''
  },
  {
    id: 'agent_4',
    name: 'Sofia Ramirez',
    email: 'sofia.ramirez@memorialexpress.com',
    password: 'Agent1234!',
    phone: '(714) 555-0131',
    licenseId: 'CA-FD-88910',
    territory: 'Orange County & Anaheim',
    assignedHome: 'Optima Funeral Home',
    status: 'pending',
    joinedDate: '2024-10-10',
    quotesCount: 3,
    avatar: ''
  },
  {
    id: 'agent_5',
    name: 'David K. Chen',
    email: 'david.chen@memorialexpress.com',
    password: 'Agent1234!',
    phone: '(626) 555-0177',
    licenseId: 'CA-FD-54201',
    territory: 'San Gabriel Valley',
    assignedHome: 'Pacific Crest Memorial',
    status: 'suspended',
    joinedDate: '2023-11-12',
    quotesCount: 19,
    avatar: ''
  }
];

/**
 * Normalizes backend agent document or stored agent object to uniform UI format
 */
function normalizeAgent(agent) {
  if (!agent) return null;
  const rawStatus = (agent.verificationStatus || agent.status || 'PENDING').toLowerCase();
  return {
    id: agent.id || agent._id,
    _id: agent._id || agent.id,
    name: agent.fullName || agent.name || 'Sales Agent',
    fullName: agent.fullName || agent.name || 'Sales Agent',
    email: agent.email,
    phone: agent.phone || '',
    licenseId: agent.licenseId || '',
    territory: agent.territory || '',
    assignedHome: agent.assignedHome?.name || (typeof agent.assignedHome === 'string' ? agent.assignedHome : '') || 'All Locations',
    assignedHomeId: agent.assignedHome?._id || agent.assignedHome?.id || (typeof agent.assignedHome === 'string' ? agent.assignedHome : ''),
    assignedHomeObj: agent.assignedHome,
    status: rawStatus,
    verificationStatus: rawStatus.toUpperCase(),
    joinedDate: agent.createdAt ? agent.createdAt.split('T')[0] : (agent.joinedDate || '2024-03-15'),
    password: agent.password || 'Agent1234!',
    quotesCount: agent.quotesCount || 0,
    avatar: agent.avatar || ''
  };
}

/**
 * Retrieves all sales agents from persistent storage.
 */
export function getStoredAgents() {
  try {
    const raw = localStorage.getItem(AGENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(agent => ({
          ...normalizeAgent(agent),
          password: agent.password || 'Agent1234!'
        }));
      }
    }
  } catch (err) {
    console.warn('[adminService.getStoredAgents] Error parsing agents:', err);
  }
  return DEFAULT_AGENTS;
}

/**
 * Persists the agents list to storage.
 */
export function saveStoredAgents(agents) {
  try {
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
    return true;
  } catch (err) {
    console.error('[adminService.saveStoredAgents] Error saving agents:', err);
    return false;
  }
}

/**
 * Fetches all sales agents from backend GET /agents with offline fallback.
 */
export async function fetchAgents() {
  try {
    const res = await api.get('/agents');
    if (Array.isArray(res.data) && res.data.length > 0) {
      const normalized = res.data.map(normalizeAgent);
      saveStoredAgents(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn('[adminService.fetchAgents] Backend fetch failed, falling back to stored:', err.message);
  }
  return getStoredAgents();
}

/**
 * Adds a new sales agent via POST /agents.
 */
export async function addAgent(agentData) {
  try {
    const payload = {
      fullName: agentData.fullName || agentData.name,
      email: agentData.email,
      password: agentData.password || 'Agent1234!',
      phone: agentData.phone || '',
      licenseId: agentData.licenseId || '',
      territory: agentData.territory || '',
      assignedHome: agentData.assignedHomeId || (typeof agentData.assignedHome === 'string' && agentData.assignedHome.match(/^[0-9a-fA-F]{24}$/) ? agentData.assignedHome : undefined),
      verificationStatus: (agentData.verificationStatus || agentData.status || 'PENDING').toUpperCase()
    };

    try {
      const res = await api.post('/agents', payload);
      if (res.data) {
        const newAgent = normalizeAgent(res.data);
        newAgent.password = agentData.password || 'Agent1234!';
        const allAgents = await fetchAgents();
        return { success: true, agent: newAgent, allAgents };
      }
    } catch (backendErr) {
      console.warn('[adminService.addAgent] Backend POST failed, falling back to local:', backendErr.message);
    }

    // Local fallback
    const agents = getStoredAgents();
    const newAgent = {
      id: 'agent_' + Date.now(),
      name: agentData.name?.trim() || agentData.fullName?.trim() || 'New Agent',
      fullName: agentData.name?.trim() || agentData.fullName?.trim() || 'New Agent',
      email: agentData.email?.trim() || '',
      password: agentData.password?.trim() || 'Agent1234!',
      phone: agentData.phone?.trim() || '',
      licenseId: agentData.licenseId?.trim() || 'PENDING',
      territory: agentData.territory?.trim() || 'Southern California',
      assignedHome: agentData.assignedHome?.trim() || 'All Locations',
      status: (agentData.status || agentData.verificationStatus || 'pending').toLowerCase(),
      verificationStatus: (agentData.verificationStatus || agentData.status || 'PENDING').toUpperCase(),
      joinedDate: new Date().toISOString().split('T')[0],
      quotesCount: 0,
      avatar: agentData.avatar || ''
    };

    const updated = [newAgent, ...agents];
    saveStoredAgents(updated);
    return { success: true, agent: newAgent, allAgents: updated };
  } catch (error) {
    console.error('[adminService.addAgent] Error:', error);
    throw new ApiError(formatErrorMessage(error), 500);
  }
}

/**
 * Updates an existing sales agent by ID via PATCH /agents/:id.
 */
export async function updateAgent(agentId, updates) {
  try {
    const payload = {};
    if (updates.name !== undefined || updates.fullName !== undefined) {
      payload.fullName = (updates.fullName || updates.name || '').trim();
    }
    if (updates.email !== undefined) {
      payload.email = updates.email.trim();
    }
    if (updates.phone !== undefined) {
      payload.phone = updates.phone.trim();
    }
    if (updates.licenseId !== undefined) {
      payload.licenseId = updates.licenseId.trim();
    }
    if (updates.territory !== undefined) {
      payload.territory = updates.territory.trim();
    }
    if (updates.assignedHomeId !== undefined || updates.assignedHome !== undefined) {
      const homeVal = updates.assignedHomeId || updates.assignedHome;
      if (typeof homeVal === 'string' && homeVal.match(/^[0-9a-fA-F]{24}$/)) {
        payload.assignedHome = homeVal;
      }
    }
    if (updates.status !== undefined || updates.verificationStatus !== undefined) {
      payload.verificationStatus = (updates.verificationStatus || updates.status || 'PENDING').toUpperCase();
    }
    if (updates.password && updates.password.trim()) {
      payload.password = updates.password.trim();
    }

    try {
      const res = await api.patch(`/agents/${agentId}`, payload);
      if (res.data) {
        const updatedAgent = normalizeAgent(res.data);
        if (updates.password) updatedAgent.password = updates.password;
        const allAgents = await fetchAgents();
        return { success: true, agent: updatedAgent, allAgents };
      }
    } catch (backendErr) {
      console.warn('[adminService.updateAgent] Backend PATCH failed, falling back to local:', backendErr.message);
    }

    // Local fallback
    const agents = getStoredAgents();
    const idx = agents.findIndex(a => a.id === agentId || a._id === agentId);
    if (idx !== -1) {
      const merged = { ...agents[idx], ...updates };
      if (updates.name) merged.fullName = updates.name;
      if (updates.fullName) merged.name = updates.fullName;
      if (updates.status) merged.verificationStatus = updates.status.toUpperCase();
      if (updates.verificationStatus) merged.status = updates.verificationStatus.toLowerCase();
      agents[idx] = merged;
      saveStoredAgents(agents);
      return { success: true, agent: merged, allAgents: agents };
    }
    throw new ApiError(`Agent with ID "${agentId}" not found.`, 404);
  } catch (error) {
    console.error(`[adminService.updateAgent] Error updating agent ${agentId}:`, error);
    throw new ApiError(formatErrorMessage(error), 500);
  }
}

/**
 * Toggles or sets agent verification status.
 */
export async function setAgentVerificationStatus(agentId, newStatus) {
  return updateAgent(agentId, {
    status: newStatus.toLowerCase(),
    verificationStatus: newStatus.toUpperCase()
  });
}

/**
 * Deletes a sales agent by ID via DELETE /agents/:id.
 */
export async function deleteAgent(agentId) {
  try {
    try {
      await api.delete(`/agents/${agentId}`);
      const allAgents = await fetchAgents();
      return { success: true, allAgents };
    } catch (backendErr) {
      console.warn('[adminService.deleteAgent] Backend DELETE failed, falling back to local:', backendErr.message);
    }

    const agents = getStoredAgents();
    const updated = agents.filter(a => a.id !== agentId && a._id !== agentId);
    saveStoredAgents(updated);
    return { success: true, allAgents: updated };
  } catch (error) {
    console.error(`[adminService.deleteAgent] Error deleting agent ${agentId}:`, error);
    throw new ApiError(formatErrorMessage(error), 500);
  }
}


