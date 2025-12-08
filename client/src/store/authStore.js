import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: true,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      set({ 
        user: response.data.user, 
        token: response.data.token 
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  },

  register: async (email, password) => {
    try {
      const response = await api.post('/auth/register', { email, password });
      set({ 
        user: response.data.user, 
        token: response.data.token 
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ user: null, token: null });
      localStorage.removeItem('token');
    }
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ loading: false });
        return;
      }

      const response = await api.get('/auth/me');
      set({ 
        user: response.data.user, 
        token,
        loading: false 
      });
    } catch (error) {
      set({ user: null, token: null, loading: false });
      localStorage.removeItem('token');
    }
  }
}));

export default useAuthStore;

