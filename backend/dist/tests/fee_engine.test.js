"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const prisma_1 = require("../config/prisma");
const jwt_1 = require("../utils/jwt");
const sequenceGenerator_1 = require("../utils/sequenceGenerator");
const client_1 = require("@prisma/client");
(0, vitest_1.describe)('Phase 3: Fee Engine & Collection Workflow', () => {
    const schoolId = 'school-alpha-uuid';
    const accountantToken = (0, jwt_1.signAccessToken)({
        userId: 'accountant-user-id',
        email: 'accountant@school.com',
        schoolId,
        roleId: 'role-accountant-id',
        roleCode: 'ACCOUNTANT',
        permissions: [
            'fee:head:read',
            'fee:head:create',
            'fee:head:update',
            'fee:structure:read',
            'fee:structure:create',
            'fee:assignment:create',
            'fee:invoice:read',
            'fee:invoice:create',
            'fee:payment:read',
            'fee:payment:create',
            'fee:report:read',
            'student:read',
        ],
    });
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('Generates human-readable sequential invoice and receipt numbers', async () => {
        const mockTx = {
            sequenceCounter: {
                upsert: vitest_1.vi.fn().mockResolvedValue({ lastValue: 88 }),
            },
        };
        const invNum = await sequenceGenerator_1.SequenceGenerator.generateInvoiceNumber(schoolId, 2026, mockTx);
        (0, vitest_1.expect)(invNum).toBe('INV/2026/000088');
        const recNum = await sequenceGenerator_1.SequenceGenerator.generateReceiptNumber(schoolId, 2026, mockTx);
        (0, vitest_1.expect)(recNum).toBe('REC/2026/000088');
    });
    (0, vitest_1.it)('Creates fee head with unique code and logs audit', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'accountant-user-id',
            status: 'ACTIVE',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.feeHead, 'findFirst').mockResolvedValue(null);
        vitest_1.vi.spyOn(prisma_1.prisma.feeHead, 'create').mockResolvedValue({
            id: 'head-tuit-1',
            schoolId,
            name: 'Tuition Fee',
            code: 'TUIT',
            description: 'Monthly tuition instruction fee',
            isRefundable: false,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.auditLog, 'create').mockResolvedValue({});
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/fees/heads')
            .set('Authorization', `Bearer ${accountantToken}`)
            .send({
            name: 'Tuition Fee',
            code: 'TUIT',
            description: 'Monthly tuition instruction fee',
            isRefundable: false,
        });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.code).toBe('TUIT');
    });
    (0, vitest_1.it)('Generates invoice, calculates balance and posts DEBIT entry to student ledger', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'accountant-user-id',
            status: 'ACTIVE',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.student, 'findFirst').mockResolvedValue({
            id: 'student-1',
            schoolId,
            firstName: 'Aarav',
            lastName: 'Sharma',
        });
        vitest_1.vi.spyOn(prisma_1.prisma.feeHead, 'findMany').mockResolvedValue([
            { id: 'head-1', schoolId },
            { id: 'head-2', schoolId },
        ]);
        const mockTx = {
            sequenceCounter: {
                upsert: vitest_1.vi.fn().mockResolvedValue({ lastValue: 101 }),
            },
            feeInvoice: {
                create: vitest_1.vi.fn().mockResolvedValue({
                    id: 'inv-1',
                    invoiceNumber: 'INV/2026/000101',
                    title: 'Term 1 Fee',
                    subtotal: 5000,
                    discountAmount: 500,
                    totalAmount: 4500,
                    paidAmount: 0,
                    balanceAmount: 4500,
                    status: 'UNPAID',
                }),
            },
            studentFeeLedger: {
                findFirst: vitest_1.vi.fn().mockResolvedValue(null),
                create: vitest_1.vi.fn().mockResolvedValue({}),
            },
        };
        vitest_1.vi.spyOn(prisma_1.prisma, '$transaction').mockImplementation(async (callback) => {
            return callback(mockTx);
        });
        vitest_1.vi.spyOn(prisma_1.prisma.auditLog, 'create').mockResolvedValue({});
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/fees/invoices')
            .set('Authorization', `Bearer ${accountantToken}`)
            .send({
            studentId: 'student-1',
            academicSessionId: 'sess-1',
            title: 'Term 1 Fee',
            dueDate: '2026-05-10',
            discountAmount: 500,
            items: [
                { feeHeadId: 'head-1', description: 'Tuition Fee', amount: 4000 },
                { feeHeadId: 'head-2', description: 'Computer Lab', amount: 1000 },
            ],
        });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.invoiceNumber).toBe('INV/2026/000101');
        (0, vitest_1.expect)(mockTx.studentFeeLedger.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            data: vitest_1.expect.objectContaining({
                type: 'DEBIT',
                amount: new client_1.Prisma.Decimal(4500),
                referenceType: 'INVOICE',
            }),
        }));
    });
    (0, vitest_1.it)('Atomically collects payment, updates invoice to PAID, issues receipt and posts CREDIT to ledger', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'accountant-user-id',
            status: 'ACTIVE',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.feeInvoice, 'findFirst').mockResolvedValue({
            id: 'inv-1',
            schoolId,
            studentId: 'student-1',
            invoiceNumber: 'INV/2026/000101',
            totalAmount: new client_1.Prisma.Decimal(4500),
            paidAmount: new client_1.Prisma.Decimal(0),
            balanceAmount: new client_1.Prisma.Decimal(4500),
            status: 'UNPAID',
        });
        const mockTx = {
            sequenceCounter: {
                upsert: vitest_1.vi.fn().mockResolvedValue({ lastValue: 501 }),
            },
            feePayment: {
                create: vitest_1.vi.fn().mockResolvedValue({
                    id: 'pay-1',
                    receiptNumber: 'REC/2026/000501',
                    amount: new client_1.Prisma.Decimal(4500),
                    paymentMode: 'UPI',
                }),
            },
            feeInvoice: {
                update: vitest_1.vi.fn().mockResolvedValue({
                    id: 'inv-1',
                    status: 'PAID',
                    paidAmount: new client_1.Prisma.Decimal(4500),
                    balanceAmount: new client_1.Prisma.Decimal(0),
                }),
            },
            studentFeeLedger: {
                findFirst: vitest_1.vi.fn().mockResolvedValue({ balanceAfter: new client_1.Prisma.Decimal(4500) }),
                create: vitest_1.vi.fn().mockResolvedValue({}),
            },
        };
        vitest_1.vi.spyOn(prisma_1.prisma, '$transaction').mockImplementation(async (callback) => {
            return callback(mockTx);
        });
        vitest_1.vi.spyOn(prisma_1.prisma.auditLog, 'create').mockResolvedValue({});
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/fees/payments/collect')
            .set('Authorization', `Bearer ${accountantToken}`)
            .send({
            invoiceId: 'inv-1',
            amount: 4500,
            paymentMode: 'UPI',
            referenceNumber: 'UPI/1234567890',
            remarks: 'Full settlement via GooglePay',
        });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(mockTx.feeInvoice.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            data: vitest_1.expect.objectContaining({
                status: 'PAID',
                balanceAmount: new client_1.Prisma.Decimal(0),
            }),
        }));
        (0, vitest_1.expect)(mockTx.studentFeeLedger.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            data: vitest_1.expect.objectContaining({
                type: 'CREDIT',
                amount: new client_1.Prisma.Decimal(4500),
                referenceType: 'PAYMENT',
            }),
        }));
    });
    (0, vitest_1.it)('Rejects payment collection when amount exceeds outstanding invoice balance', async () => {
        vitest_1.vi.spyOn(prisma_1.prisma.user, 'findUnique').mockResolvedValue({
            id: 'accountant-user-id',
            status: 'ACTIVE',
            schoolId,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.school, 'findUnique').mockResolvedValue({
            id: schoolId,
            isActive: true,
        });
        vitest_1.vi.spyOn(prisma_1.prisma.feeInvoice, 'findFirst').mockResolvedValue({
            id: 'inv-1',
            schoolId,
            studentId: 'student-1',
            balanceAmount: new client_1.Prisma.Decimal(1000),
            status: 'PARTIALLY_PAID',
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/fees/payments/collect')
            .set('Authorization', `Bearer ${accountantToken}`)
            .send({
            invoiceId: 'inv-1',
            amount: 2500, // Exceeds balance of 1000!
            paymentMode: 'CASH',
        });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.success).toBe(false);
        (0, vitest_1.expect)(res.body.message).toMatch(/cannot exceed outstanding invoice balance/i);
    });
});
//# sourceMappingURL=fee_engine.test.js.map