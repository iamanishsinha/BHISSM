import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
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

// Handle auth errors
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('bhissm_token');
      localStorage.removeItem('bhissm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
