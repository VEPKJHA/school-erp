import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';

import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { AcademicSessionsPage } from '../pages/academic/AcademicSessionsPage';
import { ClassesPage } from '../pages/classes/ClassesPage';
import { SectionsPage } from '../pages/classes/SectionsPage';
import { UsersPage } from '../pages/users/UsersPage';
import { StudentsListPage } from '../pages/students/StudentsListPage';
import { AdmissionsListPage } from '../pages/admissions/AdmissionsListPage';
import { NewAdmissionPage } from '../pages/admissions/NewAdmissionPage';
import { FeeDashboardPage } from '../pages/fees/FeeDashboardPage';
import { FeeHeadsPage } from '../pages/fees/FeeHeadsPage';
import { FeeStructuresPage } from '../pages/fees/FeeStructuresPage';
import { InvoicesListPage } from '../pages/fees/InvoicesListPage';
import { PaymentReceiptsPage } from '../pages/fees/PaymentReceiptsPage';
import { StudentFeeLedgerPage } from '../pages/fees/StudentFeeLedgerPage';
import { AttendanceRegisterPage } from '../pages/attendance/AttendanceRegisterPage';
import { MonthlyRegisterPage } from '../pages/attendance/MonthlyRegisterPage';
import { SubjectsPage } from '../pages/timetable/SubjectsPage';
import { TimetableSchedulePage } from '../pages/timetable/TimetableSchedulePage';
import { ExamTermsPage } from '../pages/exams/ExamTermsPage';
import { MarksEntryPage } from '../pages/exams/MarksEntryPage';
import { ReportCardPage } from '../pages/exams/ReportCardPage';
import { StaffListPage } from '../pages/staff/StaffListPage';
import { ClassTeacherAllocationsPage } from '../pages/staff/ClassTeacherAllocationsPage';
import { LeaveManagementPage } from '../pages/staff/LeaveManagementPage';
import { PayrollPage } from '../pages/staff/PayrollPage';
import { SuperAdminDashboard } from '../pages/superadmin/SuperAdminDashboard';
import { NotFoundPage } from '../pages/common/NotFoundPage';
import { UnauthorizedPage } from '../pages/common/UnauthorizedPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          <Route path="/superadmin/schools" element={<SuperAdminDashboard />} />

          <Route
            element={<ProtectedRoute requiredPermission="academic:session:read" />}
          >
            <Route path="/academic-sessions" element={<AcademicSessionsPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="class:read" />}
          >
            <Route path="/classes" element={<ClassesPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="section:read" />}
          >
            <Route path="/sections" element={<SectionsPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="student:read" />}
          >
            <Route path="/students" element={<StudentsListPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="admission:read" />}
          >
            <Route path="/admissions" element={<AdmissionsListPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="admission:create" />}
          >
            <Route path="/admissions/new" element={<NewAdmissionPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="user:read" />}
          >
            <Route path="/users" element={<UsersPage />} />
          </Route>

          {/* Fee Engine & Collections Routes (Phase 3) */}
          <Route
            element={<ProtectedRoute requiredPermission="fee:report:read" />}
          >
            <Route path="/fees" element={<FeeDashboardPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="fee:head:read" />}
          >
            <Route path="/fees/heads" element={<FeeHeadsPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="fee:structure:read" />}
          >
            <Route path="/fees/structures" element={<FeeStructuresPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="fee:invoice:read" />}
          >
            <Route path="/fees/invoices" element={<InvoicesListPage />} />
            <Route path="/fees/ledger" element={<StudentFeeLedgerPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="fee:payment:read" />}
          >
            <Route path="/fees/payments" element={<PaymentReceiptsPage />} />
          </Route>

          {/* Attendance & Timetable Routes (Phase 4) */}
          <Route
            element={<ProtectedRoute requiredPermission="attendance:student:read" />}
          >
            <Route path="/attendance" element={<AttendanceRegisterPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="attendance:student:report" />}
          >
            <Route path="/attendance/monthly" element={<MonthlyRegisterPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="timetable:read" />}
          >
            <Route path="/timetable" element={<TimetableSchedulePage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="subject:read" />}
          >
            <Route path="/timetable/subjects" element={<SubjectsPage />} />
          </Route>

          {/* Examination & Report Cards Routes (Phase 5) */}
          <Route
            element={<ProtectedRoute requiredPermission="exam:term:read" />}
          >
            <Route path="/exams/terms" element={<ExamTermsPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="exam:mark:read" />}
          >
            <Route path="/exams/marks" element={<MarksEntryPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="exam:report:read" />}
          >
            <Route path="/exams/report-cards" element={<ReportCardPage />} />
          </Route>

          {/* Staff & Payroll Routes (Phase 6) */}
          <Route
            element={<ProtectedRoute requiredPermission="staff:read" />}
          >
            <Route path="/staff" element={<StaffListPage />} />
            <Route path="/staff/allocations" element={<ClassTeacherAllocationsPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="leave:read" />}
          >
            <Route path="/staff/leaves" element={<LeaveManagementPage />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="payroll:read" />}
          >
            <Route path="/staff/payrolls" element={<PayrollPage />} />
          </Route>

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
