# Instructor Course Allocation & Student Live Attendance Synchronization

A comprehensive architectural plan to introduce instructor course assignment across the Administration Console and Instructor Workspace, paired with real-time active attendance session broadcast and one-click check-in on the Student Portal.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1 interactive clarification:
> - **Instructor Course Management Locations**: Enabled in both **Admin user provisioning** (assigning initial courses when creating or editing an Instructor) and **Instructor Workspace** (allowing instructors to create, add, or switch courses directly).
> - **Student Active Attendance Notification**: Rendered as a **prominent live broadcast banner** with glowing pulse indicator, active course name/code, session countdown timer, and a one-click button that auto-fills the check-in form.
> - **Course Input Method**: Dual-mode input enabling instructors and admins to either **select from existing catalog courses** or **type custom course codes freely** (with auto-suggested examples).

---

### 1. Overview & Core Concept

- **What It Does**: 
  1. Equips Administrators with an **Instructor Teaching Dossier** in the user creation form to allocate courses to instructors from a catalog or via custom input.
  2. Empowers Instructors in their workspace to create new courses, assign them to their profile, and initiate live attendance sessions for any of their assigned courses.
  3. Automatically broadcasts any live session initiated by an instructor to all active Student tabs via `localStorage` state events and real-time polling, displaying an urgent, clickable check-in banner on the student dashboard.
- **Target Audience / Persona**:
  - **Instructors / Faculty**: Need flexibility to add courses they teach and conduct attendance without admin bottlenecks.
  - **Students**: Need immediate visibility when an attendance session goes live in class so they can check in with 1 click without typing mistakes.
  - **Administrators**: Need full visibility and governance over instructor teaching assignments.
- **Key Value**: Eliminates manual session code coordination in lecture halls, speeds up student check-in, and provides full course lifecycle management for instructors.

---

### 2. User Experience & Visual Design

#### Key User Flows

```
[Admin Console: Provision User]
      │
      ├── Select Role = "Instructor"
      │         │
      │         ▼
      │   Renders "Instructor Teaching Dossier"
      │   - Multi-course tag builder (Pick from CS-301, CS-402, ENG-204, or type custom)
      │   - Department / Faculty selector
      │         │
      │         ▼
      └── Click "Add User Account" ──► User stored with assigned course array

[Instructor Workspace]
      │
      ├── View Assigned Courses dropdown (CS-301, CS-402, + new courses)
      ├── Click "+ Add / Create Course" modal button
      │         │
      │         ▼
      │   Modal: Course Code (e.g. CS-505), Course Name, Lecture Room
      │   Saves into Instructor's active course roster
      │         │
      │         ▼
      └── Click "Start New Session" (CS-301, PIN: 849-210, 15:00 countdown)
                │
                ▼
       Saves active session to shared state & fires cross-tab storage event

[Student Portal]
      │
      ├── Student opens or is already viewing student.html
      │         │
      │         ▼ (Real-time storage listener & 1s interval check)
      ├── Top Banner Appears:
      │   "🔴 LIVE ATTENDANCE SESSION IN PROGRESS: CS-301 - Advanced Data Structures"
      │   [Remaining Time: 14:45] [PIN Required]
      │         │
      │         ▼
      └── Student clicks "Check In Now" (Action Button)
                │
                ▼
          Auto-scrolls & focuses PIN input field with course pre-selected
          Student types PIN -> Instant Check-In Verified!
```

#### Visual Identity & Theme
- **Theme Consistency**: Maintains the Dark Glacier palette (`#0a0e1a` base, `#141c2e` surface, `#7dd3fc` cyan primary, `#10b981` emerald success, `#ef4444` live red alert).
- **Live Attendance Broadcast Banner on Student Portal**:
  - Border: Animated red/emerald pulse with glow (`border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-[#141c2e] to-rose-950/40`).
  - Left Icon: Blinking radar/broadcast icon (`sensors` or `radio_button_checked`).
  - Action Button: High-contrast button `"⚡ Check In to CS-301"` triggering automatic course selection and input focus.
- **Instructor Course Management UI**:
  - In Admin: Integrated expandable dossier card similar to the Student Dossier.
  - In Instructor Portal: "+ New Course" button next to `combo_instructor_courses` opening a sleek modal with instant feedback.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Real-time Multi-Page Communication Strategy**:
  - *Chosen Approach*: Use `window.addEventListener('storage', ...)` combined with a lightweight 1-second polling timer against `getAppData().session`.
  - *Why*: In a Multi-Page Application (MPA) running on separate tabs/windows (`student.html` and `instructor.html`), the `storage` event fires natively across tabs when `localStorage` updates, ensuring zero-latency updates without requiring a complex WebSocket server.
  - *Alternatives Considered*: Polling only (too sluggish, 3-5s lag) or WebSockets (requires custom Node backend websocket infrastructure which breaks static HTML resilience).
- **Decision 2: Course Assignment Data Schema**:
  - *Chosen Approach*: Store courses as an array of strings/objects `courses: ['CS-301', 'CS-402', ...]` on the User model, while keeping a global `courses` registry in `shared.js`.
  - *Why*: Allows instructors to teach multiple courses and allows students to be enrolled in multiple courses cleanly without schema migration overhead.

---

### 4. Technical Architecture & Data Strategy

#### Component & State Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Shared State Layer (shared.js / localStorage)        │
│  - users: User[] (with courses: string[])                              │
│  - courses: Course[] (global catalog)                                  │
│  - session: { active: boolean, code: string, course: string, ... }     │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
               ▼                                          ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│       admin.html              │        │      instructor.html          │
│ - Provision User Form         │        │ - Course selector dropdown    │
│   ├── If Role == "Instructor":│        │ - "+ Add Course" Modal        │
│   │   Show "Instructor Course │        │ - Start/End Live Session      │
│   │   Allocation Dossier"     │        │ - Broadcast PIN & Countdown   │
│   └── Multi-select / custom   │        └──────────────┬────────────────┘
│ - Edit User Modal (courses)   │                       │ (Writes session)
└───────────────────────────────┘                       ▼
                                         ┌───────────────────────────────┐
                                         │        student.html           │
                                         │ - Real-time Session Listener  │
                                         │ - Top Broadcast Alert Banner  │
                                         │ - 1-Click Auto-Fill & Check-In│
                                         └───────────────────────────────┘
```

#### Detailed File Updates Planned

1. **`shared.js` & `public/shared.js`**:
   - Add helper functions: `addInstructorCourse(instructorId, courseCode, courseName)`, `getActiveSession()`, `updateActiveSession(sessionData)`.
   - Update default instructors with course arrays.
2. **`admin.html` & `public/admin.html`**:
   - Add `group_instructor_add_fields` in the user creation form (shown when `combo_add_role === 'Instructor'`).
   - Allow selecting from course catalog checkboxes / chips plus custom course code & title input.
   - Update `handleAdminAddUser()` to persist `courses` array on the newly created instructor.
   - Update `openEditUserModal()` to allow editing assigned courses for instructors.
3. **`instructor.html` & `public/instructor.html`**:
   - Populate `combo_instructor_courses` dynamically based on the logged-in instructor's assigned courses.
   - Add a `+ Add Course` button beside the course selector with a clean modal dialog to register new courses on the fly.
   - Ensure `handleStartSession()` writes the selected course to `shared.js` active session.
4. **`student.html` & `public/student.html`**:
   - Add a dynamic `#banner_live_attendance_alert` container right above the main student dashboard.
   - Attach a `storage` listener and timer in `student.html` that checks `data.session.active`:
     - If active: shows banner with course name, code, elapsed/remaining time, and "⚡ Check In Now" button.
     - Clicking "Check In Now" sets `combo_student_course` to the active course and focuses `txt_student_pin`.
     - If inactive: smoothly hides the banner.
5. **React Components (`Screen4Admin.tsx`, `Screen2Instructor.tsx`, `Screen1Student.tsx`, `App.tsx`)**:
   - Maintain 100% parity across the React application suite with equivalent props, states, and banner rendering.

---
