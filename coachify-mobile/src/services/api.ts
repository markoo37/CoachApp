// src/services/api.ts - Javított export
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { CheckEmailRequest, CheckEmailResponse, LoginRequest, PlayerLoginResponse, RegisterPlayerRequest } from '../types/auth';
import { useAuthStore } from "../stores/authStore";
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'https://palankeeningly-unforeshortened-delicia.ngrok-free.dev/api';

// API client setup
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  console.log("🔁 Refreshing token...");
  const res = await api.post("/auth/refresh", {}); // cookie megy (withCredentials)

  const newToken = res.data.token as string;
  if (!newToken) throw new Error("No token returned from refresh");

  await SecureStore.setItemAsync("token", newToken);
  console.log("✅ Token refreshed & stored");

  // opcionális: store frissítés
  try {
    await useAuthStore.getState().checkAuth?.();
  } catch {}

  return newToken;
}


// Request interceptor - token hozzáadása
api.interceptors.request.use(
  async (config) => {
    const url = config.url ?? "";

    const skipAuthHeader =
      url.includes("/auth/login") ||
      url.includes("/auth/login-player") ||
      url.includes("/auth/check-email") ||
      url.includes("/auth/register") ||
      url.includes("/auth/register-player") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    try {
      if (!skipAuthHeader) {
        const token = await SecureStore.getItemAsync("token");
        if (token) {
          const { exp } = jwtDecode<{ exp: number }>(token);
          console.log("🕒 access exp:", new Date(exp * 1000).toISOString());
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }

    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);


// Response interceptor - error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const originalRequest: any = error.config;

    // --- AUTH endpointok listája (ezekre nem refresh-elünk) ---
    const isAuthRequest =
      url.includes("/auth/login") ||
      url.includes("/auth/login-player") ||
      url.includes("/auth/check-email") ||
      url.includes("/auth/register") ||
      url.includes("/auth/register-player") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    // 401 kezelés
    if (status === 401) {
      // Login hibák külön üzenet
      if (url.includes("/auth/login") || url.includes("/auth/login-player")) {
        console.warn("⚠️ Login 401:", url);
        throw new Error("Hibás email vagy jelszó");
      }

      // Ha auth endpoint 401: nincs refresh, csak dobjuk tovább
      if (isAuthRequest) {
        console.warn("⚠️ Auth endpoint 401:", url);
        throw new Error("Unauthorized");
      }

      // Ne legyen végtelen retry
      if (originalRequest._retry) {
        console.warn("⚠️ Request already retried, logging out:", url);
        await useAuthStore.getState().logout?.();
        throw new Error("A munkamenet lejárt. Kérlek jelentkezz be újra.");
      }
      originalRequest._retry = true;

      try {
        // lock: egy refresh egyszerre
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken();
        }

        const newToken = await refreshPromise!;
        isRefreshing = false;
        refreshPromise = null;

        // retry eredeti request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        console.log("🔄 Retrying original request:", originalRequest.url);
        return api.request(originalRequest);
      } catch (refreshErr) {
        // refresh fail → logout
        isRefreshing = false;
        refreshPromise = null;

        console.warn("⚠️ Refresh failed, logging out");
        await useAuthStore.getState().logout?.();

        throw new Error("A munkamenet lejárt. Kérlek jelentkezz be újra.");
      }
    }

    // 403
    if (status === 403) {
      console.warn("⚠️ 403 Forbidden:", url);
      throw new Error("Nincs jogosultságod ehhez a művelethez");
    }

    // 5xx
    if (status && status >= 500) {
      console.error("❌ Server error:", status, url, error.response?.data);
      throw new Error("Szerver hiba. Próbáld újra később.");
    }

    // Network error
    if (error.code === "NETWORK_ERROR" || `${error.message}`.includes("Network Error")) {
      console.warn("⚠️ Network error:", url);
      throw new Error("Hálózati hiba. Ellenőrizd az internet kapcsolatot.");
    }

    // Backend message fallback
    const backendMessage = error.response?.data?.message;
    if (backendMessage) {
      console.warn("⚠️ Backend error message:", backendMessage);
      throw new Error(backendMessage);
    }

    // Default
    console.error("❌ Unknown API error:", url, error.message);
    throw new Error("Ismeretlen hiba történt");
  }
);



// Types for player endpoints
export interface TeamInfo {
  Id: number;
  Name: string;
  Coach: {
    Id: number;
    FirstName: string;
    LastName: string;
    Email: string;
  };
  PlayerCount: number;
}

export interface TrainingPlan {
  Id: number;
  Name: string;
  Description: string;
  Date: string;
  StartTime?: string;
  EndTime?: string;
  AthleteId?: number;
  AthleteName?: string;
  TeamId?: number;
  TeamName?: string;
}

export interface PlayerProfile {
  Id: number;
  FirstName: string;
  LastName: string;
  Email?: string;
  BirthDate?: string;
  Weight?: number;
  Height?: number;
  Age?: number;
  Teams: TeamInfo[];
  HasUserAccount: boolean;
}

// Auth API endpoints - OBJECT EXPORT (nem class!)
export const AuthAPI = {
  /**
   * Check if email exists among athletes
   */
  async checkEmail(data: CheckEmailRequest): Promise<CheckEmailResponse> {
    try {
      const response = await api.post<CheckEmailResponse>('/auth/check-email', data);
      return response.data;
    } catch (error) {
      console.error('Check Email API Error:', error);
      throw error;
    }
  },

  /**
   * Player login - updated to use /api/auth/login
   */
  async loginPlayer(credentials: LoginRequest): Promise<PlayerLoginResponse> {
    try {
      const response = await api.post('/auth/login-player', credentials);
      return response.data;
    } catch (error) {
      console.error('Login API Error:', error);
      throw error;
    }
  },

  /**
   * Player registration - updated to include all profile fields
   */
  async registerPlayer(data: RegisterPlayerRequest): Promise<{ message: string }> {
    const response = await api.post('/auth/register-player', data);
    return response.data;
  },

  /**
   * Logout (clear server-side session if needed)
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Logout hibát általában nem jelenítjük meg
      console.error('Logout API Error:', error);
    }
  }
};

// Player API endpoints - OBJECT EXPORT (nem class!)
export const PlayerAPI = {
  /**
   * Get player profile
   */
  async getProfile(): Promise<PlayerProfile> {
    try {
      const response = await api.get('/athletes/my-profile');
      return response.data;
    } catch (error) {
      console.error('Get Profile API Error:', error);
      throw error;
    }
  },

  /**
   * Get player teams
   */
  async getTeams(): Promise<TeamInfo[]> {
    try {
      const response = await api.get('/athletes/my-teams');
      return response.data;
    } catch (error) {
      console.error('Get Teams API Error:', error);
      throw error;
    }
  },

  /**
   * Get all training plans for player
   */
  async getTrainingPlans(): Promise<TrainingPlan[]> {
    try {
      const response = await api.get('/athletes/my-training-plans');
      return response.data;
    } catch (error) {
      console.error('Get Training Plans API Error:', error);
      throw error;
    }
  },

  /**
   * Get training plans for specific team
   */
  async getTeamTrainingPlans(teamId: number): Promise<TrainingPlan[]> {
    try {
      const response = await api.get(`/athletes/teams/${teamId}/training-plans`);
      return response.data;
    } catch (error) {
      console.error('Get Team Training Plans API Error:', error);
      throw error;
    }
  },

  /**
   * Get specific training plan
   */
  async getTrainingPlan(id: number): Promise<TrainingPlan> {
    try {
      const response = await api.get(`/athletes/training-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Training Plan API Error:', error);
      throw error;
    }
  },

  /**
   * Get upcoming training plans
   */
  async getUpcomingTrainings(): Promise<TrainingPlan[]> {
    try {
      const response = await api.get('/athletes/upcoming-training-plans');
      return response.data;
    } catch (error) {
      console.error('Get Upcoming Trainings API Error:', error);
      throw error;
    }
  },

  /**
   * Get today's training plans
   */
  async getTodayTrainings(): Promise<TrainingPlan[]> {
    try {
      const response = await api.get('/athletes/today-training-plans');
      return response.data;
    } catch (error) {
      console.error('Get Today Trainings API Error:', error);
      throw error;
    }
  }
};

export { api };
export default api;