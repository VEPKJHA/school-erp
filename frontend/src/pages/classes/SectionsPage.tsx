import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Ban, Grid, Loader2 } from 'lucide-react';
import { ClassService } from '../../services/class.service';
import { Section, ClassItem } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

export const SectionsPage: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    classId: '',
    name: '',
    capacity: 40,
    roomNumber: '',
  });

  const fetchClassesAndSections = async () => {
    setIsLoading(true);
    try {
      const [classesData, sectionsData] = await Promise.all([
        ClassService.getClasses(),
        ClassService.getSections({ classId: selectedClassId || undefined }),
      ]);
      setClasses(classesData);
      setSections(sectionsData);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load sections data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndSections();
  }, [selectedClassId]);

  const openCreateModal = () => {
    setEditingSection(null);
    setForm({
      classId: selectedClassId || (classes[0]?.id ?? ''),
      name: '',
      capacity: 40,
      roomNumber: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Section) => {
    setEditingSection(s);
    setForm({
      classId: s.classId,
      name: s.name,
      capacity: s.capacity,
      roomNumber: s.roomNumber || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classId) {
      error('Please select a parent class');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingSection) {
        await ClassService.updateSection(editingSection.id, {
          name: form.name,
          capacity: Number(form.capacity),
          roomNumber: form.roomNumber,
        });
        success('Section updated successfully');
      } else {
        await ClassService.createSection(form.classId, {
          name: form.name,
          capacity: Number(form.capacity),
          roomNumber: form.roomNumber,
        });
        success('Section created successfully');
      }
      setIsModalOpen(false);
      fetchClassesAndSections();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (section: Section) => {
    if (!window.confirm(`Deactivate section ${section.name}?`)) return;
    try {
      await ClassService.deactivateSection(section.id);
      success(`Section ${section.name} deactivated`);
      fetchClassesAndSections();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to deactivate section');
    }
  };

  const columns: Column<Section>[] = [
    {
      header: 'Section Name',
      accessor: (row) => (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-800">Section {row.name}</span>
        </div>
      ),
    },
    {
      header: 'Assigned Class',
      accessor: (row) => (
        <span className="font-medium text-slate-700">
          {row.class?.name || 'Class'}
        </span>
      ),
    },
    {
      header: 'Student Capacity',
      accessor: (row) => <span className="text-slate-600">{row.capacity} students</span>,
    },
    {
      header: 'Room',
      accessor: (row) => (
        <span className="text-slate-500 font-mono text-xs">
          {row.roomNumber || 'Not assigned'}
        </span>
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
          {hasPermission('section:update') && (
            <button
              onClick={() => openEditModal(row)}
              title="Edit Section"
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {hasPermission('section:delete') && row.isActive && (
            <button
              onClick={() => handleDeactivate(row)}
              title="Deactivate Section"
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
          <h1 className="text-xl font-bold text-slate-900">Class Sections</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage section divisions, student room allotments, and capacity
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Class Filter Dropdown */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {hasPermission('section:create') && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Section</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={sections}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="No sections found for this class."
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSection ? `Edit Section: ${editingSection.name}` : 'Create New Section'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingSection && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Parent Class *
              </label>
              <select
                required
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">Select a Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Section Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. A, B, Blue, etc."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Capacity (Students) *
              </label>
              <input
                type="number"
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 40 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Room Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Room 204"
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
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
              <span>{editingSection ? 'Update Section' : 'Create Section'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
