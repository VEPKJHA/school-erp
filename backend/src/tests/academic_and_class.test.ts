import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import { signAccessToken } from '../utils/jwt';

describe('Academic Sessions, Classes & Sections Flow', () => {
  const schoolId = 'school-123';

  const adminToken = signAccessToken({
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

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Transactionally sets academic session as current and demotes others', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'admin-user',
      status: 'ACTIVE',
      schoolId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolId,
      isActive: true,
    } as any);

    const mockTx = {
      academicSession: {
        findFirst: vi.fn().mockResolvedValue({ id: 'session-2', name: '2027-28', schoolId }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({ id: 'session-2', name: '2027-28', isCurrent: true, status: 'ACTIVE' }),
      },
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback(mockTx);
    });

    vi.spyOn(prisma.academicSession, 'findFirst').mockResolvedValue({ id: 'session-1', name: '2026-27' } as any);
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .patch('/api/academic-sessions/session-2/set-current')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockTx.academicSession.updateMany).toHaveBeenCalledWith({
      where: { schoolId, isCurrent: true },
      data: { isCurrent: false },
    });
    expect(mockTx.academicSession.update).toHaveBeenCalledWith({
      where: { id: 'session-2' },
      data: { isCurrent: true, status: 'ACTIVE' },
    });
  });

  it('Rejects duplicate class creation with identical code or name', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'admin-user',
      status: 'ACTIVE',
      schoolId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.class, 'findUnique').mockResolvedValue({
      id: 'class-existing-1',
      code: 'C01',
      name: 'Class 1',
      schoolId,
    } as any);

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Class 1 Duplicate',
        code: 'C01',
        numericOrder: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('Soft deactivates class instead of physical deletion', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'admin-user',
      status: 'ACTIVE',
      schoolId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.class, 'findFirst').mockResolvedValue({
      id: 'class-1',
      schoolId,
      isActive: true,
    } as any);

    const updateSpy = vi.spyOn(prisma.class, 'update').mockResolvedValue({
      id: 'class-1',
      isActive: false,
    } as any);

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .delete('/api/classes/class-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'class-1' },
      data: { isActive: false },
    });
  });
});
