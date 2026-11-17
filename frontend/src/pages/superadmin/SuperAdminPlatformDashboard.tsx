import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  GraduationCap,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Loader2,
  DollarSign,
  Activity,
  Layers,
} from 'lucide-react';
import { SchoolService } from '../../services/school.service';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const SuperAdminPlatformDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTenant, setSearchTenant] = useState('');
  const { success, error } = useToast();
  const navigate = useNavigate();

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      const res = await SchoolService.getPlatformOverview();
      setData(res);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load platform data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  const handleExportCSV = () => {
    if (!data?.tenantUtilization || data.tenantUtilization.length === 0) {
      error('No tenant data available to export');
      return;
    }

    const headers = [
      'School Name',
      'School Code',
      'City',
      'State',
      'Status',
      'Current Session',
      'Total Students',
      'Total Staff',
      'Invoices Billed',
      'Total Billed (INR)',
      'Total Collected (INR)',
      'Total Pending (INR)',
      'Registered Date',
    ];

    const rows = data.tenantUtilization.map((s: any) => [
      `"${s.name.replace(/"/g, '""')}"`,
      s.code,
      `"${s.city || ''}"`,
      `"${s.state || ''}"`,
      s.isActive ? 'ACTIVE' : 'SUSPENDED',
      `"${s.currentSession}"`,
      s.totalStudents,
      s.totalStaff,
      s.totalInvoices,
      s.totalBilled,
      s.totalCollected,
      s.totalPending,
      new Date(s.createdAt).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `educore_saas_platform_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Platform utilization report exported to CSV!');
  };

  const formatCurrency = (amt: number | string) => {
    return `₹${Number(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <span className="text-sm font-semibold">Aggregating cross-tenant SaaS platform KPIs...</span>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const filteredTenants = (data?.tenantUtilization || []).filter((s: any) =>
    (s.name || '').toLowerCase().includes(searchTenant.toLowerCase()) ||
    (s.code || '').toLowerCase().includes(searchTenant.toLowerCase()) ||
    (s.city || '').toLowerCase().includes(searchTenant.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* SaaS Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full">
                Global SaaS Platform Admin
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Live Multi-Tenant Aggregation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
              Platform Master Operations Center
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Centralized visibility across all provisioned educational institutions, student enrollments, system accounts, and network-wide fee collection health.
            </p>
          </div>

          {/* Quick Platform Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/superadmin/schools')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New School</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Platform Report (CSV)</span>
            </button>

            <button
              onClick={loadPlatformData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Refresh Platform Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Tenant SaaS KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Registered Schools */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total School Tenants
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {kpis.totalSchools || 0}
            </div>
            <div className="flex items-center space-x-2 mt-2 text-xs">
              <span className="flex items-center text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {kpis.activeSchools || 0} Active
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center text-rose-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {kpis.suspendedSchools || 0} Suspended
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Platform Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Platform-Wide Students
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {kpis.totalStudents || 0}
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center">
              <span className="text-purple-600 font-semibold mr-1">
                {kpis.activeStudents || 0}
              </span>
              actively enrolled across all institutions
            </p>
          </div>
        </div>

        {/* KPI 3: Total Staff & Admins */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Staff & Admins
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {kpis.totalStaff || 0}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              School leaders, teachers, and accountants onboarded
            </p>
          </div>
        </div>

        {/* KPI 4: Platform Fee Collection & Dues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Network Invoiced Amount
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {formatCurrency(kpis.totalBilled)}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-emerald-700 font-semibold font-mono">
                Paid: {formatCurrency(kpis.totalCollected)}
              </span>
              <span className="text-rose-600 font-semibold font-mono">
                Due: {formatCurrency(kpis.totalPending)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tenant Health & Utilization Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Tenant Health & Utilization Report
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live breakdown of schools, student density, staffing, and fee collection across all registered tenants.
            </p>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTenant}
              onChange={(e) => setSearchTenant(e.target.value)}
              placeholder="Search school name, code, or city..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Tenant Institution</th>
                <th className="px-4 py-3">City / State</th>
                <th className="px-4 py-3 text-center">Students</th>
                <th className="px-4 py-3 text-center">Staff</th>
                <th className="px-4 py-3 text-right">Total Billed</th>
                <th className="px-4 py-3 text-right">Total Collected</th>
                <th className="px-4 py-3 text-right">Outstanding Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400 text-xs">
                    No matching tenants found.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.code}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">
                            {s.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Session: {s.currentSession}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-slate-700 font-medium block">
                        {s.city ? `${s.city}, ${s.state}` : 'N/A'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {s.phone || s.email || ''}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-slate-800 text-sm">
                      {s.totalStudents}
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-slate-800 text-sm">
                      {s.totalStaff}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-800">
                      {formatCurrency(s.totalBilled)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-600">
                      {formatCurrency(s.totalCollected)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-rose-600">
                      {formatCurrency(s.totalPending)}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={s.isActive ? 'success' : 'danger'}>
                        {s.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to="/superadmin/schools"
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Recent Onboardings & Platform Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recently Provisioned Institutions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Recently Provisioned Tenants
              </h3>
              <Link
                to="/superadmin/schools"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {(data?.recentSchools || []).map((school: any) => (
                <div key={school.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {school.code}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{school.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {school.city}, {school.state} • Onboarded: {new Date(school.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={school.isActive ? 'success' : 'danger'}>
                    {school.isActive ? 'Active' : 'Suspended'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => navigate('/superadmin/schools')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <span>Launch School Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Platform Cross-Tenant Audit Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                Platform Activity & Security Audit Trail
              </h3>
              <span className="text-[11px] text-slate-400">Latest actions</span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 max-h-[300px] overflow-y-auto">
              {(data?.recentAuditLogs || []).map((log: any) => (
                <div key={log.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Institution: <strong className="text-slate-800">{log.school?.name || 'Platform Level'}</strong> ({log.school?.code || 'ROOT'})
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Triggered by: {log.user?.firstName || 'System'} {log.user?.lastName || ''} ({log.user?.email || 'N/A'})
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400">
              All events are immutably signed and timestamped in PostgreSQL / MySQL audit records.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
