import { Response, NextFunction } from 'express';
import { ExamService } from '../services/exam.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

export class ExamController {
  // ==========================================
  // 1. EXAM TERMS
  // ==========================================

  static async getTerms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { academicSessionId } = req.query as { academicSessionId?: string };
      const terms = await ExamService.getExamTerms(schoolId, academicSessionId);
      return ResponseUtil.success(res, terms);
    } catch (err) {
      next(err);
    }
  }

  static async getTermById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const term = await ExamService.getExamTermById(schoolId, req.params.id);
      return ResponseUtil.success(res, term);
    } catch (err) {
      next(err);
    }
  }

  static async createTerm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const term = await ExamService.createExamTerm(schoolId, req.body);
      return ResponseUtil.created(res, term, 'Exam term created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateTerm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const term = await ExamService.updateExamTerm(schoolId, req.params.id, req.body);
      return ResponseUtil.success(res, term, 'Exam term updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteTerm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const term = await ExamService.deleteExamTerm(schoolId, req.params.id);
      return ResponseUtil.success(res, term, 'Exam term deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 2. GRADING SCALES
  // ==========================================

  static async getScales(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const scales = await ExamService.getGradingScales(schoolId);
      return ResponseUtil.success(res, scales);
    } catch (err) {
      next(err);
    }
  }

  static async getScaleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const scale = await ExamService.getGradingScaleById(schoolId, req.params.id);
      return ResponseUtil.success(res, scale);
    } catch (err) {
      next(err);
    }
  }

  static async createScale(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const scale = await ExamService.createGradingScale(schoolId, req.body);
      return ResponseUtil.created(res, scale, 'Grading scale created successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 3. EXAM SCHEDULES
  // ==========================================

  static async getSchedules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { examTermId, classId, subjectId } = req.query as {
        examTermId?: string;
        classId?: string;
        subjectId?: string;
      };

      const schedules = await ExamService.getExamSchedules(schoolId, {
        examTermId,
        classId,
        subjectId,
      });
      return ResponseUtil.success(res, schedules);
    } catch (err) {
      next(err);
    }
  }

  static async getScheduleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const schedule = await ExamService.getExamScheduleById(schoolId, req.params.id);
      return ResponseUtil.success(res, schedule);
    } catch (err) {
      next(err);
    }
  }

  static async createSchedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const schedule = await ExamService.createExamSchedule(schoolId, req.body);
      return ResponseUtil.created(res, schedule, 'Exam schedule paper created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateSchedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const schedule = await ExamService.updateExamSchedule(schoolId, req.params.id, req.body);
      return ResponseUtil.success(res, schedule, 'Exam schedule paper updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteSchedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const schedule = await ExamService.deleteExamSchedule(schoolId, req.params.id);
      return ResponseUtil.success(res, schedule, 'Exam schedule paper deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 4. MARKS ENTRY
  // ==========================================

  static async getMarks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const marks = await ExamService.getScheduleMarks(schoolId, req.params.scheduleId);
      return ResponseUtil.success(res, marks);
    } catch (err) {
      next(err);
    }
  }

  static async enterMarks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const userId = req.user?.id || req.user?.userId;
      const result = await ExamService.enterMarks(
        schoolId,
        req.params.scheduleId,
        userId,
        req.body.marks
      );
      return ResponseUtil.created(res, result, 'Exam marks saved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 5. PROGRESS REPORT CARD
  // ==========================================

  static async getStudentReportCard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const studentId = req.params.studentId;
      const examTermId = req.query.examTermId as string;

      if (!examTermId) {
        throw new ApiError(400, 'examTermId query parameter is required');
      }

      const reportCard = await ExamService.generateStudentReportCard(
        schoolId,
        studentId,
        examTermId
      );

      return ResponseUtil.success(res, reportCard);
    } catch (err) {
      next(err);
    }
  }
}
