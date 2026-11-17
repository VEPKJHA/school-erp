import api from './api';
import { User, Role } from '../types';

export const UserService = {
  async getUsers(params?: { search?: string; roleId?: string }): Promise<User[]> {
    const res = await api.get('/users', { params });
    return res.data?.data || [];
  },

  async createUser(payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    roleId: string;
  }): Promise<User> {
    const res = await api.post('/users', payload);
    return res.data?.data;
  },

  async updateUser(
    id: string,
    payload: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      roleId?: string;
    }
  ): Promise<User> {
    const res = await api.put(`/users/${id}`, payload);
    return res.data?.data;
  },

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<any> {
    const res = await api.patch(`/users/${id}/status`, { status });
    return res.data?.data;
  },

  async getRoles(): Promise<Role[]> {
    const res = await api.get('/roles');
    return res.data?.data || [];
  },

  async getPermissions(): Promise<Array<{ id: string; code: string; module: string; action: string; description: string }>> {
    const res = await api.get('/permissions');
    return res.data?.data || [];
  },

  async createRole(payload: {
    name: string;
    code: string;
    description?: string;
    permissionCodes?: string[];
  }): Promise<Role> {
    const res = await api.post('/roles', payload);
    return res.data?.data;
  },

  async updateRolePermissions(roleId: string, permissionCodes: string[]): Promise<Role> {
    const res = await api.put(`/roles/${roleId}/permissions`, { permissionCodes });
    return res.data?.data;
  },
};
