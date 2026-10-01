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
(0, vitest_1.describe)('Phase 5: Examination, Grading & Report Cards', () => {
    const schoolAlphaId = 'school-alpha-uuid';
    const schoolBetaId = 'school-beta-uuid';
    const teacherToken = (0, jwt_1.signAccessToken)({
        userId: 'teacher-user-id',
        email: 'teacher@schoolalpha.com',
        schoolId: schoolAlphaId,
        roleId: 'role-teacher-id',
        roleCode: 'TEACHER',
        permissions: [
            'exam:term:read',
            'exam:term:create',
            'exam:term:update',
            'exam:term:delete',
            'exam:schedule:read',
            'exam:schedule:create',
            'exam:schedule:update',
            'exam:schedule:delete',
            'exam:mark:read',
            'exam:mark:create',
            'exam:mark:update',
            'exam:report:read',
        ],
    });
    const schoolBetaAdminToken = (0, jwt_1.signAccessToken)({
        userId: 'beta-admin-id',
        email: 'admin@schoolbeta.com',
        schoolId: schoolBetaId,
        roleId: 'role-admin-id',
        roleCode: 'SCHOOL_ADMIN',
        permissions: [
            'exam:term:read',
            'exam:term:create',
            'exam:schedule:read',
            'exam:schedule:create',
            'exam:mark:read',
            'exam:mark:create',
            'exam:report:read',
        ],
    });
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    // 1. Create Exam Term
    (0, vitest_1.it)('Creates an exam term with valid session and date range', async () => {
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
        vitest_1.vi.spyOn(prisma_1.prisma.examTerm, 'findFirst').mockResolvedValue(null);
        vitest_1.vi.spyOn(prisma_1.prisma.examTerm, 'create').mockResolvedValue({
            id: 'term-midterm-id',
            schoolId: schoolAlphaId,
            academicSessionId: 'session-2026-id',
            name: 'Mid-Term Examination 2026',
            code: 'MID-2026',
            startDate: new Date('2026-10-10T00:00:00.000Z'),
            endDate: new Date('2026-10-25T00:00:00.000Z'),
            description: 'First semester mid term exams',
            isPublished: false,
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/exams/terms')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
            academicSessionId: 'session-2026-id',
            name: 'Mid-Term Examination 2026',
            code: 'MID-2026',
            startDate: '2026-10-10',
            endDate: '2026-10-25',
            description: 'First semester mid term exams',
        });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.code).toBe('MID-2026');
    });
    // 2. Reject duplicate Exam Term code in same session
    (0, vitest_1.it)('Rejects duplicate exam term code within the same academic session', async () => {
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
        vitest_1.vi.spyOn(prisma_1.prisma.examTerm, 'findFirst').mockResolvedValue({
            id: 'existing-term-id',
            code: 'MID-2026',
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/exams/terms')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
            academicSessionId: 'session-2026-id',
            name: 'Mid-Term Examination 2026',
            code: 'MID-2026',
            startDate: '2026-10-10',
            endDate: '2026-10-25',
        });
        (0, vitest_1.expect)(res.status).toBe(409);
        (0, vitest_1.expect)(res.body.message).toContain("already exists");
    });
    // 3. Create Exam Schedule Paper
    (0, vitest_1.it)('Creates an exam schedule paper with valid class and subject', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-user-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.examTerm, 'findFirst').mockResolvedValue({
            id: 'term-midterm-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findFirst').mockResolvedValue({
            id: 'class-10-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.subject, 'findFirst').mockResolvedValue({
            id: 'subject-math-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.examSchedule, 'findFirst').mockResolvedValue(null);
        vitest_1.vi.spyOn(prisma_1.prisma.examSchedule, 'create').mockResolvedValue({
            id: 'sched-math-10-id',
            schoolId: schoolAlphaId,
            examTermId: 'term-midterm-id',
            classId: 'class-10-id',
            subjectId: 'subject-math-id',
            examDate: new Date('2026-10-12T00:00:00.000Z'),
            startTime: '09:00',
            endTime: '12:00',
            maxMarks: 100,
            passMarks: 33,
            roomNumber: 'Hall A',
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/exams/schedules')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
            examTermId: 'term-midterm-id',
            classId: 'class-10-id',
            subjectId: 'subject-math-id',
            examDate: '2026-10-12',
            startTime: '09:00',
            endTime: '12:00',
            maxMarks: 100,
            passMarks: 33,
            roomNumber: 'Hall A',
        });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.maxMarks).toBe(100);
    });
    // 4. Reject pass marks exceeding max marks
    (0, vitest_1.it)('Rejects exam schedule creation when passMarks > maxMarks', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-user-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.examTerm, 'findFirst').mockResolvedValue({
            id: 'term-midterm-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findFirst').mockResolvedValue({
            id: 'class-10-id',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.subject, 'findFirst').mockResolvedValue({
            id: 'subject-math-id',
            schoolId: schoolAlphaId,
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/exams/schedules')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
            examTermId: 'term-midterm-id',
            classId: 'class-10-id',
            subjectId: 'subject-math-id',
            examDate: '2026-10-12',
            startTime: '09:00',
            endTime: '12:00',
            maxMarks: 50,
            passMarks: 60,
        });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.message).toContain('Passing marks cannot exceed maximum marks');
    });
    // 5. Reject marks exceeding maximum marks of paper
    (0, vitest_1.it)('Rejects marks entry when student obtained marks exceed paper maximum marks', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-user-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.examSchedule, 'findFirst').mockResolvedValue({
            id: 'sched-math-10-id',
            schoolId: schoolAlphaId,
            maxMarks: 100,
            passMarks: 33,
            gradingScaleId: null,
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/exams/schedules/sched-math-10-id/marks')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
            marks: [
                {
                    studentId: 'student-aarav-id',
                    marksObtained: 105, // Exceeds 100
                },
            ],
        });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.message).toContain('cannot exceed paper maximum marks');
    });
    // 6. Enter marks successfully and compute grade dynamically
    (0, vitest_1.it)('Enters marks, derives letter grades and handles absent status', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-user-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.examSchedule, 'findFirst').mockResolvedValue({
            id: 'sched-math-10-id',
            schoolId: schoolAlphaId,
            maxMarks: 100,
            passMarks: 33,
            gradingScaleId: null,
        });
        vitest_1.vi.spyOn(prisma_1.prisma, '$transaction').mockImplementation(async (callback) => {
            const txMock = {
                examMark: {
                    upsert: vitest_1.vi.fn().mockImplementation((args) => {
                        const studentId = args.where?.schoolId_examScheduleId_studentId?.studentId || args.create?.studentId;
                        return Promise.resolve({
                            id: `mark-${studentId}`,
                            ...args.create,
                        });
                    }),
                },
            };
            return callback(txMock);
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/exams/schedules/sched-math-10-id/marks')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({
            marks: [
                {
                    studentId: 'student-aarav-id',
                    marksObtained: 94,
                    remarks: 'Excellent performance',
                },
                {
                    studentId: 'student-diya-id',
                    isAbsent: true,
                    remarks: 'Medical leave',
                },
            ],
        });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.totalEntered).toBe(2);
        (0, vitest_1.expect)(res.body.data.marks[0].grade).toBe('A1');
        (0, vitest_1.expect)(res.body.data.marks[1].grade).toBe('AB');
    });
    // 7. Multi-tenant isolation: Beta school cannot access Alpha school marks
    (0, vitest_1.it)('Enforces multi-tenant isolation: School Beta cannot access School Alpha exam marks', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'beta-admin-id',
            status: 'ACTIVE',
            schoolId: schoolBetaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolBetaId,
            isActive: true,
        });
        // Alpha schedule query returns null when filtered by Beta schoolId
        vitest_1.vi.spyOn(prisma_1.prisma.examSchedule, 'findFirst').mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/exams/schedules/sched-alpha-math-id/marks')
            .set('Authorization', `Bearer ${schoolBetaAdminToken}`);
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body.message).toContain('not found in your school');
    });
    // 8. Generate Student Report Card with Attendance integration
    (0, vitest_1.it)('Generates comprehensive Student Report Card with term marks and Phase 4 attendance', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'teacher-user-id',
            status: 'ACTIVE',
            schoolId: schoolAlphaId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolAlphaId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.student, 'findFirst').mockResolvedValue({
            id: 'student-aarav-id',
            schoolId: schoolAlphaId,
            academicSessionId: 'session-2026-id',
            firstName: 'Aarav',
            lastName: 'Sharma',
            admissionNumber: 'ADM/2026/000001',
            studentCode: 'STU-2026-000001',
            rollNumber: '101',
            gender: 'MALE',
            dateOfBirth: new Date('2010-05-15T00:00:00.000Z'),
            class: { id: 'class-10-id', name: 'Class 10' },
            section: { id: 'section-a-id', name: 'A' },
            session: { id: 'session-2026-id', name: '2026-2027' },
            parents: [],
        });
        vitest_1.vi.spyOn(prisma_1.prisma.examTerm, 'findFirst').mockResolvedValue({
            id: 'term-midterm-id',
            schoolId: schoolAlphaId,
            name: 'Mid-Term Examination 2026',
            code: 'MID-2026',
            startDate: new Date('2026-10-10T00:00:00.000Z'),
            endDate: new Date('2026-10-25T00:00:00.000Z'),
            isPublished: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.examMark, 'findMany').mockResolvedValue([
            {
                id: 'mark-1',
                marksObtained: 95,
                grade: 'A1',
                isAbsent: false,
                isExempt: false,
                remarks: 'Outstanding',
                examSchedule: {
                    subjectId: 'sub-math-id',
                    maxMarks: 100,
                    passMarks: 33,
                    subject: {
                        name: 'Mathematics',
                        code: 'MATH101',
                        type: 'THEORY',
                    },
                },
            },
            {
                id: 'mark-2',
                marksObtained: 85,
                grade: 'A2',
                isAbsent: false,
                isExempt: false,
                remarks: 'Very Good',
                examSchedule: {
                    subjectId: 'sub-sci-id',
                    maxMarks: 100,
                    passMarks: 33,
                    subject: {
                        name: 'Science',
                        code: 'SCI101',
                        type: 'THEORY',
                    },
                },
            },
        ]);
        // Mock AttendanceRepository for student term stats
        vitest_1.vi.spyOn(prisma_1.prisma.studentAttendance, 'count').mockResolvedValue(50);
        vitest_1.vi.spyOn(prisma_1.prisma.studentAttendance, 'groupBy').mockResolvedValue([
            { status: 'PRESENT', _count: { status: 45 } },
            { status: 'ABSENT', _count: { status: 3 } },
            { status: 'LATE', _count: { status: 2 } },
        ]);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/exams/students/student-aarav-id/report-card?examTermId=term-midterm-id')
            .set('Authorization', `Bearer ${teacherToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.student.firstName).toBe('Aarav');
        (0, vitest_1.expect)(res.body.data.summary.totalMaxMarks).toBe(200);
        (0, vitest_1.expect)(res.body.data.summary.totalObtainedMarks).toBe(180);
        (0, vitest_1.expect)(res.body.data.summary.overallPercentage).toBe(90);
        (0, vitest_1.expect)(res.body.data.summary.overallGrade).toBe('A1');
        (0, vitest_1.expect)(res.body.data.summary.finalResult).toBe('PASSED');
        (0, vitest_1.expect)(res.body.data.attendance.totalDays).toBe(50);
    });
});
//# sourceMappingURL=exam_engine.test.js.map