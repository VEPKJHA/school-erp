import { Router } from 'express';
import { AdmissionController } from '../controllers/admission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createAdmissionSchema,
  approveAdmissionSchema,
  rejectAdmissionSchema,
} from '../validations/admission.validation';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', requirePermission(PERMISSIONS.ADMISSION_READ), AdmissionController.getAdmissions);
router.post(
  '/',
  requirePermission(PERMISSIONS.ADMISSION_CREATE),
  validate(createAdmissionSchema),
  AdmissionController.createAdmission
);
router.get('/:id', requirePermission(PERMISSIONS.ADMISSION_READ), AdmissionController.getAdmissionById);
router.patch(
  '/:id/approve',
  requirePermission(PERMISSIONS.ADMISSION_APPROVE),
  validate(approveAdmissionSchema),
  AdmissionController.approveAdmission
);
router.patch(
  '/:id/reject',
  requirePermission(PERMISSIONS.ADMISSION_APPROVE),
  validate(rejectAdmissionSchema),
  AdmissionController.rejectAdmission
);

export default router;
