"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const prisma_1 = require("../config/prisma");
const jwt_1 = require("../utils/jwt");
(0, vitest_1.describe)('Academic Sessions, Classes & Sections Flow', () => {
    const schoolId = 'school-123';
    const adminToken = (0, jwt_1.signAccessToken)({
        userId: 'admin-user',
        email: 'admin@school.com',
        schoolId,
        roleId: 'role-admin',
        roleCode: 'SCHOOL_ADMIN',
        permissions: [
            'academic:session:read',
            'academic:session:create',
            'academic:session:update',
            'class:read',
            'class:create',
            'class:update',
            'class:delete',
            'section:read',
            'section:create',
            'section:update',
            'section:delete',
        ],
    });
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('Transactionally sets academic session as current and demotes others', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'admin-user',
            status: 'ACTIVE',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolId,
            isActive: true,
        });
        const mockTx = {
            academicSession: {
                findFirst: vitest_1.vi.fn().mockResolvedValue({ id: 'session-2', name: '2027-28', schoolId }),
                updateMany: vitest_1.vi.fn().mockResolvedValue({ count: 1 }),
                update: vitest_1.vi.fn().mockResolvedValue({ id: 'session-2', name: '2027-28', isCurrent: true, status: 'ACTIVE' }),
            },
        };
        vitest_1.vi.spyOn(prisma_1.prisma, '$transaction').mockImplementation(async (callback) => {
            return callback(mockTx);
        });
        vitest_1.vi.spyOn(prisma_1.prisma.academicSession, 'findFirst').mockResolvedValue({ id: 'session-1', name: '2026-27' });
        vitest_1.vi.spyOn(prisma_1.prisma.auditLog, 'create').mockResolvedValue({});
        const res = await (0, supertest_1.default)(app_1.default)
            .patch('/api/academic-sessions/session-2/set-current')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(mockTx.academicSession.updateMany).toHaveBeenCalledWith({
            where: { schoolId, isCurrent: true },
            data: { isCurrent: false },
        });
        (0, vitest_1.expect)(mockTx.academicSession.update).toHaveBeenCalledWith({
            where: { id: 'session-2' },
            data: { isCurrent: true, status: 'ACTIVE' },
        });
    });
    (0, vitest_1.it)('Rejects duplicate class creation with identical code or name', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'admin-user',
            status: 'ACTIVE',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findUnique').mockResolvedValue({
            id: 'class-existing-1',
            code: 'C01',
            name: 'Class 1',
            schoolId,
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/classes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Class 1 Duplicate',
            code: 'C01',
            numericOrder: 1,
        });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(res.body.message).toMatch(/already exists/i);
    });
    (0, vitest_1.it)('Soft deactivates class instead of physical deletion', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'admin-user',
            status: 'ACTIVE',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findFirst').mockResolvedValue({
            id: 'class-1',
            schoolId,
            isActive: true,
        });
        const updateSpy = vitest_1.vi.spyOn(prisma_1.prisma.class, 'update').mockResolvedValue({
            id: 'class-1',
            isActive: false,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.auditLog, 'create').mockResolvedValue({});
        const res = await (0, supertest_1.default)(app_1.default)
            .delete('/api/classes/class-1')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(updateSpy).toHaveBeenCalledWith({
            where: { id: 'class-1' },
            data: { isActive: false },
        });
    });
});
//# sourceMappingURL=academic_and_class.test.js.map