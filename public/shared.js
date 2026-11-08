/**
 * SAS Enterprise - Shared Data Model & State Controller
 * Multi-Page Application (MPA) Architecture
 */

const STORAGE_KEY = 'sas_enterprise_attendance_v2_en';

const DEFAULT_DATA = {
  currentUser: null, // Initially null when on login page
  courses: [
    'CS-301: Advanced Data Structures',
    'ENG-204: Technical Communication',
    'MATH-310: Linear Algebra',
    'PHY-102: Engineering Physics II'
  ],
  stats: [
    { code: 'CS-301', name: 'Advanced Data Structures', total: 28, present: 25, late: 2, absent: 1, excused: 0, pct: 92.8, status: 'Good Standing' },
    { code: 'ENG-204', name: 'Technical Communication', total: 16, present: 16, late: 0, absent: 0, excused: 0, pct: 100.0, status: 'Honor Compliance' },
    { code: 'MATH-310', name: 'Linear Algebra', total: 24, present: 20, late: 2, absent: 2, excused: 0, pct: 88.3, status: 'Good Standing' },
    { code: 'PHY-102', name: 'Engineering Physics II', total: 20, present: 18, late: 1, absent: 1, excused: 0, pct: 93.0, status: 'Good Standing' }
  ],
  session: {
    active: true,
    code: '849-210',
    course: 'CS-301',
    startTime: Date.now() - (6 * 60 * 1000), // 6 minutes ago
    remainingSeconds: 14 * 60 + 59
  },
  roster: [
    { id: '24091', name: 'Alex Rivera', time: '10:02 AM', method: 'PIN Input', status: 'Present', updatedBy: 'Self (QR)' },
    { id: '24092', name: 'Elena Rostova', time: '10:04 AM', method: 'PIN Input', status: 'Present', updatedBy: 'Self (QR)' },
    { id: '24093', name: 'Marcus Chen', time: '10:18 AM', method: 'PIN Input', status: 'Late', updatedBy: 'Self (QR)' },
    { id: '24094', name: 'Sarah Jenkins', time: '--', method: 'Pending', status: 'Absent', updatedBy: 'System Auto' },
    { id: '24108', name: 'David Kim', time: '--', method: 'Pending', status: 'Absent', updatedBy: 'System Auto' },
    { id: '24115', name: 'Taylor Scott', time: '10:01 AM', method: 'Manual Override', status: 'Present', updatedBy: 'Dr. Vance' }
  ],
  excuses: [
    { id: 1, studentId: '24094', studentName: 'Sarah Jenkins', course: 'CS-301', date: '2026-10-20', reason: 'Hospitalized for acute flu treatment', status: 'Pending' },
    { id: 2, studentId: '24108', studentName: 'David Kim', course: 'CS-301', date: '2026-10-18', reason: 'Transit bus breakdown on route 08', status: 'Approved' },
    { id: 3, studentId: '24091', studentName: 'Alex Rivera', course: 'MATH-310', date: '2026-10-12', reason: 'Represented university at ACM-ICPC contest', status: 'Approved' }
  ],
  warnings: [
    { studentId: '24094', name: 'Sarah Jenkins', course: 'CS-301', pct: 71.4, consecutiveAbsences: 3, risk: 'Critical', notes: 'Initial warning email dispatched' },
    { studentId: '24108', name: 'David Kim', course: 'CS-301', pct: 76.5, consecutiveAbsences: 2, risk: 'Warning', notes: 'In-person counseling scheduled' }
  ],
  counselingNotes: {
    '24094': [
      { date: '2026-10-21 14:30', advisor: 'Marcus Brody', text: 'Contacted student and guardian. Student committed to providing medical discharge paperwork and attending tutoring.' }
    ],
    '24108': [
      { date: '2026-10-19 11:00', advisor: 'Marcus Brody', text: 'Discussed transit issues and offered campus shuttle schedules.' }
    ]
  },
  users: [
    { id: 1001, email: 'a.rivera@university.edu', password: 'password123', name: 'Alex Rivera', role: 'Student', studentId: '24091', major: 'B.S. Software Engineering', year: 'Year 3', academicYear: 'Year 3', department: 'B.S. Software Engineering (Year 3)', status: 'Active' },
    { id: 1002, email: 'dr.vance@university.edu', password: 'password123', name: 'Dr. Evelyn Vance', role: 'Instructor', department: 'Faculty of Engineering', status: 'Active' },
    { id: 1003, email: 'm.brody@university.edu', password: 'password123', name: 'Marcus Brody', role: 'Advisor', department: 'Student Support Services', status: 'Active' },
    { id: 1004, email: 'sysadmin@university.edu', password: 'password123', name: 'Root Systems Admin', role: 'Administrator', department: 'Global Campus Administration', status: 'Active' },
    { id: 1005, email: 'sarah.jenkins@student.univ.edu', password: 'password123', name: 'Sarah Jenkins', role: 'Student', studentId: '24094', major: 'B.S. Computer Science', year: 'Year 2', academicYear: 'Year 2', department: 'B.S. Computer Science (Year 2)', status: 'Flagged (EWS)' },
    { id: 1006, email: 'david.kim@student.univ.edu', password: 'password123', name: 'David Kim', role: 'Student', studentId: '24108', major: 'B.S. Computer Engineering', year: 'Year 2', academicYear: 'Year 2', department: 'B.Eng. Computer Engineering (Year 2)', status: 'Flagged (EWS)' }
  ],
  enrollments: [
    { id: 1, userId: 1001, studentName: 'Alex Rivera', course: 'CS-301: Advanced Data Structures', term: 'Fall 2026' },
    { id: 2, userId: 1001, studentName: 'Alex Rivera', course: 'ENG-204: Technical Communication', term: 'Fall 2026' },
    { id: 3, userId: 1001, studentName: 'Alex Rivera', course: 'MATH-310: Linear Algebra', term: 'Fall 2026' },
    { id: 4, userId: 1001, studentName: 'Alex Rivera', course: 'PHY-102: Engineering Physics II', term: 'Fall 2026' },
    { id: 5, userId: 1005, studentName: 'Sarah Jenkins', course: 'CS-301: Advanced Data Structures', term: 'Fall 2026' },
    { id: 6, userId: 1006, studentName: 'David Kim', course: 'CS-301: Advanced Data Structures', term: 'Fall 2026' },
    { id: 7, userId: 1005, studentName: 'Sarah Jenkins', course: 'MATH-310: Linear Algebra', term: 'Fall 2026' }
  ],
  auditLogs: [
    { time: '2026-10-22 10:18:22', user: 'Marcus Chen', action: 'Direct PIN Check-in', details: 'Status: Late (18 mins into session)' },
    { time: '2026-10-22 10:04:15', user: 'Elena Rostova', action: 'Direct PIN Check-in', details: 'Status: Present (4 mins into session)' },
    { time: '2026-10-22 10:02:01', user: 'Alex Rivera', action: 'Direct PIN Check-in', details: 'Status: Present (2 mins into session)' },
    { time: '2026-10-22 10:00:00', user: 'Dr. Evelyn Vance', action: 'Start Attendance Session', details: 'Code: 849-210, Course: CS-301' }
  ]
};

// Initialize or load state
function getAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    const data = JSON.parse(raw);
    // Guarantee required fields exist
    if (!data.users || data.users.length === 0) data.users = DEFAULT_DATA.users;
    if (!data.courses) data.courses = DEFAULT_DATA.courses;
    if (!data.stats) data.stats = DEFAULT_DATA.stats;
    if (!data.session) data.session = DEFAULT_DATA.session;
    if (!data.roster) data.roster = DEFAULT_DATA.roster;
    if (!data.excuses) data.excuses = DEFAULT_DATA.excuses;
    if (!data.warnings) data.warnings = DEFAULT_DATA.warnings;
    if (!data.counselingNotes) data.counselingNotes = DEFAULT_DATA.counselingNotes;
    if (!data.enrollments) data.enrollments = DEFAULT_DATA.enrollments;
    if (!data.auditLogs) data.auditLogs = DEFAULT_DATA.auditLogs;
    data.users.forEach(u => {
      if (!u.password) u.password = 'password123';
    });
    return data;
  } catch (err) {
    console.error('Failed to parse appData from localStorage:', err);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveAppData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save appData to localStorage:', err);
  }
}

// Global Toast Notification (English only)
function showToast(message, type = 'success') {
  let container = document.getElementById('toast_container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast_container';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const borderCol = type === 'error' ? 'border-rose-500/50 bg-rose-950/90 text-rose-200' :
                    type === 'warning' ? 'border-amber-500/50 bg-amber-950/90 text-amber-200' :
                    'border-emerald-500/50 bg-[#0f172a]/95 text-emerald-200';
  const iconName = type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'check_circle';

  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border ${borderCol} shadow-2xl backdrop-blur-md text-xs font-medium transition-all duration-300 transform translate-y-3 opacity-0`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-base shrink-0">${iconName}</span>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global Sign Out handler
function handleLogout() {
  const data = getAppData();
  const userName = data.currentUser ? (data.currentUser.name || data.currentUser.fullName || 'User') : 'User';
  
  if (data.currentUser) {
    if (!data.auditLogs) data.auditLogs = [];
    data.auditLogs.unshift({
      time: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: userName,
      action: 'User Sign-Out',
      details: 'Session terminated by user action'
    });
    data.currentUser = null;
    saveAppData(data);
  }

  showToast('Signed out of the system successfully.');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 400);
}

// Role Guard for Individual HTML Pages
function enforceRoleGuard(expectedRole, pageTitle) {
  const data = getAppData();
  const user = data.currentUser;

  if (!user) {
    // If not logged in, redirect to login page
    window.location.href = 'index.html';
    return false;
  }

  if (user.role !== expectedRole) {
    // Role mismatch
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md';
    modal.innerHTML = `
      <div class="glass-card-glow rounded-2xl p-6 max-w-md w-full space-y-4 border border-rose-500/30 text-center">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <span class="material-symbols-outlined text-2xl">shield_lock</span>
        </div>
        <h3 class="text-lg font-bold text-white">Access Restricted</h3>
        <p class="text-xs text-[#a0b4c4]">
          Your account role (<b class="text-white">${user.role}</b>) is not authorized to access the <b>${pageTitle}</b>.
        </p>
        <div class="pt-2 flex items-center justify-center gap-3">
          <button onclick="handleLogout()" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all">
            Switch Account
          </button>
          <button onclick="navigateToRolePage('${user.role}')" class="px-4 py-2 rounded-xl bg-[#0e4d6e] hover:bg-[#15628c] text-[#7dd3fc] text-xs font-semibold transition-all">
            Go to My Portal
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return false;
  }

  return true;
}

function navigateToRolePage(role) {
  if (role === 'Student') window.location.href = 'student.html';
  else if (role === 'Instructor') window.location.href = 'instructor.html';
  else if (role === 'Advisor') window.location.href = 'advisor.html';
  else if (role === 'Administrator') window.location.href = 'admin.html';
  else window.location.href = 'index.html';
}

function downloadCSV(content, filename) {
  const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
