import api from './api';
import { User, Role } from '../types';

export const UserService = {
  async getUsers(params?: { search?: string; roleId?: string }): Promise<User[]> {
    const res = await api.get('/users', { params });
    const payload = res.data?.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && Array.isArray(payload.users)) {
      return payload.users;
    }
    if (Array.isArray(res.data?.users)) {
      return res.data.users;
    }
    return [];
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
    const payload = res.data?.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && Array.isArray(payload.roles)) {
      return payload.roles;
    }
    if (Array.isArray(res.data?.roles)) {
      return res.data.roles;
    }
    return [];
  },

  async getPermissions(): Promise<Array<{ id: string; code: string; module: string; action: string; description: string }>> {
    const res = await api.get('/permissions');
    const payload = res.data?.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && Array.isArray(payload.permissions)) {
      return payload.permissions;
    }
    if (Array.isArray(res.data?.permissions)) {
      return res.data.permissions;
    }
    return [];
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
