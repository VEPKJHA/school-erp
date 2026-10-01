"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentRepository = void 0;
const prisma_1 = require("../config/prisma");
class DocumentRepository {
    static async create(data) {
        return prisma_1.prisma.studentDocument.create({ data });
    }
    static async findByStudentId(studentId, schoolId) {
        return prisma_1.prisma.studentDocument.findMany({
            where: { studentId, schoolId },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async findByAdmissionId(admissionId, schoolId) {
        return prisma_1.prisma.studentDocument.findMany({
            where: { admissionId, schoolId },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async delete(id, schoolId) {
        const doc = await prisma_1.prisma.studentDocument.findFirst({
            where: { id, schoolId },
        });
        if (!doc)
            return null;
        return prisma_1.prisma.studentDocument.delete({ where: { id } });
    }
}
exports.DocumentRepository = DocumentRepository;
//# sourceMappingURL=document.repository.js.map