import { useMemo, useState } from 'react';
import { CreditCard, Download, FileText, Plus, Receipt, Search, X } from 'lucide-react';
import { TODAY_DATE } from '../data/seedData';
import {
  Invoice,
  InvoiceStatus,
  PaymentMethod,
  PaymentTransaction,
  SchoolState,
} from '../types/school';
import {
  buildTransactionsCsv,
  calculateDashboardMetrics,
  formatKsh,
  getInvoiceBalance,
  validatePaymentInput,
} from '../utils/schoolLogic';
import { StatusBadge } from './StatusBadge';

interface PaymentsModuleProps {
  state: SchoolState;
  onRecordPayment: (params: {
    invoiceId: string;
    amountKsh: number;
    method: PaymentMethod;
    reference: string;
  }) => { ok: boolean; error?: string; transaction?: PaymentTransaction };
  onCreateInvoice: (params: {
    studentId: string;
    description: string;
    totalAmountKsh: number;
    dueDate: string;
  }) => void;
}

const INVOICE_FILTERS: (InvoiceStatus | 'All')[] = ['All', 'Overdue', 'Partial', 'Unpaid', 'Paid'];
const PAYMENT_METHODS: PaymentMethod[] = ['M-Pesa', 'Card', 'Bank Transfer', 'Cash'];

export function PaymentsModule({
  state,
  onRecordPayment,
  onCreateInvoice,
}: PaymentsModuleProps) {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [search, setSearch] = useState('');

  // Record payment modal
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('M-Pesa');
  const [payReference, setPayReference] = useState('');
  const [payError, setPayError] = useState('');

  // Receipt modal
  const [receiptTx, setReceiptTx] = useState<PaymentTransaction | null>(null);

  // Create invoice modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invStudentId, setInvStudentId] = useState(state.students[0]?.id ?? '');
  const [invDesc, setInvDesc] = useState('NTSA Practical Refresher Bundle (5 hrs)');
  const [invAmount, setInvAmount] = useState('6500');
  const [invDueDate, setInvDueDate] = useState('2026-11-28');
  const [invError, setInvError] = useState('');

  const metrics = useMemo(() => calculateDashboardMetrics(state, TODAY_DATE), [state]);
  const studentById = useMemo(
    () => new Map(state.students.map((s) => [s.id, s])),
    [state.students]
  );
  const invoiceById = useMemo(
    () => new Map(state.invoices.map((i) => [i.id, i])),
    [state.invoices]
  );

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.invoices.filter((inv) => {
      if (statusFilter !== 'All' && inv.status !== statusFilter) return false;
      if (!q) return true;
      const student = studentById.get(inv.studentId);
      return [inv.invoiceNumber, inv.description, student?.fullName, student?.branch]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [state.invoices, statusFilter, search, studentById]);

  const openPayModal = (invoice: Invoice) => {
    const balance = getInvoiceBalance(invoice);
    setPayingInvoice(invoice);
    setPayAmount(String(balance));
    setPayMethod('M-Pesa');
    setPayReference('');
    setPayError('');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    setPayError('');

    const parsedAmount = Number(payAmount);
    const check = validatePaymentInput(payingInvoice, parsedAmount, payReference);
    if (!check.valid) {
      setPayError(check.error ?? 'Invalid payment details.');
      return;
    }

    const res = onRecordPayment({
      invoiceId: payingInvoice.id,
      amountKsh: parsedAmount,
      method: payMethod,
      reference: payReference,
    });

    if (!res.ok) {
      setPayError(res.error ?? 'Could not record payment.');
      return;
    }

    setPayingInvoice(null);
    if (res.transaction) {
      setReceiptTx(res.transaction);
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setInvError('');
    const parsed = Number(invAmount);
    if (!invStudentId || !invDesc.trim()) {
      setInvError('Select a student and enter a fee description.');
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setInvError('Invoice amount must be greater than KSh 0.');
      return;
    }
    onCreateInvoice({
      studentId: invStudentId,
      description: invDesc.trim(),
      totalAmountKsh: parsed,
      dueDate: invDueDate || TODAY_DATE,
    });
    setInvoiceModalOpen(false);
  };

  const handleExportCsv = () => {
    const csv = buildTransactionsCsv(state);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anza-auto-payments-${TODAY_DATE}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#16241c]">
            Payment Processing &amp; Tuition Ledger
          </h1>
          <p className="mt-1 text-sm text-[#54685b]">
            Process M-Pesa, card, and bank payments, manage student balances, and issue receipts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dce6de] bg-white px-3.5 py-2 text-sm font-semibold text-[#16241c] hover:bg-[#f2f7f3] whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setInvoiceModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Billing Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-[#dce6de] p-5">
          <p className="text-xs font-medium text-[#54685b]">Total Tuition Billed</p>
          <p className="mt-1.5 font-mono-num text-2xl font-semibold text-[#16241c]">
            {formatKsh(metrics.totalBilledKsh)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-[#dce6de] p-5">
          <p className="text-xs font-medium text-[#54685b]">Collected Payments</p>
          <p className="mt-1.5 font-mono-num text-2xl font-semibold text-[#16834a]">
            {formatKsh(metrics.totalCollectedKsh)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-[#dce6de] p-5">
          <p className="text-xs font-medium text-[#54685b]">Outstanding Balance</p>
          <p className="mt-1.5 font-mono-num text-2xl font-semibold text-[#16241c]">
            {formatKsh(metrics.outstandingBalanceKsh)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white border border-[#dce6de] p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {INVOICE_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === status
                  ? 'bg-[#103c2a] text-white'
                  : 'bg-[#f4f7f5] text-[#45574b] hover:bg-[#e5eee8]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative lg:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#687a6e]"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search invoices by student or invoice number"
            placeholder="Search invoice #, student, or branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#d4dfd6] bg-white pl-9 pr-3 py-2 text-sm text-[#16241c] placeholder:text-[#7c8c81] focus:border-[#16834a] focus:outline-none"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <section className="rounded-xl bg-white border border-[#dce6de] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#eaf0eb]">
          <h2 className="font-display text-base font-semibold text-[#16241c]">
            Student Fee Invoices
          </h2>
        </div>
        {filteredInvoices.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-[#16241c]">No invoices match this filter</p>
            <p className="mt-1 text-xs text-[#54685b]">
              Switch invoice status filter or create a new fee invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f7faf8] text-xs font-medium text-[#54685b] border-b border-[#eaf0eb]">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-4 py-3">Student &amp; Package</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaf0eb]">
                {filteredInvoices.map((inv) => {
                  const student = studentById.get(inv.studentId);
                  const balance = getInvoiceBalance(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-[#f9fbf9]">
                      <td className="px-5 py-3.5 font-mono-num text-xs font-semibold text-[#16241c] whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-[#16241c]">
                          {student?.fullName ?? 'Student'}
                        </div>
                        <div className="text-xs text-[#54685b]">{inv.description}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono-num text-xs text-[#54685b] whitespace-nowrap">
                        {inv.dueDate}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono-num text-xs text-[#16241c] whitespace-nowrap">
                        {formatKsh(inv.totalAmountKsh)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono-num text-xs text-[#16834a] whitespace-nowrap">
                        {formatKsh(inv.paidAmountKsh)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono-num text-xs font-semibold text-[#16241c] whitespace-nowrap">
                        {formatKsh(balance)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {balance > 0 ? (
                          <button
                            type="button"
                            onClick={() => openPayModal(inv)}
                            aria-label={`Record payment for ${inv.invoiceNumber}`}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#16834a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#147441]"
                          >
                            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Record Payment</span>
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-[#54685b]">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Transaction Ledger */}
      <section className="rounded-xl bg-white border border-[#dce6de] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#eaf0eb] flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-[#16241c]">
              Payment Transaction Ledger
            </h2>
            <p className="text-xs text-[#54685b]">
              Recent M-Pesa, card, bank transfer, and cash receipts
            </p>
          </div>
          <span className="font-mono-num text-xs text-[#54685b]">
            {state.transactions.length} transactions
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f7faf8] text-xs font-medium text-[#54685b] border-b border-[#eaf0eb]">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">Student &amp; Invoice</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaf0eb]">
              {state.transactions.map((tx) => {
                const student = studentById.get(tx.studentId);
                const invoice = invoiceById.get(tx.invoiceId);
                return (
                  <tr key={tx.id} className="hover:bg-[#f9fbf9]">
                    <td className="px-5 py-3 font-mono-num text-xs text-[#54685b] whitespace-nowrap">
                      {tx.paidAt}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#16241c]">
                        {student?.fullName ?? 'Student'}
                      </div>
                      <div className="font-mono-num text-xs text-[#54685b]">
                        {invoice?.invoiceNumber ?? tx.invoiceId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-[#16241c]">{tx.method}</td>
                    <td className="px-4 py-3 font-mono-num text-xs text-[#34463b]">
                      {tx.reference}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num text-xs font-semibold text-[#16834a] whitespace-nowrap">
                      {formatKsh(tx.amountKsh)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setReceiptTx(tx)}
                        aria-label={`View receipt ${tx.reference}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#dce6de] bg-white px-2.5 py-1 text-xs font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                      >
                        <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Record Payment Modal */}
      {payingInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-[#dce6de] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaf0eb]">
              <h2 id="pay-modal-title" className="font-display text-lg font-bold text-[#16241c]">
                Process Tuition Payment
              </h2>
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                aria-label="Close payment modal"
                className="rounded-md p-1.5 text-[#54685b] hover:bg-[#f2f7f3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              {payError && (
                <div
                  role="alert"
                  className="rounded-lg bg-[#fee2e2] px-3.5 py-2.5 text-xs font-medium text-[#991b1b]"
                >
                  {payError}
                </div>
              )}

              <div className="rounded-lg bg-[#f4f7f5] p-3.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono-num font-semibold text-[#16241c]">
                    {payingInvoice.invoiceNumber}
                  </span>
                  <span className="font-medium text-[#54685b]">
                    {studentById.get(payingInvoice.studentId)?.fullName}
                  </span>
                </div>
                <p className="text-[#54685b]">{payingInvoice.description}</p>
                <p className="font-mono-num font-semibold text-[#16241c] pt-1">
                  Remaining Balance: {formatKsh(getInvoiceBalance(payingInvoice))}
                </p>
              </div>

              <div>
                <label htmlFor="pay-method" className="block text-xs font-semibold text-[#16241c] mb-1">
                  Payment Channel
                </label>
                <select
                  id="pay-method"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pay-amount" className="block text-xs font-semibold text-[#16241c] mb-1">
                  Amount (KSh)
                </label>
                <input
                  id="pay-amount"
                  type="number"
                  min={1}
                  max={getInvoiceBalance(payingInvoice)}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm font-mono-num text-[#16241c]"
                />
              </div>

              <div>
                <label htmlFor="pay-ref" className="block text-xs font-semibold text-[#16241c] mb-1">
                  Transaction Reference (M-Pesa Code / Receipt #)
                </label>
                <input
                  id="pay-ref"
                  type="text"
                  required
                  placeholder={payMethod === 'M-Pesa' ? 'e.g. SHK94L21PQ' : 'e.g. VISA-8821 or CASH-104'}
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm font-mono-num text-[#16241c]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#eaf0eb]">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="rounded-lg border border-[#dce6de] bg-white px-4 py-2 text-sm font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441]"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {invoiceModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-invoice-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-[#dce6de] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaf0eb]">
              <h2 id="new-invoice-title" className="font-display text-lg font-bold text-[#16241c]">
                Create Fee Invoice
              </h2>
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                aria-label="Close new invoice modal"
                className="rounded-md p-1.5 text-[#54685b] hover:bg-[#f2f7f3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              {invError && (
                <div
                  role="alert"
                  className="rounded-lg bg-[#fee2e2] px-3.5 py-2.5 text-xs font-medium text-[#991b1b]"
                >
                  {invError}
                </div>
              )}

              <div>
                <label htmlFor="inv-student" className="block text-xs font-semibold text-[#16241c] mb-1">
                  Student
                </label>
                <select
                  id="inv-student"
                  value={invStudentId}
                  onChange={(e) => setInvStudentId(e.target.value)}
                  className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                >
                  {state.students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.fullName} ({stu.branch})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="inv-desc" className="block text-xs font-semibold text-[#16241c] mb-1">
                  Fee Description
                </label>
                <input
                  id="inv-desc"
                  type="text"
                  required
                  value={invDesc}
                  onChange={(e) => setInvDesc(e.target.value)}
                  className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inv-amount" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Amount (KSh)
                  </label>
                  <input
                    id="inv-amount"
                    type="number"
                    min={100}
                    required
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm font-mono-num text-[#16241c]"
                  />
                </div>
                <div>
                  <label htmlFor="inv-due" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Due Date
                  </label>
                  <input
                    id="inv-due"
                    type="date"
                    required
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#eaf0eb]">
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="rounded-lg border border-[#dce6de] bg-white px-4 py-2 text-sm font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441]"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {receiptTx && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-[#dce6de] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaf0eb]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#16834a]" aria-hidden="true" />
                <h2 id="receipt-modal-title" className="font-display text-base font-bold text-[#16241c]">
                  Payment Receipt
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReceiptTx(null)}
                aria-label="Close receipt modal"
                className="rounded-md p-1.5 text-[#54685b] hover:bg-[#f2f7f3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="text-center pb-4 border-b border-dashed border-[#dce6de]">
                <p className="font-display text-lg font-bold text-[#103c2a]">Anza Auto Driving School</p>
                <p className="text-xs text-[#54685b]">Official Tuition Receipt · Kenya</p>
                <p className="mt-3 font-mono-num text-2xl font-bold text-[#16834a]">
                  {formatKsh(receiptTx.amountKsh)}
                </p>
              </div>

              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#54685b]">Student</dt>
                  <dd className="font-semibold text-[#16241c]">
                    {studentById.get(receiptTx.studentId)?.fullName ?? receiptTx.studentId}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#54685b]">Invoice</dt>
                  <dd className="font-mono-num font-medium text-[#16241c]">
                    {invoiceById.get(receiptTx.invoiceId)?.invoiceNumber ?? receiptTx.invoiceId}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#54685b]">Payment Method</dt>
                  <dd className="font-medium text-[#16241c]">{receiptTx.method}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#54685b]">Reference Code</dt>
                  <dd className="font-mono-num font-semibold text-[#16241c]">
                    {receiptTx.reference}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#54685b]">Paid At</dt>
                  <dd className="font-mono-num text-[#16241c]">{receiptTx.paidAt}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#54685b]">Recorded By</dt>
                  <dd className="text-[#16241c]">{receiptTx.recordedBy}</dd>
                </div>
              </dl>

              <div className="flex justify-end pt-3 border-t border-[#eaf0eb]">
                <button
                  type="button"
                  onClick={() => setReceiptTx(null)}
                  className="rounded-lg bg-[#103c2a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#16834a]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
