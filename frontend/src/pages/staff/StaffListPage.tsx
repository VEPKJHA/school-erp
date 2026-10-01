import React, { useEffect, useState } from 'react';
import { StaffService } from '../../services/staff.service';
import { User } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';

export const StaffListPage: React.FC = () => {
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadStaff();
  }, [search]);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await StaffService.getStaff({ search });
      setStaff(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'Staff Name',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm block">
            {row.firstName} {row.lastName}
          </span>
          <span className="text-xs text-slate-500">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (row) => (
        <Badge variant={row.role?.code === 'TEACHER' ? 'success' : 'info'}>
          {row.role?.name || row.role?.code}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'danger'}>
          {row.status}
        </Badge>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Directory</h1>
      </div>

      <DataTable
        columns={columns}
        data={staff}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        searchPlaceholder="Search staff by name or email..."
        searchValue={search}
        onSearchChange={setSearch}
      />
    </div>
  );
};
