import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9090/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('habitx_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('habitx_token');
      localStorage.removeItem('habitx_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;
