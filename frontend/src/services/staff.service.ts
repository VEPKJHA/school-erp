import api from './api';
import { User } from '../types';

export const StaffService = {
  async getStaff(params?: { search?: string; roleCode?: string }): Promise<User[]> {
    const res = await api.get('/staff', { params });
    return res.data?.data || [];
  },

  async getStaffById(id: string): Promise<User> {
    const res = await api.get(`/staff/${id}`);
    return res.data?.data;
  },

  async createStaff(payload: Partial<User>): Promise<User> {
    const res = await api.post('/staff', payload);
    return res.data?.data;
  },

  async updateStaff(id: string, payload: Partial<User>): Promise<User> {
    const res = await api.put(`/staff/${id}`, payload);
    return res.data?.data;
  },
};
