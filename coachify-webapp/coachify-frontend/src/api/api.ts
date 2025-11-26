import axios from 'axios';
import { useAuthStore } from '../store/authStore';

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
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore.getState();
    const token = authStore.token;
    
    if (token && !config.url?.includes('/auth/refresh')) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore.getState();

    // Ha a refresh endpoint hibázik, egyből kijelentkeztetjük
    if (originalRequest.url?.includes('/auth/refresh')) {
      authStore.logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';
    
      // ⛔️ KIVÉTEL: ha a login endpointról jön a 401,
      // akkor ne próbáljunk refresh-elni, csak dobjuk tovább a hibát
      if (url.includes('/auth/login')) {
        return Promise.reject(error);
      }
    
      if (isRefreshing) {
        // Ha már folyamatban van refresh, várjuk meg
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
    
      originalRequest._retry = true;
      isRefreshing = true;
    
      try {
        const res = await api.post('/auth/refresh');
        const newToken = res.data.token;
    
        authStore.setToken(newToken);
        processQueue(null, newToken);
    
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authStore.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    
    return Promise.reject(error);
  }
);

export default api;