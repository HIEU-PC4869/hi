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
  StudentCourseStat,
  ActiveSession,
  RosterStudent,
  ExcuseRequest,
  EWSStudentFlag,
  AuditLogItem,
} from './types';

export default function App() {
  // Screen Index: 0: Login, 1: Student, 2: Instructor, 3: Advisor, 4: Admin
  const [currentScreen, setCurrentScreen] = useState<number>(1);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Alex Rivera
  const [courses] = useState(INITIAL_COURSES);
  const [stats, setStats] = useState<StudentCourseStat[]>(INITIAL_STUDENT_STATS);
  const [roster, setRoster] = useState<RosterStudent[]>(INITIAL_ROSTER);
  const [excuses, setExcuses] = useState<ExcuseRequest[]>(INITIAL_EXCUSES);
  const [flaggedStudents, setFlaggedStudents] = useState<EWSStudentFlag[]>(INITIAL_EWS_FLAGS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [isHtmlGuideOpen, setIsHtmlGuideOpen] = useState(false);

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
  };

  const handleEndSession = () => {
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
  };

  // Handler: Instructor Manual Status Override
  const handleOverrideStatus = (
    attendanceId: number,
    newStatus: RosterStudent['status']
  ) => {
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
  const handleAddUser = (email: string, role: User['role'], department?: string) => {
    const newUser: User = {
      id: Math.floor(1000 + Math.random() * 9000),
      email,
      fullName: email.split('@')[0].replace('.', ' ').toUpperCase(),
      role,
      department: department || 'Dept. of Computer Science',
      status: 'Active',
      courses: role === 'Student' ? ['CS-301', 'ENG-204'] : ['CS-301'],
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
        details: `Admin provisioned ${email} as ${role}.`,
      },
      ...prev,
    ]);
  };

  // Handler: Admin Delete User
  const handleDeleteUser = (userId: number) => {
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
        onSelectScreen={setCurrentScreen}
        currentUser={currentUser}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onOpenHtmlGuide={() => setIsHtmlGuideOpen(true)}
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
          <Sidebar currentScreen={currentScreen} onSelectScreen={setCurrentScreen} />
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
                />
              )}

              {currentScreen === 3 && (
                <Screen3Advisor
                  flaggedStudents={flaggedStudents}
                  onSaveCounselingNotes={handleSaveCounselingNotes}
                  onSendAlert={(name) => alert(`High Priority Academic Alert dispatched to ${name}'s advisor docket.`)}
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
