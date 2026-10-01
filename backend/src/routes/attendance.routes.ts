import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { PERMISSIONS } from '../constants/permissions';
import { AttendanceValidation } from '../validations/attendance.validation';

const router = Router();

router.use(authenticate, enforceTenant);

router.post(
  '/mark',
  requirePermission(PERMISSIONS.ATTENDANCE_STUDENT_CREATE),
  validate(AttendanceValidation.markAttendance),
  AttendanceController.markAttendance
);

router.post(
  '/bulk',
  requirePermission(PERMISSIONS.ATTENDANCE_STUDENT_CREATE),
  validate(AttendanceValidation.bulkMarkAttendance),
  AttendanceController.bulkMarkAttendance
);

router.get(
  '/',
  requirePermission(PERMISSIONS.ATTENDANCE_READ),
  AttendanceController.getAttendance
);

router.get(
  '/summary/daily',
  requirePermission(PERMISSIONS.ATTENDANCE_REPORT),
  AttendanceController.getDailySummary
);

router.get(
  '/student/:studentId',
  requirePermission(PERMISSIONS.ATTENDANCE_READ),
  AttendanceController.getStudentStats
);

router.get(
  '/register/monthly',
  requirePermission(PERMISSIONS.ATTENDANCE_REPORT),
  AttendanceController.getMonthlyRegister
);

export default router;
