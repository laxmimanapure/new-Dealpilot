import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;

// Base API URL for Axios requests
export const baseURL = (rawApiUrl && (rawApiUrl.startsWith('http') || rawApiUrl.startsWith('/'))) ? rawApiUrl : '/api';

// Helper function to resolve backend server host origin for static files/uploads
export function getBackendHost() {
  if (rawApiUrl && rawApiUrl.startsWith('http')) {
    try {
      const urlObj = new URL(rawApiUrl);
      return urlObj.origin;
    } catch (e) {
      return '';
    }
  }
  return '';
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dealpilot_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/auth') {
        localStorage.removeItem('dealpilot_token');
        localStorage.removeItem('dealpilot_user');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
