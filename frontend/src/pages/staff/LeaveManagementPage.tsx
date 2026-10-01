import React, { useEffect, useState } from 'react';
import { StaffService } from '../../services/staff.service';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const LeaveManagementPage: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaves = async () => {
    try {
      const data = await StaffService.getLeaves();
      setLeaves(data);
    } catch (e) {
      error('Failed to load leaves');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadLeaves(); }, []);

  const handleStatus = async (id: string, status: string) => {
    try {
      await StaffService.updateLeaveStatus(id, status);
      success('Leave status updated');
      loadLeaves();
    } catch(e) {
      error('Update failed');
    }
  }

  const columns: Column<any>[] = [
    { 
      header: 'Staff Member', 
      accessor: (row) => <span className="font-semibold text-slate-800">{row.user?.firstName} {row.user?.lastName}</span> 
    },
    { 
      header: 'Leave Type', 
      accessor: (row) => <span className="text-slate-600 font-medium">{row.leaveType}</span> 
    },
    { 
      header: 'Duration', 
      accessor: (row) => <span className="text-xs text-slate-500">{new Date(row.startDate).toLocaleDateString()} to {new Date(row.endDate).toLocaleDateString()}</span> 
    },
    { 
      header: 'Status', 
      accessor: (row) => (
        <Badge variant={row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'}>
          {row.status}
        </Badge>
      ) 
    },
    { 
      header: 'Actions', 
      accessor: (row) => row.status === 'PENDING' ? (
        <div className="flex space-x-3">
          <button onClick={() => handleStatus(row.id, 'APPROVED')} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold transition-colors">Approve</button>
          <button onClick={() => handleStatus(row.id, 'REJECTED')} className="text-red-600 hover:text-red-700 text-xs font-bold transition-colors">Reject</button>
        </div>
      ) : <span className="text-slate-400 text-xs italic">Processed</span> 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
      </div>
      <DataTable 
        columns={columns} 
        data={leaves} 
        keyExtractor={(r)=>r.id}
        isLoading={isLoading}
        emptyMessage="No leave requests found in the system."
      />
    </div>
  );
};

