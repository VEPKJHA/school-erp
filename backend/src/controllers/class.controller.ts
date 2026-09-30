import { Response, NextFunction } from 'express';
import { ClassService } from '../services/class.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

export class ClassController {
  static async getClasses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 50;
      const search = req.query.search as string;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const result = await ClassService.getClasses({
        schoolId,
        page,
        pageSize,
        search,
        isActive,
      });

      return ResponseUtil.success(
        res,
        result.classes,
        'Classes retrieved successfully',
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

  static async getClassById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const classRecord = await ClassService.getClassById(id, schoolId);
      return ResponseUtil.success(res, classRecord, 'Class retrieved successfully');
    } catch (error: any) {
      return ResponseUtil.notFound(res, error.message);
    }
  }

  static async createClass(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const newClass = await ClassService.createClass(schoolId, req.body, req.user?.userId);
      return ResponseUtil.created(res, newClass, 'Class created successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async updateClass(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const updated = await ClassService.updateClass(id, schoolId, req.body, req.user?.userId);
      return ResponseUtil.success(res, updated, 'Class updated successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async deactivateClass(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const deactivated = await ClassService.deactivateClass(id, schoolId, req.user?.userId);
      return ResponseUtil.success(res, deactivated, 'Class deactivated successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async getSections(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 50;
      const search = req.query.search as string;
      const classId = req.query.classId as string;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const result = await ClassService.getSections({
        schoolId,
        classId,
        page,
        pageSize,
        search,
        isActive,
      });

      return ResponseUtil.success(
        res,
        result.sections,
        'Sections retrieved successfully',
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

  static async getSectionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const section = await ClassService.getSectionById(id, schoolId);
      return ResponseUtil.success(res, section, 'Section retrieved successfully');
    } catch (error: any) {
      return ResponseUtil.notFound(res, error.message);
    }
  }

  static async createSection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const classId = req.params.classId || req.body.classId;
      if (!classId) {
        return ResponseUtil.badRequest(res, 'classId is required to create a section');
      }

      const section = await ClassService.createSection(
        classId,
        schoolId,
        req.body,
        req.user?.userId
      );
      return ResponseUtil.created(res, section, 'Section created successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async updateSection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const updated = await ClassService.updateSection(id, schoolId, req.body, req.user?.userId);
      return ResponseUtil.success(res, updated, 'Section updated successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async deactivateSection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const deactivated = await ClassService.deactivateSection(id, schoolId, req.user?.userId);
      return ResponseUtil.success(res, deactivated, 'Section deactivated successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }
}

