"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectPaymentSchema = exports.bulkGenerateInvoicesSchema = exports.createInvoiceSchema = exports.invoiceItemInputSchema = exports.bulkAssignFeeStructureSchema = exports.assignFeeStructureSchema = exports.updateFeeStructureSchema = exports.createFeeStructureSchema = exports.feeStructureItemInputSchema = exports.updateFeeHeadSchema = exports.createFeeHeadSchema = void 0;
const zod_1 = require("zod");
exports.createFeeHeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Fee head name is required').max(100),
    code: zod_1.z.string().min(1, 'Fee head code is required').max(50),
    description: zod_1.z.string().max(255).optional(),
    isRefundable: zod_1.z.boolean().optional().default(false),
});
exports.updateFeeHeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    code: zod_1.z.string().min(1).max(50).optional(),
    description: zod_1.z.string().max(255).optional(),
    isRefundable: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.feeStructureItemInputSchema = zod_1.z.object({
    feeHeadId: zod_1.z.string().min(1, 'Fee head is required'),
    amount: zod_1.z.number().min(0, 'Amount cannot be negative'),
    dueDayOfMonth: zod_1.z.number().int().min(1).max(31).optional().default(10),
});
exports.createFeeStructureSchema = zod_1.z.object({
    academicSessionId: zod_1.z.string().min(1, 'Academic session is required'),
    classId: zod_1.z.string().min(1, 'Class is required'),
    name: zod_1.z.string().min(1, 'Fee structure name is required').max(150),
    frequency: zod_1.z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'TERMWISE', 'ANNUAL']).default('MONTHLY'),
    description: zod_1.z.string().max(255).optional(),
    items: zod_1.z.array(exports.feeStructureItemInputSchema).min(1, 'At least one fee head item is required'),
});
exports.updateFeeStructureSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(150).optional(),
    frequency: zod_1.z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'TERMWISE', 'ANNUAL']).optional(),
    description: zod_1.z.string().max(255).optional(),
    isActive: zod_1.z.boolean().optional(),
    items: zod_1.z.array(exports.feeStructureItemInputSchema).optional(),
});
exports.assignFeeStructureSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, 'Student is required'),
    feeStructureId: zod_1.z.string().min(1, 'Fee structure is required'),
    academicSessionId: zod_1.z.string().min(1, 'Academic session is required'),
    concessionAmount: zod_1.z.number().min(0).optional().default(0),
    concessionPercent: zod_1.z.number().min(0).max(100).optional().default(0),
    concessionReason: zod_1.z.string().max(255).optional(),
});
exports.bulkAssignFeeStructureSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, 'Class is required'),
    sectionId: zod_1.z.string().optional(),
    feeStructureId: zod_1.z.string().min(1, 'Fee structure is required'),
    academicSessionId: zod_1.z.string().min(1, 'Academic session is required'),
});
exports.invoiceItemInputSchema = zod_1.z.object({
    feeHeadId: zod_1.z.string().min(1, 'Fee head is required'),
    description: zod_1.z.string().max(255).optional(),
    amount: zod_1.z.number().min(0, 'Amount cannot be negative'),
});
exports.createInvoiceSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, 'Student is required'),
    academicSessionId: zod_1.z.string().min(1, 'Academic session is required'),
    title: zod_1.z.string().min(1, 'Invoice title is required').max(255),
    dueDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Valid due date is required (YYYY-MM-DD)',
    }),
    discountAmount: zod_1.z.number().min(0).optional().default(0),
    lateFeeAmount: zod_1.z.number().min(0).optional().default(0),
    remarks: zod_1.z.string().max(255).optional(),
    items: zod_1.z.array(exports.invoiceItemInputSchema).min(1, 'At least one invoice item is required'),
});
exports.bulkGenerateInvoicesSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, 'Class is required'),
    sectionId: zod_1.z.string().optional(),
    academicSessionId: zod_1.z.string().min(1, 'Academic session is required'),
    feeStructureId: zod_1.z.string().min(1, 'Fee structure is required'),
    title: zod_1.z.string().min(1, 'Invoice title is required').max(255),
    dueDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Valid due date is required (YYYY-MM-DD)',
    }),
});
exports.collectPaymentSchema = zod_1.z.object({
    invoiceId: zod_1.z.string().min(1, 'Invoice ID is required'),
    amount: zod_1.z.number().positive('Payment amount must be greater than zero'),
    paymentMode: zod_1.z.enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE', 'CARD', 'UPI']),
    paymentDate: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: 'Valid payment date required' })
        .optional(),
    referenceNumber: zod_1.z.string().max(100).optional(),
    remarks: zod_1.z.string().max(255).optional(),
});
//# sourceMappingURL=fee.validation.js.map