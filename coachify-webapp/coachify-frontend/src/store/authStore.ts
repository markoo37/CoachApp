import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  token: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  userId: string | null;
  userType: string | null; // ÚJ: "Coach" vagy "Player"
  coachId: string | null;  // ÚJ: coach specifikus
  expiry: number | null;
  setToken: (token: string) => void;
  logout: () => void;
}

// JWT payload interface
interface DecodedToken {
  email?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  userType?: string;
  coachId?: string;
  exp?: number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      email: null,
      firstName: null,
      lastName: null,
      userId: null,
      userType: null,
      coachId: null,
      expiry: null,

      setToken: (token: string) => {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded) {
          set({
            token,
            email: decoded.email || null,
            firstName: decoded.firstName || null,
            lastName: decoded.lastName || null,
            userId: decoded.userId || null,
            userType: decoded.userType || null, // ÚJ
            coachId: decoded.coachId || null,   // ÚJ
            expiry: decoded.exp ? decoded.exp * 1000 : null
          });
        } else {
          // Ha nem sikerül dekódolni, csak a tokent mentjük
          set({ token });
        }
      },

      logout: () => {
        set({
          token: null,
          email: null,
          firstName: null,
          lastName: null,
          userId: null,
          userType: null,
          coachId: null,
          expiry: null
        });
      }
    }),
    {
      name: 'auth-storage',
      // Perzisztáljuk az új mezőket is
      partialize: (state) => ({
        token: state.token,
        email: state.email,
        firstName: state.firstName,
        lastName: state.lastName,
        userId: state.userId,
        userType: state.userType,
        coachId: state.coachId,
        expiry: state.expiry
      }),
      // Token érvényesség ellenőrzése
      onRehydrateStorage: () => (state) => {
        
      }
    }
  )
);