import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';
import { prisma } from '../config/prisma';

export const enforceTenant = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return ResponseUtil.unauthorized(res, 'User context not found');
  }

  // Super Admin can impersonate/scope to a school via X-School-Id header or query
  if (req.user.roleCode === 'SUPER_ADMIN') {
    const targetSchoolId = (req.headers['x-school-id'] as string) || (req.query.schoolId as string);
    if (targetSchoolId) {
      const school = await prisma.school.findUnique({
        where: { id: targetSchoolId },
        select: { id: true, isActive: true },
      });
      if (!school || !school.isActive) {
        return ResponseUtil.badRequest(res, 'Target school not found or inactive');
      }
      req.schoolId = school.id;
    } else {
      req.schoolId = undefined;
    }
    return next();
  }

  // For regular school users, schoolId MUST come strictly from their authenticated token
  if (!req.user.schoolId) {
    return ResponseUtil.forbidden(res, 'User is not associated with any school tenant');
  }

  // Reject conflicting cross-tenant header
  const clientHeaderSchoolId = req.headers['x-school-id'] as string;
  if (clientHeaderSchoolId && clientHeaderSchoolId !== req.user.schoolId) {
    return ResponseUtil.forbidden(res, 'Tenant violation: cross-tenant access is strictly prohibited');
  }

  const school = await prisma.school.findUnique({
    where: { id: req.user.schoolId },
    select: { id: true, isActive: true },
  });

  if (!school || !school.isActive) {
    return ResponseUtil.forbidden(res, 'School account is inactive or suspended');
  }

  req.schoolId = req.user.schoolId;
  return next();
};

