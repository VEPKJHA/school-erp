"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassRepository = void 0;
const prisma_1 = require("../config/prisma");
class ClassRepository {
    static async findClassById(id, schoolId) {
        return prisma_1.prisma.class.findFirst({
            where: { id, schoolId },
            include: {
                sections: {
                    orderBy: { name: 'asc' },
                },
            },
        });
    }
    static async findClassByCode(code, schoolId) {
        return prisma_1.prisma.class.findUnique({
            where: {
                schoolId_code: { schoolId, code },
            },
        });
    }
    static async findClassByName(name, schoolId) {
        return prisma_1.prisma.class.findUnique({
            where: {
                schoolId_name: { schoolId, name },
            },
        });
    }
    static async findAllClasses(params) {
        const { schoolId, page = 1, pageSize = 50, search, isActive } = params;
        const where = { schoolId };
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { code: { contains: search } },
            ];
        }
        const [total, classes] = await Promise.all([
            prisma_1.prisma.class.count({ where }),
            prisma_1.prisma.class.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { numericOrder: 'asc' },
                include: {
                    sections: {
                        orderBy: { name: 'asc' },
                    },
                },
            }),
        ]);
        return { total, classes };
    }
    static async createClass(data) {
        return prisma_1.prisma.class.create({
            data: {
                ...data,
                isActive: true,
            },
            include: {
                sections: true,
            },
        });
    }
    static async updateClass(id, schoolId, data) {
        const existing = await prisma_1.prisma.class.findFirst({
            where: { id, schoolId },
        });
        if (!existing)
            return null;
        return prisma_1.prisma.class.update({
            where: { id },
            data,
            include: {
                sections: true,
            },
        });
    }
    static async deactivateClass(id, schoolId) {
        const existing = await prisma_1.prisma.class.findFirst({
            where: { id, schoolId },
        });
        if (!existing)
            return null;
        return prisma_1.prisma.class.update({
            where: { id },
            data: { isActive: false },
        });
    }
    static async findSectionById(id, schoolId) {
        return prisma_1.prisma.section.findFirst({
            where: {
                id,
                schoolId,
                class: {
                    schoolId,
                },
            },
            include: {
                class: {
                    select: { id: true, name: true, code: true, schoolId: true },
                },
            },
        });
    }
    static async findAllSections(params) {
        const { schoolId, classId, page = 1, pageSize = 50, search, isActive } = params;
        const where = {
            schoolId,
            class: {
                schoolId,
            },
        };
        if (classId) {
            where.classId = classId;
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { roomNumber: { contains: search } },
                { class: { name: { contains: search } } },
            ];
        }
        const [total, sections] = await Promise.all([
            prisma_1.prisma.section.count({ where }),
            prisma_1.prisma.section.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: [{ class: { numericOrder: 'asc' } }, { name: 'asc' }],
                include: {
                    class: {
                        select: { id: true, name: true, code: true, numericOrder: true },
                    },
                },
            }),
        ]);
        return { total, sections };
    }
    static async createSection(classId, schoolId, data) {
        const parentClass = await prisma_1.prisma.class.findFirst({
            where: { id: classId, schoolId },
        });
        if (!parentClass) {
            throw new Error('Parent class not found or belongs to another school');
        }
        return prisma_1.prisma.section.create({
            data: {
                name: data.name,
                capacity: data.capacity ?? 40,
                roomNumber: data.roomNumber,
                classId: parentClass.id,
                schoolId: schoolId,
                isActive: true,
            },
            include: {
                class: true,
            },
        });
    }
    static async updateSection(id, schoolId, data) {
        const existing = await prisma_1.prisma.section.findFirst({
            where: {
                id,
                schoolId,
                class: { schoolId },
            },
        });
        if (!existing)
            return null;
        return prisma_1.prisma.section.update({
            where: { id },
            data,
            include: {
                class: true,
            },
        });
    }
    static async deactivateSection(id, schoolId) {
        const existing = await prisma_1.prisma.section.findFirst({
            where: {
                id,
                schoolId,
                class: { schoolId },
            },
        });
        if (!existing)
            return null;
        return prisma_1.prisma.section.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
exports.ClassRepository = ClassRepository;
//# sourceMappingURL=class.repository.js.map