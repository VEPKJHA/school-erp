import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Ban, Layers, Loader2, Check } from 'lucide-react';
import { ClassService } from '../../services/class.service';
import { ClassItem } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    name: '',
    code: '',
    numericOrder: 1,
    description: '',
  });

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const data = await ClassService.getClasses({ search: search || undefined });
      setClasses(data);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch classes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreateModal = () => {
    setEditingClass(null);
    setForm({ name: '', code: '', numericOrder: classes.length + 1, description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClassItem) => {
    setEditingClass(c);
    setForm({
      name: c.name,
      code: c.code,
      numericOrder: c.numericOrder,
      description: c.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingClass) {
        await ClassService.updateClass(editingClass.id, {
          name: form.name,
          code: form.code,
          numericOrder: Number(form.numericOrder),
          description: form.description,
        });
        success('Class updated successfully');
      } else {
        await ClassService.createClass({
          name: form.name,
          code: form.code,
          numericOrder: Number(form.numericOrder),
          description: form.description,
        });
        success('Class created successfully');
      }
      setIsModalOpen(false);
      fetchClasses();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (classItem: ClassItem) => {
    if (!window.confirm(`Are you sure you want to deactivate ${classItem.name}?`)) return;
    try {
      await ClassService.deactivateClass(classItem.id);
      success(`${classItem.name} has been deactivated`);
      fetchClasses();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to deactivate class');
    }
  };

  const columns: Column<ClassItem>[] = [
    {
      header: 'Class Name',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-slate-800">{row.name}</span>
          {row.description && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Code',
      accessor: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Sequence Order',
      accessor: (row) => <span className="text-slate-600 font-medium">{row.numericOrder}</span>,
    },
    {
      header: 'Sections',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.sections && row.sections.length > 0 ? (
            row.sections.map((s) => (
              <span
                key={s.id}
                className="inline-block text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded"
              >
                {s.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">No sections</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end space-x-1">
          {hasPermission('class:update') && (
            <button
              onClick={() => openEditModal(row)}
              title="Edit Class"
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {hasPermission('class:delete') && row.isActive && (
            <button
              onClick={() => handleDeactivate(row)}
              title="Deactivate Class"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Classes & Curriculum</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure academic grade levels and classes
          </p>
        </div>

        {hasPermission('class:create') && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={classes}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        searchPlaceholder="Search classes by name or code..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No classes found."
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? `Edit Class: ${editingClass.name}` : 'Create New Class'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Class Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Class 1 or Nursery"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Class Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. C01"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Sequence Order *
              </label>
              <input
                type="number"
                required
                value={form.numericOrder}
                onChange={(e) => setForm({ ...form, numericOrder: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Curriculum notes..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
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
              <span>{editingClass ? 'Update Class' : 'Create Class'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
