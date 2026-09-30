import { prisma } from '../config/prisma';
import { UserRepository } from '../repositories/user.repository';
import { SchoolRepository } from '../repositories/school.repository';
import { comparePassword } from '../utils/password';
import {
  signAccessToken,
  generateRefreshTokenString,
  hashRefreshToken,
  TokenUserPayload,
} from '../utils/jwt';
import { AuditService } from './audit.service';

export class AuthService {
  static async login(params: {
    email: string;
    password: string;
    schoolCode?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { email, password, schoolCode, ipAddress, userAgent } = params;

    let targetSchoolId: string | null = null;
    let school: any = null;

    if (schoolCode) {
      school = await SchoolRepository.findByCode(schoolCode.trim());
      if (!school) {
        throw new Error('Invalid school code');
      }
      if (!school.isActive) {
        throw new Error('This school institution has been deactivated');
      }
      targetSchoolId = school.id;
    }

    let user = await UserRepository.findByEmailAndSchool(email.toLowerCase().trim(), targetSchoolId);

    if (!user && !schoolCode) {
      user = await UserRepository.findByEmailAndSchool(email.toLowerCase().trim(), null);
    }

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Your user account is suspended or inactive');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const permissions: string[] = user.role.permissions.map((rp: any) => rp.permission.code);

    const tokenPayload: TokenUserPayload = {
      userId: user.id,
      email: user.email,
      schoolId: user.schoolId,
      roleId: user.roleId,
      roleCode: user.role.code,
      permissions,
    };

    const accessToken = signAccessToken(tokenPayload);

    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await AuditService.log({
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

  static async refreshToken(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new Error('Refresh token is required');
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);

    const record = await prisma.refreshToken.findUnique({
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
        await prisma.refreshToken.update({
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

    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { isRevoked: true },
    });

    const newRawRefreshToken = generateRefreshTokenString();
    const newTokenHash = hashRefreshToken(newRawRefreshToken);
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      },
    });

    const permissions: string[] = user.role.permissions.map((rp: any) => rp.permission.code);

    const tokenPayload: TokenUserPayload = {
      userId: user.id,
      email: user.email,
      schoolId: user.schoolId,
      roleId: user.roleId,
      roleCode: user.role.code,
      permissions,
    };

    const newAccessToken = signAccessToken(tokenPayload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  static async logout(rawRefreshToken?: string, userId?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashRefreshToken(rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    } else if (userId) {
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }
  }

  static async getMe(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const permissions: string[] = user.role.permissions.map((rp: any) => rp.permission.code);

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
