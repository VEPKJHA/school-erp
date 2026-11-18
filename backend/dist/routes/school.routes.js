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
// Support both /my-school/logo and /current/logo aliases, permitting SCHOOL_ADMIN, PRINCIPAL, or school:update / student:update
router.patch(['/my-school/logo', '/current/logo'], (0, rbac_middleware_1.requireAnyPermissionOrRole)([permissions_1.PERMISSIONS.SCHOOL_UPDATE, permissions_1.PERMISSIONS.STUDENT_UPDATE], ['SCHOOL_ADMIN', 'PRINCIPAL']), school_controller_1.SchoolController.updateLogo);
router.get('/platform-overview', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SCHOOL_READ), school_controller_1.SchoolController.getPlatformStats);
router.get('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SCHOOL_READ), school_controller_1.SchoolController.listSchools);
router.post('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SCHOOL_UPDATE), school_controller_1.SchoolController.createSchool);
router.patch('/:id/toggle-status', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SCHOOL_UPDATE), school_controller_1.SchoolController.toggleSchoolStatus);
router.get('/:id/admins', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SCHOOL_READ), school_controller_1.SchoolController.getSchoolAdmins);
exports.default = router;
//# sourceMappingURL=school.routes.js.map