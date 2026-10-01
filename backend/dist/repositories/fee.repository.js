"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeRepository = void 0;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
class FeeRepository {
    // ==========================================
    // 1. FEE HEADS
    // ==========================================
    static async findAllFeeHeads(schoolId, isActive) {
        const where = { schoolId };
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        return prisma_1.prisma.feeHead.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }
    static async findFeeHeadById(id, schoolId) {
        return prisma_1.prisma.feeHead.findFirst({
            where: { id, schoolId },
        });
    }
    static async findFeeHeadByCode(code, schoolId) {
        return prisma_1.prisma.feeHead.findFirst({
            where: { code, schoolId },
        });
    }
    static async createFeeHead(schoolId, data) {
        return prisma_1.prisma.feeHead.create({
            data: {
                schoolId,
                name: data.name,
                code: data.code.toUpperCase(),
                description: data.description,
                isRefundable: data.isRefundable ?? false,
            },
        });
    }
    static async updateFeeHead(id, schoolId, data) {
        const existing = await this.findFeeHeadById(id, schoolId);
        if (!existing)
            return null;
        return prisma_1.prisma.feeHead.update({
            where: { id },
            data: {
                ...data,
                code: data.code ? data.code.toUpperCase() : undefined,
            },
        });
    }
    // ==========================================
    // 2. FEE STRUCTURES
    // ==========================================
    static async findAllFeeStructures(params) {
        const { schoolId, academicSessionId, classId, isActive } = params;
        const where = { schoolId };
        if (academicSessionId)
            where.academicSessionId = academicSessionId;
        if (classId)
            where.classId = classId;
        if (isActive !== undefined)
            where.isActive = isActive;
        return prisma_1.prisma.feeStructure.findMany({
            where,
            include: {
                class: { select: { id: true, name: true, code: true } },
                session: { select: { id: true, name: true, isCurrent: true } },
                items: {
                    include: {
                        feeHead: { select: { id: true, name: true, code: true, isRefundable: true } },
                    },
                },
            },
            orderBy: [{ class: { numericOrder: 'asc' } }, { name: 'asc' }],
        });
    }
    static async findFeeStructureById(id, schoolId) {
        return prisma_1.prisma.feeStructure.findFirst({
            where: { id, schoolId },
            include: {
                class: { select: { id: true, name: true, code: true } },
                session: { select: { id: true, name: true, isCurrent: true } },
                items: {
                    include: {
                        feeHead: { select: { id: true, name: true, code: true, isRefundable: true } },
                    },
                },
            },
        });
    }
    static async createFeeStructure(schoolId, data) {
        return prisma_1.prisma.feeStructure.create({
            data: {
                schoolId,
                name: data.name,
                academicSessionId: data.academicSessionId,
                classId: data.classId,
                frequency: data.frequency,
                description: data.description,
                items: {
                    create: data.items.map((item) => ({
                        feeHeadId: item.feeHeadId,
                        amount: new client_1.Prisma.Decimal(item.amount),
                        dueDayOfMonth: item.dueDayOfMonth ?? 10,
                    })),
                },
            },
            include: {
                class: true,
                session: true,
                items: { include: { feeHead: true } },
            },
        });
    }
    // ==========================================
    // 3. STUDENT FEE ASSIGNMENTS
    // ==========================================
    static async findAssignment(schoolId, studentId, academicSessionId) {
        return prisma_1.prisma.studentFeeAssignment.findFirst({
            where: { schoolId, studentId, academicSessionId },
            include: {
                feeStructure: {
                    include: {
                        items: { include: { feeHead: true } },
                    },
                },
            },
        });
    }
    static async assignFeeStructure(schoolId, data) {
        return prisma_1.prisma.studentFeeAssignment.upsert({
            where: {
                schoolId_studentId_feeStructureId_academicSessionId: {
                    schoolId,
                    studentId: data.studentId,
                    feeStructureId: data.feeStructureId,
                    academicSessionId: data.academicSessionId,
                },
            },
            update: {
                concessionAmount: new client_1.Prisma.Decimal(data.concessionAmount ?? 0),
                concessionPercent: new client_1.Prisma.Decimal(data.concessionPercent ?? 0),
                concessionReason: data.concessionReason,
                isActive: true,
            },
            create: {
                schoolId,
                studentId: data.studentId,
                feeStructureId: data.feeStructureId,
                academicSessionId: data.academicSessionId,
                concessionAmount: new client_1.Prisma.Decimal(data.concessionAmount ?? 0),
                concessionPercent: new client_1.Prisma.Decimal(data.concessionPercent ?? 0),
                concessionReason: data.concessionReason,
                isActive: true,
            },
            include: {
                student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
                feeStructure: { include: { items: { include: { feeHead: true } } } },
            },
        });
    }
    // ==========================================
    // 4. FEE INVOICES
    // ==========================================
    static async findAllInvoices(params) {
        const { schoolId, studentId, academicSessionId, classId, sectionId, status, search, page = 1, pageSize = 20, } = params;
        const where = { schoolId };
        if (studentId)
            where.studentId = studentId;
        if (academicSessionId)
            where.academicSessionId = academicSessionId;
        if (status)
            where.status = status;
        if (classId || sectionId || search) {
            where.student = {};
            if (classId)
                where.student.classId = classId;
            if (sectionId)
                where.student.sectionId = sectionId;
            if (search) {
                where.OR = [
                    { invoiceNumber: { contains: search } },
                    { title: { contains: search } },
                    { student: { firstName: { contains: search } } },
                    { student: { lastName: { contains: search } } },
                    { student: { admissionNumber: { contains: search } } },
                ];
            }
        }
        const [total, invoices] = await Promise.all([
            prisma_1.prisma.feeInvoice.count({ where }),
            prisma_1.prisma.feeInvoice.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { dueDate: 'desc' },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            admissionNumber: true,
                            studentCode: true,
                            class: { select: { id: true, name: true } },
                            section: { select: { id: true, name: true } },
                        },
                    },
                    session: { select: { id: true, name: true } },
                    items: {
                        include: { feeHead: { select: { id: true, name: true, code: true } } },
                    },
                    payments: {
                        where: { status: 'SUCCESS' },
                        select: {
                            id: true,
                            receiptNumber: true,
                            amount: true,
                            paymentDate: true,
                            paymentMode: true,
                        },
                    },
                },
            }),
        ]);
        return { total, invoices };
    }
    static async findInvoiceById(id, schoolId) {
        return prisma_1.prisma.feeInvoice.findFirst({
            where: { id, schoolId },
            include: {
                student: {
                    include: {
                        class: true,
                        section: true,
                        parents: { include: { parent: true } },
                        addresses: true,
                    },
                },
                session: true,
                items: {
                    include: { feeHead: true },
                },
                payments: {
                    include: {
                        collectedBy: { select: { id: true, firstName: true, lastName: true } },
                    },
                    orderBy: { paymentDate: 'desc' },
                },
            },
        });
    }
    // ==========================================
    // 5. FEE PAYMENTS
    // ==========================================
    static async findAllPayments(params) {
        const { schoolId, studentId, invoiceId, page = 1, pageSize = 20, search } = params;
        const where = { schoolId };
        if (studentId)
            where.studentId = studentId;
        if (invoiceId)
            where.invoiceId = invoiceId;
        if (search) {
            where.OR = [
                { receiptNumber: { contains: search } },
                { referenceNumber: { contains: search } },
                { student: { firstName: { contains: search } } },
                { student: { lastName: { contains: search } } },
                { student: { admissionNumber: { contains: search } } },
            ];
        }
        const [total, payments] = await Promise.all([
            prisma_1.prisma.feePayment.count({ where }),
            prisma_1.prisma.feePayment.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { paymentDate: 'desc' },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            admissionNumber: true,
                            class: { select: { id: true, name: true } },
                            section: { select: { id: true, name: true } },
                        },
                    },
                    invoice: {
                        select: {
                            id: true,
                            invoiceNumber: true,
                            title: true,
                            totalAmount: true,
                            balanceAmount: true,
                        },
                    },
                    collectedBy: { select: { id: true, firstName: true, lastName: true } },
                },
            }),
        ]);
        return { total, payments };
    }
    static async findPaymentById(id, schoolId) {
        return prisma_1.prisma.feePayment.findFirst({
            where: { id, schoolId },
            include: {
                student: {
                    include: {
                        class: true,
                        section: true,
                        parents: { include: { parent: true } },
                    },
                },
                invoice: {
                    include: {
                        items: { include: { feeHead: true } },
                    },
                },
                collectedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }
    // ==========================================
    // 6. STUDENT FEE LEDGER
    // ==========================================
    static async getStudentLedger(schoolId, studentId) {
        return prisma_1.prisma.studentFeeLedger.findMany({
            where: { schoolId, studentId },
            orderBy: { entryDate: 'asc' },
        });
    }
    // ==========================================
    // 7. SUMMARY & REPORTS
    // ==========================================
    static async getFeeSummary(schoolId, academicSessionId) {
        const where = { schoolId };
        if (academicSessionId)
            where.academicSessionId = academicSessionId;
        const [invoices, payments] = await Promise.all([
            prisma_1.prisma.feeInvoice.findMany({
                where,
                select: {
                    totalAmount: true,
                    paidAmount: true,
                    balanceAmount: true,
                    status: true,
                },
            }),
            prisma_1.prisma.feePayment.findMany({
                where: { schoolId, status: 'SUCCESS' },
                select: {
                    amount: true,
                    paymentMode: true,
                },
            }),
        ]);
        let totalBilled = 0;
        let totalCollected = 0;
        let totalOutstanding = 0;
        let paidInvoicesCount = 0;
        let unpaidInvoicesCount = 0;
        let partiallyPaidCount = 0;
        let overdueCount = 0;
        for (const inv of invoices) {
            totalBilled += Number(inv.totalAmount);
            totalCollected += Number(inv.paidAmount);
            totalOutstanding += Number(inv.balanceAmount);
            if (inv.status === 'PAID')
                paidInvoicesCount++;
            else if (inv.status === 'UNPAID')
                unpaidInvoicesCount++;
            else if (inv.status === 'PARTIALLY_PAID')
                partiallyPaidCount++;
            else if (inv.status === 'OVERDUE')
                overdueCount++;
        }
        const modeBreakdown = {};
        for (const p of payments) {
            const mode = p.paymentMode;
            modeBreakdown[mode] = (modeBreakdown[mode] || 0) + Number(p.amount);
        }
        return {
            totalBilled,
            totalCollected,
            totalOutstanding,
            totalInvoices: invoices.length,
            paidInvoicesCount,
            unpaidInvoicesCount,
            partiallyPaidCount,
            overdueCount,
            modeBreakdown,
        };
    }
}
exports.FeeRepository = FeeRepository;
//# sourceMappingURL=fee.repository.js.map