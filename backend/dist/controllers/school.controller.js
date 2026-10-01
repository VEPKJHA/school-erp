"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolController = void 0;
const school_repository_1 = require("../repositories/school.repository");
const apiResponse_1 = require("../utils/apiResponse");
const audit_service_1 = require("../services/audit.service");
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
}
exports.SchoolController = SchoolController;
//# sourceMappingURL=school.controller.js.map