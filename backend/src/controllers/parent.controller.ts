import { Response, NextFunction } from 'express';
import { ParentRepository } from '../repositories/parent.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

export class ParentController {
  static async searchParents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const query = (req.query.q as string) || '';
      const parents = await ParentRepository.searchParents(schoolId, query);
      return ResponseUtil.success(res, parents, 'Parents retrieved');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async getParentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      const parent = await ParentRepository.findById(id, schoolId);
      return ResponseUtil.success(res, parent, 'Parent details retrieved');
    } catch (error: any) {
      return ResponseUtil.notFound(res, error.message);
    }
  }
}
