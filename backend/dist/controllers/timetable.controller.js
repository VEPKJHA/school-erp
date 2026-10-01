"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableController = void 0;
const timetable_service_1 = require("../services/timetable.service");
const apiResponse_1 = require("../utils/apiResponse");
class TimetableController {
    // ==========================================
    // SUBJECTS
    // ==========================================
    static async getSubjects(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
            const subjects = await timetable_service_1.TimetableService.getSubjects(schoolId, isActive);
            return apiResponse_1.ResponseUtil.success(res, subjects);
        }
        catch (err) {
            next(err);
        }
    }
    static async getSubjectById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const subject = await timetable_service_1.TimetableService.getSubjectById(schoolId, req.params.id);
            return apiResponse_1.ResponseUtil.success(res, subject);
        }
        catch (err) {
            next(err);
        }
    }
    static async createSubject(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const subject = await timetable_service_1.TimetableService.createSubject(schoolId, req.body);
            return apiResponse_1.ResponseUtil.created(res, subject, 'Subject created successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateSubject(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const subject = await timetable_service_1.TimetableService.updateSubject(schoolId, req.params.id, req.body);
            return apiResponse_1.ResponseUtil.success(res, subject, 'Subject updated successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async assignClassSubject(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const record = await timetable_service_1.TimetableService.assignClassSubject(schoolId, req.body);
            return apiResponse_1.ResponseUtil.created(res, record, 'Subject mapped to class successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async getClassSubjects(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const subjects = await timetable_service_1.TimetableService.getClassSubjects(schoolId, req.params.classId);
            return apiResponse_1.ResponseUtil.success(res, subjects);
        }
        catch (err) {
            next(err);
        }
    }
    // ==========================================
    // TIMETABLE SLOTS
    // ==========================================
    static async createSlot(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const slot = await timetable_service_1.TimetableService.createSlot(schoolId, req.body);
            return apiResponse_1.ResponseUtil.created(res, slot, 'Timetable period scheduled successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateSlot(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const slot = await timetable_service_1.TimetableService.updateSlot(schoolId, req.params.id, req.body);
            return apiResponse_1.ResponseUtil.success(res, slot, 'Timetable period updated successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteSlot(req, res, next) {
        try {
            const schoolId = req.schoolId;
            await timetable_service_1.TimetableService.deleteSlot(schoolId, req.params.id);
            return apiResponse_1.ResponseUtil.success(res, null, 'Timetable period deleted successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async getSectionTimetable(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { sectionId } = req.params;
            const { academicSessionId, dayOfWeek } = req.query;
            const schedule = await timetable_service_1.TimetableService.getSectionTimetable(schoolId, sectionId, academicSessionId, dayOfWeek);
            return apiResponse_1.ResponseUtil.success(res, schedule);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTeacherTimetable(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { teacherId } = req.params;
            const { academicSessionId, dayOfWeek } = req.query;
            const schedule = await timetable_service_1.TimetableService.getTeacherTimetable(schoolId, teacherId, academicSessionId, dayOfWeek);
            return apiResponse_1.ResponseUtil.success(res, schedule);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TimetableController = TimetableController;
//# sourceMappingURL=timetable.controller.js.map