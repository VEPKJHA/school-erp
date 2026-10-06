import React, { useEffect, useState } from 'react';
import { SchoolService } from '../../services/school.service';
import { Badge } from '../../components/common/Badge';
import { FiPlus, FiSettings, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const SuperAdminDashboard: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchools = async () => {
    try {
      const res = await SchoolService.listSchools();
      setSchools(res.data?.data || []);
    } catch (e: any) {
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  if (loading) return <div className="p-6">Loading schools...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Manage all registered schools and tenants</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          <FiPlus /> Register New School
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
                <FiSettings /> Configure
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
                <FiUsers /> Admins
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
