"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_1 = require("../config/prisma");
class AuditService {
    static async log(params) {
        try {
            await prisma_1.prisma.auditLog.create({
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
        }
        catch (error) {
            console.error('AuditLog Error:', error);
        }
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map