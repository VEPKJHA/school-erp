"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleProvisioningService = exports.DEFAULT_TENANT_ROLES = void 0;
const prisma_1 = require("../config/prisma");
exports.DEFAULT_TENANT_ROLES = [
    {
        code: 'SCHOOL_ADMIN',
        name: 'School Administrator',
        description: 'Full administrative authority across all modules for this school institution',
        isSystem: true,
        // Gets all 53 permissions
        permissionCodes: [
            'academic:session:create',
            'academic:session:read',
            'academic:session:update',
            'admission:approve',
            'admission:create',
            'admission:read',
            'attendance:student:create',
            'attendance:student:read',
            'attendance:student:report',
            'attendance:student:update',
            'class:create',
            'class:delete',
            'class:read',
            'class:update',
            'document:create',
            'document:delete',
            'document:read',
            'fee:assignment:create',
            'fee:assignment:read',
            'fee:head:create',
            'fee:head:delete',
            'fee:head:read',
            'fee:head:update',
            'fee:invoice:create',
            'fee:invoice:read',
            'fee:payment:create',
            'fee:payment:read',
            'fee:report:read',
            'fee:structure:create',
            'fee:structure:read',
            'fee:structure:update',
            'school:read',
            'school:update',
            'section:create',
            'section:delete',
            'section:read',
            'section:update',
            'student:create',
            'student:delete',
            'student:read',
            'student:update',
            'subject:create',
            'subject:delete',
            'subject:read',
            'subject:update',
            'timetable:create',
            'timetable:delete',
            'timetable:read',
            'timetable:update',
            'user:create',
            'user:delete',
            'user:read',
            'user:update',
        ],
    },
    {
        code: 'PRINCIPAL',
        name: 'Principal',
        description: 'Academic head: student records, attendance, timetable, examinations, and staff view',
        isSystem: false,
        permissionCodes: [
            'school:read',
            'academic:session:read',
            'class:read',
            'section:read',
            'student:read',
            'student:update',
            'admission:read',
            'admission:approve',
            'document:read',
            'attendance:student:create',
            'attendance:student:read',
            'attendance:student:update',
            'attendance:student:report',
            'subject:read',
            'subject:create',
            'subject:update',
            'timetable:read',
            'timetable:create',
            'timetable:update',
            'user:read',
            'fee:report:read',
        ],
    },
    {
        code: 'TEACHER',
        name: 'Teacher / Faculty',
        description: 'Instructional staff: daily attendance, timetable schedule, subjects, student records',
        isSystem: false,
        permissionCodes: [
            'school:read',
            'academic:session:read',
            'class:read',
            'section:read',
            'student:read',
            'document:read',
            'attendance:student:create',
            'attendance:student:read',
            'attendance:student:update',
            'attendance:student:report',
            'subject:read',
            'timetable:read',
        ],
    },
    {
        code: 'ACCOUNTANT',
        name: 'Accountant / Finance',
        description: 'Financial manager: fee structures, student fee assignments, billing invoices, receipts, reports',
        isSystem: false,
        permissionCodes: [
            'school:read',
            'academic:session:read',
            'class:read',
            'section:read',
            'student:read',
            'fee:head:create',
            'fee:head:read',
            'fee:head:update',
            'fee:structure:create',
            'fee:structure:read',
            'fee:assignment:create',
            'fee:assignment:read',
            'fee:invoice:create',
            'fee:invoice:read',
            'fee:payment:create',
            'fee:payment:read',
            'fee:report:read',
        ],
    },
    {
        code: 'RECEPTIONIST',
        name: 'Front Desk / Receptionist',
        description: 'Admissions, student directory lookup, front-desk visitor & documentation inquiries',
        isSystem: false,
        permissionCodes: [
            'school:read',
            'academic:session:read',
            'class:read',
            'section:read',
            'student:read',
            'admission:create',
            'admission:read',
            'document:create',
            'document:read',
            'attendance:student:read',
            'timetable:read',
        ],
    },
    {
        code: 'LIBRARIAN',
        name: 'Librarian',
        description: 'Library resource manager: student & class directory, academic records view',
        isSystem: false,
        permissionCodes: [
            'school:read',
            'academic:session:read',
            'class:read',
            'section:read',
            'student:read',
            'document:read',
        ],
    },
];
class RoleProvisioningService {
    /**
     * Provision or backfill default roles and role-permissions for a specific school
     */
    static async provisionDefaultRolesForSchool(schoolId, tx) {
        const db = tx || prisma_1.prisma;
        // Fetch all permission IDs keyed by code
        const allPermissions = await db.permission.findMany({
            select: { id: true, code: true },
        });
        const permissionMap = new Map(allPermissions.map((p) => [p.code, p.id]));
        // Fetch existing roles for this school
        const existingRoles = await db.role.findMany({
            where: { schoolId },
            include: { permissions: { select: { permissionId: true } } },
        });
        const existingRoleMap = new Map(existingRoles.map((r) => [r.code, r]));
        const roleIdMap = {};
        for (const tpl of exports.DEFAULT_TENANT_ROLES) {
            let role = existingRoleMap.get(tpl.code);
            if (!role) {
                // Create role
                role = await db.role.create({
                    data: {
                        schoolId,
                        code: tpl.code,
                        name: tpl.name,
                        description: tpl.description,
                        isSystem: tpl.isSystem,
                    },
                    include: { permissions: { select: { permissionId: true } } },
                });
            }
            roleIdMap[tpl.code] = String(role.id);
            // Ensure permissions are attached
            const attachedPermissionIds = new Set(role.permissions?.map((rp) => rp.permissionId) || []);
            const permissionsToAttach = [];
            for (const pCode of tpl.permissionCodes) {
                const pId = permissionMap.get(pCode);
                if (pId && !attachedPermissionIds.has(pId)) {
                    permissionsToAttach.push(pId);
                }
            }
            if (permissionsToAttach.length > 0) {
                await db.rolePermission.createMany({
                    data: permissionsToAttach.map((permissionId) => ({
                        roleId: role.id,
                        permissionId,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        return roleIdMap;
    }
    /**
     * Backfill all existing schools missing default roles or permissions
     */
    static async backfillAllSchools() {
        const schools = await prisma_1.prisma.school.findMany({
            select: { id: true, name: true, code: true },
        });
        let rolesCreatedCount = 0;
        for (const school of schools) {
            const roleMap = await this.provisionDefaultRolesForSchool(school.id);
            rolesCreatedCount += Object.keys(roleMap).length;
        }
        return { schoolsChecked: schools.length, rolesCreatedCount };
    }
}
exports.RoleProvisioningService = RoleProvisioningService;
//# sourceMappingURL=roleProvisioning.service.js.map