"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassController = void 0;
const class_service_1 = require("../services/class.service");
const apiResponse_1 = require("../utils/apiResponse");
class ClassController {
    static async getClasses(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 50;
            const search = req.query.search;
            const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
            const result = await class_service_1.ClassService.getClasses({
                schoolId,
                page,
                pageSize,
                search,
                isActive,
            });
            return apiResponse_1.ResponseUtil.success(res, result.classes, 'Classes retrieved successfully', 200, {
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
    static async getClassById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const classRecord = await class_service_1.ClassService.getClassById(id, schoolId);
            return apiResponse_1.ResponseUtil.success(res, classRecord, 'Class retrieved successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.notFound(res, error.message);
        }
    }
    static async createClass(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const newClass = await class_service_1.ClassService.createClass(schoolId, req.body, req.user?.userId);
            return apiResponse_1.ResponseUtil.created(res, newClass, 'Class created successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async updateClass(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const updated = await class_service_1.ClassService.updateClass(id, schoolId, req.body, req.user?.userId);
            return apiResponse_1.ResponseUtil.success(res, updated, 'Class updated successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async deactivateClass(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const deactivated = await class_service_1.ClassService.deactivateClass(id, schoolId, req.user?.userId);
            return apiResponse_1.ResponseUtil.success(res, deactivated, 'Class deactivated successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async getSections(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 50;
            const search = req.query.search;
            const classId = req.query.classId;
            const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
            const result = await class_service_1.ClassService.getSections({
                schoolId,
                classId,
                page,
                pageSize,
                search,
                isActive,
            });
            return apiResponse_1.ResponseUtil.success(res, result.sections, 'Sections retrieved successfully', 200, {
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
    static async getSectionById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const section = await class_service_1.ClassService.getSectionById(id, schoolId);
            return apiResponse_1.ResponseUtil.success(res, section, 'Section retrieved successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.notFound(res, error.message);
        }
    }
    static async createSection(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const classId = req.params.classId || req.body.classId;
            if (!classId) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'classId is required to create a section');
            }
            const section = await class_service_1.ClassService.createSection(classId, schoolId, req.body, req.user?.userId);
            return apiResponse_1.ResponseUtil.created(res, section, 'Section created successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async updateSection(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const updated = await class_service_1.ClassService.updateSection(id, schoolId, req.body, req.user?.userId);
            return apiResponse_1.ResponseUtil.success(res, updated, 'Section updated successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async deactivateSection(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const deactivated = await class_service_1.ClassService.deactivateSection(id, schoolId, req.user?.userId);
            return apiResponse_1.ResponseUtil.success(res, deactivated, 'Section deactivated successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
}
exports.ClassController = ClassController;
//# sourceMappingURL=class.controller.js.map