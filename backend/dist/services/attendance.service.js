"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const attendance_repository_1 = require("../repositories/attendance.repository");
const prisma_1 = require("../config/prisma");
const ApiError_1 = require("../utils/ApiError");
class AttendanceService {
    /**
     * Helper to normalize YYYY-MM-DD string to standard UTC midnight Date
     */
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
    /**
     * Verify ownership chain: School -> AcademicSession -> Class -> Section
     */
    static async validateHierarchy(schoolId, params) {
        const [session, classRecord, section] = await Promise.all([
            prisma_1.prisma.academicSession.findFirst({
                where: { id: params.academicSessionId, schoolId },
            }),
            prisma_1.prisma.class.findFirst({
                where: { id: params.classId, schoolId },
            }),
            prisma_1.prisma.section.findFirst({
                where: { id: params.sectionId, classId: params.classId, schoolId },
            }),
        ]);
        if (!session) {
            throw new ApiError_1.ApiError(404, 'Academic session not found or does not belong to your school');
        }
        if (!classRecord) {
            throw new ApiError_1.ApiError(404, 'Class not found or does not belong to your school');
        }
        if (!section) {
            throw new ApiError_1.ApiError(404, 'Section not found or does not belong to this class in your school');
        }
    }
    /**
     * Mark or update attendance for an individual student
     */
    static async markAttendance(schoolId, markedById, data) {
        await this.validateHierarchy(schoolId, {
            academicSessionId: data.academicSessionId,
            classId: data.classId,
            sectionId: data.sectionId,
        });
        // Validate student ownership and enrollment in this section
        const student = await prisma_1.prisma.student.findFirst({
            where: {
                id: data.studentId,
                schoolId,
                classId: data.classId,
                sectionId: data.sectionId,
            },
        });
        if (!student) {
            throw new ApiError_1.ApiError(404, 'Student not found in this class section or does not belong to your school');
        }
        const attendanceDate = this.parseDate(data.date);
        return attendance_repository_1.AttendanceRepository.upsertStudentAttendance(schoolId, {
            studentId: data.studentId,
            classId: data.classId,
            sectionId: data.sectionId,
            academicSessionId: data.academicSessionId,
            date: attendanceDate,
            status: data.status,
            remarks: data.remarks,
            markedById,
        });
    }
    /**
     * Bulk mark attendance for all students in a section on a given date
     */
    static async bulkMarkAttendance(schoolId, markedById, data) {
        await this.validateHierarchy(schoolId, {
            academicSessionId: data.academicSessionId,
            classId: data.classId,
            sectionId: data.sectionId,
        });
        const studentIds = data.records.map((r) => r.studentId);
        // Verify all students belong to this school and section
        const students = await prisma_1.prisma.student.findMany({
            where: {
                id: { in: studentIds },
                schoolId,
                classId: data.classId,
                sectionId: data.sectionId,
            },
            select: { id: true },
        });
        if (students.length !== studentIds.length) {
            throw new ApiError_1.ApiError(400, `One or more students do not belong to this section in your school (found ${students.length} of ${studentIds.length})`);
        }
        const attendanceDate = this.parseDate(data.date);
        const savedRecords = await attendance_repository_1.AttendanceRepository.bulkUpsertAttendance(schoolId, {
            classId: data.classId,
            sectionId: data.sectionId,
            academicSessionId: data.academicSessionId,
            date: attendanceDate,
            markedById,
            records: data.records,
        });
        return {
            date: data.date,
            totalMarked: savedRecords.length,
            records: savedRecords,
        };
    }
    /**
     * Query attendance records
     */
    static async getAttendance(schoolId, filters) {
        return attendance_repository_1.AttendanceRepository.findAttendance(schoolId, {
            date: filters.date ? this.parseDate(filters.date) : undefined,
            startDate: filters.startDate ? this.parseDate(filters.startDate) : undefined,
            endDate: filters.endDate ? this.parseDate(filters.endDate) : undefined,
            classId: filters.classId,
            sectionId: filters.sectionId,
            academicSessionId: filters.academicSessionId,
            studentId: filters.studentId,
            status: filters.status,
        });
    }
    /**
     * Get Daily Summary Statistics
     */
    static async getDailySummary(schoolId, params) {
        const attendanceDate = this.parseDate(params.date);
        return attendance_repository_1.AttendanceRepository.getDailySummary(schoolId, {
            date: attendanceDate,
            classId: params.classId,
            sectionId: params.sectionId,
            academicSessionId: params.academicSessionId,
        });
    }
    /**
     * Get Student Attendance Stats
     */
    static async getStudentStats(schoolId, studentId, academicSessionId) {
        const student = await prisma_1.prisma.student.findFirst({
            where: { id: studentId, schoolId },
        });
        if (!student) {
            throw new ApiError_1.ApiError(404, 'Student not found in your school');
        }
        return attendance_repository_1.AttendanceRepository.getStudentAttendanceStats(schoolId, studentId, academicSessionId);
    }
    /**
     * Get Section Monthly Attendance Register Matrix
     */
    static async getMonthlyRegister(schoolId, params) {
        // Days in specified month
        const daysInMonth = new Date(params.year, params.month, 0).getDate();
        const startDate = new Date(Date.UTC(params.year, params.month - 1, 1));
        const endDate = new Date(Date.UTC(params.year, params.month - 1, daysInMonth));
        // Get all students enrolled in section
        const students = await prisma_1.prisma.student.findMany({
            where: {
                schoolId,
                classId: params.classId,
                sectionId: params.sectionId,
                status: 'ACTIVE',
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNumber: true,
                rollNumber: true,
            },
            orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
        });
        // Get all attendances in date range
        const attendances = await prisma_1.prisma.studentAttendance.findMany({
            where: {
                schoolId,
                classId: params.classId,
                sectionId: params.sectionId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                studentId: true,
                date: true,
                status: true,
            },
        });
        // Map by studentId -> day (1..31) -> status
        const studentAttendanceMap = new Map();
        for (const a of attendances) {
            const day = a.date.getUTCDate();
            if (!studentAttendanceMap.has(a.studentId)) {
                studentAttendanceMap.set(a.studentId, {});
            }
            studentAttendanceMap.get(a.studentId)[day] = a.status;
        }
        const register = students.map((stu) => {
            const days = studentAttendanceMap.get(stu.id) || {};
            let presentCount = 0;
            let absentCount = 0;
            let lateCount = 0;
            let halfDayCount = 0;
            let excusedCount = 0;
            Object.values(days).forEach((st) => {
                if (st === 'PRESENT')
                    presentCount++;
                else if (st === 'ABSENT')
                    absentCount++;
                else if (st === 'LATE')
                    lateCount++;
                else if (st === 'HALF_DAY')
                    halfDayCount++;
                else if (st === 'EXCUSED')
                    excusedCount++;
            });
            const totalMarked = presentCount + absentCount + lateCount + halfDayCount + excusedCount;
            const presentEquivalent = presentCount + lateCount + halfDayCount * 0.5;
            const percentage = totalMarked > 0 ? Math.round((presentEquivalent / totalMarked) * 1000) / 10 : 0;
            return {
                student: stu,
                days,
                summary: {
                    present: presentCount,
                    absent: absentCount,
                    late: lateCount,
                    halfDay: halfDayCount,
                    excused: excusedCount,
                    totalMarked,
                    percentage,
                },
            };
        });
        return {
            year: params.year,
            month: params.month,
            daysInMonth,
            totalStudents: students.length,
            register,
        };
    }
}
exports.AttendanceService = AttendanceService;
//# sourceMappingURL=attendance.service.js.map