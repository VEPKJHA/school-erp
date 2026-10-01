"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const apiResponse_1 = require("../utils/apiResponse");
class UserController {
    static async getUsers(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { roleId, status, page, pageSize, search } = req.query;
            const data = await user_service_1.UserService.getUsers({
                schoolId,
                roleId: roleId,
                status: status,
                search: search,
                page: page ? parseInt(page, 10) : 1,
                pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            });
            return apiResponse_1.ResponseUtil.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async getUserById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const user = await user_service_1.UserService.getUserById(req.params.id, schoolId);
            return apiResponse_1.ResponseUtil.success(res, user);
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            next(err);
        }
    }
    static async createUser(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const user = await user_service_1.UserService.createUser(schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.created(res, user, 'User account created successfully');
        }
        catch (err) {
            if (err.message.includes('already exists')) {
                return apiResponse_1.ResponseUtil.conflict(res, err.message);
            }
            next(err);
        }
    }
    static async updateUser(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const user = await user_service_1.UserService.updateUser(req.params.id, schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.success(res, user, 'User updated successfully');
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            next(err);
        }
    }
    static async deactivateUser(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const user = await user_service_1.UserService.deactivateUser(req.params.id, schoolId, req.user?.id);
            return apiResponse_1.ResponseUtil.success(res, user, 'User deactivated successfully');
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            next(err);
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map