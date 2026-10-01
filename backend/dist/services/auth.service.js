"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../config/prisma");
const user_repository_1 = require("../repositories/user.repository");
const school_repository_1 = require("../repositories/school.repository");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const audit_service_1 = require("./audit.service");
class AuthService {
    static async login(params) {
        const { email, password, schoolCode, ipAddress, userAgent } = params;
        let targetSchoolId = null;
        let school = null;
        if (schoolCode) {
            school = await school_repository_1.SchoolRepository.findByCode(schoolCode.trim());
            if (!school) {
                throw new Error('Invalid school code');
            }
            if (!school.isActive) {
                throw new Error('This school institution has been deactivated');
            }
            targetSchoolId = school.id;
        }
        let user = await user_repository_1.UserRepository.findByEmailAndSchool(email.toLowerCase().trim(), targetSchoolId);
        if (!user && !schoolCode) {
            user = await user_repository_1.UserRepository.findByEmailAndSchool(email.toLowerCase().trim(), null);
        }
        if (!user) {
            throw new Error('Invalid email or password');
        }
        if (user.status !== 'ACTIVE') {
            throw new Error('Your user account is suspended or inactive');
        }
        const isMatch = await (0, password_1.comparePassword)(password, user.passwordHash);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }
        const permissions = user.role.permissions.map((rp) => rp.permission.code);
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            schoolId: user.schoolId,
            roleId: user.roleId,
            roleCode: user.role.code,
            permissions,
        };
        const accessToken = (0, jwt_1.signAccessToken)(tokenPayload);
        const rawRefreshToken = (0, jwt_1.generateRefreshTokenString)();
        const tokenHash = (0, jwt_1.hashRefreshToken)(rawRefreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
            },
        });
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        await audit_service_1.AuditService.log({
            schoolId: user.schoolId,
            userId: user.id,
            action: 'LOGIN',
            entity: 'User',
            entityId: user.id,
            ipAddress,
            userAgent,
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                role: {
                    id: user.role.id,
                    code: user.role.code,
                    name: user.role.name,
                },
                school: user.school
                    ? {
                        id: user.school.id,
                        name: user.school.name,
                        code: user.school.code,
                        logoUrl: user.school.logoUrl,
                    }
                    : null,
                permissions,
            },
            accessToken,
            refreshToken: rawRefreshToken,
        };
    }
    static async refreshToken(rawRefreshToken) {
        if (!rawRefreshToken) {
            throw new Error('Refresh token is required');
        }
        const tokenHash = (0, jwt_1.hashRefreshToken)(rawRefreshToken);
        const record = await prisma_1.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: {
                user: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: { permission: true },
                                },
                            },
                        },
                        school: true,
                    },
                },
            },
        });
        if (!record || record.isRevoked || new Date() > record.expiresAt) {
            if (record) {
                await prisma_1.prisma.refreshToken.update({
                    where: { id: record.id },
                    data: { isRevoked: true },
                });
            }
            throw new Error('Invalid or expired refresh token');
        }
        const user = record.user;
        if (user.status !== 'ACTIVE') {
            throw new Error('User account is inactive');
        }
        await prisma_1.prisma.refreshToken.update({
            where: { id: record.id },
            data: { isRevoked: true },
        });
        const newRawRefreshToken = (0, jwt_1.generateRefreshTokenString)();
        const newTokenHash = (0, jwt_1.hashRefreshToken)(newRawRefreshToken);
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7);
        await prisma_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: newTokenHash,
                expiresAt: newExpiresAt,
            },
        });
        const permissions = user.role.permissions.map((rp) => rp.permission.code);
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            schoolId: user.schoolId,
            roleId: user.roleId,
            roleCode: user.role.code,
            permissions,
        };
        const newAccessToken = (0, jwt_1.signAccessToken)(tokenPayload);
        return {
            accessToken: newAccessToken,
            refreshToken: newRawRefreshToken,
        };
    }
    static async logout(rawRefreshToken, userId) {
        if (rawRefreshToken) {
            const tokenHash = (0, jwt_1.hashRefreshToken)(rawRefreshToken);
            await prisma_1.prisma.refreshToken.updateMany({
                where: { tokenHash },
                data: { isRevoked: true },
            });
        }
        else if (userId) {
            await prisma_1.prisma.refreshToken.updateMany({
                where: { userId },
                data: { isRevoked: true },
            });
        }
    }
    static async getMe(userId) {
        const user = await user_repository_1.UserRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const permissions = user.role.permissions.map((rp) => rp.permission.code);
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            status: user.status,
            role: {
                id: user.role.id,
                code: user.role.code,
                name: user.role.name,
            },
            school: user.school
                ? {
                    id: user.school.id,
                    name: user.school.name,
                    code: user.school.code,
                    logoUrl: user.school.logoUrl,
                    city: user.school.city,
                    board: user.school.board,
                }
                : null,
            permissions,
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map