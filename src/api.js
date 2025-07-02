// src/api.js
import axios from 'axios';

// Base URL for backend API
const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// Factory function that creates an API client using provided auth methods/state
export const createApiClient = (auth) => {
  // Create a preconfigured Axios instance
  const api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Flags and queue to handle simultaneous refresh token attempts
  let isRefreshing = false;
  let failedQueue = [];

  // Handles resolving or rejecting all queued requests after refresh attempt
  const processQueue = (error, token = null) => {
    failedQueue.forEach(p => {
      if (error) p.reject(error);
      else p.resolve(token);
    });
    failedQueue = [];
  };

  // Function to refresh the access token using the refresh token
  const refreshAccessToken = async () => {
    const refresh = auth.refreshToken;
    if (!refresh) throw new Error('No refresh token available');

    const res = await axios.post(`${baseURL}/api/users/token/refresh/`, { refresh });
    const { access, refresh: newRefresh } = res.data;

    // Update tokens using provided auth methods
    auth.setAccessToken(access);
    if (newRefresh) auth.setRefreshToken(newRefresh);

    return access;
  };

  // Wrapper around axios.request to handle token and automatic retry after 401
  const request = async (config) => {
    const token = auth.accessToken;

    // Inject Authorization header if token exists
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      // Make the API call
      return await api.request(config);
    } catch (error) {
      const originalRequest = config;

      // Determine whether to attempt token refresh
      const shouldRetry =
        error.response?.status === 401 &&
        !originalRequest._retry &&
        auth.refreshToken &&
        !originalRequest.url.includes('/token/');

      if (!shouldRetry) throw error;

      // Handle multiple concurrent refresh attempts
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(newToken => {
          // Retry the original request with new token
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          };
          return api.request(originalRequest);
        });
      }

      // Mark request to prevent infinite retry loops
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the access token
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);

        // Retry the original request with the new token
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return api.request(originalRequest);
      } catch (refreshErr) {
        // On failure, reject all queued requests and optionally logout
        processQueue(refreshErr);
        auth.logout?.();
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }
  };

  // Return an API object with Axios-style methods and automatic refresh handling
  return {
    get: (url, config = {}) => request({ method: 'GET', url, ...config }),
    post: (url, data, config = {}) => request({ method: 'POST', url, data, ...config }),
    put: (url, data, config = {}) => request({ method: 'PUT', url, data, ...config }),
    delete: (url, config = {}) => request({ method: 'DELETE', url, ...config }),
    request, // also expose the low-level request function
  };
};
