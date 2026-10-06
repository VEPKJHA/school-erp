import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Grid,
  Users,
  GraduationCap,
  CreditCard,
  Building2,
  FileText,
  UserPlus,
  Receipt,
  BookOpen,
  Clock,
  CheckSquare,
  Award,
  ClipboardList,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'Academic Sessions',
      path: '/academic-sessions',
      icon: Calendar,
      visible: hasPermission('academic:session:read'),
    },
    {
      label: 'Classes',
      path: '/classes',
      icon: Layers,
      visible: hasPermission('class:read'),
    },
    {
      label: 'Sections',
      path: '/sections',
      icon: Grid,
      visible: hasPermission('section:read'),
    },
    {
      label: 'Students',
      path: '/students',
      icon: GraduationCap,
      visible: hasPermission('student:read'),
    },
    {
      label: 'Admissions',
      path: '/admissions',
      icon: FileText,
      visible: hasPermission('admission:read'),
    },
    {
      label: 'Staff & Users',
      path: '/users',
      icon: Users,
      visible: hasPermission('user:read'),
    },
  ];

  const attendanceNavItems = [
    {
      label: 'Daily Attendance',
      path: '/attendance',
      icon: Calendar,
      visible: hasPermission('attendance:student:read') || hasPermission('attendance:student:create'),
    },
    {
      label: 'Monthly Register',
      path: '/attendance/monthly',
      icon: CheckSquare,
      visible: hasPermission('attendance:student:report'),
    },
    {
      label: 'Class Timetable',
      path: '/timetable',
      icon: Clock,
      visible: hasPermission('timetable:read'),
    },
    {
      label: 'Subjects Catalog',
      path: '/timetable/subjects',
      icon: BookOpen,
      visible: hasPermission('subject:read'),
    },
  ];

  const feeNavItems = [
    {
      label: 'Fee Overview',
      path: '/fees',
      icon: CreditCard,
      visible: hasPermission('fee:report:read') || hasPermission('fee:invoice:read'),
    },
    {
      label: 'Invoices & Billing',
      path: '/fees/invoices',
      icon: FileText,
      visible: hasPermission('fee:invoice:read'),
    },
    {
      label: 'Receipts Journal',
      path: '/fees/payments',
      icon: Receipt,
      visible: hasPermission('fee:payment:read'),
    },
    {
      label: 'Student Fee Ledger',
      path: '/fees/ledger',
      icon: BookOpen,
      visible: hasPermission('fee:invoice:read') || hasPermission('fee:payment:read'),
    },
    {
      label: 'Fee Templates',
      path: '/fees/structures',
      icon: Layers,
      visible: hasPermission('fee:structure:read'),
    },
    {
      label: 'Fee Heads',
      path: '/fees/heads',
      icon: Grid,
      visible: hasPermission('fee:head:read'),
    },
  ];

  const examNavItems = [
    {
      label: 'Exam Terms & Papers',
      path: '/exams/terms',
      icon: Award,
      visible: hasPermission('exam:term:read') || hasPermission('exam:schedule:read'),
    },
    {
      label: 'Marks Entry Register',
      path: '/exams/marks',
      icon: ClipboardList,
      visible: hasPermission('exam:mark:read') || hasPermission('exam:mark:create'),
    },
    {
      label: 'Student Report Cards',
      path: '/exams/report-cards',
      icon: FileText,
      visible: hasPermission('exam:report:read'),
    },
  ];

  const upcomingModules = [
    { label: 'Staff & Payroll Management', icon: Users, phase: 'Phase 6' },
    { label: 'Library & School Transport', icon: Layers, phase: 'Phase 7' },
    { label: 'Parent & Student Portals', icon: Globe, phase: 'Phase 8' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center space-x-3 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight block">School ERP</span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Enterprise Suite</span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Academic & Students
          </p>
          <nav className="space-y-1">
            {navItems
              .filter((item) => item.visible)
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
          </nav>
        </div>

        {/* Attendance & Timetable */}
        {attendanceNavItems.some((item) => item.visible) && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Attendance & Timetable
            </p>
            <nav className="space-y-1">
              {attendanceNavItems
                .filter((item) => item.visible)
                .map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
            </nav>
          </div>
        )}

        {/* Examination & Report Cards */}
        {examNavItems.some((item) => item.visible) && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Examination & Grades
            </p>
            <nav className="space-y-1">
              {examNavItems
                .filter((item) => item.visible)
                .map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
            </nav>
          </div>
        )}

        {/* Fee Engine & Collections */}
        {feeNavItems.some((item) => item.visible) && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Fee & Finance
            </p>
            <nav className="space-y-1">
              {feeNavItems
                .filter((item) => item.visible)
                .map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
            </nav>
          </div>
        )}

        {/* Global Administration (Super Admin only) */}
        {user?.roleCode === 'SUPER_ADMIN' && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Global Administration
            </p>
            <nav className="space-y-1">
              <NavLink
                to="/superadmin/schools"
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span>Tenant Management</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* Next Phases Preview */}
        {user?.roleCode !== 'SUPER_ADMIN' && (
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Upcoming Modules
          </p>
          <div className="space-y-1">
            {upcomingModules.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 cursor-not-allowed select-none"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  {item.phase}
                </span>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* School Footer info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="text-xs">
          <p className="font-medium text-white truncate">
            {user?.school ? user.school.name : 'Global Platform Admin'}
          </p>
          <p className="text-slate-400 text-[11px] truncate">
            {user?.school ? `Code: ${user.school.code}` : 'Multi-tenant Master'}
          </p>
        </div>
      </div>
    </aside>
  );
};
