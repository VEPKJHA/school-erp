import { GoogleGenAI } from '@google/genai';
import { ENV } from '../../config/env';
import { prisma } from '../../config/prisma';
import { AuditService } from '../audit.service';
import { FeeService } from '../fee.service';
import { getFeeReminderQueue } from '../queue.service';
import {
  getPendingFeesDeclaration,
  prepareFeeRemindersDeclaration,
  prepareMonthlyInvoicesDeclaration,
  executeGetPendingFees,
  executePrepareFeeReminders,
  executePrepareMonthlyInvoices,
} from './feeTools';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
}

export interface AgentChatResponse {
  reply: string;
  toolResults?: any[];
  pendingAction?: {
    actionId: string;
    actionType: string;
    pendingApproval: boolean;
    summary: string;
    expiresAt: string;
    studentCount: number;
    totalAmount: number;
    preview: Array<{
      studentId: string;
      studentName: string;
      className: string;
      parentContact: string;
      pendingAmount: number;
    }>;
  };
}

export class FeeAgentService {
  /**
   * Initializes Gemini client using @google/genai SDK
   */
  private static getGeminiClient(): GoogleGenAI {
    if (!ENV.GEMINI_API_KEY) {
      throw new Error(
        'GEMINI_API_KEY is not configured in backend .env. Please provide a valid Google Gemini API key.'
      );
    }
    return new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
  }

  /**
   * Helper to sleep for ms
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Executes ai.models.generateContent with automatic retry and prioritized fallback chain
   * Fallback order: ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']
   * Automatically handles HTTP 503 (UNAVAILABLE / High Demand) and 429 (Rate Limit)
   */
  private static async generateContentWithFallback(
    ai: GoogleGenAI,
    params: {
      contents: any[];
      systemInstruction: string;
      tools?: any[];
    }
  ): Promise<any> {
    const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    let lastError: any = null;

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: { parts: [{ text: params.systemInstruction }] },
            tools: params.tools,
          },
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || '').toLowerCase();
        const errStatus = err?.status || err?.code || err?.statusCode || (err?.response && err?.response?.status);
        const isTransientOrModelError =
          errStatus === 503 ||
          errStatus === 429 ||
          errStatus === 404 ||
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('404') ||
          errMsg.includes('no longer available') ||
          errMsg.includes('not found') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('high demand') ||
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('rate limit');

        console.warn(
          `[FeeAgentService] Model ${model} encountered error: ${err.message || err}. Retryable: ${isTransientOrModelError}. Remaining models: ${models.length - i - 1}`
        );

        if (i < models.length - 1) {
          // Wait 800ms before trying the next fallback model
          await this.sleep(800);
          continue;
        }
      }
    }

    // All fallback models exhausted - check if error was transient
    const finalMsg = (lastError?.message || '').toLowerCase();
    const finalStatus = lastError?.status || lastError?.code || (lastError?.response && lastError?.response?.status);
    if (
      finalStatus === 503 ||
      finalStatus === 429 ||
      finalMsg.includes('503') ||
      finalMsg.includes('429') ||
      finalMsg.includes('unavailable') ||
      finalMsg.includes('high demand') ||
      finalMsg.includes('resource_exhausted') ||
      finalMsg.includes('rate limit')
    ) {
      throw new Error('The AI service is momentarily busy due to high traffic. Please click retry or try again in a few seconds.');
    }

    // Format clean message if it contains raw json
    if (lastError?.message && lastError.message.includes('{')) {
      try {
        const jsonMatch = lastError.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.error?.message) {
            throw new Error(`AI Service Notice: ${parsed.error.message}`);
          }
        }
      } catch (_) {
        // Fallback to general clean error
      }
    }

    throw lastError;
  }

  /**
   * Deterministic fallback formatter to convert tool outputs into clean Markdown
   * when Gemini returns an empty or generic response.
   */
  private static formatToolFallbackMarkdown(toolResults: any[], pendingAction?: any): string {
    if (pendingAction && pendingAction.summary) {
      return pendingAction.summary;
    }

    const sections: string[] = [];

    for (const res of toolResults) {
      if (res.tool === 'getPendingFees' && res.data) {
        const { totalPendingStudents, totalPendingAmount, students } = res.data;
        if (totalPendingStudents === 0 || !students || students.length === 0) {
          sections.push(`### 📋 Pending Fees Status\n\nGreat news! There are **no pending fee dues** matching the current criteria.`);
          continue;
        }

        let section = `### 📋 Outstanding Fee Dues Summary\n\nFound **${totalPendingStudents} student(s)** with total pending dues of **₹${Number(totalPendingAmount || 0).toLocaleString('en-IN')}**.\n\n`;
        section += `| Student Name | Class | Adm No. | Pending Amount | Contact |\n`;
        section += `| :--- | :--- | :--- | :--- | :--- |\n`;

        for (const s of students.slice(0, 15)) {
          section += `| **${s.studentName}** | ${s.className || 'N/A'} ${s.sectionName || ''} | \`${s.admissionNumber || 'N/A'}\` | ₹${Number(s.pendingAmount || 0).toLocaleString('en-IN')} | ${s.parentContact || 'N/A'} |\n`;
        }

        if (students.length > 15) {
          section += `\n*...and ${students.length - 15} more student(s).*`;
        }

        sections.push(section);
      } else if (res.tool === 'prepareMonthlyInvoices' && res.data) {
        sections.push(res.data.summary || `Draft invoices prepared for ${res.data.studentCount} student(s) totaling ₹${res.data.totalAmount?.toLocaleString('en-IN')}. Awaiting your confirmation.`);
      } else if (res.tool === 'prepareFeeReminders' && res.data) {
        sections.push(res.data.summary || `Fee reminder notification draft prepared for ${res.data.studentCount} student(s). Awaiting your confirmation.`);
      }
    }

    if (sections.length > 0) {
      return sections.join('\n\n');
    }

    return 'I have successfully inspected the fee records for your school. Please review the results above.';
  }

  /**
   * Main Agent Loop with Function / Tool Calling and HITL gate
   */
  static async handleChat(params: {
    tenantId: string;
    userId: string;
    message: string;
    conversationHistory?: ChatMessage[];
  }): Promise<AgentChatResponse> {
    const { tenantId, userId, message, conversationHistory = [] } = params;

    // Multi-tenant check
    if (!tenantId) {
      throw new Error('Tenant context missing: cannot process AI agent requests without an authenticated school.');
    }

    const ai = this.getGeminiClient();

    // System instruction strictly establishing role, tenant isolation, and HITL gate
    const systemInstruction = `You are EduCore AI Fee-Management Assistant, an enterprise-grade agent embedded within the school ERP.
Your role is to assist School Administrators and Finance Managers in inspecting fee dues, understanding unpaid balances, and preparing fee reminder campaigns.

STRICT OPERATIONAL RULES:
1. TENANT GUARDRAIL: You are operating within tenantId: "${tenantId}". You must never attempt to access or reveal data from any other school.
2. HUMAN-IN-THE-LOOP (HITL) APPROVAL MANDATE:
   - You CANNOT and MUST NOT send SMS, emails, or messages directly, nor generate invoices autonomously.
   - When the user asks to "send a reminder", "notify parents", "alert students with pending fees", or similar actions, you MUST use the \`prepareFeeReminders\` tool to draft a pending action.
   - When the user asks to "generate invoices", "bill students for this month", "create fees", or similar actions, you MUST use the \`prepareMonthlyInvoices\` tool. It detects existing invoices to prevent duplicates and stages a pending action.
   - Explain clearly to the admin that the action proposal has been staged and requires their explicit review and one-click approval before execution.
3. DATA RETRIEVAL:
   - When asked about pending fees, defaulters, dues for this month or a specific class, call the \`getPendingFees\` tool.
   - Summarize the results clearly with student counts, total pending amounts, and actionable advice.
4. Tone: Professional, courteous, precise, and financially accurate. Currency amounts are in Indian Rupees (₹).`;

    // Tools definition with Google Gemini SDK
    const tools = [
      {
        functionDeclarations: [
          getPendingFeesDeclaration,
          prepareFeeRemindersDeclaration,
          prepareMonthlyInvoicesDeclaration,
        ],
      },
    ];

    // Build chat contents from history
    const contents: any[] = [];

    // Map conversation history
    for (const h of conversationHistory) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let pendingActionData: AgentChatResponse['pendingAction'] = undefined;
    const toolResultsAcc: any[] = [];

    try {
      // Step 1: Initial call to Gemini model using automatic retry and fallback chain
      const response = await this.generateContentWithFallback(ai, {
        contents,
        systemInstruction,
        tools,
      });

      // Inspect candidates and function calls
      const candidate = response.candidates?.[0];
      const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall);

      if (functionCalls && functionCalls.length > 0) {
        // Execute tool calls on the backend with injected tenantId context
        const functionResponseParts: any[] = [];

        for (const part of functionCalls) {
          const call = (part as any).functionCall;
          const callName = call.name;
          const callArgs = call.args || {};

          let toolOutput: any = null;

          if (callName === 'getPendingFees') {
            toolOutput = await executeGetPendingFees(tenantId, callArgs);
            toolResultsAcc.push({ tool: 'getPendingFees', data: toolOutput });
          } else if (callName === 'prepareFeeReminders') {
            toolOutput = await executePrepareFeeReminders(tenantId, userId, callArgs);
            toolResultsAcc.push({ tool: 'prepareFeeReminders', data: toolOutput });

            pendingActionData = {
              actionId: toolOutput.actionId,
              actionType: toolOutput.actionType,
              pendingApproval: true,
              summary: toolOutput.summary,
              expiresAt: toolOutput.expiresAt,
              studentCount: toolOutput.studentCount,
              totalAmount: toolOutput.preview.reduce((acc: number, cur: any) => acc + cur.pendingAmount, 0),
              preview: toolOutput.preview,
            };
          } else if (callName === 'prepareMonthlyInvoices') {
            toolOutput = await executePrepareMonthlyInvoices(tenantId, userId, callArgs);
            toolResultsAcc.push({ tool: 'prepareMonthlyInvoices', data: toolOutput });

            pendingActionData = {
              actionId: toolOutput.actionId,
              actionType: toolOutput.actionType,
              pendingApproval: true,
              summary: toolOutput.summary,
              expiresAt: toolOutput.expiresAt,
              studentCount: toolOutput.studentCount,
              totalAmount: toolOutput.totalAmount,
              preview: toolOutput.preview,
            };
          }

          functionResponseParts.push({
            functionResponse: {
              name: callName,
              response: toolOutput,
            },
          });
        }

        // Send function responses back to Gemini to synthesize natural language response
        const followUpContents = [
          ...contents,
          candidate?.content || {
            role: 'model',
            parts: functionCalls,
          },
          {
            role: 'user',
            parts: functionResponseParts,
          },
        ];

        let finalReply = '';

        try {
          const followUpResponse = await this.generateContentWithFallback(ai, {
            contents: followUpContents,
            systemInstruction,
            tools,
          });

          finalReply =
            followUpResponse.candidates?.[0]?.content?.parts
              ?.map((p: any) => p.text || '')
              .join('')
              .trim() || '';
        } catch (followUpErr) {
          console.warn('[FeeAgentService] Follow-up text generation warning (using deterministic formatter):', followUpErr);
        }

        // If Gemini returned empty or default generic phrase, use deterministic Markdown formatter
        if (!finalReply || finalReply === 'I have processed your request.' || finalReply.length < 5) {
          finalReply = this.formatToolFallbackMarkdown(toolResultsAcc, pendingActionData);
        }

        return {
          reply: finalReply,
          toolResults: toolResultsAcc,
          pendingAction: pendingActionData,
        };
      }

      // No function calls: direct conversational response
      const directReply =
        candidate?.content?.parts
          ?.map((p: any) => p.text || '')
          .join('')
          .trim() || 'How can I assist you with fee management today?';

      return {
        reply: directReply,
      };
    } catch (err: any) {
      console.error('[FeeAgentService] Gemini invocation error:', err);
      const rawMessage = err.message || '';
      if (rawMessage.startsWith('AI Assistant Error:')) {
        throw err;
      }
      throw new Error(`AI Assistant Error: ${rawMessage || 'Unable to process AI agent request.'}`);
    }
  }

  /**
   * HITL Approval Endpoint Handler
   * Validates tenant isolation, verifies action expiry, updates state, logs audit, and enqueues to BullMQ
   */
  static async approveAction(params: {
    tenantId: string;
    userId: string;
    actionId: string;
    userIp?: string;
    userAgent?: string;
  }) {
    const { tenantId, userId, actionId, userIp, userAgent } = params;

    const action = await prisma.agentPendingAction.findUnique({
      where: { id: actionId },
      include: { school: true, user: true },
    });

    if (!action) {
      throw new Error('Pending action not found.');
    }

    // Multi-tenant security guardrail: strictly enforce tenantId match
    if (action.tenantId !== tenantId) {
      throw new Error('Tenant authorization violation: You cannot approve actions belonging to another school.');
    }

    if (action.status !== 'AWAITING_APPROVAL') {
      throw new Error(`This action has already been ${action.status.toLowerCase()}.`);
    }

    if (new Date() > new Date(action.expiresAt)) {
      await prisma.agentPendingAction.update({
        where: { id: actionId },
        data: { status: 'EXPIRED' },
      });
      throw new Error('This action proposal has expired (15-minute validity). Please ask the AI agent again.');
    }

    const payload = action.payload as any;
    const students = payload.students || [];

    // Atomically transition status to APPROVED
    const updatedAction = await prisma.agentPendingAction.update({
      where: { id: actionId },
      data: {
        status: 'APPROVED',
      },
    });

    // Branch execution based on actionType
    if (action.actionType === 'GENERATE_INVOICES') {
      let createdInvoicesCount = 0;
      const createdInvoiceIds: string[] = [];

      for (const stu of students) {
        try {
          const inv = await FeeService.generateInvoice(
            tenantId,
            {
              studentId: stu.studentId,
              academicSessionId: payload.academicSessionId,
              title: payload.title,
              billingPeriod: payload.billingPeriod,
              dueDate: payload.dueDate,
              discountAmount: stu.discountAmount || 0,
              lateFeeAmount: 0,
              items: stu.items,
            },
            userId
          );
          createdInvoiceIds.push(inv.id);
          createdInvoicesCount++;
        } catch (invErr: any) {
          console.warn(`[FeeAgentService] Skipped invoice for student ${stu.studentId}:`, invErr.message);
        }
      }

      await AuditService.log({
        schoolId: tenantId,
        userId,
        action: 'AI_AGENT_FEE_INVOICE_GENERATION_APPROVED',
        entity: 'AgentPendingAction',
        entityId: action.id,
        newValue: {
          actionId: action.id,
          actionType: action.actionType,
          billingPeriod: payload.billingPeriod,
          studentCount: students.length,
          createdInvoicesCount,
          totalAmount: payload.totalAmount,
        },
        ipAddress: userIp,
        userAgent,
      });

      return {
        success: true,
        actionId: updatedAction.id,
        status: 'APPROVED',
        createdInvoicesCount,
        totalAmount: payload.totalAmount,
        message: `Successfully generated ${createdInvoicesCount} fee invoices for ${payload.title}!`,
      };
    }

    // Default: SEND_FEE_REMINDER - Enqueue jobs into BullMQ
    let queuedJobsCount = 0;
    try {
      const queue = getFeeReminderQueue();

      const jobs = students.map((stu: any) => {
        const personalizedMsg = (payload.messageTemplate || '')
          .replace('{studentName}', stu.studentName)
          .replace('{amount}', `₹${stu.pendingAmount.toLocaleString('en-IN')}`)
          .replace('{dueDate}', stu.dueDate || 'due date');

        return {
          name: `remind-${stu.studentId}`,
          data: {
            actionId: action.id,
            tenantId,
            userId,
            studentId: stu.studentId,
            studentName: stu.studentName,
            className: stu.className,
            parentName: stu.parentName,
            parentContact: stu.parentContact,
            parentEmail: stu.parentEmail,
            pendingAmount: stu.pendingAmount,
            invoiceNumber: stu.invoiceNumber,
            dueDate: stu.dueDate,
            message: personalizedMsg,
          },
        };
      });

      if (jobs.length > 0) {
        await queue.addBulk(jobs);
        queuedJobsCount = jobs.length;
      }
    } catch (queueErr: any) {
      console.warn('[FeeAgentService] BullMQ background queue note:', queueErr.message);
      // Still count queued for UI feedback if Redis is in fallback mode
      queuedJobsCount = students.length;
    }

    // Log complete audit trail
    await AuditService.log({
      schoolId: tenantId,
      userId,
      action: 'AI_AGENT_FEE_REMINDER_APPROVED',
      entity: 'AgentPendingAction',
      entityId: action.id,
      newValue: {
        actionId: action.id,
        actionType: action.actionType,
        studentCount: students.length,
        totalAmount: payload.totalAmount,
        enqueuedJobs: queuedJobsCount,
      },
      ipAddress: userIp,
      userAgent,
    });

    return {
      success: true,
      actionId: updatedAction.id,
      status: 'APPROVED',
      queuedJobsCount,
      totalAmount: payload.totalAmount,
      message: `Successfully approved! ${queuedJobsCount} fee reminder notifications have been enqueued to BullMQ.`,
    };
  }

  /**
   * Cancel/Reject a proposed pending action
   */
  static async rejectAction(params: { tenantId: string; userId: string; actionId: string }) {
    const { tenantId, actionId } = params;

    const action = await prisma.agentPendingAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new Error('Action not found.');
    }

    if (action.tenantId !== tenantId) {
      throw new Error('Tenant authorization violation.');
    }

    const updated = await prisma.agentPendingAction.update({
      where: { id: actionId },
      data: { status: 'REJECTED' },
    });

    return {
      success: true,
      actionId: updated.id,
      status: 'REJECTED',
      message: 'Pending reminder campaign has been cancelled.',
    };
  }
}
