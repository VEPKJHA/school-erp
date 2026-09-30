import { Response, NextFunction } from 'express';
import { AdmissionService } from '../services/admission.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

export class AdmissionController {
  static async getAdmissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
      const academicSessionId = req.query.academicSessionId as string;
      const applyingClassId = req.query.applyingClassId as string;
      const status = req.query.status as any;
      const search = req.query.search as string;

      const result = await AdmissionService.getAdmissions({
        schoolId,
        academicSessionId,
        applyingClassId,
        status,
        search,
        page,
        pageSize,
      });

      return ResponseUtil.success(
        res,
        result.admissions,
        'Admissions retrieved successfully',
        200,
        {
          page,
          pageSize,
          total: result.total,
          totalPages: Math.ceil(result.total / pageSize),
        }
      );
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async getAdmissionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const admission = await AdmissionService.getAdmissionById(id, schoolId);
      return ResponseUtil.success(res, admission, 'Admission application retrieved');
    } catch (error: any) {
      return ResponseUtil.notFound(res, error.message);
    }
  }

  static async createAdmission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const admission = await AdmissionService.createAdmission(
        schoolId,
        req.body,
        req.user?.userId
      );
      return ResponseUtil.created(
        res,
        admission,
        'Admission application submitted successfully'
      );
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async approveAdmission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const result = await AdmissionService.approveAdmission(
        id,
        schoolId,
        req.body,
        req.user?.userId
      );
      return ResponseUtil.success(
        res,
        result,
        'Admission approved and active student profile created'
      );
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async rejectAdmission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const rejected = await AdmissionService.rejectAdmission(
        id,
        schoolId,
        req.body,
        req.user?.userId
      );
      return ResponseUtil.success(res, rejected, 'Admission application marked as rejected');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }
}
