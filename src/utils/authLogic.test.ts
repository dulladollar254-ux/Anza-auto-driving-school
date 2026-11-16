import test from 'node:test';
import assert from 'node:assert/strict';
import { initialUsers, TODAY_DATE } from '../data/seedData';
import { authenticateUser, registerUser } from './authLogic';

test('authenticateUser succeeds with valid demo credentials (case-insensitive email)', () => {
  const res = authenticateUser(initialUsers, '  ADMIN@ANZAAUTO.CO.KE ', 'anza2026');
  assert.equal(res.ok, true);
  assert.equal(res.user?.role, 'Operations Admin');
});

test('authenticateUser rejects invalid email, short password, and wrong password', () => {
  assert.equal(authenticateUser(initialUsers, 'not-an-email', 'anza2026').ok, false);
  assert.equal(authenticateUser(initialUsers, 'admin@anzaauto.co.ke', '12').ok, false);
  assert.equal(authenticateUser(initialUsers, 'admin@anzaauto.co.ke', 'wrongpass').ok, false);
});

test('registerUser validates mismatched passwords and duplicate emails', () => {
  const mismatch = registerUser(initialUsers, {
    fullName: 'James Mwangi',
    email: 'james@anza.example',
    password: 'pass1234',
    confirmPassword: 'pass9999',
    role: 'Student',
    branch: 'Kilimani',
    phone: '+254 712 000 999',
    createdAt: TODAY_DATE,
  });
  assert.equal(mismatch.ok, false);
  assert.match(mismatch.error || '', /do not match/);

  const duplicate = registerUser(initialUsers, {
    fullName: 'Another Admin',
    email: 'admin@anzaauto.co.ke',
    password: 'pass1234',
    confirmPassword: 'pass1234',
    role: 'Operations Admin',
    branch: 'Westlands',
    phone: '+254 712 000 999',
    createdAt: TODAY_DATE,
  });
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.error || '', /already exists/);
});

test('registerUser creates new account and prepends to user list', () => {
  const created = registerUser(initialUsers, {
    fullName: 'Lucy Muthoni',
    email: 'lucy@anza.example',
    password: 'drive2026',
    confirmPassword: 'drive2026',
    role: 'Instructor',
    branch: 'Mombasa Nyali',
    phone: '+254 722 111 222',
    createdAt: TODAY_DATE,
  });

  assert.equal(created.ok, true);
  assert.equal(created.user?.fullName, 'Lucy Muthoni');
  assert.equal(created.user?.role, 'Instructor');
  assert.equal(created.users?.length, initialUsers.length + 1);
});
