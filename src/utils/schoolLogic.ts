import {
  AuthUser,
  BranchName,
  Instructor,
  InstructorStatus,
  Invoice,
  InvoiceStatus,
  Lesson,
  LessonStatus,
  PaymentMethod,
  PaymentTransaction,
  SchoolState,
  UserRole,
} from '../types/school';

export function formatKsh(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `KSh ${safe.toLocaleString('en-KE')}`;
}

export function getInvoiceBalance(invoice: Pick<Invoice, 'totalAmountKsh' | 'paidAmountKsh'>): number {
  return Math.max(0, invoice.totalAmountKsh - invoice.paidAmountKsh);
}

export function deriveInvoiceStatus(
  totalAmountKsh: number,
  paidAmountKsh: number,
  dueDate: string,
  todayDate: string
): InvoiceStatus {
  if (paidAmountKsh >= totalAmountKsh && totalAmountKsh > 0) {
    return 'Paid';
  }
  if (dueDate < todayDate && paidAmountKsh < totalAmountKsh) {
    return 'Overdue';
  }
  if (paidAmountKsh > 0) {
    return 'Partial';
  }
  return 'Unpaid';
}

export interface ConflictCheckInput {
  date: string;
  time: string;
  instructorId: string;
  studentId: string;
  vehiclePlate: string;
  excludeLessonId?: string;
}

export function hasScheduleConflict(
  lessons: Lesson[],
  candidate: ConflictCheckInput
): { conflict: boolean; reason?: string } {
  const activeLessons = lessons.filter(
    (l) => l.status !== 'Cancelled' && l.id !== candidate.excludeLessonId
  );

  for (const lesson of activeLessons) {
    if (lesson.date !== candidate.date || lesson.time !== candidate.time) {
      continue;
    }
    if (lesson.instructorId === candidate.instructorId) {
      return {
        conflict: true,
        reason: `Instructor is already booked at ${candidate.time} on ${candidate.date}.`,
      };
    }
    if (lesson.studentId === candidate.studentId) {
      return {
        conflict: true,
        reason: `Student already has another lesson at ${candidate.time} on ${candidate.date}.`,
      };
    }
    if (candidate.vehiclePlate && lesson.vehiclePlate === candidate.vehiclePlate) {
      return {
        conflict: true,
        reason: `Vehicle ${candidate.vehiclePlate} is already assigned at ${candidate.time}.`,
      };
    }
  }

  return { conflict: false };
}

export interface PaymentValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePaymentInput(
  invoice: Invoice,
  amountKsh: number,
  reference: string
): PaymentValidationResult {
  if (!Number.isFinite(amountKsh) || amountKsh <= 0) {
    return { valid: false, error: 'Payment amount must be greater than KSh 0.' };
  }
  const balance = getInvoiceBalance(invoice);
  if (balance <= 0) {
    return { valid: false, error: 'This invoice is already settled in full.' };
  }
  if (amountKsh > balance) {
    return {
      valid: false,
      error: `Payment exceeds remaining balance (${formatKsh(balance)}).`,
    };
  }
  if (!reference.trim() || reference.trim().length < 3) {
    return {
      valid: false,
      error: 'Enter a valid M-Pesa code, card approval, or receipt reference.',
    };
  }
  return { valid: true };
}

export function applyPaymentToState(
  state: SchoolState,
  params: {
    invoiceId: string;
    amountKsh: number;
    method: PaymentMethod;
    reference: string;
    paidAt: string;
    todayDate: string;
    recordedBy?: string;
  }
): { nextState: SchoolState; transaction?: PaymentTransaction; error?: string } {
  const invoice = state.invoices.find((inv) => inv.id === params.invoiceId);
  if (!invoice) {
    return { nextState: state, error: 'Invoice not found.' };
  }

  const validation = validatePaymentInput(invoice, params.amountKsh, params.reference);
  if (!validation.valid) {
    return { nextState: state, error: validation.error };
  }

  const newPaid = invoice.paidAmountKsh + params.amountKsh;
  const updatedStatus = deriveInvoiceStatus(
    invoice.totalAmountKsh,
    newPaid,
    invoice.dueDate,
    params.todayDate
  );

  const transaction: PaymentTransaction = {
    id: `tx-${Date.now()}`,
    invoiceId: invoice.id,
    studentId: invoice.studentId,
    amountKsh: params.amountKsh,
    method: params.method,
    reference: params.reference.trim().toUpperCase(),
    paidAt: params.paidAt,
    recordedBy: params.recordedBy || 'Operations Desk',
  };

  const nextInvoices = state.invoices.map((inv) =>
    inv.id === invoice.id
      ? { ...inv, paidAmountKsh: newPaid, status: updatedStatus }
      : inv
  );

  return {
    nextState: {
      ...state,
      invoices: nextInvoices,
      transactions: [transaction, ...state.transactions],
    },
    transaction,
  };
}

export function updateLessonStatusInState(
  state: SchoolState,
  lessonId: string,
  nextStatus: LessonStatus
): SchoolState {
  const existing = state.lessons.find((l) => l.id === lessonId);
  if (!existing || existing.status === nextStatus) {
    return state;
  }

  const wasCompleted = existing.status === 'Completed';
  const willBeCompleted = nextStatus === 'Completed';
  let hoursDelta = 0;
  if (!wasCompleted && willBeCompleted) {
    hoursDelta = existing.durationHours;
  } else if (wasCompleted && !willBeCompleted) {
    hoursDelta = -existing.durationHours;
  }

  const nextLessons = state.lessons.map((l) =>
    l.id === lessonId ? { ...l, status: nextStatus } : l
  );

  const nextStudents =
    hoursDelta === 0
      ? state.students
      : state.students.map((s) =>
          s.id === existing.studentId
            ? {
                ...s,
                completedHours: Math.max(0, s.completedHours + hoursDelta),
              }
            : s
        );

  const nextInstructors =
    hoursDelta === 0
      ? state.instructors
      : state.instructors.map((ins) =>
          ins.id === existing.instructorId
            ? { ...ins, hoursToday: Math.max(0, ins.hoursToday + hoursDelta) }
            : ins
        );

  return {
    ...state,
    lessons: nextLessons,
    students: nextStudents,
    instructors: nextInstructors,
  };
}

export function calculateDashboardMetrics(state: SchoolState, todayDate: string) {
  const todaysLessons = state.lessons.filter(
    (l) => l.date === todayDate && l.status !== 'Cancelled'
  );
  const activeInstructors = state.instructors.filter(
    (i) => i.status === 'On Road' || i.status === 'Theory Class'
  );
  const availableInstructors = state.instructors.filter((i) => i.status === 'Available');

  const totalBilledKsh = state.invoices.reduce((sum, inv) => sum + inv.totalAmountKsh, 0);
  const totalCollectedKsh = state.invoices.reduce((sum, inv) => sum + inv.paidAmountKsh, 0);
  const outstandingBalanceKsh = state.invoices.reduce(
    (sum, inv) => sum + getInvoiceBalance(inv),
    0
  );
  const overdueInvoicesCount = state.invoices.filter((inv) => inv.status === 'Overdue').length;

  return {
    lessonsTodayCount: todaysLessons.length,
    inProgressLessonsCount: todaysLessons.filter((l) => l.status === 'In Progress').length,
    activeInstructorsCount: activeInstructors.length,
    availableInstructorsCount: availableInstructors.length,
    totalInstructorsCount: state.instructors.length,
    totalStudentsCount: state.students.length,
    totalBilledKsh,
    totalCollectedKsh,
    outstandingBalanceKsh,
    overdueInvoicesCount,
  };
}

export function filterInstructors(
  instructors: Instructor[],
  search: string,
  statusFilter: InstructorStatus | 'All'
): Instructor[] {
  const q = search.trim().toLowerCase();
  return instructors.filter((ins) => {
    if (statusFilter !== 'All' && ins.status !== statusFilter) return false;
    if (!q) return true;
    return [ins.fullName, ins.branch, ins.vehiclePlate, ins.vehicleModel, ins.currentZone]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}

export function buildTransactionsCsv(state: SchoolState): string {
  const headers = ['Receipt ID', 'Invoice', 'Student', 'Amount (KSh)', 'Method', 'Reference', 'Timestamp', 'Recorded By'];
  const rows = state.transactions.map((tx) => {
    const inv = state.invoices.find((i) => i.id === tx.invoiceId);
    const stu = state.students.find((s) => s.id === tx.studentId);
    return [
      tx.id,
      inv?.invoiceNumber ?? tx.invoiceId,
      stu?.fullName ?? tx.studentId,
      String(tx.amountKsh),
      tx.method,
      tx.reference,
      tx.paidAt,
      tx.recordedBy,
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

export function authenticateUser(
  users: AuthUser[],
  email: string,
  password: string
): { user?: AuthUser; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { error: 'Enter both email address and password.' };
  }
  const match = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );
  if (!match) {
    return { error: 'Invalid email or password.' };
  }
  return { user: match };
}

export function registerUser(
  users: AuthUser[],
  input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    branch: BranchName;
    todayDate: string;
  }
): { user?: AuthUser; nextUsers: AuthUser[]; error?: string } {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (!fullName) {
    return { nextUsers: users, error: 'Full name is required.' };
  }
  if (!email || !email.includes('@')) {
    return { nextUsers: users, error: 'Enter a valid email address.' };
  }
  if (!input.password || input.password.length < 4) {
    return { nextUsers: users, error: 'Password must be at least 4 characters.' };
  }
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { nextUsers: users, error: 'An account with this email already exists.' };
  }

  const user: AuthUser = {
    id: `usr-${Date.now()}`,
    fullName,
    email,
    password: input.password,
    role: input.role,
    branch: input.branch,
    createdAt: input.todayDate,
  };

  return {
    user,
    nextUsers: [user, ...users],
  };
}
