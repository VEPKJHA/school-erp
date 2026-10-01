import React, { useEffect, useState } from 'react';
import { StaffService } from '../../services/staff.service';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const PayrollPage: React.FC = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const data = await StaffService.getPayrolls();
      setPayrolls(data);
    } catch (e) {
      error('Failed to load payrolls');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePay = async (id: string) => {
    try {
      await StaffService.updatePayrollStatus(id, 'PAID', 'BANK_TRANSFER');
      success('Payroll marked as paid');
      load();
    } catch (e) {
      error('Payment update failed');
    }
  }

  const columns: Column<any>[] = [
    { 
      header: 'Staff Member', 
      accessor: (row) => <span className="font-semibold text-slate-800">{row.user?.firstName} {row.user?.lastName}</span> 
    },
    { 
      header: 'Billing Cycle', 
      accessor: (row) => <span className="font-mono text-slate-600">{row.month} / {row.year}</span> 
    },
    { 
      header: 'Net Salary', 
      accessor: (row) => <span className="font-bold text-emerald-700">₹{row.netSalary?.toLocaleString()}</span> 
    },
    { 
      header: 'Status', 
      accessor: (row) => (
        <Badge variant={row.status === 'PAID' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      ) 
    },
    { 
      header: 'Actions', 
      accessor: (row) => row.status !== 'PAID' ? (
        <button 
          onClick={() => handlePay(row.id)} 
          className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-bold transition-colors"
        >
          Process Payment
        </button>
      ) : <span className="text-slate-400 text-xs italic">Paid</span> 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll Engine</h1>
      </div>
      <DataTable 
        columns={columns} 
        data={payrolls} 
        keyExtractor={(r)=>r.id} 
        isLoading={isLoading}
        emptyMessage="No payroll records generated yet."
      />
    </div>
  );
};

