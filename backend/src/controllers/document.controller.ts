import { Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DocumentService } from '../services/document.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export class DocumentController {
  static async uploadDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const file = req.file;

      if (!file) {
        return ResponseUtil.badRequest(res, 'No file uploaded');
      }

      const { studentId, admissionId, documentType } = req.body;
      if (!documentType) {
        return ResponseUtil.badRequest(res, 'documentType is required');
      }

      const doc = await DocumentService.recordDocument({
        schoolId,
        studentId: studentId || undefined,
        admissionId: admissionId || undefined,
        documentType,
        fileName: file.originalname,
        filePath: file.path,
        fileUrl: `/uploads/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedById: req.user?.userId,
      });

      return ResponseUtil.created(res, doc, 'Document uploaded successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async getStudentDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId } = req.params;
      const docs = await DocumentService.getStudentDocuments(studentId, schoolId);
      return ResponseUtil.success(res, docs, 'Student documents retrieved');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async getAdmissionDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { admissionId } = req.params;
      const docs = await DocumentService.getAdmissionDocuments(admissionId, schoolId);
      return ResponseUtil.success(res, docs, 'Admission documents retrieved');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }

  static async deleteDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { id } = req.params;
      await DocumentService.deleteDocument(id, schoolId, req.user?.userId);
      return ResponseUtil.success(res, null, 'Document deleted successfully');
    } catch (error: any) {
      return ResponseUtil.badRequest(res, error.message);
    }
  }
}
