import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  FileText,
  Receipt,
  Layers,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  ArrowUpRight,
  DollarSign,
  Wallet,
  Building,
  Loader2,
} from 'lucide-react';
import { FeeService } from '../../services/fee.service';
import { AcademicService } from '../../services/academic.service';
import { FeeSummaryReport, FeePayment, AcademicSession } from '../../types';
import { Badge } from '../../components/common/Badge';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../context/ToastContext';

export const FeeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { error } = useToast();

  const [summary, setSummary] = useState<FeeSummaryReport | null>(null);
  const [recentPayments, setRecentPayments] = useState<FeePayment[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sess = await AcademicService.getSessions();
        setSessions(sess);
        const current = sess.find((s) => s.isCurrent);
        if (current) {
          setSelectedSessionId(current.id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadSessions();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [sumData, payData] = await Promise.all([
          FeeService.getFeeSummary(selectedSessionId || undefined),
          FeeService.getPayments({ page: 1, pageSize: 8 }),
        ]);
        setSummary(sumData);
        setRecentPayments(payData.payments);
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load fee dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedSessionId]);

  const formatCurrency = (amt: number | string) => {
    return `₹${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Fee Management & Accounts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete billing cycle, fee collection, receipt issuance, and financial ledgers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All Academic Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                Session {s.name} {s.isCurrent ? '(Current)' : ''}
              </option>
            ))}
          </select>

          {hasPermission('fee:payment:create') && (
            <button
              onClick={() => navigate('/fees/invoices')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Collect Fee</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : formatCurrency(summary?.totalBilled || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <span>{summary?.totalInvoices || 0} Total Generated Invoices</span>
            </p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fee Realized (Paid)
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-600">
              {isLoading ? '...' : formatCurrency(summary?.totalCollected || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary?.paidInvoicesCount || 0} Fully Paid • {summary?.partiallyPaidCount || 0}{' '}
              Partial
            </p>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Dues
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-amber-600">
              {isLoading ? '...' : formatCurrency(summary?.totalOutstanding || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary?.unpaidInvoicesCount || 0} Invoices Pending Settlement
            </p>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Status
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-rose-600">
              {isLoading ? '...' : summary?.overdueCount || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Overdue Invoices Past Cut-off Date</p>
          </div>
        </div>
      </div>

      {/* Navigation & Quick Operations */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Fee Operations & Portals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/fees/invoices"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                Invoices & Billing
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Generate class-wise bulk fee invoices, partial fee bills, and late charges.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600">
              <span>View invoices</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/fees/payments"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Receipts & Payments
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Payment transaction register, official receipts (<code className="font-mono">REC/YYYY/XXXXXX</code>), and printouts.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600">
              <span>View receipts</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/fees/structures"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                Fee Structures
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure grade-level fee schedules, frequency, and class itemization templates.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-600">
              <span>Manage templates</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          <Link
            to="/fees/heads"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                Fee Heads & Categories
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage accounts heads: Tuition, Lab, Library, Sports, Transport, and Activities.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-purple-600">
              <span>Manage heads</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* Payment Modes & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Modes Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Collection by Payment Mode</h3>
          {summary?.modeBreakdown && Object.keys(summary.modeBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(summary.modeBreakdown).map(([mode, amt]) => {
                const total = summary.totalCollected || 1;
                const pct = Math.round((amt / total) * 100);
                return (
                  <div key={mode} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{mode}</span>
                      <span className="text-slate-900 font-semibold">{formatCurrency(amt)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No payments collected for the selected period.
            </div>
          )}
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Fee Collection Receipts</h3>
            <Link
              to="/fees/payments"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View All Receipts &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-3 py-2.5">Receipt #</th>
                  <th className="px-3 py-2.5">Student</th>
                  <th className="px-3 py-2.5">Class</th>
                  <th className="px-3 py-2.5">Mode</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No payment records recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-3 font-mono font-bold text-indigo-600">
                        {p.receiptNumber}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {p.student?.firstName} {p.student?.lastName}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {p.student?.class?.name || 'Class'}
                      </td>
                      <td className="px-3 py-3">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-bold text-emerald-600 text-right">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-3 py-3 text-slate-400 text-right">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
