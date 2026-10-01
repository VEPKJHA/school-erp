"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parent_controller_1 = require("../controllers/parent.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const permissions_1 = require("../constants/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
router.get('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.PARENT_READ), parent_controller_1.ParentController.searchParents);
router.get('/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.PARENT_READ), parent_controller_1.ParentController.getParentById);
exports.default = router;
//# sourceMappingURL=parent.routes.js.map