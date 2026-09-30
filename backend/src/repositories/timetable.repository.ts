import { prisma } from '../config/prisma';
import { DayOfWeek, SubjectType } from '@prisma/client';

export class TimetableRepository {
  // ==========================================
  // SUBJECT REPOSITORY
  // ==========================================

  static async createSubject(
    schoolId: string,
    data: {
      name: string;
      code: string;
      type: SubjectType;
      description?: string;
    }
  ) {
    return prisma.subject.create({
      data: {
        schoolId,
        name: data.name,
        code: data.code,
        type: data.type,
        description: data.description,
        isActive: true,
      },
    });
  }

  static async findSubjects(schoolId: string, isActive?: boolean) {
    const where: any = { schoolId };
    if (isActive !== undefined) where.isActive = isActive;
    return prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  static async findSubjectById(schoolId: string, id: string) {
    return prisma.subject.findFirst({
      where: { id, schoolId },
    });
  }

  static async findSubjectByCode(schoolId: string, code: string) {
    return prisma.subject.findFirst({
      where: { schoolId, code },
    });
  }

  static async updateSubject(
    schoolId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      type?: SubjectType;
      description?: string;
      isActive?: boolean;
    }
  ) {
    return prisma.subject.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // CLASS SUBJECTS
  // ==========================================

  static async assignClassSubject(
    schoolId: string,
    data: {
      classId: string;
      subjectId: string;
      isElective?: boolean;
    }
  ) {
    return prisma.classSubject.upsert({
      where: {
        classId_subjectId: {
          classId: data.classId,
          subjectId: data.subjectId,
        },
      },
      update: {
        isElective: data.isElective ?? false,
      },
      create: {
        schoolId,
        classId: data.classId,
        subjectId: data.subjectId,
        isElective: data.isElective ?? false,
      },
      include: {
        subject: true,
        class: true,
      },
    });
  }

  static async getClassSubjects(schoolId: string, classId: string) {
    return prisma.classSubject.findMany({
      where: { schoolId, classId },
      include: {
        subject: true,
      },
      orderBy: { subject: { name: 'asc' } },
    });
  }

  // ==========================================
  // TIMETABLE SLOTS & CLASH DETECTION
  // ==========================================

  /**
   * Check if section already has a slot at this day & period
   */
  static async findSectionSlotConflict(
    schoolId: string,
    params: {
      academicSessionId: string;
      sectionId: string;
      dayOfWeek: DayOfWeek;
      periodNumber: number;
      excludeSlotId?: string;
    }
  ) {
    const where: any = {
      schoolId,
      academicSessionId: params.academicSessionId,
      sectionId: params.sectionId,
      dayOfWeek: params.dayOfWeek,
      periodNumber: params.periodNumber,
    };
    if (params.excludeSlotId) {
      where.id = { not: params.excludeSlotId };
    }
    return prisma.timetableSlot.findFirst({ where });
  }

  /**
   * Check if teacher is already booked on the same day during overlapping times
   */
  static async findTeacherConflict(
    schoolId: string,
    params: {
      academicSessionId: string;
      teacherId: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      excludeSlotId?: string;
    }
  ) {
    // Conflict exists if existing slot starts before new end and ends after new start
    // i.e. NOT (slot.endTime <= startTime OR slot.startTime >= endTime)
    // => slot.startTime < endTime AND slot.endTime > startTime
    const where: any = {
      schoolId,
      academicSessionId: params.academicSessionId,
      teacherId: params.teacherId,
      dayOfWeek: params.dayOfWeek,
      startTime: { lt: params.endTime },
      endTime: { gt: params.startTime },
    };
    if (params.excludeSlotId) {
      where.id = { not: params.excludeSlotId };
    }

    return prisma.timetableSlot.findFirst({
      where,
      include: {
        class: { select: { name: true } },
        section: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });
  }

  /**
   * Check if room is occupied on the same day during overlapping times
   */
  static async findRoomConflict(
    schoolId: string,
    params: {
      academicSessionId: string;
      roomNumber: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      excludeSlotId?: string;
    }
  ) {
    const where: any = {
      schoolId,
      academicSessionId: params.academicSessionId,
      roomNumber: params.roomNumber,
      dayOfWeek: params.dayOfWeek,
      startTime: { lt: params.endTime },
      endTime: { gt: params.startTime },
    };
    if (params.excludeSlotId) {
      where.id = { not: params.excludeSlotId };
    }

    return prisma.timetableSlot.findFirst({
      where,
      include: {
        class: { select: { name: true } },
        section: { select: { name: true } },
      },
    });
  }

  static async createSlot(
    schoolId: string,
    data: {
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
    }
  ) {
    return prisma.timetableSlot.create({
      data: {
        schoolId,
        academicSessionId: data.academicSessionId,
        classId: data.classId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        teacherId: data.teacherId || null,
        dayOfWeek: data.dayOfWeek,
        periodNumber: data.periodNumber,
        startTime: data.startTime,
        endTime: data.endTime,
        roomNumber: data.roomNumber || null,
      },
      include: {
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
      },
    });
  }

  static async updateSlot(
    schoolId: string,
    id: string,
    data: {
      subjectId?: string;
      teacherId?: string | null;
      startTime?: string;
      endTime?: string;
      roomNumber?: string | null;
    }
  ) {
    return prisma.timetableSlot.update({
      where: { id },
      data,
      include: {
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
      },
    });
  }

  static async deleteSlot(schoolId: string, id: string) {
    return prisma.timetableSlot.delete({
      where: { id },
    });
  }

  static async findSlotById(schoolId: string, id: string) {
    return prisma.timetableSlot.findFirst({
      where: { id, schoolId },
      include: {
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
      },
    });
  }

  static async getSectionTimetable(
    schoolId: string,
    params: {
      sectionId: string;
      academicSessionId?: string;
      dayOfWeek?: DayOfWeek;
    }
  ) {
    const where: any = {
      schoolId,
      sectionId: params.sectionId,
    };
    if (params.academicSessionId) where.academicSessionId = params.academicSessionId;
    if (params.dayOfWeek) where.dayOfWeek = params.dayOfWeek;

    return prisma.timetableSlot.findMany({
      where,
      include: {
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });
  }

  static async getTeacherTimetable(
    schoolId: string,
    teacherId: string,
    academicSessionId?: string,
    dayOfWeek?: DayOfWeek
  ) {
    const where: any = {
      schoolId,
      teacherId,
    };
    if (academicSessionId) where.academicSessionId = academicSessionId;
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;

    return prisma.timetableSlot.findMany({
      where,
      include: {
        subject: true,
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });
  }
}
