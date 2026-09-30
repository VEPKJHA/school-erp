import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  BookOpen,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  ArrowLeft,
} from 'lucide-react';
import { AttendanceService } from '../../services/attendance.service';
import { ClassService } from '../../services/class.service';
import { ClassItem, Section, MonthlyRegisterReport, AttendanceStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const MonthlyRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();

  const currentDate = new Date();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  const [registerReport, setRegisterReport] = useState<MonthlyRegisterReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Initial Load: Classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const clsData = await ClassService.getClasses();
        setClasses(clsData);
        if (clsData.length > 0) {
          setSelectedClassId(clsData[0].id);
        }
      } catch (err: any) {
        error('Failed to load class list');
      }
    };
    loadClasses();
  }, []);

  // 2. Load Sections
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

  // 3. Load Monthly Register
  const fetchMonthlyRegister = async () => {
    if (!selectedClassId || !selectedSectionId) return;

    setIsLoading(true);
    try {
      const data = await AttendanceService.getMonthlyRegister({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        year: selectedYear,
        month: selectedMonth,
      });
      setRegisterReport(data);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load monthly attendance register');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyRegister();
  }, [selectedClassId, selectedSectionId, selectedYear, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  const getDayStatusPill = (status?: AttendanceStatus) => {
    if (!status) {
      return <span className="text-slate-300 font-mono text-[10px]">—</span>;
    }
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-block w-5 h-5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] leading-5 text-center">
            P
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-block w-5 h-5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] leading-5 text-center">
            A
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-block w-5 h-5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] leading-5 text-center">
            L
          </span>
        );
      case 'HALF_DAY':
        return (
          <span className="inline-block w-5 h-5 rounded bg-sky-100 text-sky-800 font-bold text-[10px] leading-5 text-center">
            H
          </span>
        );
      case 'EXCUSED':
        return (
          <span className="inline-block w-5 h-5 rounded bg-purple-100 text-purple-800 font-bold text-[10px] leading-5 text-center">
            E
          </span>
        );
      default:
        return <span className="text-slate-300 font-mono text-[10px]">—</span>;
    }
  };

  const filteredRegister = (registerReport?.register || []).filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${row.student.firstName} ${row.student.lastName}`.toLowerCase();
    return (
      fullName.includes(term) ||
      row.student.admissionNumber.toLowerCase().includes(term) ||
      (row.student.rollNumber && row.student.rollNumber.toLowerCase().includes(term))
    );
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysArray = Array.from(
    { length: registerReport?.daysInMonth || 30 },
    (_, i) => i + 1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Monthly Attendance Register
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official monthly matrix of student attendance with percentage tracking and defaulter identification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/attendance')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            Daily Register
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Print Register
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Institution Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold uppercase">DEMO PUBLIC GLOBAL ACADEMY</h2>
        <p className="text-xs text-slate-500">
          Monthly Attendance Register • {monthNames[selectedMonth - 1]} {selectedYear}
        </p>
      </div>

      {/* Register Matrix Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <span className="text-xs text-slate-400">
              ({registerReport?.totalStudents || 0} enrolled students)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
              <span>P = Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>
              <span>A = Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
              <span>L = Late</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-500 inline-block"></span>
              <span>H = Half Day</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 sticky left-0 bg-slate-100 z-10 w-12 text-center">
                  Roll
                </th>
                <th className="px-3 py-2.5 sticky left-12 bg-slate-100 z-10 min-w-[140px]">
                  Student Name
                </th>
                {daysArray.map((d) => (
                  <th key={d} className="p-1 text-center font-mono w-7">
                    {d}
                  </th>
                ))}
                <th className="px-2 py-2.5 text-center text-emerald-700 font-bold bg-emerald-50/50">
                  Pres
                </th>
                <th className="px-2 py-2.5 text-center text-rose-700 font-bold bg-rose-50/50">
                  Abs
                </th>
                <th className="px-2 py-2.5 text-center text-indigo-700 font-bold bg-indigo-50/50">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={daysArray.length + 5}
                    className="text-center py-12 text-slate-400"
                  >
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading monthly register matrix...
                  </td>
                </tr>
              ) : filteredRegister.length === 0 ? (
                <tr>
                  <td
                    colSpan={daysArray.length + 5}
                    className="text-center py-12 text-slate-400"
                  >
                    No students registered in this section.
                  </td>
                </tr>
              ) : (
                filteredRegister.map((row, idx) => {
                  const isDefaulter = row.summary.percentage < 75 && row.summary.totalMarked > 5;
                  return (
                    <tr
                      key={row.student.id}
                      className={`hover:bg-slate-50 transition ${
                        isDefaulter ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-center font-mono font-bold text-slate-700 sticky left-0 bg-white">
                        {row.student.rollNumber || idx + 1}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900 sticky left-12 bg-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>
                            {row.student.firstName} {row.student.lastName}
                          </span>
                          {isDefaulter && (
                            <span
                              className="text-[9px] px-1 bg-rose-100 text-rose-700 rounded font-bold"
                              title="Attendance Defaulter (<75%)"
                            >
                              DEF
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Day cells 1..31 */}
                      {daysArray.map((d) => (
                        <td key={d} className="p-0.5 text-center">
                          {getDayStatusPill(row.days[d])}
                        </td>
                      ))}

                      {/* Summary Columns */}
                      <td className="px-2 py-2 text-center font-bold text-emerald-700 bg-emerald-50/30 font-mono">
                        {row.summary.present}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-rose-700 bg-rose-50/30 font-mono">
                        {row.summary.absent}
                      </td>
                      <td
                        className={`px-2 py-2 text-center font-bold font-mono ${
                          isDefaulter
                            ? 'text-rose-600 bg-rose-100/50'
                            : 'text-indigo-700 bg-indigo-50/30'
                        }`}
                      >
                        {row.summary.percentage}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
