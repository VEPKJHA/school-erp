import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Bot,
  User,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  AiAgentService,
  ChatMessage,
  AgentPendingActionData,
} from '../../services/aiAgent.service';

interface FeeAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  pendingAction?: AgentPendingActionData;
  approved?: boolean;
  rejected?: boolean;
}

const QUICK_PROMPTS = [
  'Which students have pending fees for this month, and send them a reminder?',
  'Show all students with overdue fees',
  'Prepare fee reminder notifications for pending fee defaulters',
  'What is our total outstanding fee balance this month?',
];

export const FeeAssistantDrawer: React.FC<FeeAssistantDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Hello! I am EduCore AI Fee-Management Assistant. I can help you analyze outstanding fee dues, inspect defaulters, and draft reminder notification campaigns with human-in-the-loop approval. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [approvingActionId, setApprovingActionId] = useState<string | null>(null);
  const [rejectingActionId, setRejectingActionId] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Auto-dismiss toast
  useEffect(() => {
    if (notificationToast) {
      const timer = setTimeout(() => {
        setNotificationToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationToast]);

  const handleSendPrompt = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || isSending) return;

    setInputPrompt('');

    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      // Build conversation history format
      const history: ChatMessage[] = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await AiAgentService.sendChatMessage(text, history);

      const assistantMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pendingAction: res.pendingAction,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: DisplayMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${err.response?.data?.message || err.message || 'Unable to connect to AI Agent.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleApproveAction = async (msgId: string, actionId: string) => {
    setApprovingActionId(actionId);
    try {
      const res = await AiAgentService.approveAction(actionId);

      setNotificationToast({
        type: 'success',
        message: res.message || `Successfully queued ${res.queuedJobsCount} reminder jobs to BullMQ!`,
      });

      // Update message status in chat view
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, approved: true, rejected: false } : m
        )
      );
    } catch (err: any) {
      setNotificationToast({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Approval failed.',
      });
    } finally {
      setApprovingActionId(null);
    }
  };

  const handleRejectAction = async (msgId: string, actionId: string) => {
    setRejectingActionId(actionId);
    try {
      const res = await AiAgentService.rejectAction(actionId);

      setNotificationToast({
        type: 'success',
        message: res.message || 'Action proposal has been cancelled.',
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, rejected: true, approved: false } : m
        )
      );
    } catch (err: any) {
      setNotificationToast({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to cancel action.',
      });
    } finally {
      setRejectingActionId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-slate-50 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base">
                  EduCore AI Fee Assistant
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Agentic • HITL
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Powered by Google Gemini 2.5 • Guardrailed Multi-Tenant Execution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Notification Toast */}
        {notificationToast && (
          <div className="mx-6 mt-3 p-3 rounded-xl border flex items-center justify-between shadow-md transition-all animate-fadeIn text-xs font-medium bg-white">
            <div className="flex items-center space-x-2">
              {notificationToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span
                className={
                  notificationToast.type === 'success'
                    ? 'text-emerald-900'
                    : 'text-rose-900'
                }
              >
                {notificationToast.message}
              </span>
            </div>
            <button
              onClick={() => setNotificationToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-semibold text-xs shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-800'
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble & Cards */}
              <div
                className={`max-w-[85%] space-y-3 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80 shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {/* HITL Approval Preview Card */}
                {msg.pendingAction && (
                  <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-lg space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Action Proposed (Approval Required)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Action Type: <code className="font-mono font-semibold text-indigo-700">{msg.pendingAction.actionType}</code>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Valid 15m</span>
                      </div>
                    </div>

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500">Target Students:</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {msg.pendingAction.studentCount} student(s)
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Total Outstanding:</span>
                        <p className="text-sm font-bold text-rose-600 mt-0.5 font-mono">
                          ₹{msg.pendingAction.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Target Student Preview Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="max-h-56 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                            <tr>
                              <th className="px-3 py-2">Student Name</th>
                              <th className="px-3 py-2">Class</th>
                              <th className="px-3 py-2 text-right">Pending (₹)</th>
                              <th className="px-3 py-2">Contact</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {msg.pendingAction.preview.map((s) => (
                              <tr key={s.studentId} className="hover:bg-slate-50/80">
                                <td className="px-3 py-2 font-medium text-slate-900">
                                  {s.studentName}
                                </td>
                                <td className="px-3 py-2 text-slate-500">
                                  {s.className}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-semibold text-rose-600">
                                  ₹{s.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                                  {s.parentContact}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Action Execution Status or Buttons */}
                    {msg.approved ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Action Approved: Notification tasks enqueued into BullMQ / Redis queue.</span>
                      </div>
                    ) : msg.rejected ? (
                      <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center space-x-2 text-xs text-slate-600 font-medium">
                        <X className="w-4 h-4 text-slate-500" />
                        <span>Action Cancelled by School Admin.</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-3 pt-2">
                        <button
                          type="button"
                          disabled={rejectingActionId === msg.pendingAction.actionId || approvingActionId === msg.pendingAction.actionId}
                          onClick={() => handleRejectAction(msg.id, msg.pendingAction!.actionId)}
                          className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
                        >
                          {rejectingActionId === msg.pendingAction.actionId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Cancel'
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={approvingActionId === msg.pendingAction.actionId || rejectingActionId === msg.pendingAction.actionId}
                          onClick={() => handleApproveAction(msg.id, msg.pendingAction!.actionId)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
                        >
                          {approvingActionId === msg.pendingAction.actionId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve & Send Reminders</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center space-x-3 text-slate-500 text-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm text-slate-600 flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>Gemini Agent is inspecting fee records & processing request...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick-Action Chips */}
        <div className="px-6 py-2 bg-slate-100/70 border-t border-slate-200 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Suggested:
          </span>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={isSending}
              onClick={() => handleSendPrompt(prompt)}
              className="text-xs text-slate-700 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3 py-1.5 rounded-full border border-slate-200 shrink-0 transition-colors shadow-2xs disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Prompt Input Form */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center space-x-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask AI Fee Agent (e.g. Which students have pending fees for this month?)..."
              disabled={isSending}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isSending}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Every reminder requires explicit human review and one-click authorization prior to dispatch.
          </p>
        </div>
      </div>
    </div>
  );
};
