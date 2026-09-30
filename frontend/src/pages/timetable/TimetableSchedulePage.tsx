import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Printer,
  RefreshCw,
  X,
  User,
  Building,
  BookOpen,
  Filter,
  CheckCircle,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { TimetableService } from '../../services/timetable.service';
import { ClassService } from '../../services/class.service';
import { AcademicService } from '../../services/academic.service';
import { UserService } from '../../services/user.service';
import {
  TimetableSlot,
  Subject,
  ClassItem,
  Section,
  AcademicSession,
  User as UserType,
  DayOfWeek,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../context/ToastContext';

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const PERIOD_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

const DEFAULT_PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:45', end: '09:30' },
  3: { start: '09:30', end: '10:15' },
  4: { start: '10:30', end: '11:15' }, // after recess
  5: { start: '11:15', end: '12:00' },
  6: { start: '12:00', end: '12:45' },
  7: { start: '01:15', end: '02:00' }, // after lunch
  8: { start: '02:00', end: '02:45' },
};

export const TimetableSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  // Mode: Section view or Teacher view
  const [viewMode, setViewMode] = useState<'SECTION' | 'TEACHER'>('SECTION');

  // Academic Selections
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // Teacher Selections
  const [teachers, setTeachers] = useState<UserType[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Slots State
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [slotDay, setSlotDay] = useState<DayOfWeek>('MONDAY');
  const [slotPeriod, setSlotPeriod] = useState<number>(1);
  const [slotSubjectId, setSlotSubjectId] = useState<string>('');
  const [slotTeacherId, setSlotTeacherId] = useState<string>('');
  const [slotStartTime, setSlotStartTime] = useState<string>('08:00');
  const [slotEndTime, setSlotEndTime] = useState<string>('08:45');
  const [slotRoomNumber, setSlotRoomNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initial Load: Academic Sessions, Classes, Subjects, Teachers
  useEffect(() => {
    const initData = async () => {
      try {
        const [sessData, classData, subData, userData] = await Promise.all([
          AcademicService.getSessions(),
          ClassService.getClasses(),
          TimetableService.getSubjects(true),
          UserService.getUsers(),
        ]);

        setSessions(sessData);
        const current = sessData.find((s) => s.isCurrent) || sessData[0];
        if (current) setSelectedSessionId(current.id);

        setClasses(classData);
        if (classData.length > 0) setSelectedClassId(classData[0].id);

        setSubjects(subData);
        if (subData.length > 0) setSlotSubjectId(subData[0].id);

        setTeachers(userData);
        if (userData.length > 0) setSelectedTeacherId(userData[0].id);
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load initial timetable prerequisites');
      }
    };
    initData();
  }, []);

  // 2. Load Sections when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      setSelectedSectionId('');
      return;
    }
    const loadSections = async () => {
      try {
        const secData = await ClassService.getSectionsByClass(selectedClassId);
        setSections(secData);
        if (secData.length > 0) {
          setSelectedSectionId(secData[0].id);
        } else {
          setSelectedSectionId('');
        }
      } catch (err: any) {
        error('Failed to load sections');
      }
    };
    loadSections();
  }, [selectedClassId]);

  // 3. Load Timetable Slots based on selected view
  const fetchTimetable = async () => {
    if (viewMode === 'SECTION') {
      if (!selectedSectionId) return;
      setIsLoading(true);
      try {
        const data = await TimetableService.getSectionTimetable(selectedSectionId, {
          academicSessionId: selectedSessionId || undefined,
        });
        setSlots(data);
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load section timetable');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!selectedTeacherId) return;
      setIsLoading(true);
      try {
        const data = await TimetableService.getTeacherTimetable(selectedTeacherId, {
          academicSessionId: selectedSessionId || undefined,
        });
        setSlots(data);
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load teacher schedule');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [viewMode, selectedSectionId, selectedTeacherId, selectedSessionId]);

  // Open modal to add period at a specific day & period
  const handleOpenAddModal = (day: DayOfWeek, period: number) => {
    setEditingSlot(null);
    setSlotDay(day);
    setSlotPeriod(period);
    const defTimes = DEFAULT_PERIOD_TIMES[period] || { start: '08:00', end: '08:45' };
    setSlotStartTime(defTimes.start);
    setSlotEndTime(defTimes.end);
    setSlotTeacherId('');
    setSlotRoomNumber('');
    if (subjects.length > 0) setSlotSubjectId(subjects[0].id);
    setIsModalOpen(true);
  };

  // Open modal to edit existing period slot
  const handleOpenEditModal = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setSlotDay(slot.dayOfWeek);
    setSlotPeriod(slot.periodNumber);
    setSlotStartTime(slot.startTime);
    setSlotEndTime(slot.endTime);
    setSlotSubjectId(slot.subjectId);
    setSlotTeacherId(slot.teacherId || '');
    setSlotRoomNumber(slot.roomNumber || '');
    setIsModalOpen(true);
  };

  // Delete slot
  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to remove this period from the schedule?')) return;
    try {
      await TimetableService.deleteSlot(slotId);
      success('Period removed from schedule');
      fetchTimetable();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete period slot');
    }
  };

  // Submit slot (Create or Update)
  const handleSubmitSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !selectedClassId || !selectedSectionId || !slotSubjectId) {
      error('Please select academic session, class, section, and subject');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSlot) {
        await TimetableService.updateSlot(editingSlot.id, {
          subjectId: slotSubjectId,
          teacherId: slotTeacherId || null,
          startTime: slotStartTime,
          endTime: slotEndTime,
          roomNumber: slotRoomNumber.trim() || null,
        });
        success('Timetable period updated successfully');
      } else {
        await TimetableService.createSlot({
          academicSessionId: selectedSessionId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          subjectId: slotSubjectId,
          teacherId: slotTeacherId || null,
          dayOfWeek: slotDay,
          periodNumber: slotPeriod,
          startTime: slotStartTime,
          endTime: slotEndTime,
          roomNumber: slotRoomNumber.trim() || null,
        });
        success('Timetable period scheduled successfully');
      }
      setIsModalOpen(false);
      fetchTimetable();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to schedule period');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build a lookup map: day -> periodNumber -> slot
  const slotMap = new Map<string, TimetableSlot>();
  slots.forEach((s) => {
    slotMap.set(`${s.dayOfWeek}_${s.periodNumber}`, s);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-indigo-600" />
            School Timetable & Class Schedules
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Weekly section periods, teacher scheduling, room assignments, and automatic clash detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/timetable/subjects')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm transition"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            Subjects Catalog
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Print Timetable
          </button>
        </div>
      </div>

      {/* View Switcher & Selection Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <button
            onClick={() => setViewMode('SECTION')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${
              viewMode === 'SECTION'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Class Section Schedule
          </button>

          <button
            onClick={() => setViewMode('TEACHER')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${
              viewMode === 'TEACHER'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            Teacher Personal Timetable
          </button>
        </div>

        {/* Dynamic Selectors */}
        {viewMode === 'SECTION' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5">
                Academic Session
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5">
                Section
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Section {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5">
                Academic Session
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5">
                Select Teacher / Faculty
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Printable Title */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold uppercase">DEMO PUBLIC GLOBAL ACADEMY</h2>
        <p className="text-sm font-semibold text-slate-700 mt-1">
          {viewMode === 'SECTION'
            ? `Class Timetable • ${
                classes.find((c) => c.id === selectedClassId)?.name || 'Class'
              } - Section ${sections.find((s) => s.id === selectedSectionId)?.name || ''}`
            : `Teacher Schedule • ${
                teachers.find((t) => t.id === selectedTeacherId)?.firstName || ''
              } ${teachers.find((t) => t.id === selectedTeacherId)?.lastName || ''}`}
        </p>
      </div>

      {/* Weekly Matrix Schedule Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-28 border-r border-slate-200 text-center uppercase tracking-wider">
                  Day / Period
                </th>
                {PERIOD_NUMBERS.map((p) => {
                  const times = DEFAULT_PERIOD_TIMES[p];
                  return (
                    <th
                      key={p}
                      className="p-3 text-center border-r border-slate-200 min-w-[130px]"
                    >
                      <div className="font-bold text-slate-800">Period {p}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {times.start} - {times.end}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading timetable schedule...
                  </td>
                </tr>
              ) : (
                DAYS.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/40 transition">
                    <td className="p-3 font-bold text-slate-800 uppercase bg-slate-50 border-r border-slate-200 text-center tracking-wider">
                      {day.substring(0, 3)}
                    </td>

                    {PERIOD_NUMBERS.map((p) => {
                      const slot = slotMap.get(`${day}_${p}`);
                      return (
                        <td
                          key={p}
                          className="p-2 border-r border-slate-200 align-top relative group"
                        >
                          {slot ? (
                            <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-2.5 text-xs shadow-sm hover:shadow transition space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-indigo-900 truncate">
                                  {slot.subject?.name || 'Subject'}
                                </span>
                                <span className="font-mono text-[10px] text-indigo-700 bg-indigo-100 px-1 py-0.5 rounded font-bold">
                                  {slot.subject?.code}
                                </span>
                              </div>

                              {viewMode === 'SECTION' ? (
                                <p className="text-[11px] text-slate-600 truncate flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>
                                    {slot.teacher
                                      ? `${slot.teacher.firstName} ${slot.teacher.lastName}`
                                      : 'Unassigned'}
                                  </span>
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-600 truncate flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>
                                    {slot.class?.name || 'Class'} ({slot.section?.name || 'Sec'})
                                  </span>
                                </p>
                              )}

                              {slot.roomNumber && (
                                <p className="text-[10px] text-slate-500 font-mono">
                                  Room: {slot.roomNumber}
                                </p>
                              )}

                              <div className="text-[10px] text-slate-400 font-mono">
                                {slot.startTime} - {slot.endTime}
                              </div>

                              {/* Hover actions for edit/delete */}
                              {hasPermission('timetable:update') && viewMode === 'SECTION' && (
                                <div className="pt-1 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition print:hidden">
                                  <button
                                    onClick={() => handleOpenEditModal(slot)}
                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-white rounded transition"
                                    title="Edit Slot"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="p-1 text-slate-500 hover:text-rose-600 hover:bg-white rounded transition"
                                    title="Remove Period"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            hasPermission('timetable:create') &&
                            viewMode === 'SECTION' && (
                              <button
                                onClick={() => handleOpenAddModal(day, p)}
                                className="w-full h-full min-h-[70px] border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition print:hidden"
                                title="Add Period Slot"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PERIOD SLOT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingSlot
                  ? `Edit Period ${editingSlot.periodNumber} (${editingSlot.dayOfWeek})`
                  : `Schedule Period ${slotPeriod} on ${slotDay}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSlot} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1">
                  Subject *
                </label>
                <select
                  value={slotSubjectId}
                  onChange={(e) => setSlotSubjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1">
                  Teacher / Faculty
                </label>
                <select
                  value={slotTeacherId}
                  onChange={(e) => setSlotTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="">No Teacher Assigned</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1">
                  Room Number / Lab
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 102, Physics Lab"
                  value={slotRoomNumber}
                  onChange={(e) => setSlotRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSlot ? 'Update Period' : 'Save Period Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
