# Stage 2 – Software Design Specification
## Student Attendance & Intelligence System (SAS Enterprise)
**Course:** Software Engineering — Chapter 3: Software Design  
**Language:** English (Institutional Specification)  
**Scope:** Stage 2 Design (Software Architecture Design & Database Design)

---

## 1. Executive Summary & Design Principles

This document formally presents the **Stage 2 Design** for the **Student Attendance & Intelligence System (SAS Enterprise)**, developed strictly in adherence to the theoretical models, architectural patterns, and relational conversion rules covered in **Software Engineering Chapter 3: Software Design**.

As established in Chapter 3:
1. **Design Activities (Slide 5):**
   - *Architectural Design:* Defines the overall structure of the system, its main components (subsystems or modules), their relationships, and how they are implemented.
   - *Database Design:* Designs the data structure for the system and how it is represented in the database.
   - *Interface Design:* Defines interfaces between system components and user touchpoints.
2. **Quality Metrics (Slides 11–13):**
   - *Coupling:* Minimizing interdependence between modules towards **Loose Coupling** (Data coupling).
   - *Cohesion:* Maximizing relevance within each module towards **High Cohesion**.
3. **Design Levels (Slides 29–30):**
   - Progressing systematically through **Concept (ERD / Class Diagrams) → Logic (Relational Tables) → Physic (DBMS)**.

---

## 2. Software Architecture Design

### 2.1 Applied Architectural Pattern: MVC Model (Model-View-Controller)
*(Reference: Chapter 3, Slides 17–19)*

The primary architectural pattern applied to SAS Enterprise is the **MVC (Model-View-Controller) Model** (Slide 17):
> *"Separate display and interaction of system data. The system is structured into three logical components that interact with each other."*

```
                 +-----------------------------------+
                 |               USER                |
                 +-----------------------------------+
                   | (1) Request       ^ (4) Response
                   v                   |
           +---------------+   (3)    +---------------+
           |  CONTROLLER   |--------->|     VIEW      |
           |  (logic.py)   | Data     | (index.html)  |
           +---------------+ Model    +---------------+
                   |
                   | (2) Manipulate (CRUD)
                   v
           +---------------+
           |     MODEL     |
           | (database.py) |
           +---------------+
                   |
                   | CRUD Operations
                   v
           +---------------+
           |   DATABASE    |
           | (attendance.db|
           +---------------+
```

#### Detailed Component Responsibilities (Slide 17):
1. **Model (`database.py` & `attendance.db`):**
   - *Definition (Slide 17):* "Manages system data and the operations associated with that data."
   - *Implementation:* Encapsulates relational schema definitions, ACID transactions via `DBConnection` Context Manager, SQLite3 constraints, and data manipulation operations (Create, Read, Update, Delete).
   - *Managed Entities:* `Users`, `Courses`, `Enrollments`, `Sessions`, `Attendance`, `Excuses`, `Counseling_Notes`, `Audit_Logs`.
2. **View (`index.html` & UI components):**
   - *Definition (Slide 17):* "Defines and manages how data is presented (displayed) to the user."
   - *Implementation:* Five distinct role-specific screens:
     - Screen 0: Login & Role Authentication Gateway
     - Screen 1: Student Portal (attendance rate, real-time code check-in, excuse submission)
     - Screen 2: Instructor Portal (rolling session code generation, live roster, excuse review)
     - Screen 3: Academic Advisor Portal (at-risk warning triggers, student counseling logs)
     - Screen 4: System Administration Console (user management, course catalog, audit logs)
     - Screen 5: Stage 2 Architecture & Database Inspector.
3. **Controller (`logic.py` & `AttendanceLogic`):**
   - *Definition (Slide 17):* "Manages user interactions and passes these interactions to the View and Model respectively."
   - *Implementation:* Intercepts user actions, applies domain validation (e.g., verifying 15-minute PIN validity, verifying absence thresholds, hashing credentials with salt), instructs the Model to perform CRUD operations, and prepares structured JSON response objects for the View.

---

### 2.2 Integration with Layered Model & Client-Server Model
*(Reference: Chapter 3, Slides 23–27)*

In full alignment with **Slide 25 & 26 (Layered Model)**, the system is organized into four hierarchical layers where each layer provides dedicated services to the layer above:

| Layer (Slide 25) | System Module | Functions & Services (Slide 26) |
|---|---|---|
| **Presentation Layer** | `index.html` (Web Browser) | Form & Menu Manager, Screen Rendering, Client Data Validation, User Event Capture |
| **Business Layer** | `logic.py` (`AttendanceLogic`) | Role Checking, Session PIN Verification, Attendance Calculation, Risk Warning Generation |
| **Persistence Layer** | `database.py` (DAO Methods) | Data Access Objects, Query Building, Transaction Safety, Object-Relational Translation |
| **Database Layer** | `attendance.db` (SQLite3 Engine) | Physical Tables, Foreign Key Constraints (`PRAGMA foreign_keys = ON`), ACID Storage |

Furthermore, the system follows the **Client-Server Model (Slide 23)**:
- **Client:** Web Browser accessing services through structured HTTP/REST requests.
- **Server:** Python `server.py` executing services and returning responses.

---

### 2.3 Evaluation Against Course Quality Metrics
*(Reference: Chapter 3, Slides 11–13, 19)*

1. **High Cohesion (Slide 11, 13, 19):**
   - `database.py` strictly handles persistence logic.
   - `logic.py` strictly handles business validation and workflow coordination.
   - `index.html` strictly handles display formatting and user interaction events.
2. **Loose Coupling (Slide 11, 12, 19):**
   - View never executes raw SQL queries.
   - Controller communicates with Model through clean parameter contracts and receives standard dictionary rows.
3. **Course Pros Verified (Slide 19):**
   - *Concurrent (parallel) development:* Front-end views and back-end database schemas can be developed simultaneously.
   - *High cohesion:* Logical grouping of related actions in Controller, CRUD in Model.
   - *Loose coupling:* Low coupling simplifies automated testing and future extensions.
   - *Easy to maintain:* Modifying UI layout does not alter database logic.

---

## 3. Relational Database Design

### 3.1 Three Database Design Levels
*(Reference: Chapter 3, Slides 29–30)*

The database was designed following the three standard levels defined in Slide 29:
1. **Concept Level (ERD / Class Diagram):**
   - Identifies domain entity classes: `User` (and subclasses `Student`, `Instructor`, `Advisor`, `Administrator`), `Course`, `Enrollment`, `Session`, `AttendanceRecord`, `Excuse`, `CounselingNote`, `AuditLog`.
2. **Logic Level (Relational Tables):**
   - Converts classes and relationships into normalized relational tables, defining primary keys, reference keys (foreign keys), and check constraints.
3. **Physic Level (DBMS):**
   - Implemented in SQLite3 with foreign key enforcement (`PRAGMA foreign_keys = ON;`), indexed primary keys, and strict data types.

---

### 3.2 Conversion Rules from Class Diagram to Relational DB
*(Reference: Chapter 3, Slides 31–42)*

The database strictly implements every relational conversion rule presented in the slides:

#### Rule 1: Convert Class to Table (Slide 31)
- A class $\rightarrow$ a Table
- A property $\rightarrow$ a column
- An object of the class $\rightarrow$ a row (tuple) in the table

#### Rule 2: Inheritance Relationship $\rightarrow$ Single Table with Discriminator (Slides 39–42)
- *Course Rule (Slide 41–42):* Superclass `NhanVien` and subclasses `NhanVienCongNhat`, `NhanVienBienChe` converted to a single table with discriminator column `Loai_NV`.
- *Application in SAS:* Superclass `User` and subclasses `Student`, `Instructor`, `Advisor`, `Administrator` are converted into the single table `Users` with discriminator attribute `role`:
  ```sql
  CREATE TABLE Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Student', 'Instructor', 'Advisor', 'Administrator'))
  );
  ```

#### Rule 3: 1-n Relationship $\rightarrow$ Reference Key (Slides 35–36)
- *Course Rule (Slide 35):* Primary key `MA` of table A becomes a Reference Key (Foreign Key) in table B.
- *Application in SAS:*
  - `Courses (1)` $\rightarrow$ `Sessions (0..n)`: Foreign key `course_id` references `Courses(id)`.
  - `Sessions (1)` $\rightarrow$ `Attendance (0..n)`: Foreign key `session_id` references `Sessions(id)`.
  - `Users (1)` $\rightarrow$ `Attendance (0..n)`: Foreign key `student_id` references `Users(id)`.
  - `Users (1)` $\rightarrow$ `Excuses (0..n)`: Foreign key `student_id` references `Users(id)`.
  - `Courses (1)` $\rightarrow$ `Excuses (0..n)`: Foreign key `course_id` references `Courses(id)`.
  - `Users (1)` $\rightarrow$ `Counseling_Notes (0..n)`: Foreign keys `student_id` and `advisor_id` reference `Users(id)`.
  - `Users (1)` $\rightarrow$ `Audit_Logs (0..n)`: Foreign key `user_id` references `Users(id)`.

#### Rule 4: n-n Relationship $\rightarrow$ Intermediate Table (Slides 37–38)
- *Course Rule (Slide 37–38):* For `A (0..n) <-> (0..n) B`, create an intermediate table `C` containing foreign keys `MA` and `MB`.
- *Application in SAS:* Many-to-Many relationship between `Users (Students)` and `Courses` is mapped to intermediate table `Enrollments`:
  ```sql
  CREATE TABLE Enrollments (
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
  );
  ```

#### Rule 5: 1-1 Relationship $\rightarrow$ Merge or Split (Slides 32–34)
- Applied: User authentication credentials (`email`, `password_hash`) and profile data are consolidated directly into the `Users` entity to maintain zero-redundancy and high access performance.

---

## 4. Comprehensive Data Dictionary (Schema Specification)

| Table Name | Attribute | Data Type | Constraint / Key Type | Relationship / Rule Reference |
|---|---|---|---|---|
| **`Users`** | `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Base class PK (Slide 31) |
| | `email` | TEXT | UNIQUE, NOT NULL | Institutional account identifier |
| | `password_hash` | TEXT | NOT NULL | Salted SHA-256 hash |
| | `full_name` | TEXT | NOT NULL | User legal name |
| | `role` | TEXT | NOT NULL, CHECK IN (...) | Discriminator column (`Loai_NV` pattern, Slides 41–42) |
| **`Courses`** | `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Course PK (Slide 31) |
| | `course_name` | TEXT | UNIQUE, NOT NULL | e.g. "CS-301: Advanced Data Structures" |
| **`Enrollments`** | `user_id` | INTEGER | PK, FK $\rightarrow$ `Users(id)` | Intermediate table for n-n relationship (Slides 37–38) |
| | `course_id` | INTEGER | PK, FK $\rightarrow$ `Courses(id)` | Intermediate table for n-n relationship (Slides 37–38) |
| **`Sessions`** | `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Session PK |
| | `course_id` | INTEGER | NOT NULL, FK $\rightarrow$ `Courses(id)` | 1-n Reference Key from Courses (Slides 35–36) |
| | `session_code` | TEXT | NOT NULL | Rolling 6-digit verification code |
| | `start_time` | TEXT | NOT NULL | ISO-8601 Timestamp |
| | `is_active` | INTEGER | NOT NULL DEFAULT 1 | 1 = Open, 0 = Closed |
| **`Attendance`** | `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Attendance log PK |
| | `session_id` | INTEGER | NOT NULL, FK $\rightarrow$ `Sessions(id)` | 1-n Reference Key from Sessions (Slides 35–36) |
| | `student_id` | INTEGER | NOT NULL, FK $\rightarrow$ `Users(id)` | 1-n Reference Key from Users (Slides 35–36) |
| | `status` | TEXT | NOT NULL, CHECK IN (...) | Status: Present, Late, Absent, Excused |
| | `time_logged` | TEXT | NOT NULL | Timestamp of record entry |
| | `updated_by` | INTEGER | FK $\rightarrow$ `Users(id)` | 1-n Reference Key (Instructor / System / Self) |
| | *Unique* | — | UNIQUE(`session_id`, `student_id`)| Composite unique integrity rule |
| **`Excuses`** | `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Excuse petition PK |
| | `student_id` | INTEGER | NOT NULL, FK $\rightarrow$ `Users(id)` | 1-n Reference Key from Users (Slides 35–36) |
| | `course_id` | INTEGER | NOT NULL, FK $\rightarrow$ `Courses(id)` | 1-n Reference Key from Courses (Slides 35–36) |
| | `date_absent` | TEXT | NOT NULL | Date of missed class session |
| | `reason` | TEXT | NOT NULL | Student-provided justification |
| | `status` | TEXT | NOT NULL DEFAULT 'Pending' | Status: Pending, Approved, Rejected |
| **`Counseling_Notes`** | `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Note PK |
| | `student_id` | INTEGER | NOT NULL, FK $\rightarrow$ `Users(id)` | 1-n Reference Key from Users (Slides 35–36) |
| | `advisor_id` | INTEGER | NOT NULL, FK $\rightarrow$ `Users(id)` | 1-n Reference Key from Users (Slides 35–36) |
| | `note_text` | TEXT | NOT NULL | Academic intervention details |
| | `created_at` | TEXT | NOT NULL | Timestamp of counseling session |
| **`Audit_Logs`** | `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Audit log PK |
| | `user_id` | INTEGER | FK $\rightarrow$ `Users(id)` | 1-n Reference Key from Users (Slides 35–36) |
| | `action` | TEXT | NOT NULL | Operation name (e.g. Sign-in, Status Override) |
| | `timestamp` | TEXT | NOT NULL | ISO-8601 Timestamp |
| | `details` | TEXT | NULL | Structured audit event context |

---

## 5. Verification & Live Traceability

All 8 tables, foreign key cascades, and MVC controller routines are active in:
1. **Interactive Web App Screen 5:** Directly accessible via the top navigation bar `[5: Stage 2 Design]`.
2. **Back-end Persistence Layer:** `database.py` with `DBConnection` SQLite3 context manager.
3. **Controller Layer:** `logic.py` with `AttendanceLogic` decoupled business validation.
4. **Physical Relational Store:** `attendance.db` SQLite3 file with foreign keys enforced.
