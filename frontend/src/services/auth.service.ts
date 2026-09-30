import api from './api';
import { User } from '../types';

export const AuthService = {
  async login(payload: { email: string; password: string; schoolCode?: string }) {
    const res = await api.post('/auth/login', payload);
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  async getMe(): Promise<{ data: User }> {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async getDashboardStats() {
    const res = await api.get('/dashboard/stats');
    return res.data?.data;
  },
};
