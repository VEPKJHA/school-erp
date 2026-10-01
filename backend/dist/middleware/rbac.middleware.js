"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requirePermission = void 0;
const apiResponse_1 = require("../utils/apiResponse");
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return apiResponse_1.ResponseUtil.unauthorized(res, 'Authentication required');
        }
        if (req.user.roleCode === 'SUPER_ADMIN') {
            return next();
        }
        const userPermissions = new Set(req.user.permissions || []);
        const hasAll = requiredPermissions.every((perm) => userPermissions.has(perm));
        if (!hasAll) {
            return apiResponse_1.ResponseUtil.forbidden(res, `Access denied. Required permission: ${requiredPermissions.join(', ')}`);
        }
        return next();
    };
};
exports.requirePermission = requirePermission;
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return apiResponse_1.ResponseUtil.unauthorized(res, 'Authentication required');
        }
        if (req.user.roleCode === 'SUPER_ADMIN' || allowedRoles.includes(req.user.roleCode)) {
            return next();
        }
        return apiResponse_1.ResponseUtil.forbidden(res, `Access denied. Required role: ${allowedRoles.join(' or ')}`);
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=rbac.middleware.js.map