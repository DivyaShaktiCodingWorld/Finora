
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

async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  if (!csrfPromise) {
    csrfPromise = axios
      .get(`${baseURL}/auth/csrf`, {
        withCredentials: true,
      })
      .then((response) => {
        csrfToken = response.data.csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toLowerCase();

  if (["post", "put", "patch", "delete"].includes(method)) {
    const token = await getCsrfToken();

    config.headers["X-CSRF-Token"] = token;
  }

  return config;
});

let refreshPromise = null;

const excludedRefreshPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/refresh",
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || error.response?.status !== 401) {
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
