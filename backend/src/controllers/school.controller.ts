import { Response, NextFunction } from 'express';
import { SchoolRepository } from '../repositories/school.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';
import { AuditService } from '../services/audit.service';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';

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

  static async getSchoolAdmins(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.roleCode !== 'SUPER_ADMIN') {
        return ResponseUtil.forbidden(res, 'Only Super Admins can view this');
      }
      const schoolId = req.params.id;
      const admins = await prisma.user.findMany({
        where: { schoolId, role: { code: 'SCHOOL_ADMIN' } },
        select: { id: true, firstName: true, lastName: true, email: true, status: true }
      });
      return ResponseUtil.success(res, admins, 'Admins retrieved');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async createSchool(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.roleCode !== 'SUPER_ADMIN') {
        return ResponseUtil.forbidden(res, 'Only Super Admins can create new schools');
      }

      const { adminUser, ...schoolData } = req.body;
      const newSchool = await SchoolRepository.create(schoolData);

      // Create base roles
      const baseRoles = [
        { code: 'SCHOOL_ADMIN', name: 'School Administrator', description: 'Full authority', isSystem: true },
        { code: 'PRINCIPAL', name: 'Principal', description: 'Academic head', isSystem: false },
        { code: 'ACCOUNTANT', name: 'Accountant', description: 'Finance', isSystem: false },
        { code: 'TEACHER', name: 'Teacher', description: 'Class teacher', isSystem: false },
      ];

      const rolesMap: Record<string, string> = {};
      for (const r of baseRoles) {
        const createdRole = await prisma.role.create({
          data: { ...r, schoolId: newSchool.id }
        });
        rolesMap[r.code] = createdRole.id;
      }

      // Create default admin
      const defaultPassword = 'Admin@12345';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const adminEmail = `admin@${newSchool.code.toLowerCase()}.edu`;
      
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          firstName: 'School',
          lastName: 'Admin',
          passwordHash,
          schoolId: newSchool.id,
          roleId: rolesMap['SCHOOL_ADMIN'],
          status: 'ACTIVE'
        }
      });

      return ResponseUtil.success(res, {
        school: newSchool,
        adminCredentials: {
          email: adminEmail,
          password: defaultPassword
        }
      }, 'School created successfully with default admin credentials', 201);
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }
}

