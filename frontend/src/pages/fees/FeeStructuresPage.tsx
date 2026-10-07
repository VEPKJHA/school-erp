import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Users,
  Calendar,
  ArrowLeft,
  Trash2,
  DollarSign,
  Loader2,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { FeeService } from '../../services/fee.service';
import { ClassService } from '../../services/class.service';
import { AcademicService } from '../../services/academic.service';
import { StudentService } from '../../services/student.service';
import { FeeStructure, FeeHead, ClassItem, Section, AcademicSession } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

export const FeeStructuresPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    classId: '',
    academicSessionId: '',
    frequency: 'MONTHLY',
    description: '',
    items: [{ feeHeadId: '', amount: 0, dueDayOfMonth: 10 }],
  });

  // Bulk Assign Modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<FeeStructure | null>(null);
  const [assignSectionId, setAssignSectionId] = useState('');
  const [targetSections, setTargetSections] = useState<Section[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Individual Assign Modal
  const [isIndivAssignOpen, setIsIndivAssignOpen] = useState(false);
  const [indivAssignTarget, setIndivAssignTarget] = useState<FeeStructure | null>(null);
  const [indivStudentId, setIndivStudentId] = useState('');
  const [indivStudentsList, setIndivStudentsList] = useState<any[]>([]);
  const [isIndivAssigning, setIsIndivAssigning] = useState(false);

  // View Details Modal
  const [viewStructure, setViewStructure] = useState<FeeStructure | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [cls, sess, heads] = await Promise.all([
          ClassService.getClasses(),
          AcademicService.getSessions(),
          FeeService.getFeeHeads(true),
        ]);
        setClasses(cls);
        setSessions(sess);
        setFeeHeads(heads);

        const current = sess.find((s) => s.isCurrent);
        if (current) {
          setSelectedSessionId(current.id);
          setCreateForm((prev) => ({ ...prev, academicSessionId: current.id }));
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadMetadata();
  }, []);

  const fetchStructures = async () => {
    setIsLoading(true);
    try {
      const data = await FeeService.getFeeStructures({
        classId: selectedClassId || undefined,
        academicSessionId: selectedSessionId || undefined,
      });
      setStructures(data);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch fee structures');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, [selectedClassId, selectedSessionId]);

  const handleAddItem = () => {
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, { feeHeadId: feeHeads[0]?.id || '', amount: 0, dueDayOfMonth: 10 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setCreateForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.classId || !createForm.academicSessionId) {
      error('Please complete all required fields');
      return;
    }
    if (createForm.items.length === 0) {
      error('At least one fee head must be added to the structure');
      return;
    }
    for (const item of createForm.items) {
      if (!item.feeHeadId || item.amount <= 0) {
        error('All fee heads must have a valid non-zero amount');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await FeeService.createFeeStructure({
        name: createForm.name.trim(),
        classId: createForm.classId,
        academicSessionId: createForm.academicSessionId,
        frequency: createForm.frequency,
        description: createForm.description.trim() || undefined,
        items: createForm.items.map((it) => ({
          feeHeadId: it.feeHeadId,
          amount: Number(it.amount),
          dueDayOfMonth: Number(it.dueDayOfMonth || 10),
        })),
      });
      success('Fee structure template created successfully');
      setIsCreateOpen(false);
      fetchStructures();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create fee structure');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignModal = async (str: FeeStructure) => {
    setAssignTarget(str);
    setAssignSectionId('');
    try {
      const cls = await ClassService.getClassById(str.classId);
      setTargetSections(cls.sections || []);
      setIsAssignOpen(true);
    } catch (e) {
      error('Failed to load class sections');
    }
  };

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;

    setIsAssigning(true);
    try {
      const res = await FeeService.bulkAssignFeeStructure({
        classId: assignTarget.classId,
        sectionId: assignSectionId || undefined,
        feeStructureId: assignTarget.id,
        academicSessionId: assignTarget.academicSessionId,
      });
      success(
        `Successfully allocated fee structure to ${res.assignedCount} of ${res.totalStudents} students`
      );
      setIsAssignOpen(false);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to bulk assign fee structure');
    } finally {
      setIsAssigning(false);
    }
  };

  const openIndivAssignModal = async (str: FeeStructure) => {
    setIndivAssignTarget(str);
    setIndivStudentId('');
    try {
      const res = await StudentService.getStudents({ classId: str.classId, academicSessionId: str.academicSessionId, pageSize: 500 });
      setIndivStudentsList(res.students || []);
      setIsIndivAssignOpen(true);
    } catch (e) {
      error('Failed to load students for this class');
    }
  };

  const handleIndivAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indivAssignTarget || !indivStudentId) return;

    setIsIndivAssigning(true);
    try {
      await FeeService.assignFeeStructure({
        studentId: indivStudentId,
        feeStructureId: indivAssignTarget.id,
        academicSessionId: indivAssignTarget.academicSessionId,
      });
      success('Successfully allocated fee structure to student');
      setIsIndivAssignOpen(false);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to assign fee structure');
    } finally {
      setIsIndivAssigning(false);
    }
  };

  const calculateStructureTotal = (items?: any[]) => {
    if (!items) return 0;
    return items.reduce((sum, it) => sum + Number(it.amount), 0);
  };

  const formatCurrency = (amt: number | string) => {
    return `₹${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

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
              <Layers className="w-6 h-6 text-indigo-600" />
              Fee Structure Templates
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Grade-specific pricing templates with component breakdowns for tuition, activities, and labs.
            </p>
          </div>
        </div>

        {hasPermission('fee:structure:create') && (
          <button
            onClick={() => {
              if (classes.length > 0 && !createForm.classId) {
                setCreateForm((prev) => ({ ...prev, classId: classes[0].id }));
              }
              setIsCreateOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm shadow-indigo-600/20 transition-all cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fee Structure</span>
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">All Sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              Session {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {(selectedSessionId || selectedClassId) && (
          <button
            onClick={() => {
              setSelectedSessionId('');
              setSelectedClassId('');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* Structures Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs">Loading fee templates...</p>
        </div>
      ) : structures.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">No Fee Structures Configured</p>
          <p className="text-xs mt-1">Create a template for your classes to automate billing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {structures.map((str) => {
            const total = calculateStructureTotal(str.items);
            return (
              <div
                key={str.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                        {str.class?.name || 'Class'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-2">{str.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Session: {str.session?.name} • Freq: {str.frequency}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900 block">
                        {formatCurrency(total)}
                      </span>
                      <span className="text-[10px] text-slate-400">per cycle</span>
                    </div>
                  </div>

                  {/* Fee Components Preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    {str.items?.slice(0, 4).map((it) => (
                      <div key={it.id} className="flex justify-between text-xs text-slate-600">
                        <span className="truncate pr-2">{it.feeHead?.name}</span>
                        <span className="font-medium text-slate-800">{formatCurrency(it.amount)}</span>
                      </div>
                    ))}
                    {(str.items?.length || 0) > 4 && (
                      <p className="text-[11px] text-indigo-600 font-medium pt-1">
                        + {(str.items?.length || 0) - 4} more fee components
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setViewStructure(str)}
                    className="flex items-center space-x-1 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Breakdown</span>
                  </button>

                  {hasPermission('fee:assignment:create') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openIndivAssignModal(str)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Assign to Student</span>
                      </button>
                      <button
                        onClick={() => openAssignModal(str)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Allocate to Class</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Structure Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Class Fee Structure"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fee Structure Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g. Class 1 Standard Fee Template 2026-27"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Grade / Class <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={createForm.classId}
                onChange={(e) => setCreateForm({ ...createForm, classId: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Academic Session <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={createForm.academicSessionId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, academicSessionId: e.target.value })
                }
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">Select Session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Billing Frequency
              </label>
              <select
                value={createForm.frequency}
                onChange={(e) => setCreateForm({ ...createForm, frequency: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="TERMWISE">Term-wise</option>
                <option value="ANNUAL">Annual</option>
                <option value="ONE_TIME">One Time</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description / Remarks
              </label>
              <input
                type="text"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Optional notes..."
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Itemized Fee Heads Section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Fee Component Line Items
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Fee Head</span>
              </button>
            </div>

            <div className="space-y-2">
              {createForm.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <select
                    required
                    value={item.feeHeadId}
                    onChange={(e) => handleItemChange(idx, 'feeHeadId', e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 flex-1"
                  >
                    <option value="">Select Fee Head</option>
                    {feeHeads.map((fh) => (
                      <option key={fh.id} value={fh.id}>
                        {fh.name} ({fh.code})
                      </option>
                    ))}
                  </select>

                  <div className="relative w-32">
                    <span className="text-xs text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="Amount"
                      value={item.amount || ''}
                      onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-slate-800 text-right"
                    />
                  </div>

                  {createForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total calculation */}
            <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl border border-indigo-200 mt-3 text-xs font-bold text-indigo-900">
              <span>Total Scheduled Amount per Period:</span>
              <span className="text-sm">{formatCurrency(calculateStructureTotal(createForm.items))}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Fee Structure</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Allocate Fee Structure to Students"
        maxWidth="md"
      >
        <form onSubmit={handleBulkAssign} className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
            <p className="font-semibold text-sm">
              Template: {assignTarget?.name} ({formatCurrency(calculateStructureTotal(assignTarget?.items))})
            </p>
            <p className="mt-1">
              Class: {assignTarget?.class?.name} • Session: {assignTarget?.session?.name}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Section Scope
            </label>
            <select
              value={assignSectionId}
              onChange={(e) => setAssignSectionId(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
            >
              <option value="">All Sections in {assignTarget?.class?.name}</option>
              {targetSections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Selecting "All Sections" will allocate this fee schedule to all active enrolled students in this grade.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssigning}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {isAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm Allocation</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Individual Assign Modal */}
      <Modal
        isOpen={isIndivAssignOpen}
        onClose={() => setIsIndivAssignOpen(false)}
        title="Assign Fee Structure to Student"
        maxWidth="md"
      >
        <form onSubmit={handleIndivAssign} className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
            <p className="font-semibold text-sm">
              Template: {indivAssignTarget?.name} ({formatCurrency(calculateStructureTotal(indivAssignTarget?.items))})
            </p>
            <p className="mt-1">
              Class: {indivAssignTarget?.class?.name} ? Session: {indivAssignTarget?.session?.name}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Student
            </label>
            <select
              required
              value={indivStudentId}
              onChange={(e) => setIndivStudentId(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
            >
              <option value="">Select a student...</option>
              {indivStudentsList.map((stu: any) => (
                <option key={stu.id} value={stu.id}>
                  {stu.firstName} {stu.lastName} ({stu.studentCode}) - {stu.section?.name ? `Sec ${stu.section.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsIndivAssignOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isIndivAssigning || !indivStudentId}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {isIndivAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm Allocation</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* View Breakdown Modal */}
      <Modal
        isOpen={!!viewStructure}
        onClose={() => setViewStructure(null)}
        title="Fee Structure Breakdown"
        maxWidth="md"
      >
        {viewStructure && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {viewStructure.class?.name}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{viewStructure.name}</h3>
              <p className="text-xs text-slate-500">
                Session: {viewStructure.session?.name} • Frequency: {viewStructure.frequency}
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {viewStructure.items?.map((it) => (
                <div key={it.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800">{it.feeHead?.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Code: {it.feeHead?.code}</p>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{formatCurrency(it.amount)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900">
              <span>Total Scheduled Fee:</span>
              <span className="text-sm font-extrabold text-indigo-700">
                {formatCurrency(calculateStructureTotal(viewStructure.items))}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
