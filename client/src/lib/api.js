import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let csrfToken = null;
let csrfPromise = null;

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^|;\\s*)(" + name + ")=([^;]*)")
  );
  return match ? decodeURIComponent(match[3]) : null;
}

export async function getCsrfToken(forceRefresh = false) {
  // If not forcing refresh, check cookie first (ensures exact match with browser's Cookie header)
  if (!forceRefresh) {
    const cookieToken = getCookie("csrfToken");
    if (cookieToken && cookieToken.length === 64) {
      csrfToken = cookieToken;
      return csrfToken;
    }

    if (csrfToken && csrfToken.length === 64) {
      return csrfToken;
    }
  }

  if (!csrfPromise) {
    csrfPromise = axios
      .get(`${baseURL}/auth/csrf`, {
        withCredentials: true,
      })
      .then((response) => {
        csrfToken = response.data.csrfToken;
        return csrfToken;
      })
      .catch((err) => {
        console.error("Failed to fetch CSRF token:", err);
        throw err;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
}

// Request interceptor attaches CSRF token on mutating methods
api.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toLowerCase();

  if (["post", "put", "patch", "delete"].includes(method)) {
    const token = await getCsrfToken();
    if (token) {
      config.headers["X-CSRF-Token"] = token;
    }
  }

  return config;
});

let refreshPromise = null;

const excludedRefreshPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/refresh",
  "/auth/csrf",
];

// Response interceptor for automatic CSRF retry and session refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // Auto-recovery for 403 CSRF validation failures
    if (
      error.response?.status === 403 &&
      typeof error.response?.data?.message === "string" &&
      error.response.data.message.includes("CSRF") &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      try {
        const freshToken = await getCsrfToken(true);
        originalRequest.headers["X-CSRF-Token"] = freshToken;
        return api(originalRequest);
      } catch (csrfErr) {
        return Promise.reject(csrfErr);
      }
    }

    // 401 Session Refresh
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";
    const excluded = excludedRefreshPaths.some((path) =>
      requestUrl.includes(path)
    );

    if (excluded || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const token = await getCsrfToken();

          return axios.post(
            `${baseURL}/auth/refresh`,
            {},
            {
              withCredentials: true,
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": token,
              },
            }
          );
        })().finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;
      return api(originalRequest);
    } catch (refreshError) {
      csrfToken = null;
      return Promise.reject(refreshError);
    }
  }
);

export default api;
