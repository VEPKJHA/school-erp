import { Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

export class AttendanceController {
  static async markAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id || req.user?.userId;
      const record = await AttendanceService.markAttendance(schoolId, userId, req.body);
      return ResponseUtil.created(res, record, 'Student attendance marked successfully');
    } catch (err) {
      next(err);
    }
  }

  static async bulkMarkAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id || req.user?.userId;
      const result = await AttendanceService.bulkMarkAttendance(schoolId, userId, req.body);
      return ResponseUtil.created(res, result, `Attendance marked for ${result.totalMarked} students`);
    } catch (err) {
      next(err);
    }
  }

  static async getAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const {
        date,
        startDate,
        endDate,
        classId,
        sectionId,
        academicSessionId,
        studentId,
        status,
      } = req.query as any;

      const records = await AttendanceService.getAttendance(schoolId, {
        date,
        startDate,
        endDate,
        classId,
        sectionId,
        academicSessionId,
        studentId,
        status,
      });

      return ResponseUtil.success(res, records);
    } catch (err) {
      next(err);
    }
  }

  static async getDailySummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { date, classId, sectionId, academicSessionId } = req.query as any;

      if (!date) {
        return ResponseUtil.badRequest(res, 'Date query parameter (YYYY-MM-DD) is required');
      }

      const summary = await AttendanceService.getDailySummary(schoolId, {
        date,
        classId,
        sectionId,
        academicSessionId,
      });

      return ResponseUtil.success(res, summary);
    } catch (err) {
      next(err);
    }
  }

  static async getStudentStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId } = req.params;
      const { academicSessionId } = req.query as any;

      const stats = await AttendanceService.getStudentStats(schoolId, studentId, academicSessionId);
      return ResponseUtil.success(res, stats);
    } catch (err) {
      next(err);
    }
  }

  static async getMonthlyRegister(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { classId, sectionId, year, month } = req.query as any;

      if (!classId || !sectionId || !year || !month) {
        return ResponseUtil.badRequest(
          res,
          'classId, sectionId, year, and month are all required to fetch the monthly register'
        );
      }

      const register = await AttendanceService.getMonthlyRegister(schoolId, {
        classId,
        sectionId,
        year: parseInt(year, 10),
        month: parseInt(month, 10),
      });

      return ResponseUtil.success(res, register);
    } catch (err) {
      next(err);
    }
  }
}
