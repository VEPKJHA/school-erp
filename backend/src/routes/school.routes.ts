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
router.get('/', requirePermission(PERMISSIONS.SCHOOL_READ), SchoolController.listSchools);
router.post('/', requirePermission(PERMISSIONS.SCHOOL_UPDATE), SchoolController.createSchool);

export default router;
