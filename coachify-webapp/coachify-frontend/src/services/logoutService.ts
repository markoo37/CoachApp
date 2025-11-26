import api from '../api/api';
import { useAuthStore } from '../store/authStore';

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    console.error('Logout error (backend):', e);
    
  } finally {
    useAuthStore.getState().logout();
  }
};
