import { AcademicRepository } from '../repositories/academic.repository';
import { AuditService } from './audit.service';
import {
  CreateAcademicSessionInput,
  UpdateAcademicSessionInput,
} from '../validations/academic.validation';

export class AcademicService {
  static async getSessions(schoolId: string) {
    return AcademicRepository.findAll(schoolId);
  }

  static async getSessionById(id: string, schoolId: string) {
    const session = await AcademicRepository.findById(id, schoolId);
    if (!session) {
      throw new Error('Academic session not found');
    }
    return session;
  }

  static async createSession(
    schoolId: string,
    data: CreateAcademicSessionInput,
    userId?: string
  ) {
    const existing = await AcademicRepository.findByName(data.name, schoolId);
    if (existing) {
      throw new Error(`Academic session '${data.name}' already exists in your school`);
    }

    const session = await AcademicRepository.create({
      schoolId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isCurrent: data.isCurrent,
      status: data.status,
    });

    await AuditService.log({
      schoolId,
      userId,
      action: 'SESSION_CREATED',
      entity: 'AcademicSession',
      entityId: session.id,
      newValue: session,
    });

    return session;
  }

  static async updateSession(
    id: string,
    schoolId: string,
    data: UpdateAcademicSessionInput,
    userId?: string
  ) {
    const existing = await AcademicRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('Academic session not found');
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await AcademicRepository.findByName(data.name, schoolId);
      if (duplicate) {
        throw new Error(`Academic session '${data.name}' already exists in your school`);
      }
    }

    const updated = await AcademicRepository.update(id, schoolId, {
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status,
    });

    await AuditService.log({
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

  static async setCurrentSession(id: string, schoolId: string, userId?: string) {
    const session = await AcademicRepository.findById(id, schoolId);
    if (!session) {
      throw new Error('Academic session not found in your school institution');
    }

    const updated = await AcademicRepository.setCurrent(id, schoolId);

    await AuditService.log({
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
