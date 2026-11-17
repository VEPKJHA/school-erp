"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const permissions_1 = require("../constants/permissions");
const apiResponse_1 = require("../utils/apiResponse");
const prisma_1 = require("../config/prisma");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
router.get('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.USER_READ), async (req, res) => {
    try {
        const schoolId = req.schoolId;
        const staff = await prisma_1.prisma.user.findMany({
            where: {
                schoolId,
                role: {
                    code: {
                        notIn: ['STUDENT', 'PARENT']
                    }
                }
            },
            include: {
                role: true
            }
        });
        return apiResponse_1.ResponseUtil.success(res, staff, 'Staff retrieved successfully');
    }
    catch (error) {
        return apiResponse_1.ResponseUtil.badRequest(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=staff.routes.js.map