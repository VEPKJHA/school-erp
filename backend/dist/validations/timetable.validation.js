"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableValidation = exports.updateTimetableSlotSchema = exports.createTimetableSlotSchema = exports.assignClassSubjectSchema = exports.updateSubjectSchema = exports.createSubjectSchema = void 0;
const zod_1 = require("zod");
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
exports.createSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Subject name must be at least 2 characters').max(100),
    code: zod_1.z.string().min(2, 'Subject code must be at least 2 characters').max(50).toUpperCase(),
    type: zod_1.z.enum(['THEORY', 'PRACTICAL', 'BOTH']).default('THEORY'),
    description: zod_1.z.string().max(255).optional(),
});
exports.updateSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    code: zod_1.z.string().min(2).max(50).toUpperCase().optional(),
    type: zod_1.z.enum(['THEORY', 'PRACTICAL', 'BOTH']).optional(),
    description: zod_1.z.string().max(255).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.assignClassSubjectSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID is required'),
    isElective: zod_1.z.boolean().default(false),
});
exports.createTimetableSlotSchema = zod_1.z.object({
    academicSessionId: zod_1.z.string().min(1, 'Academic session ID is required'),
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    sectionId: zod_1.z.string().min(1, 'Section ID is required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID is required'),
    teacherId: zod_1.z.string().min(1).optional().nullable(),
    dayOfWeek: zod_1.z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    periodNumber: zod_1.z.number().int().min(1, 'Period must be at least 1').max(12, 'Period cannot exceed 12'),
    startTime: zod_1.z.string().regex(timeRegex, 'Start time must be in HH:mm 24-hr format (e.g. 08:30)'),
    endTime: zod_1.z.string().regex(timeRegex, 'End time must be in HH:mm 24-hr format (e.g. 09:15)'),
    roomNumber: zod_1.z.string().max(50).optional().nullable(),
});
exports.updateTimetableSlotSchema = zod_1.z.object({
    subjectId: zod_1.z.string().min(1).optional(),
    teacherId: zod_1.z.string().min(1).optional().nullable(),
    startTime: zod_1.z.string().regex(timeRegex, 'Start time must be in HH:mm 24-hr format').optional(),
    endTime: zod_1.z.string().regex(timeRegex, 'End time must be in HH:mm 24-hr format').optional(),
    roomNumber: zod_1.z.string().max(50).optional().nullable(),
});
exports.TimetableValidation = {
    createSubject: exports.createSubjectSchema,
    updateSubject: exports.updateSubjectSchema,
    assignClassSubject: exports.assignClassSubjectSchema,
    createTimetableSlot: exports.createTimetableSlotSchema,
    updateTimetableSlot: exports.updateTimetableSlotSchema,
};
//# sourceMappingURL=timetable.validation.js.map