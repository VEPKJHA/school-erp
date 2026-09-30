import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  User,
  GraduationCap,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Printer,
  FileText,
  Receipt,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';
import { FeeService } from '../../services/fee.service';
import { StudentService } from '../../services/student.service';
import { StudentFeeLedger, Student } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const StudentFeeLedgerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState<Student[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<StudentFeeLedger[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  // Read initial studentId from query params
  const studentIdParam = searchParams.get('studentId');

  // Load student if studentIdParam is provided
  useEffect(() => {
    if (studentIdParam) {
      loadStudentAndLedger(studentIdParam);
    }
  }, [studentIdParam]);

  const loadStudentAndLedger = async (studentId: string) => {
    setIsLoadingLedger(true);
    try {
      const [stu, entries] = await Promise.all([
        StudentService.getStudentById(studentId),
        FeeService.getStudentLedger(studentId),
      ]);
      setSelectedStudent(stu);
      setLedgerEntries(entries);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load student fee ledger');
    } finally {
      setIsLoadingLedger(false);
    }
  };

  // Search students for autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setStudentSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingStudents(true);
      try {
        const res = await StudentService.getStudents({
          search: searchQuery.trim(),
          pageSize: 6,
        });
        setStudentSearchResults(res.students);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStudent = (student: Student) => {
    setSearchParams({ studentId: student.id });
    setSelectedStudent(student);
    setSearchQuery('');
    setStudentSearchResults([]);
    loadStudentAndLedger(student.id);
  };

  // Computed summary from ledger
  const totals = useMemo(() => {
    let debits = 0;
    let credits = 0;

    ledgerEntries.forEach((entry) => {
      const amt = Number(entry.amount || 0);
      if (entry.type === 'DEBIT') {
        debits += amt;
      } else {
        credits += amt;
      }
    });

    const netBalance = debits - credits;

    return {
      debits,
      credits,
      netBalance,
    };
  }, [ledgerEntries]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Student Fee Ledger & Account Statement
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official transactional statement showing double-entry debits, credits, and live balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedStudent && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm transition"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Print Statement
            </button>
          )}

          <button
            onClick={() => navigate('/fees/invoices')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <FileText className="w-4 h-4" />
            Fee Invoices
          </button>
        </div>
      </div>

      {/* Student Selector Search Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm relative">
        <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
          Select or Search Student
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Type student name or admission number (e.g. STU-2026-000001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
          {isSearchingStudents && (
            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Dropdown search results */}
        {studentSearchResults.length > 0 && (
          <div className="absolute left-5 right-5 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
            {studentSearchResults.map((stu) => (
              <div
                key={stu.id}
                onClick={() => handleSelectStudent(stu)}
                className="px-4 py-3 hover:bg-indigo-50/60 cursor-pointer flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {stu.firstName.charAt(0)}
                    {stu.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {stu.firstName} {stu.lastName}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {stu.admissionNumber} • {stu.class?.name || 'Class'} (
                      {stu.section?.name || 'Sec'})
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* When No Student is Selected */}
      {!selectedStudent && !isLoadingLedger && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No Student Selected</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Search for a student using their name or admission number in the box above to inspect
            their complete financial ledger, invoice history, and collection credits.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoadingLedger && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading student statement...</p>
        </div>
      )}

      {/* Selected Student Information & Financial Summary Cards */}
      {selectedStudent && !isLoadingLedger && (
        <>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Student Demographics */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-500/20">
                  {selectedStudent.firstName.charAt(0)}
                  {selectedStudent.lastName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h2>
                    <Badge variant={selectedStudent.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {selectedStudent.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1.5">
                    <span>
                      Admission No:{' '}
                      <strong className="text-slate-800 font-mono">
                        {selectedStudent.admissionNumber}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Class:{' '}
                      <strong className="text-slate-800">
                        {selectedStudent.class?.name || '—'} -{' '}
                        {selectedStudent.section?.name || '—'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Roll No:{' '}
                      <strong className="text-slate-800">
                        {selectedStudent.rollNumber || 'N/A'}
                      </strong>
                    </span>
                    {selectedStudent.gender && (
                      <>
                        <span>•</span>
                        <span>Gender: {selectedStudent.gender}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Status Tag */}
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                {totals.netBalance <= 0 ? (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase">Account Status</p>
                      <p className="text-sm font-bold">All Dues Cleared</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase">Account Status</p>
                      <p className="text-sm font-bold">Dues Outstanding</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ledger Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Total Debits (Billed)
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{totals.debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Total Credits (Paid)
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  ₹{totals.credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Net Balance Remaining
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    totals.netBalance > 0 ? 'text-amber-600' : 'text-slate-900'
                  }`}
                >
                  ₹{totals.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  totals.netBalance > 0
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Chronological Statement Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden" id="printable-statement">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chronological Account Statement</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete history of invoices issued and collections posted for this student.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {ledgerEntries.length} total ledger entries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Entry Type</th>
                    <th className="px-5 py-3.5">Description / Particulars</th>
                    <th className="px-5 py-3.5">Ref Type</th>
                    <th className="px-5 py-3.5 text-right">Debit (+)</th>
                    <th className="px-5 py-3.5 text-right">Credit (-)</th>
                    <th className="px-5 py-3.5 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No ledger transactions found for this student.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((entry) => {
                      const isDebit = entry.type === 'DEBIT';
                      const amt = Number(entry.amount);
                      const bal = Number(entry.balanceAfter);

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                            {new Date(entry.entryDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {isDebit ? (
                              <Badge variant="danger">DEBIT</Badge>
                            ) : (
                              <Badge variant="success">CREDIT</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-medium text-slate-900 text-sm">
                              {entry.description}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                            {entry.referenceType}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-medium text-rose-600 whitespace-nowrap">
                            {isDebit ? `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-medium text-emerald-600 whitespace-nowrap">
                            {!isDebit ? `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                            ₹{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {ledgerEntries.length > 0 && (
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 text-xs font-bold text-slate-900">
                    <tr>
                      <td colSpan={4} className="px-5 py-3.5 text-right uppercase">
                        Account Totals:
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-rose-700">
                        ₹{totals.debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-emerald-700">
                        ₹{totals.credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-indigo-700 text-sm">
                        ₹{totals.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
