import axios from 'axios';

/**
 * Single source of truth for API base. Override with VITE_API_URL in .env (e.g. http://localhost:5000/api).
 * Must match any page that uses raw `fetch` to the same host.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://zanzoin-backend-production.up.railway.app/api';

/** Origin only (for static files / image paths) — strips trailing /api */
export const BACKEND_ORIGIN = String(API_BASE_URL).replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});



// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling 401s (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only auto-logout on 401 from login-related actions, not data fetching
      // This prevents redirect loops when token expires during background fetches
      const url = error.config?.url || '';
      const isAuthCheck = url.includes('/auth/validate') || url.includes('/auth/me');

      if (isAuthCheck && window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('menuPermissions');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
