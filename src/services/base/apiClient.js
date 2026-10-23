// Base API Client and Shared Utilities for MemorialExpress
import { LEGACY_DATA } from '../../utils/legacyData.js';

export const STORAGE_KEY = 'legacy_simple_v5';
export const ADMIN_AUTH_KEY = 'memorial_express_admin_token';
export const AGENT_AUTH_KEY = 'memorial_express_auth_session';

/**
 * Standard typed API Error class for consistent exception handling
 */
export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Formats any caught exception into a user-friendly UI message
 */
export function formatErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error instanceof ApiError) return error.message;
  if (error?.message) return error.message;
  return 'An unexpected network error occurred. Please check your connection and try again.';
}

/**
 * Safely retrieves stored database from local storage with fallback
 */
export function getStoredDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('legacy_simple_v4') ||
      localStorage.getItem('legacy_simple_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.homes) && parsed.packages) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[apiClient] Failed to parse localStorage db, fallback to initial DB', err);
  }
  return JSON.parse(JSON.stringify(LEGACY_DATA.initialDb));
}

/**
 * Persists updated database into local storage (internal helper for write services)
 */
export function saveStoredDb(db) {
  try {
    if (!db || typeof db !== 'object') {
      throw new ApiError('Invalid database payload provided for persistence.', 400);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return true;
  } catch (err) {
    console.error('[apiClient] Failed to save db to localStorage', err);
    throw new ApiError('Unable to save changes to local storage. Storage quota may be full.', 507);
  }
}
