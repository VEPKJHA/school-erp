"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeController = void 0;
const fee_service_1 = require("../services/fee.service");
const apiResponse_1 = require("../utils/apiResponse");
class FeeController {
    // ==========================================
    // FEE HEADS
    // ==========================================
    static async getFeeHeads(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
            const heads = await fee_service_1.FeeService.getFeeHeads(schoolId, isActive);
            return apiResponse_1.ResponseUtil.success(res, heads);
        }
        catch (err) {
            next(err);
        }
    }
    static async createFeeHead(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const head = await fee_service_1.FeeService.createFeeHead(schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.created(res, head, 'Fee head created successfully');
        }
        catch (err) {
            if (err.message.includes('already exists')) {
                return apiResponse_1.ResponseUtil.conflict(res, err.message);
            }
            next(err);
        }
    }
    static async updateFeeHead(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const head = await fee_service_1.FeeService.updateFeeHead(req.params.id, schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.success(res, head, 'Fee head updated successfully');
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            if (err.message.includes('already exists')) {
                return apiResponse_1.ResponseUtil.conflict(res, err.message);
            }
            next(err);
        }
    }
    // ==========================================
    // FEE STRUCTURES
    // ==========================================
    static async getFeeStructures(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { academicSessionId, classId, isActive } = req.query;
            const structures = await fee_service_1.FeeService.getFeeStructures({
                schoolId,
                academicSessionId: academicSessionId,
                classId: classId,
                isActive: isActive !== undefined ? isActive === 'true' : undefined,
            });
            return apiResponse_1.ResponseUtil.success(res, structures);
        }
        catch (err) {
            next(err);
        }
    }
    static async getFeeStructureById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const structure = await fee_service_1.FeeService.getFeeStructureById(req.params.id, schoolId);
            return apiResponse_1.ResponseUtil.success(res, structure);
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            next(err);
        }
    }
    static async createFeeStructure(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const structure = await fee_service_1.FeeService.createFeeStructure(schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.created(res, structure, 'Fee structure created successfully');
        }
        catch (err) {
            if (err.message.includes('not found') || err.message.includes('invalid')) {
                return apiResponse_1.ResponseUtil.badRequest(res, err.message);
            }
            next(err);
        }
    }
    // ==========================================
    // ASSIGNMENTS
    // ==========================================
    static async assignFeeStructure(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const assignment = await fee_service_1.FeeService.assignFeeStructure(schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.created(res, assignment, 'Fee structure assigned to student successfully');
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.badRequest(res, err.message);
            }
            next(err);
        }
    }
    static async bulkAssignFeeStructure(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await fee_service_1.FeeService.bulkAssignFeeStructure(schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.success(res, result, `Assigned fee structure to ${result.assignedCount} students`);
        }
        catch (err) {
            if (err.message.includes('No active students')) {
                return apiResponse_1.ResponseUtil.badRequest(res, err.message);
            }
            next(err);
        }
    }
    // ==========================================
    // INVOICES
    // ==========================================
    static async getInvoices(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { studentId, academicSessionId, classId, sectionId, status, search, page, pageSize } = req.query;
            const data = await fee_service_1.FeeService.getInvoices({
                schoolId,
                studentId: studentId,
                academicSessionId: academicSessionId,
                classId: classId,
                sectionId: sectionId,
                status: status,
                search: search,
                page: page ? parseInt(page, 10) : 1,
                pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            });
            return apiResponse_1.ResponseUtil.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async getInvoiceById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const invoice = await fee_service_1.FeeService.getInvoiceById(req.params.id, schoolId);
            return apiResponse_1.ResponseUtil.success(res, invoice);
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            next(err);
        }
    }
    static async generateInvoice(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const invoice = await fee_service_1.FeeService.generateInvoice(schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.created(res, invoice, 'Fee invoice generated successfully');
        }
        catch (err) {
            if (err.message.includes('not found') || err.message.includes('belong')) {
                return apiResponse_1.ResponseUtil.badRequest(res, err.message);
            }
            next(err);
        }
    }
    static async bulkGenerateInvoices(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await fee_service_1.FeeService.bulkGenerateInvoices(schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.success(res, result, `Generated ${result.generatedCount} invoices for enrolled students`);
        }
        catch (err) {
            if (err.message.includes('not found') || err.message.includes('No students')) {
                return apiResponse_1.ResponseUtil.badRequest(res, err.message);
            }
            next(err);
        }
    }
    // ==========================================
    // PAYMENTS & COLLECTION
    // ==========================================
    static async getPayments(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { studentId, invoiceId, search, page, pageSize } = req.query;
            const data = await fee_service_1.FeeService.getPayments({
                schoolId,
                studentId: studentId,
                invoiceId: invoiceId,
                search: search,
                page: page ? parseInt(page, 10) : 1,
                pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            });
            return apiResponse_1.ResponseUtil.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async getPaymentById(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const payment = await fee_service_1.FeeService.getPaymentById(req.params.id, schoolId);
            return apiResponse_1.ResponseUtil.success(res, payment);
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            next(err);
        }
    }
    static async collectPayment(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const result = await fee_service_1.FeeService.collectPayment(schoolId, req.body, req.user?.id);
            return apiResponse_1.ResponseUtil.created(res, result, `Fee payment of ₹${req.body.amount} collected. Receipt No: ${result.payment.receiptNumber}`);
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            if (err.message.includes('cannot exceed') || err.message.includes('settled') || err.message.includes('void')) {
                return apiResponse_1.ResponseUtil.badRequest(res, err.message);
            }
            next(err);
        }
    }
    // ==========================================
    // STUDENT FEE LEDGER
    // ==========================================
    static async getStudentLedger(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const ledger = await fee_service_1.FeeService.getStudentLedger(schoolId, req.params.studentId);
            return apiResponse_1.ResponseUtil.success(res, ledger);
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return apiResponse_1.ResponseUtil.notFound(res, err.message);
            }
            next(err);
        }
    }
    // ==========================================
    // SUMMARY & REPORTS
    // ==========================================
    static async getFeeSummary(req, res, next) {
        try {
            const schoolId = req.schoolId;
            const { academicSessionId } = req.query;
            const summary = await fee_service_1.FeeService.getFeeSummary(schoolId, academicSessionId);
            return apiResponse_1.ResponseUtil.success(res, summary);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.FeeController = FeeController;
//# sourceMappingURL=fee.controller.js.map