"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassService = void 0;
const class_repository_1 = require("../repositories/class.repository");
const audit_service_1 = require("./audit.service");
class ClassService {
    static async getClasses(params) {
        return class_repository_1.ClassRepository.findAllClasses(params);
    }
    static async getClassById(id, schoolId) {
        const classRecord = await class_repository_1.ClassRepository.findClassById(id, schoolId);
        if (!classRecord) {
            throw new Error('Class not found in your school institution');
        }
        return classRecord;
    }
    static async createClass(schoolId, data, userId) {
        const existingCode = await class_repository_1.ClassRepository.findClassByCode(data.code, schoolId);
        if (existingCode) {
            throw new Error(`A class with code '${data.code}' already exists`);
        }
        const existingName = await class_repository_1.ClassRepository.findClassByName(data.name, schoolId);
        if (existingName) {
            throw new Error(`A class named '${data.name}' already exists`);
        }
        const newClass = await class_repository_1.ClassRepository.createClass({
            schoolId,
            name: data.name,
            code: data.code,
            numericOrder: data.numericOrder,
            description: data.description,
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'CLASS_CREATED',
            entity: 'Class',
            entityId: newClass.id,
            newValue: newClass,
        });
        return newClass;
    }
    static async updateClass(id, schoolId, data, userId) {
        const existing = await class_repository_1.ClassRepository.findClassById(id, schoolId);
        if (!existing) {
            throw new Error('Class not found in your school institution');
        }
        if (data.code && data.code !== existing.code) {
            const duplicateCode = await class_repository_1.ClassRepository.findClassByCode(data.code, schoolId);
            if (duplicateCode && duplicateCode.id !== id) {
                throw new Error(`A class with code '${data.code}' already exists`);
            }
        }
        if (data.name && data.name !== existing.name) {
            const duplicateName = await class_repository_1.ClassRepository.findClassByName(data.name, schoolId);
            if (duplicateName && duplicateName.id !== id) {
                throw new Error(`A class named '${data.name}' already exists`);
            }
        }
        const updated = await class_repository_1.ClassRepository.updateClass(id, schoolId, data);
        await audit_service_1.AuditService.log({
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
    static async deactivateClass(id, schoolId, userId) {
        const existing = await class_repository_1.ClassRepository.findClassById(id, schoolId);
        if (!existing) {
            throw new Error('Class not found in your school institution');
        }
        const updated = await class_repository_1.ClassRepository.deactivateClass(id, schoolId);
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'CLASS_DEACTIVATED',
            entity: 'Class',
            entityId: id,
            newValue: { isActive: false },
        });
        return updated;
    }
    static async getSections(params) {
        return class_repository_1.ClassRepository.findAllSections(params);
    }
    static async getSectionById(id, schoolId) {
        const section = await class_repository_1.ClassRepository.findSectionById(id, schoolId);
        if (!section) {
            throw new Error('Section not found or does not belong to your school');
        }
        return section;
    }
    static async createSection(classId, schoolId, data, userId) {
        const parentClass = await class_repository_1.ClassRepository.findClassById(classId, schoolId);
        if (!parentClass) {
            throw new Error('Target class not found or belongs to another school institution');
        }
        const duplicate = parentClass.sections?.find((s) => s.name.toLowerCase() === data.name.toLowerCase());
        if (duplicate) {
            throw new Error(`Section '${data.name}' already exists in class '${parentClass.name}'`);
        }
        const section = await class_repository_1.ClassRepository.createSection(classId, schoolId, data);
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'SECTION_CREATED',
            entity: 'Section',
            entityId: section.id,
            newValue: section,
        });
        return section;
    }
    static async updateSection(id, schoolId, data, userId) {
        const existing = await class_repository_1.ClassRepository.findSectionById(id, schoolId);
        if (!existing) {
            throw new Error('Section not found or does not belong to your school');
        }
        const updated = await class_repository_1.ClassRepository.updateSection(id, schoolId, data);
        await audit_service_1.AuditService.log({
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
    static async deactivateSection(id, schoolId, userId) {
        const existing = await class_repository_1.ClassRepository.findSectionById(id, schoolId);
        if (!existing) {
            throw new Error('Section not found or does not belong to your school');
        }
        const updated = await class_repository_1.ClassRepository.deactivateSection(id, schoolId);
        await audit_service_1.AuditService.log({
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
exports.ClassService = ClassService;
//# sourceMappingURL=class.service.js.map