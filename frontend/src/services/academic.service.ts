import api from './api';
import { AcademicSession } from '../types';

export const AcademicService = {
  async getSessions(): Promise<AcademicSession[]> {
    const res = await api.get('/academic-sessions');
    return res.data?.data || [];
  },

  async createSession(payload: {
    name: string;
    startDate: string;
    endDate: string;
    isCurrent?: boolean;
    status?: string;
  }): Promise<AcademicSession> {
    const res = await api.post('/academic-sessions', payload);
    return res.data?.data;
  },

  async updateSession(
    id: string,
    payload: {
      name?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    }
  ): Promise<AcademicSession> {
    const res = await api.put(`/academic-sessions/${id}`, payload);
    return res.data?.data;
  },

  async setCurrentSession(id: string): Promise<AcademicSession> {
    const res = await api.patch(`/academic-sessions/${id}/set-current`);
    return res.data?.data;
  },
};
