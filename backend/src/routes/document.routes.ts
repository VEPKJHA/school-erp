import { Router } from 'express';
import { DocumentController, uploadMiddleware } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();

router.use(authenticate, enforceTenant);

router.post(
  '/upload',
  requirePermission(PERMISSIONS.DOCUMENT_CREATE),
  uploadMiddleware.single('file'),
  DocumentController.uploadDocument
);

router.get(
  '/student/:studentId',
  requirePermission(PERMISSIONS.DOCUMENT_READ),
  DocumentController.getStudentDocuments
);

router.get(
  '/admission/:admissionId',
  requirePermission(PERMISSIONS.DOCUMENT_READ),
  DocumentController.getAdmissionDocuments
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.DOCUMENT_DELETE),
  DocumentController.deleteDocument
);

export default router;
