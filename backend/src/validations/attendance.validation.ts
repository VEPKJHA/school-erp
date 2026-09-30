import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const markAttendanceSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED'], {
    errorMap: () => ({ message: 'Status must be PRESENT, ABSENT, LATE, HALF_DAY, or EXCUSED' }),
  }),
  remarks: z.string().max(255).optional(),
});

export const bulkMarkAttendanceSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED']),
        remarks: z.string().max(255).optional(),
      })
    )
    .min(1, 'At least one student attendance record is required'),
});

export const AttendanceValidation = {
  markAttendance: markAttendanceSchema,
  bulkMarkAttendance: bulkMarkAttendanceSchema,
};
