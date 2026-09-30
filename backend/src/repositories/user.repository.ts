import { prisma } from '../config/prisma';

export class UserRepository {
  static async findById(id: string, schoolId?: string) {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return prisma.user.findFirst({
      where,
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
    });
  }

  static async findByEmailAndSchool(email: string, schoolId: string | null) {
    return prisma.user.findFirst({
      where: {
        email,
        schoolId: schoolId,
      },
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
    });
  }

  static async findAll(params: {
    schoolId?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    roleId?: string;
    status?: any;
  }) {
    const { schoolId, page = 1, pageSize = 20, search, roleId, status } = params;
    const where: any = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }
    if (roleId) {
      where.roleId = roleId;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          role: {
            select: { id: true, name: true, code: true },
          },
          school: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
    ]);

    return { total, users };
  }

  static async create(data: any) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, name: true, code: true } },
      },
    });
  }

  static async update(id: string, schoolId: string | undefined, data: any) {
    const where: any = { id };
    if (schoolId) where.schoolId = schoolId;

    const existing = await prisma.user.findFirst({ where });
    if (!existing) return null;

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        updatedAt: true,
        role: { select: { id: true, name: true, code: true } },
      },
    });
  }

  static async updateStatus(id: string, schoolId: string | undefined, status: any) {
    const where: any = { id };
    if (schoolId) where.schoolId = schoolId;

    const existing = await prisma.user.findFirst({ where });
    if (!existing) return null;

    return prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }
}
