import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createStudentSchema,
  updateStudentSchema,
  updateStudentStatusSchema,
} from '../validations/student.validation';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', requirePermission(PERMISSIONS.STUDENT_READ), StudentController.getStudents);
router.post(
  '/',
  requirePermission(PERMISSIONS.STUDENT_CREATE),
  validate(createStudentSchema),
  StudentController.createStudent
);
router.get('/:id', requirePermission(PERMISSIONS.STUDENT_READ), StudentController.getStudentById);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.STUDENT_UPDATE),
  validate(updateStudentSchema),
  StudentController.updateStudent
);
router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.STUDENT_UPDATE),
  validate(updateStudentStatusSchema),
  StudentController.updateStatus
);

export default router;
