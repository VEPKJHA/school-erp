import { prisma } from '../config/prisma';
import { SequenceGenerator } from '../utils/sequenceGenerator';

export class AdmissionRepository {
  static async findById(id: string, schoolId: string) {
    return prisma.admission.findFirst({
      where: { id, schoolId },
      include: {
        session: true,
        applyingClass: true,
        assignedSection: true,
        documents: true,
        student: {
          select: { id: true, studentCode: true, admissionNumber: true, status: true },
        },
      },
    });
  }

  static async findAll(params: {
    schoolId: string;
    academicSessionId?: string;
    applyingClassId?: string;
    status?: any;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      schoolId,
      academicSessionId,
      applyingClassId,
      status,
      search,
      page = 1,
      pageSize = 20,
    } = params;

    const where: any = { schoolId };
    if (academicSessionId) where.academicSessionId = academicSessionId;
    if (applyingClassId) where.applyingClassId = applyingClassId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { parentMobile: { contains: search } },
        { parentName: { contains: search } },
      ];
    }

    const [total, admissions] = await Promise.all([
      prisma.admission.count({ where }),
      prisma.admission.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { applicationDate: 'desc' },
        include: {
          session: { select: { id: true, name: true } },
          applyingClass: { select: { id: true, name: true, code: true } },
          assignedSection: { select: { id: true, name: true } },
          student: { select: { id: true, studentCode: true, admissionNumber: true } },
        },
      }),
    ]);

    return { total, admissions };
  }

  static async create(data: any) {
    return prisma.admission.create({
      data,
      include: {
        session: true,
        applyingClass: true,
      },
    });
  }

  static async update(id: string, schoolId: string, data: any) {
    const existing = await prisma.admission.findFirst({
      where: { id, schoolId },
    });
    if (!existing) return null;

    return prisma.admission.update({
      where: { id },
      data,
    });
  }

  /**
   * Atomically approves an admission application, assigns human-readable numbers,
   * validates ownership chain for class/section, and creates the active student record.
   */
  static async approveAtomic(params: {
    admissionId: string;
    schoolId: string;
    assignedSectionId: string;
    approvedById?: string;
    remarks?: string;
  }) {
    const { admissionId, schoolId, assignedSectionId, approvedById, remarks } = params;

    return prisma.$transaction(async (tx: any) => {
      // 1. Fetch and verify admission
      const admission = await tx.admission.findFirst({
        where: { id: admissionId, schoolId },
      });

      if (!admission) {
        throw new Error('Admission application not found or unauthorized');
      }

      if (admission.status === 'APPROVED') {
        throw new Error('This admission application has already been approved');
      }

      // 2. Strict ownership chain verification for assigned Section
      const section = await tx.section.findFirst({
        where: {
          id: assignedSectionId,
          schoolId,
          classId: admission.applyingClassId,
        },
        include: { class: true },
      });

      if (!section) {
        throw new Error(
          'Assigned section is invalid or does not belong to the applying class of this school'
        );
      }

      const currentYear = new Date().getFullYear();

      // 3. Atomically generate sequential admission number & student code
      const admissionNumber = await SequenceGenerator.generateAdmissionNumber(
        schoolId,
        currentYear,
        tx
      );
      const studentCode = await SequenceGenerator.generateStudentCode(
        schoolId,
        currentYear,
        tx
      );

      // 4. Create active Student profile
      const student = await tx.student.create({
        data: {
          schoolId,
          admissionId: admission.id,
          studentCode,
          admissionNumber,
          classId: admission.applyingClassId,
          sectionId: section.id,
          academicSessionId: admission.academicSessionId,

          firstName: admission.firstName,
          middleName: admission.middleName,
          lastName: admission.lastName,
          dateOfBirth: admission.dateOfBirth,
          gender: admission.gender,
          bloodGroup: admission.bloodGroup,
          nationality: admission.nationality,
          category: admission.category,
          religion: admission.religion,
          aadhaarNumber: admission.aadhaarNumber,
          mobile: admission.parentMobile,
          email: admission.parentEmail,
          status: 'ACTIVE',
        },
      });

      // 5. Create or reuse Parent record and link to Student
      let parent = await tx.parent.findFirst({
        where: { phone: admission.parentMobile, schoolId },
      });

      if (!parent) {
        const names = admission.parentName.trim().split(' ');
        const pFirst = names[0];
        const pLast = names.slice(1).join(' ') || 'Parent';

        parent = await tx.parent.create({
          data: {
            schoolId,
            firstName: pFirst,
            lastName: pLast,
            relationship: admission.parentRelation || 'FATHER',
            phone: admission.parentMobile,
            email: admission.parentEmail,
            occupation: admission.parentOccupation,
          },
        });
      }

      await tx.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          relationship: admission.parentRelation || 'FATHER',
          isPrimaryContact: true,
          isEmergencyContact: true,
        },
      });

      // 6. Create Student Address
      await tx.studentAddress.create({
        data: {
          studentId: student.id,
          addressType: 'CURRENT',
          addressLine1: admission.addressLine1,
          addressLine2: admission.addressLine2,
          city: admission.city,
          state: admission.state,
          postalCode: admission.postalCode,
          country: 'India',
        },
      });

      // 7. Re-link any uploaded documents to student
      await tx.studentDocument.updateMany({
        where: { admissionId: admission.id },
        data: { studentId: student.id },
      });

      // 8. Update Admission status to APPROVED
      const updatedAdmission = await tx.admission.update({
        where: { id: admission.id },
        data: {
          status: 'APPROVED',
          assignedSectionId: section.id,
          approvedById: approvedById || null,
          approvedAt: new Date(),
          remarks: remarks || admission.remarks,
        },
        include: {
          applyingClass: true,
          assignedSection: true,
        },
      });

      return {
        admission: updatedAdmission,
        student,
      };
    }, { maxWait: 10000, timeout: 30000 });
  }
}
