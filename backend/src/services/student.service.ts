import { StudentRepository } from '../repositories/student.repository';
import { ParentRepository } from '../repositories/parent.repository';
import { ClassRepository } from '../repositories/class.repository';
import { AcademicRepository } from '../repositories/academic.repository';
import { SequenceGenerator } from '../utils/sequenceGenerator';
import { AuditService } from './audit.service';
import { CreateStudentInput, UpdateStudentInput } from '../validations/student.validation';
import { prisma } from '../config/prisma';

export class StudentService {
  static async getStudents(params: {
    schoolId: string;
    classId?: string;
    sectionId?: string;
    status?: any;
    academicSessionId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    return StudentRepository.findAll(params);
  }

  static async getStudentById(id: string, schoolId: string) {
    const student = await StudentRepository.findById(id, schoolId);
    if (!student) {
      throw new Error('Student profile not found in your school institution');
    }
    return student;
  }

  static async createStudentDirect(
    schoolId: string,
    data: CreateStudentInput,
    actorId?: string
  ) {
    // 1. Strict ownership chain: Class, Section, AcademicSession must belong to this school
    const [targetClass, targetSection, targetSession] = await Promise.all([
      ClassRepository.findClassById(data.classId, schoolId),
      ClassRepository.findSectionById(data.sectionId, schoolId),
      AcademicRepository.findById(data.academicSessionId, schoolId),
    ]);

    if (!targetClass) {
      throw new Error('Selected class not found or belongs to another institution');
    }
    if (!targetSection || targetSection.classId !== targetClass.id) {
      throw new Error('Selected section does not belong to the selected class in this school');
    }
    if (!targetSession) {
      throw new Error('Selected academic session not found in this school');
    }

    const currentYear = new Date().getFullYear();

    // 2. Atomically generate sequence numbers
    const [admissionNumber, studentCode] = await Promise.all([
      SequenceGenerator.generateAdmissionNumber(schoolId, currentYear),
      SequenceGenerator.generateStudentCode(schoolId, currentYear),
    ]);

    // 3. Create student in transaction
    const student = await prisma.$transaction(async (tx: any) => {
      const newStudent = await tx.student.create({
        data: {
          schoolId,
          studentCode,
          admissionNumber,
          classId: data.classId,
          sectionId: data.sectionId,
          academicSessionId: data.academicSessionId,

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
          email: data.email || null,
          mobile: data.mobile || null,
          photoUrl: data.photoUrl || null,
          status: 'ACTIVE',
        },
      });

      // Handle Parent if provided
      if (data.parent) {
        let parent = await tx.parent.findFirst({
          where: { phone: data.parent.phone, schoolId },
        });

        if (!parent) {
          parent = await tx.parent.create({
            data: {
              schoolId,
              firstName: data.parent.firstName,
              lastName: data.parent.lastName,
              relationship: data.parent.relationship,
              phone: data.parent.phone,
              email: data.parent.email || null,
              occupation: data.parent.occupation,
            },
          });
        }

        await tx.studentParent.create({
          data: {
            studentId: newStudent.id,
            parentId: parent.id,
            relationship: data.parent.relationship,
            isPrimaryContact: true,
            isEmergencyContact: true,
          },
        });
      }

      // Handle Address if provided
      if (data.currentAddress) {
        await tx.studentAddress.create({
          data: {
            studentId: newStudent.id,
            addressType: 'CURRENT',
            addressLine1: data.currentAddress.addressLine1,
            addressLine2: data.currentAddress.addressLine2,
            city: data.currentAddress.city,
            state: data.currentAddress.state,
            postalCode: data.currentAddress.postalCode,
            country: data.currentAddress.country || 'India',
          },
        });
      }

      return newStudent;
    });

    await AuditService.log({
      schoolId,
      userId: actorId,
      action: 'STUDENT_CREATED',
      entity: 'Student',
      entityId: student.id,
      newValue: {
        admissionNumber: student.admissionNumber,
        studentCode: student.studentCode,
        name: `${student.firstName} ${student.lastName}`,
      },
    });

    return student;
  }

  static async updateStudent(
    id: string,
    schoolId: string,
    data: UpdateStudentInput,
    actorId?: string
  ) {
    const existing = await StudentRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('Student profile not found in your school institution');
    }

    if (data.classId || data.sectionId) {
      const targetClassId = data.classId || existing.classId;
      const targetSectionId = data.sectionId || existing.sectionId;

      const [targetClass, targetSection] = await Promise.all([
        ClassRepository.findClassById(targetClassId, schoolId),
        ClassRepository.findSectionById(targetSectionId, schoolId),
      ]);

      if (!targetClass || !targetSection || targetSection.classId !== targetClass.id) {
        throw new Error('Invalid class or section combination for this school');
      }
    }

    const updated = await StudentRepository.update(id, schoolId, {
      ...(data.classId ? { classId: data.classId } : {}),
      ...(data.sectionId ? { sectionId: data.sectionId } : {}),
      ...(data.firstName ? { firstName: data.firstName.trim() } : {}),
      ...(data.middleName !== undefined ? { middleName: data.middleName?.trim() } : {}),
      ...(data.lastName ? { lastName: data.lastName.trim() } : {}),
      ...(data.dateOfBirth ? { dateOfBirth: new Date(data.dateOfBirth) } : {}),
      ...(data.gender ? { gender: data.gender } : {}),
      ...(data.bloodGroup !== undefined ? { bloodGroup: data.bloodGroup } : {}),
      ...(data.nationality ? { nationality: data.nationality } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.religion !== undefined ? { religion: data.religion } : {}),
      ...(data.aadhaarNumber !== undefined ? { aadhaarNumber: data.aadhaarNumber } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.mobile !== undefined ? { mobile: data.mobile || null } : {}),
      ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl || null } : {}),
    });

    await AuditService.log({
      schoolId,
      userId: actorId,
      action: 'STUDENT_UPDATED',
      entity: 'Student',
      entityId: id,
      oldValue: { firstName: existing.firstName, lastName: existing.lastName },
      newValue: updated,
    });

    return updated;
  }

  static async updateStatus(
    id: string,
    schoolId: string,
    status: any,
    reason?: string,
    actorId?: string
  ) {
    const existing = await StudentRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('Student profile not found');
    }

    const updated = await StudentRepository.updateStatus(id, schoolId, status);

    await AuditService.log({
      schoolId,
      userId: actorId,
      action: 'STUDENT_STATUS_CHANGED',
      entity: 'Student',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status, reason },
    });

    return updated;
  }
}
