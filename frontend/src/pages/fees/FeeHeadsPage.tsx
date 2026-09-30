import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Check,
} from 'lucide-react';
import { FeeService } from '../../services/fee.service';
import { FeeHead } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

export const FeeHeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHead, setEditingHead] = useState<FeeHead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    isRefundable: false,
  });

  const fetchFeeHeads = async () => {
    setIsLoading(true);
    try {
      const data = await FeeService.getFeeHeads();
      setFeeHeads(data);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch fee heads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeHeads();
  }, []);

  const openCreateModal = () => {
    setEditingHead(null);
    setForm({ name: '', code: '', description: '', isRefundable: false });
    setIsModalOpen(true);
  };

  const openEditModal = (fh: FeeHead) => {
    setEditingHead(fh);
    setForm({
      name: fh.name,
      code: fh.code,
      description: fh.description || '',
      isRefundable: fh.isRefundable,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      error('Name and code are required');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingHead) {
        await FeeService.updateFeeHead(editingHead.id, {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
          isRefundable: form.isRefundable,
        });
        success('Fee head updated successfully');
      } else {
        await FeeService.createFeeHead({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
          isRefundable: form.isRefundable,
        });
        success('Fee head created successfully');
      }
      setIsModalOpen(false);
      fetchFeeHeads();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save fee head');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHeads = feeHeads.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.code.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<FeeHead>[] = [
    {
      header: 'Fee Head Name',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm block">{row.name}</span>
          {row.description && (
            <span className="text-xs text-slate-400 block">{row.description}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Code',
      accessor: (row) => (
        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Refundable',
      accessor: (row) =>
        row.isRefundable ? (
          <Badge variant="info">Refundable (Caution)</Badge>
        ) : (
          <span className="text-xs text-slate-500">Non-refundable</span>
        ),
    },
    {
      header: 'Status',
      accessor: (row) =>
        row.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end space-x-2">
          {hasPermission('fee:head:update') && (
            <button
              onClick={() => openEditModal(row)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Edit Fee Head"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/fees')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Wallet className="w-6 h-6 text-indigo-600" />
              Fee Heads & Categories
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard chart of fee accounts: Tuition, Lab, Library, Sports, Transport, and Annual Charges.
            </p>
          </div>
        </div>

        {hasPermission('fee:head:create') && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm shadow-indigo-600/20 transition-all cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fee Head</span>
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredHeads}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        searchPlaceholder="Search fee heads by name or code..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No fee heads found"
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHead ? 'Edit Fee Head' : 'Create New Fee Head'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Fee Head Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Tuition Fee"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Short Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g. TUIT"
              maxLength={20}
              className="w-full text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description of this fee category..."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isRefundable"
              checked={form.isRefundable}
              onChange={(e) => setForm({ ...form, isRefundable: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="isRefundable" className="text-xs font-medium text-slate-700">
              Is refundable fee (e.g. Security deposit or caution money)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Fee Head</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
