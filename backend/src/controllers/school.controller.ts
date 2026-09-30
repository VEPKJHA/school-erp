import { Response, NextFunction } from 'express';
import { SchoolRepository } from '../repositories/school.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';
import { AuditService } from '../services/audit.service';

export class SchoolController {
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId;
      if (!schoolId) {
        return ResponseUtil.badRequest(res, 'No school context specified');
      }

      const school = await SchoolRepository.findById(schoolId);
      if (!school) {
        return ResponseUtil.notFound(res, 'School institution not found');
      }

      return ResponseUtil.success(res, school, 'School profile retrieved');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId;
      if (!schoolId) {
        return ResponseUtil.badRequest(res, 'No school context specified');
      }

      const updated = await SchoolRepository.update(schoolId, req.body);

      await AuditService.log({
        schoolId,
        userId: req.user?.userId,
        action: 'SCHOOL_PROFILE_UPDATED',
        entity: 'School',
        entityId: schoolId,
        newValue: updated,
      });

      return ResponseUtil.success(res, updated, 'School profile updated successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async listSchools(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
      const search = req.query.search as string;

      const result = await SchoolRepository.findAll(page, pageSize, search);
      return ResponseUtil.success(res, result.schools, 'Schools retrieved', 200, {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      });
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }
}

