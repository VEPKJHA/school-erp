"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableRepository = void 0;
const prisma_1 = require("../config/prisma");
class TimetableRepository {
    // ==========================================
    // SUBJECT REPOSITORY
    // ==========================================
    static async createSubject(schoolId, data) {
        return prisma_1.prisma.subject.create({
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
    static async findSubjects(schoolId, isActive) {
        const where = { schoolId };
        if (isActive !== undefined)
            where.isActive = isActive;
        return prisma_1.prisma.subject.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }
    static async findSubjectById(schoolId, id) {
        return prisma_1.prisma.subject.findFirst({
            where: { id, schoolId },
        });
    }
    static async findSubjectByCode(schoolId, code) {
        return prisma_1.prisma.subject.findFirst({
            where: { schoolId, code },
        });
    }
    static async updateSubject(schoolId, id, data) {
        return prisma_1.prisma.subject.update({
            where: { id },
            data,
        });
    }
    // ==========================================
    // CLASS SUBJECTS
    // ==========================================
    static async assignClassSubject(schoolId, data) {
        return prisma_1.prisma.classSubject.upsert({
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
    static async getClassSubjects(schoolId, classId) {
        return prisma_1.prisma.classSubject.findMany({
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
    static async findSectionSlotConflict(schoolId, params) {
        const where = {
            schoolId,
            academicSessionId: params.academicSessionId,
            sectionId: params.sectionId,
            dayOfWeek: params.dayOfWeek,
            periodNumber: params.periodNumber,
        };
        if (params.excludeSlotId) {
            where.id = { not: params.excludeSlotId };
        }
        return prisma_1.prisma.timetableSlot.findFirst({ where });
    }
    /**
     * Check if teacher is already booked on the same day during overlapping times
     */
    static async findTeacherConflict(schoolId, params) {
        // Conflict exists if existing slot starts before new end and ends after new start
        // i.e. NOT (slot.endTime <= startTime OR slot.startTime >= endTime)
        // => slot.startTime < endTime AND slot.endTime > startTime
        const where = {
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
        return prisma_1.prisma.timetableSlot.findFirst({
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
    static async findRoomConflict(schoolId, params) {
        const where = {
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
        return prisma_1.prisma.timetableSlot.findFirst({
            where,
            include: {
                class: { select: { name: true } },
                section: { select: { name: true } },
            },
        });
    }
    static async createSlot(schoolId, data) {
        return prisma_1.prisma.timetableSlot.create({
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
    static async updateSlot(schoolId, id, data) {
        return prisma_1.prisma.timetableSlot.update({
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
    static async deleteSlot(schoolId, id) {
        return prisma_1.prisma.timetableSlot.delete({
            where: { id },
        });
    }
    static async findSlotById(schoolId, id) {
        return prisma_1.prisma.timetableSlot.findFirst({
            where: { id, schoolId },
            include: {
                subject: true,
                teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                class: { select: { id: true, name: true, code: true } },
                section: { select: { id: true, name: true } },
            },
        });
    }
    static async getSectionTimetable(schoolId, params) {
        const where = {
            schoolId,
            sectionId: params.sectionId,
        };
        if (params.academicSessionId)
            where.academicSessionId = params.academicSessionId;
        if (params.dayOfWeek)
            where.dayOfWeek = params.dayOfWeek;
        return prisma_1.prisma.timetableSlot.findMany({
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
    static async getTeacherTimetable(schoolId, teacherId, academicSessionId, dayOfWeek) {
        const where = {
            schoolId,
            teacherId,
        };
        if (academicSessionId)
            where.academicSessionId = academicSessionId;
        if (dayOfWeek)
            where.dayOfWeek = dayOfWeek;
        return prisma_1.prisma.timetableSlot.findMany({
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
exports.TimetableRepository = TimetableRepository;
//# sourceMappingURL=timetable.repository.js.map