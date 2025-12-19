import axios from 'axios';
import { useAuthStore } from '../store/authStore';


//console.log("api.ts LOADED (axios instance)");

const api = axios.create({
  baseURL: 'https://localhost:7010/api',
  withCredentials: true
});

// Változó a refresh folyamat követésére
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - token hozzáadása minden kéréshez
api.interceptors.request.use((config) => {
  console.log("➡️ axios request", config.method, config.url);
  const authStore = useAuthStore.getState();
  const token = authStore.token;

  const url = config.url ?? "";
  const skipAuthHeader =
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/check-email") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout");

  if (token && !skipAuthHeader) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});


// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("axios error", error.response?.status, error.config?.url);

    const originalRequest: any = error.config;
    const authStore = useAuthStore.getState();
    const url = originalRequest.url || "";
    const status = error.response?.status;

    const isAuthRequest =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/check-email") ||
      url.includes("/auth/logout") ||
      url.includes("/auth/refresh");

    // Ha a refresh 401 -> nincs érvényes refresh cookie/token -> logout
    if (url.includes("/auth/refresh") && status === 401) {
      authStore.logout();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      console.log("🧩 401 caught, will try refresh. url=", originalRequest.url);

      // auth endpointokra ne refresh-elünk
      if (isAuthRequest) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post("/auth/refresh");
        const newToken = res.data.token;
        
        authStore.setToken(newToken);
        isRefreshing = false;
        processQueue(null, newToken);

        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authStore.logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        
      }
    }

    return Promise.reject(error);
  }
);


export default api;