/**
 * Role-Based Access Control (RBAC) Engine
 * Strict permission matrix for Student, Instructor, Advisor, and Administrator roles.
 */

export type UserRole = 'Student' | 'Instructor' | 'Advisor' | 'Administrator' | 'Unauthenticated';

export interface RolePermissions {
  allowedScreens: number[];
  allowedScreenNames: string[];
  canCheckIn: boolean;
  canSubmitExcuse: boolean;
  canManageSessions: boolean;
  canOverrideAttendance: boolean;
  canReviewExcuses: boolean;
  canEditCounseling: boolean;
  canManageUsers: boolean;
  canManageCourses: boolean;
  canManageEnrollments: boolean;
  canResetDatabase: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Student: {
    allowedScreens: [1],
    allowedScreenNames: ['Student Module'],
    canCheckIn: true,
    canSubmitExcuse: true,
    canManageSessions: false,
    canOverrideAttendance: false,
    canReviewExcuses: false,
    canEditCounseling: false,
    canManageUsers: false,
    canManageCourses: false,
    canManageEnrollments: false,
    canResetDatabase: false,
  },
  Instructor: {
    allowedScreens: [2],
    allowedScreenNames: ['Instructor Workspace'],
    canCheckIn: false,
    canSubmitExcuse: false,
    canManageSessions: true,
    canOverrideAttendance: true,
    canReviewExcuses: true,
    canEditCounseling: false,
    canManageUsers: false,
    canManageCourses: false,
    canManageEnrollments: false,
    canResetDatabase: false,
  },
  Advisor: {
    allowedScreens: [3],
    allowedScreenNames: ['Academic Advisor Hub'],
    canCheckIn: false,
    canSubmitExcuse: false,
    canManageSessions: false,
    canOverrideAttendance: false,
    canReviewExcuses: false,
    canEditCounseling: true,
    canManageUsers: false,
    canManageCourses: false,
    canManageEnrollments: false,
    canResetDatabase: false,
  },
  Administrator: {
    allowedScreens: [1, 2, 3, 4], // Full supervisory audit inspection
    allowedScreenNames: [
      'Student Module',
      'Instructor Workspace',
      'Academic Advisor Hub',
      'Administrator Console',
    ],
    canCheckIn: true,
    canSubmitExcuse: true,
    canManageSessions: true,
    canOverrideAttendance: true,
    canReviewExcuses: true,
    canEditCounseling: true,
    canManageUsers: true,
    canManageCourses: true,
    canManageEnrollments: true,
    canResetDatabase: true,
  },
  Unauthenticated: {
    allowedScreens: [0],
    allowedScreenNames: ['Login Portal'],
    canCheckIn: false,
    canSubmitExcuse: false,
    canManageSessions: false,
    canOverrideAttendance: false,
    canReviewExcuses: false,
    canEditCounseling: false,
    canManageUsers: false,
    canManageCourses: false,
    canManageEnrollments: false,
    canResetDatabase: false,
  },
};

/**
 * Validates whether a user with a given role can view or navigate to a target screen.
 */
export function canAccessScreen(role: UserRole | string, screenId: number): boolean {
  if (screenId === 0) return true; // Login screen is accessible to all
  const validRole = (role as UserRole) in ROLE_PERMISSIONS ? (role as UserRole) : 'Student';
  return ROLE_PERMISSIONS[validRole].allowedScreens.includes(screenId);
}

/**
 * Validates whether a user with a given role can perform a specific privileged action.
 */
export function hasActionPermission(
  role: UserRole | string,
  action: keyof Omit<RolePermissions, 'allowedScreens' | 'allowedScreenNames'>
): boolean {
  const validRole = (role as UserRole) in ROLE_PERMISSIONS ? (role as UserRole) : 'Unauthenticated';
  return ROLE_PERMISSIONS[validRole][action];
}
