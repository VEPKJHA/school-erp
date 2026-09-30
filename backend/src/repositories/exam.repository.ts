import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export class ExamRepository {
  // ==========================================
  // 1. EXAM TERMS
  // ==========================================

  static async findExamTerms(schoolId: string, academicSessionId?: string) {
    const where: any = { schoolId };
    if (academicSessionId) where.academicSessionId = academicSessionId;

    return prisma.examTerm.findMany({
      where,
      include: {
        session: { select: { id: true, name: true, isCurrent: true } },
        _count: { select: { schedules: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  static async findExamTermById(schoolId: string, id: string) {
    return prisma.examTerm.findFirst({
      where: { id, schoolId },
      include: {
        session: { select: { id: true, name: true } },
        schedules: {
          include: {
            class: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  static async findExamTermByCode(schoolId: string, academicSessionId: string, code: string) {
    return prisma.examTerm.findFirst({
      where: { schoolId, academicSessionId, code },
    });
  }

  static async createExamTerm(
    schoolId: string,
    data: {
      academicSessionId: string;
      name: string;
      code: string;
      startDate: Date;
      endDate: Date;
      description?: string;
    }
  ) {
    return prisma.examTerm.create({
      data: {
        schoolId,
        academicSessionId: data.academicSessionId,
        name: data.name,
        code: data.code,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
      },
      include: {
        session: { select: { id: true, name: true } },
      },
    });
  }

  static async updateExamTerm(
    schoolId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      startDate?: Date;
      endDate?: Date;
      description?: string;
      isPublished?: boolean;
    }
  ) {
    return prisma.examTerm.update({
      where: { id },
      data,
    });
  }

  static async deleteExamTerm(schoolId: string, id: string) {
    return prisma.examTerm.delete({
      where: { id },
    });
  }

  // ==========================================
  // 2. GRADING SCALES
  // ==========================================

  static async findGradingScales(schoolId: string) {
    return prisma.gradingScale.findMany({
      where: { schoolId },
      include: {
        rules: {
          orderBy: { minPercentage: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async findGradingScaleById(schoolId: string, id: string) {
    return prisma.gradingScale.findFirst({
      where: { id, schoolId },
      include: {
        rules: {
          orderBy: { minPercentage: 'desc' },
        },
      },
    });
  }

  static async createGradingScale(
    schoolId: string,
    data: {
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
    }
  ) {
    return prisma.gradingScale.create({
      data: {
        schoolId,
        name: data.name,
        description: data.description,
        rules: {
          create: data.rules.map((r) => ({
            grade: r.grade,
            minPercentage: new Prisma.Decimal(r.minPercentage),
            maxPercentage: new Prisma.Decimal(r.maxPercentage),
            gradePoint: r.gradePoint ? new Prisma.Decimal(r.gradePoint) : null,
            description: r.description,
            isPassing: r.isPassing ?? true,
          })),
        },
      },
      include: {
        rules: {
          orderBy: { minPercentage: 'desc' },
        },
      },
    });
  }

  // ==========================================
  // 3. EXAM SCHEDULES
  // ==========================================

  static async findExamSchedules(
    schoolId: string,
    params: {
      examTermId?: string;
      classId?: string;
      subjectId?: string;
    }
  ) {
    const where: any = { schoolId };
    if (params.examTermId) where.examTermId = params.examTermId;
    if (params.classId) where.classId = params.classId;
    if (params.subjectId) where.subjectId = params.subjectId;

    return prisma.examSchedule.findMany({
      where,
      include: {
        examTerm: { select: { id: true, name: true, code: true, isPublished: true } },
        class: { select: { id: true, name: true, code: true } },
        subject: { select: { id: true, name: true, code: true, type: true } },
        gradingScale: {
          include: {
            rules: { orderBy: { minPercentage: 'desc' } },
          },
        },
        _count: { select: { marks: true } },
      },
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });
  }

  static async findExamScheduleById(schoolId: string, id: string) {
    return prisma.examSchedule.findFirst({
      where: { id, schoolId },
      include: {
        examTerm: true,
        class: true,
        subject: true,
        gradingScale: {
          include: {
            rules: { orderBy: { minPercentage: 'desc' } },
          },
        },
      },
    });
  }

  static async findExamScheduleDuplicate(
    schoolId: string,
    examTermId: string,
    classId: string,
    subjectId: string,
    excludeId?: string
  ) {
    const where: any = {
      schoolId,
      examTermId,
      classId,
      subjectId,
    };
    if (excludeId) where.id = { not: excludeId };

    return prisma.examSchedule.findFirst({ where });
  }

  static async createExamSchedule(
    schoolId: string,
    data: {
      examTermId: string;
      classId: string;
      subjectId: string;
      gradingScaleId?: string | null;
      examDate: Date;
      startTime: string;
      endTime: string;
      maxMarks: number;
      passMarks: number;
      roomNumber?: string | null;
    }
  ) {
    return prisma.examSchedule.create({
      data: {
        schoolId,
        examTermId: data.examTermId,
        classId: data.classId,
        subjectId: data.subjectId,
        gradingScaleId: data.gradingScaleId || null,
        examDate: data.examDate,
        startTime: data.startTime,
        endTime: data.endTime,
        maxMarks: new Prisma.Decimal(data.maxMarks),
        passMarks: new Prisma.Decimal(data.passMarks),
        roomNumber: data.roomNumber || null,
      },
      include: {
        examTerm: true,
        class: true,
        subject: true,
      },
    });
  }

  static async updateExamSchedule(
    schoolId: string,
    id: string,
    data: {
      examDate?: Date;
      startTime?: string;
      endTime?: string;
      maxMarks?: number;
      passMarks?: number;
      roomNumber?: string | null;
      gradingScaleId?: string | null;
    }
  ) {
    const updateData: any = {};
    if (data.examDate) updateData.examDate = data.examDate;
    if (data.startTime) updateData.startTime = data.startTime;
    if (data.endTime) updateData.endTime = data.endTime;
    if (data.maxMarks !== undefined) updateData.maxMarks = new Prisma.Decimal(data.maxMarks);
    if (data.passMarks !== undefined) updateData.passMarks = new Prisma.Decimal(data.passMarks);
    if (data.roomNumber !== undefined) updateData.roomNumber = data.roomNumber;
    if (data.gradingScaleId !== undefined) updateData.gradingScaleId = data.gradingScaleId;

    return prisma.examSchedule.update({
      where: { id },
      data: updateData,
      include: {
        examTerm: true,
        class: true,
        subject: true,
      },
    });
  }

  static async deleteExamSchedule(schoolId: string, id: string) {
    return prisma.examSchedule.delete({
      where: { id },
    });
  }

  // ==========================================
  // 4. EXAM MARKS
  // ==========================================

  static async findMarksBySchedule(schoolId: string, examScheduleId: string) {
    return prisma.examMark.findMany({
      where: { schoolId, examScheduleId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            studentCode: true,
            rollNumber: true,
            section: { select: { id: true, name: true } },
          },
        },
        enteredBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ student: { rollNumber: 'asc' } }, { student: { firstName: 'asc' } }],
    });
  }

  static async bulkUpsertMarks(
    schoolId: string,
    examScheduleId: string,
    enteredById: string | undefined,
    marks: {
      studentId: string;
      marksObtained?: number | null;
      isAbsent?: boolean;
      isExempt?: boolean;
      grade?: string;
      remarks?: string;
    }[]
  ) {
    return prisma.$transaction(async (tx: any) => {
      const results = [];
      for (const m of marks) {
        const item = await tx.examMark.upsert({
          where: {
            schoolId_examScheduleId_studentId: {
              schoolId,
              examScheduleId,
              studentId: m.studentId,
            },
          },
          update: {
            marksObtained:
              m.marksObtained !== undefined && m.marksObtained !== null
                ? new Prisma.Decimal(m.marksObtained)
                : null,
            isAbsent: m.isAbsent ?? false,
            isExempt: m.isExempt ?? false,
            grade: m.grade || null,
            remarks: m.remarks || null,
            enteredById: enteredById || null,
          },
          create: {
            schoolId,
            examScheduleId,
            studentId: m.studentId,
            marksObtained:
              m.marksObtained !== undefined && m.marksObtained !== null
                ? new Prisma.Decimal(m.marksObtained)
                : null,
            isAbsent: m.isAbsent ?? false,
            isExempt: m.isExempt ?? false,
            grade: m.grade || null,
            remarks: m.remarks || null,
            enteredById: enteredById || null,
          },
        });
        results.push(item);
      }
      return results;
    });
  }

  static async getStudentTermMarks(schoolId: string, studentId: string, examTermId: string) {
    return prisma.examMark.findMany({
      where: {
        schoolId,
        studentId,
        examSchedule: { examTermId },
      },
      include: {
        examSchedule: {
          include: {
            subject: true,
            gradingScale: {
              include: {
                rules: { orderBy: { minPercentage: 'desc' } },
              },
            },
          },
        },
      },
      orderBy: { examSchedule: { examDate: 'asc' } },
    });
  }
}
