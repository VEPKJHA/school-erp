import api from './api';

export const SchoolService = {
  async getMySchool() {
    const res = await api.get('/schools/my-school');
    return res.data?.data;
  },
  
  async updateMySchool(data: any) {
    const res = await api.put('/schools/my-school', data);
    return res.data?.data;
  },

  async listSchools(params?: { page?: number; pageSize?: number; search?: string }) {
    const res = await api.get('/schools', { params });
    return res.data; // contains data and meta
  },

  async createSchool(data: any) {
    const res = await api.post('/schools', data);
    return res.data?.data;
  },

  async getSchoolAdmins(schoolId: string) {
    const res = await api.get(`/schools/${schoolId}/admins`);
    return res.data?.data;
  }
};
