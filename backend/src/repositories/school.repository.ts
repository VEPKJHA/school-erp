import { prisma } from '../config/prisma';

export class SchoolRepository {
  static async findById(id: string) {
    return prisma.school.findUnique({
      where: { id },
    });
  }

  static async findByCode(code: string) {
    return prisma.school.findUnique({
      where: { code },
    });
  }

  static async update(id: string, data: any) {
    return prisma.school.update({
      where: { id },
      data,
    });
  }

  static async findAll(page = 1, pageSize = 20, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [total, schools] = await Promise.all([
      prisma.school.count({ where }),
      prisma.school.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
    ]);

    return { total, schools };
  }
}

