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
(0, vitest_1.describe)('Multi-Tenant Isolation Verification', () => {
    const schoolAId = 'school-a-uuid';
    const schoolBId = 'school-b-uuid';
    const schoolAUserToken = (0, jwt_1.signAccessToken)({
        userId: 'user-a-uuid',
        email: 'admin@schoola.com',
        schoolId: schoolAId,
        roleId: 'role-admin-a',
        roleCode: 'SCHOOL_ADMIN',
        permissions: [
            'school:read',
            'user:read',
            'user:create',
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
            'student:read',
            'student:create',
            'admission:read',
            'admission:approve',
            'fee:head:read',
            'fee:structure:read',
            'fee:invoice:read',
            'fee:payment:read',
        ],
    });
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('School A user CANNOT read School B users', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'user-a-uuid',
            status: 'ACTIVE',
            schoolId: schoolAId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAId,
            isActive: true,
        });
        const findManySpy = vitest_1.vi.spyOn(prisma_1.prisma.user, 'findMany').mockResolvedValue([]);
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'count').mockResolvedValue(0);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/users')
            .set('Authorization', `Bearer ${schoolAUserToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(findManySpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: vitest_1.expect.objectContaining({ schoolId: schoolAId }),
        }));
    });
    (0, vitest_1.it)('School A user CANNOT read School B classes', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'user-a-uuid',
            status: 'ACTIVE',
            schoolId: schoolAId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAId,
            isActive: true,
        });
        const findManySpy = vitest_1.vi.spyOn(prisma_1.prisma.class, 'findMany').mockResolvedValue([]);
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'count').mockResolvedValue(0);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/classes')
            .set('Authorization', `Bearer ${schoolAUserToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(findManySpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: vitest_1.expect.objectContaining({ schoolId: schoolAId }),
        }));
    });
    (0, vitest_1.it)('School A user CANNOT read School B academic sessions', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'user-a-uuid',
            status: 'ACTIVE',
            schoolId: schoolAId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAId,
            isActive: true,
        });
        const findManySpy = vitest_1.vi.spyOn(prisma_1.prisma.academicSession, 'findMany').mockResolvedValue([]);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/academic-sessions')
            .set('Authorization', `Bearer ${schoolAUserToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(findManySpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { schoolId: schoolAId },
        }));
    });
    (0, vitest_1.it)('School A user CANNOT create a section referencing a Class belonging to School B', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'user-a-uuid',
            status: 'ACTIVE',
            schoolId: schoolAId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findFirst').mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/classes/class-of-school-b-uuid/sections')
            .set('Authorization', `Bearer ${schoolAUserToken}`)
            .send({
            name: 'Section Alpha',
            capacity: 35,
        });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(res.body.message).toMatch(/not found or belongs to another school/i);
    });
    (0, vitest_1.it)('School A user CANNOT read School B students', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'user-a-uuid',
            status: 'ACTIVE',
            schoolId: schoolAId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAId,
            isActive: true,
        });
        const studentSpy = vitest_1.vi.spyOn(prisma_1.prisma.student, 'findMany').mockResolvedValue([]);
        vitest_1.vi.spyOn(prisma_1.prisma.student, 'count').mockResolvedValue(0);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/students')
            .set('Authorization', `Bearer ${schoolAUserToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(studentSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: vitest_1.expect.objectContaining({ schoolId: schoolAId }),
        }));
    });
    (0, vitest_1.it)('School A user CANNOT read School B admissions', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'user-a-uuid',
            status: 'ACTIVE',
            schoolId: schoolAId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAId,
            isActive: true,
        });
        const admissionSpy = vitest_1.vi.spyOn(prisma_1.prisma.admission, 'findMany').mockResolvedValue([]);
        vitest_1.vi.spyOn(prisma_1.prisma.admission, 'count').mockResolvedValue(0);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/admissions')
            .set('Authorization', `Bearer ${schoolAUserToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(admissionSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: vitest_1.expect.objectContaining({ schoolId: schoolAId }),
        }));
    });
    (0, vitest_1.it)('School A user CANNOT read School B fee invoices', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'user-a-uuid',
            status: 'ACTIVE',
            schoolId: schoolAId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAId,
            isActive: true,
        });
        const invoiceSpy = vitest_1.vi.spyOn(prisma_1.prisma.feeInvoice, 'findMany').mockResolvedValue([]);
        vitest_1.vi.spyOn(prisma_1.prisma.feeInvoice, 'count').mockResolvedValue(0);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/fees/invoices')
            .set('Authorization', `Bearer ${schoolAUserToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(invoiceSpy).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: vitest_1.expect.objectContaining({ schoolId: schoolAId }),
        }));
    });
    (0, vitest_1.it)('Reject request if user attempts to forge a different school ID in header', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'user-a-uuid',
            status: 'ACTIVE',
            schoolId: schoolAId,
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/classes')
            .set('Authorization', `Bearer ${schoolAUserToken}`)
            .set('x-school-id', schoolBId);
        (0, vitest_1.expect)(res.status).toBe(403);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(res.body.message).toMatch(/tenant violation/i);
    });
});
//# sourceMappingURL=tenant_isolation.test.js.map