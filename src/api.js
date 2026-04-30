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
// 🔐 TOKEN MANAGEMENT
// =========================
let sessionPromise = null;
let sessionReady = false;
let isRefreshing = false;
let refreshSubscribers = [];

const initSession = async () => {
  if (sessionReady) return;

  if (!sessionPromise) {
    console.log("%c[SESSION] Initializing session...", "color: purple;");

    sessionPromise = api
      .get("/api/cart/")
      .then(() => {
        sessionReady = true;
        console.log("%c[SESSION] Ready ✅", "color: green;");
      })
      .catch((err) => {
        console.error("[SESSION] Failed ❌", err);
      })
      .finally(() => {
        sessionPromise = null;
      });
  }

  return sessionPromise;
};

export const resetSession = () => {
  sessionReady = false;
  sessionPromise = null;
  console.log("%c[SESSION] Reset", "color: purple;");
};

// =========================
// 🔐 TOKEN VALIDATION
// =========================
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    const now = Date.now();
    // Add 30 second buffer to refresh before actual expiry
    return exp < now + 30000;
  } catch (e) {
    return true;
  }
};

const refreshToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  try {
    console.log("%c[AUTH] Refreshing token...", "color: orange;");
    
    const response = await axios.post(
      `${baseURL}/api/users/token/refresh/`,
      { refresh: refreshToken },
      { withCredentials: true }
    );

    const { access } = response.data;
    localStorage.setItem("access_token", access);
    
    console.log("%c[AUTH] Token refreshed ✅", "color: green;");
    return access;
  } catch (error) {
    console.error("[AUTH] Refresh failed ❌", error);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    resetSession();
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
// 🔐 ENSURE VALID TOKEN BEFORE REQUEST
// =========================
const ensureValidToken = async () => {
  let token = localStorage.getItem("access_token");
  
  if (!token) {
    return null;
  }
  
  if (isTokenExpired(token)) {
    if (isRefreshing) {
      // Wait for refresh to complete
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          resolve(newToken);
        });
      });
    }
    
    isRefreshing = true;
    const newToken = await refreshToken();
    isRefreshing = false;
    
    if (newToken) {
      onRefreshed(newToken);
      return newToken;
    }
    return null;
  }
  
  return token;
};

// =========================
// REQUEST INTERCEPTOR
// =========================
api.interceptors.request.use(
  async (config) => {
    // Skip token validation for public endpoints
    const publicEndpoints = [
      "/api/users/login/",
      "/api/users/google-login/",
      "/api/users/register/",
      "/api/token/refresh/",
      "/api/services/public/",
      "/api/promotions/",
    ];
    
    const isPublic = publicEndpoints.some((url) => config.url?.includes(url));
    
    // For cart operations, ensure valid token first
    if (!isPublic && config.url?.includes("/api/cart/")) {
      const validToken = await ensureValidToken();
      
      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
        console.log(`%c[TOKEN] Valid token attached to ${config.url}`, "color: cyan;");
      }
    } else {
      // For other endpoints, just attach existing token
      const token = localStorage.getItem("access_token");
      if (token && !isTokenExpired(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Initialize session if needed (skip for certain endpoints)
    const skipSessionUrls = [
      "/api/token/refresh/",
      "/api/users/login/",
      "/api/users/google-login/",
      "/api/users/register/",
    ];
    
    const shouldSkipSession = skipSessionUrls.some((url) => config.url?.includes(url));
    
    if (!shouldSkipSession && !sessionReady && !config.url?.includes("/services/public/")) {
      await initSession();
    }
    
    console.log(
      `%c[REQ] ${config.method?.toUpperCase()} ${config.url}`,
      "color: blue;",
      {
        hasToken: !!config.headers.Authorization,
        sessionReady,
      }
    );
    
    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// RESPONSE INTERCEPTOR (FALLBACK)
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
    
    // If we already tried to refresh, don't retry again
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Don't try to refresh the refresh endpoint
      if (originalRequest.url?.includes("/token/refresh/")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/auth/login";
        return Promise.reject(error);
      }
      
      const newToken = await refreshToken();
      
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        // Redirect to login only for non-cart operations
        if (!originalRequest.url?.includes("/api/cart/")) {
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export const ensureSessionReady = async () => {
  await initSession();
};

export default api;