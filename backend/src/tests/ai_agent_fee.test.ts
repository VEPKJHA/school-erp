import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import { signAccessToken } from '../utils/jwt';
import { FeeAgentService } from '../services/aiAgent/feeAgent.service';
import { executeGetPendingFees, executePrepareFeeReminders } from '../services/aiAgent/feeTools';

describe('Agentic AI Fee-Management Assistant (HITL & Tool Calling)', () => {
  const schoolAlphaId = 'school-alpha-uuid';
  const schoolBetaId = 'school-beta-uuid';

  const adminToken = signAccessToken({
    userId: 'admin-alpha-id',
    email: 'admin@schoolalpha.edu',
    schoolId: schoolAlphaId,
    roleId: 'role-admin-id',
    roleCode: 'SCHOOL_ADMIN',
    permissions: ['fee:report:read', 'fee:payment:create'],
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Strict Multi-Tenant Tool Execution: getPendingFees scopes queries strictly to tenantId', async () => {
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

    vi.spyOn(prisma.feeInvoice, 'findMany').mockResolvedValue(mockInvoices as any);

    const result = await executeGetPendingFees(schoolAlphaId, { month: 11, year: 2026 });

    expect(prisma.feeInvoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: schoolAlphaId,
          balanceAmount: { gt: 0 },
        }),
      })
    );
    expect(result.success).toBe(true);
    expect(result.totalPendingStudents).toBe(1);
    expect(result.students[0].studentName).toBe('Aarav Sharma');
    expect(result.students[0].pendingAmount).toBe(3000);
  });

  it('Human-in-the-Loop Gate: prepareFeeReminders creates AWAITING_APPROVAL action with 15min expiration', async () => {
    vi.spyOn(prisma.feeInvoice, 'findMany').mockResolvedValue([
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
    ] as any);

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

    vi.spyOn(prisma.agentPendingAction, 'create').mockResolvedValue(mockCreatedAction as any);

    const result = await executePrepareFeeReminders(schoolAlphaId, 'admin-alpha-id', {
      studentIds: ['stu-1'],
    });

    expect(prisma.agentPendingAction.create).toHaveBeenCalled();
    expect(result.pendingApproval).toBe(true);
    expect(result.actionId).toBe('action-123');
    expect(result.studentCount).toBe(1);
  });

  it('HITL Action Approval endpoint enforces tenant boundaries and rejects cross-tenant approval', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'admin-alpha-id',
      status: 'ACTIVE',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAlphaId,
      isActive: true,
    } as any);

    // Mock an action belonging to schoolBetaId
    vi.spyOn(prisma.agentPendingAction, 'findUnique').mockResolvedValue({
      id: 'action-beta-999',
      tenantId: schoolBetaId, // Cross-tenant!
      userId: 'other-user',
      status: 'AWAITING_APPROVAL',
      expiresAt: new Date(Date.now() + 100000),
      payload: { students: [] },
    } as any);

    const res = await request(app)
      .post('/api/ai-agent/approve-action/action-beta-999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Tenant authorization violation');
  });

  it('HITL Action Approval marks action as APPROVED when tenant matches', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'admin-alpha-id',
      status: 'ACTIVE',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAlphaId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.agentPendingAction, 'findUnique').mockResolvedValue({
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
    } as any);

    vi.spyOn(prisma.agentPendingAction, 'update').mockResolvedValue({
      id: 'action-alpha-123',
      status: 'APPROVED',
    } as any);

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/ai-agent/approve-action/action-alpha-123')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
    expect(prisma.agentPendingAction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'action-alpha-123' },
        data: { status: 'APPROVED' },
      })
    );
  });
});
