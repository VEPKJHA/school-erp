import React, { useEffect, useState } from 'react';
import { SchoolService } from '../../services/school.service';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Plus,
  Settings,
  Users,
  Building2,
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Power,
  Search,
  ExternalLink,
  Shield,
  FileText,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const SuperAdminDashboard: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [viewAdminsSchool, setViewAdminsSchool] = useState<any>(null);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [viewDetailsSchool, setViewDetailsSchool] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const { success, error } = useToast();
  const navigate = useNavigate();

  const loadSchools = async () => {
    setLoading(true);
    try {
      const res = await SchoolService.listSchools({ search: searchTerm || undefined });
      setSchools(res.schools || []);
    } catch (e: any) {
      error(e.response?.data?.message || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSchools();
  };

  const handleToggleStatus = async (school: any) => {
    if (!window.confirm(`Are you sure you want to ${school.isActive ? 'suspend' : 'activate'} "${school.name}"?`)) {
      return;
    }

    setTogglingId(school.id);
    try {
      await SchoolService.toggleSchoolStatus(school.id);
      success(`School status updated successfully.`);
      loadSchools();
    } catch (e: any) {
      error(e.response?.data?.message || 'Failed to update school status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await SchoolService.createSchool(formData);
      success('School registered and provisioned successfully!');
      setIsModalOpen(false);
      setSuccessData(created);
      setFormData({
        name: '',
        code: '',
        email: '',
        phone: '',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
      });
      loadSchools();
    } catch (e: any) {
      error(e.response?.data?.message || 'Failed to register school');
    }
  };

  const handleViewAdmins = async (school: any) => {
    try {
      const data = await SchoolService.getSchoolAdmins(school.id);
      setAdminsList(data || []);
      setViewAdminsSchool(school);
    } catch (e: any) {
      error('Failed to load admins');
    }
  };

  const handleInspectTenant = (school: any) => {
    // Allows super admin to navigate and inspect tenant
    success(`Switching context to ${school.name} (Code: ${school.code}).`);
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              Tenant & School Management
            </h1>
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Multi-Tenant SaaS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage provisioned educational institutions, inspect enrollment metrics, toggle active states, and administer tenant access. Total registered tenants: {schools.length}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadSchools()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Refresh schools"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New School</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by school name, code, or city..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </form>
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setTimeout(loadSchools, 50);
            }}
            className="text-xs text-indigo-600 font-medium hover:underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading registered tenants from database...</span>
          </div>
        ) : schools.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-800">No School Tenants Found</p>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;Register New School&quot; above to provision your first tenant.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">School / Institution</th>
                  <th className="px-4 py-3">Location & Contact</th>
                  <th className="px-4 py-3 text-center">Active Students</th>
                  <th className="px-4 py-3 text-center">Staff Members</th>
                  <th className="px-4 py-3">Current Session</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Registered On</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {schools.map((school) => {
                  const currentSession = school.academicSessions?.[0]?.name || 'N/A';
                  const studentCount = school._count?.students || 0;
                  const staffCount = school._count?.users || 0;

                  return (
                    <tr key={school.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {school.code}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {school.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Code: {school.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <span className="text-slate-800 font-medium block">
                            {school.city ? `${school.city}, ${school.state}` : 'N/A'}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                            {school.email || 'No email registered'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-slate-800 text-sm">
                          {studentCount}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-slate-800 text-sm">
                          {staffCount}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                          {currentSession}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={school.isActive ? 'success' : 'danger'}>
                          {school.isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {new Date(school.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => setViewDetailsSchool(school)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="View School Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* View Admins */}
                          <button
                            onClick={() => handleViewAdmins(school)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Manage School Admins"
                          >
                            <Users className="w-4 h-4" />
                          </button>

                          {/* Toggle Active/Suspend */}
                          <button
                            disabled={togglingId === school.id}
                            onClick={() => handleToggleStatus(school)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              school.isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={school.isActive ? 'Suspend School' : 'Activate School'}
                          >
                            {togglingId === school.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* School Dossier Details Modal */}
      <Modal
        isOpen={!!viewDetailsSchool}
        onClose={() => setViewDetailsSchool(null)}
        title="Tenant School Profile & Health"
        maxWidth="md"
      >
        {viewDetailsSchool && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{viewDetailsSchool.name}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Code: {viewDetailsSchool.code}</p>
                </div>
                <Badge variant={viewDetailsSchool.isActive ? 'success' : 'danger'}>
                  {viewDetailsSchool.isActive ? 'Active' : 'Suspended'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block">Contact Email:</span>
                  <span className="font-medium text-slate-800">{viewDetailsSchool.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone Number:</span>
                  <span className="font-medium text-slate-800">{viewDetailsSchool.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">City & State:</span>
                  <span className="font-medium text-slate-800">
                    {viewDetailsSchool.city}, {viewDetailsSchool.state}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">PIN Code:</span>
                  <span className="font-medium text-slate-800">{viewDetailsSchool.postalCode || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <span className="text-[11px] text-indigo-600 block">Total Students</span>
                <span className="text-lg font-bold text-indigo-900 mt-0.5 block">
                  {viewDetailsSchool._count?.students || 0}
                </span>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                <span className="text-[11px] text-purple-600 block">Total Staff</span>
                <span className="text-lg font-bold text-purple-900 mt-0.5 block">
                  {viewDetailsSchool._count?.users || 0}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <span className="text-[11px] text-emerald-600 block">Invoices Billed</span>
                <span className="text-lg font-bold text-emerald-900 mt-0.5 block">
                  {viewDetailsSchool._count?.feeInvoices || 0}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewDetailsSchool(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Registration Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New School Institution">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              School Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Cambridge International Academy"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                School Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. CIA01"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Contact Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@cambridge.edu"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Address Line 1 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              placeholder="123 Education Boulevard"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="New Delhi"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Delhi"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                PIN Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="110001"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Provision School & Roles
            </button>
          </div>
        </form>
      </Modal>

      {/* Success Provision Details Modal */}
      <Modal isOpen={!!successData} onClose={() => setSuccessData(null)} title="School Provisioned Successfully!">
        <div className="space-y-4">
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-xs">
            <h4 className="font-bold text-sm mb-1">Tenant Infrastructure Provisioned</h4>
            <p>
              The multi-tenant container for <strong>{successData?.school?.name}</strong> has been initialized with school code <code>{successData?.school?.code}</code>.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-800 text-sm mb-2">Default School Administrator Credentials</h4>
            <p className="text-slate-600 mb-3">
              Share these credentials with the designated administrator of the school:
            </p>

            <div className="space-y-2">
              <div>
                <span className="text-slate-400 block">Login Email</span>
                <code className="block bg-white p-2 rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-800">
                  {successData?.adminCredentials?.email}
                </code>
              </div>
              <div>
                <span className="text-slate-400 block">Temporary Password</span>
                <code className="block bg-white p-2 rounded-lg border border-slate-200 font-mono text-xs font-bold text-indigo-700">
                  {successData?.adminCredentials?.password}
                </code>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSuccessData(null)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* View Admins Modal */}
      <Modal isOpen={!!viewAdminsSchool} onClose={() => setViewAdminsSchool(null)} title={`Admins: ${viewAdminsSchool?.name}`}>
        <div className="space-y-4 text-xs">
          {adminsList.length === 0 ? (
            <p className="text-slate-500 text-center py-6">No administrator accounts found for this school.</p>
          ) : (
            <div className="space-y-2">
              {adminsList.map((admin) => (
                <div key={admin.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-800">{admin.firstName} {admin.lastName}</p>
                    <p className="text-slate-500 text-[11px] font-mono">{admin.email}</p>
                  </div>
                  <Badge variant={admin.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {admin.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setViewAdminsSchool(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
