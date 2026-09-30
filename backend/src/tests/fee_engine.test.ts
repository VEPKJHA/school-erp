import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import { signAccessToken } from '../utils/jwt';
import { SequenceGenerator } from '../utils/sequenceGenerator';
import { Prisma } from '@prisma/client';

describe('Phase 3: Fee Engine & Collection Workflow', () => {
  const schoolId = 'school-alpha-uuid';

  const accountantToken = signAccessToken({
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

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Generates human-readable sequential invoice and receipt numbers', async () => {
    const mockTx = {
      sequenceCounter: {
        upsert: vi.fn().mockResolvedValue({ lastValue: 88 }),
      },
    };

    const invNum = await SequenceGenerator.generateInvoiceNumber(schoolId, 2026, mockTx);
    expect(invNum).toBe('INV/2026/000088');

    const recNum = await SequenceGenerator.generateReceiptNumber(schoolId, 2026, mockTx);
    expect(recNum).toBe('REC/2026/000088');
  });

  it('Creates fee head with unique code and logs audit', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'accountant-user-id',
      status: 'ACTIVE',
      schoolId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.feeHead, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.feeHead, 'create').mockResolvedValue({
      id: 'head-tuit-1',
      schoolId,
      name: 'Tuition Fee',
      code: 'TUIT',
      description: 'Monthly tuition instruction fee',
      isRefundable: false,
      isActive: true,
    } as any);

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/fees/heads')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        name: 'Tuition Fee',
        code: 'TUIT',
        description: 'Monthly tuition instruction fee',
        isRefundable: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('TUIT');
  });

  it('Generates invoice, calculates balance and posts DEBIT entry to student ledger', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'accountant-user-id',
      status: 'ACTIVE',
      schoolId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.student, 'findFirst').mockResolvedValue({
      id: 'student-1',
      schoolId,
      firstName: 'Aarav',
      lastName: 'Sharma',
    } as any);

    vi.spyOn(prisma.feeHead, 'findMany').mockResolvedValue([
      { id: 'head-1', schoolId },
      { id: 'head-2', schoolId },
    ] as any);

    const mockTx = {
      sequenceCounter: {
        upsert: vi.fn().mockResolvedValue({ lastValue: 101 }),
      },
      feeInvoice: {
        create: vi.fn().mockResolvedValue({
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
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback(mockTx);
    });

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
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

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoiceNumber).toBe('INV/2026/000101');
    expect(mockTx.studentFeeLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'DEBIT',
          amount: new Prisma.Decimal(4500),
          referenceType: 'INVOICE',
        }),
      })
    );
  });

  it('Atomically collects payment, updates invoice to PAID, issues receipt and posts CREDIT to ledger', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'accountant-user-id',
      status: 'ACTIVE',
      schoolId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.feeInvoice, 'findFirst').mockResolvedValue({
      id: 'inv-1',
      schoolId,
      studentId: 'student-1',
      invoiceNumber: 'INV/2026/000101',
      totalAmount: new Prisma.Decimal(4500),
      paidAmount: new Prisma.Decimal(0),
      balanceAmount: new Prisma.Decimal(4500),
      status: 'UNPAID',
    } as any);

    const mockTx = {
      sequenceCounter: {
        upsert: vi.fn().mockResolvedValue({ lastValue: 501 }),
      },
      feePayment: {
        create: vi.fn().mockResolvedValue({
          id: 'pay-1',
          receiptNumber: 'REC/2026/000501',
          amount: new Prisma.Decimal(4500),
          paymentMode: 'UPI',
        }),
      },
      feeInvoice: {
        update: vi.fn().mockResolvedValue({
          id: 'inv-1',
          status: 'PAID',
          paidAmount: new Prisma.Decimal(4500),
          balanceAmount: new Prisma.Decimal(0),
        }),
      },
      studentFeeLedger: {
        findFirst: vi.fn().mockResolvedValue({ balanceAfter: new Prisma.Decimal(4500) }),
        create: vi.fn().mockResolvedValue({}),
      },
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback(mockTx);
    });

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/fees/payments/collect')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: 'inv-1',
        amount: 4500,
        paymentMode: 'UPI',
        referenceNumber: 'UPI/1234567890',
        remarks: 'Full settlement via GooglePay',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockTx.feeInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PAID',
          balanceAmount: new Prisma.Decimal(0),
        }),
      })
    );
    expect(mockTx.studentFeeLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'CREDIT',
          amount: new Prisma.Decimal(4500),
          referenceType: 'PAYMENT',
        }),
      })
    );
  });

  it('Rejects payment collection when amount exceeds outstanding invoice balance', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'accountant-user-id',
      status: 'ACTIVE',
      schoolId,
    } as any);

    vi.spyOn(prisma.school, 'findUnique').mockResolvedValue({
      id: schoolId,
      isActive: true,
    } as any);

    vi.spyOn(prisma.feeInvoice, 'findFirst').mockResolvedValue({
      id: 'inv-1',
      schoolId,
      studentId: 'student-1',
      balanceAmount: new Prisma.Decimal(1000),
      status: 'PARTIALLY_PAID',
    } as any);

    const res = await request(app)
      .post('/api/fees/payments/collect')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: 'inv-1',
        amount: 2500, // Exceeds balance of 1000!
        paymentMode: 'CASH',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot exceed outstanding invoice balance/i);
  });
});
