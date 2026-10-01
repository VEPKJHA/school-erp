"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRepository = void 0;
const prisma_1 = require("../config/prisma");
class AttendanceRepository {
    /**
     * Upsert single student attendance record
     */
    static async upsertStudentAttendance(schoolId, data) {
        return prisma_1.prisma.studentAttendance.upsert({
            where: {
                schoolId_studentId_date: {
                    schoolId,
                    studentId: data.studentId,
                    date: data.date,
                },
            },
            update: {
                status: data.status,
                remarks: data.remarks,
                markedById: data.markedById,
                classId: data.classId,
                sectionId: data.sectionId,
                academicSessionId: data.academicSessionId,
            },
            create: {
                schoolId,
                studentId: data.studentId,
                classId: data.classId,
                sectionId: data.sectionId,
                academicSessionId: data.academicSessionId,
                date: data.date,
                status: data.status,
                remarks: data.remarks,
                markedById: data.markedById,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        admissionNumber: true,
                        studentCode: true,
                    },
                },
            },
        });
    }
    /**
     * Bulk upsert attendance records for a section within an atomic transaction
     */
    static async bulkUpsertAttendance(schoolId, data) {
        return prisma_1.prisma.$transaction(async (tx) => {
            const results = [];
            for (const rec of data.records) {
                const item = await tx.studentAttendance.upsert({
                    where: {
                        schoolId_studentId_date: {
                            schoolId,
                            studentId: rec.studentId,
                            date: data.date,
                        },
                    },
                    update: {
                        status: rec.status,
                        remarks: rec.remarks,
                        markedById: data.markedById,
                        classId: data.classId,
                        sectionId: data.sectionId,
                        academicSessionId: data.academicSessionId,
                    },
                    create: {
                        schoolId,
                        studentId: rec.studentId,
                        classId: data.classId,
                        sectionId: data.sectionId,
                        academicSessionId: data.academicSessionId,
                        date: data.date,
                        status: rec.status,
                        remarks: rec.remarks,
                        markedById: data.markedById,
                    },
                });
                results.push(item);
            }
            return results;
        });
    }
    /**
     * Find attendance records matching filters
     */
    static async findAttendance(schoolId, filters) {
        const where = { schoolId };
        if (filters.date) {
            where.date = filters.date;
        }
        else if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate)
                where.date.gte = filters.startDate;
            if (filters.endDate)
                where.date.lte = filters.endDate;
        }
        if (filters.classId)
            where.classId = filters.classId;
        if (filters.sectionId)
            where.sectionId = filters.sectionId;
        if (filters.academicSessionId)
            where.academicSessionId = filters.academicSessionId;
        if (filters.studentId)
            where.studentId = filters.studentId;
        if (filters.status)
            where.status = filters.status;
        return prisma_1.prisma.studentAttendance.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        admissionNumber: true,
                        studentCode: true,
                        rollNumber: true,
                    },
                },
                class: { select: { id: true, name: true, code: true } },
                section: { select: { id: true, name: true } },
                markedBy: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: [{ date: 'desc' }, { student: { firstName: 'asc' } }],
        });
    }
    /**
     * Get Daily Summary count by status for school/class/section
     */
    static async getDailySummary(schoolId, params) {
        const where = {
            schoolId,
            date: params.date,
        };
        if (params.classId)
            where.classId = params.classId;
        if (params.sectionId)
            where.sectionId = params.sectionId;
        if (params.academicSessionId)
            where.academicSessionId = params.academicSessionId;
        const grouped = await prisma_1.prisma.studentAttendance.groupBy({
            by: ['status'],
            where,
            _count: { status: true },
        });
        const summary = {
            PRESENT: 0,
            ABSENT: 0,
            LATE: 0,
            HALF_DAY: 0,
            EXCUSED: 0,
            TOTAL: 0,
        };
        let total = 0;
        grouped.forEach((g) => {
            summary[g.status] = g._count.status;
            total += g._count.status;
        });
        summary.TOTAL = total;
        return summary;
    }
    /**
     * Get Student Attendance Stats (individual breakdown and percentage)
     */
    static async getStudentAttendanceStats(schoolId, studentId, academicSessionId) {
        const where = { schoolId, studentId };
        if (academicSessionId)
            where.academicSessionId = academicSessionId;
        const [totalDays, grouped] = await Promise.all([
            prisma_1.prisma.studentAttendance.count({ where }),
            prisma_1.prisma.studentAttendance.groupBy({
                by: ['status'],
                where,
                _count: { status: true },
            }),
        ]);
        const counts = {
            PRESENT: 0,
            ABSENT: 0,
            LATE: 0,
            HALF_DAY: 0,
            EXCUSED: 0,
        };
        grouped.forEach((g) => {
            counts[g.status] = g._count.status;
        });
        // Attendance percentage calculation: (Present + Late + HalfDay * 0.5) / TotalDays * 100
        const presentEquivalent = counts.PRESENT + counts.LATE + counts.HALF_DAY * 0.5;
        const percentage = totalDays > 0 ? Math.round((presentEquivalent / totalDays) * 1000) / 10 : 0;
        return {
            totalDays,
            ...counts,
            attendancePercentage: percentage,
        };
    }
}
exports.AttendanceRepository = AttendanceRepository;
//# sourceMappingURL=attendance.repository.js.map