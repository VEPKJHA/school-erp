import { Router } from 'express';
import { FeeController } from '../controllers/fee.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { PERMISSIONS } from '../constants/permissions';
import {
  createFeeHeadSchema,
  updateFeeHeadSchema,
  createFeeStructureSchema,
  assignFeeStructureSchema,
  bulkAssignFeeStructureSchema,
  createInvoiceSchema,
  bulkGenerateInvoicesSchema,
  collectPaymentSchema,
} from '../validations/fee.validation';

const router = Router();

router.use(authenticate, enforceTenant);

// Fee Heads
router.get('/heads', requirePermission(PERMISSIONS.FEE_HEAD_READ), FeeController.getFeeHeads);
router.post(
  '/heads',
  requirePermission(PERMISSIONS.FEE_HEAD_CREATE),
  validate(createFeeHeadSchema),
  FeeController.createFeeHead
);
router.put(
  '/heads/:id',
  requirePermission(PERMISSIONS.FEE_HEAD_UPDATE),
  validate(updateFeeHeadSchema),
  FeeController.updateFeeHead
);

// Fee Structures
router.get(
  '/structures',
  requirePermission(PERMISSIONS.FEE_STRUCTURE_READ),
  FeeController.getFeeStructures
);
router.get(
  '/structures/:id',
  requirePermission(PERMISSIONS.FEE_STRUCTURE_READ),
  FeeController.getFeeStructureById
);
router.post(
  '/structures',
  requirePermission(PERMISSIONS.FEE_STRUCTURE_CREATE),
  validate(createFeeStructureSchema),
  FeeController.createFeeStructure
);

// Student Assignments
router.post(
  '/assignments',
  requirePermission(PERMISSIONS.FEE_ASSIGNMENT_CREATE),
  validate(assignFeeStructureSchema),
  FeeController.assignFeeStructure
);
router.post(
  '/assignments/bulk',
  requirePermission(PERMISSIONS.FEE_ASSIGNMENT_CREATE),
  validate(bulkAssignFeeStructureSchema),
  FeeController.bulkAssignFeeStructure
);

// Invoices
router.get('/invoices', requirePermission(PERMISSIONS.FEE_INVOICE_READ), FeeController.getInvoices);
router.get(
  '/invoices/:id',
  requirePermission(PERMISSIONS.FEE_INVOICE_READ),
  FeeController.getInvoiceById
);
router.post(
  '/invoices',
  requirePermission(PERMISSIONS.FEE_INVOICE_CREATE),
  validate(createInvoiceSchema),
  FeeController.generateInvoice
);
router.post(
  '/invoices/bulk',
  requirePermission(PERMISSIONS.FEE_INVOICE_CREATE),
  validate(bulkGenerateInvoicesSchema),
  FeeController.bulkGenerateInvoices
);

// Payments & Collections
router.get('/payments', requirePermission(PERMISSIONS.FEE_PAYMENT_READ), FeeController.getPayments);
router.get(
  '/payments/:id',
  requirePermission(PERMISSIONS.FEE_PAYMENT_READ),
  FeeController.getPaymentById
);
router.post(
  '/payments/collect',
  requirePermission(PERMISSIONS.FEE_PAYMENT_CREATE),
  validate(collectPaymentSchema),
  FeeController.collectPayment
);

// Student Fee Ledger
router.get(
  '/students/:studentId/ledger',
  requirePermission(PERMISSIONS.FEE_INVOICE_READ),
  FeeController.getStudentLedger
);

// Reports & Financial Summary
router.get(
  '/reports/summary',
  requirePermission(PERMISSIONS.FEE_REPORT_READ),
  FeeController.getFeeSummary
);

export default router;
