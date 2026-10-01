"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAcademicSessionSchema = exports.createAcademicSessionSchema = void 0;
const zod_1 = require("zod");
exports.createAcademicSessionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Session name is required').max(50),
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Valid start date required',
    }),
    endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Valid end date required',
    }),
    isCurrent: zod_1.z.boolean().optional().default(false),
    status: zod_1.z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional().default('ACTIVE'),
});
exports.updateAcademicSessionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).optional(),
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
    endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
    status: zod_1.z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});
//# sourceMappingURL=academic.validation.js.map