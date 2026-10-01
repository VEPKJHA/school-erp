"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const school_controller_1 = require("../controllers/school.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const permissions_1 = require("../constants/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
router.get('/my-school', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SCHOOL_READ), school_controller_1.SchoolController.getProfile);
router.put('/my-school', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SCHOOL_UPDATE), school_controller_1.SchoolController.updateProfile);
router.get('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SCHOOL_READ), school_controller_1.SchoolController.listSchools);
exports.default = router;
//# sourceMappingURL=school.routes.js.map