import { AdmissionRepository } from '../repositories/admission.repository';
import { ClassRepository } from '../repositories/class.repository';
import { AcademicRepository } from '../repositories/academic.repository';
import { SequenceGenerator } from '../utils/sequenceGenerator';
import { AuditService } from './audit.service';
import {
  CreateAdmissionInput,
  ApproveAdmissionInput,
  RejectAdmissionInput,
} from '../validations/admission.validation';

export class AdmissionService {
  static async getAdmissions(params: {
    schoolId: string;
    academicSessionId?: string;
    applyingClassId?: string;
    status?: any;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    return AdmissionRepository.findAll(params);
  }

  static async getAdmissionById(id: string, schoolId: string) {
    const admission = await AdmissionRepository.findById(id, schoolId);
    if (!admission) {
      throw new Error('Admission application not found');
    }
    return admission;
  }

  static async createAdmission(
    schoolId: string,
    data: CreateAdmissionInput,
    actorId?: string
  ) {
    // 1. Verify applying class and academic session exist and belong to this school
    const [targetClass, targetSession] = await Promise.all([
      ClassRepository.findClassById(data.applyingClassId, schoolId),
      AcademicRepository.findById(data.academicSessionId, schoolId),
    ]);

    if (!targetClass) {
      throw new Error('Selected applying class not found or belongs to another institution');
    }
    if (!targetSession) {
      throw new Error('Selected academic session not found in this school');
    }

    const currentYear = new Date().getFullYear();
    const applicationNumber = await SequenceGenerator.generateApplicationNumber(
      schoolId,
      currentYear
    );

    const admission = await AdmissionRepository.create({
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

    await AuditService.log({
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

  static async approveAdmission(
    id: string,
    schoolId: string,
    data: ApproveAdmissionInput,
    actorId?: string
  ) {
    const result = await AdmissionRepository.approveAtomic({
      admissionId: id,
      schoolId,
      assignedSectionId: data.assignedSectionId,
      approvedById: actorId,
      remarks: data.remarks,
    });

    await AuditService.log({
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

  static async rejectAdmission(
    id: string,
    schoolId: string,
    data: RejectAdmissionInput,
    actorId?: string
  ) {
    const existing = await AdmissionRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('Admission application not found');
    }

    if (existing.status === 'APPROVED') {
      throw new Error('Approved admissions cannot be rejected');
    }

    const updated = await AdmissionRepository.update(id, schoolId, {
      status: 'REJECTED',
      rejectionReason: data.rejectionReason,
    });

    await AuditService.log({
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
