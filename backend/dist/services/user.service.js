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
            },
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map