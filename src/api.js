import axios from 'axios';
import { toast } from 'react-toastify';

// Create Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false // Explicitly set this if you're not using cookies
});

// Store AuthContext methods for interceptor
let authContext = null;

export const setAuthContext = (context) => {
  authContext = context;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Skip for refresh token request to avoid infinite loops
    if (config.url?.includes('/token/refresh/')) {
      return config;
    }

    const token = authContext?.accessToken || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Skip if already retried or not a 401 error
    if (error.response?.status !== 401 || originalRequest._retry) {
        console.error('API Error:', error);
      return Promise.reject(error);
    }

    // Skip for login/refresh endpoints to avoid infinite loops
    if (originalRequest.url?.includes('/token/') || !authContext?.refreshToken) {
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      
      // Refresh token request
      const response = await axios.post(
        `${api.defaults.baseURL}/api/users/token/refresh/`,
        { refresh: authContext.refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            // Explicitly no Authorization header for refresh request
            Authorization: undefined
          }
        }
      );

      const newAccessToken = response.data.access;
      
      // Update context and storage
      if (authContext.setAccessToken) {
        authContext.setAccessToken(newAccessToken);
      }
      localStorage.setItem('accessToken', newAccessToken);
      
      // Update the original request with new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      
      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      
      // Clear auth state on refresh failure
      if (authContext.logout) {
        authContext.logout();
      }
      localStorage.removeItem('accessToken');
      
      toast.error('Session expired. Please log in again.', {
        position: 'top-right',
        autoClose: 5000
      });
      
      return Promise.reject(refreshError);
    }
  }
);

export default api;