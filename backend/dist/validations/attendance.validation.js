"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceValidation = exports.bulkMarkAttendanceSchema = exports.markAttendanceSchema = void 0;
const zod_1 = require("zod");
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
exports.markAttendanceSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, 'Student ID is required'),
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    sectionId: zod_1.z.string().min(1, 'Section ID is required'),
    academicSessionId: zod_1.z.string().min(1, 'Academic session ID is required'),
    date: zod_1.z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
    status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED'], {
        errorMap: () => ({ message: 'Status must be PRESENT, ABSENT, LATE, HALF_DAY, or EXCUSED' }),
    }),
    remarks: zod_1.z.string().max(255).optional(),
});
exports.bulkMarkAttendanceSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    sectionId: zod_1.z.string().min(1, 'Section ID is required'),
    academicSessionId: zod_1.z.string().min(1, 'Academic session ID is required'),
    date: zod_1.z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
    records: zod_1.z
        .array(zod_1.z.object({
        studentId: zod_1.z.string().min(1, 'Student ID is required'),
        status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED']),
        remarks: zod_1.z.string().max(255).optional(),
    }))
        .min(1, 'At least one student attendance record is required'),
});
exports.AttendanceValidation = {
    markAttendance: exports.markAttendanceSchema,
    bulkMarkAttendance: exports.bulkMarkAttendanceSchema,
};
//# sourceMappingURL=attendance.validation.js.map