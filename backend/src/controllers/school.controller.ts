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

  static async toggleSchoolStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.roleCode !== 'SUPER_ADMIN') {
        return ResponseUtil.forbidden(res, 'Only Super Admins can alter school status');
      }

      const schoolId = req.params.id;
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!school) {
        return ResponseUtil.notFound(res, 'School institution not found');
      }

      const updated = await prisma.school.update({
        where: { id: schoolId },
        data: { isActive: !school.isActive },
      });

      await AuditService.log({
        schoolId,
        userId: req.user?.userId,
        action: updated.isActive ? 'SCHOOL_ACTIVATED' : 'SCHOOL_SUSPENDED',
        entity: 'School',
        entityId: schoolId,
        newValue: { isActive: updated.isActive },
      });

      return ResponseUtil.success(
        res,
        updated,
        `School ${updated.name} has been ${updated.isActive ? 'activated' : 'suspended'}`
      );
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async getPlatformStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.roleCode !== 'SUPER_ADMIN') {
        return ResponseUtil.forbidden(res, 'Only Super Admins can access SaaS platform overview');
      }

      const [
        totalSchools,
        activeSchools,
        suspendedSchools,
        totalStudents,
        activeStudents,
        totalStaff,
        feeAgg,
        recentSchools,
        recentAuditLogs,
        schoolsUtilization,
      ] = await Promise.all([
        prisma.school.count(),
        prisma.school.count({ where: { isActive: true } }),
        prisma.school.count({ where: { isActive: false } }),
        prisma.student.count(),
        prisma.student.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({
          where: {
            role: { code: { not: 'SUPER_ADMIN' } },
          },
        }),
        prisma.feeInvoice.aggregate({
          _sum: {
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
          },
          _count: {
            id: true,
          },
        }),
        prisma.school.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            state: true,
            isActive: true,
            createdAt: true,
          },
        }),
        prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            school: { select: { name: true, code: true } },
          },
        }),
        prisma.school.findMany({
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                students: true,
                users: true,
                feeInvoices: true,
              },
            },
            academicSessions: {
              where: { isCurrent: true },
              take: 1,
              select: { name: true },
            },
          },
        }),
      ]);

      // Calculate per-school fee statistics
      const schoolFeeStats = await prisma.feeInvoice.groupBy({
        by: ['schoolId'],
        _sum: {
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
      });

      const feeStatsMap = new Map(
        schoolFeeStats.map((f) => [
          f.schoolId,
          {
            totalBilled: Number(f._sum.totalAmount || 0),
            totalCollected: Number(f._sum.paidAmount || 0),
            totalPending: Number(f._sum.balanceAmount || 0),
          },
        ])
      );

      const tenantUtilization = schoolsUtilization.map((s) => {
        const fees = feeStatsMap.get(s.id) || { totalBilled: 0, totalCollected: 0, totalPending: 0 };
        return {
          id: s.id,
          name: s.name,
          code: s.code,
          city: s.city,
          state: s.state,
          email: s.email,
          phone: s.phone,
          isActive: s.isActive,
          createdAt: s.createdAt,
          currentSession: s.academicSessions[0]?.name || 'N/A',
          totalStudents: s._count.students,
          totalStaff: s._count.users,
          totalInvoices: s._count.feeInvoices,
          totalBilled: fees.totalBilled,
          totalCollected: fees.totalCollected,
          totalPending: fees.totalPending,
        };
      });

      return ResponseUtil.success(res, {
        kpis: {
          totalSchools,
          activeSchools,
          suspendedSchools,
          totalStudents,
          activeStudents,
          totalStaff,
          totalInvoices: feeAgg._count.id,
          totalBilled: Number(feeAgg._sum.totalAmount || 0),
          totalCollected: Number(feeAgg._sum.paidAmount || 0),
          totalPending: Number(feeAgg._sum.balanceAmount || 0),
        },
        recentSchools,
        recentAuditLogs,
        tenantUtilization,
      });
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }
}

