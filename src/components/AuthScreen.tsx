import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { BranchName, UserAccount, UserRole } from '../types/school';

interface AuthScreenProps {
  demoUsers: UserAccount[];
  onSignIn: (email: string, password: string) => { ok: boolean; error?: string };
  onSignUp: (input: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    branch: BranchName;
    phone: string;
  }) => { ok: boolean; error?: string };
}

const BRANCHES: BranchName[] = ['Westlands', 'Kilimani', 'Mombasa Nyali', 'Nakuru'];
const ROLES: UserRole[] = ['Operations Admin', 'Instructor', 'Student'];

export function AuthScreen({ demoUsers, onSignIn, onSignUp }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up extra fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Operations Admin');
  const [branch, setBranch] = useState<BranchName>('Westlands');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');

  const switchMode = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signin') {
      const res = onSignIn(email, password);
      if (!res.ok) {
        setError(res.error ?? 'Unable to sign in.');
      }
      return;
    }

    const res = onSignUp({
      fullName,
      email,
      password,
      confirmPassword,
      role,
      branch,
      phone,
    });
    if (!res.ok) {
      setError(res.error ?? 'Unable to create account.');
    }
  };

  const handleFillDemo = (user: UserAccount) => {
    setMode('signin');
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f3f7f4] text-[#16241c] flex flex-col justify-between">
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 items-stretch rounded-2xl overflow-hidden border border-[#dce6de] bg-white shadow-sm">
          {/* Left Context & Demo Access Panel */}
          <section className="bg-[#103c2a] text-white p-8 sm:p-10 flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <p className="font-display text-xl font-bold tracking-tight text-white">
                Anza Auto
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-balance">
                Driving school operations, scheduling, and tuition in one place.
              </h1>
              <p className="text-sm text-[#d4e7da] leading-relaxed">
                Sign in to coordinate practical road sessions, track dual-control instructors across Kenya, and process student KSh payments.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border-t border-white/15 pt-5">
                <p className="text-xs font-semibold text-[#9fd8b5]">
                  Quick Sign-In Accounts (Demo)
                </p>
                <p className="mt-1 text-xs text-[#d4e7da]">
                  Select an account to fill credentials, or create a new user account on the right.
                </p>
              </div>

              <div className="space-y-2.5">
                {demoUsers.slice(0, 3).map((u) => (
                  <div
                    key={u.id}
                    className="rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {u.fullName} · {u.role}
                      </p>
                      <p className="font-mono-num text-xs text-[#b9d2c2] truncate">
                        {u.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFillDemo(u)}
                      aria-label={`Fill credentials for ${u.role}`}
                      className="rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-[#103c2a] hover:bg-[#eef5f0] whitespace-nowrap shrink-0"
                    >
                      Use Account
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right Form Panel */}
          <section className="p-8 sm:p-10 flex flex-col justify-center">
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#16241c]">
                  {mode === 'signin' ? 'Sign in to Anza Auto' : 'Create your account'}
                </h2>
                <p className="mt-1 text-sm text-[#54685b]">
                  {mode === 'signin'
                    ? 'Enter your school email and password to open your workspace.'
                    : 'Register as operations staff, an instructor, or a learner.'}
                </p>
              </div>

              {/* Segmented Mode Switch */}
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="grid grid-cols-2 gap-1 rounded-lg bg-[#eef3ef] p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signin'}
                  onClick={() => switchMode('signin')}
                  className={`rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    mode === 'signin'
                      ? 'bg-white text-[#16241c] shadow-xs'
                      : 'text-[#54685b] hover:text-[#16241c]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  onClick={() => switchMode('signup')}
                  className={`rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    mode === 'signup'
                      ? 'bg-white text-[#16241c] shadow-xs'
                      : 'text-[#54685b] hover:text-[#16241c]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-[#fee2e2] px-3.5 py-2.5 text-xs font-medium text-[#991b1b]"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label htmlFor="auth-name" className="block text-xs font-semibold text-[#16241c] mb-1">
                        Full Name
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="e.g. Grace Akinyi"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c] focus:border-[#16834a] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="auth-role" className="block text-xs font-semibold text-[#16241c] mb-1">
                          Account Role
                        </label>
                        <select
                          id="auth-role"
                          value={role}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c] focus:border-[#16834a] focus:outline-none"
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
                          className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c] focus:border-[#16834a] focus:outline-none"
                        >
                          {BRANCHES.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="auth-phone" className="block text-xs font-semibold text-[#16241c] mb-1">
                        Phone Number
                      </label>
                      <input
                        id="auth-phone"
                        type="tel"
                        placeholder="+254 712 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c] focus:border-[#16834a] focus:outline-none"
                      />
                    </div>
                  </>
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
                    placeholder="you@anzaauto.co.ke"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c] focus:border-[#16834a] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-[#16241c] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      required
                      minLength={4}
                      placeholder="At least 4 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 pr-10 py-2 text-sm text-[#16241c] focus:border-[#16834a] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#54685b] hover:text-[#16241c]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label htmlFor="auth-confirm" className="block text-xs font-semibold text-[#16241c] mb-1">
                      Confirm Password
                    </label>
                    <input
                      id="auth-confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={4}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-[#d4dfd6] bg-white px-3 py-2 text-sm text-[#16241c] focus:border-[#16834a] focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#16834a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#147441] transition-colors"
                >
                  {mode === 'signin' ? (
                    <>
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              <div className="rounded-lg bg-[#f7faf8] border border-[#e6eee8] px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-[#54685b]">
                <ShieldCheck className="h-4 w-4 text-[#16834a] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Local browser session prototype: accounts and changes save in this browser. Use a test password rather than a real banking password.
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#dce6de] bg-white px-6 py-4 text-xs text-[#54685b] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>Anza Auto Driving School Management</span>
        <span>Westlands · Kilimani · Mombasa Nyali · Nakuru</span>
      </footer>
    </div>
  );
}
