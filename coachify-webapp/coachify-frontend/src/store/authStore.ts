import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// JWT dekódoló függvény
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

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
        const decoded = decodeJWT(token);
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
        if (state?.token && state?.expiry) {
          if (state.expiry < Date.now()) {
            state.logout();
          }
        }
      }
    }
  )
);