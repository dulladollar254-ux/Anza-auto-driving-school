import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2, Menu } from 'lucide-react';
import { AccountModule } from './components/AccountModule';
import { CoursesModule } from './components/CoursesModule';
import { InstructorModule } from './components/InstructorModule';
import { OverviewModule } from './components/OverviewModule';
import { PaymentsModule } from './components/PaymentsModule';
import { SchedulingModule } from './components/SchedulingModule';
import { Sidebar } from './components/Sidebar';
import { TODAY_DATE } from './data/seedData';
import {
  AuthUser,
  BranchName,
  CoursePackage,
  Instructor,
  Invoice,
  Lesson,
  LessonStatus,
  LicenseClass,
  ModuleTab,
  PaymentMethod,
  SchoolState,
  Student,
  UserRole,
} from './types/school';
import {
  applyPaymentToState,
  authenticateUser,
  calculateDashboardMetrics,
  formatKsh,
  registerUser,
  updateLessonStatusInState,
} from './utils/schoolLogic';
import {
  loadAuthUsers,
  loadCurrentUserId,
  loadSchoolState,
  resetSchoolState,
  saveAuthUsers,
  saveCurrentUserId,
  saveSchoolState,
} from './utils/storage';

const TAB_TITLES: Record<ModuleTab, string> = {
  overview: 'Overview',
  scheduling: 'Student Scheduling',
  instructors: 'Instructor Tracking',
  payments: 'Payment Processing',
  courses: 'Courses & Tuition',
  account: 'Login / Logout',
};

function resolveInitialTab(): ModuleTab {
  if (typeof window === 'undefined') return 'overview';
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab') as ModuleTab | null;
  if (tab && tab in TAB_TITLES) return tab;
  return 'overview';
}

export default function App() {
  const [state, setState] = useState<SchoolState>(() => loadSchoolState());
  const [authUsers, setAuthUsers] = useState<AuthUser[]>(() => loadAuthUsers());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => loadCurrentUserId());
  const [activeTab, setActiveTab] = useState<ModuleTab>(resolveInitialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const currentUser = useMemo(
    () => authUsers.find((u) => u.id === currentUserId) ?? null,
    [authUsers, currentUserId]
  );

  useEffect(() => {
    saveSchoolState(state);
  }, [state]);

  useEffect(() => {
    saveAuthUsers(authUsers);
  }, [authUsers]);

  useEffect(() => {
    saveCurrentUserId(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const metrics = useMemo(() => calculateDashboardMetrics(state, TODAY_DATE), [state]);

  const handleOpenScheduleModal = () => {
    setActiveTab('scheduling');
    setScheduleModalOpen(true);
  };

  const handleAddLesson = (lessonInput: Omit<Lesson, 'id'>) => {
    const newLesson: Lesson = {
      ...lessonInput,
      id: `les-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      lessons: [newLesson, ...prev.lessons],
    }));
    const stu = state.students.find((s) => s.id === lessonInput.studentId);
    setNotice(`Scheduled ${lessonInput.lessonType} for ${stu?.fullName ?? 'student'} on ${lessonInput.date} at ${lessonInput.time}.`);
  };

  const handleUpdateLessonStatus = (lessonId: string, status: LessonStatus) => {
    setState((prev) => updateLessonStatusInState(prev, lessonId, status));
    setNotice(`Lesson status updated to ${status}.`);
  };

  const handleEnrollStudent = (input: {
    fullName: string;
    phone: string;
    email: string;
    nationalId: string;
    branch: BranchName;
    licenseClass: LicenseClass;
    course?: CoursePackage;
  }) => {
    const matchingCourse =
      input.course ??
      state.courses.find((c) => c.licenseClass === input.licenseClass) ??
      state.courses[0];

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      nationalId: input.nationalId,
      branch: input.branch,
      licenseClass: input.licenseClass,
      completedHours: 0,
      requiredHours: matchingCourse.practicalHours,
      enrolledDate: TODAY_DATE,
      ntsaStage: 'Theory',
    };

    const nextSeq = 100 + state.invoices.length + 1;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-0${nextSeq}`,
      studentId: newStudent.id,
      description: `${matchingCourse.title} (${matchingCourse.practicalHours} hrs)`,
      totalAmountKsh: matchingCourse.feeKsh,
      paidAmountKsh: 0,
      dueDate: '2026-11-30',
      issuedDate: TODAY_DATE,
      status: 'Unpaid',
    };

    setState((prev) => ({
      ...prev,
      students: [newStudent, ...prev.students],
      invoices: [newInvoice, ...prev.invoices],
    }));
    setNotice(
      `Enrolled ${newStudent.fullName} in ${input.licenseClass} and issued ${newInvoice.invoiceNumber} (${formatKsh(newInvoice.totalAmountKsh)}).`
    );
  };

  const handleUpdateInstructor = (
    instructorId: string,
    patch: Partial<Pick<Instructor, 'status' | 'currentZone' | 'activeStudentName'>>
  ) => {
    setState((prev) => ({
      ...prev,
      instructors: prev.instructors.map((ins) =>
        ins.id === instructorId ? { ...ins, ...patch } : ins
      ),
    }));
    setNotice('Instructor tracking updated.');
  };

  const handleAddInstructor = (input: Omit<Instructor, 'id'>) => {
    const newIns: Instructor = {
      ...input,
      id: `ins-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      instructors: [newIns, ...prev.instructors],
    }));
    setNotice(`Registered instructor ${newIns.fullName} with vehicle ${newIns.vehiclePlate}.`);
  };

  const handleRecordPayment = (params: {
    invoiceId: string;
    amountKsh: number;
    method: PaymentMethod;
    reference: string;
  }) => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    const result = applyPaymentToState(state, {
      invoiceId: params.invoiceId,
      amountKsh: params.amountKsh,
      method: params.method,
      reference: params.reference,
      paidAt: `${TODAY_DATE} ${nowTime}`,
      todayDate: TODAY_DATE,
      recordedBy: currentUser?.fullName ?? 'Operations Desk',
    });

    if (result.error || !result.transaction) {
      return { ok: false, error: result.error };
    }

    setState(result.nextState);
    setNotice(
      `Payment of ${formatKsh(params.amountKsh)} via ${params.method} recorded (${result.transaction.reference}).`
    );
    return { ok: true, transaction: result.transaction };
  };

  const handleCreateInvoice = (params: {
    studentId: string;
    description: string;
    totalAmountKsh: number;
    dueDate: string;
  }) => {
    const nextSeq = 100 + state.invoices.length + 1;
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-0${nextSeq}`,
      studentId: params.studentId,
      description: params.description,
      totalAmountKsh: params.totalAmountKsh,
      paidAmountKsh: 0,
      dueDate: params.dueDate,
      issuedDate: TODAY_DATE,
      status: params.dueDate < TODAY_DATE ? 'Overdue' : 'Unpaid',
    };
    setState((prev) => ({
      ...prev,
      invoices: [newInv, ...prev.invoices],
    }));
    setNotice(`Issued invoice ${newInv.invoiceNumber} for ${formatKsh(newInv.totalAmountKsh)}.`);
  };

  const handleResetDemoData = () => {
    const fresh = resetSchoolState();
    setState(fresh);
    setNotice('Sample driving school records restored.');
  };

  const handleLogin = (email: string, password: string) => {
    const res = authenticateUser(authUsers, email, password);
    if (!res.user) {
      return { ok: false, error: res.error };
    }
    setCurrentUserId(res.user.id);
    setNotice(`Signed in as ${res.user.fullName} (${res.user.role}).`);
    return { ok: true };
  };

  const handleRegister = (input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    branch: BranchName;
  }) => {
    const res = registerUser(authUsers, {
      ...input,
      todayDate: TODAY_DATE,
    });
    if (!res.user) {
      return { ok: false, error: res.error };
    }
    setAuthUsers(res.nextUsers);
    setCurrentUserId(res.user.id);
    setNotice(`Account created. Signed in as ${res.user.fullName}.`);
    return { ok: true };
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setNotice('You have been logged out.');
  };

  return (
    <div className="min-h-screen flex bg-[#f3f7f4] text-[#16241c]">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        counts={{
          lessonsToday: metrics.lessonsTodayCount,
          activeInstructors: metrics.activeInstructorsCount,
          overdueInvoices: metrics.overdueInvoicesCount,
        }}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#dce6de] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-md p-2 -ml-2 text-[#16241c] hover:bg-[#f2f7f3]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="lg:hidden font-display font-bold text-[#103c2a] whitespace-nowrap shrink-0">
                Anza Auto
              </span>
              <span className="hidden lg:inline text-[#54685b] whitespace-nowrap">
                Anza Auto Operations
              </span>
              <span className="hidden lg:inline text-[#9db0a4]" aria-hidden="true">/</span>
              <span className="hidden lg:inline font-semibold text-[#16241c] truncate">
                {TAB_TITLES[activeTab]}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleOpenScheduleModal}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16834a] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#147441] transition-colors whitespace-nowrap shrink-0"
            >
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Schedule Lesson</span>
            </button>
          </div>
        </header>

        {/* Live Action Feedback Banner */}
        <div aria-live="polite" className="px-4 sm:px-6 lg:px-8">
          {notice && (
            <div className="mt-4 rounded-lg bg-[#e8f5ec] border border-[#b9dfc5] px-4 py-2.5 text-xs font-medium text-[#103c2a] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#16834a] shrink-0" aria-hidden="true" />
              <span>{notice}</span>
            </div>
          )}
        </div>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewModule
              state={state}
              onNavigate={setActiveTab}
              onOpenScheduleModal={handleOpenScheduleModal}
              onUpdateLessonStatus={handleUpdateLessonStatus}
            />
          )}

          {activeTab === 'scheduling' && (
            <SchedulingModule
              state={state}
              scheduleModalOpen={scheduleModalOpen}
              onOpenScheduleModal={() => setScheduleModalOpen(true)}
              onCloseScheduleModal={() => setScheduleModalOpen(false)}
              onAddLesson={handleAddLesson}
              onUpdateLessonStatus={handleUpdateLessonStatus}
              onEnrollStudent={handleEnrollStudent}
            />
          )}

          {activeTab === 'instructors' && (
            <InstructorModule
              state={state}
              onUpdateInstructor={handleUpdateInstructor}
              onAddInstructor={handleAddInstructor}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsModule
              state={state}
              onRecordPayment={handleRecordPayment}
              onCreateInvoice={handleCreateInvoice}
            />
          )}

          {activeTab === 'courses' && (
            <CoursesModule
              state={state}
              onEnrollInCourse={handleEnrollStudent}
              onResetDemoData={handleResetDemoData}
            />
          )}

          {activeTab === 'account' && (
            <AccountModule
              currentUser={currentUser}
              users={authUsers}
              onLogin={handleLogin}
              onRegister={handleRegister}
              onLogout={handleLogout}
            />
          )}
        </main>

        <footer className="border-t border-[#dce6de] bg-white px-4 sm:px-6 lg:px-8 py-4 text-xs text-[#54685b] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>Anza Auto Driving School Management</span>
          <span>Westlands · Kilimani · Mombasa Nyali · Nakuru</span>
        </footer>
      </div>
    </div>
  );
}
