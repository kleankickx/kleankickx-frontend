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

    // Only attempt one retry per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Never retry the refresh endpoint itself
      if (
        originalRequest.url?.includes("/token/refresh/") ||
        originalRequest.url?.includes("/users/token/refresh/")
      ) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return Promise.reject(error);
      }

      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // For protected non-cart pages, redirect to login
      if (!originalRequest.url?.includes("/api/cart/")) {
        window.location.href = "/auth/login";
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;