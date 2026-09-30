import api from './api';
import { Subject, ClassSubject, TimetableSlot, DayOfWeek, SubjectType } from '../types';

export const TimetableService = {
  // ==========================================
  // SUBJECTS
  // ==========================================

  async getSubjects(isActive?: boolean): Promise<Subject[]> {
    const res = await api.get('/timetable/subjects', { params: { isActive } });
    return res.data?.data || [];
  },

  async getSubjectById(id: string): Promise<Subject> {
    const res = await api.get(`/timetable/subjects/${id}`);
    return res.data?.data;
  },

  async createSubject(payload: {
    name: string;
    code: string;
    type: SubjectType;
    description?: string;
  }): Promise<Subject> {
    const res = await api.post('/timetable/subjects', payload);
    return res.data?.data;
  },

  async updateSubject(
    id: string,
    payload: {
      name?: string;
      code?: string;
      type?: SubjectType;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<Subject> {
    const res = await api.put(`/timetable/subjects/${id}`, payload);
    return res.data?.data;
  },

  async assignClassSubject(payload: {
    classId: string;
    subjectId: string;
    isElective?: boolean;
  }): Promise<ClassSubject> {
    const res = await api.post('/timetable/classes/assign', payload);
    return res.data?.data;
  },

  async getClassSubjects(classId: string): Promise<ClassSubject[]> {
    const res = await api.get(`/timetable/classes/${classId}/subjects`);
    return res.data?.data || [];
  },

  // ==========================================
  // TIMETABLE SLOTS
  // ==========================================

  async createSlot(payload: {
    academicSessionId: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    teacherId?: string | null;
    dayOfWeek: DayOfWeek;
    periodNumber: number;
    startTime: string;
    endTime: string;
    roomNumber?: string | null;
  }): Promise<TimetableSlot> {
    const res = await api.post('/timetable/slots', payload);
    return res.data?.data;
  },

  async updateSlot(
    id: string,
    payload: {
      subjectId?: string;
      teacherId?: string | null;
      startTime?: string;
      endTime?: string;
      roomNumber?: string | null;
    }
  ): Promise<TimetableSlot> {
    const res = await api.put(`/timetable/slots/${id}`, payload);
    return res.data?.data;
  },

  async deleteSlot(id: string): Promise<void> {
    await api.delete(`/timetable/slots/${id}`);
  },

  async getSectionTimetable(
    sectionId: string,
    params?: { academicSessionId?: string; dayOfWeek?: DayOfWeek }
  ): Promise<TimetableSlot[]> {
    const res = await api.get(`/timetable/sections/${sectionId}`, { params });
    return res.data?.data || [];
  },

  async getTeacherTimetable(
    teacherId: string,
    params?: { academicSessionId?: string; dayOfWeek?: DayOfWeek }
  ): Promise<TimetableSlot[]> {
    const res = await api.get(`/timetable/teachers/${teacherId}`, { params });
    return res.data?.data || [];
  },
};
