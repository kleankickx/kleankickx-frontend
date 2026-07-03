// src/api.js
import axios from "axios";


// =========================
// BASE CONFIG
// =========================
const baseURL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:10000";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================
// SESSION PERSISTENCE
// Uses localStorage (survives page reloads, navigation, new tabs) rather than
// sessionStorage which is cleared on hard navigations and tab duplication.
// This is the fallback for when cross-origin cookies are blocked (SameSite,
// Safari ITP, etc.).
// =========================
const SESSION_STORAGE_KEY = "x_session_id";

export const getStoredSessionId = () => localStorage.getItem(SESSION_STORAGE_KEY);

export const storeSessionId = (sessionId) => {
  if (!sessionId) return;
  if (sessionId === getStoredSessionId()) return;
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  console.log("%c[SESSION] Persisted session ID", "color: teal;", sessionId.slice(0, 8) + "…");
};

export const clearStoredSessionId = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

const buildSessionHeader = () => {
  const sid = getStoredSessionId();
  return sid ? { "X-Session-Id": sid } : {};
};

// =========================
// TOKEN MANAGEMENT
// =========================
let isRefreshing = false;
let refreshSubscribers = [];
let authExpirationCallbacks = [];

export const onAuthExpiration = (callback) => {
  authExpirationCallbacks.push(callback);
  return () => {
    authExpirationCallbacks = authExpirationCallbacks.filter((cb) => cb !== callback);
  };
};

const notifyAuthExpiration = () => {
  authExpirationCallbacks.forEach((cb) => cb());
};

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now() + 30000; // 30s buffer
  } catch {
    return true;
  }
};

// =========================
// ENDPOINT CLASSIFIERS
// =========================
const isLoginEndpoint = (url) =>
  url?.includes("/api/users/login/") ||
  url?.includes("/api/users/google-login/") ||
  url?.includes("/api/users/register/");

const isRefreshEndpoint = (url) =>
  url?.includes("/token/refresh/") || url?.includes("/users/token/refresh/");

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
// TOKEN REFRESH
// =========================
const refreshAccessToken = async () => {
  const storedRefresh = localStorage.getItem("refresh_token");
  if (!storedRefresh) return null;

  try {
    console.log("%c[AUTH] Refreshing token…", "color: orange;");
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
      console.log("%c[AUTH] Refresh token expired — clearing auth", "color: red;");
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
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  if (!isTokenExpired(token)) return token;

  if (isRefreshing) {
    return new Promise((resolve) => addRefreshSubscriber(resolve));
  }

  isRefreshing = true;
  const newToken = await refreshAccessToken();
  isRefreshing = false;
  onRefreshed(newToken);
  return newToken;
};

// =========================
// SESSION INIT QUEUE
// Ensures only one "warm-up" request fires at a time so parallel page-load
// requests don't each create their own session before we have a session ID.
// =========================
let sessionInitPromise = null;

const ensureSessionId = async () => {
  if (getStoredSessionId()) return getStoredSessionId();
  if (sessionInitPromise) return sessionInitPromise;

  sessionInitPromise = axios
    .get(`${baseURL}/api/services/public/`, {
      withCredentials: true,
      headers: buildSessionHeader(),
    })
    .then((res) => {
      const sid = res.headers["x-session-id"];
      if (sid) storeSessionId(sid);
      return sid ?? null;
    })
    .catch(() => null)
    .finally(() => {
      sessionInitPromise = null;
    });

  return sessionInitPromise;
};

// =========================
// REQUEST INTERCEPTOR - UPDATED WITH SESSION
// =========================
api.interceptors.request.use(
  async (config) => {
    // 1. Auth token for protected endpoints
    if (!isPublicEndpoint(config.url)) {
      const validToken = await ensureValidToken();
      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
      }
    }

    // 2. Session header — pre-warm if not available yet for cart/service calls
    const needsSession =
      config.url?.includes("/api/cart/") ||
      config.url?.includes("/api/services/");

    if (needsSession && !getStoredSessionId()) {
      await ensureSessionId();
    }

    Object.assign(config.headers, buildSessionHeader());

    console.log(
      `%c[REQ] ${config.method?.toUpperCase()} ${config.url}`,
      "color: blue;",
      {
        hasToken: !!config.headers.Authorization,
        sessionId: getStoredSessionId()?.slice(0, 8),
      }
    );

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// RESPONSE INTERCEPTOR
// =========================
api.interceptors.response.use(
  (response) => {
    // Persist session ID from every successful response
    const sid = response.headers["x-session-id"];
    if (sid) storeSessionId(sid);

    console.log(
      `%c[RES] ${response.status} ${response.config.url}`,
      "color: green;"
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Persist session ID even from error responses (middleware still sets it)
    const sid = error.response?.headers?.["x-session-id"];
    if (sid) storeSessionId(sid);

    // Let login failures pass through to the component
    if (isLoginEndpoint(originalRequest?.url)) {
      console.log("%c[AUTH] Login failed — passing to component", "color: orange;");
      return Promise.reject(error);
    }

    // 401 handling for non-login, non-refresh endpoints
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
        Object.assign(originalRequest.headers, buildSessionHeader());
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