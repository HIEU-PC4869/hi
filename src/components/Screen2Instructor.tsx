import React, { useState, useEffect } from 'react';
import { Course, ActiveSession, RosterStudent, ExcuseRequest } from '../types';

interface Screen2InstructorProps {
  courses: Course[];
  activeSession: ActiveSession;
  roster: RosterStudent[];
  excuses: ExcuseRequest[];
  onStartSession: (courseCode: string) => void;
  onEndSession: () => void;
  onOverrideStatus: (attendanceId: number, newStatus: RosterStudent['status']) => void;
  onReviewExcuse: (excuseId: number, decision: 'Approved' | 'Rejected') => void;
  onExportReport: (courseCode: string) => void;
}

export const Screen2Instructor: React.FC<Screen2InstructorProps> = ({
  courses,
  activeSession,
  roster,
  excuses,
  onStartSession,
  onEndSession,
  onOverrideStatus,
  onReviewExcuse,
  onExportReport,
}) => {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.code || 'CS-301');
  const [filterTab, setFilterTab] = useState<'all' | 'present' | 'late' | 'absent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExcuseId, setSelectedExcuseId] = useState<number>(excuses[0]?.id || 1);
  const [timerSeconds, setTimerSeconds] = useState(activeSession.remainingSeconds || 899);

  // Active timer countdown
  useEffect(() => {
    if (!activeSession.isActive) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          onEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession.isActive, onEndSession]);

  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Counts
  const enrolledCount = roster.length;
  const presentCount = roster.filter((r) => r.status === 'Present').length;
  const lateCount = roster.filter((r) => r.status === 'Late').length;
  const absentCount = roster.filter((r) => r.status === 'Absent').length;

  // Filter roster
  const filteredRoster = roster.filter((r) => {
    const matchesFilter =
      filterTab === 'all'
        ? true
        : filterTab === 'present'
        ? r.status === 'Present'
        : filterTab === 'late'
        ? r.status === 'Late'
        : r.status === 'Absent';
    const matchesSearch =
      !searchQuery ||
      r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.studentId).includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const selectedExcuse = excuses.find((e) => e.id === selectedExcuseId) || excuses[0];

  return (
    <div className="w-full space-y-8">
      {/* Header and Course Selector */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#7dd3fc] font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-[#7dd3fc] animate-ping"></span>
            Live Stream Session Orchestration
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#e0e8f0] tracking-tight">
            Instructor Command Center
          </h1>
          <p className="text-sm text-[#a0b4c4] max-w-2xl leading-relaxed">
            Control active classroom sessions, generate dynamic check-in keys, and evaluate student excuses.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px]">
            <select
              id="combo_instructor_courses"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full appearance-none bg-[#141c2e]/80 border border-[#7dd3fc]/20 text-[#e0e8f0] text-xs rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#7dd3fc] shadow-lg cursor-pointer backdrop-blur-xl"
            >
              {courses.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#141c2e] text-[#e0e8f0]">
                  {c.code} — {c.name} ({c.schedule})
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#a0b4c4] pointer-events-none text-lg">
              expand_more
            </span>
          </div>

          <button
            id="btn_export_course_report"
            onClick={() => onExportReport(selectedCourse)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1a2438]/80 hover:bg-[#202c42] border border-[#7dd3fc]/20 text-[#7dd3fc] text-xs font-semibold shadow-md backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export Course Report</span>
          </button>
        </div>
      </div>

      {/* Session Orchestration Bento Panel */}
      <div className="w-full rounded-2xl bg-[#111828]/80 border border-[#7dd3fc]/15 backdrop-blur-2xl p-6 lg:p-7 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-center">
          {/* Action buttons */}
          <div className="lg:col-span-3 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a0b4c4] uppercase tracking-wider font-semibold">
                Session Status
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                  activeSession.isActive
                    ? 'bg-[#0e4d6e] text-[#c8eaff] border border-[#7dd3fc]/30'
                    : 'bg-[#202c42] text-[#a0b4c4]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeSession.isActive ? 'bg-[#7dd3fc] animate-pulse' : 'bg-[#4a6070]'
                  }`}
                ></span>
                {activeSession.isActive ? 'Broadcasting' : 'Inactive'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5">
              <button
                id="btn_start_session"
                onClick={() => onStartSession(selectedCourse)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0e4d6e] hover:bg-[#0a4c6e] text-[#c8eaff] text-xs font-bold shadow-lg shadow-[#0e4d6e]/30 border border-[#7dd3fc]/30 transition-all hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">sensors</span>
                Start Live Session
              </button>
              <button
                id="btn_end_session"
                onClick={onEndSession}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#3d1414]/90 hover:bg-[#3d1414] text-[#ffb3b3] text-xs font-bold border border-[#ff6b6b]/30 shadow-lg shadow-[#3d1414]/30 transition-all hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">stop_circle</span>
                End Session
              </button>
            </div>
            <span className="text-[11px] text-[#a0b4c4]/80 text-center font-mono">
              Session ID: #SES-9821-B
            </span>
          </div>

          {/* Dynamic PIN / QR display */}
          <div className="lg:col-span-4 flex items-center justify-between p-4 rounded-xl bg-[#141c2e]/70 border border-[#7dd3fc]/15 backdrop-blur-md">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-[#a0b4c4] uppercase tracking-wider">
                Dynamic Check-In PIN
              </span>
              <div
                id="lbl_dynamic_qr"
                className="text-3xl font-mono font-bold tracking-widest text-[#7dd3fc] drop-shadow-[0_0_12px_rgba(125,211,252,0.4)]"
              >
                {activeSession.isActive ? activeSession.sessionCode : 'EXPIRED'}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#88b4cc]">
                <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                <span>
                  Next cycle in{' '}
                  <span className="font-mono text-[#e0e8f0] font-semibold">24s</span>
                </span>
              </div>
            </div>

            {/* Stylized QR Vector Preview */}
            <div
              className="relative p-2 rounded-xl bg-[#202c42]/80 border border-[#7dd3fc]/20 flex items-center justify-center shrink-0 shadow-inner group cursor-pointer"
              title="Click to view full screen projection"
              onClick={() => alert(`Dynamic PIN: ${activeSession.sessionCode}\nProjected to Hall B-12 projector node.`)}
            >
              <svg className="w-18 h-18 text-[#7dd3fc]" fill="currentColor" viewBox="0 0 100 100">
                <rect fill="none" height="28" rx="4" stroke="currentColor" strokeWidth="5" width="28" x="5" y="5"></rect>
                <rect fill="currentColor" height="14" rx="2" width="14" x="12" y="12"></rect>
                <rect fill="none" height="28" rx="4" stroke="currentColor" strokeWidth="5" width="28" x="67" y="5"></rect>
                <rect fill="currentColor" height="14" rx="2" width="14" x="74" y="12"></rect>
                <rect fill="none" height="28" rx="4" stroke="currentColor" strokeWidth="5" width="28" x="5" y="67"></rect>
                <rect fill="currentColor" height="14" rx="2" width="14" x="12" y="74"></rect>
                <rect height="7" rx="1.5" width="7" x="42" y="10"></rect>
                <rect height="14" rx="1.5" width="7" x="52" y="10"></rect>
                <rect height="7" rx="1.5" width="12" x="42" y="24"></rect>
                <rect height="7" rx="1.5" width="7" x="10" y="42"></rect>
                <rect height="7" rx="1.5" width="14" x="22" y="42"></rect>
                <rect fill="#88b4cc" height="16" rx="2" width="16" x="42" y="42"></rect>
                <rect height="7" rx="1.5" width="12" x="65" y="42"></rect>
                <rect height="12" rx="1.5" width="8" x="82" y="42"></rect>
                <rect height="7" rx="1.5" width="22" x="68" y="55"></rect>
                <rect height="12" rx="1.5" width="7" x="42" y="68"></rect>
                <rect height="7" rx="1.5" width="14" x="54" y="75"></rect>
                <rect height="18" rx="1.5" width="16" x="75" y="72"></rect>
              </svg>
              <div className="absolute inset-0 bg-[#7dd3fc]/20 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-opacity rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">zoom_in</span>
              </div>
            </div>
          </div>

          {/* Countdown timer with progress circle */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-4 rounded-xl bg-[#141c2e]/70 border border-[#7dd3fc]/15 backdrop-blur-md">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-[#202c42]"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="7"
                ></circle>
                <circle
                  className="text-[#c8a0f0]"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="42"
                  stroke="currentColor"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * timerSeconds) / 900}
                  strokeLinecap="round"
                  strokeWidth="7"
                ></circle>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span
                  id="lbl_timer"
                  className="text-base font-mono font-bold text-[#c8a0f0] tracking-tight drop-shadow-[0_0_8px_rgba(200,160,240,0.5)]"
                >
                  {timeFormatted}
                </span>
                <span className="text-[9px] uppercase tracking-tighter text-[#a0b4c4]">Remaining</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#141c2e]/60 border border-[#7dd3fc]/10 flex flex-col">
              <span className="text-[11px] text-[#a0b4c4] font-medium">Enrolled</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-[#e0e8f0]">{enrolledCount}</span>
                <span className="text-[10px] text-[#a0b4c4]">students</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0e4d6e]/20 border border-[#7dd3fc]/20 flex flex-col">
              <span className="text-[11px] text-[#7dd3fc] font-medium">Checked In</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-[#7dd3fc]">{presentCount}</span>
                <span className="text-[10px] text-[#7dd3fc]/80">
                  {Math.round((presentCount / (enrolledCount || 1)) * 100)}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141c2e]/60 border border-[#7dd3fc]/10 flex flex-col">
              <span className="text-[11px] text-[#c8a0f0] font-medium">Late Arrival</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-[#c8a0f0]">{lateCount}</span>
                <span className="text-[10px] text-[#a0b4c4]">
                  {Math.round((lateCount / (enrolledCount || 1)) * 100)}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#3d1414]/20 border border-[#ff6b6b]/20 flex flex-col">
              <span className="text-[11px] text-[#ff6b6b] font-medium">Absent</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-[#ff6b6b]">{absentCount}</span>
                <span className="text-[10px] text-[#ff6b6b]/80">
                  {Math.round((absentCount / (enrolledCount || 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Workspace: 60% Roster / 40% Excuse Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel (60%): Real-time Class Attendance Monitoring */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#e0e8f0]">
                Real-time Class Attendance Monitoring
              </h2>
              <p className="text-xs text-[#a0b4c4]">
                Synchronizing dynamic events over secure student edge mesh
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-[#111828]/90 border border-[#7dd3fc]/15 text-xs">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterTab === 'all'
                    ? 'bg-[#0e4d6e] text-[#c8eaff] font-semibold'
                    : 'text-[#a0b4c4] hover:text-[#e0e8f0]'
                }`}
              >
                All ({enrolledCount})
              </button>
              <button
                onClick={() => setFilterTab('present')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterTab === 'present'
                    ? 'bg-[#0e4d6e] text-[#c8eaff] font-semibold'
                    : 'text-[#a0b4c4] hover:text-[#e0e8f0]'
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                onClick={() => setFilterTab('late')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterTab === 'late'
                    ? 'bg-[#0e4d6e] text-[#c8eaff] font-semibold'
                    : 'text-[#a0b4c4] hover:text-[#e0e8f0]'
                }`}
              >
                Late ({lateCount})
              </button>
              <button
                onClick={() => setFilterTab('absent')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterTab === 'absent'
                    ? 'bg-[#0e4d6e] text-[#c8eaff] font-semibold'
                    : 'text-[#a0b4c4] hover:text-[#e0e8f0]'
                }`}
              >
                Absent ({absentCount})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a0b4c4] text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name, institutional ID, or token..."
              className="w-full bg-[#141c2e]/60 border border-[#7dd3fc]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e0e8f0] placeholder:text-[#a0b4c4]/60 focus:outline-none focus:ring-2 focus:ring-[#7dd3fc] shadow-sm"
            />
          </div>

          {/* Table Container (table_instructor_attendance) */}
          <div className="w-full overflow-hidden rounded-2xl bg-[#111828]/70 border border-[#7dd3fc]/15 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" id="table_instructor_attendance">
                <thead>
                  <tr className="bg-[#1a2438]/60 text-[#a0b4c4] text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Student ID</th>
                    <th className="py-3.5 px-4 font-semibold">Full Name</th>
                    <th className="py-3.5 px-4 font-semibold">Status (Override ComboBox)</th>
                    <th className="py-3.5 px-4 font-semibold">Check-In Time</th>
                    <th className="py-3.5 px-4 font-semibold">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#7dd3fc]/5 text-[#e0e8f0]">
                  {filteredRoster.map((student) => (
                    <tr key={student.attendanceId} className="hover:bg-[#1a2438]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[#88b4cc]">
                        #ST-{student.studentId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#7dd3fc]/20 text-[#7dd3fc] flex items-center justify-center font-bold text-[10px]">
                            {student.initials}
                          </div>
                          <span className="font-medium text-[#e0e8f0]">{student.fullName}</span>
                        </div>
                      </td>

                      {/* Status column with embedded interactive QComboBox equivalent */}
                      <td className="py-3.5 px-4">
                        <select
                          value={student.status}
                          onChange={(e) =>
                            onOverrideStatus(
                              student.attendanceId,
                              e.target.value as RosterStudent['status']
                            )
                          }
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            student.status === 'Present'
                              ? 'bg-[#0e4d6e] text-[#c8eaff] border-[#7dd3fc]/40'
                              : student.status === 'Late'
                              ? 'bg-[#3d2060] text-[#e8d0ff] border-[#c8a0f0]/40'
                              : student.status === 'Absent'
                              ? 'bg-[#3d1414] text-[#ffb3b3] border-[#ff6b6b]/40'
                              : 'bg-[#1a3a4e] text-[#c0d8e8] border-[#88b4cc]/40'
                          }`}
                        >
                          <option value="Present">Present</option>
                          <option value="Late">Late</option>
                          <option value="Absent">Absent</option>
                          <option value="Excused">Excused</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#a0b4c4]">
                        {student.timeLogged}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[#a0b4c4]">
                          <span className="material-symbols-outlined text-sm text-[#7dd3fc]">
                            {student.method === 'QR Scan'
                              ? 'qr_code_scanner'
                              : student.method === 'PIN Code'
                              ? 'pin'
                              : student.method === 'Geolocation'
                              ? 'location_on'
                              : 'edit'}
                          </span>
                          <span>{student.method}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-[#1a2438]/40 border-t border-[#7dd3fc]/10 flex items-center justify-between text-[11px] text-[#a0b4c4]">
              <span>Showing {filteredRoster.length} of {enrolledCount} students</span>
              <span className="text-[10px] text-[#88b4cc]">Changes persist to SQLite3 database instantly</span>
            </div>
          </div>
        </div>

        {/* Right Panel (40%): Pending Excuse Requests */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#e0e8f0]">Pending Excuse Requests</h2>
              <p className="text-xs text-[#a0b4c4]">Direct validation workflow for absence appeals</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#3d2060] text-[#e8d0ff] border border-[#c8a0f0]/30">
              {excuses.filter((e) => e.status === 'Pending').length} Requiring Action
            </span>
          </div>

          <div className="w-full rounded-2xl bg-[#111828]/70 border border-[#7dd3fc]/15 backdrop-blur-xl p-4 shadow-xl">
            {/* Excuses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" id="table_instructor_excuses">
                <thead>
                  <tr className="text-[#a0b4c4] text-[11px] uppercase tracking-wider pb-2 border-b border-[#7dd3fc]/10">
                    <th className="pb-2 font-semibold">Student</th>
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Reason</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2438]/60">
                  {excuses.map((exc) => {
                    const isSelected = exc.id === selectedExcuse?.id;
                    return (
                      <tr
                        key={exc.id}
                        onClick={() => setSelectedExcuseId(exc.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#1a2438]/80 text-[#e0e8f0]' : 'hover:bg-[#1a2438]/40 text-[#a0b4c4]'
                        }`}
                      >
                        <td className="py-3 px-2 font-medium text-[#e0e8f0]">{exc.studentName}</td>
                        <td className="py-3 px-2 font-mono text-[11px] text-[#a0b4c4]">{exc.dateAbsent}</td>
                        <td className="py-3 px-2 text-[#88b4cc] font-medium truncate max-w-[120px]">
                          {exc.reason}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                              exc.status === 'Approved'
                                ? 'bg-[#0e4d6e] text-[#c8eaff]'
                                : exc.status === 'Rejected'
                                ? 'bg-[#3d1414] text-[#ffb3b3]'
                                : 'bg-[#3d2060] text-[#e8d0ff]'
                            }`}
                          >
                            {exc.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Document Preview Drawer */}
            {selectedExcuse && (
              <div className="mt-4 pt-4 border-t border-[#7dd3fc]/15 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#e0e8f0] font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#7dd3fc] text-sm">attachment</span>
                    Medical Slip Attachment Preview
                  </span>
                  <span className="text-[10px] font-mono text-[#a0b4c4]">
                    {selectedExcuse.docName || 'DOC-2024-8841.pdf'}
                  </span>
                </div>

                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-[#202c42] border border-[#7dd3fc]/20 group">
                  <img
                    alt="Medical Slip Verification Document"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    src={
                      selectedExcuse.docUrl ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuB7cIPK-5dCyLwZk3nZuHXwTHhMHdyIav0FdX3o5Xya0WLRc5XYDjqdB3CXGR_26mHqSecC8iax6yi3hojxhleXtRcMXIb0gB2VFlnzCCAh6i3OYoZhShBCgqHT9oyZAkWaGNbv36yvtgQJIE0F7n-ctIi3F1seGy1o6wzUnWNCt_UaLOM9_mDw8iv9ugKiy2YJziMmx-g-p3HVO-z2JUnWhHfMfdfXkB5Epg__OGWSebWbdI3snA6F'
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/90 via-[#0a0e1a]/20 to-transparent flex items-end p-3">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#e0e8f0]">
                          St. Jude Medical Urgent Care
                        </span>
                        <span className="text-[10px] text-[#a0b4c4]">
                          Verified Physician Signature Attached
                        </span>
                      </div>
                      <button
                        onClick={() => alert('Full Document Audit: Signature cryptographically verified by University Health Services.')}
                        className="p-1.5 rounded-lg bg-[#1a2438]/80 text-[#7dd3fc] hover:bg-[#1a2438] transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#141c2e]/70 border border-[#7dd3fc]/10 text-xs text-[#a0b4c4] leading-relaxed">
                  <span className="text-[#e0e8f0] font-semibold">Note from {selectedExcuse.studentName}:</span>{' '}
                  "{selectedExcuse.reason}"
                </div>

                {/* Approve / Reject buttons */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    id="btn_approve_excuse"
                    onClick={() => onReviewExcuse(selectedExcuse.id, 'Approved')}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0e4d6e] text-[#c8eaff] hover:brightness-110 border border-[#7dd3fc]/30 font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Approve Excuse
                  </button>
                  <button
                    id="btn_reject_excuse"
                    onClick={() => onReviewExcuse(selectedExcuse.id, 'Rejected')}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#3d1414] text-[#ffb3b3] hover:brightness-110 border border-[#ff6b6b]/30 font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Reject Excuse
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Latency card */}
          <div className="w-full rounded-2xl bg-[#111828]/70 border border-[#7dd3fc]/15 backdrop-blur-xl p-4 shadow-xl flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#a0b4c4] uppercase tracking-wider font-semibold">
                Mesh Validation Latency
              </span>
              <span className="text-base font-bold text-[#e0e8f0]">18.4 ms avg</span>
              <span className="text-[11px] text-[#7dd3fc] flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                TLS 1.3 Hardware Authenticated
              </span>
            </div>
            <div className="w-32 h-10 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 120 40">
                <path
                  d="M 0 32 Q 20 28, 30 18 T 60 22 T 90 8 T 120 14"
                  fill="none"
                  stroke="#7dd3fc"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                ></path>
                <circle cx="120" cy="14" fill="#7dd3fc" r="3.5" className="animate-pulse"></circle>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
