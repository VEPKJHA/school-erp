"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeService = void 0;
const prisma_1 = require("../config/prisma");
const fee_repository_1 = require("../repositories/fee.repository");
const sequenceGenerator_1 = require("../utils/sequenceGenerator");
const audit_service_1 = require("./audit.service");
const client_1 = require("@prisma/client");
class FeeService {
    // ==========================================
    // 1. FEE HEADS
    // ==========================================
    static async getFeeHeads(schoolId, isActive) {
        return fee_repository_1.FeeRepository.findAllFeeHeads(schoolId, isActive);
    }
    static async createFeeHead(schoolId, data, userId) {
        const existing = await fee_repository_1.FeeRepository.findFeeHeadByCode(data.code, schoolId);
        if (existing) {
            throw new Error(`Fee head with code '${data.code.toUpperCase()}' already exists`);
        }
        const feeHead = await fee_repository_1.FeeRepository.createFeeHead(schoolId, data);
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'FEE_HEAD_CREATED',
            entity: 'FeeHead',
            entityId: feeHead.id,
            newValue: feeHead,
        });
        return feeHead;
    }
    static async updateFeeHead(id, schoolId, data, userId) {
        const existing = await fee_repository_1.FeeRepository.findFeeHeadById(id, schoolId);
        if (!existing) {
            throw new Error('Fee head not found in your school institution');
        }
        if (data.code && data.code.toUpperCase() !== existing.code) {
            const codeDuplicate = await fee_repository_1.FeeRepository.findFeeHeadByCode(data.code, schoolId);
            if (codeDuplicate) {
                throw new Error(`Fee head with code '${data.code.toUpperCase()}' already exists`);
            }
        }
        const updated = await fee_repository_1.FeeRepository.updateFeeHead(id, schoolId, data);
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'FEE_HEAD_UPDATED',
            entity: 'FeeHead',
            entityId: id,
            oldValue: existing,
            newValue: updated,
        });
        return updated;
    }
    // ==========================================
    // 2. FEE STRUCTURES
    // ==========================================
    static async getFeeStructures(params) {
        return fee_repository_1.FeeRepository.findAllFeeStructures(params);
    }
    static async getFeeStructureById(id, schoolId) {
        const structure = await fee_repository_1.FeeRepository.findFeeStructureById(id, schoolId);
        if (!structure) {
            throw new Error('Fee structure not found');
        }
        return structure;
    }
    static async createFeeStructure(schoolId, data, userId) {
        // Validate Class belongs to School
        const cls = await prisma_1.prisma.class.findFirst({
            where: { id: data.classId, schoolId },
        });
        if (!cls) {
            throw new Error('Class not found or belongs to another school institution');
        }
        // Validate AcademicSession belongs to School
        const session = await prisma_1.prisma.academicSession.findFirst({
            where: { id: data.academicSessionId, schoolId },
        });
        if (!session) {
            throw new Error('Academic session not found or belongs to another school institution');
        }
        // Validate FeeHeads belong to School
        const headIds = data.items.map((i) => i.feeHeadId);
        const validHeads = await prisma_1.prisma.feeHead.findMany({
            where: { id: { in: headIds }, schoolId, isActive: true },
        });
        if (validHeads.length !== headIds.length) {
            throw new Error('One or more fee heads are invalid or belong to another institution');
        }
        const structure = await fee_repository_1.FeeRepository.createFeeStructure(schoolId, data);
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'FEE_STRUCTURE_CREATED',
            entity: 'FeeStructure',
            entityId: structure.id,
            newValue: structure,
        });
        return structure;
    }
    // ==========================================
    // 3. STUDENT FEE ASSIGNMENTS
    // ==========================================
    static async assignFeeStructure(schoolId, data, userId) {
        // Validate student ownership
        const student = await prisma_1.prisma.student.findFirst({
            where: { id: data.studentId, schoolId },
        });
        if (!student) {
            throw new Error('Student not found or belongs to another institution');
        }
        // Validate structure ownership
        const structure = await fee_repository_1.FeeRepository.findFeeStructureById(data.feeStructureId, schoolId);
        if (!structure) {
            throw new Error('Fee structure not found');
        }
        const assignment = await fee_repository_1.FeeRepository.assignFeeStructure(schoolId, data);
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'FEE_STRUCTURE_ASSIGNED',
            entity: 'StudentFeeAssignment',
            entityId: assignment.id,
            newValue: assignment,
        });
        return assignment;
    }
    static async bulkAssignFeeStructure(schoolId, data, userId) {
        const studentWhere = {
            schoolId,
            classId: data.classId,
            status: { in: ['ACTIVE', 'ADMITTED'] },
        };
        if (data.sectionId) {
            studentWhere.sectionId = data.sectionId;
        }
        const students = await prisma_1.prisma.student.findMany({
            where: studentWhere,
            select: { id: true },
        });
        if (students.length === 0) {
            throw new Error('No active students found in the selected class/section');
        }
        let assignedCount = 0;
        for (const stu of students) {
            await fee_repository_1.FeeRepository.assignFeeStructure(schoolId, {
                studentId: stu.id,
                feeStructureId: data.feeStructureId,
                academicSessionId: data.academicSessionId,
            });
            assignedCount++;
        }
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'BULK_FEE_ASSIGNED',
            entity: 'FeeStructure',
            entityId: data.feeStructureId,
            newValue: { classId: data.classId, assignedCount },
        });
        return { assignedCount, totalStudents: students.length };
    }
    // ==========================================
    // 4. INVOICE GENERATION
    // ==========================================
    static async getInvoices(params) {
        return fee_repository_1.FeeRepository.findAllInvoices(params);
    }
    static async getInvoiceById(id, schoolId) {
        const invoice = await fee_repository_1.FeeRepository.findInvoiceById(id, schoolId);
        if (!invoice) {
            throw new Error('Fee invoice not found in your school institution');
        }
        return invoice;
    }
    static async generateInvoice(schoolId, data, userId) {
        // Validate student
        const student = await prisma_1.prisma.student.findFirst({
            where: { id: data.studentId, schoolId },
        });
        if (!student) {
            throw new Error('Student not found or belongs to another institution');
        }
        // Validate heads
        const headIds = data.items.map((i) => i.feeHeadId);
        const validHeads = await prisma_1.prisma.feeHead.findMany({
            where: { id: { in: headIds }, schoolId },
        });
        if (validHeads.length !== headIds.length) {
            throw new Error('One or more fee heads belong to another institution');
        }
        const year = new Date().getFullYear();
        const invoice = await prisma_1.prisma.$transaction(async (tx) => {
            const invoiceNumber = await sequenceGenerator_1.SequenceGenerator.generateInvoiceNumber(schoolId, year, tx);
            // Calculate totals
            let subtotal = 0;
            data.items.forEach((item) => {
                subtotal += Number(item.amount);
            });
            const discount = Number(data.discountAmount || 0);
            const lateFee = Number(data.lateFeeAmount || 0);
            const totalAmount = Math.max(0, subtotal - discount + lateFee);
            const inv = await tx.feeInvoice.create({
                data: {
                    schoolId,
                    studentId: data.studentId,
                    academicSessionId: data.academicSessionId,
                    invoiceNumber,
                    title: data.title,
                    dueDate: new Date(data.dueDate),
                    subtotal: new client_1.Prisma.Decimal(subtotal),
                    discountAmount: new client_1.Prisma.Decimal(discount),
                    lateFeeAmount: new client_1.Prisma.Decimal(lateFee),
                    totalAmount: new client_1.Prisma.Decimal(totalAmount),
                    paidAmount: new client_1.Prisma.Decimal(0),
                    balanceAmount: new client_1.Prisma.Decimal(totalAmount),
                    status: 'UNPAID',
                    remarks: data.remarks,
                    items: {
                        create: data.items.map((item) => ({
                            feeHeadId: item.feeHeadId,
                            description: item.description,
                            amount: new client_1.Prisma.Decimal(item.amount),
                        })),
                    },
                },
                include: {
                    items: { include: { feeHead: true } },
                    student: true,
                },
            });
            // Update student fee ledger: DEBIT
            const lastLedger = await tx.studentFeeLedger.findFirst({
                where: { schoolId, studentId: data.studentId },
                orderBy: { entryDate: 'desc' },
            });
            const currentBalance = lastLedger ? Number(lastLedger.balanceAfter) : 0;
            const newBalance = currentBalance + totalAmount;
            await tx.studentFeeLedger.create({
                data: {
                    schoolId,
                    studentId: data.studentId,
                    type: 'DEBIT',
                    amount: new client_1.Prisma.Decimal(totalAmount),
                    balanceAfter: new client_1.Prisma.Decimal(newBalance),
                    referenceType: 'INVOICE',
                    referenceId: inv.id,
                    description: `Invoice: ${inv.title} (${inv.invoiceNumber})`,
                },
            });
            return inv;
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'FEE_INVOICE_GENERATED',
            entity: 'FeeInvoice',
            entityId: invoice.id,
            newValue: { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount },
        });
        return invoice;
    }
    static async bulkGenerateInvoices(schoolId, data, userId) {
        const structure = await fee_repository_1.FeeRepository.findFeeStructureById(data.feeStructureId, schoolId);
        if (!structure) {
            throw new Error('Fee structure template not found');
        }
        const studentWhere = {
            schoolId,
            classId: data.classId,
            status: { in: ['ACTIVE', 'ADMITTED'] },
        };
        if (data.sectionId) {
            studentWhere.sectionId = data.sectionId;
        }
        const students = await prisma_1.prisma.student.findMany({
            where: studentWhere,
            include: {
                feeAssignments: {
                    where: { feeStructureId: data.feeStructureId, isActive: true },
                },
            },
        });
        if (students.length === 0) {
            throw new Error('No students found in the selected class/section for fee generation');
        }
        let generatedCount = 0;
        const year = new Date().getFullYear();
        for (const student of students) {
            const assignment = student.feeAssignments[0];
            const concessionAmount = assignment ? Number(assignment.concessionAmount) : 0;
            const items = structure.items.map((it) => ({
                feeHeadId: it.feeHeadId,
                description: it.feeHead.name,
                amount: Number(it.amount),
            }));
            await this.generateInvoice(schoolId, {
                studentId: student.id,
                academicSessionId: data.academicSessionId,
                title: data.title,
                dueDate: data.dueDate,
                discountAmount: concessionAmount,
                lateFeeAmount: 0,
                items,
            }, userId);
            generatedCount++;
        }
        return { generatedCount, totalEligible: students.length };
    }
    // ==========================================
    // 5. FEE COLLECTION & RECEIPT ISSUANCE
    // ==========================================
    static async getPayments(params) {
        return fee_repository_1.FeeRepository.findAllPayments(params);
    }
    static async getPaymentById(id, schoolId) {
        const payment = await fee_repository_1.FeeRepository.findPaymentById(id, schoolId);
        if (!payment) {
            throw new Error('Payment record not found');
        }
        return payment;
    }
    static async collectPayment(schoolId, data, userId) {
        const invoice = await fee_repository_1.FeeRepository.findInvoiceById(data.invoiceId, schoolId);
        if (!invoice) {
            throw new Error('Target fee invoice not found in your school institution');
        }
        if (invoice.status === 'PAID') {
            throw new Error('Invoice is already fully settled');
        }
        if (invoice.status === 'VOID' || invoice.status === 'CANCELLED') {
            throw new Error('Cannot collect payment against a void or cancelled invoice');
        }
        const currentBalance = Number(invoice.balanceAmount);
        const paymentAmount = Number(data.amount);
        if (paymentAmount > currentBalance) {
            throw new Error(`Payment amount (₹${paymentAmount}) cannot exceed outstanding invoice balance (₹${currentBalance})`);
        }
        const year = new Date().getFullYear();
        // Atomic transaction for payment collection, invoice update, and ledger post
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Generate human-readable receipt number
            const receiptNumber = await sequenceGenerator_1.SequenceGenerator.generateReceiptNumber(schoolId, year, tx);
            // 2. Create Payment Record
            const payment = await tx.feePayment.create({
                data: {
                    schoolId,
                    invoiceId: invoice.id,
                    studentId: invoice.studentId,
                    receiptNumber,
                    amount: new client_1.Prisma.Decimal(paymentAmount),
                    paymentMode: data.paymentMode,
                    paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
                    referenceNumber: data.referenceNumber,
                    status: 'SUCCESS',
                    collectedById: userId,
                    remarks: data.remarks,
                },
            });
            // 3. Update Invoice Balance & Status
            const newPaidAmount = Number(invoice.paidAmount) + paymentAmount;
            const newBalance = currentBalance - paymentAmount;
            const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';
            const updatedInvoice = await tx.feeInvoice.update({
                where: { id: invoice.id },
                data: {
                    paidAmount: new client_1.Prisma.Decimal(newPaidAmount),
                    balanceAmount: new client_1.Prisma.Decimal(newBalance),
                    status: newStatus,
                },
            });
            // 4. Update Student Fee Ledger: CREDIT
            const lastLedger = await tx.studentFeeLedger.findFirst({
                where: { schoolId, studentId: invoice.studentId },
                orderBy: { entryDate: 'desc' },
            });
            const currentLedgerBalance = lastLedger ? Number(lastLedger.balanceAfter) : 0;
            const newLedgerBalance = currentLedgerBalance - paymentAmount;
            await tx.studentFeeLedger.create({
                data: {
                    schoolId,
                    studentId: invoice.studentId,
                    type: 'CREDIT',
                    amount: new client_1.Prisma.Decimal(paymentAmount),
                    balanceAfter: new client_1.Prisma.Decimal(newLedgerBalance),
                    referenceType: 'PAYMENT',
                    referenceId: payment.id,
                    description: `Fee Receipt: ${receiptNumber} (${data.paymentMode})`,
                },
            });
            return { payment, invoice: updatedInvoice };
        });
        await audit_service_1.AuditService.log({
            schoolId,
            userId,
            action: 'FEE_PAYMENT_COLLECTED',
            entity: 'FeePayment',
            entityId: result.payment.id,
            newValue: {
                receiptNumber: result.payment.receiptNumber,
                amount: result.payment.amount,
                invoiceNumber: invoice.invoiceNumber,
            },
        });
        return result;
    }
    // ==========================================
    // 6. STUDENT FEE LEDGER
    // ==========================================
    static async getStudentLedger(schoolId, studentId) {
        const student = await prisma_1.prisma.student.findFirst({
            where: { id: studentId, schoolId },
        });
        if (!student) {
            throw new Error('Student not found in your school institution');
        }
        return fee_repository_1.FeeRepository.getStudentLedger(schoolId, studentId);
    }
    // ==========================================
    // 7. SUMMARY & REPORTS
    // ==========================================
    static async getFeeSummary(schoolId, academicSessionId) {
        return fee_repository_1.FeeRepository.getFeeSummary(schoolId, academicSessionId);
    }
}
exports.FeeService = FeeService;
//# sourceMappingURL=fee.service.js.map