import { useState } from 'react';
import { LogIn, LogOut, ShieldCheck, UserPlus } from 'lucide-react';
import { AuthUser, BranchName, UserRole } from '../types/school';

interface AccountModuleProps {
  currentUser: AuthUser | null;
  users: AuthUser[];
  onLogin: (email: string, password: string) => { ok: boolean; error?: string };
  onRegister: (input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    branch: BranchName;
  }) => { ok: boolean; error?: string };
  onLogout: () => void;
}

const BRANCHES: BranchName[] = ['Westlands', 'Kilimani', 'Mombasa Nyali', 'Nakuru'];
const ROLES: UserRole[] = ['Operations Staff', 'Driving Instructor', 'Student'];

export function AccountModule({
  currentUser,
  users,
  onLogin,
  onRegister,
  onLogout,
}: AccountModuleProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Operations Staff');
  const [branch, setBranch] = useState<BranchName>('Westlands');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const res = onLogin(email, password);
      if (!res.ok) {
        setError(res.error ?? 'Unable to log in.');
        return;
      }
      setPassword('');
      return;
    }

    const res = onRegister({ fullName, email, password, role, branch });
    if (!res.ok) {
      setError(res.error ?? 'Unable to create account.');
      return;
    }
    setFullName('');
    setEmail('');
    setPassword('');
  };

  if (currentUser) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#16241c]">
              Account &amp; Session
            </h1>
            <p className="mt-1 text-sm text-[#54685b]">
              Manage your active Anza Auto operator session or sign out of this workstation.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-[#991b1b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7f1d1d] whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-xl bg-white border border-[#dce6de] p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#eaf0eb]">
              <div>
                <p className="text-xs font-medium text-[#16834a]">Active Session</p>
                <h2 className="mt-1 font-display text-xl font-bold text-[#16241c]">
                  {currentUser.fullName}
                </h2>
                <p className="mt-0.5 text-sm text-[#54685b]">
                  {currentUser.role} · {currentUser.branch} Branch
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#e8f5ec] px-2.5 py-1 text-xs font-medium text-[#116438] whitespace-nowrap shrink-0">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Signed in</span>
              </span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-[#54685b]">Email Address</dt>
                <dd className="mt-1 font-medium text-[#16241c]">{currentUser.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#54685b]">Assigned Branch</dt>
                <dd className="mt-1 font-medium text-[#16241c]">{currentUser.branch}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#54685b]">Access Role</dt>
                <dd className="mt-1 font-medium text-[#16241c]">{currentUser.role}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#54685b]">Member Since</dt>
                <dd className="mt-1 font-mono-num text-xs font-medium text-[#16241c]">
                  {currentUser.createdAt}
                </dd>
              </div>
            </dl>

            <div className="pt-4 border-t border-[#eaf0eb] flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#54685b]">
                Tuition payments recorded during this session are stamped under{' '}
                <span className="font-semibold text-[#16241c]">{currentUser.fullName}</span>.
              </p>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-[#d4dfd6] bg-white px-4 py-2 text-xs font-semibold text-[#991b1b] hover:bg-[#fef2f2]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign out of session</span>
              </button>
            </div>
          </section>

          <section className="rounded-xl bg-white border border-[#dce6de] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#eaf0eb]">
              <h2 className="font-display text-base font-semibold text-[#16241c]">
                Workspace Accounts
              </h2>
              <p className="text-xs text-[#54685b]">Registered staff, instructors, and students</p>
            </div>
            <div className="divide-y divide-[#eaf0eb]">
              {users.map((u) => (
                <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#16241c] truncate">{u.fullName}</p>
                    <p className="text-xs text-[#54685b] truncate">
                      {u.role} · {u.branch}
                    </p>
                  </div>
                  {u.id === currentUser.id && (
                    <span className="text-xs font-semibold text-[#16834a] whitespace-nowrap shrink-0">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#16241c]">
          Sign In to Anza Auto
        </h1>
        <p className="mt-1 text-sm text-[#54685b]">
          Log in with your staff, instructor, or student credentials, or register a new local account.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <section className="lg:col-span-3 rounded-xl bg-white border border-[#dce6de] p-6 space-y-5">
          <div className="inline-flex items-center gap-1 rounded-lg bg-[#eef3ef] p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
                mode === 'login'
                  ? 'bg-white text-[#16241c] shadow-xs'
                  : 'text-[#54685b] hover:text-[#16241c]'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Log in</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
                mode === 'register'
                  ? 'bg-white text-[#16241c] shadow-xs'
                  : 'text-[#54685b] hover:text-[#16241c]'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Create account</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-[#fee2e2] px-3.5 py-2.5 text-xs font-medium text-[#991b1b]"
              >
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="auth-fullname" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Full Name
                  </label>
                  <input
                    id="auth-fullname"
                    type="text"
                    required
                    placeholder="e.g. Catherine Muthoni"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  />
                </div>
                <div>
                  <label htmlFor="auth-role" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Role
                  </label>
                  <select
                    id="auth-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="auth-branch" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Branch
                  </label>
                  <select
                    id="auth-branch"
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
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-[#16241c] mb-1">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                placeholder="otieno@anzaauto.co.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-[#16241c] mb-1">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={4}
                placeholder="At least 4 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c]"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#16834a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#147441]"
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Log in</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  <span>Create account</span>
                </>
              )}
            </button>
          </form>
        </section>

        <section className="lg:col-span-2 rounded-xl bg-white border border-[#dce6de] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#eaf0eb]">
            <h2 className="font-display text-base font-semibold text-[#16241c]">
              Demo Accounts
            </h2>
            <p className="text-xs text-[#54685b]">
              Use a test password (<span className="font-mono-num">anza2026</span>) to explore roles
            </p>
          </div>
          <div className="divide-y divide-[#eaf0eb]">
            {users.slice(0, 4).map((demo) => (
              <div key={demo.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#16241c] truncate">{demo.fullName}</p>
                  <p className="text-xs text-[#54685b] truncate">
                    {demo.role} · {demo.branch}
                  </p>
                  <p className="font-mono-num text-xs text-[#687a6e] truncate">{demo.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    onLogin(demo.email, demo.password);
                  }}
                  className="rounded-md border border-[#dce6de] bg-white px-3 py-1.5 text-xs font-semibold text-[#16241c] hover:bg-[#f2f7f3] whitespace-nowrap shrink-0"
                >
                  Use account
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
