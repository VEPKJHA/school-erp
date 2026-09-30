import { prisma } from '../config/prisma';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/password';
import { AuditService } from './audit.service';
import { CreateUserInput, UpdateUserInput } from '../validations/user.validation';

export class UserService {
  static async getUsers(params: {
    schoolId?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    roleId?: string;
    status?: any;
  }) {
    return UserRepository.findAll(params);
  }

  static async getUserById(id: string, schoolId?: string) {
    const user = await UserRepository.findById(id, schoolId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  static async createUser(
    schoolId: string | null,
    data: CreateUserInput,
    actorId?: string
  ) {
    const role = await prisma.role.findFirst({
      where: {
        id: data.roleId,
        OR: [{ schoolId: schoolId || undefined }, { schoolId: null }],
      },
    });

    if (!role) {
      throw new Error('Invalid role selected for this institution');
    }

    const existing = await UserRepository.findByEmailAndSchool(
      data.email.toLowerCase().trim(),
      schoolId
    );
    if (existing) {
      throw new Error(`User with email '${data.email}' already exists in this institution`);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await UserRepository.create({
      schoolId,
      roleId: role.id,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim(),
      passwordHash,
      status: 'ACTIVE',
    });

    await AuditService.log({
      schoolId,
      userId: actorId,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      newValue: { id: user.id, email: user.email, role: role.name },
    });

    return user;
  }

  static async updateUser(
    id: string,
    schoolId: string | undefined,
    data: UpdateUserInput,
    actorId?: string
  ) {
    const existing = await UserRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('User not found');
    }

    if (data.roleId) {
      const role = await prisma.role.findFirst({
        where: {
          id: data.roleId,
          OR: [{ schoolId: schoolId || undefined }, { schoolId: null }],
        },
      });
      if (!role) {
        throw new Error('Invalid role selected');
      }
    }

    const updated = await UserRepository.update(id, schoolId, {
      ...(data.firstName ? { firstName: data.firstName.trim() } : {}),
      ...(data.lastName ? { lastName: data.lastName.trim() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() } : {}),
      ...(data.roleId ? { roleId: data.roleId } : {}),
      ...(data.status ? { status: data.status } : {}),
    });

    await AuditService.log({
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

  static async updateStatus(
    id: string,
    schoolId: string | undefined,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    actorId?: string
  ) {
    const existing = await UserRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('User not found');
    }

    const updated = await UserRepository.updateStatus(id, schoolId, status);

    await AuditService.log({
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

  static async deactivateUser(id: string, schoolId?: string, actorId?: string) {
    return this.updateStatus(id, schoolId, 'INACTIVE', actorId);
  }

  static async getRoles(schoolId?: string) {
    return prisma.role.findMany({
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
