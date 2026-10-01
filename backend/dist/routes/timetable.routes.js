"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timetable_controller_1 = require("../controllers/timetable.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const permissions_1 = require("../constants/permissions");
const timetable_validation_1 = require("../validations/timetable.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, tenant_middleware_1.enforceTenant);
// Subjects
router.get('/subjects', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SUBJECT_READ), timetable_controller_1.TimetableController.getSubjects);
router.get('/subjects/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SUBJECT_READ), timetable_controller_1.TimetableController.getSubjectById);
router.post('/subjects', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SUBJECT_CREATE), (0, validate_middleware_1.validate)(timetable_validation_1.TimetableValidation.createSubject), timetable_controller_1.TimetableController.createSubject);
router.put('/subjects/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SUBJECT_UPDATE), (0, validate_middleware_1.validate)(timetable_validation_1.TimetableValidation.updateSubject), timetable_controller_1.TimetableController.updateSubject);
router.post('/classes/assign', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SUBJECT_UPDATE), (0, validate_middleware_1.validate)(timetable_validation_1.TimetableValidation.assignClassSubject), timetable_controller_1.TimetableController.assignClassSubject);
router.get('/classes/:classId/subjects', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.SUBJECT_READ), timetable_controller_1.TimetableController.getClassSubjects);
// Timetable Slots
router.post('/slots', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.TIMETABLE_CREATE), (0, validate_middleware_1.validate)(timetable_validation_1.TimetableValidation.createTimetableSlot), timetable_controller_1.TimetableController.createSlot);
router.put('/slots/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.TIMETABLE_UPDATE), (0, validate_middleware_1.validate)(timetable_validation_1.TimetableValidation.updateTimetableSlot), timetable_controller_1.TimetableController.updateSlot);
router.delete('/slots/:id', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.TIMETABLE_DELETE), timetable_controller_1.TimetableController.deleteSlot);
router.get('/sections/:sectionId', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.TIMETABLE_READ), timetable_controller_1.TimetableController.getSectionTimetable);
router.get('/teachers/:teacherId', (0, rbac_middleware_1.requirePermission)(permissions_1.PERMISSIONS.TIMETABLE_READ), timetable_controller_1.TimetableController.getTeacherTimetable);
exports.default = router;
//# sourceMappingURL=timetable.routes.js.map