import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100),
  code: z.string().min(1, 'Class code is required').max(50),
  numericOrder: z.number().int('Numeric order must be an integer'),
  description: z.string().max(255).optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(50).optional(),
  numericOrder: z.number().int().optional(),
  description: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

export const createSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required (e.g. A, B)').max(50),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').default(40),
  roomNumber: z.string().max(50).optional(),
});

export const updateSectionSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  capacity: z.number().int().min(1).optional(),
  roomNumber: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
