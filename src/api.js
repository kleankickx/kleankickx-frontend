// src/api.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export const createApiClient = (auth) => {
  const api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  });

  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach(promise => {
      if (error) promise.reject(error);
      else promise.resolve(token);
    });
    failedQueue = [];
  };

  const refreshAccessToken = async () => {
    const refresh = auth.refreshToken;
    if (!refresh) throw new Error('No refresh token available');

    const response = await axios.post(`${baseURL}/api/users/token/refresh/`, { refresh });
    const { access, refresh: newRefresh } = response.data;

    auth.setAccessToken(access);
    if (newRefresh) auth.setRefreshToken(newRefresh);

    return access;
  };

  api.interceptors.request.use(config => {
    const token = auth.accessToken;
    if (token && !config.url.includes('/token/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    res => res,
    async err => {
      const originalRequest = err.config;

      const shouldRefresh =
        err.response?.status === 401 &&
        !originalRequest._retry &&
        auth.refreshToken &&
        !originalRequest.url.includes('/token/');

      if (!shouldRefresh) return Promise.reject(err);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);
        auth.logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
  );

  return api;
};
