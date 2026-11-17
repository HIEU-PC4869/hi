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

### 2.1 Applied Architectural Pattern (Single Pattern): MVC Model (Model–View–Controller)
*(Reference: Chapter 3, Slides 17–19)*

In strict accordance with the requirement to apply **a single architectural pattern**, SAS Enterprise exclusively implements the **MVC (Model–View–Controller) Model** (Slide 17):
> *"Separate display and interaction of system data. The system is structured into three logical components that interact with each other."*

```
                 +-----------------------------------+
                 |               USER                |
                 +-----------------------------------+
                   | (1) Request       ^ (4) Response
                   v                   |
           +--------------------+  (3)   +----------------------+
           |     CONTROLLER     |------->|         VIEW         |
           | (controller/*.py)  | Data   | (*.html, shared.js)  |
           +--------------------+ Model  +----------------------+
                   |
                   | (2) Manipulate (Model API Calls)
                   v
           +--------------------+
           |       MODEL        |
           |   (model/*.py)     |
           +--------------------+
                   |
                   | SQLite3 CRUD Operations
                   v
           +--------------------+
           |      DATABASE      |
           |  (attendance.db)   |
           +--------------------+
```

#### Detailed Component Responsibilities (Slide 17):
1. **Model (`model/` package & `attendance.db`):**
   - *Definition (Slide 17):* "Manages system data and the operations associated with that data."
   - *Implementation:*
     - `model/entities.py`: Object-Oriented domain entities (`BaseEntity`, `User`, `Student`, `Instructor`, `Advisor`, `Administrator`, `UserFactory`, `Course`, `Enrollment`, `AttendanceSession`, `AttendanceRecord`, `ExcuseRequest`, `CounselingNote`, `AuditLog`).
     - `model/database.py`: Thread-safe `DBConnection` Context Manager (`PRAGMA foreign_keys = ON;`), schema initialization, safe legacy migration, and initial institutional seeding.
     - `model/attendance_model.py`: `AttendanceModel` encapsulating **100% of SQLite3 CRUD operations** and relational hydration.
   - *Managed Entities:* `Users`, `Courses`, `Instructor_Courses`, `Enrollments`, `Sessions`, `Attendance`, `Excuses`, `Counseling_Notes`, `Audit_Logs`.
2. **View (`index.html`, `student.html`, `instructor.html`, `advisor.html`, `admin.html`, `shared.js`):**
   - *Definition (Slide 17):* "Defines and manages how data is presented (displayed) to the user."
   - *Implementation:* Role-specific web views that contain zero SQL or persistence logic and only render data models supplied by the Controller while dispatching user interactions back to Controller endpoints:
     - `index.html`: Login & Role Authentication Gateway + Stage 2 Design Inspector
     - `student.html`: Student Portal (real-time attendance rate, PIN/QR check-in, excuse submission)
     - `instructor.html`: Instructor Portal (rolling session PIN/QR generation, live roster, manual override, excuse review)
     - `advisor.html`: Academic Advisor Portal (Early Warning System triggers, counseling notes)
     - `admin.html`: System Administration Console (user management, course catalog, enrollments, security audit logs).
3. **Controller (`controller/` package):**
   - *Definition (Slide 17):* "Manages user interactions and passes these interactions to the View and Model respectively."
   - *Implementation:*
     - `controller/attendance_controller.py`: `AttendanceController` coordinates authentication checks, attendance timing evaluation, CSV formatting, and Early Warning computations. Contains **zero `sqlite3` imports and zero raw SQL**—all data reads/writes go strictly through `self.model` (`AttendanceModel`).
     - `controller/http_controller.py`: `SASHttpHandler` routes user HTTP requests `(1)`, invokes `AttendanceController` -> `AttendanceModel` `(2)`, and sends JSON data models or HTML Views back to the user `(3, 4)`.

---

### 2.2 Evaluation Against Course Quality Metrics
*(Reference: Chapter 3, Slides 11–13, 19)*

1. **High Cohesion (Slide 11, 13, 19):**
   - `model/` strictly manages domain state, OOP entities, schema integrity, and SQLite CRUD operations.
   - `controller/` strictly manages user interaction routing, workflow validation, and View data assembly.
   - `*.html` + `shared.js` strictly manage UI rendering and DOM interaction events.
2. **Loose Coupling (Slide 11, 12, 19):**
   - View never communicates directly with SQLite and never imports persistence modules.
   - Controller communicates with Model solely through typed `AttendanceModel` methods and hydrated OOP entities.
3. **MVC Advantages Verified (Slide 19):**
   - *Concurrent (parallel) development:* View interfaces and Model persistence can evolve independently.
   - *High cohesion & Loose coupling:* Strictly verified by automated unit test `test_10_strict_mvc_separation`.
   - *Easy to maintain:* Swapping UI layout or extending database tables remains isolated to its single MVC component.

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

All database tables, OOP domain models, and strict MVC component boundaries are active in:
1. **View (`index.html`, `student.html`, `instructor.html`, `advisor.html`, `admin.html`, `shared.js`):** Interactive browser views rendering data models supplied by the Controller.
2. **Model (`model/entities.py`, `model/database.py`, `model/attendance_model.py`):** OOP domain entities, SQLite3 `DBConnection` context manager, and all CRUD queries in `AttendanceModel`.
3. **Controller (`controller/attendance_controller.py`, `controller/http_controller.py`):** `AttendanceController` and `SASHttpHandler` (zero raw SQL / `sqlite3` imports), verified by `test_10_strict_mvc_separation`.
4. **Physical Relational Store (`attendance.db`):** SQLite3 database with `PRAGMA foreign_keys = ON;` enforced.
