// src/api.js
import axios from "axios";
import { sessionManager } from "./utils/sessionManager";

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
// TOKEN MANAGEMENT (keep your existing code)
// =========================
let isRefreshing = false;
let refreshSubscribers = [];
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

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;
    const now = Date.now();
    return exp < now + 30000;
  } catch (e) {
    return true;
  }
};

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
    if (error.response?.status === 401 || error.response?.status === 400) {
      console.log("%c[AUTH] Refresh token expired or invalid - clearing auth", "color: red;");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
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

const ensureValidToken = async () => {
  let token = localStorage.getItem("access_token");
  if (!token) return null;
  if (!isTokenExpired(token)) return token;

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
// PUBLIC ENDPOINTS
// =========================
const PUBLIC_ENDPOINTS = [
  "/api/users/login/",
  "/api/users/google-login/",
  "/api/users/register/",
  "/api/users/token/refresh/",
  "/api/token/refresh/",
  "/api/services/public/",
  "/api/promotions/",
  "/api/cart/session/check/",  // Add session endpoints as public
  "/api/cart/session/init/",    // Add session endpoints as public
];

const isPublicEndpoint = (url = "") =>
  PUBLIC_ENDPOINTS.some((pub) => url.includes(pub));

// =========================
// REQUEST INTERCEPTOR - UPDATED WITH SESSION
// =========================
api.interceptors.request.use(
  async (config) => {
    // Initialize session manager if not done
    if (!sessionManager.initialized) {
      await sessionManager.initialize();
    }
    
    // Add session header for non-cookie fallback
    const sessionHeaders = sessionManager.getSessionHeader();
    Object.assign(config.headers, sessionHeaders);
    
    // Add auth token for non-public endpoints
    if (!isPublicEndpoint(config.url)) {
      const validToken = await ensureValidToken();
      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
      }
    }

    console.log(
      `%c[REQ] ${config.method?.toUpperCase()} ${config.url}`,
      "color: blue;",
      { 
        hasToken: !!config.headers.Authorization,
        hasSessionHeader: !!config.headers['X-Session-Id']
      }
    );

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// RESPONSE INTERCEPTOR - UPDATED WITH SESSION
// =========================
api.interceptors.response.use(
  (response) => {
    // Capture session ID from response headers
    const sessionId = response.headers['x-session-id'];
    if (sessionId && sessionId !== sessionManager.manualSessionId) {
      sessionManager.manualSessionId = sessionId;
      localStorage.setItem('manual_session_id', sessionId);
      console.log('[Session] Updated session ID from header:', sessionId.substring(0, 8) + '...');
    }
    
    console.log(
      `%c[RES] ${response.status} ${response.config.url}`,
      "color: green;"
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (isLoginEndpoint(originalRequest?.url)) {
      console.log("%c[AUTH] Login failed - passing to component", "color: orange;");
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshEndpoint(originalRequest?.url)) {
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

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      notifyAuthExpiration();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;