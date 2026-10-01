"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolRepository = void 0;
const prisma_1 = require("../config/prisma");
class SchoolRepository {
    static async findById(id) {
        return prisma_1.prisma.school.findUnique({
            where: { id },
        });
    }
    static async findByCode(code) {
        return prisma_1.prisma.school.findUnique({
            where: { code },
        });
    }
    static async update(id, data) {
        return prisma_1.prisma.school.update({
            where: { id },
            data,
        });
    }
    static async findAll(page = 1, pageSize = 20, search) {
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { code: { contains: search } },
                { city: { contains: search } },
            ];
        }
        const [total, schools] = await Promise.all([
            prisma_1.prisma.school.count({ where }),
            prisma_1.prisma.school.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { name: 'asc' },
            }),
        ]);
        return { total, schools };
    }
}
exports.SchoolRepository = SchoolRepository;
//# sourceMappingURL=school.repository.js.map