import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import { AcademicService } from '../../services/academic.service';
import { AcademicSession } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

export const AcademicSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    isCurrent: false,
  });

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await AcademicService.getSessions();
      setSessions(data);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch academic sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await AcademicService.createSession(form);
      success('Academic session created successfully');
      setIsModalOpen(false);
      setForm({ name: '', startDate: '', endDate: '', status: 'ACTIVE', isCurrent: false });
      fetchSessions();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create academic session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrent = async (session: AcademicSession) => {
    if (session.isCurrent) return;
    try {
      await AcademicService.setCurrentSession(session.id);
      success(`Session ${session.name} is now set as the active current session`);
      fetchSessions();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to set active session');
    }
  };

  const columns: Column<AcademicSession>[] = [
    {
      header: 'Session Name',
      accessor: (row) => (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-800">{row.name}</span>
          {row.isCurrent && (
            <Badge variant="success" size="sm">
              Current Active
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Start Date',
      accessor: (row) => (
        <span className="text-slate-600">
          {new Date(row.startDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'End Date',
      accessor: (row) => (
        <span className="text-slate-600">
          {new Date(row.endDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => {
        const variants: Record<string, 'success' | 'warning' | 'neutral' | 'info'> = {
          ACTIVE: 'success',
          UPCOMING: 'info',
          COMPLETED: 'neutral',
          ARCHIVED: 'warning',
        };
        return <Badge variant={variants[row.status] || 'neutral'}>{row.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end space-x-2">
          {hasPermission('academic:session:update') && !row.isCurrent && (
            <button
              onClick={() => handleSetCurrent(row)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Set as Current</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Academic Sessions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure school years and manage active academic session boundaries
          </p>
        </div>

        {hasPermission('academic:session:create') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Session</span>
          </button>
        )}
      </div>

      {/* Sessions Table */}
      <DataTable
        columns={columns}
        data={sessions}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="No academic sessions configured yet."
      />

      {/* Create Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Academic Session"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Session Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2026-27"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Initial Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isCurrentCheckbox"
              checked={form.isCurrent}
              onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="isCurrentCheckbox" className="text-xs font-medium text-slate-700">
              Set as current active session immediately
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Session</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
