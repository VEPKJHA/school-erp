"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const student_service_1 = require("../services/student.service");
const apiResponse_1 = require("../utils/apiResponse");
class StudentController {
    static async getStudents(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20;
            const classId = req.query.classId;
            const sectionId = req.query.sectionId;
            const status = req.query.status;
            const academicSessionId = req.query.academicSessionId;
            const search = req.query.search;
            const result = await student_service_1.StudentService.getStudents({
                schoolId,
                classId,
                sectionId,
                status,
                academicSessionId,
                search,
                page,
                pageSize,
            });
            return apiResponse_1.ResponseUtil.success(res, result.students, 'Students retrieved successfully', 200, {
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
    static async getStudentById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const student = await student_service_1.StudentService.getStudentById(id, schoolId);
            return apiResponse_1.ResponseUtil.success(res, student, 'Student profile retrieved');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.notFound(res, error.message);
        }
    }
    static async createStudent(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const student = await student_service_1.StudentService.createStudentDirect(schoolId, req.body, req.user?.userId);
            return apiResponse_1.ResponseUtil.created(res, student, 'Student registered successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async updateStudent(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const updated = await student_service_1.StudentService.updateStudent(id, schoolId, req.body, req.user?.userId);
            return apiResponse_1.ResponseUtil.success(res, updated, 'Student profile updated successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            const { status, reason } = req.body;
            const updated = await student_service_1.StudentService.updateStatus(id, schoolId, status, reason, req.user?.userId);
            return apiResponse_1.ResponseUtil.success(res, updated, 'Student status updated successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
}
exports.StudentController = StudentController;
//# sourceMappingURL=student.controller.js.map