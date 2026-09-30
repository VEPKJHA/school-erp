import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ResponseUtil.unauthorized(res, 'Authentication required');
    }

    if (req.user.roleCode === 'SUPER_ADMIN') {
      return next();
    }

    const userPermissions = new Set(req.user.permissions || []);
    const hasAll = requiredPermissions.every((perm) => userPermissions.has(perm));

    if (!hasAll) {
      return ResponseUtil.forbidden(
        res,
        `Access denied. Required permission: ${requiredPermissions.join(', ')}`
      );
    }

    return next();
  };
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ResponseUtil.unauthorized(res, 'Authentication required');
    }

    if (req.user.roleCode === 'SUPER_ADMIN' || allowedRoles.includes(req.user.roleCode)) {
      return next();
    }

    return ResponseUtil.forbidden(
      res,
      `Access denied. Required role: ${allowedRoles.join(' or ')}`
    );
  };
};

