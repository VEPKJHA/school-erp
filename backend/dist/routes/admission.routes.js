"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admission_controller_1 = require("../controllers/admission.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const admission_validation_1 = require("../validations/admission.validation");
const permissions_1 = require("../constants/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
router.get('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.ADMISSION_READ), admission_controller_1.AdmissionController.getAdmissions);
router.post('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.ADMISSION_CREATE), (0, validate_middleware_1.validate)(admission_validation_1.createAdmissionSchema), admission_controller_1.AdmissionController.createAdmission);
router.get('/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.ADMISSION_READ), admission_controller_1.AdmissionController.getAdmissionById);
router.patch('/:id/approve', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.ADMISSION_APPROVE), (0, validate_middleware_1.validate)(admission_validation_1.approveAdmissionSchema), admission_controller_1.AdmissionController.approveAdmission);
router.patch('/:id/reject', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.ADMISSION_APPROVE), (0, validate_middleware_1.validate)(admission_validation_1.rejectAdmissionSchema), admission_controller_1.AdmissionController.rejectAdmission);
exports.default = router;
//# sourceMappingURL=admission.routes.js.map