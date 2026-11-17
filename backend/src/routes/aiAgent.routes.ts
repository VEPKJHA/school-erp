import { Router } from 'express';
import { AiAgentController } from '../controllers/aiAgent.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

// Strict security: all AI agent routes require valid JWT and tenant scoping
router.use(authenticate, enforceTenant);

// Chat & Autonomous tool-calling endpoint (Fee read permission required)
router.post(
  '/chat',
  requirePermission(PERMISSIONS.FEE_REPORT_READ),
  AiAgentController.chat
);

// HITL Approval endpoint (Fee payment/assignment create permission required)
router.post(
  '/approve-action/:actionId',
  requirePermission(PERMISSIONS.FEE_PAYMENT_CREATE),
  AiAgentController.approveAction
);

// Cancel/Reject proposed action
router.post(
  '/reject-action/:actionId',
  requirePermission(PERMISSIONS.FEE_PAYMENT_CREATE),
  AiAgentController.rejectAction
);

export default router;
