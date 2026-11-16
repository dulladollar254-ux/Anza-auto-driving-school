import { ArrowRight, CalendarPlus, CreditCard, MapPin } from 'lucide-react';
import { TODAY_DATE } from '../data/seedData';
import { LessonStatus, ModuleTab, SchoolState } from '../types/school';
import { calculateDashboardMetrics, formatKsh } from '../utils/schoolLogic';
import { StatusBadge } from './StatusBadge';

interface OverviewModuleProps {
  state: SchoolState;
  onNavigate: (tab: ModuleTab) => void;
  onOpenScheduleModal: () => void;
  onUpdateLessonStatus: (lessonId: string, status: LessonStatus) => void;
}

export function OverviewModule({
  state,
  onNavigate,
  onOpenScheduleModal,
  onUpdateLessonStatus,
}: OverviewModuleProps) {
  const metrics = calculateDashboardMetrics(state, TODAY_DATE);
  const todaysLessons = state.lessons
    .filter((l) => l.date === TODAY_DATE && l.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  const studentById = new Map(state.students.map((s) => [s.id, s]));
  const instructorById = new Map(state.instructors.map((i) => [i.id, i]));

  return (
    <div className="space-y-6">
      {/* Hero / Action Strip */}
      <section className="rounded-xl bg-[#103c2a] px-6 py-7 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium text-[#9fd8b5]">
            Daily Operations · {TODAY_DATE}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
            Coordinate lessons, instructors, and tuition in one desk.
          </h1>
          <p className="text-sm text-[#d4e7da] leading-relaxed">
            Track dual-control road sessions across Westlands, Kilimani, Mombasa Nyali, and Nakuru while keeping student balances up to date.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('scheduling')}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#103c2a] hover:bg-[#eef5f0] transition-colors whitespace-nowrap shrink-0"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            <span>View Schedule</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('payments')}
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors whitespace-nowrap shrink-0"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            <span>Process Payment</span>
          </button>
        </div>
      </section>

      {/* 4-column KPI strip */}
      <section aria-label="Key school metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-[#dce6de] p-5">
          <p className="text-xs font-medium text-[#54685b]">Lessons Scheduled Today</p>
          <p className="mt-2 font-mono-num text-3xl font-semibold text-[#16241c]">
            {metrics.lessonsTodayCount}
          </p>
          <p className="mt-1.5 text-xs text-[#54685b]">
            {metrics.inProgressLessonsCount} currently on road · {metrics.totalStudentsCount} enrolled students
          </p>
        </div>

        <div className="rounded-xl bg-white border border-[#dce6de] p-5">
          <p className="text-xs font-medium text-[#54685b]">Active Instructors</p>
          <p className="mt-2 font-mono-num text-3xl font-semibold text-[#16241c]">
            {metrics.activeInstructorsCount}
            <span className="text-base font-normal text-[#687a6e]"> / {metrics.totalInstructorsCount}</span>
          </p>
          <p className="mt-1.5 text-xs text-[#54685b]">
            {metrics.availableInstructorsCount} instructors available for dispatch
          </p>
        </div>

        <div className="rounded-xl bg-white border border-[#dce6de] p-5">
          <p className="text-xs font-medium text-[#54685b]">Tuition Collected</p>
          <p className="mt-2 font-mono-num text-3xl font-semibold text-[#16834a]">
            {formatKsh(metrics.totalCollectedKsh)}
          </p>
          <p className="mt-1.5 text-xs text-[#54685b]">
            Out of {formatKsh(metrics.totalBilledKsh)} total billed
          </p>
        </div>

        <div className="rounded-xl bg-white border border-[#dce6de] p-5">
          <p className="text-xs font-medium text-[#54685b]">Pending Fee Balances</p>
          <p className="mt-2 font-mono-num text-3xl font-semibold text-[#16241c]">
            {formatKsh(metrics.outstandingBalanceKsh)}
          </p>
          <p className="mt-1.5 text-xs text-[#54685b]">
            {metrics.overdueInvoicesCount} overdue {metrics.overdueInvoicesCount === 1 ? 'invoice' : 'invoices'} requiring follow-up
          </p>
        </div>
      </section>

      {/* Main Split: Today's Dispatch + Live Fleet */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 rounded-xl bg-white border border-[#dce6de] overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#eaf0eb]">
            <div>
              <h2 className="font-display text-base font-semibold text-[#16241c]">
                Today&apos;s Dispatch Queue
              </h2>
              <p className="text-xs text-[#54685b]">
                Scheduled practical, yard, and NTSA mock test sessions
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('scheduling')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#16834a] hover:text-[#103c2a] whitespace-nowrap shrink-0"
            >
              <span>Full schedule</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {todaysLessons.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-[#16241c]">No active lessons scheduled for today</p>
              <p className="mt-1 text-xs text-[#54685b]">Assign a student and dual-control instructor to get started.</p>
              <button
                type="button"
                onClick={onOpenScheduleModal}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#16834a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#147441]"
              >
                Schedule First Lesson
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f7faf8] text-xs font-medium text-[#54685b] border-b border-[#eaf0eb]">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Time</th>
                    <th className="px-3 py-3">Student &amp; Session</th>
                    <th className="px-3 py-3">Instructor &amp; Plate</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaf0eb]">
                  {todaysLessons.map((lesson) => {
                    const student = studentById.get(lesson.studentId);
                    const instructor = instructorById.get(lesson.instructorId);
                    return (
                      <tr key={lesson.id} className="hover:bg-[#f9fbf9]">
                        <td className="px-4 py-3 font-mono-num text-xs font-medium text-[#16241c] whitespace-nowrap">
                          {lesson.time} · {lesson.durationHours}h
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-[#16241c]">{student?.fullName ?? 'Student'}</div>
                          <div className="text-xs text-[#54685b]">
                            {lesson.branch} · {lesson.lessonType}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-[#16241c]">{instructor?.fullName ?? 'Instructor'}</div>
                          <div className="font-mono-num text-xs text-[#54685b]">{lesson.vehiclePlate}</div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={lesson.status} />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {lesson.status === 'Scheduled' && (
                            <button
                              type="button"
                              onClick={() => onUpdateLessonStatus(lesson.id, 'In Progress')}
                              className="rounded-md border border-[#dce6de] bg-white px-2.5 py-1 text-xs font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                            >
                              Start
                            </button>
                          )}
                          {lesson.status === 'In Progress' && (
                            <button
                              type="button"
                              onClick={() => onUpdateLessonStatus(lesson.id, 'Completed')}
                              className="rounded-md bg-[#16834a] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#147441]"
                            >
                              Complete
                            </button>
                          )}
                          {lesson.status === 'Completed' && (
                            <span className="text-xs text-[#54685b]">Logged</span>
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

        {/* Instructor Road Snapshot */}
        <section className="rounded-xl bg-white border border-[#dce6de] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#eaf0eb]">
            <div>
              <h2 className="font-display text-base font-semibold text-[#16241c]">
                Instructor Fleet Status
              </h2>
              <p className="text-xs text-[#54685b]">Live training zones and vehicle plates</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('instructors')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#16834a] hover:text-[#103c2a] whitespace-nowrap shrink-0"
            >
              <span>Track all</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="divide-y divide-[#eaf0eb] flex-1">
            {state.instructors.map((ins) => (
              <div key={ins.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-[#16241c] truncate">{ins.fullName}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-[#54685b] flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{ins.currentZone}</span>
                  </p>
                  <p className="mt-0.5 font-mono-num text-xs text-[#687a6e]">
                    {ins.vehiclePlate} · {ins.branch}
                  </p>
                </div>
                <StatusBadge status={ins.status} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
