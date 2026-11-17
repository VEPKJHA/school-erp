"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiAgent_controller_1 = require("../controllers/aiAgent.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const permissions_1 = require("../constants/permissions");
const router = (0, express_1.Router)();
// Strict security: all AI agent routes require valid JWT and tenant scoping
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
// Chat & Autonomous tool-calling endpoint (Fee read permission required)
router.post('/chat', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_REPORT_READ), aiAgent_controller_1.AiAgentController.chat);
// HITL Approval endpoint (Fee payment/assignment create permission required)
router.post('/approve-action/:actionId', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_PAYMENT_CREATE), aiAgent_controller_1.AiAgentController.approveAction);
// Cancel/Reject proposed action
router.post('/reject-action/:actionId', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.FEE_PAYMENT_CREATE), aiAgent_controller_1.AiAgentController.rejectAction);
exports.default = router;
//# sourceMappingURL=aiAgent.routes.js.map