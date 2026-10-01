"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academic_controller_1 = require("../controllers/academic.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const academic_validation_1 = require("../validations/academic.validation");
const permissions_1 = require("../constants/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
router.get('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.ACADEMIC_SESSION_READ), academic_controller_1.AcademicController.getSessions);
router.post('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.ACADEMIC_SESSION_CREATE), (0, validate_middleware_1.validate)(academic_validation_1.createAcademicSessionSchema), academic_controller_1.AcademicController.createSession);
router.get('/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.ACADEMIC_SESSION_READ), academic_controller_1.AcademicController.getSessionById);
router.put('/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.ACADEMIC_SESSION_UPDATE), (0, validate_middleware_1.validate)(academic_validation_1.updateAcademicSessionSchema), academic_controller_1.AcademicController.updateSession);
router.patch('/:id/set-current', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.ACADEMIC_SESSION_UPDATE), academic_controller_1.AcademicController.setCurrentSession);
exports.default = router;
//# sourceMappingURL=academic.routes.js.map