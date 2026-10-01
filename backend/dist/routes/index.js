"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const academic_routes_1 = __importDefault(require("./academic.routes"));
const class_routes_1 = __importDefault(require("./class.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const school_routes_1 = __importDefault(require("./school.routes"));
const student_routes_1 = __importDefault(require("./student.routes"));
const admission_routes_1 = __importDefault(require("./admission.routes"));
const parent_routes_1 = __importDefault(require("./parent.routes"));
const document_routes_1 = __importDefault(require("./document.routes"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const prisma_1 = require("../config/prisma");
const apiResponse_1 = require("../utils/apiResponse");
const router = (0, express_1.Router)();
// Health Check
router.get('/health', (req, res) => {
    return apiResponse_1.ResponseUtil.success(res, { status: 'healthy', timestamp: new Date() }, 'API is active');
});
// Mounted Routes
router.use('/auth', auth_routes_1.default);
router.use('/academic-sessions', academic_routes_1.default);
router.use('/', class_routes_1.default); // /classes and /sections
router.use('/users', user_routes_1.default);
router.use('/schools', school_routes_1.default);
router.use('/students', student_routes_1.default);
router.use('/admissions', admission_routes_1.default);
router.use('/parents', parent_routes_1.default);
router.use('/documents', document_routes_1.default);
// Dashboard Live Stats Endpoint
router.get('/dashboard/stats', auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant, async (req, res) => {
    try {
        const schoolId = req.schoolId;
        if (!schoolId) {
            return apiResponse_1.ResponseUtil.success(res, {
                totalSchools: await prisma_1.prisma.school.count(),
                totalUsers: await prisma_1.prisma.user.count(),
                totalStudents: await prisma_1.prisma.student.count(),
            });
        }
        const [classesCount, sectionsCount, usersCount, studentsCount, activeStudentsCount, pendingAdmissionsCount, currentSession,] = await Promise.all([
            prisma_1.prisma.class.count({ where: { schoolId, isActive: true } }),
            prisma_1.prisma.section.count({ where: { schoolId, isActive: true } }),
            prisma_1.prisma.user.count({ where: { schoolId, status: 'ACTIVE' } }),
            prisma_1.prisma.student.count({ where: { schoolId } }),
            prisma_1.prisma.student.count({ where: { schoolId, status: 'ACTIVE' } }),
            prisma_1.prisma.admission.count({
                where: {
                    schoolId,
                    status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_PENDING'] },
                },
            }),
            prisma_1.prisma.academicSession.findFirst({ where: { schoolId, isCurrent: true } }),
        ]);
        return apiResponse_1.ResponseUtil.success(res, {
            totalClasses: classesCount,
            totalSections: sectionsCount,
            activeUsers: usersCount,
            totalStudents: studentsCount,
            activeStudents: activeStudentsCount,
            pendingAdmissions: pendingAdmissionsCount,
            currentSession: currentSession ? currentSession.name : 'None',
            currentSessionDates: currentSession
                ? {
                    start: currentSession.startDate,
                    end: currentSession.endDate,
                }
                : null,
        });
    }
    catch (error) {
        return apiResponse_1.ResponseUtil.badRequest(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map