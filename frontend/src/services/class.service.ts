import api from './api';
import { ClassItem, Section } from '../types';

export const ClassService = {
  async getClasses(params?: { search?: string; isActive?: boolean }): Promise<ClassItem[]> {
    const res = await api.get('/classes', { params });
    return res.data?.data || [];
  },

  async getClassById(id: string): Promise<ClassItem> {
    const res = await api.get(`/classes/${id}`);
    return res.data?.data;
  },

  async createClass(payload: {
    name: string;
    code: string;
    numericOrder: number;
    description?: string;
  }): Promise<ClassItem> {
    const res = await api.post('/classes', payload);
    return res.data?.data;
  },

  async updateClass(
    id: string,
    payload: {
      name?: string;
      code?: string;
      numericOrder?: number;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<ClassItem> {
    const res = await api.put(`/classes/${id}`, payload);
    return res.data?.data;
  },

  async deactivateClass(id: string): Promise<ClassItem> {
    const res = await api.delete(`/classes/${id}`);
    return res.data?.data;
  },

  async getSections(params?: { classId?: string; search?: string }): Promise<Section[]> {
    const res = await api.get('/sections', { params });
    return res.data?.data || [];
  },

  async getSectionsByClass(classId: string): Promise<Section[]> {
    return this.getSections({ classId });
  },

  async createSection(
    classId: string,
    payload: {
      name: string;
      capacity?: number;
      roomNumber?: string;
    }
  ): Promise<Section> {
    const res = await api.post(`/classes/${classId}/sections`, payload);
    return res.data?.data;
  },

  async updateSection(
    id: string,
    payload: {
      name?: string;
      capacity?: number;
      roomNumber?: string;
      isActive?: boolean;
    }
  ): Promise<Section> {
    const res = await api.put(`/sections/${id}`, payload);
    return res.data?.data;
  },

  async deactivateSection(id: string): Promise<Section> {
    const res = await api.delete(`/sections/${id}`);
    return res.data?.data;
  },
};
