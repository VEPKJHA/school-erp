"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentStatusSchema = exports.updateStudentSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
exports.createStudentSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, 'Class is required'),
    sectionId: zod_1.z.string().min(1, 'Section is required'),
    academicSessionId: zod_1.z.string().min(1, 'Academic session is required'),
    firstName: zod_1.z.string().min(1, 'First name is required').max(100),
    middleName: zod_1.z.string().max(100).optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(100),
    dateOfBirth: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Valid date of birth is required (YYYY-MM-DD)',
    }),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']),
    bloodGroup: zod_1.z.string().max(10).optional(),
    nationality: zod_1.z.string().default('Indian'),
    category: zod_1.z.string().optional(),
    religion: zod_1.z.string().optional(),
    aadhaarNumber: zod_1.z.string().max(50).optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    mobile: zod_1.z.string().max(50).optional(),
    photoUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    // Parent/Guardian (optional during quick creation)
    parent: zod_1.z
        .object({
        firstName: zod_1.z.string().min(1),
        lastName: zod_1.z.string().min(1),
        relationship: zod_1.z.enum(['FATHER', 'MOTHER', 'GUARDIAN']),
        phone: zod_1.z.string().min(5),
        email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
        occupation: zod_1.z.string().optional(),
    })
        .optional(),
    // Current Address
    currentAddress: zod_1.z
        .object({
        addressLine1: zod_1.z.string().min(1),
        addressLine2: zod_1.z.string().optional(),
        city: zod_1.z.string().min(1),
        state: zod_1.z.string().min(1),
        postalCode: zod_1.z.string().min(1),
        country: zod_1.z.string().default('India'),
    })
        .optional(),
});
exports.updateStudentSchema = zod_1.z.object({
    classId: zod_1.z.string().optional(),
    sectionId: zod_1.z.string().optional(),
    firstName: zod_1.z.string().min(1).max(100).optional(),
    middleName: zod_1.z.string().max(100).optional(),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    dateOfBirth: zod_1.z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    bloodGroup: zod_1.z.string().max(10).optional(),
    nationality: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    religion: zod_1.z.string().optional(),
    aadhaarNumber: zod_1.z.string().max(50).optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    mobile: zod_1.z.string().max(50).optional(),
    photoUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
exports.updateStudentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'APPLIED',
        'ADMITTED',
        'ACTIVE',
        'INACTIVE',
        'TRANSFERRED',
        'PASSED_OUT',
        'WITHDRAWN',
    ]),
    reason: zod_1.z.string().optional(),
});
//# sourceMappingURL=student.validation.js.map