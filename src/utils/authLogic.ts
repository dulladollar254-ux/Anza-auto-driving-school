import { BranchName, UserAccount, UserRole } from '../types/school';

export interface AuthResult {
  ok: boolean;
  user?: UserAccount;
  users?: UserAccount[];
  error?: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function authenticateUser(
  users: UserAccount[],
  emailInput: string,
  passwordInput: string
): AuthResult {
  const email = normalizeEmail(emailInput);
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  if (!passwordInput || passwordInput.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' };
  }

  const matched = users.find(
    (u) => normalizeEmail(u.email) === email && u.password === passwordInput
  );
  if (!matched) {
    return { ok: false, error: 'Incorrect email or password.' };
  }

  return { ok: true, user: matched };
}

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  branch: BranchName;
  phone: string;
  createdAt: string;
}

export function registerUser(users: UserAccount[], input: SignUpInput): AuthResult {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();

  if (fullName.length < 2) {
    return { ok: false, error: 'Enter your full name (at least 2 characters).' };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  if (!input.password || input.password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, error: 'Passwords do not match.' };
  }
  if (users.some((u) => normalizeEmail(u.email) === email)) {
    return { ok: false, error: 'An account with this email already exists. Please sign in.' };
  }

  const newUser: UserAccount = {
    id: `usr-${Date.now()}`,
    fullName,
    email,
    password: input.password,
    role: input.role,
    branch: input.branch,
    phone: phone || '+254 700 000 000',
    createdAt: input.createdAt,
  };

  return {
    ok: true,
    user: newUser,
    users: [newUser, ...users],
  };
}
