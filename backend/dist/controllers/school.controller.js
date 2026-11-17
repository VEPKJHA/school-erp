"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolController = void 0;
const school_repository_1 = require("../repositories/school.repository");
const apiResponse_1 = require("../utils/apiResponse");
const audit_service_1 = require("../services/audit.service");
const prisma_1 = require("../config/prisma");
const roleProvisioning_service_1 = require("../services/roleProvisioning.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class SchoolController {
    static async getProfile(req, res, next) {
        try {
            const schoolId = req.schoolId;
            if (!schoolId) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'No school context specified');
            }
            const school = await school_repository_1.SchoolRepository.findById(schoolId);
            if (!school) {
                return apiResponse_1.ResponseUtil.notFound(res, 'School institution not found');
            }
            return apiResponse_1.ResponseUtil.success(res, school, 'School profile retrieved');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async updateProfile(req, res, next) {
        try {
            const schoolId = req.schoolId;
            if (!schoolId) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'No school context specified');
            }
            const updated = await school_repository_1.SchoolRepository.update(schoolId, req.body);
            await audit_service_1.AuditService.log({
                schoolId,
                userId: req.user?.userId,
                action: 'SCHOOL_PROFILE_UPDATED',
                entity: 'School',
                entityId: schoolId,
                newValue: updated,
            });
            return apiResponse_1.ResponseUtil.success(res, updated, 'School profile updated successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async listSchools(req, res, next) {
        try {
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20;
            const search = req.query.search;
            const result = await school_repository_1.SchoolRepository.findAll(page, pageSize, search);
            return apiResponse_1.ResponseUtil.success(res, result.schools, 'Schools retrieved', 200, {
                page,
                pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / pageSize),
            });
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async getSchoolAdmins(req, res, next) {
        try {
            if (req.user?.roleCode !== 'SUPER_ADMIN') {
                return apiResponse_1.ResponseUtil.forbidden(res, 'Only Super Admins can view this');
            }
            const schoolId = req.params.id;
            const admins = await prisma_1.prisma.user.findMany({
                where: { schoolId, role: { code: 'SCHOOL_ADMIN' } },
                select: { id: true, firstName: true, lastName: true, email: true, status: true }
            });
            return apiResponse_1.ResponseUtil.success(res, admins, 'Admins retrieved');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async createSchool(req, res, next) {
        try {
            if (req.user?.roleCode !== 'SUPER_ADMIN') {
                return apiResponse_1.ResponseUtil.forbidden(res, 'Only Super Admins can create new schools');
            }
            const { adminUser, ...schoolData } = req.body;
            const newSchool = await school_repository_1.SchoolRepository.create(schoolData);
            // Auto-provision complete set of default tenant roles & permissions
            const rolesMap = await roleProvisioning_service_1.RoleProvisioningService.provisionDefaultRolesForSchool(newSchool.id);
            // Create default admin
            const defaultPassword = 'Admin@12345';
            const passwordHash = await bcryptjs_1.default.hash(defaultPassword, 10);
            const adminEmail = `admin@${newSchool.code.toLowerCase()}.edu`;
            const admin = await prisma_1.prisma.user.create({
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
            return apiResponse_1.ResponseUtil.success(res, {
                school: newSchool,
                adminCredentials: {
                    email: adminEmail,
                    password: defaultPassword
                }
            }, 'School created successfully with default admin credentials', 201);
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async toggleSchoolStatus(req, res, next) {
        try {
            if (req.user?.roleCode !== 'SUPER_ADMIN') {
                return apiResponse_1.ResponseUtil.forbidden(res, 'Only Super Admins can alter school status');
            }
            const schoolId = req.params.id;
            const school = await prisma_1.prisma.school.findUnique({ where: { id: schoolId } });
            if (!school) {
                return apiResponse_1.ResponseUtil.notFound(res, 'School institution not found');
            }
            const updated = await prisma_1.prisma.school.update({
                where: { id: schoolId },
                data: { isActive: !school.isActive },
            });
            await audit_service_1.AuditService.log({
                schoolId,
                userId: req.user?.userId,
                action: updated.isActive ? 'SCHOOL_ACTIVATED' : 'SCHOOL_SUSPENDED',
                entity: 'School',
                entityId: schoolId,
                newValue: { isActive: updated.isActive },
            });
            return apiResponse_1.ResponseUtil.success(res, updated, `School ${updated.name} has been ${updated.isActive ? 'activated' : 'suspended'}`);
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async getPlatformStats(req, res, next) {
        try {
            if (req.user?.roleCode !== 'SUPER_ADMIN') {
                return apiResponse_1.ResponseUtil.forbidden(res, 'Only Super Admins can access SaaS platform overview');
            }
            const [totalSchools, activeSchools, suspendedSchools, totalStudents, activeStudents, totalStaff, feeAgg, recentSchools, recentAuditLogs, schoolsUtilization,] = await Promise.all([
                prisma_1.prisma.school.count(),
                prisma_1.prisma.school.count({ where: { isActive: true } }),
                prisma_1.prisma.school.count({ where: { isActive: false } }),
                prisma_1.prisma.student.count(),
                prisma_1.prisma.student.count({ where: { status: 'ACTIVE' } }),
                prisma_1.prisma.user.count({
                    where: {
                        role: { code: { not: 'SUPER_ADMIN' } },
                    },
                }),
                prisma_1.prisma.feeInvoice.aggregate({
                    _sum: {
                        totalAmount: true,
                        paidAmount: true,
                        balanceAmount: true,
                    },
                    _count: {
                        id: true,
                    },
                }),
                prisma_1.prisma.school.findMany({
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
                prisma_1.prisma.auditLog.findMany({
                    take: 8,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true } },
                        school: { select: { name: true, code: true } },
                    },
                }),
                prisma_1.prisma.school.findMany({
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
            const schoolFeeStats = await prisma_1.prisma.feeInvoice.groupBy({
                by: ['schoolId'],
                _sum: {
                    totalAmount: true,
                    paidAmount: true,
                    balanceAmount: true,
                },
            });
            const feeStatsMap = new Map(schoolFeeStats.map((f) => [
                f.schoolId,
                {
                    totalBilled: Number(f._sum.totalAmount || 0),
                    totalCollected: Number(f._sum.paidAmount || 0),
                    totalPending: Number(f._sum.balanceAmount || 0),
                },
            ]));
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
            return apiResponse_1.ResponseUtil.success(res, {
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
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
}
exports.SchoolController = SchoolController;
//# sourceMappingURL=school.controller.js.map