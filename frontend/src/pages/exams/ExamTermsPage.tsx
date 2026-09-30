import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Filter,
  CheckCircle,
  FileText,
  Layers,
  Award,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { ExamService } from '../../services/exam.service';
import { AcademicService } from '../../services/academic.service';
import { ClassService } from '../../services/class.service';
import { TimetableService } from '../../services/timetable.service';
import {
  ExamTerm,
  ExamSchedule,
  AcademicSession,
  ClassItem,
  Subject,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../context/ToastContext';

export const ExamTermsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<ExamTerm | null>(null);

  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [filterClassId, setFilterClassId] = useState<string>('');

  // Modals
  const [showTermModal, setShowTermModal] = useState<boolean>(false);
  const [termForm, setTermForm] = useState({
    name: '',
    code: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduleForm, setScheduleForm] = useState({
    classId: '',
    subjectId: '',
    examDate: '',
    startTime: '09:00',
    endTime: '12:00',
    maxMarks: 100,
    passMarks: 33,
    roomNumber: '',
  });

  // Load Initial Academic Data
  useEffect(() => {
    loadSessions();
    loadClassesAndSubjects();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await AcademicService.getSessions();
      setSessions(data);
      const current = data.find((s) => s.isCurrent) || data[0];
      if (current) {
        setSelectedSessionId(current.id);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load academic sessions');
    }
  };

  const loadClassesAndSubjects = async () => {
    try {
      const [clsData, subData] = await Promise.all([
        ClassService.getClasses(),
        TimetableService.getSubjects(true),
      ]);
      setClasses(clsData);
      setSubjects(subData);
    } catch (err: any) {
      error('Failed to load classes or subjects');
    }
  };

  // Load Exam Terms when Session changes
  useEffect(() => {
    if (selectedSessionId) {
      loadTerms(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadTerms = async (sessionId: string) => {
    setLoading(true);
    try {
      const data = await ExamService.getTerms(sessionId);
      setTerms(data);
      if (data.length > 0) {
        setSelectedTerm(data[0]);
      } else {
        setSelectedTerm(null);
        setSchedules([]);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load exam terms');
    } finally {
      setLoading(false);
    }
  };

  // Load Schedules for Selected Term
  useEffect(() => {
    if (selectedTerm) {
      loadSchedules(selectedTerm.id, filterClassId);
    }
  }, [selectedTerm, filterClassId]);

  const loadSchedules = async (termId: string, classId?: string) => {
    try {
      const data = await ExamService.getSchedules({
        examTermId: termId,
        classId: classId || undefined,
      });
      setSchedules(data);
    } catch (err: any) {
      error('Failed to load exam schedules');
    }
  };

  // Handle Create Term
  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      error('Please select an academic session');
      return;
    }
    try {
      const newTerm = await ExamService.createTerm({
        academicSessionId: selectedSessionId,
        name: termForm.name,
        code: termForm.code,
        startDate: termForm.startDate,
        endDate: termForm.endDate,
        description: termForm.description,
      });
      success(`Exam term '${newTerm.name}' created successfully`);
      setShowTermModal(false);
      setTermForm({ name: '', code: '', startDate: '', endDate: '', description: '' });
      await loadTerms(selectedSessionId);
      setSelectedTerm(newTerm);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create exam term');
    }
  };

  // Handle Publish / Unpublish Term
  const handleTogglePublish = async (term: ExamTerm) => {
    try {
      await ExamService.updateTerm(term.id, {
        isPublished: !term.isPublished,
      });
      success(`Exam term ${!term.isPublished ? 'published' : 'moved to draft'}`);
      loadTerms(selectedSessionId);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update publication status');
    }
  };

  // Handle Delete Term
  const handleDeleteTerm = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete exam term '${name}' and its schedule?`)) {
      return;
    }
    try {
      await ExamService.deleteTerm(id);
      success('Exam term deleted');
      loadTerms(selectedSessionId);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete exam term');
    }
  };

  // Handle Create Exam Schedule Paper
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTerm) return;

    try {
      await ExamService.createSchedule({
        examTermId: selectedTerm.id,
        classId: scheduleForm.classId,
        subjectId: scheduleForm.subjectId,
        examDate: scheduleForm.examDate,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        maxMarks: Number(scheduleForm.maxMarks),
        passMarks: Number(scheduleForm.passMarks),
        roomNumber: scheduleForm.roomNumber || undefined,
      });
      success('Exam paper scheduled successfully');
      setShowScheduleModal(false);
      setScheduleForm({
        classId: '',
        subjectId: '',
        examDate: '',
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 100,
        passMarks: 33,
        roomNumber: '',
      });
      loadSchedules(selectedTerm.id, filterClassId);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to schedule exam paper');
    }
  };

  // Handle Delete Exam Schedule
  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled exam paper?')) return;
    try {
      await ExamService.deleteSchedule(id);
      success('Exam paper schedule removed');
      if (selectedTerm) loadSchedules(selectedTerm.id, filterClassId);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete schedule');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Examination Terms & Papers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure examination cycles, schedule question papers, and manage academic evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasPermission('exam:term:create') && (
            <button
              onClick={() => setShowTermModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Exam Term
            </button>
          )}

          <button
            onClick={() => navigate('/exams/report-cards')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            Report Cards
          </button>
        </div>
      </div>

      {/* Filter Row: Session Selector */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Academic Session:
        </label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.isCurrent ? '(Current)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Main Grid: Left column terms list, Right column schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Exam Terms List */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Exam Terms ({terms.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading exam terms...</div>
          ) : terms.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No exam terms configured for this session yet.
            </div>
          ) : (
            <div className="space-y-3">
              {terms.map((term) => {
                const isSelected = selectedTerm?.id === term.id;
                return (
                  <div
                    key={term.id}
                    onClick={() => setSelectedTerm(term)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded">
                          {term.code}
                        </span>
                        <h3 className="text-base font-semibold text-gray-900 mt-1">
                          {term.name}
                        </h3>
                      </div>
                      <Badge variant={term.isPublished ? 'success' : 'neutral'}>
                        {term.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(term.startDate).toLocaleDateString()} –{' '}
                      {new Date(term.endDate).toLocaleDateString()}
                    </div>

                    {term.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {term.description}
                      </p>
                    )}

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {term._count?.examSchedules ?? 0} scheduled papers
                      </span>
                      <div className="flex items-center gap-2">
                        {hasPermission('exam:term:update') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePublish(term);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            {term.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                        )}
                        {hasPermission('exam:term:delete') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTerm(term.id, term.name);
                            }}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Scheduled Papers */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Scheduled Papers
                {selectedTerm && (
                  <span className="text-xs font-normal text-gray-500">
                    ({selectedTerm.name})
                  </span>
                )}
              </h2>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Class Filter */}
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {hasPermission('exam:schedule:create') && selectedTerm && (
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 transition font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Schedule Paper
                </button>
              )}
            </div>
          </div>

          {!selectedTerm ? (
            <div className="py-16 text-center text-sm text-gray-400">
              Select or create an exam term to view and manage scheduled papers.
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400 space-y-2">
              <p>No papers scheduled for this exam term yet.</p>
              {hasPermission('exam:schedule:create') && (
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  + Add the first scheduled paper
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Subject & Code</th>
                    <th className="py-3 px-4 font-semibold">Class</th>
                    <th className="py-3 px-4 font-semibold">Date & Time</th>
                    <th className="py-3 px-4 font-semibold">Max / Pass</th>
                    <th className="py-3 px-4 font-semibold">Room</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedules.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">
                          {item.subject?.name}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {item.subject?.code} ({item.subject?.type})
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {item.class?.name}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-medium text-gray-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(item.examDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {item.startTime} - {item.endTime}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="font-semibold text-gray-900">{item.maxMarks}</span>
                        <span className="text-gray-400"> / {item.passMarks} min</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 font-mono">
                        {item.roomNumber || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/exams/marks?scheduleId=${item.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold transition"
                            title="Enter student marks"
                          >
                            <Award className="w-3.5 h-3.5" />
                            Marks Entry
                          </button>

                          {hasPermission('exam:schedule:delete') && (
                            <button
                              onClick={() => handleDeleteSchedule(item.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                              title="Delete schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Exam Term */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Create New Exam Term</h3>
              <button
                onClick={() => setShowTermModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Term Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination 2026"
                  value={termForm.name}
                  onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Term Code (Unique Identifier) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MID-2026 or ANNUAL-2026"
                  value={termForm.code}
                  onChange={(e) => setTermForm({ ...termForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={termForm.startDate}
                    onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={termForm.endDate}
                    onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional remarks regarding this examination term..."
                  value={termForm.description}
                  onChange={(e) => setTermForm({ ...termForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Save Exam Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Exam Paper */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Schedule Exam Paper ({selectedTerm?.code})
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Class *
                  </label>
                  <select
                    required
                    value={scheduleForm.classId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, classId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    required
                    value={scheduleForm.subjectId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Exam Date *
                </label>
                <input
                  type="date"
                  required
                  value={scheduleForm.examDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, examDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max Marks *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={scheduleForm.maxMarks}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, maxMarks: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pass Marks *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={scheduleForm.passMarks}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, passMarks: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Room / Hall
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hall A"
                    value={scheduleForm.roomNumber}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Schedule Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTermsPage;
