"""
model/database.py - MVC Model: SQLite Connection, Schema Migration & Seeding
SAS Enterprise - Student Attendance & Intelligence System
"""

import hashlib
import os
import sqlite3
from datetime import datetime, timedelta

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_FILE = os.path.join(ROOT_DIR, "attendance.db")


class DBConnection:
    """
    Thread-safe Context Manager for SQLite3 database connections.
    Enforces foreign keys, enables dict-like row access, and guarantees ACID commits/rollbacks.
    """

    def __init__(self, db_path=DB_FILE):
        self.db_path = db_path or DB_FILE
        self.conn = None

    def __enter__(self):
        try:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=15.0)
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("PRAGMA foreign_keys = ON;")
            return self.conn
        except sqlite3.Error as e:
            raise RuntimeError(f"Database connection error: {e}")

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            if exc_type is not None:
                self.conn.rollback()
            else:
                self.conn.commit()
            self.conn.close()
        return False


def hash_password(password: str) -> str:
    """Generate deterministic salted SHA-256 hash for secure storage."""
    salt = "sas_secure_salt_2025"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()


def _get_table_columns(cursor, table_name: str):
    cursor.execute(f"PRAGMA table_info({table_name});")
    return {row["name"] for row in cursor.fetchall()}


def _migrate_schema(cursor):
    """Idempotent schema migration preserving existing rows."""
    user_cols = _get_table_columns(cursor, "Users")
    for col_name, col_def in [
        ("student_id", "TEXT"),
        ("major", "TEXT"),
        ("academic_year", "TEXT"),
        ("department", "TEXT"),
        ("status", "TEXT DEFAULT 'Active'"),
    ]:
        if col_name not in user_cols:
            cursor.execute(f"ALTER TABLE Users ADD COLUMN {col_name} {col_def};")

    course_cols = _get_table_columns(cursor, "Courses")
    for col_name, col_def in [
        ("course_code", "TEXT"),
        ("title", "TEXT"),
        ("room", "TEXT DEFAULT 'Hall B-12'"),
    ]:
        if col_name not in course_cols:
            cursor.execute(f"ALTER TABLE Courses ADD COLUMN {col_name} {col_def};")

    att_cols = _get_table_columns(cursor, "Attendance")
    if "method" not in att_cols:
        cursor.execute("ALTER TABLE Attendance ADD COLUMN method TEXT DEFAULT 'PIN Input';")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Instructor_Courses (
        instructor_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        PRIMARY KEY (instructor_id, course_id),
        FOREIGN KEY (instructor_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Bug_Reports';")
    had_bug_table = cursor.fetchone() is not None
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Bug_Reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_key TEXT UNIQUE NOT NULL,
        summary TEXT NOT NULL,
        description TEXT NOT NULL,
        test_case_id TEXT DEFAULT 'GENERAL',
        module TEXT DEFAULT 'System',
        priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Highest', 'High', 'Medium', 'Low', 'Lowest')),
        severity TEXT NOT NULL DEFAULT 'Major' CHECK(severity IN ('Blocker', 'Critical', 'Major', 'Minor', 'Trivial')),
        status TEXT NOT NULL DEFAULT 'To Do' CHECK(status IN ('To Do', 'In Progress', 'In Review', 'Done')),
        reporter_id INTEGER,
        assignee TEXT DEFAULT 'Unassigned',
        jira_remote_key TEXT,
        jira_sync_status TEXT DEFAULT 'Local Jira Queue',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (reporter_id) REFERENCES Users(id) ON DELETE SET NULL
    );
    """)
    return not had_bug_table


def _backfill_migrated_data(cursor):
    """Safely backfill newly migrated metadata columns and missing defaults."""
    cursor.execute("SELECT id, course_name, course_code, title, room FROM Courses;")
    for row in cursor.fetchall():
        cname = row["course_name"] or ""
        code = row["course_code"]
        title = row["title"]
        room = row["room"] or "Hall B-12"
        if not code or not title:
            if ":" in cname:
                c_part, t_part = cname.split(":", 1)
                code = code or c_part.strip().upper()
                title = title or t_part.strip()
            else:
                code = code or cname.strip().upper()
                title = title or cname.strip()
            cursor.execute(
                "UPDATE Courses SET course_code = ?, title = ?, room = ? WHERE id = ?;",
                (code, title, room, row["id"]),
            )

    cursor.execute("SELECT id FROM Courses WHERE course_code = 'CS-402' OR course_name LIKE 'CS-402%';")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO Courses (course_name, course_code, title, room) VALUES (?, ?, ?, ?);",
            ("CS-402: Cloud Architecture & DevOps", "CS-402", "Cloud Architecture & DevOps", "Lab 201"),
        )

    known_profiles = {
        "a.rivera@university.edu": ("24091", "B.S. Software Engineering", "Year 3", "B.S. Software Engineering (Year 3)", "Active"),
        "dr.vance@university.edu": (None, None, None, "Faculty of Engineering", "Active"),
        "m.brody@university.edu": (None, None, None, "Student Support Services", "Active"),
        "sysadmin@university.edu": (None, None, None, "Global Campus Administration", "Active"),
        "d.kim@university.edu": ("24108", "B.Eng. Computer Engineering", "Year 2", "B.Eng. Computer Engineering (Year 2)", "Flagged (EWS)"),
        "s.jenkins@university.edu": ("24094", "B.S. Computer Science", "Year 2", "B.S. Computer Science (Year 2)", "Flagged (EWS)"),
    }
    cursor.execute("SELECT id, email, role, student_id, major, academic_year, department, status FROM Users;")
    for u in cursor.fetchall():
        email = u["email"]
        preset = known_profiles.get(email)
        if preset:
            s_id, maj, yr, dept, st = preset
            cursor.execute(
                """
                UPDATE Users SET
                    student_id = COALESCE(NULLIF(student_id, ''), ?),
                    major = COALESCE(NULLIF(major, ''), ?),
                    academic_year = COALESCE(NULLIF(academic_year, ''), ?),
                    department = COALESCE(NULLIF(department, ''), ?),
                    status = COALESCE(NULLIF(status, ''), ?)
                WHERE id = ?;
                """,
                (s_id, maj, yr, dept, st, u["id"]),
            )
        else:
            default_sid = str(24000 + u["id"]) if u["role"] == "Student" else None
            default_maj = "B.S. Computer Science" if u["role"] == "Student" else None
            default_yr = "Year 2" if u["role"] == "Student" else None
            default_dept = f"{default_maj} ({default_yr})" if u["role"] == "Student" else "Academic Department"
            cursor.execute(
                """
                UPDATE Users SET
                    student_id = COALESCE(NULLIF(student_id, ''), ?),
                    major = COALESCE(NULLIF(major, ''), ?),
                    academic_year = COALESCE(NULLIF(academic_year, ''), ?),
                    department = COALESCE(NULLIF(department, ''), ?),
                    status = COALESCE(NULLIF(status, ''), 'Active')
                WHERE id = ?;
                """,
                (default_sid, default_maj, default_yr, default_dept, u["id"]),
            )

    cursor.execute("SELECT id FROM Users WHERE role = 'Instructor';")
    for inst in cursor.fetchall():
        cursor.execute("SELECT COUNT(*) as cnt FROM Instructor_Courses WHERE instructor_id = ?;", (inst["id"],))
        if cursor.fetchone()["cnt"] == 0:
            cursor.execute("SELECT id FROM Courses WHERE course_code IN ('CS-301', 'CS-402');")
            for c in cursor.fetchall():
                cursor.execute(
                    "INSERT OR IGNORE INTO Instructor_Courses (instructor_id, course_id) VALUES (?, ?);",
                    (inst["id"], c["id"]),
                )


def init_database(db_path=DB_FILE):
    """Create tables, safely migrate existing schemas, and seed initial institutional data."""
    with DBConnection(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('Student', 'Instructor', 'Advisor', 'Administrator')),
            student_id TEXT,
            major TEXT,
            academic_year TEXT,
            department TEXT,
            status TEXT DEFAULT 'Active'
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_name TEXT UNIQUE NOT NULL,
            course_code TEXT,
            title TEXT,
            room TEXT DEFAULT 'Hall B-12'
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Enrollments (
            user_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            PRIMARY KEY (user_id, course_id),
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
        );
        """)

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

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('Present', 'Late', 'Absent', 'Excused')),
            time_logged TEXT NOT NULL,
            updated_by INTEGER,
            method TEXT DEFAULT 'PIN Input',
            FOREIGN KEY (session_id) REFERENCES Sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (updated_by) REFERENCES Users(id) ON DELETE SET NULL,
            UNIQUE(session_id, student_id)
        );
        """)

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

        created_bug_table = _migrate_schema(cursor)

        cursor.execute("SELECT COUNT(*) as count FROM Users;")
        if cursor.fetchone()["count"] == 0:
            _seed_mock_data(cursor)

        _backfill_migrated_data(cursor)
        if created_bug_table:
            _seed_default_jira_bugs(cursor)


def _seed_mock_data(cursor):
    """Seed comprehensive institutional users, courses, and records."""
    pw_hash = hash_password("password123")

    users = [
        ("a.rivera@university.edu", pw_hash, "Alex Rivera", "Student", "24091", "B.S. Software Engineering", "Year 3", "B.S. Software Engineering (Year 3)", "Active"),
        ("dr.vance@university.edu", pw_hash, "Dr. Evelyn Vance", "Instructor", None, None, None, "Faculty of Engineering", "Active"),
        ("m.brody@university.edu", pw_hash, "Marcus Brody", "Advisor", None, None, None, "Student Support Services", "Active"),
        ("sysadmin@university.edu", pw_hash, "Root Systems Admin", "Administrator", None, None, None, "Global Campus Administration", "Active"),
        ("d.kim@university.edu", pw_hash, "David Kim", "Student", "24108", "B.Eng. Computer Engineering", "Year 2", "B.Eng. Computer Engineering (Year 2)", "Flagged (EWS)"),
        ("s.jenkins@university.edu", pw_hash, "Sarah Jenkins", "Student", "24094", "B.S. Computer Science", "Year 2", "B.S. Computer Science (Year 2)", "Flagged (EWS)"),
        ("a.patel@university.edu", pw_hash, "Amira Patel", "Student", "24097", "B.S. Data Science & AI", "Year 3", "B.S. Data Science & AI (Year 3)", "Active"),
        ("c.mendez@university.edu", pw_hash, "Carlos Mendez", "Student", "24098", "B.S. Computer Science", "Year 2", "B.S. Computer Science (Year 2)", "Active"),
        ("j.mercer@university.edu", pw_hash, "Julian Mercer", "Student", "24099", "B.S. Information Security", "Year 3", "B.S. Information Security (Year 3)", "Active"),
        ("k.vance@university.edu", pw_hash, "Kassandra Vance", "Student", "24100", "B.S. Software Engineering", "Year 1", "B.S. Software Engineering (Year 1)", "Active"),
        ("t.almansoor@university.edu", pw_hash, "Tariq Al-Mansoor", "Student", "24101", "B.Eng. Computer Engineering", "Year 4", "B.Eng. Computer Engineering (Year 4)", "Active"),
        ("e.wu@university.edu", pw_hash, "Elena Wu", "Student", "24102", "B.S. Software Engineering", "Year 3", "B.S. Software Engineering (Year 3)", "Active"),
    ]
    cursor.executemany(
        """
        INSERT INTO Users (email, password_hash, full_name, role, student_id, major, academic_year, department, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        users,
    )

    courses = [
        ("CS-301: Advanced Data Structures", "CS-301", "Advanced Data Structures", "Hall B-12"),
        ("ENG-204: Technical Communication", "ENG-204", "Technical Communication", "Hall A-08"),
        ("MATH-310: Linear Algebra", "MATH-310", "Linear Algebra", "Hall C-14"),
        ("PHY-102: Engineering Physics II", "PHY-102", "Engineering Physics II", "Science Lab 102"),
        ("CS-402: Cloud Architecture & DevOps", "CS-402", "Cloud Architecture & DevOps", "Lab 201"),
    ]
    cursor.executemany(
        "INSERT INTO Courses (course_name, course_code, title, room) VALUES (?, ?, ?, ?);",
        courses,
    )

    student_ids = [1, 5, 6, 7, 8, 9, 10, 11, 12]
    course_ids = [1, 2, 3, 4]
    enrollments = [(sid, cid) for sid in student_ids for cid in course_ids]
    cursor.executemany("INSERT INTO Enrollments (user_id, course_id) VALUES (?, ?);", enrollments)

    cursor.executemany(
        "INSERT OR IGNORE INTO Instructor_Courses (instructor_id, course_id) VALUES (?, ?);",
        [(2, 1), (2, 5)],
    )

    now = datetime.now()
    cursor.execute(
        "INSERT INTO Sessions (course_id, session_code, start_time, is_active) VALUES (?, ?, ?, 1);",
        (1, "849-210", now.strftime("%Y-%m-%d %H:%M:%S")),
    )
    active_session_id = cursor.lastrowid

    session_attendances = [
        (active_session_id, 1, "Present", (now - timedelta(minutes=2)).strftime("%Y-%m-%d %H:%M:%S"), None, "PIN Input"),
        (active_session_id, 5, "Absent", (now - timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M:%S"), None, "Pending"),
        (active_session_id, 6, "Absent", (now - timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M:%S"), None, "Pending"),
        (active_session_id, 7, "Present", (now - timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M:%S"), None, "PIN Input"),
        (active_session_id, 8, "Late", (now - timedelta(minutes=18)).strftime("%Y-%m-%d %H:%M:%S"), None, "PIN Input"),
        (active_session_id, 12, "Present", (now - timedelta(minutes=4)).strftime("%Y-%m-%d %H:%M:%S"), 2, "Manual Override"),
    ]
    cursor.executemany(
        "INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by, method) VALUES (?, ?, ?, ?, ?, ?);",
        session_attendances,
    )

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
                (cid, f"PIN{i:03d}", s_time),
            )
            s_id = cursor.lastrowid
            cursor.execute(
                "INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by) VALUES (?, ?, ?, ?, NULL);",
                (s_id, 1, st, s_time),
            )

    for i in range(15):
        s_time = (now - timedelta(days=20 - i)).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "INSERT INTO Sessions (course_id, session_code, start_time, is_active) VALUES (?, ?, ?, 0);",
            (4, f"DK{i:03d}", s_time),
        )
        s_id = cursor.lastrowid
        st = "Absent" if i >= 11 else ("Late" if i == 5 else "Present")
        cursor.execute(
            "INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by) VALUES (?, ?, ?, ?, NULL);",
            (s_id, 5, st, s_time),
        )

    for i in range(10):
        s_time = (now - timedelta(days=15 - i)).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "INSERT INTO Sessions (course_id, session_code, start_time, is_active) VALUES (?, ?, ?, 0);",
            (1, f"SJ{i:03d}", s_time),
        )
        s_id = cursor.lastrowid
        st = "Absent" if i >= 7 else "Present"
        cursor.execute(
            "INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by) VALUES (?, ?, ?, ?, NULL);",
            (s_id, 6, st, s_time),
        )

    excuses = [
        (6, 1, now.strftime("%Y-%m-%d"), "Hospitalized for acute flu treatment.", "Pending"),
        (5, 4, (now - timedelta(days=1)).strftime("%Y-%m-%d"), "Transit bus breakdown on route 08.", "Approved"),
        (9, 1, (now - timedelta(days=2)).strftime("%Y-%m-%d"), "Academic conference paper presentation.", "Pending"),
    ]
    cursor.executemany(
        "INSERT INTO Excuses (student_id, course_id, date_absent, reason, status) VALUES (?, ?, ?, ?, ?);",
        excuses,
    )

    notes = [
        (5, 3, "Met with student via virtual office hours regarding PHY-102 attendance dip. Coordinated lab makeup protocol.", (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")),
        (6, 3, "Early warning dispatch triggered for Sarah Jenkins after 3 consecutive missed classes. Scheduled 1-on-1 counseling sync.", (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")),
    ]
    cursor.executemany(
        "INSERT INTO Counseling_Notes (student_id, advisor_id, note_text, created_at) VALUES (?, ?, ?, ?);",
        notes,
    )

    utc_now = datetime.utcnow()
    audit = [
        (2, "Start Attendance Session", (utc_now - timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S"), "Instructor Dr. Vance initiated session CS-301 (PIN: 849-210)."),
        (1, "Direct PIN Check-in", (utc_now - timedelta(minutes=2)).strftime("%Y-%m-%d %H:%M:%S"), "Alex Rivera checked in with token 849-210 (Status: Present)."),
        (4, "System Initialized", (utc_now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"), "Python OOP domain layer and SQLite persistence initialized."),
    ]
    cursor.executemany(
        "INSERT INTO Audit_Logs (user_id, action, timestamp, details) VALUES (?, ?, ?, ?);",
        audit,
    )


def _seed_default_jira_bugs(cursor):
    """Seed initial sample Jira defect records aligned with TESTING_DOCUMENT.md."""
    cursor.execute("SELECT COUNT(*) as cnt FROM Bug_Reports;")
    if cursor.fetchone()["cnt"] > 0:
        return
    cursor.execute("SELECT id FROM Users WHERE role = 'Administrator' ORDER BY id ASC LIMIT 1;")
    admin_row = cursor.fetchone()
    rep_id = admin_row["id"] if admin_row else None
    utc_now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    sample_bugs = [
        (
            "SAS-1",
            "Student live banner timer drifted 2s before UTC sync patch",
            "Steps:\n1. Open instructor.html and start CS-301 session.\n2. Observe student.html countdown.\nExpected: Synced with server UTC time.\nActual: Fixed via serverTimeOffsetMs synchronization.",
            "TC10",
            "Student Portal",
            "High",
            "Major",
            "Done",
            rep_id,
            "Frontend View Team",
            None,
            "Local Jira Queue",
            utc_now,
            utc_now,
        ),
        (
            "SAS-2",
            "Verify consecutive absence count resets after Excused override",
            "Steps:\n1. Student accumulates 3 consecutive Absent rows.\n2. Instructor approves excuse or overrides status to Excused.\nExpected: EWS risk level recalculates immediately.",
            "TC27",
            "Advisor EWS",
            "Medium",
            "Minor",
            "In Review",
            rep_id,
            "Backend MVC Team",
            None,
            "Local Jira Queue",
            utc_now,
            utc_now,
        ),
    ]
    cursor.executemany(
        """
        INSERT INTO Bug_Reports (
            issue_key, summary, description, test_case_id, module,
            priority, severity, status, reporter_id, assignee,
            jira_remote_key, jira_sync_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        sample_bugs,
    )
