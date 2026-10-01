"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionService = void 0;
const admission_repository_1 = require("../repositories/admission.repository");
const class_repository_1 = require("../repositories/class.repository");
const academic_repository_1 = require("../repositories/academic.repository");
const sequenceGenerator_1 = require("../utils/sequenceGenerator");
const audit_service_1 = require("./audit.service");
class AdmissionService {
    static async getAdmissions(params) {
        return admission_repository_1.AdmissionRepository.findAll(params);
    }
    static async getAdmissionById(id, schoolId) {
        const admission = await admission_repository_1.AdmissionRepository.findById(id, schoolId);
        if (!admission) {
            throw new Error('Admission application not found');
        }
        return admission;
    }
    static async createAdmission(schoolId, data, actorId) {
        // 1. Verify applying class and academic session exist and belong to this school
        const [targetClass, targetSession] = await Promise.all([
            class_repository_1.ClassRepository.findClassById(data.applyingClassId, schoolId),
            academic_repository_1.AcademicRepository.findById(data.academicSessionId, schoolId),
        ]);
        if (!targetClass) {
            throw new Error('Selected applying class not found or belongs to another institution');
        }
        if (!targetSession) {
            throw new Error('Selected academic session not found in this school');
        }
        const currentYear = new Date().getFullYear();
        const applicationNumber = await sequenceGenerator_1.SequenceGenerator.generateApplicationNumber(schoolId, currentYear);
        const admission = await admission_repository_1.AdmissionRepository.create({
            schoolId,
            applicationNumber,
            academicSessionId: data.academicSessionId,
            applyingClassId: data.applyingClassId,
            status: data.status || 'SUBMITTED',
            remarks: data.remarks,
            firstName: data.firstName.trim(),
            middleName: data.middleName?.trim(),
            lastName: data.lastName.trim(),
            dateOfBirth: new Date(data.dateOfBirth),
            gender: data.gender,
            bloodGroup: data.bloodGroup,
            nationality: data.nationality || 'Indian',
            category: data.category,
            religion: data.religion,
            aadhaarNumber: data.aadhaarNumber,
            parentName: data.parentName.trim(),
            parentRelation: data.parentRelation,
            parentMobile: data.parentMobile.trim(),
            parentEmail: data.parentEmail?.trim() || null,
            parentOccupation: data.parentOccupation?.trim(),
            addressLine1: data.addressLine1.trim(),
            addressLine2: data.addressLine2?.trim(),
            city: data.city.trim(),
            state: data.state.trim(),
            postalCode: data.postalCode.trim(),
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId: actorId,
            action: 'ADMISSION_SUBMITTED',
            entity: 'Admission',
            entityId: admission.id,
            newValue: {
                applicationNumber: admission.applicationNumber,
                applicant: `${admission.firstName} ${admission.lastName}`,
                class: targetClass.name,
            },
        });
        return admission;
    }
    static async approveAdmission(id, schoolId, data, actorId) {
        const result = await admission_repository_1.AdmissionRepository.approveAtomic({
            admissionId: id,
            schoolId,
            assignedSectionId: data.assignedSectionId,
            approvedById: actorId,
            remarks: data.remarks,
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId: actorId,
            action: 'ADMISSION_APPROVED',
            entity: 'Admission',
            entityId: id,
            newValue: {
                admissionNumber: result.student.admissionNumber,
                studentCode: result.student.studentCode,
                studentId: result.student.id,
            },
        });
        return result;
    }
    static async rejectAdmission(id, schoolId, data, actorId) {
        const existing = await admission_repository_1.AdmissionRepository.findById(id, schoolId);
        if (!existing) {
            throw new Error('Admission application not found');
        }
        if (existing.status === 'APPROVED') {
            throw new Error('Approved admissions cannot be rejected');
        }
        const updated = await admission_repository_1.AdmissionRepository.update(id, schoolId, {
            status: 'REJECTED',
            rejectionReason: data.rejectionReason,
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId: actorId,
            action: 'ADMISSION_REJECTED',
            entity: 'Admission',
            entityId: id,
            newValue: { rejectionReason: data.rejectionReason },
        });
        return updated;
    }
}
exports.AdmissionService = AdmissionService;
//# sourceMappingURL=admission.service.js.map