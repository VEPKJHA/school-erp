import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from '../validations/user.validation';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

router.use(authenticate, enforceTenant);

// Roles & Permissions routes (accessible by school admin)
router.get('/roles', requirePermission(PERMISSIONS.USER_READ), UserController.getRoles);
router.post('/roles', requirePermission(PERMISSIONS.USER_CREATE), UserController.createRole);
router.put('/roles/:id/permissions', requirePermission(PERMISSIONS.USER_UPDATE), UserController.updateRolePermissions);
router.get('/permissions', requirePermission(PERMISSIONS.USER_READ), UserController.getPermissions);

router.get('/', requirePermission(PERMISSIONS.USER_READ), UserController.getUsers);
router.post(
  '/',
  requirePermission(PERMISSIONS.USER_CREATE),
  validate(createUserSchema),
  UserController.createUser
);
router.get('/:id', requirePermission(PERMISSIONS.USER_READ), UserController.getUserById);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.USER_UPDATE),
  validate(updateUserSchema),
  UserController.updateUser
);
router.delete('/:id', requirePermission(PERMISSIONS.USER_DELETE), UserController.deactivateUser);

export default router;
