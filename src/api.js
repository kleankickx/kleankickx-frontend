// src/api.js
import axios from "axios";

// =========================
// BASE CONFIG
// =========================
const baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================
// TOKEN MANAGEMENT
// =========================
let isRefreshing = false;
let refreshSubscribers = [];

// Event for auth expiration (components can listen to this)
let authExpirationCallbacks = [];

export const onAuthExpiration = (callback) => {
  authExpirationCallbacks.push(callback);
  return () => {
    authExpirationCallbacks = authExpirationCallbacks.filter(cb => cb !== callback);
  };
};

const notifyAuthExpiration = () => {
  authExpirationCallbacks.forEach(cb => cb());
};

// =========================
// TOKEN VALIDATION
// =========================
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;
    const now = Date.now();
    // 30-second buffer to refresh before actual expiry
    return exp < now + 30000;
  } catch (e) {
    return true;
  }
};

// =========================
// CHECK IF ERROR IS FROM LOGIN ENDPOINT
// =========================
const isLoginEndpoint = (url) => {
  return url?.includes("/api/users/login/") || 
         url?.includes("/api/users/google-login/") ||
         url?.includes("/api/users/register/");
};

const isRefreshEndpoint = (url) => {
  return url?.includes("/token/refresh/") || 
         url?.includes("/users/token/refresh/");
};

const refreshAccessToken = async () => {
  const storedRefresh = localStorage.getItem("refresh_token");
  if (!storedRefresh) return null;

  try {
    console.log("%c[AUTH] Refreshing token...", "color: orange;");

    const response = await axios.post(
      `${baseURL}/api/users/token/refresh/`,
      { refresh: storedRefresh },
      { withCredentials: true }
    );

    const { access } = response.data;
    localStorage.setItem("access_token", access);

    console.log("%c[AUTH] Token refreshed ✅", "color: green;");
    return access;
  } catch (error) {
    console.error("[AUTH] Refresh failed ❌", error);
    
    // Check if refresh token is expired or invalid
    if (error.response?.status === 401 || error.response?.status === 400) {
      console.log("%c[AUTH] Refresh token expired or invalid - clearing auth", "color: red;");
      // Clear all tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      
      // Notify components that auth has expired
      notifyAuthExpiration();
      
      return null;
    }
    
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return null;
  }
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

// =========================
// ENSURE VALID TOKEN
// =========================
const ensureValidToken = async () => {
  let token = localStorage.getItem("access_token");

  if (!token) return null;

  if (!isTokenExpired(token)) return token;

  // Token is expired — refresh it (deduplicated)
  if (isRefreshing) {
    return new Promise((resolve) => {
      addRefreshSubscriber((newToken) => resolve(newToken));
    });
  }

  isRefreshing = true;
  const newToken = await refreshAccessToken();
  isRefreshing = false;

  if (newToken) {
    onRefreshed(newToken);
    return newToken;
  }

  onRefreshed(null);
  return null;
};

// =========================
// ENDPOINTS THAT SKIP AUTH
// =========================
const PUBLIC_ENDPOINTS = [
  "/api/users/login/",
  "/api/users/google-login/",
  "/api/users/register/",
  "/api/users/token/refresh/",
  "/api/token/refresh/",
  "/api/services/public/",
  "/api/promotions/",
];

const isPublicEndpoint = (url = "") =>
  PUBLIC_ENDPOINTS.some((pub) => url.includes(pub));

// =========================
// REQUEST INTERCEPTOR
// =========================
api.interceptors.request.use(
  async (config) => {
    if (!isPublicEndpoint(config.url)) {
      const validToken = await ensureValidToken();

      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
      }
    }

    console.log(
      `%c[REQ] ${config.method?.toUpperCase()} ${config.url}`,
      "color: blue;",
      { hasToken: !!config.headers.Authorization }
    );

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// RESPONSE INTERCEPTOR - FIXED
// =========================
api.interceptors.response.use(
  (response) => {
    console.log(
      `%c[RES] ${response.status} ${response.config.url}`,
      "color: green;"
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // IMPORTANT: Don't handle 401s from login endpoints - let the component handle them
    if (isLoginEndpoint(originalRequest?.url)) {
      console.log("%c[AUTH] Login failed - passing to component", "color: orange;");
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized for non-login endpoints
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Never retry the refresh endpoint itself
      if (isRefreshEndpoint(originalRequest?.url)) {
        // Refresh token is invalid - clear everything
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        notifyAuthExpiration();
        return Promise.reject(error);
      }

      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // No new token - auth is expired
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      notifyAuthExpiration();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;