import React, { useState } from 'react';
import { EWSStudentFlag } from '../types';

interface Screen3AdvisorProps {
  flaggedStudents: EWSStudentFlag[];
  onSaveCounselingNotes: (studentId: number, notes: string) => void;
  onSendAlert: (studentName: string) => void;
}

export const Screen3Advisor: React.FC<Screen3AdvisorProps> = ({
  flaggedStudents,
  onSaveCounselingNotes,
  onSendAlert,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<number>(
    flaggedStudents[0]?.studentId || 24108
  );
  const [notesInput, setNotesInput] = useState<string>(
    flaggedStudents[0]?.counselingNotes || ''
  );
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const selectedStudent =
    flaggedStudents.find((s) => s.studentId === selectedStudentId) || flaggedStudents[0];

  const handleSelectStudent = (student: EWSStudentFlag) => {
    setSelectedStudentId(student.studentId);
    setNotesInput(student.counselingNotes);
    setSaveFeedback(null);
  };

  const handleSaveNotes = () => {
    if (!selectedStudent) return;
    onSaveCounselingNotes(selectedStudent.studentId, notesInput);
    setSaveFeedback('Intervention note successfully recorded into institutional record.');
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  return (
    <div className="w-full space-y-8">
      {/* Top Header & Filter Controls */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0e4d6e]/40 border border-[#7dd3fc]/20 text-[#7dd3fc] text-[11px] font-semibold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7dd3fc] animate-ping"></span>
              Real-time Telemetry
            </span>
            <span className="text-xs text-[#a0b4c4]/80 tracking-widest uppercase">
              EWS Engine v4.2
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#e0e8f0] tracking-tight">
            Academic Advisor Early Warning System (EWS)
          </h1>
          <p className="text-sm text-[#a0b4c4] max-w-2xl leading-relaxed">
            Automated detection of students with &lt; 80% attendance or ≥ 3 consecutive unexcused
            absences. Cross-referenced with biometric and LMS logs.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#141c2e]/70 border border-[#7dd3fc]/15 backdrop-blur-xl shadow-sm text-xs">
            <span className="material-symbols-outlined text-[#7dd3fc] text-base">domain</span>
            <span className="text-[#a0b4c4]">Dept:</span>
            <select className="bg-transparent text-[#e0e8f0] font-semibold focus:outline-none cursor-pointer">
              <option className="bg-[#141c2e] text-[#e0e8f0]">Computer Science & Engineering</option>
              <option className="bg-[#141c2e] text-[#e0e8f0]">Electrical Engineering</option>
              <option className="bg-[#141c2e] text-[#e0e8f0]">Applied Mathematics</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#141c2e]/70 border border-[#7dd3fc]/15 backdrop-blur-xl shadow-sm text-xs">
            <span className="material-symbols-outlined text-[#88b4cc] text-base">calendar_month</span>
            <span className="text-[#a0b4c4]">Term:</span>
            <select className="bg-transparent text-[#e0e8f0] font-semibold focus:outline-none cursor-pointer">
              <option className="bg-[#141c2e] text-[#e0e8f0]">Spring 2025</option>
              <option className="bg-[#141c2e] text-[#e0e8f0]">Fall 2024</option>
            </select>
          </div>

          <button
            onClick={() => alert('Exporting Early Warning Audit Docket (PDF/CSV) with timestamp signatures.')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7dd3fc] text-[#001f2e] text-xs font-semibold shadow-md hover:bg-[#c8eaff] transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-base">file_download</span>
            Export Audit
          </button>
        </div>
      </div>

      {/* Bento KPI Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/10 backdrop-blur-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a0b4c4]">
                Total Flagged
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#e0e8f0]">{flaggedStudents.length}</span>
                <span className="text-xs text-[#ff6b6b] font-medium flex items-center">
                  <span className="material-symbols-outlined text-xs">trending_up</span> +2 this wk
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0e4d6e]/30 text-[#7dd3fc] border border-[#7dd3fc]/20">
              <span className="material-symbols-outlined text-xl">groups</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-[#1a2438] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#7dd3fc] h-full rounded-full" style={{ width: '42%' }}></div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-[#141c2e]/60 border border-[#ff6b6b]/20 backdrop-blur-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff6b6b]">
                Critical Interventions
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#ff6b6b]">
                  {flaggedStudents.filter((s) => s.riskLevel === 'CRITICAL').length}
                </span>
                <span className="text-xs text-[#ff6b6b] font-semibold">Immediate Action</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#3d1414]/60 text-[#ff6b6b] border border-[#ff6b6b]/30">
              <span className="material-symbols-outlined text-xl">crisis_alert</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-[#1a2438] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#ff6b6b] h-full rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/10 backdrop-blur-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#88b4cc]">
                Resolved This Week
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#e0e8f0]">9</span>
                <span className="text-xs text-[#7dd3fc] font-medium flex items-center">
                  <span className="material-symbols-outlined text-xs">check_circle</span> 64% rate
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1a3a4e]/50 text-[#88b4cc] border border-[#7dd3fc]/15">
              <span className="material-symbols-outlined text-xl">task_alt</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-[#1a2438] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#88b4cc] h-full rounded-full" style={{ width: '64%' }}></div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/10 backdrop-blur-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c8a0f0]">
                Department Avg
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#e0e8f0]">88.4%</span>
                <span className="text-[11px] text-[#a0b4c4]">Normal</span>
              </div>
            </div>
            <div className="w-18 h-8 flex items-center">
              <svg className="w-full h-full text-[#c8a0f0] overflow-visible" viewBox="0 0 100 40">
                <path
                  d="M 0 30 Q 20 15, 40 25 T 70 8 T 100 18"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                ></path>
                <circle cx="100" cy="18" fill="#c8a0f0" r="3.5" className="animate-pulse"></circle>
              </svg>
            </div>
          </div>
          <span className="mt-3 block text-[10px] text-[#a0b4c4] truncate">
            Cohort CSE-2025: 418 Students active
          </span>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel (60%): Attendance Risk Flags Table */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="p-6 rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/15 backdrop-blur-2xl shadow-md">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7dd3fc] text-xl">warning</span>
                  <h2 className="text-base font-bold text-[#e0e8f0]">Attendance Risk Flags</h2>
                </div>
                <p className="text-xs text-[#a0b4c4]">
                  &lt; 80% overall attendance or ≥ 3 consecutive unexcused absences
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 rounded-lg bg-[#1a2438] text-[11px] font-mono text-[#a0b4c4] border border-[#7dd3fc]/10">
                  Showing: {flaggedStudents.length} Priority Records
                </span>
              </div>
            </div>

            {/* Table (table_advisor_warnings) */}
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left border-collapse" id="table_advisor_warnings">
                <thead>
                  <tr className="text-[11px] font-bold tracking-wider text-[#a0b4c4] uppercase bg-[#1a2438]/60 rounded-xl">
                    <th className="py-3 px-3 rounded-l-xl">ID</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Course</th>
                    <th className="py-3 px-3">Attendance</th>
                    <th className="py-3 px-3">Absences</th>
                    <th className="py-3 px-3">Risk Level</th>
                    <th className="py-3 px-3 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#7dd3fc]/10 text-xs">
                  {flaggedStudents.map((student) => {
                    const isSelected = student.studentId === selectedStudent?.studentId;
                    return (
                      <tr
                        key={student.studentId}
                        onClick={() => handleSelectStudent(student)}
                        className={`group cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#0e4d6e]/30 border-l-2 border-[#7dd3fc]'
                            : 'hover:bg-[#1a2438]/40'
                        }`}
                      >
                        <td className="py-3.5 px-3 font-mono font-medium text-[#7dd3fc]">
                          {student.studentId}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              className="w-7 h-7 rounded-full object-cover shadow-sm ring-1 ring-[#7dd3fc]/40"
                              alt={student.studentName}
                              src={student.avatarUrl}
                            />
                            <div>
                              <span className="font-semibold text-[#e0e8f0] block leading-tight">
                                {student.studentName}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] text-[#7dd3fc] block">
                                  Active Selected
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-[#e0e8f0]">
                          {student.courseCode}
                        </td>
                        <td
                          className={`py-3.5 px-3 font-mono font-bold ${
                            student.attendanceRate < 70 ? 'text-[#ff6b6b]' : 'text-amber-400'
                          }`}
                        >
                          {student.attendanceRate}%
                        </td>
                        <td className="py-3.5 px-3 font-medium text-[#a0b4c4]">
                          {student.consecutiveAbsences} Days
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              student.riskLevel === 'CRITICAL'
                                ? 'bg-[#3d1414] text-[#ff6b6b] border border-[#ff6b6b]/40'
                                : student.riskLevel === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                            }`}
                          >
                            {student.riskLevel === 'CRITICAL' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] animate-ping"></span>
                            )}
                            {student.riskLevel}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            className={`p-1.5 rounded-lg transition-all ${
                              isSelected
                                ? 'bg-[#7dd3fc] text-[#001f2e]'
                                : 'bg-[#1a2438] text-[#7dd3fc] hover:bg-[#7dd3fc] hover:text-[#001f2e]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-base leading-none">
                              chevron_right
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer note */}
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#a0b4c4] border-t border-[#7dd3fc]/10">
              <span>Displaying {flaggedStudents.length} priority flags needing active outreach</span>
              <span className="text-[#7dd3fc] font-mono">Page 1 of 1</span>
            </div>
          </div>

          {/* Department Adherence Card */}
          <div className="p-5 rounded-2xl bg-[#141c2e]/60 border border-[#7dd3fc]/15 backdrop-blur-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#1a2438] text-[#7dd3fc]">
                <span className="material-symbols-outlined text-2xl">insights</span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#e0e8f0]">
                  Department Threshold Adherence
                </h4>
                <p className="text-[11px] text-[#a0b4c4]">
                  93.2% of CSE students maintain &gt;80% attendance rate
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-col text-right">
                <span className="text-xs font-mono font-bold text-[#e0e8f0]">6.8% At-Risk</span>
                <span className="text-[10px] text-[#a0b4c4]">Threshold: 8.0%</span>
              </div>
              <div className="w-24 h-2 bg-[#202c42] rounded-full overflow-hidden">
                <div className="bg-[#7dd3fc] h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (40%): Intervention & Counseling Record */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="p-6 rounded-2xl bg-[#141c2e]/80 border border-[#7dd3fc]/15 backdrop-blur-2xl shadow-xl space-y-6">
            {/* Student Context Header */}
            {selectedStudent && (
              <>
                <div className="space-y-3 pb-4 border-b border-[#7dd3fc]/15">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#3d1414] text-[#ff6b6b] uppercase border border-[#ff6b6b]/30">
                          Probation Watchlist
                        </span>
                        <span className="text-[11px] font-mono text-[#a0b4c4]">
                          SYS_ID #{selectedStudent.studentId}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#e0e8f0]">{selectedStudent.studentName}</h3>
                      <p className="text-xs text-[#a0b4c4]">
                        {selectedStudent.major} • Advisor: {selectedStudent.advisorName}
                      </p>
                    </div>

                    <img
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#7dd3fc]/40 shadow-md"
                      alt={selectedStudent.studentName}
                      src={selectedStudent.avatarUrl}
                    />
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-[#1a2438]/50 border border-[#7dd3fc]/10 text-center">
                      <span className="block text-[10px] text-[#a0b4c4] uppercase">Course Rate</span>
                      <span
                        className={`text-sm font-mono font-bold ${
                          selectedStudent.attendanceRate < 70 ? 'text-[#ff6b6b]' : 'text-amber-400'
                        }`}
                      >
                        {selectedStudent.attendanceRate}%
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#1a2438]/50 border border-[#7dd3fc]/10 text-center">
                      <span className="block text-[10px] text-[#a0b4c4] uppercase">Absence Run</span>
                      <span className="text-sm font-mono font-bold text-[#e0e8f0]">
                        {selectedStudent.consecutiveAbsences} Days
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#1a2438]/50 border border-[#7dd3fc]/10 text-center">
                      <span className="block text-[10px] text-[#a0b4c4] uppercase">Prior Alerts</span>
                      <span className="text-sm font-mono font-bold text-[#88b4cc]">
                        {selectedStudent.priorAlerts} Cases
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#e0e8f0] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#7dd3fc] text-base">history</span>
                      Timeline & Previous Encounters
                    </span>
                    <span className="text-[11px] text-[#a0b4c4]">
                      {selectedStudent.timeline.length} Events
                    </span>
                  </div>

                  <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#2a3a48]">
                    {selectedStudent.timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-[#141c2e] ${
                            event.type === 'referral' ? 'bg-[#7dd3fc]' : 'bg-[#88b4cc]'
                          }`}
                        ></div>
                        <div className="text-xs">
                          <div className="flex items-center justify-between text-[#a0b4c4] text-[11px]">
                            <span className="font-mono">{event.date}</span>
                            <span className="text-[#7dd3fc] font-medium">{event.actor}</span>
                          </div>
                          <p className="text-[#e0e8f0] mt-1 font-medium">{event.title}</p>
                          <p className="text-[11px] text-[#a0b4c4] leading-snug">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback pill */}
                {saveFeedback && (
                  <div className="p-2.5 rounded-xl bg-[#0e4d6e]/60 border border-[#7dd3fc]/30 text-[#c8eaff] text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#7dd3fc]">verified</span>
                    <span>{saveFeedback}</span>
                  </div>
                )}

                {/* Counseling Notes Input (txt_counseling_notes) */}
                <div className="space-y-2">
                  <label
                    className="flex items-center justify-between text-xs font-semibold text-[#e0e8f0]"
                    htmlFor="txt_counseling_notes"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#c8a0f0] text-base">
                        edit_note
                      </span>
                      Intervention Notes & Action Plan
                    </span>
                    <span className="text-[10px] text-[#a0b4c4]">Confidential Record</span>
                  </label>

                  <textarea
                    id="txt_counseling_notes"
                    rows={4}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Enter confidential intervention notes, recovery milestones, and next meeting commitments..."
                    className="w-full rounded-xl bg-[#202c42]/50 border border-[#7dd3fc]/15 p-3.5 text-xs text-[#e0e8f0] leading-relaxed placeholder:text-[#a0b4c4]/50 focus:outline-none focus:ring-1 focus:ring-[#7dd3fc] shadow-inner resize-none"
                  ></textarea>
                </div>

                {/* Action buttons (btn_save_notes) */}
                <div className="space-y-2.5 pt-1">
                  <button
                    id="btn_save_notes"
                    type="button"
                    onClick={handleSaveNotes}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#7dd3fc] text-[#001f2e] text-xs font-semibold shadow-lg hover:bg-[#c8eaff] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    Save Intervention Notes
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          `Calendar Invite Scheduled: 1-on-1 Academic Support session with ${selectedStudent.studentName} for Friday at 11:00 AM.`
                        )
                      }
                      className="py-2.5 px-3 rounded-xl bg-[#1a2438] hover:bg-[#202c42] text-[#e0e8f0] text-xs font-medium border border-[#7dd3fc]/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[#88b4cc] text-base">
                        event_available
                      </span>
                      Schedule 1-on-1
                    </button>

                    <button
                      type="button"
                      onClick={() => onSendAlert(selectedStudent.studentName)}
                      className="py-2.5 px-3 rounded-xl bg-[#3d1414]/70 hover:bg-[#3d1414] text-[#ff6b6b] border border-[#ff6b6b]/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">outgoing_mail</span>
                      Send Academic Alert
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
