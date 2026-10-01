"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamService = void 0;
const exam_repository_1 = require("../repositories/exam.repository");
const prisma_1 = require("../config/prisma");
const ApiError_1 = require("../utils/ApiError");
const attendance_repository_1 = require("../repositories/attendance.repository");
class ExamService {
    static parseDate(dateStr) {
        const parts = dateStr.split('-');
        if (parts.length !== 3) {
            throw new ApiError_1.ApiError(400, 'Invalid date format. Expected YYYY-MM-DD');
        }
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
    // ==========================================
    // 1. EXAM TERMS
    // ==========================================
    static async getExamTerms(schoolId, academicSessionId) {
        return exam_repository_1.ExamRepository.findExamTerms(schoolId, academicSessionId);
    }
    static async getExamTermById(schoolId, id) {
        const term = await exam_repository_1.ExamRepository.findExamTermById(schoolId, id);
        if (!term)
            throw new ApiError_1.ApiError(404, 'Exam term not found in your school');
        return term;
    }
    static async createExamTerm(schoolId, data) {
        const session = await prisma_1.prisma.academicSession.findFirst({
            where: { id: data.academicSessionId, schoolId },
        });
        if (!session)
            throw new ApiError_1.ApiError(404, 'Academic session not found in your school');
        const existing = await exam_repository_1.ExamRepository.findExamTermByCode(schoolId, data.academicSessionId, data.code.toUpperCase());
        if (existing) {
            throw new ApiError_1.ApiError(409, `Exam term with code '${data.code}' already exists in this session`);
        }
        const startDate = this.parseDate(data.startDate);
        const endDate = this.parseDate(data.endDate);
        if (startDate > endDate) {
            throw new ApiError_1.ApiError(400, 'Start date cannot be after end date');
        }
        return exam_repository_1.ExamRepository.createExamTerm(schoolId, {
            academicSessionId: data.academicSessionId,
            name: data.name,
            code: data.code.toUpperCase(),
            startDate,
            endDate,
            description: data.description,
        });
    }
    static async updateExamTerm(schoolId, id, data) {
        const existing = await this.getExamTermById(schoolId, id);
        if (data.code && data.code.toUpperCase() !== existing.code) {
            const duplicate = await exam_repository_1.ExamRepository.findExamTermByCode(schoolId, existing.academicSessionId, data.code.toUpperCase());
            if (duplicate && duplicate.id !== id) {
                throw new ApiError_1.ApiError(409, `Exam term code '${data.code}' is already used`);
            }
        }
        const updatePayload = {};
        if (data.name)
            updatePayload.name = data.name;
        if (data.code)
            updatePayload.code = data.code.toUpperCase();
        if (data.description !== undefined)
            updatePayload.description = data.description;
        if (data.isPublished !== undefined)
            updatePayload.isPublished = data.isPublished;
        if (data.startDate)
            updatePayload.startDate = this.parseDate(data.startDate);
        if (data.endDate)
            updatePayload.endDate = this.parseDate(data.endDate);
        return exam_repository_1.ExamRepository.updateExamTerm(schoolId, id, updatePayload);
    }
    static async deleteExamTerm(schoolId, id) {
        await this.getExamTermById(schoolId, id);
        return exam_repository_1.ExamRepository.deleteExamTerm(schoolId, id);
    }
    // ==========================================
    // 2. GRADING SCALES
    // ==========================================
    static async getGradingScales(schoolId) {
        return exam_repository_1.ExamRepository.findGradingScales(schoolId);
    }
    static async getGradingScaleById(schoolId, id) {
        const scale = await exam_repository_1.ExamRepository.findGradingScaleById(schoolId, id);
        if (!scale)
            throw new ApiError_1.ApiError(404, 'Grading scale not found in your school');
        return scale;
    }
    static async createGradingScale(schoolId, data) {
        return exam_repository_1.ExamRepository.createGradingScale(schoolId, data);
    }
    /**
     * Helper to derive Grade from percentage
     */
    static calculateGrade(percentage, rules = []) {
        if (!rules || rules.length === 0) {
            if (percentage >= 90)
                return { grade: 'A1', isPassing: true };
            if (percentage >= 80)
                return { grade: 'A2', isPassing: true };
            if (percentage >= 70)
                return { grade: 'B1', isPassing: true };
            if (percentage >= 60)
                return { grade: 'B2', isPassing: true };
            if (percentage >= 50)
                return { grade: 'C1', isPassing: true };
            if (percentage >= 40)
                return { grade: 'C2', isPassing: true };
            if (percentage >= 33)
                return { grade: 'D', isPassing: true };
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
    static async getExamSchedules(schoolId, params) {
        return exam_repository_1.ExamRepository.findExamSchedules(schoolId, params);
    }
    static async getExamScheduleById(schoolId, id) {
        const schedule = await exam_repository_1.ExamRepository.findExamScheduleById(schoolId, id);
        if (!schedule)
            throw new ApiError_1.ApiError(404, 'Exam schedule paper not found in your school');
        return schedule;
    }
    static async createExamSchedule(schoolId, data) {
        const [term, cls, sub] = await Promise.all([
            prisma_1.prisma.examTerm.findFirst({ where: { id: data.examTermId, schoolId } }),
            prisma_1.prisma.class.findFirst({ where: { id: data.classId, schoolId } }),
            prisma_1.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId } }),
        ]);
        if (!term)
            throw new ApiError_1.ApiError(404, 'Exam term not found in your school');
        if (!cls)
            throw new ApiError_1.ApiError(404, 'Class not found in your school');
        if (!sub)
            throw new ApiError_1.ApiError(404, 'Subject not found in your school');
        if (data.passMarks > data.maxMarks) {
            throw new ApiError_1.ApiError(400, 'Passing marks cannot exceed maximum marks');
        }
        const duplicate = await exam_repository_1.ExamRepository.findExamScheduleDuplicate(schoolId, data.examTermId, data.classId, data.subjectId);
        if (duplicate) {
            throw new ApiError_1.ApiError(409, 'This subject examination is already scheduled for this class in this term');
        }
        const examDate = this.parseDate(data.examDate);
        return exam_repository_1.ExamRepository.createExamSchedule(schoolId, {
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
    static async updateExamSchedule(schoolId, id, data) {
        await this.getExamScheduleById(schoolId, id);
        const updatePayload = {};
        if (data.examDate)
            updatePayload.examDate = this.parseDate(data.examDate);
        if (data.startTime)
            updatePayload.startTime = data.startTime;
        if (data.endTime)
            updatePayload.endTime = data.endTime;
        if (data.maxMarks !== undefined)
            updatePayload.maxMarks = data.maxMarks;
        if (data.passMarks !== undefined)
            updatePayload.passMarks = data.passMarks;
        if (data.roomNumber !== undefined)
            updatePayload.roomNumber = data.roomNumber;
        if (data.gradingScaleId !== undefined)
            updatePayload.gradingScaleId = data.gradingScaleId;
        return exam_repository_1.ExamRepository.updateExamSchedule(schoolId, id, updatePayload);
    }
    static async deleteExamSchedule(schoolId, id) {
        await this.getExamScheduleById(schoolId, id);
        return exam_repository_1.ExamRepository.deleteExamSchedule(schoolId, id);
    }
    // ==========================================
    // 4. MARKS ENTRY & EVALUATION
    // ==========================================
    static async getScheduleMarks(schoolId, examScheduleId) {
        await this.getExamScheduleById(schoolId, examScheduleId);
        return exam_repository_1.ExamRepository.findMarksBySchedule(schoolId, examScheduleId);
    }
    static async enterMarks(schoolId, examScheduleId, enteredById, marks) {
        const schedule = await this.getExamScheduleById(schoolId, examScheduleId);
        const maxMarks = Number(schedule.maxMarks);
        // Get grading scale rules if scale assigned
        let scaleRules = [];
        if (schedule.gradingScaleId) {
            const scale = await exam_repository_1.ExamRepository.findGradingScaleById(schoolId, schedule.gradingScaleId);
            if (scale)
                scaleRules = scale.rules;
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
                    throw new ApiError_1.ApiError(400, `Marks obtained (${m.marksObtained}) cannot exceed paper maximum marks (${maxMarks})`);
                }
                if (m.marksObtained < 0) {
                    throw new ApiError_1.ApiError(400, 'Marks obtained cannot be negative');
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
        const results = await exam_repository_1.ExamRepository.bulkUpsertMarks(schoolId, examScheduleId, enteredById, processedMarks);
        return {
            examScheduleId,
            totalEntered: results.length,
            marks: results,
        };
    }
    // ==========================================
    // 5. PROGRESS REPORT CARD GENERATION
    // ==========================================
    static async generateStudentReportCard(schoolId, studentId, examTermId) {
        const [student, term] = await Promise.all([
            prisma_1.prisma.student.findFirst({
                where: { id: studentId, schoolId },
                include: {
                    class: true,
                    section: true,
                    session: true,
                    parents: { include: { parent: true } },
                },
            }),
            prisma_1.prisma.examTerm.findFirst({
                where: { id: examTermId, schoolId },
            }),
        ]);
        if (!student)
            throw new ApiError_1.ApiError(404, 'Student not found in your school');
        if (!term)
            throw new ApiError_1.ApiError(404, 'Exam term not found in your school');
        // Get all exam marks for this student in this term
        const marksRecords = await exam_repository_1.ExamRepository.getStudentTermMarks(schoolId, studentId, examTermId);
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
            const isPassing = obtained !== null && !rec.isAbsent ? obtained >= pass : false;
            if (!rec.isExempt) {
                if (isPassing)
                    totalSubjectsPassed++;
                else
                    totalSubjectsFailed++;
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
        const overallPercentage = totalMaxMarks > 0
            ? Math.round((totalObtainedMarks / totalMaxMarks) * 1000) / 10
            : 0;
        const overallGrade = this.calculateGrade(overallPercentage);
        const finalResult = totalSubjectsFailed === 0
            ? 'PASSED'
            : totalSubjectsFailed === 1
                ? 'COMPARTMENT'
                : 'FAILED';
        // Phase 4 Integration: Include student term attendance summary
        const attendanceStats = await attendance_repository_1.AttendanceRepository.getStudentAttendanceStats(schoolId, studentId, student.academicSessionId);
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
exports.ExamService = ExamService;
//# sourceMappingURL=exam.service.js.map