import { z } from 'zod';

export const createAdmissionSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session is required'),
  applyingClassId: z.string().min(1, 'Applying class is required'),
  status: z
    .enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_PENDING'])
    .optional()
    .default('SUBMITTED'),
  remarks: z.string().max(500).optional(),

  // Applicant Profile
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid date of birth required (YYYY-MM-DD)',
  }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().max(10).optional(),
  nationality: z.string().default('Indian'),
  category: z.string().optional(),
  religion: z.string().optional(),
  aadhaarNumber: z.string().max(50).optional(),

  // Parent / Guardian Details
  parentName: z.string().min(1, 'Parent/Guardian name is required').max(150),
  parentRelation: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']).default('FATHER'),
  parentMobile: z.string().min(5, 'Parent contact number is required').max(50),
  parentEmail: z.string().email().optional().or(z.literal('')),
  parentOccupation: z.string().max(100).optional(),

  // Address
  addressLine1: z.string().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
});

export const approveAdmissionSchema = z.object({
  assignedSectionId: z.string().min(1, 'Section allotment is required to finalize admission'),
  remarks: z.string().max(500).optional(),
});

export const rejectAdmissionSchema = z.object({
  rejectionReason: z.string().min(3, 'Rejection reason must be provided').max(500),
});

export type CreateAdmissionInput = z.infer<typeof createAdmissionSchema>;
export type ApproveAdmissionInput = z.infer<typeof approveAdmissionSchema>;
export type RejectAdmissionInput = z.infer<typeof rejectAdmissionSchema>;
