"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const prisma_1 = require("../config/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../utils/jwt");
(0, vitest_1.describe)('Authentication & RBAC Enforcement', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('Rejects login with invalid password', async () => {
        const passwordHash = await bcryptjs_1.default.hash('CorrectPassword@123', 10);
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findFirst').mockResolvedValue({
            id: 'test-user-id',
            email: 'test@school.com',
            passwordHash,
            status: 'ACTIVE',
            schoolId: 'school-uuid',
            role: {
                code: 'SCHOOL_ADMIN',
                permissions: [],
            },
        });
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'test@school.com',
            password: 'WrongPassword!999',
        });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(res.body.message).toMatch(/invalid email or password/i);
    });
    (0, vitest_1.it)('Rejects login if user status is INACTIVE or SUSPENDED', async () => {
        const passwordHash = await bcryptjs_1.default.hash('CorrectPassword@123', 10);
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findFirst').mockResolvedValue({
            id: 'test-user-id',
            email: 'test@school.com',
            passwordHash,
            status: 'SUSPENDED',
            schoolId: 'school-uuid',
            role: {
                code: 'SCHOOL_ADMIN',
                permissions: [],
            },
        });
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'test@school.com',
            password: 'CorrectPassword@123',
        });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(res.body.message).toMatch(/suspended or inactive/i);
    });
    (0, vitest_1.it)('Successfully logs in active user and sets HTTP-only refresh cookie', async () => {
        const passwordHash = await bcryptjs_1.default.hash('Password@123', 10);
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: 'school-uuid',
            name: 'Apex School',
            code: 'DEMO-SCH',
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findFirst').mockResolvedValue({
            id: 'user-uuid-1',
            email: 'admin@apexschool.com',
            firstName: 'Rajesh',
            lastName: 'Sharma',
            passwordHash,
            status: 'ACTIVE',
            schoolId: 'school-uuid',
            roleId: 'role-admin',
            role: {
                id: 'role-admin',
                code: 'SCHOOL_ADMIN',
                name: 'School Administrator',
                permissions: [
                    { permission: { code: 'class:create' } },
                    { permission: { code: 'class:read' } },
                ],
            },
            school: {
                id: 'school-uuid',
                name: 'Apex School',
                code: 'DEMO-SCH',
            },
        });
        vitest_1.vi.spyOn(prisma_1.prisma.refreshToken, 'create').mockResolvedValue({});
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'update').mockResolvedValue({});
        vitest_1.vi.spyOn(prisma_1.prisma.auditLog, 'create').mockResolvedValue({});
        const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: 'admin@apexschool.com',
            password: 'Password@123',
            schoolCode: 'DEMO-SCH',
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.accessToken).toBeDefined();
        (0, vitest_1.expect)(res.body.data.user.email).toBe('admin@apexschool.com');
        const cookieHeader = res.headers['set-cookie'];
        (0, vitest_1.expect)(cookieHeader).toBeDefined();
        (0, vitest_1.expect)(cookieHeader[0]).toMatch(/school_erp_refresh=/);
        (0, vitest_1.expect)(cookieHeader[0]).toMatch(/HttpOnly/i);
    });
    (0, vitest_1.it)('RBAC blocks Teacher from creating classes (returns 403 Forbidden)', async () => {
        const teacherToken = (0, jwt_1.signAccessToken)({
            userId: 'teacher-id',
            email: 'teacher@school.com',
            schoolId: 'school-uuid',
            roleId: 'teacher-role-id',
            roleCode: 'TEACHER',
            permissions: ['class:read', 'section:read'],
        });
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-id',
            status: 'ACTIVE',
            schoolId: 'school-uuid',
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: 'school-uuid',
            isActive: true,
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/classes')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
            name: 'Forbidden Class',
            code: 'FC01',
            numericOrder: 15,
        });
        (0, vitest_1.expect)(res.status).toBe(403);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(res.body.message).toMatch(/class:create/i);
    });
});
//# sourceMappingURL=auth_and_rbac.test.js.map