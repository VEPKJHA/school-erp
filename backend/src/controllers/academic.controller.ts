import { Response, NextFunction } from 'express';
import { AcademicService } from '../services/academic.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

export class AcademicController {
  static async getSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const sessions = await AcademicService.getSessions(schoolId);
      return ResponseUtil.success(res, sessions);
    } catch (err) {
      next(err);
    }
  }

  static async getSessionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const session = await AcademicService.getSessionById(req.params.id, schoolId);
      return ResponseUtil.success(res, session);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      next(err);
    }
  }

  static async createSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const session = await AcademicService.createSession(schoolId, req.body, req.user?.id);
      return ResponseUtil.created(res, session, 'Academic session created successfully');
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        return ResponseUtil.conflict(res, err.message);
      }
      next(err);
    }
  }

  static async updateSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const session = await AcademicService.updateSession(
        req.params.id,
        schoolId,
        req.body,
        req.user?.id
      );
      return ResponseUtil.success(res, session, 'Academic session updated successfully');
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      if (err.message.includes('already exists')) {
        return ResponseUtil.conflict(res, err.message);
      }
      next(err);
    }
  }

  static async setCurrentSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const session = await AcademicService.setCurrentSession(
        req.params.id,
        schoolId,
        req.user?.id
      );
      return ResponseUtil.success(res, session, 'Academic session set as current');
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      next(err);
    }
  }
}