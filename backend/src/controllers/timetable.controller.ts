import { Response, NextFunction } from 'express';
import { TimetableService } from '../services/timetable.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

export class TimetableController {
  // ==========================================
  // SUBJECTS
  // ==========================================

  static async getSubjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const subjects = await TimetableService.getSubjects(schoolId, isActive);
      return ResponseUtil.success(res, subjects);
    } catch (err) {
      next(err);
    }
  }

  static async getSubjectById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const subject = await TimetableService.getSubjectById(schoolId, req.params.id);
      return ResponseUtil.success(res, subject);
    } catch (err) {
      next(err);
    }
  }

  static async createSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const subject = await TimetableService.createSubject(schoolId, req.body);
      return ResponseUtil.created(res, subject, 'Subject created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const subject = await TimetableService.updateSubject(schoolId, req.params.id, req.body);
      return ResponseUtil.success(res, subject, 'Subject updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async assignClassSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const record = await TimetableService.assignClassSubject(schoolId, req.body);
      return ResponseUtil.created(res, record, 'Subject mapped to class successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getClassSubjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const subjects = await TimetableService.getClassSubjects(schoolId, req.params.classId);
      return ResponseUtil.success(res, subjects);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // TIMETABLE SLOTS
  // ==========================================

  static async createSlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const slot = await TimetableService.createSlot(schoolId, req.body);
      return ResponseUtil.created(res, slot, 'Timetable period scheduled successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateSlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const slot = await TimetableService.updateSlot(schoolId, req.params.id, req.body);
      return ResponseUtil.success(res, slot, 'Timetable period updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteSlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      await TimetableService.deleteSlot(schoolId, req.params.id);
      return ResponseUtil.success(res, null, 'Timetable period deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getSectionTimetable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { sectionId } = req.params;
      const { academicSessionId, dayOfWeek } = req.query as any;

      const schedule = await TimetableService.getSectionTimetable(
        schoolId,
        sectionId,
        academicSessionId,
        dayOfWeek
      );
      return ResponseUtil.success(res, schedule);
    } catch (err) {
      next(err);
    }
  }

  static async getTeacherTimetable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { teacherId } = req.params;
      const { academicSessionId, dayOfWeek } = req.query as any;

      const schedule = await TimetableService.getTeacherTimetable(
        schoolId,
        teacherId,
        academicSessionId,
        dayOfWeek
      );
      return ResponseUtil.success(res, schedule);
    } catch (err) {
      next(err);
    }
  }
}
