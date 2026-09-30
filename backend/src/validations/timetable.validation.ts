import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Subject name must be at least 2 characters').max(100),
  code: z.string().min(2, 'Subject code must be at least 2 characters').max(50).toUpperCase(),
  type: z.enum(['THEORY', 'PRACTICAL', 'BOTH']).default('THEORY'),
  description: z.string().max(255).optional(),
});

export const updateSubjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(50).toUpperCase().optional(),
  type: z.enum(['THEORY', 'PRACTICAL', 'BOTH']).optional(),
  description: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

export const assignClassSubjectSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  isElective: z.boolean().default(false),
});

export const createTimetableSlotSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  teacherId: z.string().min(1).optional().nullable(),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  periodNumber: z.number().int().min(1, 'Period must be at least 1').max(12, 'Period cannot exceed 12'),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm 24-hr format (e.g. 08:30)'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm 24-hr format (e.g. 09:15)'),
  roomNumber: z.string().max(50).optional().nullable(),
});

export const updateTimetableSlotSchema = z.object({
  subjectId: z.string().min(1).optional(),
  teacherId: z.string().min(1).optional().nullable(),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm 24-hr format').optional(),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm 24-hr format').optional(),
  roomNumber: z.string().max(50).optional().nullable(),
});

export const TimetableValidation = {
  createSubject: createSubjectSchema,
  updateSubject: updateSubjectSchema,
  assignClassSubject: assignClassSubjectSchema,
  createTimetableSlot: createTimetableSlotSchema,
  updateTimetableSlot: updateTimetableSlotSchema,
};
