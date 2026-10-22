import React, { useState } from 'react';
import { User, StudentCourseStat, ExcuseRequest, ActiveSession } from '../types';
import { evaluateCheckInTiming, AttendanceStatus } from '../utils/rules';

interface Screen1StudentProps {
  currentUser: User;
  stats: StudentCourseStat[];
  activeSession: ActiveSession;
  onCheckInSuccess: (courseCode: string, status: AttendanceStatus) => void;
  onSubmitExcuse: (excuse: Omit<ExcuseRequest, 'id'>) => void;
}

export const Screen1Student: React.FC<Screen1StudentProps> = ({
  currentUser,
  stats,
  activeSession,
  onCheckInSuccess,
  onSubmitExcuse,
}) => {
  // Check-in state
  const [selectedCourse, setSelectedCourse] = useState(stats[0]?.code || 'CS-301');
  const [pinInput, setPinInput] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<{
    text: string;
    type: 'ready' | 'loading' | 'success' | 'error';
  }>({
    text: 'Ready for check-in',
    type: 'ready',
  });

  // Excuse state
  const [excuseCourse, setExcuseCourse] = useState('PHY-102');
  const [excuseDate, setExcuseDate] = useState('2025-04-18');
  const [excuseReason, setExcuseReason] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false);
  const [excuseNotice, setExcuseNotice] = useState<string | null>(null);

  const handleCheckIn = () => {
    if (!pinInput.trim()) {
      setCheckInStatus({
        text: 'Enter 6-digit PIN or scan QR code',
        type: 'error',
      });
      return;
    }

    setCheckInStatus({ text: 'Verifying session token...', type: 'loading' });

    setTimeout(() => {
      // Evaluate timing window (<15m Present, 15-45m Late)
      const sessionStart = new Date(activeSession.startTime);
      const now = new Date();

      const result = evaluateCheckInTiming(
        sessionStart,
        now,
        activeSession.sessionCode,
        pinInput
      );

      if (result.success) {
        setCheckInStatus({
          text: `Verified ${result.status}: ${selectedCourse}`,
          type: 'success',
        });
        onCheckInSuccess(selectedCourse, result.status);
        setPinInput('');
      } else {
        setCheckInStatus({
          text: result.message,
          type: 'error',
        });
      }
    }, 800);
  };

  const handleExcuseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excuseReason.trim()) {
      return;
    }

    setIsSubmittingExcuse(true);
    setTimeout(() => {
      onSubmitExcuse({
        studentId: currentUser.id,
        studentName: currentUser.fullName,
        courseCode: excuseCourse,
        courseName: stats.find((s) => s.code === excuseCourse)?.name || excuseCourse,
        dateAbsent: excuseDate,
        reason: excuseReason.trim(),
        status: 'Pending',
        docName: selectedFileName || 'medical_clearance_notice.pdf',
      });

      setIsSubmittingExcuse(false);
      setExcuseNotice('Formal excuse slip registered with cryptographic audit hash.');
      setExcuseReason('');
      setSelectedFileName(null);
      setTimeout(() => setExcuseNotice(null), 5000);
    }, 900);
  };

  // Calculate overall index
  const overallAvg =
    stats.reduce((acc, s) => acc + s.attendancePercentage, 0) / (stats.length || 1);

  return (
    <div className="w-full space-y-8">
      {/* Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141c2e] via-[#1a2438]/70 to-[#141c2e] p-6 shadow-xl border border-[#7dd3fc]/10 backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7dd3fc]/10 blur-3xl pointer-events-none"></div>
        <div className="absolute right-64 -bottom-16 h-48 w-48 rounded-full bg-[#c8a0f0]/10 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0e4d6e]/80 border border-[#7dd3fc]/20 px-3 py-1 text-xs font-medium text-[#c8eaff] shadow-inner">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7dd3fc] animate-pulse"></span>
                Spring Term 2025
              </span>
              <span className="text-xs text-[#a0b4c4] font-mono uppercase tracking-wider">
                SAS-STU-SYS // Live
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#e0e8f0]">
              Student Attendance & Compliance Dashboard
            </h1>
            <p className="text-sm text-[#a0b4c4] max-w-2xl leading-relaxed">
              Record live session presence, audit personal course retention metrics, and submit
              verified academic excuse documentation.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0a0e1a]/80 border border-[#7dd3fc]/15 p-3.5 rounded-xl shadow-md shrink-0">
            <div className="relative">
              <img
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-[#7dd3fc]/40"
                alt="Student Profile"
                src={currentUser.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDW1H8demv24Fah4Ts3AEOPQ5WdWNffOJQfNqXBUWmlmYc3qNcW4o5dGuk8G6hnB87ClAIPlVd5v2aOQh2W69QAQ2-jBhn1EZSzLkYsBdcxHlrw2sYR2U8zmNOEkFyAhcc-mZMQTWzc2LdNXFJvMUuNE1XtiGDQDOLqXw-XSg8ANSHc5SpAUvkzqc1DtWAZ06wIK_TiUgikB3Akt1czYlRABBPV2fssONQTY2VM0nXcNVdTdBa9Zqz9'}
              />
              <div className="absolute -bottom-1 -right-1 bg-[#0a0e1a] p-0.5 rounded-full">
                <span className="material-symbols-outlined text-[#7dd3fc] text-base block">
                  verified
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#e0e8f0]">{currentUser.fullName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7dd3fc]/15 text-[#7dd3fc] border border-[#7dd3fc]/30">
                  ID: {currentUser.studentId || '24091'}
                </span>
              </div>
              <span className="text-xs text-[#a0b4c4]">{currentUser.major || 'B.S. Software Engineering • Year 3'}</span>
              <span className="text-[11px] text-[#88b4cc] font-medium">
                Compliance Index:{' '}
                <strong className="text-[#e0e8f0] font-semibold">
                  {overallAvg.toFixed(1)}% ({overallAvg >= 80 ? 'Good' : 'At-Risk'})
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Fast Check-in & Excuse Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Fast Check-In (QR / Session PIN) */}
        <div className="lg:col-span-6 glacier-card rounded-2xl p-6 shadow-xl relative group">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#0e4d6e]/60 text-[#7dd3fc] border border-[#7dd3fc]/20">
                <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#e0e8f0]">
                  Fast Check-In (QR / Session PIN)
                </h2>
                <p className="text-xs text-[#a0b4c4]">Synchronized geofence attendance verification</p>
              </div>
            </div>

            <span
              id="lbl_checkin_status"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                checkInStatus.type === 'success'
                  ? 'bg-[#0e4d6e] text-[#7dd3fc] border-[#7dd3fc]/30'
                  : checkInStatus.type === 'error'
                  ? 'bg-[#3d1414] text-[#ff6b6b] border-[#ff6b6b]/30'
                  : checkInStatus.type === 'loading'
                  ? 'bg-[#1a2438] text-[#c8a0f0] border-[#c8a0f0]/30'
                  : 'bg-[#7dd3fc]/15 text-[#7dd3fc] border-[#7dd3fc]/20'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {checkInStatus.type === 'success'
                  ? 'check_circle'
                  : checkInStatus.type === 'error'
                  ? 'error'
                  : checkInStatus.type === 'loading'
                  ? 'sync'
                  : 'task_alt'}
              </span>
              <span>{checkInStatus.text}</span>
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium text-[#a0b4c4] uppercase tracking-wider mb-2"
                htmlFor="combo_student_courses"
              >
                Enrolled Session
              </label>
              <div className="relative">
                <select
                  id="combo_student_courses"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full bg-[#1a2438]/90 text-[#e0e8f0] text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-[#7dd3fc]/40 border border-[#7dd3fc]/15 shadow-inner cursor-pointer"
                >
                  {stats.map((s) => (
                    <option key={s.code} value={s.code} className="bg-[#141c2e] text-[#e0e8f0]">
                      {s.code}: {s.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a0b4c4] pointer-events-none text-xl">
                  expand_more
                </span>
              </div>
            </div>

            {/* Viewfinder simulation */}
            <div className="relative rounded-xl overflow-hidden bg-[#0a0e1a]/90 border border-[#7dd3fc]/15 p-4 flex flex-col items-center justify-center min-h-[200px]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#7dd3fc]/5 via-transparent to-[#7dd3fc]/5 pointer-events-none"></div>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-[#7dd3fc]/10 animate-pulse"></div>
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#7dd3fc] rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#7dd3fc] rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#7dd3fc] rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#7dd3fc] rounded-br-lg"></div>

                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#7dd3fc] to-transparent absolute top-0 shadow-[0_0_12px_#7dd3fc] animate-[bounce_3s_infinite]"></div>
                <div className="flex flex-col items-center justify-center p-3 text-center">
                  <span className="material-symbols-outlined text-3xl text-[#7dd3fc]/80 mb-1">
                    center_focus_strong
                  </span>
                  <span className="text-[11px] text-[#a0b4c4]">Optical Scan Active</span>
                  <span className="text-[10px] font-mono text-[#88b4cc]">
                    Active Session PIN: {activeSession.sessionCode}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-[#a0b4c4]/80 mt-3 text-center">
                Align room projection QR, or enter the session PIN below
              </span>
            </div>

            {/* PIN Input */}
            <div>
              <label
                className="block text-xs font-medium text-[#a0b4c4] uppercase tracking-wider mb-2"
                htmlFor="txt_qr_code"
              >
                Session Token / 6-Digit PIN
              </label>
              <div className="relative">
                <input
                  id="txt_qr_code"
                  type="text"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 6-digit PIN or paste QR token"
                  className="w-full bg-[#1a2438]/90 text-[#e0e8f0] placeholder:text-[#a0b4c4]/60 text-sm font-mono tracking-widest rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-[#7dd3fc]/40 border border-[#7dd3fc]/15 shadow-inner"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a0b4c4] text-lg">
                  pin
                </span>
                <button
                  type="button"
                  onClick={() => setPinInput(activeSession.sessionCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[#0e4d6e] text-[#c8eaff] text-[10px] font-mono hover:bg-[#7dd3fc] hover:text-[#001f2e] transition-colors"
                  title="Auto-fill with current live room PIN"
                >
                  Fill Active PIN
                </button>
              </div>
            </div>

            {/* Check In Action Button */}
            <button
              id="btn_submit_attendance"
              type="button"
              onClick={handleCheckIn}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-[#7dd3fc] text-[#001f2e] hover:bg-[#c8eaff] hover:shadow-lg hover:shadow-[#7dd3fc]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-lg">how_to_reg</span>
              <span>Check In</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-[#a0b4c4] px-1 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#7dd3fc]"></span> Geolocation Lock: Campus Zone A
              </span>
              <span>Lat: 34.0522° N • IP Verified</span>
            </div>
          </div>
        </div>

        {/* Right Col: Absence Excuse Submission */}
        <div className="lg:col-span-6 glacier-card rounded-2xl p-6 shadow-xl relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#3d2060]/60 text-[#c8a0f0] border border-[#c8a0f0]/20">
                <span className="material-symbols-outlined text-xl">clinical_notes</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#e0e8f0]">Absence Excuse Submission</h2>
                <p className="text-xs text-[#a0b4c4]">Submit official justification and medical records</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#c8a0f0]/15 text-[#c8a0f0] border border-[#c8a0f0]/30">
              Dean of Students SLA: 48h
            </span>
          </div>

          {excuseNotice && (
            <div className="mb-4 p-3 rounded-xl bg-[#0e4d6e]/50 border border-[#7dd3fc]/30 text-[#c8eaff] text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#7dd3fc]">verified</span>
              <span>{excuseNotice}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleExcuseSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-medium text-[#a0b4c4] uppercase tracking-wider mb-2"
                  htmlFor="combo_excuse_course"
                >
                  Impacted Course
                </label>
                <div className="relative">
                  <select
                    id="combo_excuse_course"
                    value={excuseCourse}
                    onChange={(e) => setExcuseCourse(e.target.value)}
                    className="w-full bg-[#1a2438]/90 text-[#e0e8f0] text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-[#c8a0f0]/40 border border-[#7dd3fc]/15 shadow-inner cursor-pointer"
                  >
                    {stats.map((s) => (
                      <option key={s.code} value={s.code} className="bg-[#141c2e] text-[#e0e8f0]">
                        {s.code}: {s.name}
                      </option>
                    ))}
                    <option value="ALL" className="bg-[#141c2e] text-[#e0e8f0]">
                      All Active Courses (Full Day)
                    </option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a0b4c4] pointer-events-none text-xl">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-medium text-[#a0b4c4] uppercase tracking-wider mb-2"
                  htmlFor="date_excuse"
                >
                  Absence Date
                </label>
                <div className="relative">
                  <input
                    id="date_excuse"
                    type="date"
                    value={excuseDate}
                    onChange={(e) => setExcuseDate(e.target.value)}
                    className="w-full bg-[#1a2438]/90 text-[#e0e8f0] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c8a0f0]/40 border border-[#7dd3fc]/15 shadow-inner cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-medium text-[#a0b4c4] uppercase tracking-wider mb-2"
                htmlFor="txt_excuse_reason"
              >
                Absence Classification & Context
              </label>
              <textarea
                id="txt_excuse_reason"
                rows={3}
                required
                value={excuseReason}
                onChange={(e) => setExcuseReason(e.target.value)}
                placeholder="Medical clinic visit, institutional athletics, bereavement, or religious observance details..."
                className="w-full bg-[#1a2438]/90 text-[#e0e8f0] placeholder:text-[#a0b4c4]/60 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c8a0f0]/40 border border-[#7dd3fc]/15 shadow-inner resize-none"
              ></textarea>
            </div>

            {/* Document attachment dropzone */}
            <div>
              <label className="block text-xs font-medium text-[#a0b4c4] uppercase tracking-wider mb-2">
                Verification Attachment (Doctor note, travel orders, etc.)
              </label>
              <div
                onClick={() => setSelectedFileName('official_medical_clearance.pdf')}
                className="relative rounded-xl p-4 bg-[#0a0e1a]/60 border border-dashed border-[#7dd3fc]/20 text-center cursor-pointer hover:bg-[#0a0e1a] transition-all"
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="h-9 w-9 rounded-full bg-[#1a2438] flex items-center justify-center text-[#c8a0f0]">
                    <span className="material-symbols-outlined text-xl">upload_file</span>
                  </div>
                  <span className="text-xs font-medium text-[#e0e8f0]">
                    Click to attach verified documentation
                  </span>
                  <span className="text-[10px] text-[#a0b4c4]">
                    PDF, JPEG, or PNG up to 15MB • Encrypted HIPAA storage
                  </span>

                  {selectedFileName && (
                    <div className="mt-2 px-3 py-1 rounded-md bg-[#3d2060]/50 border border-[#c8a0f0]/30 text-[#c8a0f0] text-xs font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">attachment</span>
                      <span>{selectedFileName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Excuse Button */}
            <button
              id="btn_submit_excuse"
              type="submit"
              disabled={isSubmittingExcuse}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-[#c8a0f0] text-[#1a002e] hover:bg-[#e8d0ff] hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isSubmittingExcuse ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                  <span>Transmitting Docket...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  <span>Submit Formal Excuse Slip</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-[#a0b4c4] text-center">
              Submitted materials undergo automatic cryptographic hash logging for audit compliance.
            </p>
          </form>
        </div>
      </div>

      {/* Academic Course Attendance Summary Table */}
      <div className="glacier-card rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#1a3a4e]/70 text-[#88b4cc] border border-[#7dd3fc]/20">
                <span className="material-symbols-outlined text-xl">analytics</span>
              </div>
              <h2 className="text-lg font-bold text-[#e0e8f0]">
                Academic Course Attendance Summary
              </h2>
            </div>
            <p className="text-xs text-[#a0b4c4]">
              Minimum institutional requirement: <strong>80.0%</strong> attendance rate to qualify for regular course credit.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0a0e1a]/80 border border-[#7dd3fc]/10 px-4 py-2.5 rounded-xl self-start md:self-auto shadow-inner">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7dd3fc]"></span>
              <span className="text-xs text-[#a0b4c4]">≥90% Exemplary</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#88b4cc]"></span>
              <span className="text-xs text-[#a0b4c4]">80-89% Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]"></span>
              <span className="text-xs text-[#a0b4c4]">&lt;80% Critical</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="table_student_stats">
            <thead>
              <tr className="bg-[#202c42]/50 text-[11px] uppercase tracking-wider text-[#a0b4c4]">
                <th className="py-3 px-4 rounded-l-xl">Course</th>
                <th className="py-3 px-3 text-center">Total Sessions</th>
                <th className="py-3 px-3 text-center">Present</th>
                <th className="py-3 px-3 text-center">Late</th>
                <th className="py-3 px-3 text-center">Absent</th>
                <th className="py-3 px-3 text-center">Excused</th>
                <th className="py-3 px-4 w-48">Attendance Metric</th>
                <th className="py-3 px-4 rounded-r-xl text-right">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-transparent">
              {stats.map((row) => {
                const isCritical = row.attendancePercentage < 80.0;
                return (
                  <tr
                    key={row.code}
                    className={`hover:bg-[#1a2438]/40 transition-colors ${
                      isCritical ? 'bg-[#3d1414]/20' : ''
                    }`}
                  >
                    <td className="py-4 px-4 font-medium text-[#e0e8f0]">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#e0e8f0]">{row.code}</span>
                        <span className="text-xs text-[#a0b4c4]">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center font-mono text-[#e0e8f0]">{row.totalSessions}</td>
                    <td className="py-4 px-3 text-center font-mono text-[#7dd3fc] font-medium">{row.present}</td>
                    <td className="py-4 px-3 text-center font-mono text-[#88b4cc]">{row.late}</td>
                    <td className={`py-4 px-3 text-center font-mono ${isCritical ? 'text-[#ff6b6b] font-bold' : 'text-[#ff6b6b]'}`}>
                      {row.absent}
                    </td>
                    <td className="py-4 px-3 text-center font-mono text-[#c8a0f0]">{row.excused}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className={`font-bold ${isCritical ? 'text-[#ff6b6b]' : 'text-[#7dd3fc]'}`}>
                            {row.attendancePercentage}%
                          </span>
                          <span className="text-[10px] text-[#a0b4c4]">Req: 80%</span>
                        </div>
                        <div className="relative w-full h-2 rounded-full bg-[#0a0e1a] overflow-hidden">
                          <div
                            className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-[#4a6070] z-10"
                            title="80% Threshold"
                          ></div>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical ? 'bg-[#ff6b6b] shadow-[0_0_8px_#ff6b6b]' : 'bg-[#7dd3fc] shadow-[0_0_8px_#7dd3fc]'
                            }`}
                            style={{ width: `${Math.min(100, row.attendancePercentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/30">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          &lt;80% Warning Threshold
                        </span>
                      ) : row.attendancePercentage >= 95 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#7dd3fc]/20 text-[#7dd3fc] border border-[#7dd3fc]/30">
                          <span className="material-symbols-outlined text-sm">stars</span>
                          Exemplary
                        </span>
                      ) : row.attendancePercentage >= 90 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#7dd3fc]/15 text-[#7dd3fc] border border-[#7dd3fc]/30">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          Good Standing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#88b4cc]/15 text-[#88b4cc] border border-[#88b4cc]/30">
                          <span className="material-symbols-outlined text-sm">info</span>
                          Notice
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info & PDF Download */}
        <div className="mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#a0b4c4] bg-[#0a0e1a]/50 p-4 rounded-xl border border-[#7dd3fc]/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7dd3fc] text-base">privacy_tip</span>
            <span>All records recorded with ISO-8601 timestamps and distributed registrar ledgering.</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => alert('Downloading official PDF transcript for student ' + currentUser.fullName)}
              className="text-[#88b4cc] hover:text-[#e0e8f0] transition-colors flex items-center gap-1 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">download</span> Download PDF Audit Transcript
            </button>
            <span className="text-[#2a3a48]">|</span>
            <button
              onClick={() => alert('Institutional Attendance Policy: Minimum 80.0% attendance required to sit for the final semester examination.')}
              className="text-[#88b4cc] hover:text-[#e0e8f0] transition-colors flex items-center gap-1 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">help_outline</span> Attendance Policy FAQs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
