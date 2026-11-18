"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAnyPermissionOrRole = exports.requirePermission = void 0;
const apiResponse_1 = require("../utils/apiResponse");
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return apiResponse_1.ResponseUtil.unauthorized(res, 'Authentication required');
        }
        if (req.user.roleCode === 'SUPER_ADMIN' || req.user.roleCode === 'SCHOOL_ADMIN') {
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
/**
 * Checks whether user has AT LEAST ONE of the specified permissions OR is member of allowed roles.
 * Defaults to granting full access to SUPER_ADMIN and SCHOOL_ADMIN.
 */
const requireAnyPermissionOrRole = (permissions = [], roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return apiResponse_1.ResponseUtil.unauthorized(res, 'Authentication required');
        }
        // Admins always permitted
        if (req.user.roleCode === 'SUPER_ADMIN' || req.user.roleCode === 'SCHOOL_ADMIN') {
            return next();
        }
        // Check role match
        if (roles.includes(req.user.roleCode)) {
            return next();
        }
        // Check permission match
        const userPermissions = new Set(req.user.permissions || []);
        const hasAny = permissions.some((perm) => userPermissions.has(perm));
        if (hasAny) {
            return next();
        }
        return apiResponse_1.ResponseUtil.forbidden(res, `Access denied. Required permission: ${permissions.join(' or ')}`);
    };
};
exports.requireAnyPermissionOrRole = requireAnyPermissionOrRole;
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