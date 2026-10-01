"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamValidation = exports.enterMarksSchema = exports.studentMarkEntrySchema = exports.updateExamScheduleSchema = exports.createExamScheduleSchema = exports.createGradingScaleSchema = exports.gradingScaleRuleSchema = exports.updateExamTermSchema = exports.createExamTermSchema = void 0;
const zod_1 = require("zod");
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
exports.createExamTermSchema = zod_1.z.object({
    academicSessionId: zod_1.z.string().min(1, 'Academic session ID is required'),
    name: zod_1.z.string().min(2, 'Term name must be at least 2 characters').max(100),
    code: zod_1.z.string().min(2, 'Term code must be at least 2 characters').max(50).toUpperCase(),
    startDate: zod_1.z.string().regex(dateRegex, 'Start date must be in YYYY-MM-DD format'),
    endDate: zod_1.z.string().regex(dateRegex, 'End date must be in YYYY-MM-DD format'),
    description: zod_1.z.string().max(255).optional(),
});
exports.updateExamTermSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    code: zod_1.z.string().min(2).max(50).toUpperCase().optional(),
    startDate: zod_1.z.string().regex(dateRegex).optional(),
    endDate: zod_1.z.string().regex(dateRegex).optional(),
    description: zod_1.z.string().max(255).optional(),
    isPublished: zod_1.z.boolean().optional(),
});
exports.gradingScaleRuleSchema = zod_1.z.object({
    grade: zod_1.z.string().min(1).max(10),
    minPercentage: zod_1.z.number().min(0).max(100),
    maxPercentage: zod_1.z.number().min(0).max(100),
    gradePoint: zod_1.z.number().min(0).max(10).optional(),
    description: zod_1.z.string().max(100).optional(),
    isPassing: zod_1.z.boolean().default(true),
});
exports.createGradingScaleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Grading scale name is required').max(100),
    description: zod_1.z.string().max(255).optional(),
    rules: zod_1.z.array(exports.gradingScaleRuleSchema).min(1, 'At least one grade rule is required'),
});
exports.createExamScheduleSchema = zod_1.z.object({
    examTermId: zod_1.z.string().min(1, 'Exam term ID is required'),
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID is required'),
    gradingScaleId: zod_1.z.string().min(1).optional().nullable(),
    examDate: zod_1.z.string().regex(dateRegex, 'Exam date must be in YYYY-MM-DD format'),
    startTime: zod_1.z.string().regex(timeRegex, 'Start time must be in HH:mm 24-hr format'),
    endTime: zod_1.z.string().regex(timeRegex, 'End time must be in HH:mm 24-hr format'),
    maxMarks: zod_1.z.number().positive('Maximum marks must be positive'),
    passMarks: zod_1.z.number().nonnegative('Passing marks cannot be negative'),
    roomNumber: zod_1.z.string().max(50).optional().nullable(),
});
exports.updateExamScheduleSchema = zod_1.z.object({
    examDate: zod_1.z.string().regex(dateRegex).optional(),
    startTime: zod_1.z.string().regex(timeRegex).optional(),
    endTime: zod_1.z.string().regex(timeRegex).optional(),
    maxMarks: zod_1.z.number().positive().optional(),
    passMarks: zod_1.z.number().nonnegative().optional(),
    roomNumber: zod_1.z.string().max(50).optional().nullable(),
    gradingScaleId: zod_1.z.string().min(1).optional().nullable(),
});
exports.studentMarkEntrySchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, 'Student ID is required'),
    marksObtained: zod_1.z.number().min(0).optional().nullable(),
    isAbsent: zod_1.z.boolean().default(false),
    isExempt: zod_1.z.boolean().default(false),
    remarks: zod_1.z.string().max(255).optional(),
});
exports.enterMarksSchema = zod_1.z.object({
    marks: zod_1.z.array(exports.studentMarkEntrySchema).min(1, 'At least one student mark entry is required'),
});
exports.ExamValidation = {
    createExamTerm: exports.createExamTermSchema,
    updateExamTerm: exports.updateExamTermSchema,
    createGradingScale: exports.createGradingScaleSchema,
    createExamSchedule: exports.createExamScheduleSchema,
    updateExamSchedule: exports.updateExamScheduleSchema,
    enterMarks: exports.enterMarksSchema,
};
//# sourceMappingURL=exam.validation.js.map