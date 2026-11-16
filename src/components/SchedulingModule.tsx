import { useMemo, useState } from 'react';
import { CalendarPlus, Search, UserPlus, X } from 'lucide-react';
import { TODAY_DATE } from '../data/seedData';
import {
  BranchName,
  Lesson,
  LessonStatus,
  LessonType,
  LicenseClass,
  SchoolState,
} from '../types/school';
import { hasScheduleConflict } from '../utils/schoolLogic';
import { StatusBadge } from './StatusBadge';

interface SchedulingModuleProps {
  state: SchoolState;
  scheduleModalOpen: boolean;
  onOpenScheduleModal: () => void;
  onCloseScheduleModal: () => void;
  onAddLesson: (lesson: Omit<Lesson, 'id'>) => void;
  onUpdateLessonStatus: (lessonId: string, status: LessonStatus) => void;
  onEnrollStudent: (input: {
    fullName: string;
    phone: string;
    email: string;
    nationalId: string;
    branch: BranchName;
    licenseClass: LicenseClass;
  }) => void;
}

const BRANCHES: BranchName[] = ['Westlands', 'Kilimani', 'Mombasa Nyali', 'Nakuru'];
const LESSON_TYPES: LessonType[] = [
  'Practical Road',
  'Yard Maneuvers',
  'Theory & Highway Code',
  'NTSA Mock Test',
];
const LICENSE_CLASSES: LicenseClass[] = [
  'Class B1 (Auto)',
  'Class B2 (Manual)',
  'Class A2 (Moto)',
  'Class C1 (Light Truck)',
];
const STATUS_FILTERS: (LessonStatus | 'All')[] = [
  'All',
  'Scheduled',
  'In Progress',
  'Completed',
  'Cancelled',
];

export function SchedulingModule({
  state,
  scheduleModalOpen,
  onOpenScheduleModal,
  onCloseScheduleModal,
  onAddLesson,
  onUpdateLessonStatus,
  onEnrollStudent,
}: SchedulingModuleProps) {
  const [viewMode, setViewMode] = useState<'lessons' | 'students'>('lessons');
  const [statusFilter, setStatusFilter] = useState<LessonStatus | 'All'>('All');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  // Enroll Student Modal state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollName, setEnrollName] = useState('');
  const [enrollPhone, setEnrollPhone] = useState('');
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollNationalId, setEnrollNationalId] = useState('');
  const [enrollBranch, setEnrollBranch] = useState<BranchName>('Westlands');
  const [enrollClass, setEnrollClass] = useState<LicenseClass>('Class B1 (Auto)');
  const [enrollError, setEnrollError] = useState('');

  // Schedule Lesson Modal state
  const [studentId, setStudentId] = useState(state.students[0]?.id ?? '');
  const [instructorId, setInstructorId] = useState(state.instructors[0]?.id ?? '');
  const [lessonType, setLessonType] = useState<LessonType>('Practical Road');
  const [lessonDate, setLessonDate] = useState(TODAY_DATE);
  const [lessonTime, setLessonTime] = useState('15:00');
  const [durationHours, setDurationHours] = useState('2');
  const [pickupZone, setPickupZone] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  const studentById = useMemo(
    () => new Map(state.students.map((s) => [s.id, s])),
    [state.students]
  );
  const instructorById = useMemo(
    () => new Map(state.instructors.map((i) => [i.id, i])),
    [state.instructors]
  );

  const filteredLessons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.lessons
      .filter((lesson) => {
        if (statusFilter !== 'All' && lesson.status !== statusFilter) return false;
        if (branchFilter && lesson.branch !== branchFilter) return false;
        if (!q) return true;
        const student = studentById.get(lesson.studentId);
        const instructor = instructorById.get(lesson.instructorId);
        return [
          student?.fullName,
          instructor?.fullName,
          lesson.lessonType,
          lesson.vehiclePlate,
          lesson.pickupZone,
          lesson.branch,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [state.lessons, statusFilter, branchFilter, search, studentById, instructorById]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.students.filter((stu) => {
      if (branchFilter && stu.branch !== branchFilter) return false;
      if (!q) return true;
      return [stu.fullName, stu.phone, stu.nationalId, stu.licenseClass, stu.branch]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [state.students, branchFilter, search]);

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError('');

    const selectedStudent = studentById.get(studentId);
    const selectedInstructor = instructorById.get(instructorId);

    if (!selectedStudent) {
      setScheduleError('Please select a valid enrolled student.');
      return;
    }
    if (!selectedInstructor) {
      setScheduleError('Please select an instructor.');
      return;
    }
    if (!lessonDate || !lessonTime) {
      setScheduleError('Please choose both a lesson date and start time.');
      return;
    }
    const parsedDuration = Number(durationHours);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0 || parsedDuration > 6) {
      setScheduleError('Duration must be between 0.5 and 6 hours.');
      return;
    }

    const conflict = hasScheduleConflict(state.lessons, {
      date: lessonDate,
      time: lessonTime,
      instructorId: selectedInstructor.id,
      studentId: selectedStudent.id,
      vehiclePlate: selectedInstructor.vehiclePlate,
    });

    if (conflict.conflict) {
      setScheduleError(conflict.reason ?? 'Scheduling conflict detected.');
      return;
    }

    onAddLesson({
      studentId: selectedStudent.id,
      instructorId: selectedInstructor.id,
      branch: selectedInstructor.branch,
      lessonType,
      date: lessonDate,
      time: lessonTime,
      durationHours: parsedDuration,
      vehiclePlate: selectedInstructor.vehiclePlate,
      pickupZone: pickupZone.trim() || `${selectedInstructor.branch} Main Yard`,
      status: 'Scheduled',
      notes: notes.trim() || undefined,
    });

    setPickupZone('');
    setNotes('');
    onCloseScheduleModal();
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError('');
    if (!enrollName.trim()) {
      setEnrollError('Student full name is required.');
      return;
    }
    if (!enrollPhone.trim() || enrollPhone.trim().length < 9) {
      setEnrollError('Enter a valid Kenyan phone number (e.g. +254 712 000 000).');
      return;
    }
    if (!enrollNationalId.trim() || enrollNationalId.trim().length < 6) {
      setEnrollError('Enter a valid National ID or Passport number.');
      return;
    }

    onEnrollStudent({
      fullName: enrollName.trim(),
      phone: enrollPhone.trim(),
      email: enrollEmail.trim() || `${enrollName.trim().toLowerCase().replace(/\s+/g, '.')}@anza.example`,
      nationalId: enrollNationalId.trim(),
      branch: enrollBranch,
      licenseClass: enrollClass,
    });

    setEnrollName('');
    setEnrollPhone('');
    setEnrollEmail('');
    setEnrollNationalId('');
    setEnrollModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#16241c]">
            Student Scheduling
          </h1>
          <p className="mt-1 text-sm text-[#54685b]">
            Book road sessions, prevent vehicle conflicts, and track NTSA logbook hours.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setEnrollModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dce6de] bg-white px-4 py-2 text-sm font-semibold text-[#16241c] hover:bg-[#f2f7f3] whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span>Enroll Student</span>
          </button>
          <button
            type="button"
            onClick={onOpenScheduleModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441] whitespace-nowrap shrink-0"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            <span>Schedule Lesson</span>
          </button>
        </div>
      </div>

      {/* Sub-view segmented tabs & filters */}
      <div className="rounded-xl bg-white border border-[#dce6de] p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-lg bg-[#eef3ef] p-1 self-start">
            <button
              type="button"
              onClick={() => setViewMode('lessons')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'lessons'
                  ? 'bg-white text-[#16241c] shadow-xs'
                  : 'text-[#54685b] hover:text-[#16241c]'
              }`}
            >
              Lesson Schedule ({state.lessons.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('students')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'students'
                  ? 'bg-white text-[#16241c] shadow-xs'
                  : 'text-[#54685b] hover:text-[#16241c]'
              }`}
            >
              Student Roster ({state.students.length})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 flex-1 lg:max-w-xl">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#687a6e]"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search lessons or students"
                placeholder="Search student, instructor, plate, or zone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#d4dfd6] bg-white pl-9 pr-3 text-sm text-[#16241c] placeholder:text-[#7c8c81] focus:border-[#16834a] focus:outline-none"
              />
            </div>
            <select
              aria-label="Filter by branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-9 rounded-lg border border-[#d4dfd6] bg-white px-3 pr-8 text-sm text-[#16241c] focus:border-[#16834a] focus:outline-none"
            >
              <option value="">All Branches</option>
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
        </div>

        {viewMode === 'lessons' && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#eaf0eb]">
            {STATUS_FILTERS.map((status) => (
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
        )}
      </div>

      {/* Lessons Table */}
      {viewMode === 'lessons' && (
        <section className="rounded-xl bg-white border border-[#dce6de] overflow-hidden">
          {filteredLessons.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-[#16241c]">No lessons match your filters</p>
              <p className="mt-1 text-xs text-[#54685b]">
                Clear search filters or book a new practical or theory session.
              </p>
              <button
                type="button"
                onClick={onOpenScheduleModal}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#16834a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#147441]"
              >
                Schedule Lesson
              </button>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-[#eaf0eb]">
                {filteredLessons.map((lesson) => {
                  const student = studentById.get(lesson.studentId);
                  const instructor = instructorById.get(lesson.instructorId);
                  return (
                    <div key={lesson.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-[#16241c]">
                            {student?.fullName ?? 'Unknown Student'}
                          </p>
                          <p className="text-xs text-[#54685b]">
                            {lesson.lessonType} · {lesson.branch}
                          </p>
                        </div>
                        <StatusBadge status={lesson.status} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#54685b]">
                        <span className="font-mono-num">
                          {lesson.date} · {lesson.time} ({lesson.durationHours}h)
                        </span>
                        <span className="font-mono-num">{lesson.vehiclePlate}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-xs text-[#54685b]">
                          {instructor?.fullName ?? 'Unassigned'} · {lesson.pickupZone}
                        </span>
                        <select
                          aria-label={`Mobile status for ${student?.fullName ?? 'student'} on ${lesson.date}`}
                          value={lesson.status}
                          onChange={(e) =>
                            onUpdateLessonStatus(lesson.id, e.target.value as LessonStatus)
                          }
                          className="rounded-md border border-[#d4dfd6] bg-white px-2 py-1 text-xs font-medium text-[#16241c]"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f7faf8] text-xs font-medium text-[#54685b] border-b border-[#eaf0eb]">
                    <tr>
                      <th className="px-5 py-3">Date &amp; Time</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Instructor &amp; Vehicle</th>
                      <th className="px-4 py-3">Session &amp; Pickup</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaf0eb]">
                    {filteredLessons.map((lesson) => {
                      const student = studentById.get(lesson.studentId);
                      const instructor = instructorById.get(lesson.instructorId);
                      return (
                        <tr key={lesson.id} className="hover:bg-[#f9fbf9]">
                          <td className="px-5 py-3.5 font-mono-num text-xs text-[#16241c] whitespace-nowrap">
                            <div className="font-semibold">{lesson.date}</div>
                            <div className="text-[#54685b]">
                              {lesson.time} · {lesson.durationHours}h
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-[#16241c]">
                              {student?.fullName ?? 'Unknown Student'}
                            </div>
                            <div className="text-xs text-[#54685b]">
                              {student?.licenseClass} · {lesson.branch}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-[#16241c]">
                              {instructor?.fullName ?? 'Unassigned'}
                            </div>
                            <div className="font-mono-num text-xs text-[#54685b]">
                              {lesson.vehiclePlate}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-xs font-medium text-[#16241c]">
                              {lesson.lessonType}
                            </div>
                            <div className="text-xs text-[#54685b]">{lesson.pickupZone}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={lesson.status} />
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <select
                              aria-label={`Change status for ${student?.fullName ?? 'student'} on ${lesson.date}`}
                              value={lesson.status}
                              onChange={(e) =>
                                onUpdateLessonStatus(lesson.id, e.target.value as LessonStatus)
                              }
                              className="rounded-md border border-[#d4dfd6] bg-white px-2.5 py-1.5 text-xs font-medium text-[#16241c] focus:border-[#16834a] focus:outline-none"
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {/* Student Roster */}
      {viewMode === 'students' && (
        <section className="rounded-xl bg-white border border-[#dce6de] overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-[#16241c]">No students found</p>
              <p className="mt-1 text-xs text-[#54685b]">
                Adjust your search or enroll a new learner.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f7faf8] text-xs font-medium text-[#54685b] border-b border-[#eaf0eb]">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-4 py-3">Branch &amp; Class</th>
                    <th className="px-4 py-3">National ID</th>
                    <th className="px-4 py-3">NTSA Stage</th>
                    <th className="px-4 py-3">Logbook Progress</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaf0eb]">
                  {filteredStudents.map((stu) => {
                    const pct = Math.min(
                      100,
                      Math.round((stu.completedHours / stu.requiredHours) * 100)
                    );
                    return (
                      <tr key={stu.id} className="hover:bg-[#f9fbf9]">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[#16241c]">{stu.fullName}</div>
                          <div className="font-mono-num text-xs text-[#54685b]">{stu.phone}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#34463b]">
                          <div className="font-medium text-[#16241c]">{stu.licenseClass}</div>
                          <div>{stu.branch}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono-num text-xs text-[#54685b]">
                          {stu.nationalId}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium text-[#16241c]">
                          {stu.ntsaStage}
                        </td>
                        <td className="px-4 py-3.5 min-w-[170px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-mono-num font-medium text-[#16241c]">
                              {stu.completedHours} / {stu.requiredHours} hrs
                            </span>
                            <span className="font-mono-num text-[#54685b]">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#e6eee8] overflow-hidden">
                            <div
                              className="h-full bg-[#16834a] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setStudentId(stu.id);
                              onOpenScheduleModal();
                            }}
                            className="rounded-md border border-[#dce6de] bg-white px-2.5 py-1 text-xs font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                          >
                            Book Lesson
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Schedule Lesson Modal */}
      {scheduleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        >
          <div className="w-full max-w-lg rounded-xl bg-white border border-[#dce6de] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaf0eb]">
              <h2 id="schedule-modal-title" className="font-display text-lg font-bold text-[#16241c]">
                Schedule Driving Lesson
              </h2>
              <button
                type="button"
                onClick={onCloseScheduleModal}
                aria-label="Close schedule lesson modal"
                className="rounded-md p-1.5 text-[#54685b] hover:bg-[#f2f7f3] hover:text-[#16241c]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              {scheduleError && (
                <div
                  role="alert"
                  className="rounded-lg bg-[#fee2e2] px-3.5 py-2.5 text-xs font-medium text-[#991b1b]"
                >
                  {scheduleError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="sched-student" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Student
                  </label>
                  <select
                    id="sched-student"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    {state.students.map((stu) => (
                      <option key={stu.id} value={stu.id}>
                        {stu.fullName} — {stu.licenseClass} ({stu.branch})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="sched-instructor" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Instructor &amp; Dual-Control Vehicle
                  </label>
                  <select
                    id="sched-instructor"
                    value={instructorId}
                    onChange={(e) => setInstructorId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    {state.instructors.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.fullName} · {ins.vehiclePlate} ({ins.branch} · {ins.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sched-type" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Session Type
                  </label>
                  <select
                    id="sched-type"
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value as LessonType)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    {LESSON_TYPES.map((lt) => (
                      <option key={lt} value={lt}>
                        {lt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sched-duration" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Duration (Hours)
                  </label>
                  <select
                    id="sched-duration"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    <option value="1">1.0 hour</option>
                    <option value="1.5">1.5 hours</option>
                    <option value="2">2.0 hours</option>
                    <option value="3">3.0 hours</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sched-date" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Date
                  </label>
                  <input
                    id="sched-date"
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>

                <div>
                  <label htmlFor="sched-time" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Start Time
                  </label>
                  <input
                    id="sched-time"
                    type="time"
                    value={lessonTime}
                    onChange={(e) => setLessonTime(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="sched-zone" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Pickup Zone / Training Yard
                  </label>
                  <input
                    id="sched-zone"
                    type="text"
                    placeholder="e.g. Sarit Centre Gate or Kilimani Yard"
                    value={pickupZone}
                    onChange={(e) => setPickupZone(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="sched-notes" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Focus Notes (Optional)
                  </label>
                  <input
                    id="sched-notes"
                    type="text"
                    placeholder="e.g. Parallel parking and hill-start clutch control"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#eaf0eb]">
                <button
                  type="button"
                  onClick={onCloseScheduleModal}
                  className="rounded-lg border border-[#dce6de] bg-white px-4 py-2 text-sm font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441]"
                >
                  Confirm Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {enrollModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="enroll-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        >
          <div className="w-full max-w-lg rounded-xl bg-white border border-[#dce6de] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaf0eb]">
              <h2 id="enroll-modal-title" className="font-display text-lg font-bold text-[#16241c]">
                Enroll New Student
              </h2>
              <button
                type="button"
                onClick={() => setEnrollModalOpen(false)}
                aria-label="Close enroll student modal"
                className="rounded-md p-1.5 text-[#54685b] hover:bg-[#f2f7f3] hover:text-[#16241c]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4">
              {enrollError && (
                <div
                  role="alert"
                  className="rounded-lg bg-[#fee2e2] px-3.5 py-2.5 text-xs font-medium text-[#991b1b]"
                >
                  {enrollError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="enroll-name" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Full Name
                  </label>
                  <input
                    id="enroll-name"
                    type="text"
                    required
                    placeholder="e.g. Wanjiru Kamau"
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>

                <div>
                  <label htmlFor="enroll-phone" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Phone Number
                  </label>
                  <input
                    id="enroll-phone"
                    type="tel"
                    required
                    placeholder="+254 712 345 678"
                    value={enrollPhone}
                    onChange={(e) => setEnrollPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>

                <div>
                  <label htmlFor="enroll-nid" className="block text-xs font-semibold text-[#16241c] mb-1">
                    National ID / Passport
                  </label>
                  <input
                    id="enroll-nid"
                    type="text"
                    required
                    placeholder="e.g. 39481022"
                    value={enrollNationalId}
                    onChange={(e) => setEnrollNationalId(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>

                <div>
                  <label htmlFor="enroll-branch" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Training Branch
                  </label>
                  <select
                    id="enroll-branch"
                    value={enrollBranch}
                    onChange={(e) => setEnrollBranch(e.target.value as BranchName)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    {BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="enroll-class" className="block text-xs font-semibold text-[#16241c] mb-1">
                    NTSA License Class
                  </label>
                  <select
                    id="enroll-class"
                    value={enrollClass}
                    onChange={(e) => setEnrollClass(e.target.value as LicenseClass)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    {LICENSE_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="enroll-email" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    id="enroll-email"
                    type="email"
                    placeholder="student@example.com"
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
              </div>

              <p className="text-xs text-[#54685b]">
                Enrolling automatically creates a tuition invoice for the selected NTSA license class.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#eaf0eb]">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="rounded-lg border border-[#dce6de] bg-white px-4 py-2 text-sm font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441]"
                >
                  Complete Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
