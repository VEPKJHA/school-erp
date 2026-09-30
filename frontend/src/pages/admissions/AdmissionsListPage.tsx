import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  User,
  Phone,
  Calendar,
  AlertCircle,
  Loader2,
  Building,
} from 'lucide-react';
import { AdmissionService } from '../../services/admission.service';
import { ClassService } from '../../services/class.service';
import { Admission, ClassItem, Section, AdmissionStatus } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

export const AdmissionsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // View modal
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Approval modal
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState<Admission | null>(null);
  const [assignedSectionId, setAssignedSectionId] = useState('');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState<Admission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Load Classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const cls = await ClassService.getClasses();
        setClasses(cls);
      } catch (e) {
        console.error(e);
      }
    };
    loadClasses();
  }, []);

  const fetchAdmissions = async () => {
    setIsLoading(true);
    try {
      const data = await AdmissionService.getAdmissions({
        search: search || undefined,
        status: statusFilter || undefined,
        applyingClassId: classFilter || undefined,
      });
      setAdmissions(data.admissions);
      setTotal(data.total);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch admissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmissions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, classFilter]);

  const handleOpenApproveModal = async (adm: Admission) => {
    setApprovalTarget(adm);
    setApprovalRemarks('');
    setAssignedSectionId('');

    // Fetch sections for the applying class
    try {
      const classDetails = await ClassService.getClassById(adm.applyingClassId);
      const activeSections = (classDetails.sections || []).filter((s: Section) => s.isActive);
      setAvailableSections(activeSections);
      if (activeSections.length > 0) {
        setAssignedSectionId(activeSections[0].id);
      }
      setIsApproveModalOpen(true);
    } catch (e) {
      error('Failed to load sections for the applying class');
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalTarget || !assignedSectionId) {
      error('Please select a section for allotment');
      return;
    }
    setIsApproving(true);
    try {
      await AdmissionService.approveAdmission(approvalTarget.id, {
        assignedSectionId,
        remarks: approvalRemarks || undefined,
      });
      success(`Admission approved! Student created and section assigned.`);
      setIsApproveModalOpen(false);
      fetchAdmissions();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to approve admission');
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenRejectModal = (adm: Admission) => {
    setRejectionTarget(adm);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionTarget || !rejectionReason.trim()) {
      error('Please provide a reason for rejection');
      return;
    }
    setIsRejecting(true);
    try {
      await AdmissionService.rejectAdmission(rejectionTarget.id, {
        rejectionReason: rejectionReason.trim(),
      });
      success('Admission application marked as REJECTED');
      setIsRejectModalOpen(false);
      fetchAdmissions();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to reject admission');
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status: AdmissionStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'SUBMITTED':
        return <Badge variant="info">Submitted</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning">Under Review</Badge>;
      case 'DOCUMENT_PENDING':
        return <Badge variant="warning">Doc Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Metrics
  const stats = {
    total: admissions.length,
    pending: admissions.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'DOCUMENT_PENDING'
    ).length,
    approved: admissions.filter((a) => a.status === 'APPROVED').length,
    rejected: admissions.filter((a) => a.status === 'REJECTED').length,
  };

  const columns: Column<Admission>[] = [
    {
      header: 'Application #',
      accessor: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-indigo-700 block">
            {row.applicationNumber}
          </span>
          <span className="text-[11px] text-slate-400">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Applicant',
      accessor: (row) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">
            {row.firstName} {row.middleName ? `${row.middleName} ` : ''}
            {row.lastName}
          </div>
          <div className="text-xs text-slate-400">
            {row.gender} • DOB: {new Date(row.dateOfBirth).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Applying For',
      accessor: (row) => (
        <div>
          <span className="text-sm font-medium text-slate-800 block">
            {row.applyingClass?.name || 'Class N/A'}
          </span>
          <span className="text-xs text-slate-400">
            Session: {row.session?.name || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Parent / Contact',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          <p className="font-medium text-slate-800">
            {row.parentName} ({row.parentRelation})
          </p>
          <p className="text-slate-500">{row.parentMobile}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => {
              setSelectedAdmission(row);
              setIsViewModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="View Application Dossier"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status !== 'APPROVED' && row.status !== 'REJECTED' && (
            <>
              {hasPermission('admission:approve') && (
                <button
                  onClick={() => handleOpenApproveModal(row)}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  title="Approve & Enroll"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {hasPermission('admission:approve') && (
                <button
                  onClick={() => handleOpenRejectModal(row)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Reject Application"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Admissions & Enrollments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review incoming student admission applications, verify dossier records, and assign class sections.
          </p>
        </div>
        {hasPermission('admission:create') && (
          <button
            onClick={() => navigate('/admissions/new')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Admission Registration</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Received</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Under Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rejected</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{stats.rejected}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Status Pill Filters */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: '', label: 'All Statuses' },
            { id: 'SUBMITTED', label: 'Submitted' },
            { id: 'UNDER_REVIEW', label: 'Under Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All Applying Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {(classFilter || statusFilter || search) && (
            <button
              onClick={() => {
                setClassFilter('');
                setStatusFilter('');
                setSearch('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={admissions}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        searchPlaceholder="Search application #, applicant name, mobile..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No admission applications found matching your criteria"
      />

      {/* View Dossier Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Admission Application Dossier"
        maxWidth="lg"
      >
        {selectedAdmission && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600">
                  {selectedAdmission.applicationNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedAdmission.firstName} {selectedAdmission.middleName || ''}{' '}
                  {selectedAdmission.lastName}
                </h3>
                <p className="text-xs text-slate-500">
                  Applying for {selectedAdmission.applyingClass?.name} • Session:{' '}
                  {selectedAdmission.session?.name}
                </p>
              </div>
              <div>{getStatusBadge(selectedAdmission.status)}</div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-1">Date of Birth & Gender</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {new Date(selectedAdmission.dateOfBirth).toLocaleDateString()} •{' '}
                  {selectedAdmission.gender}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-1">Parent / Guardian</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {selectedAdmission.parentName} ({selectedAdmission.parentRelation})
                </span>
                <span className="text-slate-500 block">{selectedAdmission.parentMobile}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-1">Blood Group & Nationality</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {selectedAdmission.bloodGroup || 'Not specified'} •{' '}
                  {selectedAdmission.nationality}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block mb-1">Category & Religion</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {selectedAdmission.category || 'General'} /{' '}
                  {selectedAdmission.religion || 'Not specified'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg sm:col-span-2">
                <span className="text-slate-400 block mb-1">Residential Address</span>
                <span className="font-semibold text-slate-800 text-sm block">
                  {selectedAdmission.addressLine1}
                  {selectedAdmission.addressLine2 ? `, ${selectedAdmission.addressLine2}` : ''}
                </span>
                <span className="text-slate-500">
                  {selectedAdmission.city}, {selectedAdmission.state} —{' '}
                  {selectedAdmission.postalCode}
                </span>
              </div>
              {selectedAdmission.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg sm:col-span-2">
                  <span className="text-rose-600 font-semibold block mb-1">Rejection Reason</span>
                  <span className="text-rose-800">{selectedAdmission.rejectionReason}</span>
                </div>
              )}
            </div>

            {/* Actions in Dossier */}
            {selectedAdmission.status !== 'APPROVED' && selectedAdmission.status !== 'REJECTED' && (
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenRejectModal(selectedAdmission);
                  }}
                  className="px-4 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenApproveModal(selectedAdmission);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer"
                >
                  Approve & Allot Section
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approval & Section Allotment Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve Admission & Allot Section"
        maxWidth="md"
      >
        <form onSubmit={handleApprove} className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
            <p className="font-semibold">
              Approving application for {approvalTarget?.firstName} {approvalTarget?.lastName}
            </p>
            <p className="mt-1">
              This action will atomically convert the application into an active student record,
              generate a permanent Admission Number (<code className="font-mono">ADM/YYYY/XXXXXX</code>
              ), and register the parents.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Section Allotment <span className="text-rose-500">*</span>
            </label>
            <select
              value={assignedSectionId}
              onChange={(e) => setAssignedSectionId(e.target.value)}
              required
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">Select Section</option>
              {availableSections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name} (Capacity: {s.capacity}
                  {s.roomNumber ? `, Room: ${s.roomNumber}` : ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Approval Remarks / Notes
            </label>
            <textarea
              rows={3}
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
              placeholder="e.g. All documents verified. Fee voucher issued."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsApproveModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isApproving || !assignedSectionId}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Approve & Allot</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Admission Application"
        maxWidth="sm"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            Are you sure you want to reject the application for{' '}
            <span className="font-semibold">
              {rejectionTarget?.firstName} {rejectionTarget?.lastName}
            </span>
            ? Please specify the reason below.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              placeholder="e.g. Age criteria not met / Incomplete documentation..."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRejecting || !rejectionReason.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isRejecting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
