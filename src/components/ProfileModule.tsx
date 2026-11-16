import { LogOut, Mail, MapPin, Phone, UserCheck } from 'lucide-react';
import { ModuleTab, SchoolState, UserAccount } from '../types/school';
import { formatKsh, getInvoiceBalance } from '../utils/schoolLogic';

interface ProfileModuleProps {
  currentUser: UserAccount;
  state: SchoolState;
  onNavigate: (tab: ModuleTab) => void;
  onSignOut: () => void;
}

export function ProfileModule({
  currentUser,
  state,
  onNavigate,
  onSignOut,
}: ProfileModuleProps) {
  const matchedStudent = state.students.find(
    (s) => s.fullName.toLowerCase() === currentUser.fullName.toLowerCase()
  );
  const matchedInstructor = state.instructors.find(
    (i) => i.fullName.toLowerCase() === currentUser.fullName.toLowerCase()
  );

  const studentInvoices = matchedStudent
    ? state.invoices.filter((inv) => inv.studentId === matchedStudent.id)
    : [];
  const totalBalance = studentInvoices.reduce((sum, inv) => sum + getInvoiceBalance(inv), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#16241c]">
            Account &amp; Profile
          </h1>
          <p className="mt-1 text-sm text-[#54685b]">
            Signed-in credentials, branch assignment, and session management.
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-2 rounded-lg border border-[#dce6de] bg-white px-4 py-2 text-sm font-semibold text-[#991b1b] hover:bg-[#fef2f2] whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-xl bg-white border border-[#dce6de] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[#eaf0eb]">
            <div>
              <p className="text-xs font-semibold text-[#16834a]">
                {currentUser.role} · {currentUser.branch} Branch
              </p>
              <h2 className="mt-1 font-display text-xl font-bold text-[#16241c]">
                {currentUser.fullName}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16834a]">
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              <span>Active Session</span>
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-[#54685b] flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Email Address</span>
              </dt>
              <dd className="mt-1 font-mono-num text-sm font-medium text-[#16241c]">
                {currentUser.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#54685b] flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Phone Number</span>
              </dt>
              <dd className="mt-1 font-mono-num text-sm font-medium text-[#16241c]">
                {currentUser.phone}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#54685b] flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Assigned Branch</span>
              </dt>
              <dd className="mt-1 font-medium text-[#16241c]">{currentUser.branch}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#54685b]">Account Created</dt>
              <dd className="mt-1 font-mono-num text-sm font-medium text-[#16241c]">
                {currentUser.createdAt}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl bg-white border border-[#dce6de] p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-[#16241c]">
            Role Workspace Summary
          </h2>

          {matchedStudent ? (
            <div className="space-y-3 text-sm">
              <p className="text-[#54685b]">
                Enrolled in <strong className="text-[#16241c]">{matchedStudent.licenseClass}</strong>.
              </p>
              <p className="font-mono-num text-xs text-[#16241c]">
                Logbook: {matchedStudent.completedHours} / {matchedStudent.requiredHours} hrs completed
              </p>
              <p className="font-mono-num text-xs text-[#16241c]">
                Fee Balance: {formatKsh(totalBalance)}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('payments')}
                className="w-full rounded-lg bg-[#16834a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#147441]"
              >
                View Tuition &amp; Receipts
              </button>
            </div>
          ) : matchedInstructor ? (
            <div className="space-y-3 text-sm">
              <p className="text-[#54685b]">
                Assigned vehicle: <strong className="font-mono-num text-[#16241c]">{matchedInstructor.vehiclePlate}</strong>
              </p>
              <p className="text-xs text-[#54685b]">{matchedInstructor.vehicleModel}</p>
              <p className="font-mono-num text-xs text-[#16834a]">
                NTSA Pass Rate: {matchedInstructor.passRatePercent}%
              </p>
              <button
                type="button"
                onClick={() => onNavigate('instructors')}
                className="w-full rounded-lg bg-[#16834a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#147441]"
              >
                Open Fleet Tracking
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-xs text-[#54685b] leading-relaxed">
                Signed in with full operations access across student scheduling, instructor dispatch, and KSh payment processing.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('overview')}
                className="w-full rounded-lg bg-[#103c2a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#16834a]"
              >
                Return to Overview
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
