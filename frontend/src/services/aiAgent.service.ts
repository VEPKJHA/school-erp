import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PendingActionPreviewItem {
  studentId: string;
  studentName: string;
  className: string;
  parentContact: string;
  pendingAmount: number;
}

export interface AgentPendingActionData {
  actionId: string;
  actionType: string;
  pendingApproval: boolean;
  summary: string;
  expiresAt: string;
  studentCount: number;
  totalAmount: number;
  preview: PendingActionPreviewItem[];
}

export interface AgentChatResponseData {
  reply: string;
  pendingAction?: AgentPendingActionData;
}

export interface ApproveActionResult {
  success: boolean;
  actionId: string;
  status: string;
  queuedJobsCount: number;
  totalAmount: number;
  message: string;
}

export class AiAgentService {
  /**
   * Send natural language prompt to AI Fee Agent
   */
  static async sendChatMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<AgentChatResponseData> {
    const res = await api.post('/ai-agent/chat', {
      message,
      conversationHistory,
    });
    return res.data.data;
  }

  /**
   * Approve staged pending action (triggers BullMQ & notification queue)
   */
  static async approveAction(actionId: string): Promise<ApproveActionResult> {
    const res = await api.post(`/ai-agent/approve-action/${actionId}`);
    return res.data.data;
  }

  /**
   * Reject / Cancel staged pending action
   */
  static async rejectAction(actionId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post(`/ai-agent/reject-action/${actionId}`);
    return res.data.data;
  }
}
