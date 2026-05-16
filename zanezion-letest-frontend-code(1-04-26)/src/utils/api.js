import axios from 'axios';

/**
 * Single source of truth for API base. Override with VITE_API_URL in .env (e.g. http://localhost:5000/api).
 * Must match any page that uses raw `fetch` to the same host.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://zanzone-production.up.railway.app/api';
// 'http://localhost:5000/api';

/** Origin only (for static files / image paths) — strips trailing /api */
export const BACKEND_ORIGIN = String(API_BASE_URL).replace(/\/api\/?$/, '');

/** Resolves relative paths to absolute URLs using BACKEND_ORIGIN */
export const toAbsoluteImageUrl = (rawPath) => {
  if (!rawPath) return null;
  if (typeof rawPath === 'object' && rawPath != null && typeof rawPath.url === 'string') {
    return toAbsoluteImageUrl(rawPath.url);
  }
  if (typeof rawPath !== 'string') return null;
  const trimmed = rawPath.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;
  // Ensure path starts with / for joining
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/\\/g, '/')}`;
  return `${BACKEND_ORIGIN}${path}`;
};

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
    /** Let the browser set `multipart/form-data` + boundary. Default `application/json` breaks file uploads if Content-Type is forced without boundary. */
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const h = config.headers;
      if (h && typeof h.delete === 'function') {
        h.delete('Content-Type');
      } else if (h && typeof h === 'object') {
        delete h['Content-Type'];
        delete h['content-type'];
      }
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
