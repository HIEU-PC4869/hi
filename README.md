# SAS ENTERPRISE - STUDENT ATTENDANCE & INTELLIGENCE SYSTEM
## SYSTEM SPECIFICATION: ARCHITECTURE, DATA MODELS & SOFTWARE DESIGN
*Academic and Engineering Specification based on Software Engineering (Chapter 3: System Design & Architecture)*

---

## TABLE OF CONTENTS
1. [I. System Requirements Specification](#i-system-requirements-specification)
   - [1. Functional Requirements (FR)](#1-functional-requirements-fr)
   - [2. Non-Functional Requirements (NFR)](#2-non-functional-requirements-nfr)
2. [II. Software Architecture & Design Patterns](#ii-software-architecture--design-patterns)
   - [1. Architectural Pattern: Model - View - Controller (MVC)](#1-architectural-pattern-model---view---controller-mvc)
   - [2. Layered Architecture Model](#2-layered-architecture-model)
   - [3. Client - Server Model](#3-client---server-model)
   - [4. Component Design Patterns](#4-component-design-patterns)
3. [III. Relational Database Design & Data Models](#iii-relational-database-design--data-models)
   - [1. Three Database Design Levels](#1-three-database-design-levels)
   - [2. Class Diagram to Relational Schema Mapping Rules](#2-class-diagram-to-relational-schema-mapping-rules)
   - [3. Normalized Database Schema (8 Entities)](#3-normalized-database-schema-8-entities)
4. [IV. User Interface Design & Front-End Architecture](#iv-user-interface-design--front-end-architecture)
   - [1. Design Philosophy: Glacier Dark Glassmorphism](#1-design-philosophy-glacier-dark-glassmorphism)
   - [2. Role-Based Access Control (RBAC) Screen Modules](#2-role-based-access-control-rbac-screen-modules)
   - [3. Dual-Platform Implementation: Web HTML5 + Desktop PySide6 Qt](#3-dual-platform-implementation-web-html5--desktop-pyside6-qt)

---

## I. SYSTEM REQUIREMENTS SPECIFICATION

### 1. Functional Requirements (FR)

The SAS Enterprise system automates institutional attendance tracking, compliance monitoring, and early academic interventions across university departments. The system provides five core functional domains:

#### FR1: Authentication & Role-Based Access Control (RBAC)
* **FR1.1**: Provides secure user authentication using institutional email addresses (`@university.edu`) and salted one-way password hashing (SHA-256).
* **FR1.2**: Enforces strict Role-Based Access Control across four distinct user groups:
  * **Student**: View enrolled course schedules, perform live check-in during active sessions, monitor personal attendance percentage, and submit absence excuse petitions.
  * **Instructor**: Open and manage live attendance sessions, view real-time class rosters, execute manual status overrides, approve/reject absence excuses, and export course audit records to CSV.
  * **Academic Advisor**: Monitor at-risk students flagged by the automated Early Warning System (EWS), record counseling dossiers, and manage intervention action plans.
  * **System Administrator**: Full lifecycle governance (CRUD Master Users: create, edit profile, safe delete), course catalog management, student enrollment allocation, and institutional tamper-evident audit logging.
* **FR1.3**: Automatically detects user identity upon authentication and navigates directly to the designated dashboard, supported by one-click instant demo role switching.

#### FR2: Student Attendance & Compliance Portal (Student Portal)
* **FR2.1**: Enables students to submit an active 6-digit session PIN provided in real time by the course instructor.
* **FR2.2**: Enforces automated Timing Windows based on check-in arrival timestamp:
  * Check-in **under 15 minutes** from session opening: Recorded as **`Present`**.
  * Check-in between **15 and 45 minutes**: Recorded as **`Late`** (partial credit).
  * Check-in after **45 minutes** or after session expiration: Recorded as **`Absent`**.
* **FR2.3**: Automatically calculates cumulative attendance compliance percentages per course:
  $$\text{Attendance Rate (\%)} = \frac{\text{Present Count} + (\text{Late Count} \times 0.8)}{\text{Total Scheduled Sessions Held}} \times 100\%$$
* **FR2.4**: Automatically evaluates institutional compliance thresholds:
  * $\ge 90.0\%$: `Good Standing` (Exemplary Standing).
  * $80.0\% - 89.9\%$: `Notice` (Academic Notice).
  * $< 80.0\%$: `Warning Threshold` (Critical Academic Risk; ineligibility for final exam credit).
* **FR2.5**: Allows students to submit formal absence excuse slips (Excuse Petitions) detailing course code, absence date, and justification reason (default initial status: `Pending`).

#### FR3: Instructor Live Command Center (Instructor Module)
* **FR3.1**: Instructors select an assigned course and initiate live attendance sessions (`Live Session`). The system generates an ephemeral random 6-digit PIN (`XXX-XXX`) and activates a synchronized 15-minute countdown timer.
* **FR3.2**: Renders a live class roster displaying real-time check-in timestamps and verification methods (`PIN Input`, `QR Scan`, `Manual Override`).
* **FR3.3 (Manual Status Override)**: Equips instructors with in-table status modification dropdowns (`setCellWidget`), allowing immediate status overrides (`Present`, `Late`, `Absent`, `Excused`). All manual modifications permanently log the instructor's ID (`updated_by`).
* **FR3.4**: Review pending student excuse petitions (`Approve` or `Reject`). Approving an excuse automatically updates the corresponding session record to `Excused` and recalculates student standing.
* **FR3.5**: Exports complete course attendance records to standardized comma-separated values (CSV) format for departmental archival.

#### FR4: Academic Advisor Early Warning System (EWS Module)
* **FR4.1**: Automatically scans and filters students requiring academic intervention based on two rigorous algorithmic criteria:
  * Overall attendance rate **strictly below 80.0%**, OR:
  * **Three or more consecutive absences ($\ge 3$)** across any enrolled course.
* **FR4.2**: Categorizes flagged students into risk severity tiers: `CRITICAL` (consecutive absences $\ge 3$ or attendance $< 70\%$) and `WARNING` (attendance between $70\%$ and $79.9\%$).
* **FR4.3**: Displays selected student academic dossiers, provides a counseling intervention editor (Counseling Notes), logs action plans, and preserves an immutable chronological counseling history.

#### FR5: Administrator Governance & System Audit Console (Admin Module)
* **FR5.1 (CRUD Master Users)**: Provision new accounts across all four roles and render the institutional directory table with ID, full name, email, role, status, and action controls.
* **FR5.2 (Edit & Delete Account Governance)**: Features an integrated user editing and deletion workspace (`grp_edit_user`). Updates name, email, role, and status, and provides cascading deletion with explicit confirmation dialogs (`QMessageBox.question`).
* **FR5.3 (Curriculum & Enrollment Management)**: Registers new courses into the academic catalog (`Courses` entity) and provisions student course enrollments (`Enrollments` $n-n$ relation).
* **FR5.4 (Tamper-Evident Audit Logging)**: Records an immutable security audit trail (`Audit_Logs`) capturing timestamps, principal user IDs, action names, and contextual operational details.
* **FR5.5**: Exports institutional-wide attendance and compliance audit logs to CSV.

---

### 2. Non-Functional Requirements (NFR)

| Quality Attribute | Engineering Specification |
| :--- | :--- |
| **NFR1: Performance** | - Check-in submissions, authentication verification, and student record retrieval execute with latency $< 200\text{ ms}$.<br/>- The Early Warning System (EWS) heuristic query evaluates instantly on SQLite without blocking the UI thread. |
| **NFR2: Security** | - User passwords are encrypted using one-way SHA-256 cryptographic hashing with salt.<br/>- **100% of database queries** employ parameterized prepared statements (`?` placeholders), completely mitigating SQL Injection (SQLi) risks.<br/>- Multi-tier role authorization checks prevent Privilege Escalation attacks. |
| **NFR3: Data Integrity & ACID** | - Enforces foreign key constraints at runtime via `PRAGMA foreign_keys = ON;`.<br/>- Composite uniqueness constraint: `UNIQUE(session_id, student_id)` guarantees one official attendance record per student per session.<br/>- Strict domain constraints: `CHECK` constraints on all enumerated values (`status`, `role`, `is_active`).<br/>- Full ACID transaction guarantees via Python Context Managers (`with DBConnection():`). |
| **NFR4: Reliability & Maintainability** | - Achieves **High Cohesion** and **Loose Coupling** across modules.<br/>- Strict separation of concerns between presentation, business rules, and storage enables automated unit testing (`test_logic.py`). |
| **NFR5: Portability & Interoperability** | - Provides dual-platform execution: Zero-dependency web runtime via `index.html` and desktop native GUI via PySide6 (`main_app.ui` + `main.py`).<br/>- Operates identically across Windows, macOS, and Linux environments. |

---

## II. SOFTWARE ARCHITECTURE & DESIGN PATTERNS
*(Strictly compliant with Chapter 3: System Design & Architecture)*

### 1. Architectural Pattern: Model - View - Controller (MVC)
*(Referenced from Chapter 3 Slides 17, 18, 19)*

As defined in Slide 17: *"Separate display and interaction of system data. The system is structured into three logical components that interact with each other."* SAS Enterprise implements clean MVC separation:

```
      +-------------------------------------------------------------------+
      |                            USER / ACTOR                           |
      +-------------------------------------------------------------------+
                       |                                     ^
                       | (User Input / Events)               | (Rendered UI)
                       v                                     |
      +----------------------------------+     Notify        |
      |            CONTROLLER            | ----------------> |
      | (logic.py - AttendanceLogic &    |                   |
      |  main.py - Event Handlers)       |                   |
      +----------------------------------+                   |
               |                  ^                          |
       Updates |                  | Queries Data             |
               v                  |                          |
      +----------------------------------+          +--------------------+
      |              MODEL               | -------> |        VIEW        |
      | (database.py, attendance.db &    |   Data   | (index.html &      |
      |  Parameterized Queries)          |          |  main_app.ui)      |
      +----------------------------------+          +--------------------+
```

* **Model (`database.py` & `attendance.db`)** *(Slide 17: "The Model component manages system data and the operations associated with that data.")*:
  * Encapsulates the 8 relational entities, database connection lifecycles, and referential integrity constraints.
  * Exposes pure database CRUD (Create, Read, Update, Delete) operations independent of any graphical presentation.
* **View (`index.html` & `main_app.ui`)** *(Slide 17: "The View component defines and manages how data is presented to the user.")*:
  * Defines and manages visual presentation across five role-specific screens.
  * Contains zero direct SQL statements; receives user actions (clicks, inputs, selections) and delegates them to the Controller using primitive data coupling (JSON / tuples).
* **Controller (`logic.py` - `AttendanceLogic` class & `main.py` handlers)** *(Slide 17: "The Controller component manages user interactions and passes these interactions to the View and Model respectively.")*:
  * Handles UI events, executes business validation (verifying 6-digit PINs, evaluating 15/45-minute timing windows, executing EWS risk scoring, and hashing passwords).
  * Directs the Model to persist state updates and delivers formatted presentation structures back to the View.

* **Quality Criteria Evaluation (Slides 11–13, 19)**:
  * **High Cohesion (Slide 13)**: Each layer has a single, well-defined responsibility (Model manages persistence, Controller enforces business rules, View handles display).
  * **Loose Coupling (Slide 12)**: View and Model do not have direct dependencies; the presentation layer can be completely redesigned without altering business rules or database schemas.
  * **Key Benefits (Slide 19)**: Enables concurrent front-end and back-end development, enhances maintainability, and simplifies testability.

---

### 2. Layered Architecture Model
*(Referenced from Chapter 3 Slides 25, 26, 27)*

The system organizes functionality into four distinct horizontal layers:

1. **Presentation Layer (Slide 26)**:
   * Realized via `index.html` (Web) and `main_app.ui` (Qt Designer).
   * Manages forms, navigation menus, data tables, modal dialogs, and initial client-side form validation.
2. **Business Logic Layer (Slide 26)**:
   * Realized via `logic.py` (`AttendanceLogic` class).
   * Enforces role authorization, timing window calculations, EWS threshold detection, PIN expiration, and report synthesis.
3. **Persistence / Data Access Layer (Slide 25)**:
   * Realized via `database.py` utilizing the Data Access Object (DAO) pattern.
   * Manages database connection pooling, cursor contexts, and parameterized prepared queries.
4. **Database Layer (Slide 25)**:
   * Relational storage engine SQLite3 (`attendance.db`), enforcing foreign key constraints (`PRAGMA foreign_keys = ON;`) and ACID transaction semantics.

---

### 3. Client - Server Model
*(Referenced from Chapter 3 Slides 23, 24)*

The application maintains strict physical or logical separation between client and server:
* **Client (Web Browser / Native GUI)**: Renders the interface, captures user gestures, and provides immediate visual feedback.
* **Server (`server.py`)**: Lightweight Python HTTP and application service that routes API requests, interfaces with the database, and serves application assets.

---

### 4. Component Design Patterns

* **Data Access Object (DAO) / Repository Pattern**:
  * Centralizes all SQL statements inside `database.py` and `logic.py` (`get_all_users()`, `update_user()`, `get_early_warning_students()`), preventing raw SQL leakage into UI controllers.
* **Observer / Event-Driven Pattern**:
  * Implemented across platforms: Signal-slot mechanisms in Qt (`clicked.connect`, `itemSelectionChanged.connect`) and DOM event listeners in JavaScript (`addEventListener`, `onsubmit`, `onchange`).
* **Context Manager Pattern (Python Resource Management)**:
  * Implemented via the `DBConnection` class (`__enter__` and `__exit__`). Automatically commits transactions on success, rolls back on exceptions, and closes database connections deterministically.

---

## III. RELATIONAL DATABASE DESIGN & DATA MODELS
*(Strictly compliant with Chapter 3: Slides 28–42)*

### 1. Three Database Design Levels
*(Referenced from Chapter 3 Slides 29, 30)*

* **Conceptual Level (Slide 29)**: Represented via Entity-Relationship Diagrams (ERD) and Class Diagrams modeling 8 core domain entities: `User` (with subclasses `Student`, `Instructor`, `Advisor`, `Administrator`), `Course`, `Enrollment`, `Session`, `Attendance`, `Excuse`, `CounselingNote`, and `AuditLog`.
* **Logical Level (Slide 29)**: Normalized into 8 relational schemas in Third Normal Form (3NF), identifying Primary Keys (PK), Foreign Keys (FK), Unique constraints (UNIQUE), and domain rules (CHECK).
* **Physical Level (Slide 29)**: Implemented on the SQLite3 database file `attendance.db` with binary B-tree indexing, foreign key cascade rules, and ACID transaction safety.

---

### 2. Class Diagram to Relational Schema Mapping Rules
*(Referenced from Chapter 3 Slides 31–42)*

#### Rule 1: Class $\rightarrow$ Table & Property $\rightarrow$ Column (Slide 31)
Each entity class maps to a relational table; each class attribute maps to a table column; each concrete instance maps to a tuple (row).

#### Rule 2: Inheritance Mapping via Single Table Inheritance (Slides 39–42)
* Applied the **Single Table Inheritance** pattern (merging the superclass and all subclasses into a single table with a discriminator column—analogous to the `Loai_NV` pattern in Slides 41–42):
* The superclass `User` and its subclasses (`Student`, `Instructor`, `Advisor`, `Administrator`) are mapped into a single `Users` table.
* The `role` column serves as the discriminator attribute, bounded by a strict domain constraint:
  `role TEXT NOT NULL CHECK(role IN ('Student', 'Instructor', 'Advisor', 'Administrator'))`.
* **Rationale (Slide 41)**: Eliminates costly multi-table JOIN operations, significantly accelerating authentication and role verification queries.

#### Rule 3: Many-to-Many Relationship Mapping (Slides 37–38)
* The relationship between `Users` (Students) and `Courses` is Many-to-Many ($n-n$): A student enrolls in multiple courses, and a course contains multiple students.
* Following Slide 38, this relation is resolved into an intermediate associative table: `Enrollments (id PK, user_id FK, course_id FK, semester)`.

---

### 3. Normalized Database Schema (8 Entities)

```
       +-----------------------+              +-----------------------+
       |         Users         | <----------- |      Enrollments      |
       |-----------------------| 1          n |-----------------------|
       | id (PK)               |              | id (PK)               |
       | email (UNIQUE)        |              | user_id (FK)          |
       | password_hash         |              | course_id (FK)        |
       | full_name             |              | semester              |
       | role (CHECK)          |              +-----------------------+
       +-----------------------+                          |
         ^         ^         ^                            | n
         | 1       | 1       | 1                          v 1
         |         |         |                +-----------------------+
         |         |         +--------------- |        Courses        |
         |         |                          |-----------------------|
         |         |                          | id (PK)               |
         |         |                          | course_name           |
         |         |                          +-----------------------+
         |         |                                      ^
         |         |                                      | 1
         |         |                                      | n
         |         |                          +-----------------------+
         |         |                          |       Sessions        |
         |         |                          |-----------------------|
         |         |                          | id (PK)               |
         |         |                          | course_id (FK)        |
         |         |                          | pin_code              |
         |         |                          | start_time, end_time  |
         |         |                          | is_active (CHECK)     |
         |         |                          +-----------------------+
         |         |                                      | 1
         |         |                                      | n
         |         |                                      v
         |         |                          +-----------------------+
         |         +------------------------- |      Attendance       |
         |                                  n |-----------------------|
         |                                    | id (PK)               |
         |                                    | session_id (FK)       |
         |                                    | student_id (FK)       |
         |                                    | status (CHECK)        |
         |                                    | time_logged           |
         |                                    | updated_by (FK)       |
         |                                    | UNIQUE(session,student|
         |                                    +-----------------------+
         |
         |            +-------------------------+
         +----------- |      Excuses (n)        |
         |            +-------------------------+
         |
         |            +-------------------------+
         +----------- |  Counseling_Notes (n)   |
         |            +-------------------------+
         |
         |            +-------------------------+
         +----------- |     Audit_Logs (n)      |
                      +-------------------------+
```

#### Detailed Entity Specifications:

1. **`Users` (Identity & Account Entity - Single Table Inheritance Pattern)**:
   * `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   * `email`: `TEXT UNIQUE NOT NULL`
   * `password_hash`: `TEXT NOT NULL`
   * `full_name`: `TEXT NOT NULL`
   * `role`: `TEXT NOT NULL CHECK(role IN ('Student', 'Instructor', 'Advisor', 'Administrator'))`

2. **`Courses` (Academic Catalog Entity - Slide 31)**:
   * `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   * `course_name`: `TEXT NOT NULL UNIQUE` (e.g., `CS-301: Advanced Data Structures`)

3. **`Enrollments` (Associative Many-to-Many Entity - Slides 37–38)**:
   * `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   * `user_id`: `INTEGER NOT NULL, FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE`
   * `course_id`: `INTEGER NOT NULL, FOREIGN KEY REFERENCES Courses(id) ON DELETE CASCADE`
   * `semester`: `TEXT DEFAULT 'Fall 2026'`
   * Composite Uniqueness Constraint: `UNIQUE(user_id, course_id)`

4. **`Sessions` (Live Attendance Session Entity)**:
   * `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   * `course_id`: `INTEGER NOT NULL, FOREIGN KEY REFERENCES Courses(id) ON DELETE CASCADE`
   * `pin_code`: `TEXT NOT NULL` (6-digit dynamic session PIN)
   * `start_time`: `TEXT NOT NULL`
   * `end_time`: `TEXT`
   * `is_active`: `INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1))`

5. **`Attendance` (Core Attendance Record Entity)**:
   * `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   * `session_id`: `INTEGER NOT NULL, FOREIGN KEY REFERENCES Sessions(id) ON DELETE CASCADE`
   * `student_id`: `INTEGER NOT NULL, FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE`
   * `status`: `TEXT NOT NULL CHECK(status IN ('Present', 'Late', 'Absent', 'Excused'))`
   * `time_logged`: `TEXT NOT NULL`
   * `updated_by`: `INTEGER, FOREIGN KEY REFERENCES Users(id) ON DELETE SET NULL`
   * Composite Uniqueness Constraint: `UNIQUE(session_id, student_id)`

6. **`Excuses` (Absence Excuse Petition Entity)**:
   * `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   * `student_id`: `INTEGER NOT NULL, FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE`
   * `course_id`: `INTEGER NOT NULL, FOREIGN KEY REFERENCES Courses(id) ON DELETE CASCADE`
   * `date_absent`: `TEXT NOT NULL`
   * `reason`: `TEXT NOT NULL`
   * `status`: `TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected'))`

7. **`Counseling_Notes` (Advising Dossier & Intervention Entity)**:
   * `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   * `student_id`: `INTEGER NOT NULL, FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE`
   * `advisor_id`: `INTEGER NOT NULL, FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE`
   * `note_text`: `TEXT NOT NULL`
   * `created_at`: `TEXT NOT NULL`

8. **`Audit_Logs` (Immutable Security Audit Trail Entity)**:
   * `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
   * `user_id`: `INTEGER, FOREIGN KEY REFERENCES Users(id) ON DELETE SET NULL`
   * `action`: `TEXT NOT NULL`
   * `timestamp`: `TEXT NOT NULL`
   * `details`: `TEXT`

---

## IV. USER INTERFACE DESIGN & FRONT-END ARCHITECTURE

### 1. Design Philosophy: Glacier Dark Glassmorphism
* **Color Palette & Visual Ergonomics**:
  * Deep Navy and Obsidian backgrounds (`#0a0e1a`, `#0f1524`, `#141c2e`) minimize eye strain during extended administrative usage.
  * Cyan accent tones (`#7dd3fc`, `#38bdf8`) signify academic intelligence and operational transparency.
  * Semantic status accents adhere to standard usability conventions: Emerald Green (`#34d399` - Present/Approved), Amber Gold (`#fbbf24` - Late/Warning), Crimson Rose (`#f87171` - Absent/Critical Risk), and Royal Sapphire (`#c084fc` - Advising/Excused).
* **Glassmorphic Surface Styling**:
  * Translucent containers styled with backdrop blur filters (`backdrop-filter: blur(12px)`) and semi-transparent ice borders (`border: 1px solid rgba(125, 211, 252, 0.15)`).
* **Visual Information Hierarchy**:
  * Header-level Key Performance Indicator (KPI) summary cards communicate attendance rates, risk metrics, and session states within 3 seconds of screen viewing.
  * Tabular layouts feature alternating row zebra striping, sticky headers, and in-cell action buttons.

---

### 2. Role-Based Access Control (RBAC) Screen Modules

The user interface is structured into five distinct screen workspaces (Screen 0 through Screen 4):

```
+-----------------------------------------------------------------------------------+
|  [SAS Logo]   [0. Login]  [1. Student]  [2. Instructor]  [3. Advisor]  [4. Admin] |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  SCREEN 0: Login Gateway                                                          |
|  - Official Institutional Email & Password Authentication                          |
|  - 4 Quick-Login Buttons for Instant Role Testing                                |
|                                                                                   |
|  SCREEN 1: Student Attendance & Progress Portal                                  |
|  - Live 6-Digit PIN Check-in Card                                                 |
|  - Cumulative Attendance KPI Card & Standing Indicator                           |
|  - Course-by-Course Attendance Summary Table (Present, Late, Absent, Excused)     |
|  - Absence Excuse Petition Form & Historical Decision Tracking Table             |
|                                                                                   |
|  SCREEN 2: Instructor Live Command Center                                         |
|  - Live Session Management Panel (Ephemeral PIN Display & 15-Minute Timer)        |
|  - Real-Time Class Roster Table with Direct In-Cell Status Override Dropdowns     |
|  - Excuse Review Inbox (Immediate Approval / Rejection with Auto-Recalculation)   |
|  - Course Attendance Export to CSV Action                                         |
|                                                                                   |
|  SCREEN 3: Academic Advisor Early Warning System (EWS)                            |
|  - At-Risk Student Filter Table (<80% Attendance or >= 3 Consecutive Absences)    |
|  - Severity Badges (CRITICAL / WARNING)                                           |
|  - Student Dossier & Counseling Intervention Notes Editor with History Feed       |
|                                                                                   |
|  SCREEN 4: Administrator Governance Console                                       |
|  - User Identity Provisioning Card                                                |
|  - Active System Users Table with Per-Row [Edit] Action Buttons                   |
|  - Edit User Record Workspace with Safe Cascading Deletion & Confirmation Dialog  |
|  - Course Catalog Management & Student Enrollment Allocations (n-n Relation)      |
|  - Tamper-Evident System Audit Trail Table & School-Wide CSV Export               |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

### 3. Web Application Architecture & Execution

The application is deployed as a high-performance, responsive web application:

1. **Modern Responsive Web Architecture (`index.html`)**:
   * Built with semantic HTML5, utility-first Tailwind CSS, and lightweight reactive JavaScript.
   * **Zero External Dependencies**: Runs directly in any modern web browser simply by opening `index.html` or launching the local Python server (`python main.py` or `python server.py`).
   * Seamlessly provides all 5 screen workflows, live session timers, interactive in-table overrides, modal forms, and CSV exports out-of-the-box.

2. **Backend Services & Persistence (`server.py`, `database.py`, `logic.py`)**:
   * `server.py`: Standard library HTTP server with cache-control headers and automated browser launching.
   * `database.py`: SQLite3 relational persistence engine with ACID guarantees, foreign keys, and seed data.
   * `logic.py`: Attendance logic engine enforcing 15/45-minute timing windows, EWS risk heuristics, and audit logging.
   * `main.py`: Central CLI runner initializing database schemas, verifying data integrity, executing unit tests (`python main.py --test`), and starting the web service.

---

## QUICK REFERENCE GUIDE FOR EVALUATORS & FACULTY
* **Software Architecture**: MVC Pattern (Slides 17–19), Layered Model (Slides 25–27), Client-Server Model (Slides 23–24).
* **Database Engineering**: 3 Design Levels (Slides 29–30), Single Table Inheritance mapping via `Loai_NV` pattern (Slides 41–42), Many-to-Many intermediate tables (Slides 37–38), ACID transaction management with prepared SQL statements.
* **Source Code Map**:
  * Persistence Layer: `database.py` (SQLite schema initialization, seeding & connection pooling).
  * Business Logic Layer: `logic.py` (`AttendanceLogic` engine & automated test suite `test_logic.py`).
  * Presentation Layer: `index.html` (Glacier Dark Glassmorphism Web Application).
  * Application Runner: `main.py` & `server.py` (Server orchestration & automated test runner).

