"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    static async getRoles(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const roles = await user_service_1.UserService.getRoles(schoolId);
            return apiResponse_1.ResponseUtil.success(res, roles, 'Roles retrieved');
        }
        catch (err) {
            next(err);
        }
    }
    static async getPermissions(req, res, next) {
        try {
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
            const permissions = await prisma.permission.findMany({
                orderBy: [{ module: 'asc' }, { code: 'asc' }],
                select: {
                    id: true,
                    code: true,
                    module: true,
                    action: true,
                    description: true,
                },
            });
            return apiResponse_1.ResponseUtil.success(res, permissions, 'Permissions retrieved');
        }
        catch (err) {
            next(err);
        }
    }
    static async createRole(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { name, code, description, permissionCodes } = req.body;
            if (!name || !code) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'Role name and code are required');
            }
            const role = await user_service_1.UserService.createCustomRole(schoolId, { name, code, description, permissionCodes }, req.user?.id);
            return apiResponse_1.ResponseUtil.created(res, role, 'Custom role created successfully');
        }
        catch (err) {
            return apiResponse_1.ResponseUtil.badRequest(res, err.message);
        }
    }
    static async updateRolePermissions(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const roleId = req.params.id;
            const { permissionCodes } = req.body;
            if (!Array.isArray(permissionCodes)) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'permissionCodes must be an array of strings');
            }
            const updated = await user_service_1.UserService.updateRolePermissions(roleId, schoolId, permissionCodes, req.user?.id);
            return apiResponse_1.ResponseUtil.success(res, updated, 'Role permissions updated successfully');
        }
        catch (err) {
            return apiResponse_1.ResponseUtil.badRequest(res, err.message);
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map