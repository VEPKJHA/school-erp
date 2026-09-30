import { Response, NextFunction } from 'express';
import { FeeService } from '../services/fee.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';

export class FeeController {
  // ==========================================
  // FEE HEADS
  // ==========================================

  static async getFeeHeads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const heads = await FeeService.getFeeHeads(schoolId, isActive);
      return ResponseUtil.success(res, heads);
    } catch (err) {
      next(err);
    }
  }

  static async createFeeHead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const head = await FeeService.createFeeHead(schoolId, req.body, req.user?.id);
      return ResponseUtil.created(res, head, 'Fee head created successfully');
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        return ResponseUtil.conflict(res, err.message);
      }
      next(err);
    }
  }

  static async updateFeeHead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const head = await FeeService.updateFeeHead(req.params.id, schoolId, req.body, req.user?.id);
      return ResponseUtil.success(res, head, 'Fee head updated successfully');
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      if (err.message.includes('already exists')) {
        return ResponseUtil.conflict(res, err.message);
      }
      next(err);
    }
  }

  // ==========================================
  // FEE STRUCTURES
  // ==========================================

  static async getFeeStructures(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { academicSessionId, classId, isActive } = req.query;
      const structures = await FeeService.getFeeStructures({
        schoolId,
        academicSessionId: academicSessionId as string,
        classId: classId as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      return ResponseUtil.success(res, structures);
    } catch (err) {
      next(err);
    }
  }

  static async getFeeStructureById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const structure = await FeeService.getFeeStructureById(req.params.id, schoolId);
      return ResponseUtil.success(res, structure);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      next(err);
    }
  }

  static async createFeeStructure(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const structure = await FeeService.createFeeStructure(schoolId, req.body, req.user?.id);
      return ResponseUtil.created(res, structure, 'Fee structure created successfully');
    } catch (err: any) {
      if (err.message.includes('not found') || err.message.includes('invalid')) {
        return ResponseUtil.badRequest(res, err.message);
      }
      next(err);
    }
  }

  // ==========================================
  // ASSIGNMENTS
  // ==========================================

  static async assignFeeStructure(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const assignment = await FeeService.assignFeeStructure(schoolId, req.body, req.user?.id);
      return ResponseUtil.created(res, assignment, 'Fee structure assigned to student successfully');
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.badRequest(res, err.message);
      }
      next(err);
    }
  }

  static async bulkAssignFeeStructure(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await FeeService.bulkAssignFeeStructure(schoolId, req.body, req.user?.id);
      return ResponseUtil.success(
        res,
        result,
        `Assigned fee structure to ${result.assignedCount} students`
      );
    } catch (err: any) {
      if (err.message.includes('No active students')) {
        return ResponseUtil.badRequest(res, err.message);
      }
      next(err);
    }
  }

  // ==========================================
  // INVOICES
  // ==========================================

  static async getInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId, academicSessionId, classId, sectionId, status, search, page, pageSize } =
        req.query;
      const data = await FeeService.getInvoices({
        schoolId,
        studentId: studentId as string,
        academicSessionId: academicSessionId as string,
        classId: classId as string,
        sectionId: sectionId as string,
        status: status as any,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
      });
      return ResponseUtil.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async getInvoiceById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const invoice = await FeeService.getInvoiceById(req.params.id, schoolId);
      return ResponseUtil.success(res, invoice);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      next(err);
    }
  }

  static async generateInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const invoice = await FeeService.generateInvoice(schoolId, req.body, req.user?.id);
      return ResponseUtil.created(res, invoice, 'Fee invoice generated successfully');
    } catch (err: any) {
      if (err.message.includes('not found') || err.message.includes('belong')) {
        return ResponseUtil.badRequest(res, err.message);
      }
      next(err);
    }
  }

  static async bulkGenerateInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await FeeService.bulkGenerateInvoices(schoolId, req.body, req.user?.id);
      return ResponseUtil.success(
        res,
        result,
        `Generated ${result.generatedCount} invoices for enrolled students`
      );
    } catch (err: any) {
      if (err.message.includes('not found') || err.message.includes('No students')) {
        return ResponseUtil.badRequest(res, err.message);
      }
      next(err);
    }
  }

  // ==========================================
  // PAYMENTS & COLLECTION
  // ==========================================

  static async getPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { studentId, invoiceId, search, page, pageSize } = req.query;
      const data = await FeeService.getPayments({
        schoolId,
        studentId: studentId as string,
        invoiceId: invoiceId as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
      });
      return ResponseUtil.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async getPaymentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const payment = await FeeService.getPaymentById(req.params.id, schoolId);
      return ResponseUtil.success(res, payment);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      next(err);
    }
  }

  static async collectPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const result = await FeeService.collectPayment(schoolId, req.body, req.user?.id);
      return ResponseUtil.created(
        res,
        result,
        `Fee payment of ₹${req.body.amount} collected. Receipt No: ${result.payment.receiptNumber}`
      );
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      if (err.message.includes('cannot exceed') || err.message.includes('settled') || err.message.includes('void')) {
        return ResponseUtil.badRequest(res, err.message);
      }
      next(err);
    }
  }

  // ==========================================
  // STUDENT FEE LEDGER
  // ==========================================

  static async getStudentLedger(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const ledger = await FeeService.getStudentLedger(schoolId, req.params.studentId);
      return ResponseUtil.success(res, ledger);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ResponseUtil.notFound(res, err.message);
      }
      next(err);
    }
  }

  // ==========================================
  // SUMMARY & REPORTS
  // ==========================================

  static async getFeeSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId!;
      const { academicSessionId } = req.query;
      const summary = await FeeService.getFeeSummary(schoolId, academicSessionId as string);
      return ResponseUtil.success(res, summary);
    } catch (err) {
      next(err);
    }
  }
}
