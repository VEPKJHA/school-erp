"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const user_validation_1 = require("../validations/user.validation");
const permissions_1 = require("../constants/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
router.get('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.USER_READ), user_controller_1.UserController.getUsers);
router.post('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.USER_CREATE), (0, validate_middleware_1.validate)(user_validation_1.createUserSchema), user_controller_1.UserController.createUser);
router.get('/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.USER_READ), user_controller_1.UserController.getUserById);
router.put('/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.USER_UPDATE), (0, validate_middleware_1.validate)(user_validation_1.updateUserSchema), user_controller_1.UserController.updateUser);
router.delete('/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.USER_DELETE), user_controller_1.UserController.deactivateUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map