import { ExamRepository } from '../repositories/exam.repository';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { AttendanceRepository } from '../repositories/attendance.repository';

export class ExamService {
  private static parseDate(dateStr: string): Date {
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      throw new ApiError(400, 'Invalid date format. Expected YYYY-MM-DD');
    }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  // ==========================================
  // 1. EXAM TERMS
  // ==========================================

  static async getExamTerms(schoolId: string, academicSessionId?: string) {
    return ExamRepository.findExamTerms(schoolId, academicSessionId);
  }

  static async getExamTermById(schoolId: string, id: string) {
    const term = await ExamRepository.findExamTermById(schoolId, id);
    if (!term) throw new ApiError(404, 'Exam term not found in your school');
    return term;
  }

  static async createExamTerm(
    schoolId: string,
    data: {
      academicSessionId: string;
      name: string;
      code: string;
      startDate: string;
      endDate: string;
      description?: string;
    }
  ) {
    const session = await prisma.academicSession.findFirst({
      where: { id: data.academicSessionId, schoolId },
    });
    if (!session) throw new ApiError(404, 'Academic session not found in your school');

    const existing = await ExamRepository.findExamTermByCode(
      schoolId,
      data.academicSessionId,
      data.code.toUpperCase()
    );
    if (existing) {
      throw new ApiError(409, `Exam term with code '${data.code}' already exists in this session`);
    }

    const startDate = this.parseDate(data.startDate);
    const endDate = this.parseDate(data.endDate);

    if (startDate > endDate) {
      throw new ApiError(400, 'Start date cannot be after end date');
    }

    return ExamRepository.createExamTerm(schoolId, {
      academicSessionId: data.academicSessionId,
      name: data.name,
      code: data.code.toUpperCase(),
      startDate,
      endDate,
      description: data.description,
    });
  }

  static async updateExamTerm(
    schoolId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
      isPublished?: boolean;
    }
  ) {
    const existing = await this.getExamTermById(schoolId, id);

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicate = await ExamRepository.findExamTermByCode(
        schoolId,
        existing.academicSessionId,
        data.code.toUpperCase()
      );
      if (duplicate && duplicate.id !== id) {
        throw new ApiError(409, `Exam term code '${data.code}' is already used`);
      }
    }

    const updatePayload: any = {};
    if (data.name) updatePayload.name = data.name;
    if (data.code) updatePayload.code = data.code.toUpperCase();
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.isPublished !== undefined) updatePayload.isPublished = data.isPublished;
    if (data.startDate) updatePayload.startDate = this.parseDate(data.startDate);
    if (data.endDate) updatePayload.endDate = this.parseDate(data.endDate);

    return ExamRepository.updateExamTerm(schoolId, id, updatePayload);
  }

  static async deleteExamTerm(schoolId: string, id: string) {
    await this.getExamTermById(schoolId, id);
    return ExamRepository.deleteExamTerm(schoolId, id);
  }

  // ==========================================
  // 2. GRADING SCALES
  // ==========================================

  static async getGradingScales(schoolId: string) {
    return ExamRepository.findGradingScales(schoolId);
  }

  static async getGradingScaleById(schoolId: string, id: string) {
    const scale = await ExamRepository.findGradingScaleById(schoolId, id);
    if (!scale) throw new ApiError(404, 'Grading scale not found in your school');
    return scale;
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
    return ExamRepository.createGradingScale(schoolId, data);
  }

  /**
   * Helper to derive Grade from percentage
   */
  static calculateGrade(percentage: number, rules: any[] = []): { grade: string; isPassing: boolean } {
    if (!rules || rules.length === 0) {
      if (percentage >= 90) return { grade: 'A1', isPassing: true };
      if (percentage >= 80) return { grade: 'A2', isPassing: true };
      if (percentage >= 70) return { grade: 'B1', isPassing: true };
      if (percentage >= 60) return { grade: 'B2', isPassing: true };
      if (percentage >= 50) return { grade: 'C1', isPassing: true };
      if (percentage >= 40) return { grade: 'C2', isPassing: true };
      if (percentage >= 33) return { grade: 'D', isPassing: true };
      return { grade: 'E', isPassing: false };
    }

    for (const rule of rules) {
      const min = Number(rule.minPercentage);
      const max = Number(rule.maxPercentage);
      if (percentage >= min && percentage <= max) {
        return {
          grade: rule.grade,
          isPassing: rule.isPassing ?? true,
        };
      }
    }

    return { grade: 'E', isPassing: false };
  }

  // ==========================================
  // 3. EXAM SCHEDULES
  // ==========================================

  static async getExamSchedules(
    schoolId: string,
    params: {
      examTermId?: string;
      classId?: string;
      subjectId?: string;
    }
  ) {
    return ExamRepository.findExamSchedules(schoolId, params);
  }

  static async getExamScheduleById(schoolId: string, id: string) {
    const schedule = await ExamRepository.findExamScheduleById(schoolId, id);
    if (!schedule) throw new ApiError(404, 'Exam schedule paper not found in your school');
    return schedule;
  }

  static async createExamSchedule(
    schoolId: string,
    data: {
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
    }
  ) {
    const [term, cls, sub] = await Promise.all([
      prisma.examTerm.findFirst({ where: { id: data.examTermId, schoolId } }),
      prisma.class.findFirst({ where: { id: data.classId, schoolId } }),
      prisma.subject.findFirst({ where: { id: data.subjectId, schoolId } }),
    ]);

    if (!term) throw new ApiError(404, 'Exam term not found in your school');
    if (!cls) throw new ApiError(404, 'Class not found in your school');
    if (!sub) throw new ApiError(404, 'Subject not found in your school');

    if (data.passMarks > data.maxMarks) {
      throw new ApiError(400, 'Passing marks cannot exceed maximum marks');
    }

    const duplicate = await ExamRepository.findExamScheduleDuplicate(
      schoolId,
      data.examTermId,
      data.classId,
      data.subjectId
    );
    if (duplicate) {
      throw new ApiError(409, 'This subject examination is already scheduled for this class in this term');
    }

    const examDate = this.parseDate(data.examDate);

    return ExamRepository.createExamSchedule(schoolId, {
      examTermId: data.examTermId,
      classId: data.classId,
      subjectId: data.subjectId,
      gradingScaleId: data.gradingScaleId,
      examDate,
      startTime: data.startTime,
      endTime: data.endTime,
      maxMarks: data.maxMarks,
      passMarks: data.passMarks,
      roomNumber: data.roomNumber,
    });
  }

  static async updateExamSchedule(
    schoolId: string,
    id: string,
    data: {
      examDate?: string;
      startTime?: string;
      endTime?: string;
      maxMarks?: number;
      passMarks?: number;
      roomNumber?: string | null;
      gradingScaleId?: string | null;
    }
  ) {
    await this.getExamScheduleById(schoolId, id);

    const updatePayload: any = {};
    if (data.examDate) updatePayload.examDate = this.parseDate(data.examDate);
    if (data.startTime) updatePayload.startTime = data.startTime;
    if (data.endTime) updatePayload.endTime = data.endTime;
    if (data.maxMarks !== undefined) updatePayload.maxMarks = data.maxMarks;
    if (data.passMarks !== undefined) updatePayload.passMarks = data.passMarks;
    if (data.roomNumber !== undefined) updatePayload.roomNumber = data.roomNumber;
    if (data.gradingScaleId !== undefined) updatePayload.gradingScaleId = data.gradingScaleId;

    return ExamRepository.updateExamSchedule(schoolId, id, updatePayload);
  }

  static async deleteExamSchedule(schoolId: string, id: string) {
    await this.getExamScheduleById(schoolId, id);
    return ExamRepository.deleteExamSchedule(schoolId, id);
  }

  // ==========================================
  // 4. MARKS ENTRY & EVALUATION
  // ==========================================

  static async getScheduleMarks(schoolId: string, examScheduleId: string) {
    await this.getExamScheduleById(schoolId, examScheduleId);
    return ExamRepository.findMarksBySchedule(schoolId, examScheduleId);
  }

  static async enterMarks(
    schoolId: string,
    examScheduleId: string,
    enteredById: string | undefined,
    marks: {
      studentId: string;
      marksObtained?: number | null;
      isAbsent?: boolean;
      isExempt?: boolean;
      remarks?: string;
    }[]
  ) {
    const schedule = await this.getExamScheduleById(schoolId, examScheduleId);
    const maxMarks = Number(schedule.maxMarks);

    // Get grading scale rules if scale assigned
    let scaleRules: any[] = [];
    if (schedule.gradingScaleId) {
      const scale = await ExamRepository.findGradingScaleById(schoolId, schedule.gradingScaleId);
      if (scale) scaleRules = scale.rules;
    }

    const processedMarks = marks.map((m) => {
      if (m.isAbsent || m.isExempt) {
        return {
          studentId: m.studentId,
          marksObtained: null,
          isAbsent: m.isAbsent ?? false,
          isExempt: m.isExempt ?? false,
          grade: m.isAbsent ? 'AB' : 'EX',
          remarks: m.remarks,
        };
      }

      if (m.marksObtained !== undefined && m.marksObtained !== null) {
        if (m.marksObtained > maxMarks) {
          throw new ApiError(
            400,
            `Marks obtained (${m.marksObtained}) cannot exceed paper maximum marks (${maxMarks})`
          );
        }
        if (m.marksObtained < 0) {
          throw new ApiError(400, 'Marks obtained cannot be negative');
        }

        const percentage = (m.marksObtained / maxMarks) * 100;
        const gradeInfo = this.calculateGrade(percentage, scaleRules);

        return {
          studentId: m.studentId,
          marksObtained: m.marksObtained,
          isAbsent: false,
          isExempt: false,
          grade: gradeInfo.grade,
          remarks: m.remarks,
        };
      }

      return {
        studentId: m.studentId,
        marksObtained: null,
        isAbsent: false,
        isExempt: false,
        grade: undefined,
        remarks: m.remarks,
      };
    });

    const results = await ExamRepository.bulkUpsertMarks(
      schoolId,
      examScheduleId,
      enteredById,
      processedMarks
    );

    return {
      examScheduleId,
      totalEntered: results.length,
      marks: results,
    };
  }

  // ==========================================
  // 5. PROGRESS REPORT CARD GENERATION
  // ==========================================

  static async generateStudentReportCard(
    schoolId: string,
    studentId: string,
    examTermId: string
  ) {
    const [student, term] = await Promise.all([
      prisma.student.findFirst({
        where: { id: studentId, schoolId },
        include: {
          class: true,
          section: true,
          session: true,
          parents: { include: { parent: true } },
        },
      }),
      prisma.examTerm.findFirst({
        where: { id: examTermId, schoolId },
      }),
    ]);

    if (!student) throw new ApiError(404, 'Student not found in your school');
    if (!term) throw new ApiError(404, 'Exam term not found in your school');

    // Get all exam marks for this student in this term
    const marksRecords = await ExamRepository.getStudentTermMarks(schoolId, studentId, examTermId);

    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;
    let totalSubjectsPassed = 0;
    let totalSubjectsFailed = 0;

    const subjectsSummary = marksRecords.map((rec) => {
      const schedule = rec.examSchedule;
      const max = Number(schedule.maxMarks);
      const pass = Number(schedule.passMarks);
      const obtained = rec.marksObtained !== null ? Number(rec.marksObtained) : null;

      totalMaxMarks += max;
      if (obtained !== null) {
        totalObtainedMarks += obtained;
      }

      const isPassing =
        obtained !== null && !rec.isAbsent ? obtained >= pass : false;

      if (!rec.isExempt) {
        if (isPassing) totalSubjectsPassed++;
        else totalSubjectsFailed++;
      }

      const percentage = obtained !== null ? Math.round((obtained / max) * 1000) / 10 : 0;

      return {
        subjectId: schedule.subjectId,
        subjectName: schedule.subject.name,
        subjectCode: schedule.subject.code,
        subjectType: schedule.subject.type,
        maxMarks: max,
        passMarks: pass,
        marksObtained: obtained,
        isAbsent: rec.isAbsent,
        isExempt: rec.isExempt,
        grade: rec.grade,
        percentage,
        isPassing,
        remarks: rec.remarks,
      };
    });

    const overallPercentage =
      totalMaxMarks > 0
        ? Math.round((totalObtainedMarks / totalMaxMarks) * 1000) / 10
        : 0;

    const overallGrade = this.calculateGrade(overallPercentage);
    const finalResult =
      totalSubjectsFailed === 0
        ? 'PASSED'
        : totalSubjectsFailed === 1
        ? 'COMPARTMENT'
        : 'FAILED';

    // Phase 4 Integration: Include student term attendance summary
    const attendanceStats = await AttendanceRepository.getStudentAttendanceStats(
      schoolId,
      studentId,
      student.academicSessionId
    );

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        studentCode: student.studentCode,
        rollNumber: student.rollNumber,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        class: student.class,
        section: student.section,
        session: student.session,
        parents: student.parents,
      },
      term: {
        id: term.id,
        name: term.name,
        code: term.code,
        startDate: term.startDate,
        endDate: term.endDate,
        isPublished: term.isPublished,
      },
      subjects: subjectsSummary,
      summary: {
        totalSubjects: subjectsSummary.length,
        totalMaxMarks,
        totalObtainedMarks,
        overallPercentage,
        overallGrade: overallGrade.grade,
        finalResult,
        subjectsPassed: totalSubjectsPassed,
        subjectsFailed: totalSubjectsFailed,
      },
      attendance: attendanceStats,
    };
  }
}
