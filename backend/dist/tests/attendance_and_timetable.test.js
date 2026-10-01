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
(0, vitest_1.describe)('Phase 4: Attendance & Timetable Management', () => {
    const schoolAlphaId = 'school-alpha-uuid';
    const schoolBetaId = 'school-beta-uuid';
    const teacherToken = (0, jwt_1.signAccessToken)({
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
    const schoolBetaAdminToken = (0, jwt_1.signAccessToken)({
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
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    // 1. Mark individual student attendance
    (0, vitest_1.it)('Marks individual student attendance with valid ownership and hierarchy', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-user-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.academicSession, 'findFirst').mockResolvedValue({
            id: 'session-2026-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findFirst').mockResolvedValue({
            id: 'class-10-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.section, 'findFirst').mockResolvedValue({
            id: 'section-a-id',
            classId: 'class-10-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.student, 'findFirst').mockResolvedValue({
            id: 'student-aarav-id',
            schoolId: schoolAlphaId,
            classId: 'class-10-id',
            sectionId: 'section-a-id',
        });
        vitest_1.vi.spyOn(prisma_1.prisma.studentAttendance, 'upsert').mockResolvedValue({
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
        });
        const res = await (0, supertest_1.default)(app_1.default)
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
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.status).toBe('PRESENT');
    });
    // 2. Bulk mark section attendance in a transaction
    (0, vitest_1.it)('Bulk marks section attendance in an atomic transaction', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-user-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.academicSession, 'findFirst').mockResolvedValue({
            id: 'session-2026-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findFirst').mockResolvedValue({
            id: 'class-10-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.section, 'findFirst').mockResolvedValue({
            id: 'section-a-id',
            classId: 'class-10-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.student, 'findMany').mockResolvedValue([
            { id: 'student-aarav-id' },
            { id: 'student-diya-id' },
        ]);
        vitest_1.vi.spyOn(prisma_1.prisma, '$transaction').mockImplementation(async (callback) => {
            const mockTx = {
                studentAttendance: {
                    upsert: vitest_1.vi.fn().mockImplementation((args) => Promise.resolve(args.create)),
                },
            };
            return callback(mockTx);
        });
        const res = await (0, supertest_1.default)(app_1.default)
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
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.totalMarked).toBe(2);
    });
    // 3. Daily Summary Aggregation
    (0, vitest_1.it)('Returns aggregated daily attendance summary counts', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-user-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.studentAttendance, 'groupBy').mockResolvedValue([
            { status: 'PRESENT', _count: { status: 35 } },
            { status: 'ABSENT', _count: { status: 3 } },
            { status: 'LATE', _count: { status: 2 } },
        ]);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/attendance/summary/daily?date=2026-09-29')
            .set('Authorization', `Bearer ${teacherToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.PRESENT).toBe(35);
        (0, vitest_1.expect)(res.body.data.ABSENT).toBe(3);
        (0, vitest_1.expect)(res.body.data.LATE).toBe(2);
        (0, vitest_1.expect)(res.body.data.TOTAL).toBe(40);
    });
    // 4. Create Subject
    (0, vitest_1.it)('Creates a new subject and rejects duplicate code', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-user-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.subject, 'findFirst')
            .mockResolvedValueOnce(null) // first check: not found
            .mockResolvedValueOnce({ id: 'sub-existing-id', code: 'MATH' }); // second check: found
        vitest_1.vi.spyOn(prisma_1.prisma.subject, 'create').mockResolvedValue({
            id: 'sub-math-id',
            schoolId: schoolAlphaId,
            name: 'Mathematics',
            code: 'MATH',
            type: 'THEORY',
            isActive: true,
        });
        // 1st call: success
        const res1 = await (0, supertest_1.default)(app_1.default)
            .post('/api/timetable/subjects')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
            name: 'Mathematics',
            code: 'MATH',
            type: 'THEORY',
        });
        (0, vitest_1.expect)(res1.status).toBe(201);
        (0, vitest_1.expect)(res1.body.data.code).toBe('MATH');
        // 2nd call: conflict
        const res2 = await (0, supertest_1.default)(app_1.default)
            .post('/api/timetable/subjects')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
            name: 'Mathematics',
            code: 'MATH',
            type: 'THEORY',
        });
        (0, vitest_1.expect)(res2.status).toBe(409);
        (0, vitest_1.expect)(res2.body.message).toContain('already registered');
    });
    // 5. Timetable Clash Detection: Teacher overlapping slot rejection
    (0, vitest_1.it)('Rejects timetable slot creation when teacher has an overlapping schedule conflict', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-user-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.academicSession, 'findFirst').mockResolvedValue({ id: 'session-2026-id', schoolId: schoolAlphaId });
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findFirst').mockResolvedValue({ id: 'class-10-id', schoolId: schoolAlphaId });
        vitest_1.vi.spyOn(prisma_1.prisma.section, 'findFirst').mockResolvedValue({ id: 'section-b-id', classId: 'class-10-id', schoolId: schoolAlphaId });
        vitest_1.vi.spyOn(prisma_1.prisma.subject, 'findFirst').mockResolvedValue({ id: 'sub-math-id', schoolId: schoolAlphaId });
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findFirst').mockResolvedValue({ id: 'teacher-user-id', schoolId: schoolAlphaId });
        // No section period clash
        vitest_1.vi.spyOn(prisma_1.prisma.timetableSlot, 'findFirst')
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
        });
        const res = await (0, supertest_1.default)(app_1.default)
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
        (0, vitest_1.expect)(res.status).toBe(409);
        (0, vitest_1.expect)(res.body.message).toContain('Teacher conflict detected');
    });
    // 6. Cross-Tenant Isolation: School Beta user cannot query or mark School Alpha data
    (0, vitest_1.it)('Enforces strict tenant isolation: School Beta cannot mark attendance for School Alpha students', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'beta-admin-id',
            status: 'ACTIVE',
            schoolId: schoolBetaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolBetaId,
            isActive: true,
        });
        // Session check fails because session belongs to Alpha, not Beta
        vitest_1.vi.spyOn(prisma_1.prisma.academicSession, 'findFirst').mockResolvedValue(null);
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findFirst').mockResolvedValue(null);
        vitest_1.vi.spyOn(prisma_1.prisma.section, 'findFirst').mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default)
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
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body.message).toContain('Academic session not found or does not belong to your school');
    });
});
//# sourceMappingURL=attendance_and_timetable.test.js.map