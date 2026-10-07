import React, { useEffect, useState } from 'react';
import { SchoolService } from '../../services/school.service';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Plus, Settings, Users, Copy } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const SuperAdminDashboard: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [viewAdminsSchool, setViewAdminsSchool] = useState<any>(null);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({ 
    name: '', code: '', email: '', phone: '', addressLine1: '', city: '', state: '', postalCode: '' 
  });
  const { success, error } = useToast();

  const loadSchools = async () => {
    try {
      const res = await SchoolService.listSchools();
      setSchools(res.data?.data || []);
    } catch (e: any) {
      error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await SchoolService.createSchool(formData);
      success('School registered successfully!');
      setIsModalOpen(false);
      setSuccessData(created);
      setFormData({ name: '', code: '', email: '', phone: '', addressLine1: '', city: '', state: '', postalCode: '' });
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

  if (loading) return <div className="p-6">Loading schools...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Manage all registered schools and tenants</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Register New School
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <div key={school.id} className="flex flex-col bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{school.name}</h3>
                  <p className="text-sm text-gray-500">Code: {school.code}</p>
                </div>
                <Badge variant={school.isActive ? 'success' : 'danger'}>
                  {school.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <p>📍 {school.city}, {school.state}</p>
                <p>📧 {school.email}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-end gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
                <Settings className="w-4 h-4" /> Configure
              </button>
              <button 
                onClick={() => handleViewAdmins(school)}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
              >
                <Users className="w-4 h-4" /> Admins
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New School">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              required
              className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Register School
            </button>
          </div>
        </form>
      </Modal>

      {/* Success Details Modal */}
      <Modal isOpen={!!successData} onClose={() => setSuccessData(null)} title="School Provisioned Successfully!">
        <div className="space-y-4">
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200">
            <h4 className="font-bold mb-2">School & Roles Created</h4>
            <p className="text-sm">
              The tenant infrastructure for <strong>{successData?.school?.name}</strong> has been created.
              The base roles (Principal, Accountant, Teacher) are ready.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-3">Default Admin Login Credentials</h4>
            <p className="text-sm text-slate-600 mb-4">
              Hand these credentials to the newly appointed School Administrator. They can log in immediately.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-white p-2 rounded border">{successData?.adminCredentials?.email}</code>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Password</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-white p-2 rounded border">{successData?.adminCredentials?.password}</code>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setSuccessData(null)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* View Admins Modal */}
      <Modal isOpen={!!viewAdminsSchool} onClose={() => setViewAdminsSchool(null)} title={`Admins: ${viewAdminsSchool?.name}`}>
        <div className="space-y-4">
          {adminsList.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No admins found for this school.</p>
          ) : (
            <div className="space-y-3">
              {adminsList.map(admin => (
                <div key={admin.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">{admin.firstName} {admin.lastName}</p>
                    <p className="text-sm text-slate-500">{admin.email}</p>
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
              className="px-4 py-2 border rounded hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
