import { prisma } from '../../config/prisma';
import { Type, FunctionDeclaration } from '@google/genai';

/**
 * Tool 1: getPendingFees
 * Strict multi-tenant guardrail:
 * Searches fee invoices where balanceAmount > 0 and status in (UNPAID, PARTIALLY_PAID, OVERDUE)
 * scoped strictly to tenantId (never trusting LLM for tenantId).
 */
export const getPendingFeesDeclaration: FunctionDeclaration = {
  name: 'getPendingFees',
  description:
    'Retrieves a structured list of students with pending fee dues for a given month and year within the current school institution.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      month: {
        type: Type.INTEGER,
        description: 'Calendar month number (1 = January, 12 = December). Defaults to current month if omitted.',
      },
      year: {
        type: Type.INTEGER,
        description: '4-digit calendar year (e.g. 2026). Defaults to current year if omitted.',
      },
      classId: {
        type: Type.STRING,
        description: 'Optional Class ID or name to filter pending students by class.',
      },
    },
    required: [],
  },
};

/**
 * Tool 2: prepareFeeReminders
 * Creates an AgentPendingAction in the database with status AWAITING_APPROVAL and 15-minute expiration.
 * DOES NOT send reminders directly. Returns proposal payload for Human-in-the-Loop approval.
 */
export const prepareFeeRemindersDeclaration: FunctionDeclaration = {
  name: 'prepareFeeReminders',
  description:
    'Prepares a draft fee reminder notification campaign for approval. This DOES NOT send reminders directly; it creates a pending action requiring School Admin confirmation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      studentIds: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'List of student IDs to receive fee payment reminders.',
      },
      messageTemplate: {
        type: Type.STRING,
        description:
          'Customizable notification message template. Can include placeholders like {studentName}, {amount}, {dueDate}.',
      },
      summary: {
        type: Type.STRING,
        description: 'Brief natural language summary of the proposed reminder action.',
      },
    },
    required: ['studentIds'],
  },
};

export interface StudentPendingFeeItem {
  studentId: string;
  studentName: string;
  studentCode: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  parentName: string;
  parentContact: string;
  parentEmail?: string;
  pendingAmount: number;
  totalBilled: number;
  totalPaid: number;
  invoiceCount: number;
  invoices: Array<{
    invoiceId: string;
    invoiceNumber: string;
    title: string;
    dueDate: string;
    balanceAmount: number;
    status: string;
  }>;
}

/**
 * Tool Execution: getPendingFees
 */
export async function executeGetPendingFees(
  tenantId: string,
  args: { month?: number; year?: number; classId?: string }
): Promise<{
  success: boolean;
  totalPendingStudents: number;
  totalPendingAmount: number;
  filterCriteria: { month?: number; year?: number; classId?: string };
  students: StudentPendingFeeItem[];
}> {
  const now = new Date();
  const targetYear = args.year || now.getFullYear();
  const targetMonth = args.month || now.getMonth() + 1;

  // Build due date or issue date range if month/year are provided
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  // Invoices query with multi-tenant filtering
  const invoiceWhere: any = {
    schoolId: tenantId,
    balanceAmount: { gt: 0 },
    status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
    dueDate: { lte: endDate },
  };

  if (args.classId) {
    invoiceWhere.student = {
      classId: args.classId,
    };
  }

  const invoices = await prisma.feeInvoice.findMany({
    where: invoiceWhere,
    include: {
      student: {
        include: {
          class: true,
          section: true,
          parents: {
            where: { isPrimaryContact: true },
            include: { parent: true },
          },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Group by student
  const studentMap = new Map<string, StudentPendingFeeItem>();

  for (const inv of invoices) {
    const stu = (inv as any).student;
    if (!stu) continue;

    const primaryParent = stu.parents?.[0]?.parent;
    const parentContact = primaryParent?.phone || stu.mobile || 'N/A';
    const parentName = primaryParent ? `${primaryParent.firstName} ${primaryParent.lastName}` : 'Parent / Guardian';

    const existing = studentMap.get(stu.id);
    const balance = Number(inv.balanceAmount);

    if (existing) {
      existing.pendingAmount += balance;
      existing.totalBilled += Number(inv.totalAmount);
      existing.totalPaid += Number(inv.paidAmount);
      existing.invoiceCount += 1;
      existing.invoices.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        title: inv.title,
        dueDate: inv.dueDate.toISOString().split('T')[0],
        balanceAmount: balance,
        status: inv.status,
      });
    } else {
      studentMap.set(stu.id, {
        studentId: stu.id,
        studentName: `${stu.firstName} ${stu.lastName}`.trim(),
        studentCode: stu.studentCode,
        admissionNumber: stu.admissionNumber,
        className: stu.class?.name || 'Class',
        sectionName: stu.section?.name || '',
        parentName,
        parentContact,
        parentEmail: primaryParent?.email || stu.email || undefined,
        pendingAmount: balance,
        totalBilled: Number(inv.totalAmount),
        totalPaid: Number(inv.paidAmount),
        invoiceCount: 1,
        invoices: [
          {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            title: inv.title,
            dueDate: inv.dueDate.toISOString().split('T')[0],
            balanceAmount: balance,
            status: inv.status,
          },
        ],
      });
    }
  }

  const studentsList = Array.from(studentMap.values());
  const totalAmount = studentsList.reduce((sum, s) => sum + s.pendingAmount, 0);

  return {
    success: true,
    totalPendingStudents: studentsList.length,
    totalPendingAmount: totalAmount,
    filterCriteria: { month: targetMonth, year: targetYear, classId: args.classId },
    students: studentsList,
  };
}

/**
 * Tool Execution: prepareFeeReminders
 */
export async function executePrepareFeeReminders(
  tenantId: string,
  userId: string,
  args: { studentIds: string[]; messageTemplate?: string; summary?: string }
): Promise<{
  success: boolean;
  actionId: string;
  actionType: string;
  pendingApproval: boolean;
  studentCount: number;
  expiresAt: string;
  summary: string;
  preview: Array<{
    studentId: string;
    studentName: string;
    className: string;
    parentContact: string;
    pendingAmount: number;
  }>;
}> {
  if (!args.studentIds || args.studentIds.length === 0) {
    throw new Error('At least one student ID is required to prepare reminders.');
  }

  // Fetch pending balances for these students strictly within tenantId
  const pendingData = await executeGetPendingFees(tenantId, {});
  const filteredStudents = pendingData.students.filter((s) => args.studentIds.includes(s.studentId));

  const totalAmount = filteredStudents.reduce((sum, s) => sum + s.pendingAmount, 0);
  const defaultTemplate =
    args.messageTemplate ||
    'Dear Parent, this is a reminder from School Administration regarding pending fee balance of ₹{amount} for {studentName}. Please clear dues at the earliest.';

  const actionPayload = {
    studentIds: filteredStudents.map((s) => s.studentId),
    studentCount: filteredStudents.length,
    totalAmount,
    messageTemplate: defaultTemplate,
    students: filteredStudents.map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      className: s.className,
      sectionName: s.sectionName,
      parentName: s.parentName,
      parentContact: s.parentContact,
      parentEmail: s.parentEmail,
      pendingAmount: s.pendingAmount,
      invoiceNumber: s.invoices[0]?.invoiceNumber,
      dueDate: s.invoices[0]?.dueDate,
    })),
  };

  // 15 minutes expiration
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const pendingAction = await prisma.agentPendingAction.create({
    data: {
      tenantId,
      userId,
      actionType: 'SEND_FEE_REMINDER',
      status: 'AWAITING_APPROVAL',
      payload: actionPayload,
      expiresAt,
    },
  });

  const summary =
    args.summary ||
    `Ready to send fee reminders to ${filteredStudents.length} student(s) with total outstanding dues of ₹${totalAmount.toLocaleString('en-IN')}. Awaiting your confirmation.`;

  return {
    success: true,
    actionId: pendingAction.id,
    actionType: 'SEND_FEE_REMINDER',
    pendingApproval: true,
    studentCount: filteredStudents.length,
    expiresAt: expiresAt.toISOString(),
    summary,
    preview: filteredStudents.map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      className: `${s.className} ${s.sectionName}`.trim(),
      parentContact: s.parentContact,
      pendingAmount: s.pendingAmount,
    })),
  };
}
