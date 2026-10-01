"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicController = void 0;
const academic_service_1 = require("../services/academic.service");
const apiResponse_1 = require("../utils/apiResponse");
class AcademicController {
    static async getSessions(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const sessions = await academic_service_1.AcademicService.getSessions(schoolId);
            return apiResponse_1.ResponseUtil.success(res, sessions);
        }
        catch (err) {
            next(err);
        }
    }
    static async getSessionById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const session = await academic_service_1.AcademicService.getSessionById(req.params.id, schoolId);
            return apiResponse_1.ResponseUtil.success(res, session);
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            next(err);
        }
    }
    static async createSession(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const session = await academic_service_1.AcademicService.createSession(schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.created(res, session, 'Academic session created successfully');
        }
        catch (err) {
            if (err.message.includes('already exists')) {
                return apiResponse_1.ResponseUtil.conflict(res, err.message);
            }
            next(err);
        }
    }
    static async updateSession(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const session = await academic_service_1.AcademicService.updateSession(req.params.id, schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.success(res, session, 'Academic session updated successfully');
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            if (err.message.includes('already exists')) {
                return apiResponse_1.ResponseUtil.conflict(res, err.message);
            }
            next(err);
        }
    }
    static async setCurrentSession(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const session = await academic_service_1.AcademicService.setCurrentSession(req.params.id, schoolId, req.user?.id);
            return apiResponse_1.ResponseUtil.success(res, session, 'Academic session set as current');
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            next(err);
        }
    }
}
exports.AcademicController = AcademicController;
//# sourceMappingURL=academic.controller.js.map