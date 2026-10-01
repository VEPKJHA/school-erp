"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const document_repository_1 = require("../repositories/document.repository");
const audit_service_1 = require("./audit.service");
class DocumentService {
    static async recordDocument(data) {
        const doc = await document_repository_1.DocumentRepository.create(data);
        await audit_service_1.AuditService.log({
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
    static async getStudentDocuments(studentId, schoolId) {
        return document_repository_1.DocumentRepository.findByStudentId(studentId, schoolId);
    }
    static async getAdmissionDocuments(admissionId, schoolId) {
        return document_repository_1.DocumentRepository.findByAdmissionId(admissionId, schoolId);
    }
    static async deleteDocument(id, schoolId, userId) {
        const deleted = await document_repository_1.DocumentRepository.delete(id, schoolId);
        if (deleted) {
            await audit_service_1.AuditService.log({
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
exports.DocumentService = DocumentService;
//# sourceMappingURL=document.service.js.map