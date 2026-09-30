import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  Save,
  Users,
  Search,
  Filter,
  CheckSquare,
  ArrowRight,
  RefreshCw,
  Printer,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { AttendanceService } from '../../services/attendance.service';
import { ClassService } from '../../services/class.service';
import { AcademicService } from '../../services/academic.service';
import { StudentService } from '../../services/student.service';
import {
  ClassItem,
  Section,
  AcademicSession,
  Student,
  AttendanceStatus,
  DailyAttendanceSummary,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

interface StudentRowState {
  student: Student;
  status: AttendanceStatus;
  remarks: string;
}

export const AttendanceRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  // Core selections
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Attendance roster state
  const [roster, setRoster] = useState<StudentRowState[]>([]);
  const [summary, setSummary] = useState<DailyAttendanceSummary | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Initial Load: Academic Sessions & Classes
  useEffect(() => {
    const initData = async () => {
      try {
        const [sessData, classData] = await Promise.all([
          AcademicService.getSessions(),
          ClassService.getClasses(),
        ]);
        setSessions(sessData);
        const current = sessData.find((s) => s.isCurrent) || sessData[0];
        if (current) setSelectedSessionId(current.id);

        setClasses(classData);
        if (classData.length > 0) {
          setSelectedClassId(classData[0].id);
        }
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load initial class & session data');
      }
    };
    initData();
  }, []);

  // 2. When class changes, load sections
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
        error('Failed to load sections for selected class');
      }
    };
    loadSections();
  }, [selectedClassId]);

  // 3. When Section or Date changes, load Section Students and Existing Attendance
  const loadRoster = async () => {
    if (!selectedClassId || !selectedSectionId || !attendanceDate) return;

    setIsLoadingStudents(true);
    try {
      const [studentsRes, existingAttendance, summaryRes] = await Promise.all([
        StudentService.getStudents({
          classId: selectedClassId,
          sectionId: selectedSectionId,
          status: 'ACTIVE',
          pageSize: 100,
        }),
        AttendanceService.getAttendance({
          classId: selectedClassId,
          sectionId: selectedSectionId,
          date: attendanceDate,
        }),
        AttendanceService.getDailySummary({
          classId: selectedClassId,
          sectionId: selectedSectionId,
          date: attendanceDate,
        }).catch(() => null),
      ]);

      const attendanceMap = new Map<string, { status: AttendanceStatus; remarks?: string }>();
      existingAttendance.forEach((rec) => {
        attendanceMap.set(rec.studentId, { status: rec.status, remarks: rec.remarks });
      });

      const initialRows: StudentRowState[] = studentsRes.students.map((stu) => {
        const existing = attendanceMap.get(stu.id);
        return {
          student: stu,
          status: existing ? existing.status : 'PRESENT', // default to Present
          remarks: existing?.remarks || '',
        };
      });

      setRoster(initialRows);
      setSummary(summaryRes);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load student roster');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [selectedClassId, selectedSectionId, attendanceDate]);

  // Fast Bulk Status Actions
  const handleMarkAll = (status: AttendanceStatus) => {
    setRoster((prev) => prev.map((row) => ({ ...row, status })));
  };

  const handleUpdateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRoster((prev) =>
      prev.map((row) => (row.student.id === studentId ? { ...row, status } : row))
    );
  };

  const handleUpdateStudentRemarks = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((row) => (row.student.id === studentId ? { ...row, remarks } : row))
    );
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedSessionId) {
      error('Please select academic session, class, and section');
      return;
    }

    if (roster.length === 0) {
      error('No students found to mark attendance');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        academicSessionId: selectedSessionId,
        date: attendanceDate,
        records: roster.map((r) => ({
          studentId: r.student.id,
          status: r.status,
          remarks: r.remarks.trim() || undefined,
        })),
      };

      await AttendanceService.bulkMarkAttendance(payload);
      success(`Attendance successfully recorded for ${roster.length} students`);
      loadRoster();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter roster by search
  const filteredRoster = roster.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${r.student.firstName} ${r.student.lastName}`.toLowerCase();
    return (
      fullName.includes(term) ||
      r.student.admissionNumber.toLowerCase().includes(term) ||
      (r.student.rollNumber && r.student.rollNumber.toLowerCase().includes(term))
    );
  });

  // Calculate live counts from current state
  const liveStats = {
    total: roster.length,
    present: roster.filter((r) => r.status === 'PRESENT').length,
    absent: roster.filter((r) => r.status === 'ABSENT').length,
    late: roster.filter((r) => r.status === 'LATE').length,
    halfDay: roster.filter((r) => r.status === 'HALF_DAY').length,
    excused: roster.filter((r) => r.status === 'EXCUSED').length,
  };

  const livePercentage =
    liveStats.total > 0
      ? Math.round(
          ((liveStats.present + liveStats.late + liveStats.halfDay * 0.5) / liveStats.total) * 1000
        ) / 10
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-indigo-600" />
            Daily Attendance Register
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Section roster daily attendance recording with fast bulk-marking and instant sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/attendance/monthly')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm transition"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            Monthly Register Matrix
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={isSaving || roster.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Attendance
          </button>
        </div>
      </div>

      {/* Filter and Selection Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {sections.length === 0 ? (
                <option value="">No sections found</option>
              ) : (
                sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Section {sec.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5">
              Attendance Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <p className="text-xs uppercase font-semibold text-slate-400">Total Enrolled</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{liveStats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <p className="text-xs uppercase font-semibold text-emerald-600">Present</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{liveStats.present}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <p className="text-xs uppercase font-semibold text-rose-600">Absent</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{liveStats.absent}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <p className="text-xs uppercase font-semibold text-amber-600">Late</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{liveStats.late}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <p className="text-xs uppercase font-semibold text-sky-600">Half Day</p>
          <p className="text-2xl font-bold text-sky-600 mt-1">{liveStats.halfDay}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-center">
          <p className="text-xs uppercase font-semibold text-indigo-600">Attendance Rate</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{livePercentage}%</p>
        </div>
      </div>

      {/* Roster Controls: Search & Bulk Mark Buttons */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Quick Mark All:</span>
          <button
            onClick={() => handleMarkAll('PRESENT')}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition"
          >
            All Present
          </button>
          <button
            onClick={() => handleMarkAll('ABSENT')}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
          >
            All Absent
          </button>
          <button
            onClick={() => handleMarkAll('LATE')}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition"
          >
            All Late
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 w-16">Roll</th>
                <th className="px-5 py-3.5">Student Details</th>
                <th className="px-5 py-3.5 text-center">Attendance Status</th>
                <th className="px-5 py-3.5">Remarks / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingStudents ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading section student roster...
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No active students found in this section.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((row, idx) => {
                  const stu = row.student;
                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">
                        {stu.rollNumber || idx + 1}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {stu.firstName} {stu.lastName}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {stu.admissionNumber} • {stu.gender}
                        </div>
                      </td>

                      {/* Fast Toggle Status Buttons */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateStudentStatus(stu.id, 'PRESENT')}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${
                              row.status === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            P
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStudentStatus(stu.id, 'ABSENT')}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${
                              row.status === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-rose-700'
                            }`}
                          >
                            A
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStudentStatus(stu.id, 'LATE')}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${
                              row.status === 'LATE'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-slate-600 hover:text-amber-700'
                            }`}
                          >
                            L
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStudentStatus(stu.id, 'HALF_DAY')}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${
                              row.status === 'HALF_DAY'
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-sky-700'
                            }`}
                          >
                            HD
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStudentStatus(stu.id, 'EXCUSED')}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${
                              row.status === 'EXCUSED'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-purple-700'
                            }`}
                          >
                            EX
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <input
                          type="text"
                          placeholder="Optional remarks (e.g. sick leave, late bus)..."
                          value={row.remarks}
                          onChange={(e) => handleUpdateStudentRemarks(stu.id, e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-600 transition"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Save Prompt */}
        {roster.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Recorded date:{' '}
              <strong className="text-slate-800 font-mono">{attendanceDate}</strong> • Click
              "Save Attendance" to persist changes to database.
            </span>
            <button
              onClick={handleSaveAttendance}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Attendance Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
