// src/stores/authStore.ts
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { create } from 'zustand';
import { AuthAPI, PlayerAPI } from '../services/api';

interface Player {
  Id: number;
  FirstName: string;
  LastName: string;
  Email: string;
  TeamName?: string;
  CoachName?: string;
}

interface AuthState {
  token: string | null;
  player: Player | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  expiry: number | null;
  checkAuth: () => Promise<void>;
  setAuth: (token: string, player: Player) => Promise<void>;
  logout: () => Promise<void>;
  fetchAndUpdateProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  player: null,
  isAuthenticated: false,
  isLoading: true,         // <–– induláskor true
  expiry: null,

  // Ezt hívd meg a RootLayout-ban
  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const playerJson = await SecureStore.getItemAsync('player');
      if (token && playerJson) {
        const player = JSON.parse(playerJson) as Player;
        set({ token, player, isAuthenticated: true });
        // JWT-ből lejárati idő
        const { exp } = jwtDecode<{ exp: number }>(token);
        set({ expiry: exp * 1000 });
      }
    } catch (e) {
      console.warn('Auth check failed', e);
    } finally {
      // <–– itt **MINDIG** állítsd false-ra
      set({ isLoading: false });
    }
  },

  setAuth: async (token, player) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('player', JSON.stringify(player));
    const { exp } = jwtDecode<{ exp: number }>(token);
    set({
      token,
      player,
      isAuthenticated: true,
      expiry: exp * 1000,
    });
  },

  logout: async () => {
    try {
      // 1) előbb szólj a backendnek (mert még megvan a token → Authorization header megy)
      await AuthAPI.logout();
    } catch (e) {
      // backend logout hibát nem muszáj a userre borítani
      console.warn("Server logout failed:", e);
    } finally {
      // 2) utána töröld lokálisan
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('player');
      set({
        token: null,
        player: null,
        isAuthenticated: false,
        expiry: null,
      });
    }
  },

  fetchAndUpdateProfile: async () => {
    try {
      const profile = await PlayerAPI.getProfile();
      const updatedPlayer: Player = {
        Id: profile.Id,
        FirstName: profile.FirstName,
        LastName: profile.LastName,
        Email: profile.Email || '',
        TeamName: profile.Teams?.[0]?.Name,
        CoachName: profile.Teams?.[0]?.Coach ? `${profile.Teams[0].Coach.FirstName} ${profile.Teams[0].Coach.LastName}` : undefined,
      };
      
      await SecureStore.setItemAsync('player', JSON.stringify(updatedPlayer));
      set({ player: updatedPlayer });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  },
}));
