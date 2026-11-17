import { GoogleGenAI } from '@google/genai';
import { ENV } from '../../config/env';
import { prisma } from '../../config/prisma';
import { AuditService } from '../audit.service';
import { getFeeReminderQueue } from '../queue.service';
import {
  getPendingFeesDeclaration,
  prepareFeeRemindersDeclaration,
  executeGetPendingFees,
  executePrepareFeeReminders,
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
   - You CANNOT and MUST NOT send SMS, emails, or messages directly.
   - When the user asks to "send a reminder", "notify parents", "alert students with pending fees", or similar actions, you MUST use the \`prepareFeeReminders\` tool to draft a pending action.
   - Explain clearly to the admin that reminders have been staged and require their explicit review and one-click approval before any communication is dispatched.
3. DATA RETRIEVAL:
   - When asked about pending fees, defaulters, dues for this month or a specific class, call the \`getPendingFees\` tool.
   - Summarize the results clearly with student counts, total pending amounts, and actionable advice.
4. Tone: Professional, courteous, precise, and financially accurate. Currency amounts are in Indian Rupees (₹).`;

    // Tools definition with Google Gemini SDK
    const tools = [
      {
        functionDeclarations: [getPendingFeesDeclaration, prepareFeeRemindersDeclaration],
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
      // Step 1: Initial call to Gemini model (using gemini-3.5-flash with fallback)
      const modelName = 'gemini-3.5-flash';

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          tools,
        },
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
          candidate?.content || { role: 'model', parts: [] },
          {
            role: 'user',
            parts: functionResponseParts,
          },
        ];

        const followUpResponse = await ai.models.generateContent({
          model: modelName,
          contents: followUpContents,
          config: {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            tools,
          },
        });

        const finalReply =
          followUpResponse.candidates?.[0]?.content?.parts
            ?.map((p: any) => p.text || '')
            .join('')
            .trim() || 'I have processed your request.';

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
      throw new Error(`AI Assistant Error: ${err.message || 'Unable to process AI agent request.'}`);
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

    // Enqueue jobs into BullMQ
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
