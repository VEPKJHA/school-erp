import { prisma } from '../config/prisma';

export class DocumentRepository {
  static async create(data: {
    schoolId: string;
    studentId?: string;
    admissionId?: string;
    documentType: string;
    fileName: string;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedById?: string;
  }) {
    return prisma.studentDocument.create({ data });
  }

  static async findByStudentId(studentId: string, schoolId: string) {
    return prisma.studentDocument.findMany({
      where: { studentId, schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findByAdmissionId(admissionId: string, schoolId: string) {
    return prisma.studentDocument.findMany({
      where: { admissionId, schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async delete(id: string, schoolId: string) {
    const doc = await prisma.studentDocument.findFirst({
      where: { id, schoolId },
    });
    if (!doc) return null;

    return prisma.studentDocument.delete({ where: { id } });
  }
}
