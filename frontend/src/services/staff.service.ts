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

  async getLeaves(): Promise<any[]> {
    const res = await api.get('/staff/leaves');
    return res.data?.data || [];
  },

  async updateLeaveStatus(id: string, status: string): Promise<any> {
    const res = await api.put(`/staff/leaves/${id}`, { status });
    return res.data?.data;
  },

  async getPayrolls(): Promise<any[]> {
    const res = await api.get('/staff/payroll');
    return res.data?.data || [];
  },

  async updatePayrollStatus(id: string, status: string, paymentMethod?: string): Promise<any> {
    const res = await api.put(`/staff/payroll/${id}`, { status, paymentMethod });
    return res.data?.data;
  },
};
