"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicService = void 0;
const academic_repository_1 = require("../repositories/academic.repository");
const audit_service_1 = require("./audit.service");
class AcademicService {
    static async getSessions(schoolId) {
        return academic_repository_1.AcademicRepository.findAll(schoolId);
    }
    static async getSessionById(id, schoolId) {
        const session = await academic_repository_1.AcademicRepository.findById(id, schoolId);
        if (!session) {
            throw new Error('Academic session not found');
        }
        return session;
    }
    static async createSession(schoolId, data, userId) {
        const existing = await academic_repository_1.AcademicRepository.findByName(data.name, schoolId);
        if (existing) {
            throw new Error(`Academic session '${data.name}' already exists in your school`);
        }
        const session = await academic_repository_1.AcademicRepository.create({
            schoolId,
            name: data.name,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            isCurrent: data.isCurrent,
            status: data.status,
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'SESSION_CREATED',
            entity: 'AcademicSession',
            entityId: session.id,
            newValue: session,
        });
        return session;
    }
    static async updateSession(id, schoolId, data, userId) {
        const existing = await academic_repository_1.AcademicRepository.findById(id, schoolId);
        if (!existing) {
            throw new Error('Academic session not found');
        }
        if (data.name && data.name !== existing.name) {
            const duplicate = await academic_repository_1.AcademicRepository.findByName(data.name, schoolId);
            if (duplicate) {
                throw new Error(`Academic session '${data.name}' already exists in your school`);
            }
        }
        const updated = await academic_repository_1.AcademicRepository.update(id, schoolId, {
            name: data.name,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
            status: data.status,
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'SESSION_UPDATED',
            entity: 'AcademicSession',
            entityId: id,
            oldValue: existing,
            newValue: updated,
        });
        return updated;
    }
    static async setCurrentSession(id, schoolId, userId) {
        const session = await academic_repository_1.AcademicRepository.findById(id, schoolId);
        if (!session) {
            throw new Error('Academic session not found in your school institution');
        }
        const updated = await academic_repository_1.AcademicRepository.setCurrent(id, schoolId);
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'SESSION_SET_CURRENT',
            entity: 'AcademicSession',
            entityId: id,
            newValue: { isCurrent: true },
        });
        return updated;
    }
}
exports.AcademicService = AcademicService;
//# sourceMappingURL=academic.service.js.map