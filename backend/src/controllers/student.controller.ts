import { Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

export class StudentController {
  static async getStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
      const classId = req.query.classId as string;
      const sectionId = req.query.sectionId as string;
      const status = req.query.status as any;
      const academicSessionId = req.query.academicSessionId as string;
      const search = req.query.search as string;

      const result = await StudentService.getStudents({
        schoolId,
        classId,
        sectionId,
        status,
        academicSessionId,
        search,
        page,
        pageSize,
      });

      return ResponseUtil.success(
        res,
        result.students,
        'Students retrieved successfully',
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

  static async getStudentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const student = await StudentService.getStudentById(id, schoolId);
      return ResponseUtil.success(res, student, 'Student profile retrieved');
    } catch (error: any) {
      return ResponseUtil.notFound(res, error.message);
    }
  }

  static async createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const student = await StudentService.createStudentDirect(
        schoolId,
        req.body,
        req.user?.userId
      );
      return ResponseUtil.created(res, student, 'Student registered successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async updateStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const updated = await StudentService.updateStudent(
        id,
        schoolId,
        req.body,
        req.user?.userId
      );
      return ResponseUtil.success(res, updated, 'Student profile updated successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const { status, reason } = req.body;
      const updated = await StudentService.updateStatus(
        id,
        schoolId,
        status,
        reason,
        req.user?.userId
      );
      return ResponseUtil.success(res, updated, 'Student status updated successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }
}
