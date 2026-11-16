import test from 'node:test';
import assert from 'node:assert/strict';
import { initialAuthUsers, initialSchoolState, TODAY_DATE } from '../data/seedData';
import {
  applyPaymentToState,
  authenticateUser,
  buildTransactionsCsv,
  calculateDashboardMetrics,
  deriveInvoiceStatus,
  formatKsh,
  getInvoiceBalance,
  hasScheduleConflict,
  registerUser,
  updateLessonStatusInState,
  validatePaymentInput,
} from './schoolLogic';

test('formatKsh formats Kenyan Shilling amounts cleanly', () => {
  assert.equal(formatKsh(24500), 'KSh 24,500');
  assert.equal(formatKsh(0), 'KSh 0');
});

test('hasScheduleConflict detects instructor, student, and vehicle conflicts on same date/time', () => {
  const instructorConflict = hasScheduleConflict(initialSchoolState.lessons, {
    date: TODAY_DATE,
    time: '08:30',
    instructorId: 'ins-201',
    studentId: 'stu-106',
    vehiclePlate: 'KDM 809R',
  });
  assert.equal(instructorConflict.conflict, true);
  assert.match(instructorConflict.reason || '', /Instructor/);

  const noConflict = hasScheduleConflict(initialSchoolState.lessons, {
    date: TODAY_DATE,
    time: '16:00',
    instructorId: 'ins-202',
    studentId: 'stu-106',
    vehiclePlate: 'KDM 809R',
  });
  assert.equal(noConflict.conflict, false);
});

test('validatePaymentInput rejects invalid amounts, overpayments, and short references', () => {
  const partialInvoice = initialSchoolState.invoices[0]; // total 22500, paid 15000, balance 7500
  assert.equal(getInvoiceBalance(partialInvoice), 7500);

  assert.equal(validatePaymentInput(partialInvoice, 0, 'UJK999').valid, false);
  assert.equal(validatePaymentInput(partialInvoice, 8000, 'UJK999').valid, false);
  assert.equal(validatePaymentInput(partialInvoice, 5000, 'AB').valid, false);
  assert.equal(validatePaymentInput(partialInvoice, 7500, 'SHK94L21PQ').valid, true);
});

test('applyPaymentToState updates invoice balance, status, and prepends ledger transaction', () => {
  const result = applyPaymentToState(initialSchoolState, {
    invoiceId: 'inv-401',
    amountKsh: 7500,
    method: 'M-Pesa',
    reference: 'shk94l21pq',
    paidAt: '2026-11-16 10:05',
    todayDate: TODAY_DATE,
  });

  assert.equal(result.error, undefined);
  assert.ok(result.transaction);
  assert.equal(result.transaction.reference, 'SHK94L21PQ');

  const updatedInvoice = result.nextState.invoices.find((i) => i.id === 'inv-401');
  assert.equal(updatedInvoice?.paidAmountKsh, 22500);
  assert.equal(updatedInvoice?.status, 'Paid');
  assert.equal(result.nextState.transactions.length, initialSchoolState.transactions.length + 1);
});

test('deriveInvoiceStatus handles Paid, Overdue, Partial, and Unpaid accurately', () => {
  assert.equal(deriveInvoiceStatus(20000, 20000, '2026-11-10', TODAY_DATE), 'Paid');
  assert.equal(deriveInvoiceStatus(20000, 5000, '2026-11-10', TODAY_DATE), 'Overdue');
  assert.equal(deriveInvoiceStatus(20000, 5000, '2026-11-25', TODAY_DATE), 'Partial');
  assert.equal(deriveInvoiceStatus(20000, 0, '2026-11-25', TODAY_DATE), 'Unpaid');
});

test('updateLessonStatusInState updates student completed hours when marked Completed', () => {
  const beforeStudent = initialSchoolState.students.find((s) => s.id === 'stu-102');
  const nextState = updateLessonStatusInState(initialSchoolState, 'les-302', 'Completed');
  const afterStudent = nextState.students.find((s) => s.id === 'stu-102');

  assert.equal(beforeStudent?.completedHours, 22);
  assert.equal(afterStudent?.completedHours, 24);
});

test('calculateDashboardMetrics aggregates revenue, outstanding fees, and active instructors', () => {
  const metrics = calculateDashboardMetrics(initialSchoolState, TODAY_DATE);
  assert.equal(metrics.lessonsTodayCount, 5);
  assert.equal(metrics.activeInstructorsCount, 3);
  assert.equal(metrics.totalCollectedKsh, 83000);
  assert.equal(metrics.outstandingBalanceKsh, 58500);
});

test('buildTransactionsCsv exports header and transaction rows', () => {
  const csv = buildTransactionsCsv(initialSchoolState);
  const lines = csv.split('\n');
  assert.equal(lines.length, initialSchoolState.transactions.length + 1);
  assert.match(lines[0], /Receipt ID,Invoice,Student/);
});

test('authenticateUser validates credentials case-insensitively and rejects wrong password', () => {
  const valid = authenticateUser(initialAuthUsers, 'OTIENO@anzaauto.co.ke', 'anza2026');
  assert.equal(valid.error, undefined);
  assert.equal(valid.user?.fullName, 'Wanjala Otieno');

  const invalid = authenticateUser(initialAuthUsers, 'otieno@anzaauto.co.ke', 'wrongpass');
  assert.equal(invalid.user, undefined);
  assert.match(invalid.error || '', /Invalid email or password/);
});

test('registerUser creates a new user and prevents duplicate email registration', () => {
  const created = registerUser(initialAuthUsers, {
    fullName: 'Catherine Muthoni',
    email: 'catherine@anzaauto.co.ke',
    password: 'pass1234',
    role: 'Operations Staff',
    branch: 'Kilimani',
    todayDate: TODAY_DATE,
  });
  assert.equal(created.error, undefined);
  assert.equal(created.nextUsers.length, initialAuthUsers.length + 1);

  const duplicate = registerUser(created.nextUsers, {
    fullName: 'Duplicate User',
    email: 'CATHERINE@anzaauto.co.ke',
    password: 'pass1234',
    role: 'Student',
    branch: 'Westlands',
    todayDate: TODAY_DATE,
  });
  assert.match(duplicate.error || '', /already exists/);
  assert.equal(duplicate.nextUsers.length, created.nextUsers.length);
});
