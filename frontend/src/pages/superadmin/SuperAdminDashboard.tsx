import React, { useEffect, useState } from 'react';
import { SchoolService } from '../../services/school.service';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Plus, Settings, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const SuperAdminDashboard: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', email: '', city: '', state: '' });
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
      await SchoolService.createSchool(formData);
      success('School registered successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', code: '', email: '', city: '', state: '' });
      loadSchools();
    } catch (e: any) {
      error(e.response?.data?.message || 'Failed to register school');
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
              <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
                <Users className="w-4 h-4" /> Admins
              </button>
            </div>
          </div>
        ))}
      </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                className="w-full p-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
    </div>
  );
};
