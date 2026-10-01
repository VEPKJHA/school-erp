"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exam_controller_1 = require("../controllers/exam.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const permissions_1 = require("../constants/permissions");
const exam_validation_1 = require("../validations/exam.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
// ==========================================
// 1. EXAM TERMS
// ==========================================
router.get('/terms', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_TERM_READ), exam_controller_1.ExamController.getTerms);
router.get('/terms/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_TERM_READ), exam_controller_1.ExamController.getTermById);
router.post('/terms', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_TERM_CREATE), (0, validate_middleware_1.validate)(exam_validation_1.ExamValidation.createExamTerm), exam_controller_1.ExamController.createTerm);
router.put('/terms/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_TERM_UPDATE), (0, validate_middleware_1.validate)(exam_validation_1.ExamValidation.updateExamTerm), exam_controller_1.ExamController.updateTerm);
router.delete('/terms/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_TERM_DELETE), exam_controller_1.ExamController.deleteTerm);
// ==========================================
// 2. GRADING SCALES
// ==========================================
router.get('/grading-scales', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_TERM_READ), exam_controller_1.ExamController.getScales);
router.get('/grading-scales/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_TERM_READ), exam_controller_1.ExamController.getScaleById);
router.post('/grading-scales', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_TERM_CREATE), (0, validate_middleware_1.validate)(exam_validation_1.ExamValidation.createGradingScale), exam_controller_1.ExamController.createScale);
// ==========================================
// 3. EXAM SCHEDULES
// ==========================================
router.get('/schedules', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_SCHEDULE_READ), exam_controller_1.ExamController.getSchedules);
router.get('/schedules/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_SCHEDULE_READ), exam_controller_1.ExamController.getScheduleById);
router.post('/schedules', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_SCHEDULE_CREATE), (0, validate_middleware_1.validate)(exam_validation_1.ExamValidation.createExamSchedule), exam_controller_1.ExamController.createSchedule);
router.put('/schedules/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_SCHEDULE_UPDATE), (0, validate_middleware_1.validate)(exam_validation_1.ExamValidation.updateExamSchedule), exam_controller_1.ExamController.updateSchedule);
router.delete('/schedules/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_SCHEDULE_DELETE), exam_controller_1.ExamController.deleteSchedule);
// ==========================================
// 4. MARKS ENTRY
// ==========================================
router.get('/schedules/:scheduleId/marks', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_MARK_READ), exam_controller_1.ExamController.getMarks);
router.post('/schedules/:scheduleId/marks', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_MARK_CREATE), (0, validate_middleware_1.validate)(exam_validation_1.ExamValidation.enterMarks), exam_controller_1.ExamController.enterMarks);
// ==========================================
// 5. PROGRESS REPORT CARD
// ==========================================
router.get('/students/:studentId/report-card', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.EXAM_REPORT_READ), exam_controller_1.ExamController.getStudentReportCard);
exports.default = router;
//# sourceMappingURL=exam.routes.js.map