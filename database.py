"""
database.py - Model Component & Persistence / Database Layer
SAS Enterprise - Student Attendance & Intelligence System

Grounded in Software Engineering Chapter 3: Software Design:
- Architectural Pattern: MVC Model - Model Component (Slides 17-19)
- Layered Model: Persistence Layer (DAO) & Database Layer (Slides 25-27)
- Database Design Levels: Concept -> Logic (Normalized Tables) -> Physic (SQLite3) (Slides 29-30)
- Relational Conversion Rules Applied:
  * Class to Table & Property to Column (Slide 31)
  * Inheritance: Single Table with Discriminator `role` (`Loai_NV` pattern, Slides 41-42)
  * 1-n Relationship: Reference Key / Foreign Key (Slides 35-36)
  * n-n Relationship: Intermediate Table `Enrollments` (Slides 37-38)
  * 1-1 Relationship: Merge Credentials into User Entity (Slides 32-34)
"""

import sqlite3
import hashlib
import os
from datetime import datetime, timedelta

DB_FILE = os.path.join(os.path.dirname(__file__), "attendance.db")


class DBConnection:
    """
    Thread-safe Context Manager for SQLite3 database connections.
    Enforces foreign keys, enables dict-like row access, and automatically
    commits transactions while rolling back on exceptions to guarantee ACID compliance.
    """
    def __init__(self, db_path=DB_FILE):
        self.db_path = db_path
        self.conn = None

    def __enter__(self):
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("PRAGMA foreign_keys = ON;")
            return self.conn
        except sqlite3.Error as e:
            raise RuntimeError(f"Database connection error: {e}")

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            if exc_type is not None:
                # An exception occurred; roll back changes
                self.conn.rollback()
            else:
                self.conn.commit()
            self.conn.close()
        # Do not suppress exceptions
        return False


def hash_password(password: str) -> str:
    """Generate deterministic salted SHA-256 hash for secure storage."""
    salt = "sas_secure_salt_2025"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()


def init_database(db_path=DB_FILE):
    """
    Create tables with strict schemas and seed initial institutional mock data.
    All queries use parameterized statements to prevent SQL injection.
    """
    try:
        with DBConnection(db_path) as conn:
            cursor = conn.cursor()

            # 1. Users table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('Student', 'Instructor', 'Advisor', 'Administrator'))
            );
            """)

            # 2. Courses table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_name TEXT UNIQUE NOT NULL
            );
            """)

            # 3. Enrollments table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Enrollments (
                user_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                PRIMARY KEY (user_id, course_id),
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
            );
            """)

            # 4. Sessions table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER NOT NULL,
                session_code TEXT NOT NULL,
                start_time TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
            );
            """)

            # 5. Attendance table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('Present', 'Late', 'Absent', 'Excused')),
                time_logged TEXT NOT NULL,
                updated_by INTEGER,
                FOREIGN KEY (session_id) REFERENCES Sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (updated_by) REFERENCES Users(id) ON DELETE SET NULL,
                UNIQUE(session_id, student_id)
            );
            """)

            # 6. Excuses table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Excuses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                date_absent TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
                FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
            );
            """)

            # 7. Counseling Notes table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Counseling_Notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                advisor_id INTEGER NOT NULL,
                note_text TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (advisor_id) REFERENCES Users(id) ON DELETE CASCADE
            );
            """)

            # 8. Audit Logs table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS Audit_Logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                details TEXT,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
            );
            """)

            # Seed data if empty
            cursor.execute("SELECT COUNT(*) as count FROM Users;")
            if cursor.fetchone()["count"] == 0:
                _seed_mock_data(cursor)

    except sqlite3.Error as e:
        print(f"[DB Error] Failed to initialize database: {e}")
        raise


def _seed_mock_data(cursor):
    """Seed comprehensive institutional users, courses, and records."""
    pw_hash = hash_password("password123")

    # Users
    users = [
        ("a.rivera@university.edu", pw_hash, "Alex Rivera", "Student"),
        ("dr.vance@university.edu", pw_hash, "Dr. Evelyn Vance", "Instructor"),
        ("m.brody@university.edu", pw_hash, "Marcus Brody", "Advisor"),
        ("sysadmin@university.edu", pw_hash, "Root Systems Admin", "Administrator"),
        ("d.kim@university.edu", pw_hash, "David Kim", "Student"),
        ("s.jenkins@university.edu", pw_hash, "Sarah Jenkins", "Student"),
        ("a.patel@university.edu", pw_hash, "Amira Patel", "Student"),
        ("c.mendez@university.edu", pw_hash, "Carlos Mendez", "Student"),
        ("j.mercer@university.edu", pw_hash, "Julian Mercer", "Student"),
        ("k.vance@university.edu", pw_hash, "Kassandra Vance", "Student"),
        ("t.almansoor@university.edu", pw_hash, "Tariq Al-Mansoor", "Student"),
        ("e.wu@university.edu", pw_hash, "Elena Wu", "Student"),
    ]
    cursor.executemany(
        "INSERT INTO Users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?);",
        users
    )

    # Courses
    courses = [
        ("CS-301: Advanced Data Structures",),
        ("ENG-204: Technical Communication",),
        ("MATH-310: Linear Algebra",),
        ("PHY-102: Engineering Physics II",),
    ]
    cursor.executemany("INSERT INTO Courses (course_name) VALUES (?);", courses)

    # Enrollments for students (IDs 1, 5, 6, 7, 8, 9, 10, 11, 12)
    student_ids = [1, 5, 6, 7, 8, 9, 10, 11, 12]
    course_ids = [1, 2, 3, 4]
    enrollments = []
    for sid in student_ids:
        for cid in course_ids:
            enrollments.append((sid, cid))
    cursor.executemany("INSERT INTO Enrollments (user_id, course_id) VALUES (?, ?);", enrollments)

    # Historical Sessions & Attendance
    now = datetime.now()
    # Create an active session for CS-301 with dynamic pin 849-210
    cursor.execute(
        "INSERT INTO Sessions (course_id, session_code, start_time, is_active) VALUES (?, ?, ?, 1);",
        (1, "849210", now.strftime("%Y-%m-%d %H:%M:%S"))
    )
    active_session_id = cursor.lastrowid

    # Create active session attendance
    session_attendances = [
        (active_session_id, 1, "Present", (now - timedelta(minutes=2)).strftime("%Y-%m-%d %H:%M:%S"), None),
        (active_session_id, 5, "Late", (now - timedelta(minutes=18)).strftime("%Y-%m-%d %H:%M:%S"), None),
        (active_session_id, 6, "Present", (now - timedelta(minutes=4)).strftime("%Y-%m-%d %H:%M:%S"), None),
        (active_session_id, 7, "Present", (now - timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M:%S"), None),
        (active_session_id, 8, "Late", (now - timedelta(minutes=22)).strftime("%Y-%m-%d %H:%M:%S"), None),
        (active_session_id, 9, "Absent", (now - timedelta(minutes=50)).strftime("%Y-%m-%d %H:%M:%S"), None),
        (active_session_id, 11, "Present", (now - timedelta(minutes=3)).strftime("%Y-%m-%d %H:%M:%S"), None),
        (active_session_id, 12, "Present", (now - timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S"), None),
    ]
    cursor.executemany(
        "INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by) VALUES (?, ?, ?, ?, ?);",
        session_attendances
    )

    # Historical sessions for Alex Rivera (student 1) and David Kim (student 5)
    # Course 1 (CS-301): Alex: 25 Present, 2 Late, 1 Absent, 0 Excused (Total 28) -> 92.8%
    # Course 2 (ENG-204): Alex: 15 Present, 1 Late, 3 Absent, 1 Excused (Total 20) -> 80.0%
    # Course 3 (MATH-310): Alex: 30 Present, 1 Late, 1 Absent, 0 Excused (Total 32) -> 96.8%
    # Course 4 (PHY-102): Alex: 19 Present, 2 Late, 4 Absent, 1 Excused (Total 26) -> 76.9%
    # David Kim (student 5): PHY-102 rate = 68.5% with 4 consecutive absences -> Flags EWS!
    courses_dist = [
        (1, 28, 25, 2, 1, 0),
        (2, 20, 15, 1, 3, 1),
        (3, 32, 30, 1, 1, 0),
        (4, 26, 19, 2, 4, 1),
    ]
    for cid, total, p, l, a, e in courses_dist:
        statuses = (["Present"] * p) + (["Late"] * l) + (["Absent"] * a) + (["Excused"] * e)
        for i, st in enumerate(statuses):
            s_time = (now - timedelta(days=total - i)).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO Sessions (course_id, session_code, start_time, is_active) VALUES (?, ?, ?, 0);",
                (cid, f"PIN{i:03d}", s_time)
            )
            s_id = cursor.lastrowid
            cursor.execute(
                "INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by) VALUES (?, ?, ?, ?, ?);",
                (s_id, 1, st, s_time, None)
            )

    # Seed David Kim (student 5) PHY-102 data with 4 consecutive absences for Early Warning System
    for i in range(15):
        s_time = (now - timedelta(days=20 - i)).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "INSERT INTO Sessions (course_id, session_code, start_time, is_active) VALUES (?, ?, ?, 0);",
            (4, f"DK{i:03d}", s_time)
        )
        s_id = cursor.lastrowid
        # Last 4 sessions absent
        st = "Absent" if i >= 11 else ("Late" if i == 5 else "Present")
        cursor.execute(
            "INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by) VALUES (?, ?, ?, ?, ?);",
            (s_id, 5, st, s_time, None)
        )

    # Seed Sarah Jenkins (student 6) with 3 consecutive absences in CS-301
    for i in range(10):
        s_time = (now - timedelta(days=15 - i)).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "INSERT INTO Sessions (course_id, session_code, start_time, is_active) VALUES (?, ?, ?, 0);",
            (1, f"SJ{i:03d}", s_time)
        )
        s_id = cursor.lastrowid
        st = "Absent" if i >= 7 else "Present"
        cursor.execute(
            "INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by) VALUES (?, ?, ?, ?, ?);",
            (s_id, 6, st, s_time, None)
        )

    # Excuses
    excuses = [
        (9, 1, now.strftime("%Y-%m-%d"), "Severe acute migraine and ophthalmology exam at 09:30 AM.", "Pending"),
        (10, 4, (now - timedelta(days=1)).strftime("%Y-%m-%d"), "Varsity athletics regional championship tournament travel.", "Pending"),
        (11, 2, (now - timedelta(days=2)).strftime("%Y-%m-%d"), "Academic conference paper presentation in Chicago.", "Pending"),
    ]
    cursor.executemany(
        "INSERT INTO Excuses (student_id, course_id, date_absent, reason, status) VALUES (?, ?, ?, ?, ?);",
        excuses
    )

    # Counseling Notes
    notes = [
        (5, 3, "Met with student via virtual office hours regarding PHY-102 attendance dip (68.5%). Student cited acute health complications and missed lab syncs. Initiated student health referral; coordinated with Dr. Vance regarding lab makeup protocol.", (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")),
        (6, 3, "Early warning dispatch triggered for Sarah Jenkins after 3 consecutive missed classes. Scheduled 1-on-1 counseling sync.", (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")),
    ]
    cursor.executemany(
        "INSERT INTO Counseling_Notes (student_id, advisor_id, note_text, created_at) VALUES (?, ?, ?, ?);",
        notes
    )

    # Audit Logs
    audit = [
        (2, "Session Opened", (now - timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S"), "Instructor Dr. Vance initiated session #SES-9821-B for CS-301."),
        (1, "Student Check-In", (now - timedelta(minutes=2)).strftime("%Y-%m-%d %H:%M:%S"), "Alex Rivera checked in with token 849210 (Status: Present)."),
        (4, "System Initialized", (now - timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S"), "Database initialized with SOC2 compliance policies."),
    ]
    cursor.executemany(
        "INSERT INTO Audit_Logs (user_id, action, timestamp, details) VALUES (?, ?, ?, ?);",
        audit
    )


if __name__ == "__main__":
    init_database()
    print("Database successfully initialized and seeded.")
