"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceTenant = void 0;
const apiResponse_1 = require("../utils/apiResponse");
const prisma_1 = require("../config/prisma");
const enforceTenant = async (req, res, next) => {
    if (!req.user) {
        return apiResponse_1.ResponseUtil.unauthorized(res, 'User context not found');
    }
    // Super Admin can impersonate/scope to a school via X-School-Id header or query
    if (req.user.roleCode === 'SUPER_ADMIN') {
        const targetSchoolId = req.headers['x-school-id'] || req.query.schoolId;
        if (targetSchoolId) {
            const school = await prisma_1.prisma.school.findUnique({
                where: { id: targetSchoolId },
                select: { id: true, isActive: true },
            });
            if (!school || !school.isActive) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'Target school not found or inactive');
            }
            req.schoolId = school.id;
        }
        else {
            req.schoolId = undefined;
        }
        return next();
    }
    // For regular school users, schoolId MUST come strictly from their authenticated token
    if (!req.user.schoolId) {
        return apiResponse_1.ResponseUtil.forbidden(res, 'User is not associated with any school tenant');
    }
    // Reject conflicting cross-tenant header
    const clientHeaderSchoolId = req.headers['x-school-id'];
    if (clientHeaderSchoolId && clientHeaderSchoolId !== req.user.schoolId) {
        return apiResponse_1.ResponseUtil.forbidden(res, 'Tenant violation: cross-tenant access is strictly prohibited');
    }
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: req.user.schoolId },
        select: { id: true, isActive: true },
    });
    if (!school || !school.isActive) {
        return apiResponse_1.ResponseUtil.forbidden(res, 'School account is inactive or suspended');
    }
    req.schoolId = req.user.schoolId;
    return next();
};
exports.enforceTenant = enforceTenant;
//# sourceMappingURL=tenant.middleware.js.map