/**
 * SAS Enterprise - Shared Data Model, Python OOP REST Client & Real-Time Controller
 * Multi-Page Application (MPA) Architecture
 */

const STORAGE_KEY = 'sas_enterprise_attendance_v2_en';
let serverTimeOffsetMs = 0;

const DEFAULT_DATA = {
  currentUser: null,
  courses: [
    'CS-301: Advanced Data Structures (Hall B-12)',
    'ENG-204: Technical Communication (Hall A-08)',
    'MATH-310: Linear Algebra (Hall C-14)',
    'PHY-102: Engineering Physics II (Science Lab 102)',
    'CS-402: Cloud Architecture & DevOps (Lab 201)'
  ],
  courseCatalog: [
    { id: 1, code: 'CS-301', title: 'Advanced Data Structures', room: 'Hall B-12', displayLabel: 'CS-301: Advanced Data Structures (Hall B-12)' },
    { id: 2, code: 'ENG-204', title: 'Technical Communication', room: 'Hall A-08', displayLabel: 'ENG-204: Technical Communication (Hall A-08)' },
    { id: 3, code: 'MATH-310', title: 'Linear Algebra', room: 'Hall C-14', displayLabel: 'MATH-310: Linear Algebra (Hall C-14)' },
    { id: 4, code: 'PHY-102', title: 'Engineering Physics II', room: 'Science Lab 102', displayLabel: 'PHY-102: Engineering Physics II (Science Lab 102)' },
    { id: 5, code: 'CS-402', title: 'Cloud Architecture & DevOps', room: 'Lab 201', displayLabel: 'CS-402: Cloud Architecture & DevOps (Lab 201)' }
  ],
  stats: [],
  session: {
    active: false,
    code: '---',
    course: 'CS-301',
    courseName: 'CS-301: Advanced Data Structures',
    startTime: Date.now(),
    remainingSeconds: 0
  },
  roster: [],
  excuses: [],
  warnings: [],
  counselingNotes: {},
  users: [],
  enrollments: [],
  auditLogs: [],
  bugs: []
};

function isHttpMode() {
  return typeof window !== 'undefined' && (window.location.protocol === 'http:' || window.location.protocol === 'https:');
}

function getLiveUtcDate() {
  return new Date(Date.now() + serverTimeOffsetMs);
}

function getLiveUtcTimestamp() {
  return getLiveUtcDate().toISOString().replace('T', ' ').slice(0, 19);
}

function startRealtimeClockUpdater(elementId) {
  const update = () => {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerText = `${getLiveUtcTimestamp()} UTC`;
    }
  };
  update();
  return setInterval(update, 1000);
}

function getAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const clone = JSON.parse(JSON.stringify(DEFAULT_DATA));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
      return clone;
    }
    const data = JSON.parse(raw);
    if (!data.courses) data.courses = DEFAULT_DATA.courses;
    if (!data.courseCatalog) data.courseCatalog = DEFAULT_DATA.courseCatalog;
    if (!data.stats) data.stats = [];
    if (!data.session) data.session = DEFAULT_DATA.session;
    if (!data.roster) data.roster = [];
    if (!data.excuses) data.excuses = [];
    if (!data.warnings) data.warnings = [];
    if (!data.counselingNotes) data.counselingNotes = {};
    if (!data.enrollments) data.enrollments = [];
    if (!data.auditLogs) data.auditLogs = [];
    if (!data.users) data.users = [];
    if (!data.bugs) data.bugs = [];
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

function mergeServerState(serverState, preserveUser = null) {
  const local = getAppData();
  const activeUser = preserveUser || local.currentUser || serverState.currentUser || null;
  if (serverState.serverTimeMs) {
    serverTimeOffsetMs = serverState.serverTimeMs - Date.now();
  }

  // Refresh activeUser fields from fresh SQLite users list if logged in
  let mergedUser = activeUser;
  if (activeUser && Array.isArray(serverState.users)) {
    const freshMatch = serverState.users.find(
      u => u.id === activeUser.id || (u.email && activeUser.email && u.email.toLowerCase() === activeUser.email.toLowerCase())
    );
    if (freshMatch) {
      mergedUser = freshMatch;
    }
  }

  const merged = {
    ...local,
    ...serverState,
    currentUser: mergedUser
  };
  saveAppData(merged);
  return merged;
}

async function apiRequest(endpoint, options = {}) {
  if (!isHttpMode()) {
    throw new Error('HTTP API unavailable in local file:// mode');
  }
  const fetchOpts = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
  if (options.body !== undefined) {
    fetchOpts.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(endpoint, fetchOpts);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.ok === false) {
    throw new Error(payload.error || payload.message || `API Error (${res.status})`);
  }
  if (payload.state) {
    mergeServerState(payload.state);
  }
  return payload;
}

async function syncAppDataFromServer(optionalUserId = null) {
  const local = getAppData();
  const uid = optionalUserId || (local.currentUser && local.currentUser.id) || '';
  if (!isHttpMode()) return local;

  try {
    const url = uid ? `/api/state?userId=${encodeURIComponent(uid)}` : '/api/state';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return local;
    const state = await res.json();
    return mergeServerState(state);
  } catch (err) {
    console.warn('Server sync skipped:', err.message);
    return local;
  }
}

async function addCourseForInstructor(instructorId, courseCode, courseTitle, room = 'Hall B-12') {
  const cleanCode = (courseCode || '').trim().toUpperCase();
  let cleanTitle = (courseTitle || '').trim();
  if (cleanTitle.includes(':')) {
    cleanTitle = cleanTitle.split(':').slice(1).join(':').trim();
  }

  if (isHttpMode()) {
    const resp = await apiRequest('/api/instructor/courses', {
      method: 'POST',
      body: { instructorId, code: cleanCode, title: cleanTitle, room }
    });
    return resp.state ? mergeServerState(resp.state) : getAppData();
  }

  const data = getAppData();
  const fullLabel = `${cleanCode}: ${cleanTitle || cleanCode}`;
  if (!data.courses.some(c => c.startsWith(cleanCode))) {
    data.courses.push(fullLabel);
  }
  const inst = data.users.find(u => String(u.id) === String(instructorId));
  if (inst) {
    if (!inst.courses) inst.courses = [];
    if (!inst.courses.includes(cleanCode)) inst.courses.push(cleanCode);
  }
  saveAppData(data);
  return data;
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

// Global Sign Out handler backed by Python audit trail
async function handleLogout() {
  const data = getAppData();
  const user = data.currentUser;
  const userName = user ? (user.name || user.fullName || 'User') : 'User';

  if (user && isHttpMode()) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userName })
      });
    } catch (_) {}
  }

  data.currentUser = null;
  saveAppData(data);

  showToast('Signed out of the system successfully.');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 300);
}

// Role Guard for Individual HTML Pages
function enforceRoleGuard(expectedRole, pageTitle) {
  const data = getAppData();
  const user = data.currentUser;

  if (!user) {
    window.location.href = 'index.html';
    return false;
  }

  if (user.role !== expectedRole) {
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
