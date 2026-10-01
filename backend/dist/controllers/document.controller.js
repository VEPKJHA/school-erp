"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const document_service_1 = require("../services/document.service");
const apiResponse_1 = require("../utils/apiResponse");
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});
class DocumentController {
    static async uploadDocument(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const file = req.file;
            if (!file) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'No file uploaded');
            }
            const { studentId, admissionId, documentType } = req.body;
            if (!documentType) {
                return apiResponse_1.ResponseUtil.badRequest(res, 'documentType is required');
            }
            const doc = await document_service_1.DocumentService.recordDocument({
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
            return apiResponse_1.ResponseUtil.created(res, doc, 'Document uploaded successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async getStudentDocuments(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { studentId } = req.params;
            const docs = await document_service_1.DocumentService.getStudentDocuments(studentId, schoolId);
            return apiResponse_1.ResponseUtil.success(res, docs, 'Student documents retrieved');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async getAdmissionDocuments(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { admissionId } = req.params;
            const docs = await document_service_1.DocumentService.getAdmissionDocuments(admissionId, schoolId);
            return apiResponse_1.ResponseUtil.success(res, docs, 'Admission documents retrieved');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
    static async deleteDocument(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { id } = req.params;
            await document_service_1.DocumentService.deleteDocument(id, schoolId, req.user?.userId);
            return apiResponse_1.ResponseUtil.success(res, null, 'Document deleted successfully');
        }
        catch (error) {
            return apiResponse_1.ResponseUtil.badRequest(res, error.message);
        }
    }
}
exports.DocumentController = DocumentController;
//# sourceMappingURL=document.controller.js.map