import api from './api';
import { ExamTerm, GradingScale, ExamSchedule, ExamMark, StudentReportCard } from '../types';

export const ExamService = {
  // ==========================================
  // EXAM TERMS
  // ==========================================

  async getTerms(academicSessionId?: string): Promise<ExamTerm[]> {
    const res = await api.get('/exams/terms', { params: { academicSessionId } });
    return res.data?.data || [];
  },

  async getTermById(id: string): Promise<ExamTerm> {
    const res = await api.get(`/exams/terms/${id}`);
    return res.data?.data;
  },

  async createTerm(payload: {
    academicSessionId: string;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    description?: string;
  }): Promise<ExamTerm> {
    const res = await api.post('/exams/terms', payload);
    return res.data?.data;
  },

  async updateTerm(
    id: string,
    payload: {
      name?: string;
      code?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
      isPublished?: boolean;
    }
  ): Promise<ExamTerm> {
    const res = await api.put(`/exams/terms/${id}`, payload);
    return res.data?.data;
  },

  async deleteTerm(id: string): Promise<void> {
    await api.delete(`/exams/terms/${id}`);
  },

  // ==========================================
  // GRADING SCALES
  // ==========================================

  async getGradingScales(): Promise<GradingScale[]> {
    const res = await api.get('/exams/grading-scales');
    return res.data?.data || [];
  },

  async getGradingScaleById(id: string): Promise<GradingScale> {
    const res = await api.get(`/exams/grading-scales/${id}`);
    return res.data?.data;
  },

  async createGradingScale(payload: {
    name: string;
    description?: string;
    rules: {
      grade: string;
      minPercentage: number;
      maxPercentage: number;
      gradePoint?: number;
      description?: string;
      isPassing?: boolean;
    }[];
  }): Promise<GradingScale> {
    const res = await api.post('/exams/grading-scales', payload);
    return res.data?.data;
  },

  // ==========================================
  // EXAM SCHEDULES
  // ==========================================

  async getSchedules(params?: {
    examTermId?: string;
    classId?: string;
    subjectId?: string;
  }): Promise<ExamSchedule[]> {
    const res = await api.get('/exams/schedules', { params });
    return res.data?.data || [];
  },

  async getScheduleById(id: string): Promise<ExamSchedule> {
    const res = await api.get(`/exams/schedules/${id}`);
    return res.data?.data;
  },

  async createSchedule(payload: {
    examTermId: string;
    classId: string;
    subjectId: string;
    gradingScaleId?: string | null;
    examDate: string;
    startTime: string;
    endTime: string;
    maxMarks: number;
    passMarks: number;
    roomNumber?: string | null;
  }): Promise<ExamSchedule> {
    const res = await api.post('/exams/schedules', payload);
    return res.data?.data;
  },

  async updateSchedule(
    id: string,
    payload: {
      examDate?: string;
      startTime?: string;
      endTime?: string;
      maxMarks?: number;
      passMarks?: number;
      roomNumber?: string | null;
      gradingScaleId?: string | null;
    }
  ): Promise<ExamSchedule> {
    const res = await api.put(`/exams/schedules/${id}`, payload);
    return res.data?.data;
  },

  async deleteSchedule(id: string): Promise<void> {
    await api.delete(`/exams/schedules/${id}`);
  },

  // ==========================================
  // MARKS ENTRY
  // ==========================================

  async getMarks(scheduleId: string): Promise<ExamMark[]> {
    const res = await api.get(`/exams/schedules/${scheduleId}/marks`);
    return res.data?.data || [];
  },

  async enterMarks(
    scheduleId: string,
    marks: {
      studentId: string;
      marksObtained?: number | null;
      isAbsent?: boolean;
      isExempt?: boolean;
      remarks?: string;
    }[]
  ): Promise<{ examScheduleId: string; totalEntered: number; marks: ExamMark[] }> {
    const res = await api.post(`/exams/schedules/${scheduleId}/marks`, { marks });
    return res.data?.data;
  },

  // ==========================================
  // PROGRESS REPORT CARD
  // ==========================================

  async getStudentReportCard(studentId: string, examTermId: string): Promise<StudentReportCard> {
    const res = await api.get(`/exams/students/${studentId}/report-card`, {
      params: { examTermId },
    });
    return res.data?.data;
  },
};
