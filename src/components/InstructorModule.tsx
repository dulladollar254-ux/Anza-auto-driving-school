import { useMemo, useState } from 'react';
import { CarFront, MapPin, Plus, Search, X } from 'lucide-react';
import {
  BranchName,
  Instructor,
  InstructorStatus,
  LicenseClass,
  SchoolState,
} from '../types/school';
import { filterInstructors } from '../utils/schoolLogic';
import { StatusBadge } from './StatusBadge';

interface InstructorModuleProps {
  state: SchoolState;
  onUpdateInstructor: (
    instructorId: string,
    patch: Partial<Pick<Instructor, 'status' | 'currentZone' | 'activeStudentName'>>
  ) => void;
  onAddInstructor: (instructor: Omit<Instructor, 'id'>) => void;
}

const STATUS_TABS: (InstructorStatus | 'All')[] = [
  'All',
  'On Road',
  'Available',
  'Theory Class',
  'Off Duty',
];

const BRANCHES: BranchName[] = ['Westlands', 'Kilimani', 'Mombasa Nyali', 'Nakuru'];

export function InstructorModule({
  state,
  onUpdateInstructor,
  onAddInstructor,
}: InstructorModuleProps) {
  const [statusFilter, setStatusFilter] = useState<InstructorStatus | 'All'>('All');
  const [search, setSearch] = useState('');

  // Dispatch / Update modal
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [editStatus, setEditStatus] = useState<InstructorStatus>('On Road');
  const [editZone, setEditZone] = useState('');
  const [editStudentName, setEditStudentName] = useState('');

  // Add Instructor modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBranch, setNewBranch] = useState<BranchName>('Westlands');
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newTransmission, setNewTransmission] = useState<'Automatic' | 'Manual' | 'Motorcycle'>('Automatic');
  const [newSpecialty, setNewSpecialty] = useState<LicenseClass>('Class B1 (Auto)');
  const [newCertNo, setNewCertNo] = useState('');
  const [addError, setAddError] = useState('');

  const filtered = useMemo(
    () => filterInstructors(state.instructors, search, statusFilter),
    [state.instructors, search, statusFilter]
  );

  const openEditModal = (ins: Instructor) => {
    setEditingInstructor(ins);
    setEditStatus(ins.status);
    setEditZone(ins.currentZone);
    setEditStudentName(ins.activeStudentName ?? '');
  };

  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstructor) return;
    onUpdateInstructor(editingInstructor.id, {
      status: editStatus,
      currentZone: editZone.trim() || `${editingInstructor.branch} Main Yard`,
      activeStudentName:
        editStatus === 'Available' || editStatus === 'Off Duty'
          ? null
          : editStudentName.trim() || null,
    });
    setEditingInstructor(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newName.trim() || !newPhone.trim() || !newPlate.trim() || !newModel.trim()) {
      setAddError('Name, phone, vehicle plate, and vehicle model are required.');
      return;
    }

    onAddInstructor({
      fullName: newName.trim(),
      phone: newPhone.trim(),
      branch: newBranch,
      specialties: [newSpecialty],
      vehiclePlate: newPlate.trim().toUpperCase(),
      vehicleModel: newModel.trim(),
      transmission: newTransmission,
      status: 'Available',
      currentZone: `${newBranch} Main Yard`,
      activeStudentName: null,
      hoursToday: 0,
      passRatePercent: 92,
      ntsaCertNo: newCertNo.trim().toUpperCase() || `NTSA-INST-${Math.floor(1000 + Math.random() * 8999)}`,
    });

    setNewName('');
    setNewPhone('');
    setNewPlate('');
    setNewModel('');
    setNewCertNo('');
    setAddModalOpen(false);
  };

  const onRoadCount = state.instructors.filter((i) => i.status === 'On Road').length;
  const availableCount = state.instructors.filter((i) => i.status === 'Available').length;
  const theoryCount = state.instructors.filter((i) => i.status === 'Theory Class').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#16241c]">
            Instructor &amp; Fleet Tracking
          </h1>
          <p className="mt-1 text-sm text-[#54685b]">
            Monitor live instructor locations, dual-control vehicle assignments, and NTSA pass rates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441] whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Instructor</span>
        </button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-[#dce6de] p-4">
          <p className="text-xs font-medium text-[#54685b]">Currently On Road</p>
          <p className="mt-1.5 font-mono-num text-2xl font-semibold text-[#16241c]">{onRoadCount}</p>
        </div>
        <div className="rounded-xl bg-white border border-[#dce6de] p-4">
          <p className="text-xs font-medium text-[#54685b]">Available for Dispatch</p>
          <p className="mt-1.5 font-mono-num text-2xl font-semibold text-[#16834a]">{availableCount}</p>
        </div>
        <div className="rounded-xl bg-white border border-[#dce6de] p-4">
          <p className="text-xs font-medium text-[#54685b]">In Theory / Model Town</p>
          <p className="mt-1.5 font-mono-num text-2xl font-semibold text-[#16241c]">{theoryCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white border border-[#dce6de] p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((status) => (
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
            aria-label="Search instructors or vehicle plates"
            placeholder="Search name, plate, branch, or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#d4dfd6] bg-white pl-9 pr-3 py-2 text-sm text-[#16241c] placeholder:text-[#7c8c81] focus:border-[#16834a] focus:outline-none"
          />
        </div>
      </div>

      {/* Instructor Fleet Table */}
      <section className="rounded-xl bg-white border border-[#dce6de] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-[#16241c]">No instructors match this filter</p>
            <p className="mt-1 text-xs text-[#54685b]">
              Try selecting &quot;All&quot; or clearing the search field.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f7faf8] text-xs font-medium text-[#54685b] border-b border-[#eaf0eb]">
                <tr>
                  <th className="px-5 py-3">Instructor</th>
                  <th className="px-4 py-3">Assigned Vehicle</th>
                  <th className="px-4 py-3">Live Zone &amp; Student</th>
                  <th className="px-4 py-3 text-right">Today</th>
                  <th className="px-4 py-3 text-right">Pass Rate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaf0eb]">
                {filtered.map((ins) => (
                  <tr key={ins.id} className="hover:bg-[#f9fbf9]">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#16241c]">{ins.fullName}</div>
                      <div className="text-xs text-[#54685b]">
                        {ins.branch} · {ins.ntsaCertNo}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono-num text-xs font-semibold text-[#16241c]">
                        <CarFront className="h-3.5 w-3.5 text-[#16834a]" aria-hidden="true" />
                        <span>{ins.vehiclePlate}</span>
                      </div>
                      <div className="text-xs text-[#54685b]">{ins.vehicleModel}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-xs font-medium text-[#16241c]">
                        <MapPin className="h-3.5 w-3.5 text-[#54685b] shrink-0" aria-hidden="true" />
                        <span>{ins.currentZone}</span>
                      </div>
                      <div className="text-xs text-[#54685b]">
                        {ins.activeStudentName
                          ? `With student: ${ins.activeStudentName}`
                          : 'No active student in car'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono-num text-xs text-[#16241c]">
                      {ins.hoursToday}h
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono-num text-xs font-semibold text-[#16834a]">
                      {ins.passRatePercent}%
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={ins.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(ins)}
                        aria-label={`Update tracking for ${ins.fullName}`}
                        className="rounded-md border border-[#dce6de] bg-white px-3 py-1.5 text-xs font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                      >
                        Update Location
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Update Instructor Tracking Modal */}
      {editingInstructor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispatch-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white border border-[#dce6de] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaf0eb]">
              <h2 id="dispatch-modal-title" className="font-display text-lg font-bold text-[#16241c]">
                Update Instructor Dispatch
              </h2>
              <button
                type="button"
                onClick={() => setEditingInstructor(null)}
                aria-label="Close dispatch modal"
                className="rounded-md p-1.5 text-[#54685b] hover:bg-[#f2f7f3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch} className="p-6 space-y-4">
              <div className="text-sm">
                <p className="font-semibold text-[#16241c]">{editingInstructor.fullName}</p>
                <p className="font-mono-num text-xs text-[#54685b]">
                  {editingInstructor.vehiclePlate} · {editingInstructor.vehicleModel}
                </p>
              </div>

              <div>
                <label htmlFor="track-status" className="block text-xs font-semibold text-[#16241c] mb-1">
                  Duty Status
                </label>
                <select
                  id="track-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as InstructorStatus)}
                  className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                >
                  <option value="On Road">On Road</option>
                  <option value="Available">Available</option>
                  <option value="Theory Class">Theory Class</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
              </div>

              <div>
                <label htmlFor="track-zone" className="block text-xs font-semibold text-[#16241c] mb-1">
                  Current Route / Zone
                </label>
                <input
                  id="track-zone"
                  type="text"
                  required
                  placeholder="e.g. Ngong Road · Junction Mall"
                  value={editZone}
                  onChange={(e) => setEditZone(e.target.value)}
                  className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                />
              </div>

              {(editStatus === 'On Road' || editStatus === 'Theory Class') && (
                <div>
                  <label htmlFor="track-student" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Assigned Student
                  </label>
                  <select
                    id="track-student"
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    <option value="">Select student in session</option>
                    {state.students.map((stu) => (
                      <option key={stu.id} value={stu.fullName}>
                        {stu.fullName} ({stu.branch})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#eaf0eb]">
                <button
                  type="button"
                  onClick={() => setEditingInstructor(null)}
                  className="rounded-lg border border-[#dce6de] bg-white px-4 py-2 text-sm font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441]"
                >
                  Save Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Instructor Modal */}
      {addModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-instructor-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        >
          <div className="w-full max-w-lg rounded-xl bg-white border border-[#dce6de] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaf0eb]">
              <h2 id="add-instructor-title" className="font-display text-lg font-bold text-[#16241c]">
                Register Instructor &amp; Vehicle
              </h2>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                aria-label="Close add instructor modal"
                className="rounded-md p-1.5 text-[#54685b] hover:bg-[#f2f7f3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div
                  role="alert"
                  className="rounded-lg bg-[#fee2e2] px-3.5 py-2.5 text-xs font-medium text-[#991b1b]"
                >
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ins-name" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Full Name
                  </label>
                  <input
                    id="ins-name"
                    type="text"
                    required
                    placeholder="e.g. Josephat Mutua"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
                <div>
                  <label htmlFor="ins-phone" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Phone Number
                  </label>
                  <input
                    id="ins-phone"
                    type="tel"
                    required
                    placeholder="+254 721 000 111"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
                <div>
                  <label htmlFor="ins-branch" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Home Branch
                  </label>
                  <select
                    id="ins-branch"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value as BranchName)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ins-specialty" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Primary Class
                  </label>
                  <select
                    id="ins-specialty"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value as LicenseClass)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    <option value="Class B1 (Auto)">Class B1 (Auto)</option>
                    <option value="Class B2 (Manual)">Class B2 (Manual)</option>
                    <option value="Class A2 (Moto)">Class A2 (Moto)</option>
                    <option value="Class C1 (Light Truck)">Class C1 (Light Truck)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ins-plate" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Vehicle Plate
                  </label>
                  <input
                    id="ins-plate"
                    type="text"
                    required
                    placeholder="e.g. KDN 614T"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
                <div>
                  <label htmlFor="ins-model" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Vehicle Model
                  </label>
                  <input
                    id="ins-model"
                    type="text"
                    required
                    placeholder="e.g. Honda Fit (Dual-Control)"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
                <div>
                  <label htmlFor="ins-trans" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Transmission
                  </label>
                  <select
                    id="ins-trans"
                    value={newTransmission}
                    onChange={(e) =>
                      setNewTransmission(e.target.value as 'Automatic' | 'Manual' | 'Motorcycle')
                    }
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                    <option value="Motorcycle">Motorcycle</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ins-cert" className="block text-xs font-semibold text-[#16241c] mb-1">
                    NTSA Instructor Cert No.
                  </label>
                  <input
                    id="ins-cert"
                    type="text"
                    placeholder="e.g. NTSA-INST-1402"
                    value={newCertNo}
                    onChange={(e) => setNewCertNo(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#eaf0eb]">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-lg border border-[#dce6de] bg-white px-4 py-2 text-sm font-medium text-[#16241c] hover:bg-[#f2f7f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#16834a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#147441]"
                >
                  Register Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
