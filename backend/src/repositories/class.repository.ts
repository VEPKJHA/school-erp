import { prisma } from '../config/prisma';

export class ClassRepository {
  static async findClassById(id: string, schoolId: string) {
    return prisma.class.findFirst({
      where: { id, schoolId },
      include: {
        sections: {
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  static async findClassByCode(code: string, schoolId: string) {
    return prisma.class.findUnique({
      where: {
        schoolId_code: { schoolId, code },
      },
    });
  }

  static async findClassByName(name: string, schoolId: string) {
    return prisma.class.findUnique({
      where: {
        schoolId_name: { schoolId, name },
      },
    });
  }

  static async findAllClasses(params: {
    schoolId: string;
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const { schoolId, page = 1, pageSize = 50, search, isActive } = params;
    const where: any = { schoolId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [total, classes] = await Promise.all([
      prisma.class.count({ where }),
      prisma.class.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { numericOrder: 'asc' },
        include: {
          sections: {
            orderBy: { name: 'asc' },
          },
        },
      }),
    ]);

    return { total, classes };
  }

  static async createClass(data: {
    schoolId: string;
    name: string;
    code: string;
    numericOrder: number;
    description?: string;
  }) {
    return prisma.class.create({
      data: {
        ...data,
        isActive: true,
      },
      include: {
        sections: true,
      },
    });
  }

  static async updateClass(
    id: string,
    schoolId: string,
    data: {
      name?: string;
      code?: string;
      numericOrder?: number;
      description?: string;
      isActive?: boolean;
    }
  ) {
    const existing = await prisma.class.findFirst({
      where: { id, schoolId },
    });
    if (!existing) return null;

    return prisma.class.update({
      where: { id },
      data,
      include: {
        sections: true,
      },
    });
  }

  static async deactivateClass(id: string, schoolId: string) {
    const existing = await prisma.class.findFirst({
      where: { id, schoolId },
    });
    if (!existing) return null;

    return prisma.class.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async findSectionById(id: string, schoolId: string) {
    return prisma.section.findFirst({
      where: {
        id,
        schoolId,
        class: {
          schoolId,
        },
      },
      include: {
        class: {
          select: { id: true, name: true, code: true, schoolId: true },
        },
      },
    });
  }

  static async findAllSections(params: {
    schoolId: string;
    classId?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const { schoolId, classId, page = 1, pageSize = 50, search, isActive } = params;
    const where: any = {
      schoolId,
      class: {
        schoolId,
      },
    };

    if (classId) {
      where.classId = classId;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { roomNumber: { contains: search } },
        { class: { name: { contains: search } } },
      ];
    }

    const [total, sections] = await Promise.all([
      prisma.section.count({ where }),
      prisma.section.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ class: { numericOrder: 'asc' } }, { name: 'asc' }],
        include: {
          class: {
            select: { id: true, name: true, code: true, numericOrder: true },
          },
        },
      }),
    ]);

    return { total, sections };
  }

  static async createSection(
    classId: string,
    schoolId: string,
    data: {
      name: string;
      capacity?: number;
      roomNumber?: string;
    }
  ) {
    const parentClass = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!parentClass) {
      throw new Error('Parent class not found or belongs to another school');
    }

    return prisma.section.create({
      data: {
        name: data.name,
        capacity: data.capacity ?? 40,
        roomNumber: data.roomNumber,
        classId: parentClass.id,
        schoolId: schoolId,
        isActive: true,
      },
      include: {
        class: true,
      },
    });
  }

  static async updateSection(
    id: string,
    schoolId: string,
    data: {
      name?: string;
      capacity?: number;
      roomNumber?: string;
      isActive?: boolean;
    }
  ) {
    const existing = await prisma.section.findFirst({
      where: {
        id,
        schoolId,
        class: { schoolId },
      },
    });
    if (!existing) return null;

    return prisma.section.update({
      where: { id },
      data,
      include: {
        class: true,
      },
    });
  }

  static async deactivateSection(id: string, schoolId: string) {
    const existing = await prisma.section.findFirst({
      where: {
        id,
        schoolId,
        class: { schoolId },
      },
    });
    if (!existing) return null;

    return prisma.section.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

