import { z } from 'zod';

export const createStudentSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  academicSessionId: z.string().min(1, 'Academic session is required'),

  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid date of birth is required (YYYY-MM-DD)',
  }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().max(10).optional(),
  nationality: z.string().default('Indian'),
  category: z.string().optional(),
  religion: z.string().optional(),
  aadhaarNumber: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().max(50).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),

  // Parent/Guardian (optional during quick creation)
  parent: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      relationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']),
      phone: z.string().min(5),
      email: z.string().email().optional().or(z.literal('')),
      occupation: z.string().optional(),
    })
    .optional(),

  // Current Address
  currentAddress: z
    .object({
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().default('India'),
    })
    .optional(),
});

export const updateStudentSchema = z.object({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  firstName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.string().max(10).optional(),
  nationality: z.string().optional(),
  category: z.string().optional(),
  religion: z.string().optional(),
  aadhaarNumber: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().max(50).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
});

export const updateStudentStatusSchema = z.object({
  status: z.enum([
    'APPLIED',
    'ADMITTED',
    'ACTIVE',
    'INACTIVE',
    'TRANSFERRED',
    'PASSED_OUT',
    'WITHDRAWN',
  ]),
  reason: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type UpdateStudentStatusInput = z.infer<typeof updateStudentStatusSchema>;
