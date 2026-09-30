import { prisma } from '../config/prisma';

export class AcademicRepository {
  static async findById(id: string, schoolId: string) {
    return prisma.academicSession.findFirst({
      where: { id, schoolId },
    });
  }

  static async findByName(name: string, schoolId: string) {
    return prisma.academicSession.findUnique({
      where: {
        schoolId_name: {
          schoolId,
          name,
        },
      },
    });
  }

  static async getCurrentSession(schoolId: string) {
    return prisma.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
    });
  }

  static async findAll(schoolId: string) {
    return prisma.academicSession.findMany({
      where: { schoolId },
      orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
    });
  }

  static async create(data: {
    schoolId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isCurrent?: boolean;
    status?: any;
  }) {
    if (data.isCurrent) {
      return prisma.$transaction(async (tx: any) => {
        await tx.academicSession.updateMany({
          where: { schoolId: data.schoolId, isCurrent: true },
          data: { isCurrent: false },
        });

        return tx.academicSession.create({
          data: {
            ...data,
            isCurrent: true,
          },
        });
      });
    }

    return prisma.academicSession.create({ data });
  }

  static async update(
    id: string,
    schoolId: string,
    data: {
      name?: string;
      startDate?: Date;
      endDate?: Date;
      status?: any;
    }
  ) {
    const existing = await prisma.academicSession.findFirst({
      where: { id, schoolId },
    });
    if (!existing) return null;

    return prisma.academicSession.update({
      where: { id },
      data,
    });
  }

  static async setCurrent(id: string, schoolId: string) {
    return prisma.$transaction(async (tx: any) => {
      const session = await tx.academicSession.findFirst({
        where: { id, schoolId },
      });

      if (!session) {
        throw new Error('Academic session not found in this school');
      }

      await tx.academicSession.updateMany({
        where: { schoolId, isCurrent: true },
        data: { isCurrent: false },
      });

      return tx.academicSession.update({
        where: { id },
        data: { isCurrent: true, status: 'ACTIVE' },
      });
    });
  }
}

