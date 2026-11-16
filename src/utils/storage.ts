import { initialAuthUsers, initialSchoolState } from '../data/seedData';
import { AuthUser, SchoolState } from '../types/school';

const STORAGE_KEY = 'anza_auto_state_v1';
const AUTH_USERS_KEY = 'anza_auto_users_v1';
const AUTH_SESSION_KEY = 'anza_auto_session_user_id_v1';

export function loadSchoolState(): SchoolState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialSchoolState;
    const parsed = JSON.parse(raw) as Partial<SchoolState>;
    if (
      Array.isArray(parsed.students) &&
      Array.isArray(parsed.instructors) &&
      Array.isArray(parsed.lessons) &&
      Array.isArray(parsed.invoices) &&
      Array.isArray(parsed.transactions) &&
      Array.isArray(parsed.courses)
    ) {
      return parsed as SchoolState;
    }
  } catch {
    // Fall back to clean seed state if storage is unreadable
  }
  return initialSchoolState;
}

export function saveSchoolState(state: SchoolState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

export function resetSchoolState(): SchoolState {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage access errors
  }
  return initialSchoolState;
}

export function loadAuthUsers(): AuthUser[] {
  try {
    const raw = window.localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return initialAuthUsers;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as AuthUser[];
    }
  } catch {
    // Fall back to initial demo users
  }
  return initialAuthUsers;
}

export function saveAuthUsers(users: AuthUser[]): void {
  try {
    window.localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadCurrentUserId(): string | null {
  try {
    return window.localStorage.getItem(AUTH_SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveCurrentUserId(userId: string | null): void {
  try {
    if (userId) {
      window.localStorage.setItem(AUTH_SESSION_KEY, userId);
    } else {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}
