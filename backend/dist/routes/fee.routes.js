"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fee_controller_1 = require("../controllers/fee.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const permissions_1 = require("../constants/permissions");
const fee_validation_1 = require("../validations/fee.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
// Fee Heads
router.get('/heads', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_HEAD_READ), fee_controller_1.FeeController.getFeeHeads);
router.post('/heads', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_HEAD_CREATE), (0, validate_middleware_1.validate)(fee_validation_1.createFeeHeadSchema), fee_controller_1.FeeController.createFeeHead);
router.put('/heads/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_HEAD_UPDATE), (0, validate_middleware_1.validate)(fee_validation_1.updateFeeHeadSchema), fee_controller_1.FeeController.updateFeeHead);
// Fee Structures
router.get('/structures', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_STRUCTURE_READ), fee_controller_1.FeeController.getFeeStructures);
router.get('/structures/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_STRUCTURE_READ), fee_controller_1.FeeController.getFeeStructureById);
router.post('/structures', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_STRUCTURE_CREATE), (0, validate_middleware_1.validate)(fee_validation_1.createFeeStructureSchema), fee_controller_1.FeeController.createFeeStructure);
// Student Assignments
router.post('/assignments', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_ASSIGNMENT_CREATE), (0, validate_middleware_1.validate)(fee_validation_1.assignFeeStructureSchema), fee_controller_1.FeeController.assignFeeStructure);
router.post('/assignments/bulk', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_ASSIGNMENT_CREATE), (0, validate_middleware_1.validate)(fee_validation_1.bulkAssignFeeStructureSchema), fee_controller_1.FeeController.bulkAssignFeeStructure);
// Invoices
router.get('/invoices', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_INVOICE_READ), fee_controller_1.FeeController.getInvoices);
router.get('/invoices/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_INVOICE_READ), fee_controller_1.FeeController.getInvoiceById);
router.post('/invoices', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_INVOICE_CREATE), (0, validate_middleware_1.validate)(fee_validation_1.createInvoiceSchema), fee_controller_1.FeeController.generateInvoice);
router.post('/invoices/bulk', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_INVOICE_CREATE), (0, validate_middleware_1.validate)(fee_validation_1.bulkGenerateInvoicesSchema), fee_controller_1.FeeController.bulkGenerateInvoices);
// Payments & Collections
router.get('/payments', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_PAYMENT_READ), fee_controller_1.FeeController.getPayments);
router.get('/payments/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_PAYMENT_READ), fee_controller_1.FeeController.getPaymentById);
router.post('/payments/collect', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_PAYMENT_CREATE), (0, validate_middleware_1.validate)(fee_validation_1.collectPaymentSchema), fee_controller_1.FeeController.collectPayment);
// Student Fee Ledger
router.get('/students/:studentId/ledger', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_INVOICE_READ), fee_controller_1.FeeController.getStudentLedger);
// Reports & Financial Summary
router.get('/reports/summary', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_REPORT_READ), fee_controller_1.FeeController.getFeeSummary);
exports.default = router;
//# sourceMappingURL=fee.routes.js.map