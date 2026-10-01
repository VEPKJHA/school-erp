"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionController = void 0;
const admission_service_1 = require("../services/admission.service");
const apiResponse_1 = require("../utils/apiResponse");
class AdmissionController {
    static async getAdmissions(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20;
            const academicSessionId = req.query.academicSessionId;
            const applyingClassId = req.query.applyingClassId;
            const status = req.query.status;
            const search = req.query.search;
            const result = await admission_service_1.AdmissionService.getAdmissions({
                schoolId,
                academicSessionId,
                applyingClassId,
                status,
                search,
                page,
                pageSize,
            });
            return apiResponse_1.ResponseUtil.success(res, result.admissions, 'Admissions retrieved successfully', 200, {
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
    static async getAdmissionById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const admission = await admission_service_1.AdmissionService.getAdmissionById(id, schoolId);
            return apiResponse_1.ResponseUtil.success(res, admission, 'Admission application retrieved');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.notFound(res, error.message);
        }
    }
    static async createAdmission(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const admission = await admission_service_1.AdmissionService.createAdmission(schoolId, req.body, req.user?.userId);
            return apiResponse_1.ResponseUtil.created(res, admission, 'Admission application submitted successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async approveAdmission(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const result = await admission_service_1.AdmissionService.approveAdmission(id, schoolId, req.body, req.user?.userId);
            return apiResponse_1.ResponseUtil.success(res, result, 'Admission approved and active student profile created');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async rejectAdmission(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const rejected = await admission_service_1.AdmissionService.rejectAdmission(id, schoolId, req.body, req.user?.userId);
            return apiResponse_1.ResponseUtil.success(res, rejected, 'Admission application marked as rejected');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
}
exports.AdmissionController = AdmissionController;
//# sourceMappingURL=admission.controller.js.map