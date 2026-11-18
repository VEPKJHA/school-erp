import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ResponseUtil } from '../utils/apiResponse';
import { FeeAgentService } from '../services/aiAgent/feeAgent.service';

export class AiAgentController {
  /**
   * POST /api/ai-agent/chat
   * Handles natural language prompt with Gemini Function Calling
   */
  static async chat(req: AuthenticatedRequest, res: Response) {
    try {
      const { message, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        return ResponseUtil.badRequest(res, 'Message text is required.');
      }

      const tenantId = req.schoolId || req.user?.schoolId;
      if (!tenantId) {
        return ResponseUtil.forbidden(res, 'No active school tenant context found. Please select or log into a school.');
      }

      const userId = req.user!.userId;

      const result = await FeeAgentService.handleChat({
        tenantId,
        userId,
        message,
        conversationHistory,
      });

      return ResponseUtil.success(res, result, 'Agent response generated successfully');
    } catch (error: any) {
      console.error('[AiAgentController.chat] error:', error);
      let userFriendlyMessage = error.message || 'Failed to process AI agent request';

      // Clean raw JSON error payloads (e.g. {"error":{"code":503...}})
      const lower = userFriendlyMessage.toLowerCase();
      if (
        lower.includes('503') ||
        lower.includes('429') ||
        lower.includes('unavailable') ||
        lower.includes('high demand') ||
        lower.includes('resource_exhausted') ||
        lower.includes('rate limit') ||
        userFriendlyMessage.trim().startsWith('{')
      ) {
        userFriendlyMessage =
          'The AI service is momentarily busy due to high traffic. Please click retry or try again in a few seconds.';
      }

      return ResponseUtil.serverError(res, userFriendlyMessage);
    }
  }

  /**
   * POST /api/ai-agent/approve-action/:actionId
   * Validates permissions, enforces tenant boundary, logs audit trail, and triggers BullMQ
   */
  static async approveAction(req: AuthenticatedRequest, res: Response) {
    try {
      const { actionId } = req.params;
      const tenantId = req.schoolId || req.user?.schoolId;

      if (!tenantId) {
        return ResponseUtil.forbidden(res, 'Tenant context missing.');
      }

      const result = await FeeAgentService.approveAction({
        tenantId,
        userId: req.user!.userId,
        actionId,
        userIp: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ResponseUtil.success(res, result, result.message);
    } catch (error: any) {
      console.error('[AiAgentController.approveAction] error:', error);
      return ResponseUtil.badRequest(res, error.message || 'Failed to approve action');
    }
  }

  /**
   * POST /api/ai-agent/reject-action/:actionId
   * Allows admin to cancel a proposed staged reminder action
   */
  static async rejectAction(req: AuthenticatedRequest, res: Response) {
    try {
      const { actionId } = req.params;
      const tenantId = req.schoolId || req.user?.schoolId;

      if (!tenantId) {
        return ResponseUtil.forbidden(res, 'Tenant context missing.');
      }

      const result = await FeeAgentService.rejectAction({
        tenantId,
        userId: req.user!.userId,
        actionId,
      });

      return ResponseUtil.success(res, result, result.message);
    } catch (error: any) {
      console.error('[AiAgentController.rejectAction] error:', error);
      return ResponseUtil.badRequest(res, error.message || 'Failed to cancel action');
    }
  }
}
