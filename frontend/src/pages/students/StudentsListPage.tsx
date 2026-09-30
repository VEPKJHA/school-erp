import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Eye,
  Edit,
  Filter,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { StudentService } from '../../services/student.service';
import { ClassService } from '../../services/class.service';
import { Student, ClassItem, Section, StudentStatus, StudentDocument } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

export const StudentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [availableSections, setAvailableSections] = useState<Section[]>([]);

  // Selected student for details modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'parent' | 'address' | 'documents'>('profile');

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetStudent, setStatusTargetStudent] = useState<Student | null>(null);
  const [newStatus, setNewStatus] = useState<StudentStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Document upload state
  const [uploadDocType, setUploadDocType] = useState('BIRTH_CERTIFICATE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load Classes for filter
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

  // Update available sections when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setAvailableSections([]);
      setSelectedSectionId('');
      return;
    }
    const found = classes.find((c) => c.id === selectedClassId);
    setAvailableSections(found?.sections || []);
    setSelectedSectionId('');
  }, [selectedClassId, classes]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await StudentService.getStudents({
        search: search || undefined,
        classId: selectedClassId || undefined,
        sectionId: selectedSectionId || undefined,
        status: selectedStatus || undefined,
      });
      setStudents(data.students);
      setTotal(data.total);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedClassId, selectedSectionId, selectedStatus]);

  const handleOpenDetails = async (stu: Student) => {
    try {
      const detailed = await StudentService.getStudentById(stu.id);
      setSelectedStudent(detailed);
      setActiveTab('profile');
      setIsDetailsOpen(true);
    } catch (err: any) {
      error('Failed to load student details');
    }
  };

  const handleOpenStatusModal = (stu: Student) => {
    setStatusTargetStudent(stu);
    setNewStatus(stu.status);
    setStatusReason('');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTargetStudent) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await StudentService.updateStatus(statusTargetStudent.id, {
        status: newStatus,
        reason: statusReason,
      });
      success(`Student status updated to ${newStatus}`);
      setStatusModalOpen(false);
      fetchStudents();
      if (selectedStudent?.id === updated.id) {
        setSelectedStudent(updated);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedFile) {
      error('Please select a file to upload');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('studentId', selectedStudent.id);
      formData.append('documentType', uploadDocType);

      await StudentService.uploadDocument(formData);
      success('Document uploaded successfully');
      setSelectedFile(null);
      // Reload student details
      const refreshed = await StudentService.getStudentById(selectedStudent.id);
      setSelectedStudent(refreshed);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: StudentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'ADMITTED':
        return <Badge variant="info">Admitted</Badge>;
      case 'INACTIVE':
        return <Badge variant="warning">Inactive</Badge>;
      case 'TRANSFERRED':
        return <Badge variant="neutral">Transferred</Badge>;
      case 'WITHDRAWN':
      case 'PASSED_OUT':
        return <Badge variant="danger">{status.replace('_', ' ')}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: Column<Student>[] = [
    {
      header: 'Student',
      accessor: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
            {row.firstName[0]}
            {row.lastName[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-800">
              {row.firstName} {row.middleName ? `${row.middleName} ` : ''}
              {row.lastName}
            </div>
            <div className="text-xs text-slate-400">
              {row.email || row.mobile || 'No contact provided'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Identifiers',
      accessor: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-700 block">
            {row.admissionNumber}
          </span>
          <span className="text-[11px] font-mono text-slate-400">{row.studentCode}</span>
        </div>
      ),
    },
    {
      header: 'Class & Section',
      accessor: (row) => (
        <div>
          <span className="text-sm font-medium text-slate-800 block">
            {row.class?.name || 'Class N/A'}
          </span>
          <span className="text-xs text-indigo-600 font-medium">
            Section {row.section?.name || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Gender & DOB',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          <span className="block font-medium">{row.gender}</span>
          <span className="text-slate-400">
            {new Date(row.dateOfBirth).toLocaleDateString()}
          </span>
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
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleOpenDetails(row)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {hasPermission('student:update') && (
            <button
              onClick={() => handleOpenStatusModal(row)}
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
              title="Change Status"
            >
              <Edit className="w-4 h-4" />
            </button>
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
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            Students Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, manage, and verify all registered students and their academic profiles. Total:{' '}
            <span className="font-semibold text-slate-700">{total}</span>
          </p>
        </div>
        {hasPermission('admission:create') && (
          <button
            onClick={() => navigate('/admissions/new')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Admission</span>
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Class Filter */}
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Section Filter */}
        <select
          value={selectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value)}
          disabled={!selectedClassId}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
        >
          <option value="">All Sections</option>
          {availableSections.map((s) => (
            <option key={s.id} value={s.id}>
              Section {s.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ADMITTED">Admitted</option>
          <option value="INACTIVE">Inactive</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="PASSED_OUT">Passed Out</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </select>

        {(selectedClassId || selectedSectionId || selectedStatus || search) && (
          <button
            onClick={() => {
              setSelectedClassId('');
              setSelectedSectionId('');
              setSelectedStatus('');
              setSearch('');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={students}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        searchPlaceholder="Search by name, student code, admission #..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No students found matching your criteria"
      />

      {/* Student Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Student Profile & Dossier"
        maxWidth="lg"
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
                  {selectedStudent.firstName[0]}
                  {selectedStudent.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedStudent.firstName} {selectedStudent.middleName || ''}{' '}
                    {selectedStudent.lastName}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                      Adm: {selectedStudent.admissionNumber}
                    </span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                      Code: {selectedStudent.studentCode}
                    </span>
                  </div>
                </div>
              </div>
              <div>{getStatusBadge(selectedStudent.status)}</div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
              {[
                { id: 'profile', label: 'Academic & Personal' },
                { id: 'parent', label: 'Parents / Guardians' },
                { id: 'address', label: 'Addresses' },
                { id: 'documents', label: 'Documents' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Profile & Demographics */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Class & Section</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedStudent.class?.name || 'N/A'} — Section{' '}
                    {selectedStudent.section?.name || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Academic Session</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedStudent.session?.name || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Date of Birth</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Gender</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedStudent.gender}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Blood Group</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedStudent.bloodGroup || 'Not specified'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Aadhaar Number</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedStudent.aadhaarNumber || 'Not provided'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Category & Religion</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedStudent.category || 'General'} / {selectedStudent.religion || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Admission Date</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {new Date(selectedStudent.admissionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2: Parents */}
            {activeTab === 'parent' && (
              <div className="space-y-3">
                {selectedStudent.studentParents && selectedStudent.studentParents.length > 0 ? (
                  selectedStudent.studentParents.map((sp) => (
                    <div
                      key={sp.id}
                      className="p-4 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {sp.parent.firstName} {sp.parent.lastName}
                          </p>
                          <p className="text-xs text-indigo-600 font-medium">{sp.relationship}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <p className="flex items-center justify-end text-slate-600 gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sp.parent.phone}</span>
                        </p>
                        {sp.parent.email && (
                          <p className="flex items-center justify-end text-slate-400 gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{sp.parent.email}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-6">
                    No parent/guardian linked to this student yet.
                  </p>
                )}
              </div>
            )}

            {/* Tab 3: Address */}
            {activeTab === 'address' && (
              <div className="space-y-3">
                {selectedStudent.addresses && selectedStudent.addresses.length > 0 ? (
                  selectedStudent.addresses.map((addr) => (
                    <div key={addr.id} className="p-4 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-semibold uppercase text-slate-500">
                          {addr.type} Address
                        </span>
                      </div>
                      <p className="text-sm text-slate-800">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {addr.city}, {addr.state} — {addr.postalCode}, {addr.country}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-6">
                    No address records registered for this student.
                  </p>
                )}
              </div>
            )}

            {/* Tab 4: Documents */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {/* Upload Form */}
                <form
                  onSubmit={handleUploadDocument}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <span className="text-xs font-semibold text-slate-700 block">
                    Upload New Document
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
                    >
                      <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                      <option value="TRANSFER_CERTIFICATE">Transfer Certificate (TC)</option>
                      <option value="MARKSHEET">Previous Marksheet</option>
                      <option value="AADHAAR_CARD">Aadhaar Card</option>
                      <option value="OTHER">Other Verification Document</option>
                    </select>

                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload Document</span>
                  </button>
                </form>

                {/* Documents List */}
                <div className="space-y-2">
                  {selectedStudent.documents && selectedStudent.documents.length > 0 ? (
                    selectedStudent.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded-lg text-xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-800">{doc.fileName}</p>
                            <p className="text-[11px] text-slate-400">
                              Type: {doc.documentType.replace('_', ' ')} • Uploaded:{' '}
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                        >
                          View
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No documents uploaded yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Student Status"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Lifecycle Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as StudentStatus)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ACTIVE">Active (Regular enrolled)</option>
              <option value="ADMITTED">Admitted (Pending first session start)</option>
              <option value="INACTIVE">Inactive (Temporarily suspended / non-attending)</option>
              <option value="TRANSFERRED">Transferred (TC issued)</option>
              <option value="PASSED_OUT">Passed Out (Graduated from school)</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status Change Reason / Notes
            </label>
            <textarea
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="e.g. TC issued for relocation, parents requested temporary leave..."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingStatus}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUpdatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Status</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
