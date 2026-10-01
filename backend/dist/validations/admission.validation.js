"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectAdmissionSchema = exports.approveAdmissionSchema = exports.createAdmissionSchema = void 0;
const zod_1 = require("zod");
exports.createAdmissionSchema = zod_1.z.object({
    academicSessionId: zod_1.z.string().min(1, 'Academic session is required'),
    applyingClassId: zod_1.z.string().min(1, 'Applying class is required'),
    status: zod_1.z
        .enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_PENDING'])
        .optional()
        .default('SUBMITTED'),
    remarks: zod_1.z.string().max(500).optional(),
    // Applicant Profile
    firstName: zod_1.z.string().min(1, 'First name is required').max(100),
    middleName: zod_1.z.string().max(100).optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(100),
    dateOfBirth: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Valid date of birth required (YYYY-MM-DD)',
    }),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']),
    bloodGroup: zod_1.z.string().max(10).optional(),
    nationality: zod_1.z.string().default('Indian'),
    category: zod_1.z.string().optional(),
    religion: zod_1.z.string().optional(),
    aadhaarNumber: zod_1.z.string().max(50).optional(),
    // Parent / Guardian Details
    parentName: zod_1.z.string().min(1, 'Parent/Guardian name is required').max(150),
    parentRelation: zod_1.z.enum(['FATHER', 'MOTHER', 'GUARDIAN']).default('FATHER'),
    parentMobile: zod_1.z.string().min(5, 'Parent contact number is required').max(50),
    parentEmail: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    parentOccupation: zod_1.z.string().max(100).optional(),
    // Address
    addressLine1: zod_1.z.string().min(1, 'Address line 1 is required').max(255),
    addressLine2: zod_1.z.string().max(255).optional(),
    city: zod_1.z.string().min(1, 'City is required').max(100),
    state: zod_1.z.string().min(1, 'State is required').max(100),
    postalCode: zod_1.z.string().min(1, 'Postal code is required').max(20),
});
exports.approveAdmissionSchema = zod_1.z.object({
    assignedSectionId: zod_1.z.string().min(1, 'Section allotment is required to finalize admission'),
    remarks: zod_1.z.string().max(500).optional(),
});
exports.rejectAdmissionSchema = zod_1.z.object({
    rejectionReason: zod_1.z.string().min(3, 'Rejection reason must be provided').max(500),
});
//# sourceMappingURL=admission.validation.js.map