import { TimetableRepository } from '../repositories/timetable.repository';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { DayOfWeek, SubjectType } from '@prisma/client';

export class TimetableService {
  // ==========================================
  // SUBJECT SERVICES
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
    const existing = await TimetableRepository.findSubjectByCode(schoolId, data.code);
    if (existing) {
      throw new ApiError(409, `Subject code '${data.code}' is already registered in your school`);
    }

    return TimetableRepository.createSubject(schoolId, data);
  }

  static async getSubjects(schoolId: string, isActive?: boolean) {
    return TimetableRepository.findSubjects(schoolId, isActive);
  }

  static async getSubjectById(schoolId: string, id: string) {
    const subject = await TimetableRepository.findSubjectById(schoolId, id);
    if (!subject) {
      throw new ApiError(404, 'Subject not found in your school');
    }
    return subject;
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
    await this.getSubjectById(schoolId, id);

    if (data.code) {
      const existing = await TimetableRepository.findSubjectByCode(schoolId, data.code);
      if (existing && existing.id !== id) {
        throw new ApiError(409, `Subject code '${data.code}' is already used by another subject`);
      }
    }

    return TimetableRepository.updateSubject(schoolId, id, data);
  }

  static async assignClassSubject(
    schoolId: string,
    data: {
      classId: string;
      subjectId: string;
      isElective?: boolean;
    }
  ) {
    const [cls, sub] = await Promise.all([
      prisma.class.findFirst({ where: { id: data.classId, schoolId } }),
      prisma.subject.findFirst({ where: { id: data.subjectId, schoolId } }),
    ]);

    if (!cls) throw new ApiError(404, 'Class not found in your school');
    if (!sub) throw new ApiError(404, 'Subject not found in your school');

    return TimetableRepository.assignClassSubject(schoolId, data);
  }

  static async getClassSubjects(schoolId: string, classId: string) {
    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) throw new ApiError(404, 'Class not found in your school');

    return TimetableRepository.getClassSubjects(schoolId, classId);
  }

  // ==========================================
  // TIMETABLE SLOT SERVICES & CLASH ENFORCEMENT
  // ==========================================

  private static async validateHierarchy(
    schoolId: string,
    params: {
      academicSessionId: string;
      classId: string;
      sectionId: string;
      subjectId: string;
      teacherId?: string | null;
    }
  ) {
    const [session, classRecord, section, subject] = await Promise.all([
      prisma.academicSession.findFirst({
        where: { id: params.academicSessionId, schoolId },
      }),
      prisma.class.findFirst({
        where: { id: params.classId, schoolId },
      }),
      prisma.section.findFirst({
        where: { id: params.sectionId, classId: params.classId, schoolId },
      }),
      prisma.subject.findFirst({
        where: { id: params.subjectId, schoolId },
      }),
    ]);

    if (!session) throw new ApiError(404, 'Academic session not found in your school');
    if (!classRecord) throw new ApiError(404, 'Class not found in your school');
    if (!section) throw new ApiError(404, 'Section not found for this class in your school');
    if (!subject) throw new ApiError(404, 'Subject not found in your school');

    if (params.teacherId) {
      const teacher = await prisma.user.findFirst({
        where: { id: params.teacherId, schoolId },
      });
      if (!teacher) {
        throw new ApiError(404, 'Assigned teacher not found in your school');
      }
    }
  }

  /**
   * Create Timetable Slot with Triple Clash Verification
   */
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
    // 1. Validate complete ownership hierarchy
    await this.validateHierarchy(schoolId, {
      academicSessionId: data.academicSessionId,
      classId: data.classId,
      sectionId: data.sectionId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
    });

    if (data.startTime >= data.endTime) {
      throw new ApiError(400, 'Start time must be strictly before end time');
    }

    // 2. Clash Check #1: Section cannot have two periods assigned at the same period number on the same day
    const sectionConflict = await TimetableRepository.findSectionSlotConflict(schoolId, {
      academicSessionId: data.academicSessionId,
      sectionId: data.sectionId,
      dayOfWeek: data.dayOfWeek,
      periodNumber: data.periodNumber,
    });

    if (sectionConflict) {
      throw new ApiError(
        409,
        `Section already has Period ${data.periodNumber} scheduled on ${data.dayOfWeek}`
      );
    }

    // 3. Clash Check #2: Teacher cannot be scheduled in two classes simultaneously
    if (data.teacherId) {
      const teacherConflict = await TimetableRepository.findTeacherConflict(schoolId, {
        academicSessionId: data.academicSessionId,
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      });

      if (teacherConflict) {
        throw new ApiError(
          409,
          `Teacher conflict detected! Teacher is already scheduled for ${teacherConflict.subject?.name} (${teacherConflict.class?.name}-${teacherConflict.section?.name}) on ${data.dayOfWeek} from ${teacherConflict.startTime} to ${teacherConflict.endTime}`
        );
      }
    }

    // 4. Clash Check #3: Room cannot be occupied by two classes simultaneously
    if (data.roomNumber && data.roomNumber.trim()) {
      const roomConflict = await TimetableRepository.findRoomConflict(schoolId, {
        academicSessionId: data.academicSessionId,
        roomNumber: data.roomNumber.trim(),
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      });

      if (roomConflict) {
        throw new ApiError(
          409,
          `Room conflict! Room ${data.roomNumber} is already occupied on ${data.dayOfWeek} by ${roomConflict.class?.name}-${roomConflict.section?.name} from ${roomConflict.startTime} to ${roomConflict.endTime}`
        );
      }
    }

    return TimetableRepository.createSlot(schoolId, data);
  }

  /**
   * Update Timetable Slot with Clash Verification
   */
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
    const existingSlot = await TimetableRepository.findSlotById(schoolId, id);
    if (!existingSlot) {
      throw new ApiError(404, 'Timetable slot not found in your school');
    }

    const effectiveTeacherId = data.teacherId !== undefined ? data.teacherId : existingSlot.teacherId;
    const effectiveStartTime = data.startTime || existingSlot.startTime;
    const effectiveEndTime = data.endTime || existingSlot.endTime;
    const effectiveRoom = data.roomNumber !== undefined ? data.roomNumber : existingSlot.roomNumber;

    if (effectiveStartTime >= effectiveEndTime) {
      throw new ApiError(400, 'Start time must be strictly before end time');
    }

    // Teacher clash check
    if (effectiveTeacherId) {
      const teacherConflict = await TimetableRepository.findTeacherConflict(schoolId, {
        academicSessionId: existingSlot.academicSessionId,
        teacherId: effectiveTeacherId,
        dayOfWeek: existingSlot.dayOfWeek,
        startTime: effectiveStartTime,
        endTime: effectiveEndTime,
        excludeSlotId: id,
      });

      if (teacherConflict) {
        throw new ApiError(
          409,
          `Teacher conflict detected! Teacher is already scheduled on ${existingSlot.dayOfWeek} from ${teacherConflict.startTime} to ${teacherConflict.endTime}`
        );
      }
    }

    // Room clash check
    if (effectiveRoom && effectiveRoom.trim()) {
      const roomConflict = await TimetableRepository.findRoomConflict(schoolId, {
        academicSessionId: existingSlot.academicSessionId,
        roomNumber: effectiveRoom.trim(),
        dayOfWeek: existingSlot.dayOfWeek,
        startTime: effectiveStartTime,
        endTime: effectiveEndTime,
        excludeSlotId: id,
      });

      if (roomConflict) {
        throw new ApiError(
          409,
          `Room conflict! Room ${effectiveRoom} is already occupied on ${existingSlot.dayOfWeek} from ${roomConflict.startTime} to ${roomConflict.endTime}`
        );
      }
    }

    return TimetableRepository.updateSlot(schoolId, id, data);
  }

  static async deleteSlot(schoolId: string, id: string) {
    const existing = await TimetableRepository.findSlotById(schoolId, id);
    if (!existing) {
      throw new ApiError(404, 'Timetable slot not found in your school');
    }
    return TimetableRepository.deleteSlot(schoolId, id);
  }

  static async getSectionTimetable(
    schoolId: string,
    sectionId: string,
    academicSessionId?: string,
    dayOfWeek?: DayOfWeek
  ) {
    return TimetableRepository.getSectionTimetable(schoolId, {
      sectionId,
      academicSessionId,
      dayOfWeek,
    });
  }

  static async getTeacherTimetable(
    schoolId: string,
    teacherId: string,
    academicSessionId?: string,
    dayOfWeek?: DayOfWeek
  ) {
    return TimetableRepository.getTeacherTimetable(schoolId, teacherId, academicSessionId, dayOfWeek);
  }
}
