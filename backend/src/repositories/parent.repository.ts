import { prisma } from '../config/prisma';

export class ParentRepository {
  static async findByPhoneAndSchool(phone: string, schoolId: string) {
    return prisma.parent.findFirst({
      where: { phone, schoolId },
    });
  }

  static async findById(id: string, schoolId: string) {
    return prisma.parent.findFirst({
      where: { id, schoolId },
      include: {
        students: {
          include: {
            student: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });
  }

  static async create(data: any, client: any = prisma) {
    return client.parent.create({ data });
  }

  static async linkToStudent(
    studentId: string,
    parentId: string,
    options: {
      relationship?: string;
      isPrimaryContact?: boolean;
      isEmergencyContact?: boolean;
    },
    client: any = prisma
  ) {
    return client.studentParent.upsert({
      where: {
        studentId_parentId: {
          studentId,
          parentId,
        },
      },
      update: {
        relationship: options.relationship || 'GUARDIAN',
        isPrimaryContact: options.isPrimaryContact ?? false,
        isEmergencyContact: options.isEmergencyContact ?? false,
      },
      create: {
        studentId,
        parentId,
        relationship: options.relationship || 'GUARDIAN',
        isPrimaryContact: options.isPrimaryContact ?? false,
        isEmergencyContact: options.isEmergencyContact ?? false,
      },
    });
  }

  static async searchParents(schoolId: string, query: string) {
    return prisma.parent.findMany({
      where: {
        schoolId,
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { phone: { contains: query } },
          { email: { contains: query } },
        ],
      },
      take: 20,
      orderBy: { firstName: 'asc' },
    });
  }
}
