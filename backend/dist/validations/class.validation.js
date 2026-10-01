"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSectionSchema = exports.createSectionSchema = exports.updateClassSchema = exports.createClassSchema = void 0;
const zod_1 = require("zod");
exports.createClassSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Class name is required').max(100),
    code: zod_1.z.string().min(1, 'Class code is required').max(50),
    numericOrder: zod_1.z.number().int('Numeric order must be an integer'),
    description: zod_1.z.string().max(255).optional(),
});
exports.updateClassSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    code: zod_1.z.string().min(1).max(50).optional(),
    numericOrder: zod_1.z.number().int().optional(),
    description: zod_1.z.string().max(255).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.createSectionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Section name is required (e.g. A, B)').max(50),
    capacity: zod_1.z.number().int().min(1, 'Capacity must be at least 1').default(40),
    roomNumber: zod_1.z.string().max(50).optional(),
});
exports.updateSectionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).optional(),
    capacity: zod_1.z.number().int().min(1).optional(),
    roomNumber: zod_1.z.string().max(50).optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=class.validation.js.map