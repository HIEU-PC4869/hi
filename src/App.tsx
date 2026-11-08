/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Screen0Login } from './components/Screen0Login';
import { Screen1Student } from './components/Screen1Student';
import { Screen2Instructor } from './components/Screen2Instructor';
import { Screen3Advisor } from './components/Screen3Advisor';
import { Screen4Admin } from './components/Screen4Admin';
import { PythonCodeModal } from './components/PythonCodeModal';
import { HtmlGuideModal } from './components/HtmlGuideModal';

import {
  INITIAL_USERS,
  INITIAL_COURSES,
  INITIAL_STUDENT_STATS,
  INITIAL_ROSTER,
  INITIAL_EXCUSES,
  INITIAL_EWS_FLAGS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';

import {
  User,
  Course,
  StudentCourseStat,
  ActiveSession,
  RosterStudent,
  ExcuseRequest,
  EWSStudentFlag,
  AuditLogItem,
} from './types';
import { canAccessScreen, hasActionPermission } from './utils/rbac';

export default function App() {
  // Screen Index: 0: Login, 1: Student, 2: Instructor, 3: Advisor, 4: Admin
  const [currentScreen, setCurrentScreen] = useState<number>(1);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Alex Rivera
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [stats, setStats] = useState<StudentCourseStat[]>(INITIAL_STUDENT_STATS);
  const [roster, setRoster] = useState<RosterStudent[]>(INITIAL_ROSTER);
  const [excuses, setExcuses] = useState<ExcuseRequest[]>(INITIAL_EXCUSES);
  const [flaggedStudents, setFlaggedStudents] = useState<EWSStudentFlag[]>(INITIAL_EWS_FLAGS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [isHtmlGuideOpen, setIsHtmlGuideOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Active Live Session State
  const [activeSession, setActiveSession] = useState<ActiveSession>({
    sessionId: 9821,
    courseCode: 'CS-301',
    courseName: 'Advanced Data Structures',
    sessionCode: '849-210',
    startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    isActive: true,
    remainingSeconds: 14 * 60 + 59,
  });

  // Handler: Login Success & Role-based routing
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    const newLog: AuditLogItem = {
      id: Date.now(),
      userId: user.id,
      userName: user.fullName,
      action: 'User Sign-in',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      details: `Authenticated role: ${user.role}`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Navigate to role screen
    if (user.role === 'Student') setCurrentScreen(1);
    else if (user.role === 'Instructor') setCurrentScreen(2);
    else if (user.role === 'Advisor') setCurrentScreen(3);
    else if (user.role === 'Administrator') setCurrentScreen(4);

    showToast(`Welcome back, ${user.fullName} (${user.role}).`, 'success');
  };

  // RBAC Navigation Guard
  const handleSelectScreen = (screen: number) => {
    if (screen === 0) {
      setCurrentScreen(0);
      return;
    }
    if (!canAccessScreen(currentUser.role, screen)) {
      showToast(`Access Denied: Your account role (${currentUser.role}) does not have permission to access this workspace.`, 'error');
      
      const violationLog: AuditLogItem = {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'Security Violation (403)',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `Unauthorized navigation attempt to workspace #${screen} by role [${currentUser.role}]`,
      };
      setAuditLogs((prev) => [violationLog, ...prev]);
      return;
    }
    setCurrentScreen(screen);
  };

  // Handler: User Sign-Out
  const handleLogout = () => {
    setCurrentScreen(0);
    const newLog: AuditLogItem = {
      id: Date.now(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      action: 'User Sign-Out',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      details: `${currentUser.fullName} signed out of session and returned to login portal.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast('Successfully signed out of the system.', 'success');
  };

  // Handler: Student Check-in
  const handleStudentCheckIn = (
    courseCode: string,
    checkInStatus: 'Present' | 'Late' | 'Absent' | 'Excused'
  ) => {
    // 1. Update personal stats
    setStats((prev) =>
      prev.map((s) => {
        if (s.code === courseCode) {
          const newPresent = checkInStatus === 'Present' ? s.present + 1 : s.present;
          const newLate = checkInStatus === 'Late' ? s.late + 1 : s.late;
          const newTotal = s.totalSessions + 1;
          const newPct = Math.round(((newPresent + newLate * 0.8) / newTotal) * 1000) / 10;
          return {
            ...s,
            totalSessions: newTotal,
            present: newPresent,
            late: newLate,
            attendancePercentage: newPct,
            complianceStatus:
              newPct >= 95
                ? 'Exemplary'
                : newPct >= 90
                ? 'Good Standing'
                : newPct >= 80
                ? 'Notice'
                : '<80% Warning Threshold',
          };
        }
        return s;
      })
    );

    // 2. Update live class roster
    setRoster((prev) => {
      const exists = prev.find((r) => r.studentId === currentUser.id || r.fullName === currentUser.fullName);
      if (exists) {
        return prev.map((r) =>
          r.studentId === exists.studentId
            ? {
                ...r,
                status: checkInStatus,
                timeLogged: new Date().toLocaleTimeString(),
                method: 'PIN Code',
              }
            : r
        );
      }
      return [
        {
          attendanceId: Date.now(),
          studentId: currentUser.id,
          fullName: currentUser.fullName,
          initials: currentUser.fullName
            .split(' ')
            .map((n) => n[0])
            .join(''),
          status: checkInStatus,
          timeLogged: new Date().toLocaleTimeString(),
          method: 'PIN Code',
        },
        ...prev,
      ];
    });

    // 3. Log audit
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'Student Check-In',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `${currentUser.fullName} checked in to ${courseCode} as ${checkInStatus}`,
      },
      ...prev,
    ]);
  };

  // Handler: Student Excuse Submission
  const handleSubmitExcuse = (newExcuse: Omit<ExcuseRequest, 'id'>) => {
    const excuse: ExcuseRequest = {
      ...newExcuse,
      id: Date.now(),
    };
    setExcuses((prev) => [excuse, ...prev]);

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'Excuse Docket Submitted',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `Absence excuse for ${newExcuse.courseCode} on ${newExcuse.dateAbsent}`,
      },
      ...prev,
    ]);
  };

  // Handler: Instructor Session Orchestration
  const handleStartSession = (courseCode: string) => {
    if (!hasActionPermission(currentUser.role, 'canManageSessions')) {
      showToast('Permission Denied: Instructor role required to initiate attendance sessions.', 'error');
      return;
    }
    const randA = Math.floor(100 + Math.random() * 900);
    const randB = Math.floor(100 + Math.random() * 900);
    const newCode = `${randA}-${randB}`;

    setActiveSession({
      sessionId: Math.floor(1000 + Math.random() * 9000),
      courseCode,
      courseName: courses.find((c) => c.code === courseCode)?.name || courseCode,
      sessionCode: newCode,
      startTime: new Date().toISOString(),
      isActive: true,
      remainingSeconds: 15 * 60,
    });

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'Session Started',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `Live check-in session for ${courseCode} opened. PIN: ${newCode}`,
      },
      ...prev,
    ]);
    showToast(`Live session started for ${courseCode}. PIN: ${newCode}`, 'success');
  };

  const handleEndSession = () => {
    if (!hasActionPermission(currentUser.role, 'canManageSessions')) {
      showToast('Permission Denied: Instructor role required to conclude attendance sessions.', 'error');
      return;
    }
    setActiveSession((prev) => ({
      ...prev,
      isActive: false,
      remainingSeconds: 0,
    }));

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'Session Concluded',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `Active session #${activeSession.sessionId} closed.`,
      },
      ...prev,
    ]);
    showToast('Attendance session successfully concluded.', 'warning');
  };

  // Handler: Instructor Manual Status Override
  const handleOverrideStatus = (
    attendanceId: number,
    newStatus: RosterStudent['status']
  ) => {
    if (!hasActionPermission(currentUser.role, 'canOverrideAttendance')) {
      showToast('Permission Denied: Instructor role required to override student attendance.', 'error');
      return;
    }
    setRoster((prev) =>
      prev.map((r) =>
        r.attendanceId === attendanceId
          ? {
              ...r,
              status: newStatus,
              method: 'Manual Override',
              timeLogged: new Date().toLocaleTimeString(),
              updatedBy: currentUser.id,
            }
          : r
      )
    );

    const student = roster.find((r) => r.attendanceId === attendanceId);
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'Manual Attendance Override',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `Instructor updated ${student?.fullName || 'Student'} status to ${newStatus}.`,
      },
      ...prev,
    ]);
  };

  // Handler: Instructor Review Excuse
  const handleReviewExcuse = (excuseId: number, decision: 'Approved' | 'Rejected') => {
    setExcuses((prev) =>
      prev.map((e) => (e.id === excuseId ? { ...e, status: decision } : e))
    );

    const exc = excuses.find((e) => e.id === excuseId);

    // If approved, update matching attendance in roster if present
    if (decision === 'Approved' && exc) {
      setRoster((prev) =>
        prev.map((r) =>
          r.fullName === exc.studentName ? { ...r, status: 'Excused', method: 'Manual Override' } : r
        )
      );
    }

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'Excuse Decision',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `Excuse #${excuseId} for ${exc?.studentName} marked as ${decision}.`,
      },
      ...prev,
    ]);
  };

  // Handler: Export CSV Report
  const handleExportCourseReport = (courseCode: string) => {
    const headers = ['Student ID', 'Full Name', 'Status', 'Check-In Time', 'Verification Method'];
    const rows = roster.map((r) => [
      r.studentId,
      `"${r.fullName}"`,
      r.status,
      r.timeLogged,
      r.method,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_report_${courseCode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSystemReport = () => {
    const headers = ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Assigned Courses', 'Last Login'];
    const rows = users.map((u) => [
      `USR-${u.id}`,
      `"${u.fullName}"`,
      u.email,
      u.role,
      u.status,
      `"${u.courses.join('; ')}"`,
      `"${u.lastLogin}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `system_governance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler: Advisor Save Counseling Notes
  const handleSaveCounselingNotes = (studentId: number, notes: string) => {
    setFlaggedStudents((prev) =>
      prev.map((s) =>
        s.studentId === studentId
          ? {
              ...s,
              counselingNotes: notes,
              timeline: [
                {
                  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  actor: currentUser.fullName,
                  title: 'Intervention Consultation Logged',
                  description: notes.slice(0, 95) + '...',
                  type: 'counseling',
                },
                ...s.timeline,
              ],
            }
          : s
      )
    );

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'Counseling Note Added',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `Advisor intervention note saved for student ID #${studentId}.`,
      },
      ...prev,
    ]);
  };

  // Handler: Admin Add User
  const handleAddUser = (
    email: string,
    role: User['role'],
    department?: string,
    fullName?: string,
    studentId?: string,
    major?: string,
    academicYear?: string,
    password?: string,
    courses?: string[]
  ) => {
    if (!hasActionPermission(currentUser.role, 'canManageUsers')) {
      showToast('Permission Denied: Administrator role required to provision new user accounts.', 'error');
      return;
    }
    const derivedName = fullName?.trim() || email.split('@')[0].replace(/[._-]+/g, ' ').toUpperCase();
    const effectiveDept = role === 'Student' && major ? `${major} (${academicYear || 'Year 1'})` : (department || 'Dept. of Computer Science');

    const assignedCourses = courses && courses.length > 0 
      ? courses 
      : (role === 'Student' ? ['CS-301', 'ENG-204'] : (role === 'Instructor' ? ['CS-301', 'CS-402'] : ['System Node']));

    const newUser: User = {
      id: Math.floor(1000 + Math.random() * 9000),
      email,
      fullName: derivedName,
      password: password || 'password123',
      role,
      studentId: role === 'Student' ? (studentId || String(Math.floor(24000 + Math.random() * 999))) : undefined,
      major: role === 'Student' ? major : undefined,
      academicYear: role === 'Student' ? academicYear : undefined,
      department: effectiveDept,
      status: 'Active',
      courses: assignedCourses,
      lastLogin: 'Just provisioned',
    };
    setUsers((prev) => [newUser, ...prev]);

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'User Provisioned',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: role === 'Student' 
          ? `Admin provisioned Student: ${derivedName} (ID: #${newUser.studentId}, ${major}, ${academicYear}).`
          : `Admin provisioned ${email} as ${role}.`,
      },
      ...prev,
    ]);
    showToast(`User ${derivedName} (${role}${newUser.studentId ? ' #' + newUser.studentId : ''}) provisioned successfully.`, 'success');
  };

  // Handler: Admin Delete User
  const handleDeleteUser = (userId: number) => {
    if (!hasActionPermission(currentUser.role, 'canManageUsers')) {
      showToast('Permission Denied: Administrator role required to delete user accounts.', 'error');
      return;
    }
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'User Deprovisioned',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `Deleted account USR-${userId} (${target?.email}).`,
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#e0e8f0] selection:bg-[#0e4d6e] selection:text-[#c8eaff]">
      {/* Top Header */}
      <Header
        currentScreen={currentScreen}
        onSelectScreen={handleSelectScreen}
        currentUser={currentUser}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onOpenHtmlGuide={() => setIsHtmlGuideOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container Layout */}
      {currentScreen === 0 ? (
        // Screen 0: Login (Full Page Centered without Sidebar)
        <main className="pt-20">
          <Screen0Login onLoginSuccess={handleLoginSuccess} users={users} />
        </main>
      ) : (
        // Screens 1, 2, 3, 4 with Left Sidebar
        <div className="flex">
          <Sidebar
            currentScreen={currentScreen}
            onSelectScreen={handleSelectScreen}
            currentUserRole={currentUser.role}
          />
          <div className="lg:pl-64 pl-0 w-full">
            <main className="w-full pt-28 px-4 sm:px-8 pb-16 bg-[#0a0e1a] min-h-screen relative">
              {currentScreen === 1 && (
                <Screen1Student
                  currentUser={currentUser}
                  stats={stats}
                  activeSession={activeSession}
                  onCheckInSuccess={handleStudentCheckIn}
                  onSubmitExcuse={handleSubmitExcuse}
                />
              )}

              {currentScreen === 2 && (
                <Screen2Instructor
                  courses={courses}
                  activeSession={activeSession}
                  roster={roster}
                  excuses={excuses}
                  onStartSession={handleStartSession}
                  onEndSession={handleEndSession}
                  onOverrideStatus={handleOverrideStatus}
                  onReviewExcuse={handleReviewExcuse}
                  onExportReport={handleExportCourseReport}
                  onAddCourse={(newCourse) => {
                    setCourses((prev) => prev.some((c) => c.code === newCourse.code) ? prev : [...prev, newCourse]);
                    showToast(`Course ${newCourse.code} added to catalog.`, 'success');
                  }}
                />
              )}

              {currentScreen === 3 && (
                <Screen3Advisor
                  flaggedStudents={flaggedStudents}
                  onSaveCounselingNotes={handleSaveCounselingNotes}
                  onSendAlert={(name) => showToast(`High Priority Academic Alert dispatched to ${name}'s advisor docket.`, 'warning')}
                />
              )}

              {currentScreen === 4 && (
                <Screen4Admin
                  users={users}
                  auditLogs={auditLogs}
                  onAddUser={handleAddUser}
                  onDeleteUser={handleDeleteUser}
                  onExportSystemReport={handleExportSystemReport}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* In-app Toast Feedback Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border transition-all max-w-md bg-[#141c2e]/95 border-[#7dd3fc]/30">
          <span className={`material-symbols-outlined text-lg ${
            toast.type === 'error' ? 'text-rose-400' : toast.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {toast.type === 'error' ? 'gpp_bad' : toast.type === 'warning' ? 'warning' : 'check_circle'}
          </span>
          <span className="text-xs text-[#e0e8f0] font-medium leading-snug">
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            className="text-[#a0b4c4] hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Python Source Code Modal */}
      <PythonCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* HTML VS Code Guide Modal */}
      <HtmlGuideModal
        isOpen={isHtmlGuideOpen}
        onClose={() => setIsHtmlGuideOpen(false)}
      />
    </div>
  );
}
