"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicRepository = void 0;
const prisma_1 = require("../config/prisma");
class AcademicRepository {
    static async findById(id, schoolId) {
        return prisma_1.prisma.academicSession.findFirst({
            where: { id, schoolId },
        });
    }
    static async findByName(name, schoolId) {
        return prisma_1.prisma.academicSession.findUnique({
            where: {
                schoolId_name: {
                    schoolId,
                    name,
                },
            },
        });
    }
    static async getCurrentSession(schoolId) {
        return prisma_1.prisma.academicSession.findFirst({
            where: { schoolId, isCurrent: true },
        });
    }
    static async findAll(schoolId) {
        return prisma_1.prisma.academicSession.findMany({
            where: { schoolId },
            orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
        });
    }
    static async create(data) {
        if (data.isCurrent) {
            return prisma_1.prisma.$transaction(async (tx) => {
                await tx.academicSession.updateMany({
                    where: { schoolId: data.schoolId, isCurrent: true },
                    data: { isCurrent: false },
                });
                return tx.academicSession.create({
                    data: {
                        ...data,
                        isCurrent: true,
                    },
                });
            });
        }
        return prisma_1.prisma.academicSession.create({ data });
    }
    static async update(id, schoolId, data) {
        const existing = await prisma_1.prisma.academicSession.findFirst({
            where: { id, schoolId },
        });
        if (!existing)
            return null;
        return prisma_1.prisma.academicSession.update({
            where: { id },
            data,
        });
    }
    static async setCurrent(id, schoolId) {
        return prisma_1.prisma.$transaction(async (tx) => {
            const session = await tx.academicSession.findFirst({
                where: { id, schoolId },
            });
            if (!session) {
                throw new Error('Academic session not found in this school');
            }
            await tx.academicSession.updateMany({
                where: { schoolId, isCurrent: true },
                data: { isCurrent: false },
            });
            return tx.academicSession.update({
                where: { id },
                data: { isCurrent: true, status: 'ACTIVE' },
            });
        });
    }
}
exports.AcademicRepository = AcademicRepository;
//# sourceMappingURL=academic.repository.js.map