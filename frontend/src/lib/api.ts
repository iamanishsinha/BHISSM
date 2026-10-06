import axios from 'axios';

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || '/api',
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

// Handle auth errors safely without disrupting active login flows or bootstrapping
API.interceptors.response.use(
  (res) => res,
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
