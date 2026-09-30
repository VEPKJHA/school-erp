import api from './api';
import { Admission, StudentDocument } from '../types';

export interface AdmissionListResponse {
  admissions: Admission[];
  total: number;
}

export const AdmissionService = {
  async getAdmissions(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    academicSessionId?: string;
    applyingClassId?: string;
    status?: string;
  }): Promise<AdmissionListResponse> {
    const res = await api.get('/admissions', { params });
    return {
      admissions: res.data?.data || [],
      total: res.data?.meta?.total || res.data?.data?.length || 0,
    };
  },

  async getAdmissionById(id: string): Promise<Admission> {
    const res = await api.get(`/admissions/${id}`);
    return res.data?.data;
  },

  async createAdmission(payload: any): Promise<Admission> {
    const res = await api.post('/admissions', payload);
    return res.data?.data;
  },

  async approveAdmission(
    id: string,
    payload: { assignedSectionId: string; remarks?: string }
  ): Promise<Admission> {
    const res = await api.patch(`/admissions/${id}/approve`, payload);
    return res.data?.data;
  },

  async rejectAdmission(
    id: string,
    payload: { rejectionReason: string }
  ): Promise<Admission> {
    const res = await api.patch(`/admissions/${id}/reject`, payload);
    return res.data?.data;
  },

  async getDocuments(admissionId: string): Promise<StudentDocument[]> {
    const res = await api.get(`/documents/admission/${admissionId}`);
    return res.data?.data || [];
  },
};
