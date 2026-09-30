import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  DollarSign,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Users,
  Search,
  Filter,
  Receipt,
  BookOpen,
} from 'lucide-react';
import { FeeService } from '../../services/fee.service';
import { ClassService } from '../../services/class.service';
import { AcademicService } from '../../services/academic.service';
import { StudentService } from '../../services/student.service';
import {
  FeeInvoice,
  ClassItem,
  AcademicSession,
  FeeStructure,
  FeeHead,
  Student,
  InvoiceStatus,
  PaymentMode,
} from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

export const InvoicesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { success, error } = useToast();

  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  // Collect Payment Modal
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectTarget, setCollectTarget] = useState<FeeInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  // View Invoice Modal
  const [viewInvoice, setViewInvoice] = useState<FeeInvoice | null>(null);

  // Bulk Generate Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkSessionId, setBulkSessionId] = useState('');
  const [bulkStructureId, setBulkStructureId] = useState('');
  const [bulkTitle, setBulkTitle] = useState('');
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [cls, sess, heads, str] = await Promise.all([
          ClassService.getClasses(),
          AcademicService.getSessions(),
          FeeService.getFeeHeads(true),
          FeeService.getFeeStructures(),
        ]);
        setClasses(cls);
        setSessions(sess);
        setFeeHeads(heads);
        setFeeStructures(str);

        const current = sess.find((s) => s.isCurrent);
        if (current) setBulkSessionId(current.id);
        if (cls.length > 0) setBulkClassId(cls[0].id);
      } catch (e) {
        console.error(e);
      }
    };
    loadMetadata();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await FeeService.getInvoices({
        search: search || undefined,
        status: statusFilter || undefined,
        classId: classFilter || undefined,
      });
      setInvoices(data.invoices);
      setTotal(data.total);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, classFilter]);

  const openCollectModal = (inv: FeeInvoice) => {
    setCollectTarget(inv);
    setPaymentAmount(Number(inv.balanceAmount));
    setPaymentMode('CASH');
    setReferenceNumber('');
    setPaymentRemarks('');
    setCollectModalOpen(true);
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectTarget) return;

    if (paymentAmount <= 0) {
      error('Please enter a valid payment amount');
      return;
    }
    if (paymentAmount > Number(collectTarget.balanceAmount)) {
      error(`Amount cannot exceed outstanding balance of ₹${collectTarget.balanceAmount}`);
      return;
    }

    setIsCollecting(true);
    try {
      const res = await FeeService.collectPayment({
        invoiceId: collectTarget.id,
        amount: paymentAmount,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: paymentRemarks.trim() || undefined,
      });
      success(`Payment collected! Receipt No: ${res.payment.receiptNumber}`);
      setCollectModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to collect payment');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkClassId || !bulkSessionId || !bulkStructureId || !bulkTitle.trim() || !bulkDueDate) {
      error('Please fill in all required fields');
      return;
    }

    setIsBulkGenerating(true);
    try {
      const res = await FeeService.bulkGenerateInvoices({
        classId: bulkClassId,
        academicSessionId: bulkSessionId,
        feeStructureId: bulkStructureId,
        title: bulkTitle.trim(),
        dueDate: bulkDueDate,
      });
      success(`Generated ${res.generatedCount} invoices for enrolled class students`);
      setBulkModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to bulk generate invoices');
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const formatCurrency = (amt: number | string) => {
    return `₹${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning">Partial</Badge>;
      case 'UNPAID':
        return <Badge variant="info">Unpaid</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger">Overdue</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: Column<FeeInvoice>[] = [
    {
      header: 'Invoice #',
      accessor: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-indigo-700 block">
            {row.invoiceNumber}
          </span>
          <span className="text-[11px] text-slate-500 font-medium truncate block max-w-[150px]">
            {row.title}
          </span>
        </div>
      ),
    },
    {
      header: 'Student',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm block">
            {row.student?.firstName} {row.student?.lastName}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {row.student?.admissionNumber} • {row.student?.class?.name}
          </span>
        </div>
      ),
    },
    {
      header: 'Due Date',
      accessor: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {new Date(row.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Bill Amount',
      accessor: (row) => (
        <div className="text-xs font-semibold text-slate-800">
          <span>{formatCurrency(row.totalAmount)}</span>
          {Number(row.discountAmount) > 0 && (
            <span className="block text-[10px] text-emerald-600 font-normal">
              Disc: -{formatCurrency(row.discountAmount)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Balance Due',
      accessor: (row) => {
        const bal = Number(row.balanceAmount);
        return (
          <span
            className={`font-bold text-xs ${
              bal === 0 ? 'text-emerald-600' : bal < Number(row.totalAmount) ? 'text-amber-600' : 'text-slate-800'
            }`}
          >
            {formatCurrency(bal)}
          </span>
        );
      },
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
            onClick={() => setViewInvoice(row)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="View Invoice Dossier"
          >
            <Eye className="w-4 h-4" />
          </button>

          {row.status !== 'PAID' && hasPermission('fee:payment:create') && (
            <button
              onClick={() => openCollectModal(row)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors shadow-sm cursor-pointer"
              title="Collect Fee"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Collect</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/fees/ledger?studentId=${row.studentId}`)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Student Fee Ledger"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/fees')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Invoices & Student Billing
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate student fee bills, monitor balances, and record collections. Total records: {total}
            </p>
          </div>
        </div>

        {hasPermission('fee:invoice:create') && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setBulkModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Bulk Class Invoicing</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Status Pill Filters */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: '', label: 'All Invoices' },
            { id: 'UNPAID', label: 'Unpaid' },
            { id: 'PARTIALLY_PAID', label: 'Partial' },
            { id: 'PAID', label: 'Fully Paid' },
            { id: 'OVERDUE', label: 'Overdue' },
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
            <option value="">All Classes</option>
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={invoices}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        searchPlaceholder="Search invoice #, student name, admission #..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No fee invoices found matching your criteria"
      />

      {/* Collect Payment Modal */}
      <Modal
        isOpen={collectModalOpen}
        onClose={() => setCollectModalOpen(false)}
        title="Collect Fee Payment"
        maxWidth="md"
      >
        <form onSubmit={handleCollectPayment} className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono font-bold text-xs">{collectTarget?.invoiceNumber}</span>
                <p className="font-semibold text-sm mt-0.5">
                  {collectTarget?.student?.firstName} {collectTarget?.student?.lastName}
                </p>
                <p className="text-emerald-700 text-xs">
                  Adm: {collectTarget?.student?.admissionNumber} • {collectTarget?.title}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-700 block">Outstanding Balance:</span>
                <span className="text-lg font-bold text-emerald-900">
                  {formatCurrency(collectTarget?.balanceAmount || 0)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Collection Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="text-sm text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                ₹
              </span>
              <input
                type="number"
                required
                min={1}
                max={Number(collectTarget?.balanceAmount || 0)}
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-base font-bold pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports partial collections. Max allowed is current balance of ₹
              {collectTarget?.balanceAmount}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              >
                <option value="CASH">Cash Payment</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="ONLINE">Net Banking / Gateway</option>
                <option value="CHEQUE">Bank Cheque</option>
                <option value="BANK_TRANSFER">Direct NEFT/RTGS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Transaction / Reference #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR / Cheque / Txn ID"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Remarks / Notes
            </label>
            <input
              type="text"
              value={paymentRemarks}
              onChange={(e) => setPaymentRemarks(e.target.value)}
              placeholder="e.g. Deposited by father at school counter"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCollectModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCollecting || paymentAmount <= 0}
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isCollecting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Issue Receipt & Settle</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Generate Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Bulk Generate Class Fee Invoices"
        maxWidth="md"
      >
        <form onSubmit={handleBulkGenerate} className="space-y-4">
          <p className="text-xs text-slate-500">
            This operation will generate individual itemized fee invoices for all active students enrolled in the selected grade.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Class <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={bulkClassId}
                onChange={(e) => setBulkClassId(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Academic Session <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={bulkSessionId}
                onChange={(e) => setBulkSessionId(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Fee Structure Template <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={bulkStructureId}
                onChange={(e) => setBulkStructureId(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              >
                <option value="">Select Fee Template</option>
                {feeStructures
                  .filter((str) => str.classId === bulkClassId)
                  .map((str) => (
                    <option key={str.id} value={str.id}>
                      {str.name} ({str.frequency})
                    </option>
                  ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Invoice Title / Period <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={bulkTitle}
                onChange={(e) => setBulkTitle(e.target.value)}
                placeholder="e.g. May 2026 Monthly Tuition & Transport Fee"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={bulkDueDate}
                onChange={(e) => setBulkDueDate(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBulkGenerating}
              className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isBulkGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Generate Invoices</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Dossier Modal */}
      <Modal
        isOpen={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title="Student Fee Invoice Dossier"
        maxWidth="lg"
      >
        {viewInvoice && (
          <div className="space-y-6">
            {/* Header / Bill Info */}
            <div className="flex justify-between items-start p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600">
                  {viewInvoice.invoiceNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{viewInvoice.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Student: {viewInvoice.student?.firstName} {viewInvoice.student?.lastName} (Adm:{' '}
                  {viewInvoice.student?.admissionNumber}) • {viewInvoice.student?.class?.name}
                </p>
              </div>
              <div className="text-right">
                <div className="mb-1">{getStatusBadge(viewInvoice.status)}</div>
                <p className="text-xs text-slate-400">
                  Due Date: {new Date(viewInvoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Fee Head</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewInvoice.items?.map((it) => (
                    <tr key={it.id}>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-slate-800">{it.feeHead?.name}</span>
                        {it.description && it.description !== it.feeHead?.name && (
                          <span className="text-[11px] text-slate-400 block">{it.description}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                        {formatCurrency(it.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Calculations */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(viewInvoice.subtotal)}</span>
                </div>
                {Number(viewInvoice.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Concession / Discount:</span>
                    <span>-{formatCurrency(viewInvoice.discountAmount)}</span>
                  </div>
                )}
                {Number(viewInvoice.lateFeeAmount) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Late Fee Charge:</span>
                    <span>+{formatCurrency(viewInvoice.lateFeeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Invoiced:</span>
                  <span>{formatCurrency(viewInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-600">
                  <span>Total Paid:</span>
                  <span>{formatCurrency(viewInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-indigo-700 pt-1 border-t border-slate-200">
                  <span>Balance Outstanding:</span>
                  <span>{formatCurrency(viewInvoice.balanceAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {viewInvoice.payments && viewInvoice.payments.length > 0 && (
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Payment History & Receipts
                </h4>
                <div className="space-y-2">
                  {viewInvoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Receipt className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-mono font-bold text-slate-800">
                            {p.receiptNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Mode: {p.paymentMode} • Date:{' '}
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-700 text-sm">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
