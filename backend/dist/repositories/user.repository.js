"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const prisma_1 = require("../config/prisma");
class UserRepository {
    static async findById(id, schoolId) {
        const where = { id };
        if (schoolId) {
            where.schoolId = schoolId;
        }
        return prisma_1.prisma.user.findFirst({
            where,
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true },
                        },
                    },
                },
                school: true,
            },
        });
    }
    static async findByEmailAndSchool(email, schoolId) {
        return prisma_1.prisma.user.findFirst({
            where: {
                email,
                schoolId: schoolId,
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true },
                        },
                    },
                },
                school: true,
            },
        });
    }
    static async findAll(params) {
        const { schoolId, page = 1, pageSize = 20, search, roleId, status } = params;
        const where = {};
        if (schoolId) {
            where.schoolId = schoolId;
        }
        if (roleId) {
            where.roleId = roleId;
        }
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
            ];
        }
        const [total, users] = await Promise.all([
            prisma_1.prisma.user.count({ where }),
            prisma_1.prisma.user.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    role: {
                        select: { id: true, name: true, code: true },
                    },
                    school: {
                        select: { id: true, name: true, code: true },
                    },
                },
            }),
        ]);
        return { total, users };
    }
    static async create(data) {
        return prisma_1.prisma.user.create({
            data,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                status: true,
                createdAt: true,
                role: { select: { id: true, name: true, code: true } },
            },
        });
    }
    static async update(id, schoolId, data) {
        const where = { id };
        if (schoolId)
            where.schoolId = schoolId;
        const existing = await prisma_1.prisma.user.findFirst({ where });
        if (!existing)
            return null;
        return prisma_1.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                status: true,
                updatedAt: true,
                role: { select: { id: true, name: true, code: true } },
            },
        });
    }
    static async updateStatus(id, schoolId, status) {
        const where = { id };
        if (schoolId)
            where.schoolId = schoolId;
        const existing = await prisma_1.prisma.user.findFirst({ where });
        if (!existing)
            return null;
        return prisma_1.prisma.user.update({
            where: { id },
            data: { status },
            select: { id: true, status: true },
        });
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map