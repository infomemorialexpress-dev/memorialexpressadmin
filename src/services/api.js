import axios from 'axios';

// The NestJS backend defaults to PORT 5000 with global prefix '/api'
// Can be customized via VITE_API_URL (e.g. http://localhost:3000/api or http://localhost:5000/api)
const DEFAULT_API_URL = 'http://localhost:5000/api';
const BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to automatically attach JWT authorization token
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('memorial_admin_auth');
      if (raw) {
        const session = JSON.parse(raw);
        if (session?.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      }
    } catch (e) {
      console.warn('[apiClient] Error loading auth token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for clear, clean error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred.';
    
    // Attach friendly message to error object
    error.userMessage = Array.isArray(message) ? message.join(', ') : message;
    return Promise.reject(error);
  }
);

export default api;
