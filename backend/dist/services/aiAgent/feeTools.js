"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareMonthlyInvoicesDeclaration = exports.prepareFeeRemindersDeclaration = exports.getPendingFeesDeclaration = void 0;
exports.executeGetPendingFees = executeGetPendingFees;
exports.executePrepareFeeReminders = executePrepareFeeReminders;
exports.executePrepareMonthlyInvoices = executePrepareMonthlyInvoices;
const prisma_1 = require("../../config/prisma");
const genai_1 = require("@google/genai");
/**
 * Tool 1: getPendingFees
 * Strict multi-tenant guardrail:
 * Searches fee invoices where balanceAmount > 0 and status in (UNPAID, PARTIALLY_PAID, OVERDUE)
 * scoped strictly to tenantId (never trusting LLM for tenantId).
 */
exports.getPendingFeesDeclaration = {
    name: 'getPendingFees',
    description: 'Retrieves a structured list of students with pending fee dues for a given month and year within the current school institution.',
    parameters: {
        type: genai_1.Type.OBJECT,
        properties: {
            month: {
                type: genai_1.Type.INTEGER,
                description: 'Calendar month number (1 = January, 12 = December). Defaults to current month if omitted.',
            },
            year: {
                type: genai_1.Type.INTEGER,
                description: '4-digit calendar year (e.g. 2026). Defaults to current year if omitted.',
            },
            classId: {
                type: genai_1.Type.STRING,
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
exports.prepareFeeRemindersDeclaration = {
    name: 'prepareFeeReminders',
    description: 'Prepares a draft fee reminder notification campaign for approval. This DOES NOT send reminders directly; it creates a pending action requiring School Admin confirmation.',
    parameters: {
        type: genai_1.Type.OBJECT,
        properties: {
            studentIds: {
                type: genai_1.Type.ARRAY,
                items: { type: genai_1.Type.STRING },
                description: 'List of student IDs to receive fee payment reminders.',
            },
            messageTemplate: {
                type: genai_1.Type.STRING,
                description: 'Customizable notification message template. Can include placeholders like {studentName}, {amount}, {dueDate}.',
            },
            summary: {
                type: genai_1.Type.STRING,
                description: 'Brief natural language summary of the proposed reminder action.',
            },
        },
        required: ['studentIds'],
    },
};
/**
 * Tool 3: prepareMonthlyInvoices
 * Inspects eligible active students in the tenant, determines who does NOT already have an invoice
 * for the given billing period / month-year, and creates an AgentPendingAction (GENERATE_INVOICES)
 * with status AWAITING_APPROVAL. DOES NOT create invoices directly without admin approval.
 */
exports.prepareMonthlyInvoicesDeclaration = {
    name: 'prepareMonthlyInvoices',
    description: 'Analyzes active enrolled students and prepares a bulk monthly fee invoice generation proposal with duplicate protection. DOES NOT generate invoices directly; requires School Admin approval.',
    parameters: {
        type: genai_1.Type.OBJECT,
        properties: {
            month: {
                type: genai_1.Type.INTEGER,
                description: 'Calendar month number (1 to 12) for the billing cycle. Defaults to current month.',
            },
            year: {
                type: genai_1.Type.INTEGER,
                description: '4-digit calendar year (e.g. 2026). Defaults to current year.',
            },
            classId: {
                type: genai_1.Type.STRING,
                description: 'Optional class ID or class name filter.',
            },
            studentId: {
                type: genai_1.Type.STRING,
                description: 'Optional student ID to generate invoice for a single specific student.',
            },
            title: {
                type: genai_1.Type.STRING,
                description: 'Optional custom invoice title/period description (e.g. "November 2026 Tuition Fee").',
            },
            dueDate: {
                type: genai_1.Type.STRING,
                description: 'Optional payment due date in YYYY-MM-DD format (defaults to 10th of following/current month).',
            },
        },
        required: [],
    },
};
/**
 * Tool Execution: getPendingFees
 */
async function executeGetPendingFees(tenantId, args) {
    const now = new Date();
    // Robust year parsing
    let targetYear = now.getFullYear();
    if (args.year) {
        const parsedYear = parseInt(String(args.year).trim(), 10);
        if (!isNaN(parsedYear) && parsedYear > 2000 && parsedYear < 2100) {
            targetYear = parsedYear;
        }
    }
    // Robust month parsing
    let targetMonth = now.getMonth() + 1;
    if (args.month !== undefined && args.month !== null) {
        const rawMonthStr = String(args.month).trim().toLowerCase();
        const parsedNum = parseInt(rawMonthStr, 10);
        if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 12) {
            targetMonth = parsedNum;
        }
        else {
            const monthNames = [
                'january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'
            ];
            const foundIdx = monthNames.findIndex((m) => rawMonthStr.includes(m) || m.startsWith(rawMonthStr));
            if (foundIdx !== -1) {
                targetMonth = foundIdx + 1;
            }
        }
    }
    // Build due date or issue date range if month/year are provided
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    // Invoices query with multi-tenant filtering
    const invoiceWhere = {
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
    const invoices = await prisma_1.prisma.feeInvoice.findMany({
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
    const studentMap = new Map();
    for (const inv of invoices) {
        const stu = inv.student;
        if (!stu)
            continue;
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
        }
        else {
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
async function executePrepareFeeReminders(tenantId, userId, args) {
    if (!args.studentIds || args.studentIds.length === 0) {
        throw new Error('At least one student ID is required to prepare reminders.');
    }
    // Fetch pending balances for these students strictly within tenantId
    const pendingData = await executeGetPendingFees(tenantId, {});
    const filteredStudents = pendingData.students.filter((s) => args.studentIds.includes(s.studentId));
    const totalAmount = filteredStudents.reduce((sum, s) => sum + s.pendingAmount, 0);
    const defaultTemplate = args.messageTemplate ||
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
    const pendingAction = await prisma_1.prisma.agentPendingAction.create({
        data: {
            tenantId,
            userId,
            actionType: 'SEND_FEE_REMINDER',
            status: 'AWAITING_APPROVAL',
            payload: actionPayload,
            expiresAt,
        },
    });
    const summary = args.summary ||
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
/**
 * Tool Execution: prepareMonthlyInvoices
 */
async function executePrepareMonthlyInvoices(tenantId, userId, args) {
    const now = new Date();
    // Robust parsing for year (handles "2026", 2026, or omitted)
    let targetYear = now.getFullYear();
    if (args.year) {
        const parsedYear = parseInt(String(args.year).trim(), 10);
        if (!isNaN(parsedYear) && parsedYear > 2000 && parsedYear < 2100) {
            targetYear = parsedYear;
        }
    }
    // Robust parsing for month (handles 11, "11", "this month", "current", "november", or omitted)
    let targetMonth = now.getMonth() + 1; // default to current month
    if (args.month !== undefined && args.month !== null) {
        const rawMonthStr = String(args.month).trim().toLowerCase();
        const parsedNum = parseInt(rawMonthStr, 10);
        if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 12) {
            targetMonth = parsedNum;
        }
        else {
            const monthNames = [
                'january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'
            ];
            const foundIdx = monthNames.findIndex((m) => rawMonthStr.includes(m) || m.startsWith(rawMonthStr));
            if (foundIdx !== -1) {
                targetMonth = foundIdx + 1;
            }
            // If "this month", "current", etc., it remains defaulted to now.getMonth() + 1
        }
    }
    const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleString('default', { month: 'long' });
    const billingPeriod = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const invoiceTitle = (args.title || `${monthName} ${targetYear} Tuition & School Fee`).trim();
    // Determine due date (defaults to 15th of target month)
    let calculatedDueDate = args.dueDate;
    if (!calculatedDueDate) {
        const dueDay = 15;
        const dueMonthStr = String(targetMonth).padStart(2, '0');
        calculatedDueDate = `${targetYear}-${dueMonthStr}-${String(dueDay).padStart(2, '0')}`;
    }
    // Find active academic session for this tenant (fallback to current or newest session if not marked ACTIVE)
    let activeSession = await prisma_1.prisma.academicSession.findFirst({
        where: { schoolId: tenantId, status: 'ACTIVE' },
    });
    if (!activeSession) {
        activeSession = await prisma_1.prisma.academicSession.findFirst({
            where: { schoolId: tenantId, isCurrent: true },
        });
    }
    if (!activeSession) {
        activeSession = await prisma_1.prisma.academicSession.findFirst({
            where: { schoolId: tenantId },
            orderBy: { startDate: 'desc' },
        });
    }
    const sessionId = activeSession?.id;
    if (!sessionId) {
        throw new Error('No active academic session found for this school institution. Please configure an academic session first.');
    }
    // Query eligible active students under this tenant
    const studentWhere = {
        schoolId: tenantId,
        status: { in: ['ACTIVE', 'ADMITTED'] },
    };
    if (args.studentId) {
        studentWhere.id = args.studentId;
    }
    if (args.classId) {
        // If passed name instead of uuid, check class
        const matchedClass = await prisma_1.prisma.class.findFirst({
            where: {
                schoolId: tenantId,
                OR: [{ id: args.classId }, { name: { contains: args.classId } }],
            },
        });
        if (matchedClass) {
            studentWhere.classId = matchedClass.id;
        }
        else {
            studentWhere.classId = args.classId;
        }
    }
    const eligibleStudents = await prisma_1.prisma.student.findMany({
        where: studentWhere,
        include: {
            class: true,
            section: true,
            parents: {
                include: { parent: true },
            },
            feeAssignments: {
                where: { isActive: true },
                include: {
                    feeStructure: {
                        include: {
                            items: { include: { feeHead: true } },
                        },
                    },
                },
            },
        },
        orderBy: [{ class: { name: 'asc' } }, { firstName: 'asc' }],
    });
    if (eligibleStudents.length === 0) {
        throw new Error('No active students found matching the specified criteria.');
    }
    // Query existing invoices for this period/title to PREVENT DUPLICATES
    const existingInvoices = await prisma_1.prisma.feeInvoice.findMany({
        where: {
            schoolId: tenantId,
            studentId: { in: eligibleStudents.map((s) => s.id) },
            academicSessionId: sessionId,
            status: { notIn: ['VOID', 'CANCELLED'] },
            OR: [{ billingPeriod }, { title: invoiceTitle }],
        },
        select: { studentId: true },
    });
    const alreadyBilledStudentIds = new Set(existingInvoices.map((inv) => inv.studentId));
    // Filter students who are NOT yet billed
    const studentsToBill = eligibleStudents.filter((stu) => !alreadyBilledStudentIds.has(stu.id));
    if (studentsToBill.length === 0) {
        throw new Error(`All ${eligibleStudents.length} student(s) matching criteria have ALREADY been invoiced for ${invoiceTitle} (${billingPeriod}). No duplicate invoices needed.`);
    }
    // Fetch class default fee structures for students without direct assignment
    const defaultStructures = await prisma_1.prisma.feeStructure.findMany({
        where: {
            schoolId: tenantId,
            academicSessionId: sessionId,
            isActive: true,
        },
        include: {
            items: { include: { feeHead: true } },
        },
    });
    const structureByClassId = new Map(defaultStructures.map((s) => [s.classId, s]));
    // Build invoice proposals per student
    const billingItemsPreview = [];
    for (const stu of studentsToBill) {
        const assignment = stu.feeAssignments?.[0];
        const structure = assignment?.feeStructure || structureByClassId.get(stu.classId);
        if (!structure || !structure.items || structure.items.length === 0) {
            continue;
        }
        const concession = assignment ? Number(assignment.concessionAmount || 0) : 0;
        const items = [];
        for (const it of structure.items) {
            const headName = (it.feeHead?.name || '').toLowerCase();
            const headCode = (it.feeHead?.code || '').toLowerCase();
            const isTransportHead = headName.includes('transport') ||
                headName.includes('bus') ||
                headName.includes('van') ||
                headCode.includes('transport') ||
                headCode.includes('bus');
            if (isTransportHead) {
                if (!stu.transportRequired)
                    continue;
                let transportAmount = Number(it.amount);
                const slab = (stu.transportSlab || '').trim().toLowerCase();
                const dist = stu.transportDistanceKm != null ? Number(stu.transportDistanceKm) : null;
                if (slab === '0-10' || slab === '0-10 km' || (dist !== null && dist > 0 && dist <= 10)) {
                    transportAmount = 1800;
                }
                else if (slab === '10-20' || slab === '10-20 km' || (dist !== null && dist > 10 && dist <= 20)) {
                    transportAmount = 2000;
                }
                else if (slab === '20+' || slab === '20+ km' || slab === '20-30' || (dist !== null && dist > 20)) {
                    transportAmount = 2200;
                }
                items.push({
                    feeHeadId: it.feeHeadId,
                    description: `${it.feeHead.name} (${stu.transportSlab || (dist ? `${dist} km` : 'Standard')})`,
                    amount: transportAmount,
                });
                continue;
            }
            items.push({
                feeHeadId: it.feeHeadId,
                description: it.feeHead.name,
                amount: Number(it.amount),
            });
        }
        if (items.length === 0)
            continue;
        const subtotal = items.reduce((acc, i) => acc + i.amount, 0);
        const invoiceTotal = Math.max(0, subtotal - concession);
        const primaryParent = stu.parents?.[0]?.parent;
        const parentContact = primaryParent?.phone || primaryParent?.email || 'N/A';
        billingItemsPreview.push({
            studentId: stu.id,
            studentName: `${stu.firstName} ${stu.lastName}`.trim(),
            className: `${stu.class?.name || ''} ${stu.section?.name || ''}`.trim(),
            parentContact,
            pendingAmount: invoiceTotal,
            items,
            discountAmount: concession,
        });
    }
    if (billingItemsPreview.length === 0) {
        throw new Error('Could not compute fee structures for the eligible students. Please configure fee structures first.');
    }
    const totalBillingAmount = billingItemsPreview.reduce((sum, s) => sum + s.pendingAmount, 0);
    const payload = {
        actionType: 'GENERATE_INVOICES',
        academicSessionId: sessionId,
        billingPeriod,
        title: invoiceTitle,
        dueDate: calculatedDueDate,
        studentCount: billingItemsPreview.length,
        alreadyBilledSkipped: alreadyBilledStudentIds.size,
        totalAmount: totalBillingAmount,
        students: billingItemsPreview,
    };
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const pendingAction = await prisma_1.prisma.agentPendingAction.create({
        data: {
            tenantId,
            userId,
            actionType: 'GENERATE_INVOICES',
            status: 'AWAITING_APPROVAL',
            payload,
            expiresAt,
        },
    });
    const summary = `Prepared draft invoice generation for **${billingItemsPreview.length} student(s)** for period **${invoiceTitle}** (Total: **₹${totalBillingAmount.toLocaleString('en-IN')}**). ${alreadyBilledStudentIds.size > 0 ? `(${alreadyBilledStudentIds.size} already invoiced students skipped). ` : ''}Awaiting School Admin approval to generate.`;
    return {
        success: true,
        actionId: pendingAction.id,
        actionType: 'GENERATE_INVOICES',
        pendingApproval: true,
        studentCount: billingItemsPreview.length,
        totalAmount: totalBillingAmount,
        billingPeriod,
        title: invoiceTitle,
        expiresAt: expiresAt.toISOString(),
        summary,
        preview: billingItemsPreview.map((s) => ({
            studentId: s.studentId,
            studentName: s.studentName,
            className: s.className,
            parentContact: s.parentContact,
            pendingAmount: s.pendingAmount,
        })),
    };
}
//# sourceMappingURL=feeTools.js.map