import { DocumentRepository } from '../repositories/document.repository';
import { AuditService } from './audit.service';

export class DocumentService {
  static async recordDocument(data: {
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
    const doc = await DocumentRepository.create(data);

    await AuditService.log({
      schoolId: data.schoolId,
      userId: data.uploadedById,
      action: 'DOCUMENT_UPLOADED',
      entity: 'StudentDocument',
      entityId: doc.id,
      newValue: {
        documentType: doc.documentType,
        fileName: doc.fileName,
      },
    });

    return doc;
  }

  static async getStudentDocuments(studentId: string, schoolId: string) {
    return DocumentRepository.findByStudentId(studentId, schoolId);
  }

  static async getAdmissionDocuments(admissionId: string, schoolId: string) {
    return DocumentRepository.findByAdmissionId(admissionId, schoolId);
  }

  static async deleteDocument(id: string, schoolId: string, userId?: string) {
    const deleted = await DocumentRepository.delete(id, schoolId);

    if (deleted) {
      await AuditService.log({
        schoolId,
        userId,
        action: 'DOCUMENT_DELETED',
        entity: 'StudentDocument',
        entityId: id,
      });
    }

    return deleted;
  }
}
