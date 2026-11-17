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
const feeTools_1 = require("../services/aiAgent/feeTools");
(0, vitest_1.describe)('Agentic AI Fee-Management Assistant (HITL & Tool Calling)', () => {
    const schoolAlphaId = 'school-alpha-uuid';
    const schoolBetaId = 'school-beta-uuid';
    const adminToken = (0, jwt_1.signAccessToken)({
        userId: 'admin-alpha-id',
        email: 'admin@schoolalpha.edu',
        schoolId: schoolAlphaId,
        roleId: 'role-admin-id',
        roleCode: 'SCHOOL_ADMIN',
        permissions: ['fee:report:read', 'fee:payment:create'],
    });
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('Strict Multi-Tenant Tool Execution: getPendingFees scopes queries strictly to tenantId', async () => {
        const mockInvoices = [
            {
                id: 'inv-1',
                schoolId: schoolAlphaId,
                invoiceNumber: 'INV/2026/000001',
                title: 'Tuition Fee',
                dueDate: new Date('2026-11-10'),
                totalAmount: 5000,
                paidAmount: 2000,
                balanceAmount: 3000,
                status: 'PARTIALLY_PAID',
                student: {
                    id: 'stu-1',
                    firstName: 'Aarav',
                    lastName: 'Sharma',
                    studentCode: 'STU-001',
                    admissionNumber: 'ADM-001',
                    mobile: '9876543210',
                    class: { name: 'Class 5' },
                    section: { name: 'A' },
                    parents: [
                        {
                            isPrimaryContact: true,
                            parent: { firstName: 'Ramesh', lastName: 'Sharma', phone: '9876543210', email: 'ramesh@example.com' },
                        },
                    ],
                },
            },
        ];
        vitest_1.vi.spyOn(prisma_1.prisma.feeInvoice, 'findMany').mockResolvedValue(mockInvoices);
        const result = await (0, feeTools_1.executeGetPendingFees)(schoolAlphaId, { month: 11, year: 2026 });
        (0, vitest_1.expect)(prisma_1.prisma.feeInvoice.findMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: vitest_1.expect.objectContaining({
                schoolId: schoolAlphaId,
                balanceAmount: { gt: 0 },
            }),
        }));
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.totalPendingStudents).toBe(1);
        (0, vitest_1.expect)(result.students[0].studentName).toBe('Aarav Sharma');
        (0, vitest_1.expect)(result.students[0].pendingAmount).toBe(3000);
    });
    (0, vitest_1.it)('Human-in-the-Loop Gate: prepareFeeReminders creates AWAITING_APPROVAL action with 15min expiration', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.feeInvoice, 'findMany').mockResolvedValue([
            {
                id: 'inv-1',
                schoolId: schoolAlphaId,
                invoiceNumber: 'INV/2026/000001',
                title: 'Tuition Fee',
                dueDate: new Date('2026-11-10'),
                totalAmount: 5000,
                paidAmount: 2000,
                balanceAmount: 3000,
                status: 'PARTIALLY_PAID',
                student: {
                    id: 'stu-1',
                    firstName: 'Aarav',
                    lastName: 'Sharma',
                    studentCode: 'STU-001',
                    admissionNumber: 'ADM-001',
                    mobile: '9876543210',
                    class: { name: 'Class 5' },
                    section: { name: 'A' },
                    parents: [{ isPrimaryContact: true, parent: { firstName: 'Ramesh', lastName: 'Sharma', phone: '9876543210' } }],
                },
            },
        ]);
        const mockCreatedAction = {
            id: 'action-123',
            tenantId: schoolAlphaId,
            userId: 'admin-alpha-id',
            actionType: 'SEND_FEE_REMINDER',
            status: 'AWAITING_APPROVAL',
            payload: {},
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        vitest_1.vi.spyOn(prisma_1.prisma.agentPendingAction, 'create').mockResolvedValue(mockCreatedAction);
        const result = await (0, feeTools_1.executePrepareFeeReminders)(schoolAlphaId, 'admin-alpha-id', {
            studentIds: ['stu-1'],
        });
        (0, vitest_1.expect)(prisma_1.prisma.agentPendingAction.create).toHaveBeenCalled();
        (0, vitest_1.expect)(result.pendingApproval).toBe(true);
        (0, vitest_1.expect)(result.actionId).toBe('action-123');
        (0, vitest_1.expect)(result.studentCount).toBe(1);
    });
    (0, vitest_1.it)('HITL Action Approval endpoint enforces tenant boundaries and rejects cross-tenant approval', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'admin-alpha-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        // Mock an action belonging to schoolBetaId
        vitest_1.vi.spyOn(prisma_1.prisma.agentPendingAction, 'findUnique').mockResolvedValue({
            id: 'action-beta-999',
            tenantId: schoolBetaId, // Cross-tenant!
            userId: 'other-user',
            status: 'AWAITING_APPROVAL',
            expiresAt: new Date(Date.now() + 100000),
            payload: { students: [] },
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/ai-agent/approve-action/action-beta-999')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(res.body.message).toContain('Tenant authorization violation');
    });
    (0, vitest_1.it)('HITL Action Approval marks action as APPROVED when tenant matches', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'admin-alpha-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.agentPendingAction, 'findUnique').mockResolvedValue({
            id: 'action-alpha-123',
            tenantId: schoolAlphaId,
            userId: 'admin-alpha-id',
            status: 'AWAITING_APPROVAL',
            expiresAt: new Date(Date.now() + 100000),
            payload: {
                totalAmount: 3000,
                students: [
                    {
                        studentId: 'stu-1',
                        studentName: 'Aarav Sharma',
                        className: 'Class 5',
                        parentName: 'Ramesh Sharma',
                        parentContact: '9876543210',
                        pendingAmount: 3000,
                    },
                ],
            },
        });
        vitest_1.vi.spyOn(prisma_1.prisma.agentPendingAction, 'update').mockResolvedValue({
            id: 'action-alpha-123',
            status: 'APPROVED',
        });
        vitest_1.vi.spyOn(prisma_1.prisma.auditLog, 'create').mockResolvedValue({});
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/ai-agent/approve-action/action-alpha-123')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.status).toBe('APPROVED');
        (0, vitest_1.expect)(prisma_1.prisma.agentPendingAction.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { id: 'action-alpha-123' },
            data: { status: 'APPROVED' },
        }));
    });
});
//# sourceMappingURL=ai_agent_fee.test.js.map