"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentRepository = void 0;
const prisma_1 = require("../config/prisma");
class ParentRepository {
    static async findByPhoneAndSchool(phone, schoolId) {
        return prisma_1.prisma.parent.findFirst({
            where: { phone, schoolId },
        });
    }
    static async findById(id, schoolId) {
        return prisma_1.prisma.parent.findFirst({
            where: { id, schoolId },
            include: {
                students: {
                    include: {
                        student: {
                            include: {
                                class: true,
                                section: true,
                            },
                        },
                    },
                },
            },
        });
    }
    static async create(data, client = prisma_1.prisma) {
        return client.parent.create({ data });
    }
    static async linkToStudent(studentId, parentId, options, client = prisma_1.prisma) {
        return client.studentParent.upsert({
            where: {
                studentId_parentId: {
                    studentId,
                    parentId,
                },
            },
            update: {
                relationship: options.relationship || 'GUARDIAN',
                isPrimaryContact: options.isPrimaryContact ?? false,
                isEmergencyContact: options.isEmergencyContact ?? false,
            },
            create: {
                studentId,
                parentId,
                relationship: options.relationship || 'GUARDIAN',
                isPrimaryContact: options.isPrimaryContact ?? false,
                isEmergencyContact: options.isEmergencyContact ?? false,
            },
        });
    }
    static async searchParents(schoolId, query) {
        return prisma_1.prisma.parent.findMany({
            where: {
                schoolId,
                OR: [
                    { firstName: { contains: query } },
                    { lastName: { contains: query } },
                    { phone: { contains: query } },
                    { email: { contains: query } },
                ],
            },
            take: 20,
            orderBy: { firstName: 'asc' },
        });
    }
}
exports.ParentRepository = ParentRepository;
//# sourceMappingURL=parent.repository.js.map