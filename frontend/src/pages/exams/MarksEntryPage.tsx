import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Award,
  Calendar,
  Clock,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Users,
  Search,
  BookOpen,
} from 'lucide-react';
import { ExamService } from '../../services/exam.service';
import { StudentService } from '../../services/student.service';
import { AcademicService } from '../../services/academic.service';
import { ClassService } from '../../services/class.service';
import {
  ExamTerm,
  ExamSchedule,
  ExamMark,
  Student,
  AcademicSession,
  ClassItem,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

interface StudentRosterRow {
  student: Student;
  marksObtained: number | '' | null;
  isAbsent: boolean;
  isExempt: boolean;
  grade?: string;
  remarks: string;
}

export const MarksEntryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const urlScheduleId = searchParams.get('scheduleId') || '';

  // Academic filters
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(urlScheduleId);

  // Selected schedule object
  const [currentSchedule, setCurrentSchedule] = useState<ExamSchedule | null>(null);

  // Student roster rows for editing
  const [roster, setRoster] = useState<StudentRosterRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initial Load: Sessions & Terms
  useEffect(() => {
    loadSessions();
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
      error('Failed to load academic sessions');
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      loadTerms(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadTerms = async (sessionId: string) => {
    try {
      const data = await ExamService.getTerms(sessionId);
      setTerms(data);
      if (data.length > 0 && !selectedTermId) {
        setSelectedTermId(data[0].id);
      }
    } catch (err: any) {
      error('Failed to load exam terms');
    }
  };

  // Load schedules for selected term
  useEffect(() => {
    if (selectedTermId) {
      loadSchedules(selectedTermId);
    }
  }, [selectedTermId]);

  const loadSchedules = async (termId: string) => {
    try {
      const data = await ExamService.getSchedules({ examTermId: termId });
      setSchedules(data);
      if (urlScheduleId && data.some((s) => s.id === urlScheduleId)) {
        setSelectedScheduleId(urlScheduleId);
      } else if (data.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(data[0].id);
      }
    } catch (err: any) {
      error('Failed to load exam paper schedules');
    }
  };

  // When schedule selected, load paper details and students roster
  useEffect(() => {
    if (selectedScheduleId) {
      loadRoster(selectedScheduleId);
    } else {
      setCurrentSchedule(null);
      setRoster([]);
    }
  }, [selectedScheduleId]);

  const loadRoster = async (scheduleId: string) => {
    setLoading(true);
    try {
      const schedule = await ExamService.getScheduleById(scheduleId);
      setCurrentSchedule(schedule);

      // Load all students in the class of this paper
      const [studentsRes, existingMarks] = await Promise.all([
        StudentService.getStudents({ classId: schedule.classId, pageSize: 100 }),
        ExamService.getMarks(scheduleId),
      ]);

      const marksMap = new Map<string, ExamMark>();
      existingMarks.forEach((m) => marksMap.set(m.studentId, m));

      const rows: StudentRosterRow[] = studentsRes.students.map((student) => {
        const mark = marksMap.get(student.id);
        const marksObt =
          mark?.marksObtained !== null && mark?.marksObtained !== undefined
            ? Number(mark.marksObtained)
            : '';

        return {
          student,
          marksObtained: marksObt,
          isAbsent: mark?.isAbsent ?? false,
          isExempt: mark?.isExempt ?? false,
          grade: mark?.grade || undefined,
          remarks: mark?.remarks || '',
        };
      });

      // Sort by roll number or name
      rows.sort((a, b) => {
        const rollA = parseInt(a.student.rollNumber || '9999', 10);
        const rollB = parseInt(b.student.rollNumber || '9999', 10);
        return rollA - rollB;
      });

      setRoster(rows);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load exam marks roster');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Grade helper
  const deriveGrade = (marks: number | '' | null, maxMarks: number): string => {
    if (marks === '' || marks === null || isNaN(Number(marks))) return '';
    const pct = (Number(marks) / maxMarks) * 100;
    if (pct >= 90) return 'A1';
    if (pct >= 80) return 'A2';
    if (pct >= 70) return 'B1';
    if (pct >= 60) return 'B2';
    if (pct >= 50) return 'C1';
    if (pct >= 40) return 'C2';
    if (pct >= 33) return 'D';
    return 'E';
  };

  // Handle Marks input change
  const handleMarksChange = (index: number, val: string) => {
    const updated = [...roster];
    const row = updated[index];

    if (val === '') {
      row.marksObtained = '';
      row.grade = '';
    } else {
      const num = Number(val);
      row.marksObtained = num;
      if (currentSchedule) {
        row.grade = deriveGrade(num, currentSchedule.maxMarks);
      }
      row.isAbsent = false;
    }
    setRoster(updated);
  };

  // Handle Absent toggle
  const handleToggleAbsent = (index: number) => {
    const updated = [...roster];
    const row = updated[index];
    row.isAbsent = !row.isAbsent;
    if (row.isAbsent) {
      row.marksObtained = null;
      row.grade = 'AB';
    } else {
      row.marksObtained = '';
      row.grade = '';
    }
    setRoster(updated);
  };

  // Handle Exempt toggle
  const handleToggleExempt = (index: number) => {
    const updated = [...roster];
    const row = updated[index];
    row.isExempt = !row.isExempt;
    if (row.isExempt) {
      row.marksObtained = null;
      row.grade = 'EX';
    } else {
      row.marksObtained = '';
      row.grade = '';
    }
    setRoster(updated);
  };

  // Handle Remarks change
  const handleRemarksChange = (index: number, remarks: string) => {
    const updated = [...roster];
    updated[index].remarks = remarks;
    setRoster(updated);
  };

  // Save Marks Register
  const handleSaveMarks = async () => {
    if (!currentSchedule) return;

    // Validate that no mark exceeds maxMarks
    for (const r of roster) {
      if (
        !r.isAbsent &&
        !r.isExempt &&
        r.marksObtained !== '' &&
        r.marksObtained !== null &&
        Number(r.marksObtained) > currentSchedule.maxMarks
      ) {
        error(
          `Marks for student ${r.student.firstName} (${r.marksObtained}) exceeds max marks (${currentSchedule.maxMarks})`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const marksPayload = roster
        .filter((r) => r.isAbsent || r.isExempt || (r.marksObtained !== '' && r.marksObtained !== null))
        .map((r) => ({
          studentId: r.student.id,
          marksObtained:
            r.isAbsent || r.isExempt || r.marksObtained === ''
              ? null
              : Number(r.marksObtained),
          isAbsent: r.isAbsent,
          isExempt: r.isExempt,
          remarks: r.remarks || undefined,
        }));

      if (marksPayload.length === 0) {
        error('Please enter marks for at least one student before saving');
        setSaving(false);
        return;
      }

      const res = await ExamService.enterMarks(currentSchedule.id, marksPayload);
      success(`Successfully saved marks for ${res.totalEntered} students`);
      loadRoster(currentSchedule.id);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  // Compute live roster stats
  const enteredCount = roster.filter(
    (r) => r.isAbsent || r.isExempt || (r.marksObtained !== '' && r.marksObtained !== null)
  ).length;
  const absentCount = roster.filter((r) => r.isAbsent).length;
  const validScores = roster
    .filter((r) => !r.isAbsent && !r.isExempt && r.marksObtained !== '' && r.marksObtained !== null)
    .map((r) => Number(r.marksObtained));
  const avgScore =
    validScores.length > 0
      ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
      : '0.0';

  const filteredRoster = roster.filter((r) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${r.student.firstName} ${r.student.lastName}`.toLowerCase();
    const adm = (r.student.admissionNumber || '').toLowerCase();
    const roll = (r.student.rollNumber || '').toLowerCase();
    return fullName.includes(q) || adm.includes(q) || roll.includes(q);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <button
            onClick={() => navigate('/exams/terms')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Exam Terms
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Marks Entry Register
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Input student scores, derive letter grades automatically, and maintain paper rosters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={saving || !currentSchedule || roster.length === 0}
            onClick={handleSaveMarks}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Marks...' : 'Save Marks Register'}
          </button>
        </div>
      </div>

      {/* Selector Toolbar: Session, Term, and Scheduled Paper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Academic Session
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isCurrent ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Exam Term
          </label>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Scheduled Exam Paper
          </label>
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Select Exam Paper</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.class?.name} — {s.subject?.name} ({new Date(s.examDate).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Paper Details Card & Stats Bar */}
      {currentSchedule && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                {currentSchedule.class?.name}
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                {currentSchedule.subject?.name}{' '}
                <span className="text-sm font-normal text-gray-500">
                  ({currentSchedule.subject?.code})
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(currentSchedule.examDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {currentSchedule.startTime} – {currentSchedule.endTime}
                </span>
                <span>
                  Max Marks: <strong>{currentSchedule.maxMarks}</strong>
                </span>
                <span>
                  Pass Marks: <strong>{currentSchedule.passMarks}</strong>
                </span>
                {currentSchedule.roomNumber && (
                  <span>
                    Room: <strong>{currentSchedule.roomNumber}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 px-3 py-2 rounded-lg text-center border">
                <div className="text-xs text-gray-500">Enrolled</div>
                <div className="text-base font-bold text-gray-900">{roster.length}</div>
              </div>
              <div className="bg-indigo-50 px-3 py-2 rounded-lg text-center border border-indigo-100">
                <div className="text-xs text-indigo-600">Evaluated</div>
                <div className="text-base font-bold text-indigo-700">{enteredCount}</div>
              </div>
              <div className="bg-amber-50 px-3 py-2 rounded-lg text-center border border-amber-100">
                <div className="text-xs text-amber-600">Absent</div>
                <div className="text-base font-bold text-amber-700">{absentCount}</div>
              </div>
              <div className="bg-emerald-50 px-3 py-2 rounded-lg text-center border border-emerald-100">
                <div className="text-xs text-emerald-600">Avg Score</div>
                <div className="text-base font-bold text-emerald-700">{avgScore}</div>
              </div>
            </div>
          </div>

          {/* Search roster filter */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search student by name, roll, admission..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="text-xs text-gray-500">
              Showing {filteredRoster.length} of {roster.length} students
            </div>
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Loading student roster and marks...
          </div>
        ) : !currentSchedule ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Select an exam term and paper above to start marks entry.
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold w-16 text-center">Roll</th>
                  <th className="py-3 px-4 font-semibold">Student Name & ID</th>
                  <th className="py-3 px-4 font-semibold">Section</th>
                  <th className="py-3 px-4 font-semibold w-40">
                    Marks Obtained (Max: {currentSchedule.maxMarks})
                  </th>
                  <th className="py-3 px-4 font-semibold text-center w-20">Absent</th>
                  <th className="py-3 px-4 font-semibold text-center w-20">Exempt</th>
                  <th className="py-3 px-4 font-semibold text-center w-24">Grade</th>
                  <th className="py-3 px-4 font-semibold">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRoster.map((row) => {
                  const originalIndex = roster.findIndex((r) => r.student.id === row.student.id);
                  const isOverMax =
                    !row.isAbsent &&
                    !row.isExempt &&
                    row.marksObtained !== '' &&
                    row.marksObtained !== null &&
                    Number(row.marksObtained) > currentSchedule.maxMarks;

                  return (
                    <tr
                      key={row.student.id}
                      className={`hover:bg-gray-50/50 ${
                        row.isAbsent ? 'bg-amber-50/30' : row.isExempt ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-gray-700">
                        {row.student.rollNumber || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">
                          {row.student.firstName} {row.student.lastName}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {row.student.admissionNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-gray-700">
                        {row.student.section?.name || 'A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={currentSchedule.maxMarks}
                            step={0.5}
                            disabled={row.isAbsent || row.isExempt}
                            value={row.marksObtained === null ? '' : row.marksObtained}
                            onChange={(e) => handleMarksChange(originalIndex, e.target.value)}
                            placeholder="0 - 100"
                            className={`w-32 px-3 py-1.5 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 ${
                              isOverMax
                                ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-400'
                                : 'border-gray-300 focus:ring-indigo-500'
                            } disabled:bg-gray-100 disabled:text-gray-400`}
                          />
                          {isOverMax && (
                            <span className="block text-[10px] text-red-500 mt-0.5">
                              Exceeds {currentSchedule.maxMarks}!
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={row.isAbsent}
                          onChange={() => handleToggleAbsent(originalIndex)}
                          className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={row.isExempt}
                          onChange={() => handleToggleExempt(originalIndex)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.grade ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                              row.grade === 'A1' || row.grade === 'A2'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.grade === 'B1' || row.grade === 'B2'
                                ? 'bg-blue-100 text-blue-800'
                                : row.grade === 'C1' || row.grade === 'C2' || row.grade === 'D'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {row.grade}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => handleRemarksChange(originalIndex, e.target.value)}
                          placeholder="Optional feedback..."
                          className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarksEntryPage;
