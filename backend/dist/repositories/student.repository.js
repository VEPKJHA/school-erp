"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentRepository = void 0;
const prisma_1 = require("../config/prisma");
class StudentRepository {
    static async findById(id, schoolId) {
        return prisma_1.prisma.student.findFirst({
            where: { id, schoolId },
            include: {
                class: { select: { id: true, name: true, code: true } },
                section: { select: { id: true, name: true, roomNumber: true } },
                session: { select: { id: true, name: true } },
                parents: {
                    include: {
                        parent: true,
                    },
                },
                addresses: true,
                documents: true,
                admission: {
                    select: {
                        id: true,
                        applicationNumber: true,
                        applicationDate: true,
                        status: true,
                    },
                },
            },
        });
    }
    static async findByAdmissionNumber(admissionNumber, schoolId) {
        return prisma_1.prisma.student.findUnique({
            where: {
                schoolId_admissionNumber: {
                    schoolId,
                    admissionNumber,
                },
            },
        });
    }
    static async findByStudentCode(studentCode, schoolId) {
        return prisma_1.prisma.student.findUnique({
            where: {
                schoolId_studentCode: {
                    schoolId,
                    studentCode,
                },
            },
        });
    }
    static async findAll(params) {
        const { schoolId, classId, sectionId, status, academicSessionId, search, page = 1, pageSize = 20, } = params;
        const where = { schoolId };
        if (classId)
            where.classId = classId;
        if (sectionId)
            where.sectionId = sectionId;
        if (status)
            where.status = status;
        if (academicSessionId)
            where.academicSessionId = academicSessionId;
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { studentCode: { contains: search } },
                { admissionNumber: { contains: search } },
                { mobile: { contains: search } },
            ];
        }
        const [total, students] = await Promise.all([
            prisma_1.prisma.student.count({ where }),
            prisma_1.prisma.student.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: [{ class: { numericOrder: 'asc' } }, { firstName: 'asc' }],
                include: {
                    class: { select: { id: true, name: true, code: true } },
                    section: { select: { id: true, name: true } },
                    session: { select: { id: true, name: true } },
                    parents: {
                        where: { isPrimaryContact: true },
                        include: { parent: { select: { firstName: true, lastName: true, phone: true } } },
                    },
                },
            }),
        ]);
        return { total, students };
    }
    static async create(data, client = prisma_1.prisma) {
        return client.student.create({
            data,
            include: {
                class: true,
                section: true,
                session: true,
            },
        });
    }
    static async update(id, schoolId, data) {
        const existing = await prisma_1.prisma.student.findFirst({
            where: { id, schoolId },
        });
        if (!existing)
            return null;
        return prisma_1.prisma.student.update({
            where: { id },
            data,
        });
    }
    static async updateStatus(id, schoolId, status) {
        const existing = await prisma_1.prisma.student.findFirst({
            where: { id, schoolId },
        });
        if (!existing)
            return null;
        return prisma_1.prisma.student.update({
            where: { id },
            data: { status },
        });
    }
}
exports.StudentRepository = StudentRepository;
//# sourceMappingURL=student.repository.js.map