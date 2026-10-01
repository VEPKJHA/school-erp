"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamController = void 0;
const exam_service_1 = require("../services/exam.service");
const apiResponse_1 = require("../utils/apiResponse");
const ApiError_1 = require("../utils/ApiError");
class ExamController {
    // ==========================================
    // 1. EXAM TERMS
    // ==========================================
    static async getTerms(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { academicSessionId } = req.query;
            const terms = await exam_service_1.ExamService.getExamTerms(schoolId, academicSessionId);
            return apiResponse_1.ResponseUtil.success(res, terms);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTermById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const term = await exam_service_1.ExamService.getExamTermById(schoolId, req.params.id);
            return apiResponse_1.ResponseUtil.success(res, term);
        }
        catch (err) {
            next(err);
        }
    }
    static async createTerm(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const term = await exam_service_1.ExamService.createExamTerm(schoolId, req.body);
            return apiResponse_1.ResponseUtil.created(res, term, 'Exam term created successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateTerm(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const term = await exam_service_1.ExamService.updateExamTerm(schoolId, req.params.id, req.body);
            return apiResponse_1.ResponseUtil.success(res, term, 'Exam term updated successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteTerm(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const term = await exam_service_1.ExamService.deleteExamTerm(schoolId, req.params.id);
            return apiResponse_1.ResponseUtil.success(res, term, 'Exam term deleted successfully');
        }
        catch (err) {
            next(err);
        }
    }
    // ==========================================
    // 2. GRADING SCALES
    // ==========================================
    static async getScales(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const scales = await exam_service_1.ExamService.getGradingScales(schoolId);
            return apiResponse_1.ResponseUtil.success(res, scales);
        }
        catch (err) {
            next(err);
        }
    }
    static async getScaleById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const scale = await exam_service_1.ExamService.getGradingScaleById(schoolId, req.params.id);
            return apiResponse_1.ResponseUtil.success(res, scale);
        }
        catch (err) {
            next(err);
        }
    }
    static async createScale(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const scale = await exam_service_1.ExamService.createGradingScale(schoolId, req.body);
            return apiResponse_1.ResponseUtil.created(res, scale, 'Grading scale created successfully');
        }
        catch (err) {
            next(err);
        }
    }
    // ==========================================
    // 3. EXAM SCHEDULES
    // ==========================================
    static async getSchedules(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { examTermId, classId, subjectId } = req.query;
            const schedules = await exam_service_1.ExamService.getExamSchedules(schoolId, {
                examTermId,
                classId,
                subjectId,
            });
            return apiResponse_1.ResponseUtil.success(res, schedules);
        }
        catch (err) {
            next(err);
        }
    }
    static async getScheduleById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const schedule = await exam_service_1.ExamService.getExamScheduleById(schoolId, req.params.id);
            return apiResponse_1.ResponseUtil.success(res, schedule);
        }
        catch (err) {
            next(err);
        }
    }
    static async createSchedule(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const schedule = await exam_service_1.ExamService.createExamSchedule(schoolId, req.body);
            return apiResponse_1.ResponseUtil.created(res, schedule, 'Exam schedule paper created successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateSchedule(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const schedule = await exam_service_1.ExamService.updateExamSchedule(schoolId, req.params.id, req.body);
            return apiResponse_1.ResponseUtil.success(res, schedule, 'Exam schedule paper updated successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteSchedule(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const schedule = await exam_service_1.ExamService.deleteExamSchedule(schoolId, req.params.id);
            return apiResponse_1.ResponseUtil.success(res, schedule, 'Exam schedule paper deleted successfully');
        }
        catch (err) {
            next(err);
        }
    }
    // ==========================================
    // 4. MARKS ENTRY
    // ==========================================
    static async getMarks(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const marks = await exam_service_1.ExamService.getScheduleMarks(schoolId, req.params.scheduleId);
            return apiResponse_1.ResponseUtil.success(res, marks);
        }
        catch (err) {
            next(err);
        }
    }
    static async enterMarks(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const userId = req.user?.id || req.user?.userId;
            const result = await exam_service_1.ExamService.enterMarks(schoolId, req.params.scheduleId, userId, req.body.marks);
            return apiResponse_1.ResponseUtil.created(res, result, 'Exam marks saved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    // ==========================================
    // 5. PROGRESS REPORT CARD
    // ==========================================
    static async getStudentReportCard(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const studentId = req.params.studentId;
            const examTermId = req.query.examTermId;
            if (!examTermId) {
                throw new ApiError_1.ApiError(400, 'examTermId query parameter is required');
            }
            const reportCard = await exam_service_1.ExamService.generateStudentReportCard(schoolId, studentId, examTermId);
            return apiResponse_1.ResponseUtil.success(res, reportCard);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ExamController = ExamController;
//# sourceMappingURL=exam.controller.js.map