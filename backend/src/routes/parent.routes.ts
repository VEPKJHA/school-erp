import { Router } from 'express';
import { ParentController } from '../controllers/parent.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', requirePermission(PERMISSIONS.PARENT_READ), ParentController.searchParents);
router.get('/:id', requirePermission(PERMISSIONS.PARENT_READ), ParentController.getParentById);

export default router;
