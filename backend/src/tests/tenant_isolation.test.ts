import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import { signAccessToken } from '../utils/jwt';

describe('Multi-Tenant Isolation Verification', () => {
  const schoolAId = 'school-a-uuid';
  const schoolBId = 'school-b-uuid';

  const schoolAUserToken = signAccessToken({
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

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('School A user CANNOT read School B users', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-a-uuid',
      status: 'ACTIVE',
      schoolId: schoolAId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAId,
      isActive: true,
    } as any);

    const findManySpy = vi.spyOn(prisma.user, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.user, 'count').mockResolvedValue(0);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${schoolAUserToken}`);

    expect(res.status).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: schoolAId }),
      })
    );
  });

  it('School A user CANNOT read School B classes', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-a-uuid',
      status: 'ACTIVE',
      schoolId: schoolAId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAId,
      isActive: true,
    } as any);

    const findManySpy = vi.spyOn(prisma.class, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.class, 'count').mockResolvedValue(0);

    const res = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${schoolAUserToken}`);

    expect(res.status).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: schoolAId }),
      })
    );
  });

  it('School A user CANNOT read School B academic sessions', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-a-uuid',
      status: 'ACTIVE',
      schoolId: schoolAId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAId,
      isActive: true,
    } as any);

    const findManySpy = vi.spyOn(prisma.academicSession, 'findMany').mockResolvedValue([]);

    const res = await request(app)
      .get('/api/academic-sessions')
      .set('Authorization', `Bearer ${schoolAUserToken}`);

    expect(res.status).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId: schoolAId },
      })
    );
  });

  it('School A user CANNOT create a section referencing a Class belonging to School B', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-a-uuid',
      status: 'ACTIVE',
      schoolId: schoolAId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.class, 'findFirst').mockResolvedValue(null);

    const res = await request(app)
      .post('/api/classes/class-of-school-b-uuid/sections')
      .set('Authorization', `Bearer ${schoolAUserToken}`)
      .send({
        name: 'Section Alpha',
        capacity: 35,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found or belongs to another school/i);
  });

  it('School A user CANNOT read School B students', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-a-uuid',
      status: 'ACTIVE',
      schoolId: schoolAId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAId,
      isActive: true,
    } as any);

    const studentSpy = vi.spyOn(prisma.student, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.student, 'count').mockResolvedValue(0);

    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${schoolAUserToken}`);

    expect(res.status).toBe(200);
    expect(studentSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: schoolAId }),
      })
    );
  });

  it('School A user CANNOT read School B admissions', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-a-uuid',
      status: 'ACTIVE',
      schoolId: schoolAId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAId,
      isActive: true,
    } as any);

    const admissionSpy = vi.spyOn(prisma.admission, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.admission, 'count').mockResolvedValue(0);

    const res = await request(app)
      .get('/api/admissions')
      .set('Authorization', `Bearer ${schoolAUserToken}`);

    expect(res.status).toBe(200);
    expect(admissionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: schoolAId }),
      })
    );
  });

  it('School A user CANNOT read School B fee invoices', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-a-uuid',
      status: 'ACTIVE',
      schoolId: schoolAId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAId,
      isActive: true,
    } as any);

    const invoiceSpy = vi.spyOn(prisma.feeInvoice, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.feeInvoice, 'count').mockResolvedValue(0);

    const res = await request(app)
      .get('/api/fees/invoices')
      .set('Authorization', `Bearer ${schoolAUserToken}`);

    expect(res.status).toBe(200);
    expect(invoiceSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: schoolAId }),
      })
    );
  });

  it('Reject request if user attempts to forge a different school ID in header', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-a-uuid',
      status: 'ACTIVE',
      schoolId: schoolAId,
    } as any);

    const res = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${schoolAUserToken}`)
      .set('x-school-id', schoolBId);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/tenant violation/i);
  });
});
