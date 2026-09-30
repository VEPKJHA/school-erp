import { Router } from 'express';
import { TimetableController } from '../controllers/timetable.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { TimetableValidation } from '../validations/timetable.validation';

const router = Router();

router.use(authenticate, enforceTenant);

// Subjects
router.get(
  '/subjects',
  requirePermission(PERMISSIONS.SUBJECT_READ),
  TimetableController.getSubjects
);

router.get(
  '/subjects/:id',
  requirePermission(PERMISSIONS.SUBJECT_READ),
  TimetableController.getSubjectById
);

router.post(
  '/subjects',
  requirePermission(PERMISSIONS.SUBJECT_CREATE),
  validate(TimetableValidation.createSubject),
  TimetableController.createSubject
);

router.put(
  '/subjects/:id',
  requirePermission(PERMISSIONS.SUBJECT_UPDATE),
  validate(TimetableValidation.updateSubject),
  TimetableController.updateSubject
);

router.post(
  '/classes/assign',
  requirePermission(PERMISSIONS.SUBJECT_UPDATE),
  validate(TimetableValidation.assignClassSubject),
  TimetableController.assignClassSubject
);

router.get(
  '/classes/:classId/subjects',
  requirePermission(PERMISSIONS.SUBJECT_READ),
  TimetableController.getClassSubjects
);

// Timetable Slots
router.post(
  '/slots',
  requirePermission(PERMISSIONS.TIMETABLE_CREATE),
  validate(TimetableValidation.createTimetableSlot),
  TimetableController.createSlot
);

router.put(
  '/slots/:id',
  requirePermission(PERMISSIONS.TIMETABLE_UPDATE),
  validate(TimetableValidation.updateTimetableSlot),
  TimetableController.updateSlot
);

router.delete(
  '/slots/:id',
  requirePermission(PERMISSIONS.TIMETABLE_DELETE),
  TimetableController.deleteSlot
);

router.get(
  '/sections/:sectionId',
  requirePermission(PERMISSIONS.TIMETABLE_READ),
  TimetableController.getSectionTimetable
);

router.get(
  '/teachers/:teacherId',
  requirePermission(PERMISSIONS.TIMETABLE_READ),
  TimetableController.getTeacherTimetable
);

export default router;
