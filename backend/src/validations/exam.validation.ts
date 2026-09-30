import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createExamTermSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  name: z.string().min(2, 'Term name must be at least 2 characters').max(100),
  code: z.string().min(2, 'Term code must be at least 2 characters').max(50).toUpperCase(),
  startDate: z.string().regex(dateRegex, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(dateRegex, 'End date must be in YYYY-MM-DD format'),
  description: z.string().max(255).optional(),
});

export const updateExamTermSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(50).toUpperCase().optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
  description: z.string().max(255).optional(),
  isPublished: z.boolean().optional(),
});

export const gradingScaleRuleSchema = z.object({
  grade: z.string().min(1).max(10),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  gradePoint: z.number().min(0).max(10).optional(),
  description: z.string().max(100).optional(),
  isPassing: z.boolean().default(true),
});

export const createGradingScaleSchema = z.object({
  name: z.string().min(2, 'Grading scale name is required').max(100),
  description: z.string().max(255).optional(),
  rules: z.array(gradingScaleRuleSchema).min(1, 'At least one grade rule is required'),
});

export const createExamScheduleSchema = z.object({
  examTermId: z.string().min(1, 'Exam term ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  gradingScaleId: z.string().min(1).optional().nullable(),
  examDate: z.string().regex(dateRegex, 'Exam date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm 24-hr format'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm 24-hr format'),
  maxMarks: z.number().positive('Maximum marks must be positive'),
  passMarks: z.number().nonnegative('Passing marks cannot be negative'),
  roomNumber: z.string().max(50).optional().nullable(),
});

export const updateExamScheduleSchema = z.object({
  examDate: z.string().regex(dateRegex).optional(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  maxMarks: z.number().positive().optional(),
  passMarks: z.number().nonnegative().optional(),
  roomNumber: z.string().max(50).optional().nullable(),
  gradingScaleId: z.string().min(1).optional().nullable(),
});

export const studentMarkEntrySchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  marksObtained: z.number().min(0).optional().nullable(),
  isAbsent: z.boolean().default(false),
  isExempt: z.boolean().default(false),
  remarks: z.string().max(255).optional(),
});

export const enterMarksSchema = z.object({
  marks: z.array(studentMarkEntrySchema).min(1, 'At least one student mark entry is required'),
});

export const ExamValidation = {
  createExamTerm: createExamTermSchema,
  updateExamTerm: updateExamTermSchema,
  createGradingScale: createGradingScaleSchema,
  createExamSchedule: createExamScheduleSchema,
  updateExamSchedule: updateExamScheduleSchema,
  enterMarks: enterMarksSchema,
};
