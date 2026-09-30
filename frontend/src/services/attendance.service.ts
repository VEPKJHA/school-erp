import api from './api';
import {
  StudentAttendance,
  DailyAttendanceSummary,
  MonthlyRegisterReport,
  AttendanceStatus,
} from '../types';

export const AttendanceService = {
  async markAttendance(payload: {
    studentId: string;
    classId: string;
    sectionId: string;
    academicSessionId: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
  }): Promise<StudentAttendance> {
    const res = await api.post('/attendance/mark', payload);
    return res.data?.data;
  },

  async bulkMarkAttendance(payload: {
    classId: string;
    sectionId: string;
    academicSessionId: string;
    date: string;
    records: {
      studentId: string;
      status: AttendanceStatus;
      remarks?: string;
    }[];
  }): Promise<{ date: string; totalMarked: number; records: StudentAttendance[] }> {
    const res = await api.post('/attendance/bulk', payload);
    return res.data?.data;
  },

  async getAttendance(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    classId?: string;
    sectionId?: string;
    academicSessionId?: string;
    studentId?: string;
    status?: AttendanceStatus;
  }): Promise<StudentAttendance[]> {
    const res = await api.get('/attendance', { params });
    return res.data?.data || [];
  },

  async getDailySummary(params: {
    date: string;
    classId?: string;
    sectionId?: string;
    academicSessionId?: string;
  }): Promise<DailyAttendanceSummary> {
    const res = await api.get('/attendance/summary/daily', { params });
    return res.data?.data;
  },

  async getStudentStats(
    studentId: string,
    academicSessionId?: string
  ): Promise<{
    totalDays: number;
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    HALF_DAY: number;
    EXCUSED: number;
    attendancePercentage: number;
  }> {
    const res = await api.get(`/attendance/student/${studentId}`, {
      params: { academicSessionId },
    });
    return res.data?.data;
  },

  async getMonthlyRegister(params: {
    classId: string;
    sectionId: string;
    year: number;
    month: number;
  }): Promise<MonthlyRegisterReport> {
    const res = await api.get('/attendance/register/monthly', { params });
    return res.data?.data;
  },
};
