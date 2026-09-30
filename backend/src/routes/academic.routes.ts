import { Router } from 'express';
import { AcademicController } from '../controllers/academic.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createAcademicSessionSchema,
  updateAcademicSessionSchema,
} from '../validations/academic.validation';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

router.use(authenticate, enforceTenant);

router.get(
  '/',
  requirePermission(PERMISSIONS.ACADEMIC_SESSION_READ),
  AcademicController.getSessions
);

router.post(
  '/',
  requirePermission(PERMISSIONS.ACADEMIC_SESSION_CREATE),
  validate(createAcademicSessionSchema),
  AcademicController.createSession
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.ACADEMIC_SESSION_READ),
  AcademicController.getSessionById
);

router.put(
  '/:id',
  requirePermission(PERMISSIONS.ACADEMIC_SESSION_UPDATE),
  validate(updateAcademicSessionSchema),
  AcademicController.updateSession
);

router.patch(
  '/:id/set-current',
  requirePermission(PERMISSIONS.ACADEMIC_SESSION_UPDATE),
  AcademicController.setCurrentSession
);

export default router;
