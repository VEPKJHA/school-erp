import { Router } from 'express';
import { ExamController } from '../controllers/exam.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { ExamValidation } from '../validations/exam.validation';

const router = Router();

router.use(authenticate, enforceTenant);

// ==========================================
// 1. EXAM TERMS
// ==========================================
router.get(
  '/terms',
  requirePermission(PERMISSIONS.EXAM_TERM_READ),
  ExamController.getTerms
);

router.get(
  '/terms/:id',
  requirePermission(PERMISSIONS.EXAM_TERM_READ),
  ExamController.getTermById
);

router.post(
  '/terms',
  requirePermission(PERMISSIONS.EXAM_TERM_CREATE),
  validate(ExamValidation.createExamTerm),
  ExamController.createTerm
);

router.put(
  '/terms/:id',
  requirePermission(PERMISSIONS.EXAM_TERM_UPDATE),
  validate(ExamValidation.updateExamTerm),
  ExamController.updateTerm
);

router.delete(
  '/terms/:id',
  requirePermission(PERMISSIONS.EXAM_TERM_DELETE),
  ExamController.deleteTerm
);

// ==========================================
// 2. GRADING SCALES
// ==========================================
router.get(
  '/grading-scales',
  requirePermission(PERMISSIONS.EXAM_TERM_READ),
  ExamController.getScales
);

router.get(
  '/grading-scales/:id',
  requirePermission(PERMISSIONS.EXAM_TERM_READ),
  ExamController.getScaleById
);

router.post(
  '/grading-scales',
  requirePermission(PERMISSIONS.EXAM_TERM_CREATE),
  validate(ExamValidation.createGradingScale),
  ExamController.createScale
);

// ==========================================
// 3. EXAM SCHEDULES
// ==========================================
router.get(
  '/schedules',
  requirePermission(PERMISSIONS.EXAM_SCHEDULE_READ),
  ExamController.getSchedules
);

router.get(
  '/schedules/:id',
  requirePermission(PERMISSIONS.EXAM_SCHEDULE_READ),
  ExamController.getScheduleById
);

router.post(
  '/schedules',
  requirePermission(PERMISSIONS.EXAM_SCHEDULE_CREATE),
  validate(ExamValidation.createExamSchedule),
  ExamController.createSchedule
);

router.put(
  '/schedules/:id',
  requirePermission(PERMISSIONS.EXAM_SCHEDULE_UPDATE),
  validate(ExamValidation.updateExamSchedule),
  ExamController.updateSchedule
);

router.delete(
  '/schedules/:id',
  requirePermission(PERMISSIONS.EXAM_SCHEDULE_DELETE),
  ExamController.deleteSchedule
);

// ==========================================
// 4. MARKS ENTRY
// ==========================================
router.get(
  '/schedules/:scheduleId/marks',
  requirePermission(PERMISSIONS.EXAM_MARK_READ),
  ExamController.getMarks
);

router.post(
  '/schedules/:scheduleId/marks',
  requirePermission(PERMISSIONS.EXAM_MARK_CREATE),
  validate(ExamValidation.enterMarks),
  ExamController.enterMarks
);

// ==========================================
// 5. PROGRESS REPORT CARD
// ==========================================
router.get(
  '/students/:studentId/report-card',
  requirePermission(PERMISSIONS.EXAM_REPORT_READ),
  ExamController.getStudentReportCard
);

export default router;
