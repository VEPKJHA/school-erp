import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Layers,
  Grid,
  Users,
  ArrowUpRight,
  ShieldCheck,
  Building,
  School,
  Clock,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { AuthService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { DashboardStats } from '../../types';
import { Badge } from '../../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await AuthService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-600/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                Active Tenant Session
              </span>
              <span className="text-xs text-indigo-100">
                {stats?.currentSession ? `Session: ${stats.currentSession}` : 'No Session Selected'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2">
              Welcome back, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              {user?.school
                ? `${user.school.name} (Code: ${user.school.code}) • ${user.school.city || 'India'}`
                : 'Central System Platform Administrator'}
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-indigo-900/40 p-3 rounded-xl border border-indigo-400/20 backdrop-blur-md">
            <ShieldCheck className="w-5 h-5 text-indigo-300" />
            <div className="text-xs">
              <span className="text-indigo-200 block">Authenticated Role</span>
              <span className="font-bold text-white">{user?.role?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Current Session */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current Session
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : stats?.currentSession || 'N/A'}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <Clock className="w-3 h-3 mr-1 text-slate-400" />
              <span>Active Academic Period</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Classes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Classes
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : stats?.totalClasses ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Configured grade levels</p>
          </div>
        </div>

        {/* Metric 3: Sections */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Sections
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : stats?.totalSections ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active class divisions</p>
          </div>
        </div>

        {/* Metric 4: Users */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Staff & Users
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : stats?.activeUsers ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active system accounts</p>
          </div>
        </div>
      </div>

      {/* Operations Quick Links */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">Operations & Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            to="/students"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                Students Directory
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Student profiles, demographics, parent contacts, addresses, and document dossier.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600">
              <span>View directory</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admissions"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Admissions & Enrollment
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Admission application review pipeline, document check, approval, and section allotment.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600">
              <span>Manage admissions</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            to="/classes"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                Classes & Curriculum
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Grade levels from Class 1 to 12 with custom codes and numeric sequence ordering.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-600">
              <span>View classes</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            to="/users"
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                Role & Staff Management
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Staff users, Teachers, Principals, Accountants with granular RBAC permissions.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-purple-600">
              <span>Manage staff</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
