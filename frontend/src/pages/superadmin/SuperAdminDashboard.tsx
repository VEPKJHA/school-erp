import React, { useEffect, useState } from 'react';
import { SchoolService } from '../../services/school.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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
        <Button className="flex items-center gap-2">
          <FiPlus /> Register New School
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <Card key={school.id} className="flex flex-col">
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
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <FiSettings /> Configure
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <FiUsers /> Admins
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
