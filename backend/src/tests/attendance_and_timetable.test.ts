import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import { signAccessToken } from '../utils/jwt';

describe('Phase 4: Attendance & Timetable Management', () => {
  const schoolAlphaId = 'school-alpha-uuid';
  const schoolBetaId = 'school-beta-uuid';

  const teacherToken = signAccessToken({
    userId: 'teacher-user-id',
    email: 'teacher@schoolalpha.com',
    schoolId: schoolAlphaId,
    roleId: 'role-teacher-id',
    roleCode: 'TEACHER',
    permissions: [
      'attendance:student:create',
      'attendance:student:read',
      'attendance:student:update',
      'attendance:student:report',
      'subject:read',
      'subject:create',
      'timetable:read',
      'timetable:create',
      'timetable:update',
      'timetable:delete',
      'student:read',
    ],
  });

  const schoolBetaAdminToken = signAccessToken({
    userId: 'beta-admin-id',
    email: 'admin@schoolbeta.com',
    schoolId: schoolBetaId,
    roleId: 'role-admin-id',
    roleCode: 'SCHOOL_ADMIN',
    permissions: [
      'attendance:student:create',
      'attendance:student:read',
      'timetable:create',
      'timetable:read',
    ],
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Mark individual student attendance
  it('Marks individual student attendance with valid ownership and hierarchy', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'teacher-user-id',
      status: 'ACTIVE',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAlphaId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.academicSession, 'findFirst').mockResolvedValue({
      id: 'session-2026-id',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.class, 'findFirst').mockResolvedValue({
      id: 'class-10-id',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.section, 'findFirst').mockResolvedValue({
      id: 'section-a-id',
      classId: 'class-10-id',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.student, 'findFirst').mockResolvedValue({
      id: 'student-aarav-id',
      schoolId: schoolAlphaId,
      classId: 'class-10-id',
      sectionId: 'section-a-id',
    } as any);

    vi.spyOn(prisma.studentAttendance, 'upsert').mockResolvedValue({
      id: 'att-1-id',
      schoolId: schoolAlphaId,
      studentId: 'student-aarav-id',
      classId: 'class-10-id',
      sectionId: 'section-a-id',
      academicSessionId: 'session-2026-id',
      date: new Date('2026-09-29T00:00:00.000Z'),
      status: 'PRESENT',
      remarks: 'On time',
      student: {
        id: 'student-aarav-id',
        firstName: 'Aarav',
        lastName: 'Sharma',
        admissionNumber: 'ADM/2026/000001',
        studentCode: 'STU-2026-000001',
      },
    } as any);

    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        studentId: 'student-aarav-id',
        classId: 'class-10-id',
        sectionId: 'section-a-id',
        academicSessionId: 'session-2026-id',
        date: '2026-09-29',
        status: 'PRESENT',
        remarks: 'On time',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PRESENT');
  });

  // 2. Bulk mark section attendance in a transaction
  it('Bulk marks section attendance in an atomic transaction', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'teacher-user-id',
      status: 'ACTIVE',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAlphaId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.academicSession, 'findFirst').mockResolvedValue({
      id: 'session-2026-id',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.class, 'findFirst').mockResolvedValue({
      id: 'class-10-id',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.section, 'findFirst').mockResolvedValue({
      id: 'section-a-id',
      classId: 'class-10-id',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.student, 'findMany').mockResolvedValue([
      { id: 'student-aarav-id' },
      { id: 'student-diya-id' },
    ] as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        studentAttendance: {
          upsert: vi.fn().mockImplementation((args) => Promise.resolve(args.create)),
        },
      };
      return callback(mockTx);
    });

    const res = await request(app)
      .post('/api/attendance/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: 'class-10-id',
        sectionId: 'section-a-id',
        academicSessionId: 'session-2026-id',
        date: '2026-09-29',
        records: [
          { studentId: 'student-aarav-id', status: 'PRESENT' },
          { studentId: 'student-diya-id', status: 'ABSENT', remarks: 'Sick leave' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalMarked).toBe(2);
  });

  // 3. Daily Summary Aggregation
  it('Returns aggregated daily attendance summary counts', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'teacher-user-id',
      status: 'ACTIVE',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAlphaId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.studentAttendance, 'groupBy').mockResolvedValue([
      { status: 'PRESENT', _count: { status: 35 } },
      { status: 'ABSENT', _count: { status: 3 } },
      { status: 'LATE', _count: { status: 2 } },
    ] as any);

    const res = await request(app)
      .get('/api/attendance/summary/daily?date=2026-09-29')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.PRESENT).toBe(35);
    expect(res.body.data.ABSENT).toBe(3);
    expect(res.body.data.LATE).toBe(2);
    expect(res.body.data.TOTAL).toBe(40);
  });

  // 4. Create Subject
  it('Creates a new subject and rejects duplicate code', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'teacher-user-id',
      status: 'ACTIVE',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAlphaId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.subject, 'findFirst')
      .mockResolvedValueOnce(null) // first check: not found
      .mockResolvedValueOnce({ id: 'sub-existing-id', code: 'MATH' } as any); // second check: found

    vi.spyOn(prisma.subject, 'create').mockResolvedValue({
      id: 'sub-math-id',
      schoolId: schoolAlphaId,
      name: 'Mathematics',
      code: 'MATH',
      type: 'THEORY',
      isActive: true,
    } as any);

    // 1st call: success
    const res1 = await request(app)
      .post('/api/timetable/subjects')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Mathematics',
        code: 'MATH',
        type: 'THEORY',
      });

    expect(res1.status).toBe(201);
    expect(res1.body.data.code).toBe('MATH');

    // 2nd call: conflict
    const res2 = await request(app)
      .post('/api/timetable/subjects')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Mathematics',
        code: 'MATH',
        type: 'THEORY',
      });

    expect(res2.status).toBe(409);
    expect(res2.body.message).toContain('already registered');
  });

  // 5. Timetable Clash Detection: Teacher overlapping slot rejection
  it('Rejects timetable slot creation when teacher has an overlapping schedule conflict', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'teacher-user-id',
      status: 'ACTIVE',
      schoolId: schoolAlphaId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolAlphaId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.academicSession, 'findFirst').mockResolvedValue({ id: 'session-2026-id', schoolId: schoolAlphaId } as any);
    vi.spyOn(prisma.class, 'findFirst').mockResolvedValue({ id: 'class-10-id', schoolId: schoolAlphaId } as any);
    vi.spyOn(prisma.section, 'findFirst').mockResolvedValue({ id: 'section-b-id', classId: 'class-10-id', schoolId: schoolAlphaId } as any);
    vi.spyOn(prisma.subject, 'findFirst').mockResolvedValue({ id: 'sub-math-id', schoolId: schoolAlphaId } as any);
    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue({ id: 'teacher-user-id', schoolId: schoolAlphaId } as any);

    // No section period clash
    vi.spyOn(prisma.timetableSlot, 'findFirst')
      .mockResolvedValueOnce(null) // section slot conflict: null
      .mockResolvedValueOnce({
        // teacher conflict: found!
        id: 'slot-clashing-id',
        dayOfWeek: 'MONDAY',
        startTime: '08:30',
        endTime: '09:15',
        subject: { name: 'Mathematics' },
        class: { name: 'Class 9' },
        section: { name: 'A' },
      } as any);

    const res = await request(app)
      .post('/api/timetable/slots')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId: 'session-2026-id',
        classId: 'class-10-id',
        sectionId: 'section-b-id',
        subjectId: 'sub-math-id',
        teacherId: 'teacher-user-id',
        dayOfWeek: 'MONDAY',
        periodNumber: 1,
        startTime: '08:30',
        endTime: '09:15',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Teacher conflict detected');
  });

  // 6. Cross-Tenant Isolation: School Beta user cannot query or mark School Alpha data
  it('Enforces strict tenant isolation: School Beta cannot mark attendance for School Alpha students', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'beta-admin-id',
      status: 'ACTIVE',
      schoolId: schoolBetaId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolBetaId,
      isActive: true,
    } as any);

    // Session check fails because session belongs to Alpha, not Beta
    vi.spyOn(prisma.academicSession, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.class, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.section, 'findFirst').mockResolvedValue(null);

    const res = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${schoolBetaAdminToken}`)
      .send({
        studentId: 'student-aarav-id',
        classId: 'class-10-id',
        sectionId: 'section-a-id',
        academicSessionId: 'session-2026-id',
        date: '2026-09-29',
        status: 'PRESENT',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Academic session not found or does not belong to your school');
  });
});
