import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { ResponseUtil } from '../utils/apiResponse';
import { prisma } from '../config/prisma';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', requirePermission(PERMISSIONS.USER_READ), async (req, res) => {
  try {
    const schoolId = req.schoolId!;
    const staff = await prisma.user.findMany({
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
    return ResponseUtil.success(res, staff, 'Staff retrieved successfully');
  } catch (error: any) {
    return ResponseUtil.badRequest(res, error.message);
  }
});

export default router;
