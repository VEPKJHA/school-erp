import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import { signAccessToken } from '../utils/jwt';
import { SequenceGenerator } from '../utils/sequenceGenerator';

describe('Student & Admission Lifecycle Workflow', () => {
  const schoolId = 'school-alpha-uuid';

  const adminToken = signAccessToken({
    userId: 'admin-user-id',
    email: 'admin@school.com',
    schoolId,
    roleId: 'role-admin-id',
    roleCode: 'SCHOOL_ADMIN',
    permissions: [
      'student:read',
      'student:create',
      'student:update',
      'admission:read',
      'admission:create',
      'admission:approve',
      'class:read',
      'section:read',
    ],
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Generates human-readable sequential numbers without collisions', async () => {
    const mockTx = {
      sequenceCounter: {
        upsert: vi.fn().mockResolvedValue({ lastValue: 42 }),
      },
    };

    const admNum = await SequenceGenerator.generateAdmissionNumber(schoolId, 2026, mockTx);
    expect(admNum).toBe('ADM/2026/000042');

    const stuCode = await SequenceGenerator.generateStudentCode(schoolId, 2026, mockTx);
    expect(stuCode).toBe('STU-2026-000042');

    const appNum = await SequenceGenerator.generateApplicationNumber(schoolId, 2026, mockTx);
    expect(appNum).toBe('APP/2026/000042');
  });

  it('Creates student and validates ownership chain of class and section', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'admin-user-id',
      status: 'ACTIVE',
      schoolId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolId,
      isActive: true,
    } as any);

    // Section belongs to a DIFFERENT class -> should reject
    vi.spyOn(prisma.class, 'findFirst').mockResolvedValue({
      id: 'class-1',
      name: 'Class 1',
      schoolId,
    } as any);

    vi.spyOn(prisma.section, 'findFirst').mockResolvedValue({
      id: 'section-2',
      classId: 'different-class-id', // mismatch!
      schoolId,
    } as any);

    vi.spyOn(prisma.academicSession, 'findFirst').mockResolvedValue({
      id: 'session-1',
      schoolId,
    } as any);

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classId: 'class-1',
        sectionId: 'section-2',
        academicSessionId: 'session-1',
        firstName: 'Aarav',
        lastName: 'Sharma',
        dateOfBirth: '2016-05-15',
        gender: 'MALE',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/does not belong to the selected class/i);
  });

  it('Submits admission application with generated application number', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'admin-user-id',
      status: 'ACTIVE',
      schoolId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.class, 'findFirst').mockResolvedValue({
      id: 'class-1',
      name: 'Class 1',
      schoolId,
    } as any);

    vi.spyOn(prisma.academicSession, 'findFirst').mockResolvedValue({
      id: 'session-1',
      schoolId,
    } as any);

    vi.spyOn(prisma.sequenceCounter, 'upsert').mockResolvedValue({
      lastValue: 5,
    } as any);

    vi.spyOn(prisma.admission, 'create').mockResolvedValue({
      id: 'admission-1',
      applicationNumber: 'APP/2026/000005',
      firstName: 'Rohan',
      lastName: 'Verma',
      status: 'SUBMITTED',
      session: { name: '2026-27' },
      applyingClass: { name: 'Class 1' },
    } as any);

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/admissions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId: 'session-1',
        applyingClassId: 'class-1',
        firstName: 'Rohan',
        lastName: 'Verma',
        dateOfBirth: '2017-08-20',
        gender: 'MALE',
        parentName: 'Sunil Verma',
        parentMobile: '+91 98765 43210',
        addressLine1: '45 Green Park',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110016',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.applicationNumber).toBe('APP/2026/000005');
  });

  it('Atomically approves admission application and creates active student', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'admin-user-id',
      status: 'ACTIVE',
      schoolId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolId,
      isActive: true,
    } as any);

    const mockTx = {
      admission: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'admission-1',
          schoolId,
          applyingClassId: 'class-1',
          academicSessionId: 'session-1',
          firstName: 'Rohan',
          lastName: 'Verma',
          dateOfBirth: new Date('2017-08-20'),
          gender: 'MALE',
          parentName: 'Sunil Verma',
          parentMobile: '+91 98765 43210',
          parentEmail: 'sunil@example.com',
          parentRelation: 'FATHER',
          addressLine1: '45 Green Park',
          city: 'Delhi',
          state: 'Delhi',
          postalCode: '110016',
          status: 'SUBMITTED',
        }),
        update: vi.fn().mockResolvedValue({
          id: 'admission-1',
          status: 'APPROVED',
          assignedSectionId: 'sec-1',
        }),
      },
      section: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'sec-1',
          classId: 'class-1',
          schoolId,
          name: 'A',
        }),
      },
      sequenceCounter: {
        upsert: vi.fn().mockResolvedValue({ lastValue: 10 }),
      },
      student: {
        create: vi.fn().mockResolvedValue({
          id: 'student-created-1',
          admissionNumber: 'ADM/2026/000010',
          studentCode: 'STU-2026-000010',
          firstName: 'Rohan',
          lastName: 'Verma',
          status: 'ACTIVE',
        }),
      },
      parent: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'parent-1', phone: '+91 98765 43210' }),
      },
      studentParent: {
        create: vi.fn().mockResolvedValue({}),
      },
      studentAddress: {
        create: vi.fn().mockResolvedValue({}),
      },
      studentDocument: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback(mockTx);
    });

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .patch('/api/admissions/admission-1/approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedSectionId: 'sec-1',
        remarks: 'Documents verified and approved',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockTx.student.create).toHaveBeenCalled();
    expect(mockTx.admission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED' }),
      })
    );
  });
});
