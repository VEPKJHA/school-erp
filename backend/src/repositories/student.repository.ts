import { prisma } from '../config/prisma';

export class StudentRepository {
  static async findById(id: string, schoolId: string) {
    return prisma.student.findFirst({
      where: { id, schoolId },
      include: {
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true, roomNumber: true } },
        session: { select: { id: true, name: true } },
        parents: {
          include: {
            parent: true,
          },
        },
        addresses: true,
        documents: true,
        admission: {
          select: {
            id: true,
            applicationNumber: true,
            applicationDate: true,
            status: true,
          },
        },
      },
    });
  }

  static async findByAdmissionNumber(admissionNumber: string, schoolId: string) {
    return prisma.student.findUnique({
      where: {
        schoolId_admissionNumber: {
          schoolId,
          admissionNumber,
        },
      },
    });
  }

  static async findByStudentCode(studentCode: string, schoolId: string) {
    return prisma.student.findUnique({
      where: {
        schoolId_studentCode: {
          schoolId,
          studentCode,
        },
      },
    });
  }

  static async findAll(params: {
    schoolId: string;
    classId?: string;
    sectionId?: string;
    status?: any;
    academicSessionId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      schoolId,
      classId,
      sectionId,
      status,
      academicSessionId,
      search,
      page = 1,
      pageSize = 20,
    } = params;

    const where: any = { schoolId };

    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;
    if (status) where.status = status;
    if (academicSessionId) where.academicSessionId = academicSessionId;

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { studentCode: { contains: search } },
        { admissionNumber: { contains: search } },
        { mobile: { contains: search } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ class: { numericOrder: 'asc' } }, { firstName: 'asc' }],
        include: {
          class: { select: { id: true, name: true, code: true } },
          section: { select: { id: true, name: true } },
          session: { select: { id: true, name: true } },
          parents: {
            where: { isPrimaryContact: true },
            include: { parent: { select: { firstName: true, lastName: true, phone: true } } },
          },
        },
      }),
    ]);

    return { total, students };
  }

  static async create(data: any, client: any = prisma) {
    return client.student.create({
      data,
      include: {
        class: true,
        section: true,
        session: true,
      },
    });
  }

  static async update(id: string, schoolId: string, data: any) {
    const existing = await prisma.student.findFirst({
      where: { id, schoolId },
    });
    if (!existing) return null;

    return prisma.student.update({
      where: { id },
      data,
    });
  }

  static async updateStatus(id: string, schoolId: string, status: any) {
    const existing = await prisma.student.findFirst({
      where: { id, schoolId },
    });
    if (!existing) return null;

    return prisma.student.update({
      where: { id },
      data: { status },
    });
  }
}
