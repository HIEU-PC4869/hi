import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessScreen, hasActionPermission, ROLE_PERMISSIONS } from './rbac';

test('RBAC: Student can only access Screen 1 (Student Module)', () => {
  assert.equal(canAccessScreen('Student', 1), true);
  assert.equal(canAccessScreen('Student', 2), false); // Instructor
  assert.equal(canAccessScreen('Student', 3), false); // Advisor
  assert.equal(canAccessScreen('Student', 4), false); // Admin
  assert.equal(canAccessScreen('Student', 0), true);  // Login always accessible
});

test('RBAC: Student cannot perform Admin, Instructor, or Advisor actions', () => {
  assert.equal(hasActionPermission('Student', 'canManageUsers'), false);
  assert.equal(hasActionPermission('Student', 'canManageCourses'), false);
  assert.equal(hasActionPermission('Student', 'canManageEnrollments'), false);
  assert.equal(hasActionPermission('Student', 'canResetDatabase'), false);
  assert.equal(hasActionPermission('Student', 'canManageSessions'), false);
  assert.equal(hasActionPermission('Student', 'canOverrideAttendance'), false);
  assert.equal(hasActionPermission('Student', 'canReviewExcuses'), false);
  assert.equal(hasActionPermission('Student', 'canEditCounseling'), false);
  // Allowed actions for Student:
  assert.equal(hasActionPermission('Student', 'canCheckIn'), true);
  assert.equal(hasActionPermission('Student', 'canSubmitExcuse'), true);
});

test('RBAC: Instructor can only access Screen 2 and manage sessions/roster', () => {
  assert.equal(canAccessScreen('Instructor', 2), true);
  assert.equal(canAccessScreen('Instructor', 1), false);
  assert.equal(canAccessScreen('Instructor', 3), false);
  assert.equal(canAccessScreen('Instructor', 4), false);

  assert.equal(hasActionPermission('Instructor', 'canManageSessions'), true);
  assert.equal(hasActionPermission('Instructor', 'canOverrideAttendance'), true);
  assert.equal(hasActionPermission('Instructor', 'canReviewExcuses'), true);
  // Cannot do admin actions:
  assert.equal(hasActionPermission('Instructor', 'canManageUsers'), false);
  assert.equal(hasActionPermission('Instructor', 'canManageCourses'), false);
  assert.equal(hasActionPermission('Instructor', 'canResetDatabase'), false);
});

test('RBAC: Advisor can only access Screen 3 and edit counseling notes', () => {
  assert.equal(canAccessScreen('Advisor', 3), true);
  assert.equal(canAccessScreen('Advisor', 1), false);
  assert.equal(canAccessScreen('Advisor', 2), false);
  assert.equal(canAccessScreen('Advisor', 4), false);

  assert.equal(hasActionPermission('Advisor', 'canEditCounseling'), true);
  assert.equal(hasActionPermission('Advisor', 'canManageUsers'), false);
  assert.equal(hasActionPermission('Advisor', 'canManageSessions'), false);
});

test('RBAC: Administrator has full access and administrative privileges', () => {
  assert.equal(canAccessScreen('Administrator', 1), true);
  assert.equal(canAccessScreen('Administrator', 2), true);
  assert.equal(canAccessScreen('Administrator', 3), true);
  assert.equal(canAccessScreen('Administrator', 4), true);

  assert.equal(hasActionPermission('Administrator', 'canManageUsers'), true);
  assert.equal(hasActionPermission('Administrator', 'canManageCourses'), true);
  assert.equal(hasActionPermission('Administrator', 'canManageEnrollments'), true);
  assert.equal(hasActionPermission('Administrator', 'canResetDatabase'), true);
});

test('RBAC: Unauthenticated accounts can only access Screen 0 (Login)', () => {
  assert.equal(canAccessScreen('Unauthenticated', 0), true);
  assert.equal(canAccessScreen('Unauthenticated', 1), false);
  assert.equal(canAccessScreen('Unauthenticated', 2), false);
  assert.equal(canAccessScreen('Unauthenticated', 3), false);
  assert.equal(canAccessScreen('Unauthenticated', 4), false);
  assert.equal(hasActionPermission('Unauthenticated', 'canManageUsers'), false);
});
