// api.js
import axios from 'axios';
import { toast } from 'react-toastify';

// Base Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if using cookie-based auth
});

// Optional Auth Context (if using React Context)
let authContext = null;

export const setAuthContext = (context) => {
  authContext = context;
};

// Attach access token before requests
api.interceptors.request.use(
  (config) => {
    if (!config.url?.includes('/token/refresh/')) {
      const token = authContext?.accessToken || localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors and try refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const is401 = error.response?.status === 401;
    const isLoginOrRefresh = originalRequest.url?.includes('/token/') || originalRequest._retry;

    if (!is401 || isLoginOrRefresh) {
      console.error('API error:', error);
      return Promise.reject(error);
    }

    if (!authContext?.refreshToken) {
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;

      const refreshResponse = await axios.post(
        `${api.defaults.baseURL}/api/users/token/refresh/`,
        { refresh: authContext.refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const newAccessToken = refreshResponse.data.access;

      // Update token in context and storage
      authContext?.setAccessToken?.(newAccessToken);
      localStorage.setItem('access_token', newAccessToken);

      // Retry the original request with new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);

      // Logout and cleanup
      authContext?.logout?.();
      localStorage.removeItem('access_token');

      toast.error('Session expired. Please log in again.', {
        position: 'top-right',
        autoClose: 5000,
      });

      return Promise.reject(refreshError);
    }
  }
);

export default api;
