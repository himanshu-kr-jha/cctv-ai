import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('cctv_user') || 'null'),
  token: localStorage.getItem('cctv_token') || null,
  isAuthenticated: !!localStorage.getItem('cctv_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('cctv_token', data.token);
      localStorage.setItem('cctv_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  register: async (name, email, password, role) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      localStorage.setItem('cctv_token', data.token);
      localStorage.setItem('cctv_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('cctv_token');
    localStorage.removeItem('cctv_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));
