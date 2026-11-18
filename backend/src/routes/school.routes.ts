import { Router } from 'express';
import { SchoolController } from '../controllers/school.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/my-school', requirePermission(PERMISSIONS.SCHOOL_READ), SchoolController.getProfile);
router.put('/my-school', requirePermission(PERMISSIONS.SCHOOL_UPDATE), SchoolController.updateProfile);
router.patch('/my-school/logo', requirePermission(PERMISSIONS.SCHOOL_UPDATE), SchoolController.updateLogo);
router.get('/platform-overview', requirePermission(PERMISSIONS.SCHOOL_READ), SchoolController.getPlatformStats);
router.get('/', requirePermission(PERMISSIONS.SCHOOL_READ), SchoolController.listSchools);
router.post('/', requirePermission(PERMISSIONS.SCHOOL_UPDATE), SchoolController.createSchool);
router.patch('/:id/toggle-status', requirePermission(PERMISSIONS.SCHOOL_UPDATE), SchoolController.toggleSchoolStatus);
router.get('/:id/admins', requirePermission(PERMISSIONS.SCHOOL_READ), SchoolController.getSchoolAdmins);

export default router;
