import { Router } from 'express';
import authRoutes from './auth.routes';
import academicRoutes from './academic.routes';
import classRoutes from './class.routes';
import userRoutes from './user.routes';
import schoolRoutes from './school.routes';
import studentRoutes from './student.routes';
import admissionRoutes from './admission.routes';
import parentRoutes from './parent.routes';
import documentRoutes from './document.routes';
import feeRoutes from './fee.routes';
import staffRoutes from './staff.routes';
import attendanceRoutes from './attendance.routes';
import examRoutes from './exam.routes';
import timetableRoutes from './timetable.routes';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { prisma } from '../config/prisma';
import { ResponseUtil } from '../utils/apiResponse';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  return ResponseUtil.success(res, { status: 'healthy', timestamp: new Date() }, 'API is active');
});

// Mounted Routes
router.use('/auth', authRoutes);
router.use('/academic-sessions', academicRoutes);
router.use('/', classRoutes); // /classes and /sections
router.use('/users', userRoutes);
router.use('/schools', schoolRoutes);
router.use('/students', studentRoutes);
router.use('/admissions', admissionRoutes);
router.use('/parents', parentRoutes);
router.use('/documents', documentRoutes);
router.use('/fees', feeRoutes);
router.use('/staff', staffRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/exams', examRoutes);
router.use('/timetable', timetableRoutes);

// Dashboard Live Stats Endpoint
router.get('/dashboard/stats', authenticate, enforceTenant, async (req: AuthenticatedRequest, res) => {
  try {
    const schoolId = req.schoolId;
    if (!schoolId) {
      return ResponseUtil.success(res, {
        totalSchools: await prisma.school.count(),
        totalUsers: await prisma.user.count(),
        totalStudents: await prisma.student.count(),
      });
    }

    const [
      classesCount,
      sectionsCount,
      usersCount,
      studentsCount,
      activeStudentsCount,
      pendingAdmissionsCount,
      currentSession,
    ] = await Promise.all([
      prisma.class.count({ where: { schoolId, isActive: true } }),
      prisma.section.count({ where: { schoolId, isActive: true } }),
      prisma.user.count({ where: { schoolId, status: 'ACTIVE' } }),
      prisma.student.count({ where: { schoolId } }),
      prisma.student.count({ where: { schoolId, status: 'ACTIVE' } }),
      prisma.admission.count({
        where: {
          schoolId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_PENDING'] },
        },
      }),
      prisma.academicSession.findFirst({ where: { schoolId, isCurrent: true } }),
    ]);

    return ResponseUtil.success(res, {
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
  } catch (error: any) {
    return ResponseUtil.badRequest(res, error.message);
  }
});

export default router;

