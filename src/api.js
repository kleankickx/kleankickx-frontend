import axios from 'axios';
import { toast } from 'react-toastify';

// Base Axios instance - no React hooks here
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Create a function to setup interceptors that can accept auth functions
export const setupInterceptors = (authFunctions) => {
  const { getAccessToken, getRefreshToken, setAccessToken, logout } = authFunctions;

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      if (!config.url?.includes('/token/refresh/')) {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
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

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        originalRequest._retry = true;

        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/api/users/token/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken = refreshResponse.data.access;

        setAccessToken(newAccessToken);
        localStorage.setItem('access_token', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        logout();
        localStorage.removeItem('access_token');

        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 5000,
        });

        return Promise.reject(refreshError);
      }
    }
  );
};

export default api;