import { z } from 'zod';

export const createAcademicSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(50),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid start date required',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid end date required',
  }),
  isCurrent: z.boolean().optional().default(false),
  status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional().default('ACTIVE'),
});

export const updateAcademicSessionSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});

export type CreateAcademicSessionInput = z.infer<typeof createAcademicSessionSchema>;
export type UpdateAcademicSessionInput = z.infer<typeof updateAcademicSessionSchema>;
