"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const permissions_1 = require("../constants/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
router.post('/upload', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.DOCUMENT_CREATE), document_controller_1.uploadMiddleware.single('file'), document_controller_1.DocumentController.uploadDocument);
router.get('/student/:studentId', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.DOCUMENT_READ), document_controller_1.DocumentController.getStudentDocuments);
router.get('/admission/:admissionId', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.DOCUMENT_READ), document_controller_1.DocumentController.getAdmissionDocuments);
router.delete('/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.DOCUMENT_DELETE), document_controller_1.DocumentController.deleteDocument);
exports.default = router;
//# sourceMappingURL=document.routes.js.map