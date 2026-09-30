import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Building,
  User,
  ArrowRight,
  RefreshCw,
  X,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { FeeService } from '../../services/fee.service';
import { FeePayment, PaymentMode } from '../../types';
import { Badge } from '../../components/common/Badge';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../context/ToastContext';

// Helper to convert number to Indian currency words
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const rounded = Math.round(num);
  return `${inWords(rounded)} Rupees Only`;
}

export const PaymentReceiptsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  const { error } = useToast();

  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Modal receipt voucher state
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  // Load payments from API
  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const studentIdParam = searchParams.get('studentId') || undefined;
      const invoiceIdParam = searchParams.get('invoiceId') || undefined;

      const data = await FeeService.getPayments({
        page,
        pageSize,
        search: searchTerm.trim() || undefined,
        studentId: studentIdParam,
        invoiceId: invoiceIdParam,
      });

      setPayments(data.payments);
      setTotalCount(data.total);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load payment receipts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, searchTerm]);

  // Filter payments by payment mode client-side if selected
  const filteredPayments = useMemo(() => {
    if (selectedMode === 'ALL') return payments;
    return payments.filter((p) => p.paymentMode === selectedMode);
  }, [payments, selectedMode]);

  // Computed summary
  const totalAmountCollected = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  }, [filteredPayments]);

  const handlePrint = () => {
    window.print();
  };

  const getPaymentModeBadge = (mode: PaymentMode) => {
    switch (mode) {
      case 'CASH':
        return <Badge variant="success">Cash</Badge>;
      case 'UPI':
        return <Badge variant="info">UPI</Badge>;
      case 'CARD':
        return <Badge variant="info">Card</Badge>;
      case 'ONLINE':
        return <Badge variant="info">Online</Badge>;
      case 'CHEQUE':
        return <Badge variant="warning">Cheque</Badge>;
      case 'BANK_TRANSFER':
        return <Badge variant="neutral">NEFT/RTGS</Badge>;
      default:
        return <Badge variant="neutral">{mode}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-indigo-600" />
            Fee Collection Receipts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time receipt journal, collection vouchers, and payment transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/fees/invoices')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm transition"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            Go to Invoices
          </button>
          <button
            onClick={() => navigate('/fees')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <CreditCard className="w-4 h-4" />
            Fee Dashboard
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Total Receipts Recorded
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Page Collection Volume
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              ₹{totalAmountCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Active Payment Channels
            </p>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Cash • UPI • Card • Online • Cheque
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by receipt no (REC/...), student name, or invoice..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="ALL">All Payment Modes</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="ONLINE">Online Portal</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
              </select>
            </div>

            <button
              onClick={() => fetchPayments()}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Receipt No</th>
                <th className="px-5 py-3.5">Student Details</th>
                <th className="px-5 py-3.5">Invoice Ref</th>
                <th className="px-5 py-3.5">Payment Date</th>
                <th className="px-5 py-3.5">Mode</th>
                <th className="px-5 py-3.5 text-right">Amount Paid</th>
                <th className="px-5 py-3.5">Collected By</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading payment receipts...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No payment receipts found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const studentName = p.student
                    ? `${p.student.firstName} ${p.student.lastName}`
                    : '—';
                  const admissionNo = p.student?.admissionNumber || '';
                  const className = p.student?.class
                    ? `${p.student.class.name} - ${p.student.section?.name || ''}`
                    : '';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-indigo-600">
                        {p.receiptNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900">{studentName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{admissionNo}</span>
                          {className && (
                            <>
                              <span>•</span>
                              <span>{className}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                        {p.invoice?.invoiceNumber || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5">{getPaymentModeBadge(p.paymentMode)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 whitespace-nowrap">
                        ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {p.collectedBy
                          ? `${p.collectedBy.firstName} ${p.collectedBy.lastName}`
                          : 'Admin'}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setIsVoucherOpen(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition"
                            title="View / Print Receipt Voucher"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {p.studentId && (
                            <button
                              onClick={() => navigate(`/fees/ledger?studentId=${p.studentId}`)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                              title="View Student Ledger"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalCount > pageSize && (
          <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, totalCount)} of {totalCount} receipts
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded text-slate-600 hover:bg-white disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-slate-700">
                Page {page} of {Math.ceil(totalCount / pageSize)}
              </span>
              <button
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-slate-200 rounded text-slate-600 hover:bg-white disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PRINTABLE OFFICIAL RECEIPT VOUCHER MODAL */}
      {isVoucherOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden transform transition-all">
            {/* Modal Actions Header (Hidden in Print) */}
            <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <Receipt className="w-4 h-4 text-indigo-600" />
                Official Fee Payment Receipt
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Voucher
                </button>
                <button
                  onClick={() => setIsVoucherOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Voucher Document */}
            <div id="printable-voucher" className="p-8 space-y-6 text-slate-800">
              {/* Institution Header */}
              <div className="text-center border-b pb-5 border-slate-200">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  DEMO PUBLIC SCHOOL & JUNIOR COLLEGE
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Affiliated to Central Board of Secondary Education • School Code: SCH001
                </p>
                <p className="text-xs text-slate-500">
                  Sector 14, Institutional Area, Knowledge Park • Tel: +91 11 2345 6789
                </p>
                <div className="inline-block mt-3 px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold uppercase rounded-md tracking-wider border border-slate-300">
                  FEE PAYMENT RECEIPT / VOUCHER
                </div>
              </div>

              {/* Receipt & Student Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <p>
                    <span className="text-slate-500 font-medium">Receipt No:</span>{' '}
                    <span className="font-mono font-bold text-indigo-700">
                      {selectedPayment.receiptNumber}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Payment Date:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {new Date(selectedPayment.paymentDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Invoice No:</span>{' '}
                    <span className="font-mono text-slate-700">
                      {selectedPayment.invoice?.invoiceNumber || '—'}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Payment Mode:</span>{' '}
                    <span className="font-semibold uppercase text-slate-800">
                      {selectedPayment.paymentMode}
                    </span>
                    {selectedPayment.referenceNumber && (
                      <span className="text-slate-500"> (Ref: {selectedPayment.referenceNumber})</span>
                    )}
                  </p>
                </div>

                <div className="space-y-1.5 text-right">
                  <p>
                    <span className="text-slate-500 font-medium">Student Name:</span>{' '}
                    <span className="font-bold text-slate-900">
                      {selectedPayment.student
                        ? `${selectedPayment.student.firstName} ${selectedPayment.student.lastName}`
                        : '—'}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Admission No:</span>{' '}
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedPayment.student?.admissionNumber || '—'}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Class & Section:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedPayment.student?.class
                        ? `${selectedPayment.student.class.name} - ${
                            selectedPayment.student.section?.name || ''
                          }`
                        : '—'}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Roll No:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedPayment.student?.rollNumber || '—'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Payment Summary Box */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Description / Particulars</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">
                          {selectedPayment.invoice?.title || 'School Fee Installment'}
                        </span>
                        {selectedPayment.remarks && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Remarks: {selectedPayment.remarks}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                        ₹
                        {Number(selectedPayment.amount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td className="px-4 py-2.5 font-bold text-slate-900 text-right">
                        Total Amount Received:
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-emerald-700 text-right text-sm">
                        ₹
                        {Number(selectedPayment.amount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount in Words */}
              <div className="text-xs bg-emerald-50/60 border border-emerald-200/70 p-3 rounded-lg text-emerald-900">
                <span className="font-semibold">Amount in Words: </span>
                <span className="italic">{numberToWords(Number(selectedPayment.amount))}</span>
              </div>

              {/* Balance status reminder */}
              {selectedPayment.invoice && (
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    Invoice Subtotal: ₹
                    {Number(selectedPayment.invoice.totalAmount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span>
                    Outstanding Invoice Balance: ₹
                    {Number(selectedPayment.invoice.balanceAmount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Signatures & Footer */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-dashed border-slate-300 pt-1">
                    <p className="font-semibold text-slate-700">Parent / Depositor Signature</p>
                    <p className="text-[10px] text-slate-400">Received with thanks</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="h-10"></div>
                  <div className="border-t border-dashed border-slate-300 pt-1">
                    <p className="font-semibold text-slate-700">Cashier / Authorized Signatory</p>
                    <p className="text-[10px] text-slate-400">
                      {selectedPayment.collectedBy
                        ? `${selectedPayment.collectedBy.firstName} ${selectedPayment.collectedBy.lastName}`
                        : 'Accounts Department'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-3">
                This is a computer-generated voucher issued by School ERP Enterprise Suite. No signature required.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
