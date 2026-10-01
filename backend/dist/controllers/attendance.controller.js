"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const attendance_service_1 = require("../services/attendance.service");
const apiResponse_1 = require("../utils/apiResponse");
class AttendanceController {
    static async markAttendance(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const userId = req.user?.id || req.user?.userId;
            const record = await attendance_service_1.AttendanceService.markAttendance(schoolId, userId, req.body);
            return apiResponse_1.ResponseUtil.created(res, record, 'Student attendance marked successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async bulkMarkAttendance(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const userId = req.user?.id || req.user?.userId;
            const result = await attendance_service_1.AttendanceService.bulkMarkAttendance(schoolId, userId, req.body);
            return apiResponse_1.ResponseUtil.created(res, result, `Attendance marked for ${result.totalMarked} students`);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAttendance(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { date, startDate, endDate, classId, sectionId, academicSessionId, studentId, status, } = req.query;
            const records = await attendance_service_1.AttendanceService.getAttendance(schoolId, {
                date,
                startDate,
                endDate,
                classId,
                sectionId,
                academicSessionId,
                studentId,
                status,
            });
            return apiResponse_1.ResponseUtil.success(res, records);
        }
        catch (err) {
            next(err);
        }
    }
    static async getDailySummary(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { date, classId, sectionId, academicSessionId } = req.query;
            if (!date) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'Date query parameter (YYYY-MM-DD) is required');
            }
            const summary = await attendance_service_1.AttendanceService.getDailySummary(schoolId, {
                date,
                classId,
                sectionId,
                academicSessionId,
            });
            return apiResponse_1.ResponseUtil.success(res, summary);
        }
        catch (err) {
            next(err);
        }
    }
    static async getStudentStats(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { studentId } = req.params;
            const { academicSessionId } = req.query;
            const stats = await attendance_service_1.AttendanceService.getStudentStats(schoolId, studentId, academicSessionId);
            return apiResponse_1.ResponseUtil.success(res, stats);
        }
        catch (err) {
            next(err);
        }
    }
    static async getMonthlyRegister(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { classId, sectionId, year, month } = req.query;
            if (!classId || !sectionId || !year || !month) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'classId, sectionId, year, and month are all required to fetch the monthly register');
            }
            const register = await attendance_service_1.AttendanceService.getMonthlyRegister(schoolId, {
                classId,
                sectionId,
                year: parseInt(year, 10),
                month: parseInt(month, 10),
            });
            return apiResponse_1.ResponseUtil.success(res, register);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AttendanceController = AttendanceController;
//# sourceMappingURL=attendance.controller.js.map