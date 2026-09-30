import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

export class UserController {
  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { roleId, status, page, pageSize, search } = req.query;
      const data = await UserService.getUsers({
        schoolId,
        roleId: roleId as string,
        status: status as any,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
      });
      return ResponseUtil.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const user = await UserService.getUserById(req.params.id, schoolId);
      return ResponseUtil.success(res, user);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      next(err);
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const user = await UserService.createUser(schoolId, req.body, req.user?.id);
      return ResponseUtil.created(res, user, 'User account created successfully');
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        return ResponseUtil.conflict(res, err.message);
      }
      next(err);
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const user = await UserService.updateUser(req.params.id, schoolId, req.body, req.user?.id);
      return ResponseUtil.success(res, user, 'User updated successfully');
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      next(err);
    }
  }

  static async deactivateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const user = await UserService.deactivateUser(req.params.id, schoolId, req.user?.id);
      return ResponseUtil.success(res, user, 'User deactivated successfully');
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      next(err);
    }
  }
}

