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
const sequenceGenerator_1 = require("../utils/sequenceGenerator");
(0, vitest_1.describe)('Student & Admission Lifecycle Workflow', () => {
    const schoolId = 'school-alpha-uuid';
    const adminToken = (0, jwt_1.signAccessToken)({
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
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('Generates human-readable sequential numbers without collisions', async () => {
        const mockTx = {
            sequenceCounter: {
                upsert: vitest_1.vi.fn().mockResolvedValue({ lastValue: 42 }),
            },
        };
        const admNum = await sequenceGenerator_1.SequenceGenerator.generateAdmissionNumber(schoolId, 2026, mockTx);
        (0, vitest_1.expect)(admNum).toBe('ADM/2026/000042');
        const stuCode = await sequenceGenerator_1.SequenceGenerator.generateStudentCode(schoolId, 2026, mockTx);
        (0, vitest_1.expect)(stuCode).toBe('STU-2026-000042');
        const appNum = await sequenceGenerator_1.SequenceGenerator.generateApplicationNumber(schoolId, 2026, mockTx);
        (0, vitest_1.expect)(appNum).toBe('APP/2026/000042');
    });
    (0, vitest_1.it)('Creates student and validates ownership chain of class and section', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'admin-user-id',
            status: 'ACTIVE',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolId,
            isActive: true,
        });
        // Section belongs to a DIFFERENT class -> should reject
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findFirst').mockResolvedValue({
            id: 'class-1',
            name: 'Class 1',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.section, 'findFirst').mockResolvedValue({
            id: 'section-2',
            classId: 'different-class-id', // mismatch!
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.academicSession, 'findFirst').mockResolvedValue({
            id: 'session-1',
            schoolId,
        });
        const res = await (0, supertest_1.default)(app_1.default)
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
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(res.body.message).toMatch(/does not belong to the selected class/i);
    });
    (0, vitest_1.it)('Submits admission application with generated application number', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'admin-user-id',
            status: 'ACTIVE',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.class, 'findFirst').mockResolvedValue({
            id: 'class-1',
            name: 'Class 1',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.academicSession, 'findFirst').mockResolvedValue({
            id: 'session-1',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.sequenceCounter, 'upsert').mockResolvedValue({
            lastValue: 5,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.admission, 'create').mockResolvedValue({
            id: 'admission-1',
            applicationNumber: 'APP/2026/000005',
            firstName: 'Rohan',
            lastName: 'Verma',
            status: 'SUBMITTED',
            session: { name: '2026-27' },
            applyingClass: { name: 'Class 1' },
        });
        vitest_1.vi.spyOn(prisma_1.prisma.auditLog, 'create').mockResolvedValue({});
        const res = await (0, supertest_1.default)(app_1.default)
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
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.applicationNumber).toBe('APP/2026/000005');
    });
    (0, vitest_1.it)('Atomically approves admission application and creates active student', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'admin-user-id',
            status: 'ACTIVE',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolId,
            isActive: true,
        });
        const mockTx = {
            admission: {
                findFirst: vitest_1.vi.fn().mockResolvedValue({
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
                update: vitest_1.vi.fn().mockResolvedValue({
                    id: 'admission-1',
                    status: 'APPROVED',
                    assignedSectionId: 'sec-1',
                }),
            },
            section: {
                findFirst: vitest_1.vi.fn().mockResolvedValue({
                    id: 'sec-1',
                    classId: 'class-1',
                    schoolId,
                    name: 'A',
                }),
            },
            sequenceCounter: {
                upsert: vitest_1.vi.fn().mockResolvedValue({ lastValue: 10 }),
            },
            student: {
                create: vitest_1.vi.fn().mockResolvedValue({
                    id: 'student-created-1',
                    admissionNumber: 'ADM/2026/000010',
                    studentCode: 'STU-2026-000010',
                    firstName: 'Rohan',
                    lastName: 'Verma',
                    status: 'ACTIVE',
                }),
            },
            parent: {
                findFirst: vitest_1.vi.fn().mockResolvedValue(null),
                create: vitest_1.vi.fn().mockResolvedValue({ id: 'parent-1', phone: '+91 98765 43210' }),
            },
            studentParent: {
                create: vitest_1.vi.fn().mockResolvedValue({}),
            },
            studentAddress: {
                create: vitest_1.vi.fn().mockResolvedValue({}),
            },
            studentDocument: {
                updateMany: vitest_1.vi.fn().mockResolvedValue({ count: 0 }),
            },
        };
        vitest_1.vi.spyOn(prisma_1.prisma, '$transaction').mockImplementation(async (callback) => {
            return callback(mockTx);
        });
        vitest_1.vi.spyOn(prisma_1.prisma.auditLog, 'create').mockResolvedValue({});
        const res = await (0, supertest_1.default)(app_1.default)
            .patch('/api/admissions/admission-1/approve')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            assignedSectionId: 'sec-1',
            remarks: 'Documents verified and approved',
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(mockTx.student.create).toHaveBeenCalled();
        (0, vitest_1.expect)(mockTx.admission.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            data: vitest_1.expect.objectContaining({ status: 'APPROVED' }),
        }));
    });
});
//# sourceMappingURL=student_and_admission.test.js.map