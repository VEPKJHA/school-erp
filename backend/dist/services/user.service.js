"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = require("../config/prisma");
const user_repository_1 = require("../repositories/user.repository");
const password_1 = require("../utils/password");
const audit_service_1 = require("./audit.service");
class UserService {
    static async getUsers(params) {
        return user_repository_1.UserRepository.findAll(params);
    }
    static async getUserById(id, schoolId) {
        const user = await user_repository_1.UserRepository.findById(id, schoolId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    static async createUser(schoolId, data, actorId) {
        const role = await prisma_1.prisma.role.findFirst({
            where: {
                id: data.roleId,
                OR: [{ schoolId: schoolId || undefined }, { schoolId: null }],
            },
        });
        if (!role) {
            throw new Error('Invalid role selected for this institution');
        }
        const existing = await user_repository_1.UserRepository.findByEmailAndSchool(data.email.toLowerCase().trim(), schoolId);
        if (existing) {
            throw new Error(`User with email '${data.email}' already exists in this institution`);
        }
        const passwordHash = await (0, password_1.hashPassword)(data.password);
        const user = await user_repository_1.UserRepository.create({
            schoolId,
            roleId: role.id,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.toLowerCase().trim(),
            phone: data.phone?.trim(),
            passwordHash,
            status: 'ACTIVE',
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId: actorId,
            action: 'USER_CREATED',
            entity: 'User',
            entityId: user.id,
            newValue: { id: user.id, email: user.email, role: role.name },
        });
        return user;
    }
    static async updateUser(id, schoolId, data, actorId) {
        const existing = await user_repository_1.UserRepository.findById(id, schoolId);
        if (!existing) {
            throw new Error('User not found');
        }
        if (data.roleId) {
            const role = await prisma_1.prisma.role.findFirst({
                where: {
                    id: data.roleId,
                    OR: [{ schoolId: schoolId || undefined }, { schoolId: null }],
                },
            });
            if (!role) {
                throw new Error('Invalid role selected');
            }
        }
        const updated = await user_repository_1.UserRepository.update(id, schoolId, {
            ...(data.firstName ? { firstName: data.firstName.trim() } : {}),
            ...(data.lastName ? { lastName: data.lastName.trim() } : {}),
            ...(data.phone !== undefined ? { phone: data.phone?.trim() } : {}),
            ...(data.roleId ? { roleId: data.roleId } : {}),
            ...(data.status ? { status: data.status } : {}),
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId: actorId,
            action: 'USER_UPDATED',
            entity: 'User',
            entityId: id,
            oldValue: { firstName: existing.firstName, lastName: existing.lastName, status: existing.status },
            newValue: updated,
        });
        return updated;
    }
    static async updateStatus(id, schoolId, status, actorId) {
        const existing = await user_repository_1.UserRepository.findById(id, schoolId);
        if (!existing) {
            throw new Error('User not found');
        }
        const updated = await user_repository_1.UserRepository.updateStatus(id, schoolId, status);
        await audit_service_1.AuditService.log({
            schoolId,
            userId: actorId,
            action: 'USER_STATUS_CHANGED',
            entity: 'User',
            entityId: id,
            oldValue: { status: existing.status },
            newValue: { status },
        });
        return updated;
    }
    static async deactivateUser(id, schoolId, actorId) {
        return this.updateStatus(id, schoolId, 'INACTIVE', actorId);
    }
    static async getRoles(schoolId) {
        return prisma_1.prisma.role.findMany({
            where: {
                OR: [{ schoolId: schoolId || undefined }, { schoolId: null }],
            },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                code: true,
                description: true,
                isSystem: true,
                schoolId: true,
                permissions: {
                    select: {
                        permission: {
                            select: {
                                id: true,
                                code: true,
                                module: true,
                                action: true,
                                description: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        users: true,
                        permissions: true,
                    },
                },
            },
        });
    }
    static async createCustomRole(schoolId, data, actorId) {
        // Check if role code already exists for this school
        const normalizedCode = data.code.trim().toUpperCase().replace(/\s+/g, '_');
        const existing = await prisma_1.prisma.role.findFirst({
            where: {
                schoolId,
                code: normalizedCode,
            },
        });
        if (existing) {
            throw new Error(`Role with code "${normalizedCode}" already exists for this institution`);
        }
        // Resolve permissions by code
        let permissionIds = [];
        if (data.permissionCodes && data.permissionCodes.length > 0) {
            const perms = await prisma_1.prisma.permission.findMany({
                where: { code: { in: data.permissionCodes } },
                select: { id: true },
            });
            permissionIds = perms.map((p) => p.id);
        }
        const newRole = await prisma_1.prisma.role.create({
            data: {
                schoolId,
                code: normalizedCode,
                name: data.name.trim(),
                description: data.description?.trim(),
                isSystem: false,
                permissions: {
                    create: permissionIds.map((pId) => ({
                        permissionId: pId,
                    })),
                },
            },
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId: actorId,
            action: 'ROLE_CREATED',
            entity: 'Role',
            entityId: newRole.id,
            newValue: { code: newRole.code, name: newRole.name, permissionsCount: permissionIds.length },
        });
        return newRole;
    }
    static async updateRolePermissions(roleId, schoolId, permissionCodes, actorId) {
        const role = await prisma_1.prisma.role.findFirst({
            where: { id: roleId, schoolId },
        });
        if (!role) {
            throw new Error('Role not found or cannot be modified');
        }
        // Resolve permissions
        const perms = await prisma_1.prisma.permission.findMany({
            where: { code: { in: permissionCodes } },
            select: { id: true },
        });
        const permissionIds = perms.map((p) => p.id);
        // Replace role permissions
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.rolePermission.deleteMany({ where: { roleId } }),
            prisma_1.prisma.rolePermission.createMany({
                data: permissionIds.map((pId) => ({
                    roleId,
                    permissionId: pId,
                })),
            }),
        ]);
        await audit_service_1.AuditService.log({
            schoolId,
            userId: actorId,
            action: 'ROLE_PERMISSIONS_UPDATED',
            entity: 'Role',
            entityId: roleId,
            newValue: { roleCode: role.code, permissionsCount: permissionIds.length },
        });
        return prisma_1.prisma.role.findUnique({
            where: { id: roleId },
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map