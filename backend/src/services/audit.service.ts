import { prisma } from '../config/prisma';

export interface AuditLogParams {
  schoolId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(params: AuditLogParams) {
    try {
      await prisma.auditLog.create({
        data: {
          schoolId: params.schoolId || null,
          userId: params.userId || null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId || null,
          oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : undefined,
          newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : undefined,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (error) {
      console.error('AuditLog Error:', error);
    }
  }
}
