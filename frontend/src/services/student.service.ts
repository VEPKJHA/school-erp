import api from './api';
import { Student, StudentDocument } from '../types';

export interface StudentListResponse {
  students: Student[];
  total: number;
}

export const StudentService = {
  async getStudents(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    classId?: string;
    sectionId?: string;
    academicSessionId?: string;
    status?: string;
    gender?: string;
  }): Promise<StudentListResponse> {
    const res = await api.get('/students', { params });
    return {
      students: res.data?.data || [],
      total: res.data?.meta?.total || res.data?.data?.length || 0,
    };
  },

  async getStudentById(id: string): Promise<Student> {
    const res = await api.get(`/students/${id}`);
    return res.data?.data;
  },

  async createStudent(payload: any): Promise<Student> {
    const res = await api.post('/students', payload);
    return res.data?.data;
  },

  async updateStudent(id: string, payload: any): Promise<Student> {
    const res = await api.put(`/students/${id}`, payload);
    return res.data?.data;
  },

  async updateStatus(id: string, payload: { status: string; reason?: string }): Promise<Student> {
    const res = await api.patch(`/students/${id}/status`, payload);
    return res.data?.data;
  },

  async getDocuments(studentId: string): Promise<StudentDocument[]> {
    const res = await api.get(`/documents/student/${studentId}`);
    return res.data?.data || [];
  },

  async uploadDocument(formData: FormData): Promise<StudentDocument> {
    const res = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data;
  },
};
