import api from './api';
import {
  FeeHead,
  FeeStructure,
  StudentFeeAssignment,
  FeeInvoice,
  FeePayment,
  StudentFeeLedger,
  FeeSummaryReport,
} from '../types';

export const FeeService = {
  // ==========================================
  // FEE HEADS
  // ==========================================

  async getFeeHeads(isActive?: boolean): Promise<FeeHead[]> {
    const res = await api.get('/fees/heads', { params: { isActive } });
    return res.data?.data || [];
  },

  async createFeeHead(payload: {
    name: string;
    code: string;
    description?: string;
    isRefundable?: boolean;
  }): Promise<FeeHead> {
    const res = await api.post('/fees/heads', payload);
    return res.data?.data;
  },

  async updateFeeHead(
    id: string,
    payload: {
      name?: string;
      code?: string;
      description?: string;
      isRefundable?: boolean;
      isActive?: boolean;
    }
  ): Promise<FeeHead> {
    const res = await api.put(`/fees/heads/${id}`, payload);
    return res.data?.data;
  },

  // ==========================================
  // FEE STRUCTURES
  // ==========================================

  async getFeeStructures(params?: {
    academicSessionId?: string;
    classId?: string;
    isActive?: boolean;
  }): Promise<FeeStructure[]> {
    const res = await api.get('/fees/structures', { params });
    return res.data?.data || [];
  },

  async getFeeStructureById(id: string): Promise<FeeStructure> {
    const res = await api.get(`/fees/structures/${id}`);
    return res.data?.data;
  },

  async createFeeStructure(payload: {
    academicSessionId: string;
    classId: string;
    name: string;
    frequency: string;
    description?: string;
    items: { feeHeadId: string; amount: number; dueDayOfMonth?: number }[];
  }): Promise<FeeStructure> {
    const res = await api.post('/fees/structures', payload);
    return res.data?.data;
  },

  // ==========================================
  // FEE ASSIGNMENTS
  // ==========================================

  async assignFeeStructure(payload: {
    studentId: string;
    feeStructureId: string;
    academicSessionId: string;
    concessionAmount?: number;
    concessionPercent?: number;
    concessionReason?: string;
  }): Promise<StudentFeeAssignment> {
    const res = await api.post('/fees/assignments', payload);
    return res.data?.data;
  },

  async bulkAssignFeeStructure(payload: {
    classId: string;
    sectionId?: string;
    feeStructureId: string;
    academicSessionId: string;
  }): Promise<{ assignedCount: number; totalStudents: number }> {
    const res = await api.post('/fees/assignments/bulk', payload);
    return res.data?.data;
  },

  // ==========================================
  // INVOICES
  // ==========================================

  async getInvoices(params?: {
    studentId?: string;
    academicSessionId?: string;
    classId?: string;
    sectionId?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ invoices: FeeInvoice[]; total: number }> {
    const res = await api.get('/fees/invoices', { params });
    return {
      invoices: res.data?.data?.invoices || [],
      total: res.data?.data?.total || 0,
    };
  },

  async getInvoiceById(id: string): Promise<FeeInvoice> {
    const res = await api.get(`/fees/invoices/${id}`);
    return res.data?.data;
  },

  async generateInvoice(payload: {
    studentId: string;
    academicSessionId: string;
    title: string;
    dueDate: string;
    discountAmount?: number;
    lateFeeAmount?: number;
    remarks?: string;
    items: { feeHeadId: string; description?: string; amount: number }[];
  }): Promise<FeeInvoice> {
    const res = await api.post('/fees/invoices', payload);
    return res.data?.data;
  },

  async bulkGenerateInvoices(payload: {
    classId: string;
    sectionId?: string;
    academicSessionId: string;
    feeStructureId: string;
    title: string;
    dueDate: string;
  }): Promise<{ generatedCount: number; totalEligible: number }> {
    const res = await api.post('/fees/invoices/bulk', payload);
    return res.data?.data;
  },

  // ==========================================
  // PAYMENTS & COLLECTIONS
  // ==========================================

  async getPayments(params?: {
    studentId?: string;
    invoiceId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ payments: FeePayment[]; total: number }> {
    const res = await api.get('/fees/payments', { params });
    return {
      payments: res.data?.data?.payments || [],
      total: res.data?.data?.total || 0,
    };
  },

  async getPaymentById(id: string): Promise<FeePayment> {
    const res = await api.get(`/fees/payments/${id}`);
    return res.data?.data;
  },

  async collectPayment(payload: {
    invoiceId: string;
    amount: number;
    paymentMode: string;
    paymentDate?: string;
    referenceNumber?: string;
    remarks?: string;
  }): Promise<{ payment: FeePayment; invoice: FeeInvoice }> {
    const res = await api.post('/fees/payments/collect', payload);
    return res.data?.data;
  },

  // ==========================================
  // STUDENT FEE LEDGER
  // ==========================================

  async getStudentLedger(studentId: string): Promise<StudentFeeLedger[]> {
    const res = await api.get(`/fees/students/${studentId}/ledger`);
    return res.data?.data || [];
  },

  // ==========================================
  // FINANCIAL SUMMARY & REPORTS
  // ==========================================

  async getFeeSummary(academicSessionId?: string): Promise<FeeSummaryReport> {
    const res = await api.get('/fees/reports/summary', { params: { academicSessionId } });
    return res.data?.data;
  },
};
