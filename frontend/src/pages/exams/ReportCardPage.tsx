import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  Calendar,
  Printer,
  FileText,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { ExamService } from '../../services/exam.service';
import { AcademicService } from '../../services/academic.service';
import { ClassService } from '../../services/class.service';
import { StudentService } from '../../services/student.service';
import {
  ExamTerm,
  StudentReportCard,
  AcademicSession,
  ClassItem,
  Section,
  Student,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const ReportCardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { error } = useToast();

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    searchParams.get('studentId') || ''
  );

  const [reportCard, setReportCard] = useState<StudentReportCard | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Initial Load: Sessions & Classes
  useEffect(() => {
    loadSessions();
    loadClasses();
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

  const loadClasses = async () => {
    try {
      const data = await ClassService.getClasses();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (err: any) {
      error('Failed to load classes');
    }
  };

  // Load Terms when Session changes
  useEffect(() => {
    if (selectedSessionId) {
      loadTerms(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadTerms = async (sessionId: string) => {
    try {
      const data = await ExamService.getTerms(sessionId);
      setTerms(data);
      if (data.length > 0) {
        setSelectedTermId(data[0].id);
      } else {
        setSelectedTermId('');
      }
    } catch (err: any) {
      error('Failed to load exam terms');
    }
  };

  // Load Students when Class changes
  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId]);

  const loadStudents = async (classId: string) => {
    try {
      const res = await StudentService.getStudents({ classId, pageSize: 100 });
      setStudents(res.students);
      if (res.students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(res.students[0].id);
      }
    } catch (err: any) {
      error('Failed to load students');
    }
  };

  // Generate Report Card when Student or Term changes
  useEffect(() => {
    if (selectedStudentId && selectedTermId) {
      generateReport(selectedStudentId, selectedTermId);
    } else {
      setReportCard(null);
    }
  }, [selectedStudentId, selectedTermId]);

  const generateReport = async (studentId: string, termId: string) => {
    setLoading(true);
    try {
      const data = await ExamService.getStudentReportCard(studentId, termId);
      setReportCard(data);
    } catch (err: any) {
      setReportCard(null);
      error(err.response?.data?.message || 'Failed to generate report card');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Action / Filter Bar — Hidden in Print */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-7 h-7 text-indigo-600" />
              Student Progress Report Card
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Official academic performance dossier with attendance records and grading breakdown.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={!reportCard}
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
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
                  {s.name}
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
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.firstName} {st.lastName} ({st.admissionNumber})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Official Report Card Printable Canvas */}
      {loading ? (
        <div className="bg-white p-16 rounded-xl border border-gray-100 shadow-sm text-center text-sm text-gray-500">
          Generating official progress report card...
        </div>
      ) : !reportCard ? (
        <div className="bg-white p-16 rounded-xl border border-gray-100 shadow-sm text-center text-sm text-gray-400">
          Select an academic session, exam term, class, and student above to generate the report card.
        </div>
      ) : (
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-200 shadow-lg print:shadow-none print:border-none print:p-0 space-y-8 font-sans text-gray-900">
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-indigo-900 pb-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-indigo-900">
              <Building className="w-8 h-8" />
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider">
                {user?.school?.name || 'DELHI PUBLIC SCHOOL'}
              </h1>
            </div>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Affiliated to CBSE / State Board • ISO 9001:2015 Certified
            </p>
            <div className="pt-2">
              <span className="inline-block bg-indigo-900 text-white font-bold text-xs uppercase px-4 py-1 rounded-full tracking-wider">
                STUDENT PROGRESS REPORT CARD — {reportCard.term.name.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Academic Session: {reportCard.student.session?.name} • Term Code:{' '}
              {reportCard.term.code}
            </p>
          </div>

          {/* Student Profile Info Grid */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-500 block">Student Full Name:</span>
              <strong className="text-sm text-gray-900 font-bold">
                {reportCard.student.firstName} {reportCard.student.lastName}
              </strong>
            </div>

            <div>
              <span className="text-gray-500 block">Admission Number:</span>
              <strong className="text-sm font-mono text-gray-900">
                {reportCard.student.admissionNumber}
              </strong>
            </div>

            <div>
              <span className="text-gray-500 block">Class & Section:</span>
              <strong className="text-sm text-gray-900">
                {reportCard.student.class?.name} - {reportCard.student.section?.name || 'A'}
              </strong>
            </div>

            <div>
              <span className="text-gray-500 block">Roll Number:</span>
              <strong className="text-sm text-gray-900">
                {reportCard.student.rollNumber || 'N/A'}
              </strong>
            </div>

            <div>
              <span className="text-gray-500 block">Date of Birth:</span>
              <strong className="text-gray-900">
                {reportCard.student.dateOfBirth
                  ? new Date(reportCard.student.dateOfBirth).toLocaleDateString()
                  : 'N/A'}
              </strong>
            </div>

            <div>
              <span className="text-gray-500 block">Gender:</span>
              <strong className="text-gray-900">{reportCard.student.gender}</strong>
            </div>

            <div>
              <span className="text-gray-500 block">Student Code:</span>
              <strong className="font-mono text-gray-900">
                {reportCard.student.studentCode}
              </strong>
            </div>

            <div>
              <span className="text-gray-500 block">Parent / Guardian:</span>
              <strong className="text-gray-900">
                {reportCard.student.parents && reportCard.student.parents.length > 0
                  ? `${reportCard.student.parents[0].parent?.firstName || ''} ${
                      reportCard.student.parents[0].parent?.lastName || ''
                    }`
                  : '—'}
              </strong>
            </div>
          </div>

          {/* Academic Evaluation Marks Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              Part I: Scholastic Performance
            </h3>

            {reportCard.subjects.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border">
                No exam paper marks recorded for this student in this term yet.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-indigo-50/80 text-indigo-950 font-bold uppercase tracking-wider border-b border-indigo-100">
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-center">Max Marks</th>
                      <th className="py-3 px-4 text-center">Pass Marks</th>
                      <th className="py-3 px-4 text-center">Marks Obtained</th>
                      <th className="py-3 px-4 text-center">Percentage</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportCard.subjects.map((sub) => (
                      <tr key={sub.subjectId} className="hover:bg-gray-50/40">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900">{sub.subjectName}</span>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {sub.subjectCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-gray-600">
                          {sub.subjectType}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold">{sub.maxMarks}</td>
                        <td className="py-3 px-4 text-center text-gray-500">{sub.passMarks}</td>
                        <td className="py-3 px-4 text-center font-bold text-sm">
                          {sub.isAbsent ? (
                            <span className="text-amber-600">ABSENT</span>
                          ) : sub.isExempt ? (
                            <span className="text-blue-600">EXEMPT</span>
                          ) : sub.marksObtained !== null ? (
                            sub.marksObtained
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {sub.marksObtained !== null && !sub.isAbsent
                            ? `${sub.percentage}%`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded font-bold text-xs ${
                              sub.grade === 'A1' || sub.grade === 'A2'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.grade === 'B1' || sub.grade === 'B2'
                                ? 'bg-blue-100 text-blue-800'
                                : sub.grade === 'C1' || sub.grade === 'C2' || sub.grade === 'D'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {sub.grade || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {sub.isPassing ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle className="w-3.5 h-3.5" /> Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                              <XCircle className="w-3.5 h-3.5" /> Fail
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot>
                    <tr className="bg-gray-100/70 font-bold text-gray-900 border-t-2 border-gray-300">
                      <td className="py-3 px-4" colSpan={2}>
                        GRAND TOTAL
                      </td>
                      <td className="py-3 px-4 text-center">{reportCard.summary.totalMaxMarks}</td>
                      <td className="py-3 px-4 text-center">—</td>
                      <td className="py-3 px-4 text-center text-sm text-indigo-700">
                        {reportCard.summary.totalObtainedMarks}
                      </td>
                      <td className="py-3 px-4 text-center text-indigo-700">
                        {reportCard.summary.overallPercentage}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-indigo-900 text-white rounded text-xs">
                          {reportCard.summary.overallGrade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-black uppercase tracking-wider text-xs ${
                            reportCard.summary.finalResult === 'PASSED'
                              ? 'text-emerald-700'
                              : reportCard.summary.finalResult === 'COMPARTMENT'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {reportCard.summary.finalResult}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Part II & Summary: Attendance Dossier and Result Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Integrated Phase 4 Attendance Dossier */}
            <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 space-y-3">
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Part II: Attendance Profile (Session Record)
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block">Total Working Days:</span>
                  <strong className="text-sm text-gray-900">
                    {reportCard.attendance.totalDays} Days
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Days Present:</span>
                  <strong className="text-sm text-emerald-700">
                    {reportCard.attendance.presentDays} Days
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Days Absent:</span>
                  <strong className="text-sm text-red-600">
                    {reportCard.attendance.absentDays} Days
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Attendance Percentage:</span>
                  <strong
                    className={`text-sm ${
                      reportCard.attendance.attendancePercentage >= 75
                        ? 'text-emerald-700'
                        : 'text-red-600'
                    }`}
                  >
                    {reportCard.attendance.attendancePercentage}%
                  </strong>
                </div>
              </div>
              {reportCard.attendance.attendancePercentage < 75 && (
                <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Warning: Attendance is below mandatory 75% minimum threshold.
                </p>
              )}
            </div>

            {/* Overall Result Summary Card */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Part III: Final Academic Outcome
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Aggregate Marks:</span>
                  <strong>
                    {reportCard.summary.totalObtainedMarks} /{' '}
                    {reportCard.summary.totalMaxMarks} ({reportCard.summary.overallPercentage}%)
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Overall Letter Grade:</span>
                  <strong className="text-indigo-700 font-bold">
                    Grade {reportCard.summary.overallGrade}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Papers Passed:</span>
                  <strong>
                    {reportCard.summary.subjectsPassed} of{' '}
                    {reportCard.summary.totalSubjects}
                  </strong>
                </div>
                <div className="flex justify-between py-1 pt-2">
                  <span className="text-sm font-bold text-gray-900">Term Result:</span>
                  <span
                    className={`text-sm font-black uppercase px-3 py-0.5 rounded ${
                      reportCard.summary.finalResult === 'PASSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : reportCard.summary.finalResult === 'COMPARTMENT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {reportCard.summary.finalResult}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Signature Blocks */}
          <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs text-gray-600 border-t border-gray-200">
            <div className="space-y-8">
              <div className="h-10"></div>
              <div className="border-t border-gray-400 pt-2 font-semibold">
                Class Teacher Signature
              </div>
            </div>

            <div className="space-y-8">
              <div className="h-10"></div>
              <div className="border-t border-gray-400 pt-2 font-semibold">
                Exam Controller / In-Charge
              </div>
            </div>

            <div className="space-y-8">
              <div className="h-10"></div>
              <div className="border-t border-gray-400 pt-2 font-semibold">
                Principal Signature & Seal
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCardPage;
