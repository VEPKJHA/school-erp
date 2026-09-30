import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { signAccessToken } from '../utils/jwt';

describe('Authentication & RBAC Enforcement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Rejects login with invalid password', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword@123', 10);
    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue({
      id: 'test-user-id',
      email: 'test@school.com',
      passwordHash,
      status: 'ACTIVE',
      schoolId: 'school-uuid',
      role: {
        code: 'SCHOOL_ADMIN',
        permissions: [],
      },
    } as any);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@school.com',
      password: 'WrongPassword!999',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('Rejects login if user status is INACTIVE or SUSPENDED', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword@123', 10);
    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue({
      id: 'test-user-id',
      email: 'test@school.com',
      passwordHash,
      status: 'SUSPENDED',
      schoolId: 'school-uuid',
      role: {
        code: 'SCHOOL_ADMIN',
        permissions: [],
      },
    } as any);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@school.com',
      password: 'CorrectPassword@123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/suspended or inactive/i);
  });

  it('Successfully logs in active user and sets HTTP-only refresh cookie', async () => {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: 'school-uuid',
      name: 'Apex School',
      code: 'DEMO-SCH',
      isActive: true,
    } as any);

    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue({
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
    } as any);

    vi.spyOn(prisma.refreshToken, 'create').mockResolvedValue({} as any);
    vi.spyOn(prisma.user, 'update').mockResolvedValue({} as any);
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@apexschool.com',
      password: 'Password@123',
      schoolCode: 'DEMO-SCH',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@apexschool.com');
    const cookieHeader = res.headers['set-cookie'];
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader[0]).toMatch(/school_erp_refresh=/);
    expect(cookieHeader[0]).toMatch(/HttpOnly/i);
  });

  it('RBAC blocks Teacher from creating classes (returns 403 Forbidden)', async () => {
    const teacherToken = signAccessToken({
      userId: 'teacher-id',
      email: 'teacher@school.com',
      schoolId: 'school-uuid',
      roleId: 'teacher-role-id',
      roleCode: 'TEACHER',
      permissions: ['class:read', 'section:read'],
    });

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'teacher-id',
      status: 'ACTIVE',
      schoolId: 'school-uuid',
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: 'school-uuid',
      isActive: true,
    } as any);

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Forbidden Class',
        code: 'FC01',
        numericOrder: 15,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/class:create/i);
  });
});
