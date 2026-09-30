import { Router } from 'express';
import { ClassController } from '../controllers/class.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createClassSchema,
  updateClassSchema,
  createSectionSchema,
  updateSectionSchema,
} from '../validations/class.validation';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

router.use(authenticate, enforceTenant);

router.get(
  '/classes',
  requirePermission(PERMISSIONS.CLASS_READ),
  ClassController.getClasses
);

router.post(
  '/classes',
  requirePermission(PERMISSIONS.CLASS_CREATE),
  validate(createClassSchema),
  ClassController.createClass
);

router.get(
  '/classes/:id',
  requirePermission(PERMISSIONS.CLASS_READ),
  ClassController.getClassById
);

router.put(
  '/classes/:id',
  requirePermission(PERMISSIONS.CLASS_UPDATE),
  validate(updateClassSchema),
  ClassController.updateClass
);

router.delete(
  '/classes/:id',
  requirePermission(PERMISSIONS.CLASS_DELETE),
  ClassController.deactivateClass
);

router.get(
  '/sections',
  requirePermission(PERMISSIONS.SECTION_READ),
  ClassController.getSections
);

router.post(
  '/classes/:classId/sections',
  requirePermission(PERMISSIONS.SECTION_CREATE),
  validate(createSectionSchema),
  ClassController.createSection
);

router.get(
  '/sections/:id',
  requirePermission(PERMISSIONS.SECTION_READ),
  ClassController.getSectionById
);

router.put(
  '/sections/:id',
  requirePermission(PERMISSIONS.SECTION_UPDATE),
  validate(updateSectionSchema),
  ClassController.updateSection
);

router.delete(
  '/sections/:id',
  requirePermission(PERMISSIONS.SECTION_DELETE),
  ClassController.deactivateSection
);

export default router;
