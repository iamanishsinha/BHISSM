import axios from 'axios';

const API = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  timeout: 30000,
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('bhissm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses: prevent SPA HTML fallbacks from being treated as valid JSON data
API.interceptors.response.use(
  (res) => {
    // If an API request received an HTML document (due to SPA catch-all rewrite), reject it
    if (
      typeof res.data === 'string' &&
      (res.data.trim().startsWith('<!DOCTYPE') || res.data.trim().startsWith('<html'))
    ) {
      return Promise.reject(
        new Error(`[BHISSM API] Endpoint ${res.config?.url} returned HTML fallback instead of JSON.`)
      );
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      const hadToken = Boolean(localStorage.getItem('bhissm_token'));
      const isLoginRoute = window.location.pathname.includes('/login');
      // Only purge and redirect if there was an active session that got revoked
      if (hadToken && !isLoginRoute) {
        localStorage.removeItem('bhissm_token');
        localStorage.removeItem('bhissm_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default API;
