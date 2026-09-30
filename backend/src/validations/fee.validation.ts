import { z } from 'zod';

export const createFeeHeadSchema = z.object({
  name: z.string().min(1, 'Fee head name is required').max(100),
  code: z.string().min(1, 'Fee head code is required').max(50),
  description: z.string().max(255).optional(),
  isRefundable: z.boolean().optional().default(false),
});

export const updateFeeHeadSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(255).optional(),
  isRefundable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const feeStructureItemInputSchema = z.object({
  feeHeadId: z.string().min(1, 'Fee head is required'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  dueDayOfMonth: z.number().int().min(1).max(31).optional().default(10),
});

export const createFeeStructureSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session is required'),
  classId: z.string().min(1, 'Class is required'),
  name: z.string().min(1, 'Fee structure name is required').max(150),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'TERMWISE', 'ANNUAL']).default('MONTHLY'),
  description: z.string().max(255).optional(),
  items: z.array(feeStructureItemInputSchema).min(1, 'At least one fee head item is required'),
});

export const updateFeeStructureSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'TERMWISE', 'ANNUAL']).optional(),
  description: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
  items: z.array(feeStructureItemInputSchema).optional(),
});

export const assignFeeStructureSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  feeStructureId: z.string().min(1, 'Fee structure is required'),
  academicSessionId: z.string().min(1, 'Academic session is required'),
  concessionAmount: z.number().min(0).optional().default(0),
  concessionPercent: z.number().min(0).max(100).optional().default(0),
  concessionReason: z.string().max(255).optional(),
});

export const bulkAssignFeeStructureSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().optional(),
  feeStructureId: z.string().min(1, 'Fee structure is required'),
  academicSessionId: z.string().min(1, 'Academic session is required'),
});

export const invoiceItemInputSchema = z.object({
  feeHeadId: z.string().min(1, 'Fee head is required'),
  description: z.string().max(255).optional(),
  amount: z.number().min(0, 'Amount cannot be negative'),
});

export const createInvoiceSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  academicSessionId: z.string().min(1, 'Academic session is required'),
  title: z.string().min(1, 'Invoice title is required').max(255),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid due date is required (YYYY-MM-DD)',
  }),
  discountAmount: z.number().min(0).optional().default(0),
  lateFeeAmount: z.number().min(0).optional().default(0),
  remarks: z.string().max(255).optional(),
  items: z.array(invoiceItemInputSchema).min(1, 'At least one invoice item is required'),
});

export const bulkGenerateInvoicesSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().optional(),
  academicSessionId: z.string().min(1, 'Academic session is required'),
  feeStructureId: z.string().min(1, 'Fee structure is required'),
  title: z.string().min(1, 'Invoice title is required').max(255),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid due date is required (YYYY-MM-DD)',
  }),
});

export const collectPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE', 'CARD', 'UPI']),
  paymentDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Valid payment date required' })
    .optional(),
  referenceNumber: z.string().max(100).optional(),
  remarks: z.string().max(255).optional(),
});

export type CreateFeeHeadInput = z.infer<typeof createFeeHeadSchema>;
export type UpdateFeeHeadInput = z.infer<typeof updateFeeHeadSchema>;
export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type UpdateFeeStructureInput = z.infer<typeof updateFeeStructureSchema>;
export type AssignFeeStructureInput = z.infer<typeof assignFeeStructureSchema>;
export type BulkAssignFeeStructureInput = z.infer<typeof bulkAssignFeeStructureSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type BulkGenerateInvoicesInput = z.infer<typeof bulkGenerateInvoicesSchema>;
export type CollectPaymentInput = z.infer<typeof collectPaymentSchema>;
