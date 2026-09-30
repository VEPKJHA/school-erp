import { ClassRepository } from '../repositories/class.repository';
import { AuditService } from './audit.service';
import {
  CreateClassInput,
  UpdateClassInput,
  CreateSectionInput,
  UpdateSectionInput,
} from '../validations/class.validation';

export class ClassService {
  static async getClasses(params: {
    schoolId: string;
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
  }) {
    return ClassRepository.findAllClasses(params);
  }

  static async getClassById(id: string, schoolId: string) {
    const classRecord = await ClassRepository.findClassById(id, schoolId);
    if (!classRecord) {
      throw new Error('Class not found in your school institution');
    }
    return classRecord;
  }

  static async createClass(schoolId: string, data: CreateClassInput, userId?: string) {
    const existingCode = await ClassRepository.findClassByCode(data.code, schoolId);
    if (existingCode) {
      throw new Error(`A class with code '${data.code}' already exists`);
    }

    const existingName = await ClassRepository.findClassByName(data.name, schoolId);
    if (existingName) {
      throw new Error(`A class named '${data.name}' already exists`);
    }

    const newClass = await ClassRepository.createClass({
      schoolId,
      name: data.name,
      code: data.code,
      numericOrder: data.numericOrder,
      description: data.description,
    });

    await AuditService.log({
      schoolId,
      userId,
      action: 'CLASS_CREATED',
      entity: 'Class',
      entityId: newClass.id,
      newValue: newClass,
    });

    return newClass;
  }

  static async updateClass(
    id: string,
    schoolId: string,
    data: UpdateClassInput,
    userId?: string
  ) {
    const existing = await ClassRepository.findClassById(id, schoolId);
    if (!existing) {
      throw new Error('Class not found in your school institution');
    }

    if (data.code && data.code !== existing.code) {
      const duplicateCode = await ClassRepository.findClassByCode(data.code, schoolId);
      if (duplicateCode && duplicateCode.id !== id) {
        throw new Error(`A class with code '${data.code}' already exists`);
      }
    }

    if (data.name && data.name !== existing.name) {
      const duplicateName = await ClassRepository.findClassByName(data.name, schoolId);
      if (duplicateName && duplicateName.id !== id) {
        throw new Error(`A class named '${data.name}' already exists`);
      }
    }

    const updated = await ClassRepository.updateClass(id, schoolId, data);

    await AuditService.log({
      schoolId,
      userId,
      action: 'CLASS_UPDATED',
      entity: 'Class',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  static async deactivateClass(id: string, schoolId: string, userId?: string) {
    const existing = await ClassRepository.findClassById(id, schoolId);
    if (!existing) {
      throw new Error('Class not found in your school institution');
    }

    const updated = await ClassRepository.deactivateClass(id, schoolId);

    await AuditService.log({
      schoolId,
      userId,
      action: 'CLASS_DEACTIVATED',
      entity: 'Class',
      entityId: id,
      newValue: { isActive: false },
    });

    return updated;
  }

  static async getSections(params: {
    schoolId: string;
    classId?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
  }) {
    return ClassRepository.findAllSections(params);
  }

  static async getSectionById(id: string, schoolId: string) {
    const section = await ClassRepository.findSectionById(id, schoolId);
    if (!section) {
      throw new Error('Section not found or does not belong to your school');
    }
    return section;
  }

  static async createSection(
    classId: string,
    schoolId: string,
    data: CreateSectionInput,
    userId?: string
  ) {
    const parentClass = await ClassRepository.findClassById(classId, schoolId);
    if (!parentClass) {
      throw new Error('Target class not found or belongs to another school institution');
    }

    const duplicate = parentClass.sections?.find(
      (s: any) => s.name.toLowerCase() === data.name.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Section '${data.name}' already exists in class '${parentClass.name}'`);
    }

    const section = await ClassRepository.createSection(classId, schoolId, data);

    await AuditService.log({
      schoolId,
      userId,
      action: 'SECTION_CREATED',
      entity: 'Section',
      entityId: section.id,
      newValue: section,
    });

    return section;
  }

  static async updateSection(
    id: string,
    schoolId: string,
    data: UpdateSectionInput,
    userId?: string
  ) {
    const existing = await ClassRepository.findSectionById(id, schoolId);
    if (!existing) {
      throw new Error('Section not found or does not belong to your school');
    }

    const updated = await ClassRepository.updateSection(id, schoolId, data);

    await AuditService.log({
      schoolId,
      userId,
      action: 'SECTION_UPDATED',
      entity: 'Section',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  static async deactivateSection(id: string, schoolId: string, userId?: string) {
    const existing = await ClassRepository.findSectionById(id, schoolId);
    if (!existing) {
      throw new Error('Section not found or does not belong to your school');
    }

    const updated = await ClassRepository.deactivateSection(id, schoolId);

    await AuditService.log({
      schoolId,
      userId,
      action: 'SECTION_DEACTIVATED',
      entity: 'Section',
      entityId: id,
      newValue: { isActive: false },
    });

    return updated;
  }
}
