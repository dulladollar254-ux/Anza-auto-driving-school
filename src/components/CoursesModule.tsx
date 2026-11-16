import { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { BranchName, CoursePackage, LicenseClass, SchoolState } from '../types/school';
import { formatKsh } from '../utils/schoolLogic';

interface CoursesModuleProps {
  state: SchoolState;
  onEnrollInCourse: (input: {
    fullName: string;
    phone: string;
    email: string;
    nationalId: string;
    branch: BranchName;
    licenseClass: LicenseClass;
    course: CoursePackage;
  }) => void;
  onResetDemoData: () => void;
}

const BRANCHES: BranchName[] = ['Westlands', 'Kilimani', 'Mombasa Nyali', 'Nakuru'];

export function CoursesModule({
  state,
  onEnrollInCourse,
  onResetDemoData,
}: CoursesModuleProps) {
  const [selectedCourse, setSelectedCourse] = useState<CoursePackage | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [branch, setBranch] = useState<BranchName>('Westlands');
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setError('');
    if (!fullName.trim() || !phone.trim() || !nationalId.trim()) {
      setError('Full name, phone number, and National ID are required.');
      return;
    }

    onEnrollInCourse({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: `${fullName.trim().toLowerCase().replace(/\s+/g, '.')}@anza.example`,
      nationalId: nationalId.trim(),
      branch,
      licenseClass: selectedCourse.licenseClass,
      course: selectedCourse,
    });

    setFullName('');
    setPhone('');
    setNationalId('');
    setSelectedCourse(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#16241c]">
            NTSA Courses &amp; Tuition Packages
          </h1>
          <p className="mt-1 text-sm text-[#54685b]">
            Standardized Kenyan driving school curriculum with direct student enrollment and billing.
          </p>
        </div>

        <div className="shrink-0">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#dce6de] bg-white px-3.5 py-2 text-xs font-semibold text-[#45574b] hover:bg-[#f2f7f3]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Sample Data</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#dce6de] bg-white p-1.5">
              <span className="text-xs font-medium text-[#16241c] pl-2">Restore default data?</span>
              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setConfirmReset(false);
                }}
                className="rounded-md bg-[#991b1b] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#7f1d1d]"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-[#54685b] hover:bg-[#f2f7f3]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {state.courses.map((course) => {
          const enrolledCount = state.students.filter(
            (s) => s.licenseClass === course.licenseClass
          ).length;

          return (
            <article
              key={course.id}
              className="rounded-xl bg-white border border-[#dce6de] p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono-num text-xs font-semibold text-[#16834a]">
                    {course.code} · {course.durationWeeks} Weeks
                  </span>
                  <span className="text-xs text-[#54685b]">
                    {enrolledCount} active {enrolledCount === 1 ? 'student' : 'students'}
                  </span>
                </div>

                <h2 className="font-display text-lg font-bold text-[#16241c]">
                  {course.title}
                </h2>
                <p className="text-sm text-[#45574b] leading-relaxed">
                  {course.description}
                </p>

                <div className="pt-2 grid grid-cols-3 gap-3 border-t border-[#eaf0eb] text-xs">
                  <div>
                    <p className="text-[#54685b]">Practical</p>
                    <p className="mt-0.5 font-mono-num font-semibold text-[#16241c]">
                      {course.practicalHours} hrs
                    </p>
                  </div>
                  <div>
                    <p className="text-[#54685b]">Theory</p>
                    <p className="mt-0.5 font-mono-num font-semibold text-[#16241c]">
                      {course.theoryHours} hrs
                    </p>
                  </div>
                  <div>
                    <p className="text-[#54685b]">NTSA Booking</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 font-medium text-[#16834a]">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{course.includesExamBooking ? 'Included' : 'Optional'}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#eaf0eb]">
                <div>
                  <p className="text-xs text-[#54685b]">Package Tuition</p>
                  <p className="font-mono-num text-xl font-bold text-[#16241c]">
                    {formatKsh(course.feeKsh)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourse(course);
                    setError('');
                  }}
                  className="rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441] whitespace-nowrap shrink-0"
                >
                  Enroll Student
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Quick Course Enrollment Modal */}
      {selectedCourse && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-enroll-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-[#dce6de] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaf0eb]">
              <h2 id="course-enroll-title" className="font-display text-lg font-bold text-[#16241c]">
                Enroll in {selectedCourse.code}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                aria-label="Close course enrollment modal"
                className="rounded-md p-1.5 text-[#54685b] hover:bg-[#f2f7f3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-[#fee2e2] px-3.5 py-2.5 text-xs font-medium text-[#991b1b]"
                >
                  {error}
                </div>
              )}

              <div className="rounded-lg bg-[#f4f7f5] p-3.5 text-xs">
                <p className="font-semibold text-[#16241c]">{selectedCourse.title}</p>
                <p className="mt-0.5 text-[#54685b]">
                  {selectedCourse.practicalHours} practical hrs · {selectedCourse.theoryHours} theory hrs ·{' '}
                  <span className="font-mono-num font-semibold text-[#16834a]">
                    {formatKsh(selectedCourse.feeKsh)}
                  </span>
                </p>
              </div>

              <div>
                <label htmlFor="crs-name" className="block text-xs font-semibold text-[#16241c] mb-1">
                  Student Full Name
                </label>
                <input
                  id="crs-name"
                  type="text"
                  required
                  placeholder="e.g. Denis Kariuki"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="crs-phone" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Phone Number
                  </label>
                  <input
                    id="crs-phone"
                    type="tel"
                    required
                    placeholder="+254 712 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
                <div>
                  <label htmlFor="crs-nid" className="block text-xs font-semibold text-[#16241c] mb-1">
                    National ID
                  </label>
                  <input
                    id="crs-nid"
                    type="text"
                    required
                    placeholder="e.g. 38901234"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="crs-branch" className="block text-xs font-semibold text-[#16241c] mb-1">
                  Preferred Branch
                </label>
                <select
                  id="crs-branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value as BranchName)}
                  className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#eaf0eb]">
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="rounded-lg border border-[#dce6de] bg-white px-4 py-2 text-sm font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441]"
                >
                  Enroll &amp; Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
