import { AlertCircle, CheckCircle2, Clock, Navigation, PauseCircle } from 'lucide-react';
import { InstructorStatus, InvoiceStatus, LessonStatus } from '../types/school';

type SemanticStatus = LessonStatus | InstructorStatus | InvoiceStatus;

const STATUS_STYLES: Record<SemanticStatus, { className: string; icon: 'check' | 'clock' | 'alert' | 'nav' | 'pause' }> = {
  Completed: { className: 'bg-[#e8f5ec] text-[#116438]', icon: 'check' },
  Paid: { className: 'bg-[#e8f5ec] text-[#116438]', icon: 'check' },
  Available: { className: 'bg-[#e8f5ec] text-[#116438]', icon: 'check' },
  'In Progress': { className: 'bg-[#fef3c7] text-[#92400e]', icon: 'nav' },
  'On Road': { className: 'bg-[#fef3c7] text-[#92400e]', icon: 'nav' },
  Partial: { className: 'bg-[#fef3c7] text-[#92400e]', icon: 'clock' },
  Scheduled: { className: 'bg-[#edf2ef] text-[#2c4034]', icon: 'clock' },
  'Theory Class': { className: 'bg-[#edf2ef] text-[#2c4034]', icon: 'clock' },
  Unpaid: { className: 'bg-[#edf2ef] text-[#45574b]', icon: 'clock' },
  Overdue: { className: 'bg-[#fee2e2] text-[#991b1b]', icon: 'alert' },
  Cancelled: { className: 'bg-[#f1f3f2] text-[#59685e]', icon: 'pause' },
  'Off Duty': { className: 'bg-[#f1f3f2] text-[#59685e]', icon: 'pause' },
};

export function StatusBadge({ status }: { status: SemanticStatus }) {
  const style = STATUS_STYLES[status];

  const Icon =
    style.icon === 'check'
      ? CheckCircle2
      : style.icon === 'alert'
        ? AlertCircle
        : style.icon === 'nav'
          ? Navigation
          : style.icon === 'pause'
            ? PauseCircle
            : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap shrink-0 ${style.className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
