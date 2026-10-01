"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamRepository = void 0;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
class ExamRepository {
    // ==========================================
    // 1. EXAM TERMS
    // ==========================================
    static async findExamTerms(schoolId, academicSessionId) {
        const where = { schoolId };
        if (academicSessionId)
            where.academicSessionId = academicSessionId;
        return prisma_1.prisma.examTerm.findMany({
            where,
            include: {
                session: { select: { id: true, name: true, isCurrent: true } },
                _count: { select: { schedules: true } },
            },
            orderBy: { startDate: 'asc' },
        });
    }
    static async findExamTermById(schoolId, id) {
        return prisma_1.prisma.examTerm.findFirst({
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
    static async findExamTermByCode(schoolId, academicSessionId, code) {
        return prisma_1.prisma.examTerm.findFirst({
            where: { schoolId, academicSessionId, code },
        });
    }
    static async createExamTerm(schoolId, data) {
        return prisma_1.prisma.examTerm.create({
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
    static async updateExamTerm(schoolId, id, data) {
        return prisma_1.prisma.examTerm.update({
            where: { id },
            data,
        });
    }
    static async deleteExamTerm(schoolId, id) {
        return prisma_1.prisma.examTerm.delete({
            where: { id },
        });
    }
    // ==========================================
    // 2. GRADING SCALES
    // ==========================================
    static async findGradingScales(schoolId) {
        return prisma_1.prisma.gradingScale.findMany({
            where: { schoolId },
            include: {
                rules: {
                    orderBy: { minPercentage: 'desc' },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    static async findGradingScaleById(schoolId, id) {
        return prisma_1.prisma.gradingScale.findFirst({
            where: { id, schoolId },
            include: {
                rules: {
                    orderBy: { minPercentage: 'desc' },
                },
            },
        });
    }
    static async createGradingScale(schoolId, data) {
        return prisma_1.prisma.gradingScale.create({
            data: {
                schoolId,
                name: data.name,
                description: data.description,
                rules: {
                    create: data.rules.map((r) => ({
                        grade: r.grade,
                        minPercentage: new client_1.Prisma.Decimal(r.minPercentage),
                        maxPercentage: new client_1.Prisma.Decimal(r.maxPercentage),
                        gradePoint: r.gradePoint ? new client_1.Prisma.Decimal(r.gradePoint) : null,
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
    static async findExamSchedules(schoolId, params) {
        const where = { schoolId };
        if (params.examTermId)
            where.examTermId = params.examTermId;
        if (params.classId)
            where.classId = params.classId;
        if (params.subjectId)
            where.subjectId = params.subjectId;
        return prisma_1.prisma.examSchedule.findMany({
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
    static async findExamScheduleById(schoolId, id) {
        return prisma_1.prisma.examSchedule.findFirst({
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
    static async findExamScheduleDuplicate(schoolId, examTermId, classId, subjectId, excludeId) {
        const where = {
            schoolId,
            examTermId,
            classId,
            subjectId,
        };
        if (excludeId)
            where.id = { not: excludeId };
        return prisma_1.prisma.examSchedule.findFirst({ where });
    }
    static async createExamSchedule(schoolId, data) {
        return prisma_1.prisma.examSchedule.create({
            data: {
                schoolId,
                examTermId: data.examTermId,
                classId: data.classId,
                subjectId: data.subjectId,
                gradingScaleId: data.gradingScaleId || null,
                examDate: data.examDate,
                startTime: data.startTime,
                endTime: data.endTime,
                maxMarks: new client_1.Prisma.Decimal(data.maxMarks),
                passMarks: new client_1.Prisma.Decimal(data.passMarks),
                roomNumber: data.roomNumber || null,
            },
            include: {
                examTerm: true,
                class: true,
                subject: true,
            },
        });
    }
    static async updateExamSchedule(schoolId, id, data) {
        const updateData = {};
        if (data.examDate)
            updateData.examDate = data.examDate;
        if (data.startTime)
            updateData.startTime = data.startTime;
        if (data.endTime)
            updateData.endTime = data.endTime;
        if (data.maxMarks !== undefined)
            updateData.maxMarks = new client_1.Prisma.Decimal(data.maxMarks);
        if (data.passMarks !== undefined)
            updateData.passMarks = new client_1.Prisma.Decimal(data.passMarks);
        if (data.roomNumber !== undefined)
            updateData.roomNumber = data.roomNumber;
        if (data.gradingScaleId !== undefined)
            updateData.gradingScaleId = data.gradingScaleId;
        return prisma_1.prisma.examSchedule.update({
            where: { id },
            data: updateData,
            include: {
                examTerm: true,
                class: true,
                subject: true,
            },
        });
    }
    static async deleteExamSchedule(schoolId, id) {
        return prisma_1.prisma.examSchedule.delete({
            where: { id },
        });
    }
    // ==========================================
    // 4. EXAM MARKS
    // ==========================================
    static async findMarksBySchedule(schoolId, examScheduleId) {
        return prisma_1.prisma.examMark.findMany({
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
    static async bulkUpsertMarks(schoolId, examScheduleId, enteredById, marks) {
        return prisma_1.prisma.$transaction(async (tx) => {
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
                        marksObtained: m.marksObtained !== undefined && m.marksObtained !== null
                            ? new client_1.Prisma.Decimal(m.marksObtained)
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
                        marksObtained: m.marksObtained !== undefined && m.marksObtained !== null
                            ? new client_1.Prisma.Decimal(m.marksObtained)
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
    static async getStudentTermMarks(schoolId, studentId, examTermId) {
        return prisma_1.prisma.examMark.findMany({
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
exports.ExamRepository = ExamRepository;
//# sourceMappingURL=exam.repository.js.map