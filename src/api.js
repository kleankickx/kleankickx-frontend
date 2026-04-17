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
// 🔐 SESSION GATE
// =========================
let sessionPromise = null;
let sessionReady = false;

const initSession = async () => {
  if (sessionReady) return;

  if (!sessionPromise) {
    console.log("%c[SESSION] Initializing session...", "color: purple;");

    sessionPromise = api
      .get("/api/cart/") // This creates the session
      .then(() => {
        sessionReady = true;
        console.log("%c[SESSION] Ready ✅", "color: green;");
      })
      .catch((err) => {
        console.error("[SESSION] Failed ❌", err);
        // Don't set sessionReady to true on error
      })
      .finally(() => {
        sessionPromise = null;
      });
  }

  return sessionPromise;
};

// Reset session when user logs in/out
export const resetSession = () => {
  sessionReady = false;
  sessionPromise = null;
  console.log("%c[SESSION] Reset", "color: purple;");
};

export const ensureSessionReady = async () => {
  await initSession();
};

// =========================
// REQUEST INTERCEPTOR
// =========================
api.interceptors.request.use(
  async (config) => {
    // 🚫 Skip session init for these endpoints
    const skipSessionUrls = [
      "/api/cart/",
      "/api/token/refresh/",
      "/api/users/login/",
      "/api/users/google-login/",
      "/api/users/register/",
    ];

    const shouldSkip = skipSessionUrls.some((url) =>
      config.url?.includes(url)
    );

    // Attach token FIRST - before any session initialization
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`%c[TOKEN] Attached to ${config.url}`, "color: cyan;");
    }

    // THEN initialize session (but only if not skipping)
    if (!shouldSkip && !sessionReady) {
      await initSession();
    }

    // Debug logs
    console.log(
      `%c[REQ] ${config.method?.toUpperCase()} ${config.url}`,
      "color: blue;",
      {
        hasToken: !!token,
        sessionReady,
        url: config.url
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
    console.log(
      `%c[RES] ${response.status} ${response.config.url}`,
      "color: green;"
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error(
      `[ERR] ${originalRequest?.url}`,
      error.response?.status,
      error.message
    );

    // =========================
    // 🔁 TOKEN REFRESH
    // =========================
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          console.log("%c[AUTH] Refreshing token...", "color: orange;");

          const res = await axios.post(
            `${baseURL}/api/users/token/refresh/`,
            { refresh: refreshToken },
            { withCredentials: true }
          );

          const { access } = res.data;
          localStorage.setItem("access_token", access);

          originalRequest.headers.Authorization = `Bearer ${access}`;

          return api(originalRequest);
        } catch (refreshError) {
          console.error("[AUTH] Refresh failed ❌");

          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          resetSession(); // Reset session on auth failure

          // Don't redirect if it's the refresh endpoint itself
          if (!originalRequest.url?.includes("/token/refresh/")) {
            window.location.href = "/auth/login";
          }
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;