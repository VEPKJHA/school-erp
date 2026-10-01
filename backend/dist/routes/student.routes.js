"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const student_validation_1 = require("../validations/student.validation");
const permissions_1 = require("../constants/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
router.get('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.STUDENT_READ), student_controller_1.StudentController.getStudents);
router.post('/', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.STUDENT_CREATE), (0, validate_middleware_1.validate)(student_validation_1.createStudentSchema), student_controller_1.StudentController.createStudent);
router.get('/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.STUDENT_READ), student_controller_1.StudentController.getStudentById);
router.put('/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.STUDENT_UPDATE), (0, validate_middleware_1.validate)(student_validation_1.updateStudentSchema), student_controller_1.StudentController.updateStudent);
router.patch('/:id/status', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.STUDENT_UPDATE), (0, validate_middleware_1.validate)(student_validation_1.updateStudentStatusSchema), student_controller_1.StudentController.updateStatus);
exports.default = router;
//# sourceMappingURL=student.routes.js.map