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

  async updateSchoolLogo(logoUrl: string) {
    const res = await api.patch('/schools/my-school/logo', { logoUrl });
    return res.data?.data;
  },

  async listSchools(params?: { page?: number; pageSize?: number; search?: string }) {
    const res = await api.get('/schools', { params });
    // Returns array of schools from res.data.data (Standard API Response shape)
    return {
      schools: res.data?.data || [],
      meta: res.data?.meta || {},
    };
  },

  async toggleSchoolStatus(schoolId: string) {
    const res = await api.patch(`/schools/${schoolId}/toggle-status`);
    return res.data?.data;
  },

  async getPlatformOverview() {
    const res = await api.get('/schools/platform-overview');
    return res.data?.data;
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
