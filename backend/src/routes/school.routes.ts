import { Router } from 'express';
import { SchoolController } from '../controllers/school.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission, requireAnyPermissionOrRole } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/my-school', requirePermission(PERMISSIONS.SCHOOL_READ), SchoolController.getProfile);
router.put('/my-school', requirePermission(PERMISSIONS.SCHOOL_UPDATE), SchoolController.updateProfile);

// Support both /my-school/logo and /current/logo aliases, permitting SCHOOL_ADMIN, PRINCIPAL, or school:update / student:update
router.patch(
  ['/my-school/logo', '/current/logo'],
  requireAnyPermissionOrRole(
    [PERMISSIONS.SCHOOL_UPDATE, PERMISSIONS.STUDENT_UPDATE],
    ['SCHOOL_ADMIN', 'PRINCIPAL']
  ),
  SchoolController.updateLogo
);

router.get('/platform-overview', requirePermission(PERMISSIONS.SCHOOL_READ), SchoolController.getPlatformStats);
router.get('/', requirePermission(PERMISSIONS.SCHOOL_READ), SchoolController.listSchools);
router.post('/', requirePermission(PERMISSIONS.SCHOOL_UPDATE), SchoolController.createSchool);
router.patch('/:id/toggle-status', requirePermission(PERMISSIONS.SCHOOL_UPDATE), SchoolController.toggleSchoolStatus);
router.get('/:id/admins', requirePermission(PERMISSIONS.SCHOOL_READ), SchoolController.getSchoolAdmins);

export default router;
