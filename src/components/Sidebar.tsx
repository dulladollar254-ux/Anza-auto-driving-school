import {
  BookOpen,
  CalendarClock,
  CarFront,
  CreditCard,
  LayoutDashboard,
  LogIn,
  LogOut,
  X,
} from 'lucide-react';
import { AuthUser, ModuleTab } from '../types/school';

interface SidebarProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  counts: {
    lessonsToday: number;
    activeInstructors: number;
    overdueInvoices: number;
  };
}

const NAV_ITEMS: { id: ModuleTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'scheduling', label: 'Student Scheduling', icon: CalendarClock },
  { id: 'instructors', label: 'Instructor Tracking', icon: CarFront },
  { id: 'payments', label: 'Payment Processing', icon: CreditCard },
  { id: 'courses', label: 'Courses & Tuition', icon: BookOpen },
  { id: 'account', label: 'Login / Logout', icon: LogIn },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  currentUser,
  onLogout,
  counts,
}: SidebarProps) {
  const renderNavContent = () => (
    <div className="flex h-full flex-col justify-between bg-[#103c2a] text-white">
      <div>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <button
            type="button"
            onClick={() => {
              onSelectTab('overview');
              onCloseMobile();
            }}
            className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Anza Auto
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary modules" className="px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.id === 'account' && currentUser ? LogOut : item.icon;
            const isActive = activeTab === item.id;
            const label =
              item.id === 'account'
                ? currentUser
                  ? 'Account · Logout'
                  : 'Login'
                : item.label;
            const countValue =
              item.id === 'scheduling'
                ? counts.lessonsToday
                : item.id === 'instructors'
                  ? counts.activeInstructors
                  : item.id === 'payments' && counts.overdueInvoices > 0
                    ? counts.overdueInvoices
                    : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-[#16834a] text-white'
                    : 'text-[#d6e7dc] hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </span>
                {countValue !== null && (
                  <span
                    className={`font-mono-num text-xs ${
                      item.id === 'payments' && counts.overdueInvoices > 0
                        ? 'text-amber-300'
                        : 'text-white/75'
                    }`}
                  >
                    {countValue}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-6 py-5 border-t border-white/10 text-xs text-[#b9d2c2] space-y-2.5">
        {currentUser ? (
          <div className="space-y-2">
            <div>
              <p className="font-semibold text-white truncate">{currentUser.fullName}</p>
              <p className="text-[#b9d2c2] truncate">
                {currentUser.role} · {currentUser.branch}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onCloseMobile();
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="font-medium text-white">Kenya Operations</p>
            <p>Westlands · Kilimani · Nyali · Nakuru</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#dce6de]">
        <div className="sticky top-0 h-screen">{renderNavContent()}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-xl">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
}
