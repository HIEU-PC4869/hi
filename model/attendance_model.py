"""
model/attendance_model.py - MVC Model Component (Data & CRUD Operations)
SAS Enterprise - Student Attendance & Intelligence System

Strictly adheres to Chapter 3 MVC Model definition (Slide 17):
"The Model component manages system data and the operations associated with that data."
All SQLite queries, transactions, and entity hydration live exclusively inside this module.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from model.database import DBConnection, hash_password, init_database
from model.entities import (
    AttendanceRecord,
    AttendanceSession,
    AuditLog,
    CounselingNote,
    Course,
    Enrollment,
    ExcuseRequest,
    JiraBugReport,
    User,
    UserFactory,
)


class AttendanceModel:
    """Unified MVC Model encapsulating all SQLite CRUD operations and entity hydration."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path
        init_database(db_path) if db_path else init_database()

    def _connect(self) -> DBConnection:
        return DBConnection(self.db_path) if self.db_path else DBConnection()

    @staticmethod
    def utc_now_str() -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def _resolve_course_id(cursor, course_ref: Any) -> Optional[int]:
        if course_ref is None:
            return None
        if isinstance(course_ref, int) or (isinstance(course_ref, str) and course_ref.isdigit()):
            cursor.execute("SELECT id FROM Courses WHERE id = ?;", (int(course_ref),))
            row = cursor.fetchone()
            return row["id"] if row else None
        code = str(course_ref).split(":")[0].strip().upper()
        cursor.execute(
            "SELECT id FROM Courses WHERE UPPER(course_code) = ? OR UPPER(course_name) LIKE ?;",
            (code, f"{code}%"),
        )
        row = cursor.fetchone()
        return row["id"] if row else None

    @staticmethod
    def _resolve_user_id(cursor, user_ref: Any) -> Optional[int]:
        if user_ref is None:
            return None
        if isinstance(user_ref, int) or (isinstance(user_ref, str) and user_ref.isdigit()):
            num = int(user_ref)
            cursor.execute("SELECT id FROM Users WHERE id = ? OR student_id = ?;", (num, str(user_ref)))
            row = cursor.fetchone()
            return row["id"] if row else None
        cursor.execute(
            "SELECT id FROM Users WHERE student_id = ? OR LOWER(email) = ?;",
            (str(user_ref), str(user_ref).lower()),
        )
        row = cursor.fetchone()
        return row["id"] if row else None

    @staticmethod
    def _get_user_courses_codes(cursor, user_id: int, role: str) -> List[str]:
        if role == "Instructor":
            cursor.execute(
                """
                SELECT COALESCE(c.course_code, c.course_name) as code_or_name
                FROM Courses c
                JOIN Instructor_Courses ic ON c.id = ic.course_id
                WHERE ic.instructor_id = ?
                ORDER BY c.id ASC;
                """,
                (user_id,),
            )
            codes = [r["code_or_name"].split(":")[0].strip().upper() for r in cursor.fetchall()]
            return codes or ["CS-301", "CS-402"]
        if role == "Student":
            cursor.execute(
                """
                SELECT COALESCE(c.course_code, c.course_name) as code_or_name
                FROM Courses c
                JOIN Enrollments e ON c.id = e.course_id
                WHERE e.user_id = ?
                ORDER BY c.id ASC;
                """,
                (user_id,),
            )
            return [r["code_or_name"].split(":")[0].strip().upper() for r in cursor.fetchall()]
        return []

    def _insert_audit(self, cursor, user_id: Optional[int], action: str, details: str) -> None:
        cursor.execute(
            "INSERT INTO Audit_Logs (user_id, action, timestamp, details) VALUES (?, ?, ?, ?);",
            (user_id, action, self.utc_now_str(), details),
        )

    # ---------------------------------------------------------
    # Audit CRUD
    # ---------------------------------------------------------
    def insert_audit_log(self, user_id: Optional[int], action: str, details: str) -> None:
        with self._connect() as conn:
            self._insert_audit(conn.cursor(), user_id, action, details)

    def list_audit_logs(self, limit: int = 50) -> List[AuditLog]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT a.id, a.user_id, a.timestamp, a.action, a.details, u.email, u.full_name
                FROM Audit_Logs a
                LEFT JOIN Users u ON a.user_id = u.id
                ORDER BY a.id DESC LIMIT ?;
                """,
                (limit,),
            )
            return [
                AuditLog(
                    log_id=r["id"],
                    user_id=r["user_id"],
                    action=r["action"],
                    timestamp=r["timestamp"],
                    details=r["details"] or "",
                    full_name=r["full_name"],
                    email=r["email"],
                )
                for r in cursor.fetchall()
            ]

    # ---------------------------------------------------------
    # Users CRUD
    # ---------------------------------------------------------
    def find_user_by_email(self, email: str) -> Optional[User]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, email, password_hash, full_name, role,
                       student_id, major, academic_year, department, status
                FROM Users
                WHERE LOWER(email) = ?;
                """,
                (email.strip().lower(),),
            )
            row = cursor.fetchone()
            if not row:
                return None
            courses = self._get_user_courses_codes(cursor, row["id"], row["role"])
            return UserFactory.from_row(row, courses=courses)

    def find_user_by_id(self, user_id: int) -> Optional[User]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, email, password_hash, full_name, role,
                       student_id, major, academic_year, department, status
                FROM Users WHERE id = ?;
                """,
                (user_id,),
            )
            row = cursor.fetchone()
            if not row:
                return None
            courses = self._get_user_courses_codes(cursor, row["id"], row["role"])
            return UserFactory.from_row(row, courses=courses)

    def list_users(self) -> List[User]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, email, password_hash, full_name, role,
                       student_id, major, academic_year, department, status
                FROM Users ORDER BY id ASC;
                """
            )
            rows = cursor.fetchall()
            return [
                UserFactory.from_row(r, courses=self._get_user_courses_codes(cursor, r["id"], r["role"]))
                for r in rows
            ]

    def create_user(
        self,
        email: str,
        pw_hash: str,
        full_name: str,
        role: str,
        stu_code: Optional[str],
        major: Optional[str],
        academic_year: Optional[str],
        department: str,
        courses: Optional[List[str]] = None,
        actor_id: Optional[int] = None,
    ) -> int:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO Users (email, password_hash, full_name, role, student_id, major, academic_year, department, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active');
                """,
                (email, pw_hash, full_name, role, stu_code, major, academic_year, department),
            )
            new_id = cursor.lastrowid

            if role == "Student":
                target_courses = courses or ["CS-301", "ENG-204", "MATH-310"]
                for code in target_courses:
                    cid = self._resolve_course_id(cursor, code)
                    if cid:
                        cursor.execute(
                            "INSERT OR IGNORE INTO Enrollments (user_id, course_id) VALUES (?, ?);",
                            (new_id, cid),
                        )
            elif role == "Instructor":
                assigned = courses or ["CS-301", "CS-402"]
                for code in assigned:
                    c_code = code.split(":")[0].strip().upper()
                    if not c_code:
                        continue
                    cid = self._resolve_course_id(cursor, c_code)
                    if not cid:
                        cursor.execute(
                            "INSERT INTO Courses (course_name, course_code, title, room) VALUES (?, ?, ?, 'Hall B-12');",
                            (f"{c_code}: Elective Offering", c_code, "Elective Offering"),
                        )
                        cid = cursor.lastrowid
                    cursor.execute(
                        "INSERT OR IGNORE INTO Instructor_Courses (instructor_id, course_id) VALUES (?, ?);",
                        (new_id, cid),
                    )

            self._insert_audit(
                cursor,
                actor_id,
                "Create User Account",
                f"{email} ({role}{' • ID #' + stu_code if stu_code else ''}) • Password configured",
            )
            return new_id

    def update_user_record(
        self,
        user_id: int,
        email: str,
        full_name: str,
        role: str,
        status: str,
        password: Optional[str] = None,
        student_id: Optional[str] = None,
        major: Optional[str] = None,
        academic_year: Optional[str] = None,
        department: Optional[str] = None,
        courses: Optional[List[str]] = None,
        actor_id: Optional[int] = None,
    ) -> Optional[str]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM Users WHERE id = ?;", (user_id,))
            existing = cursor.fetchone()
            if not existing:
                return None

            new_student_id = student_id if student_id is not None else existing["student_id"]
            new_major = major if major is not None else existing["major"]
            new_year = academic_year if academic_year is not None else existing["academic_year"]
            if role == "Student" and new_major and new_year:
                new_dept = department or f"{new_major} ({new_year})"
            else:
                new_dept = department if department is not None else existing["department"]

            cursor.execute(
                """
                UPDATE Users
                SET email = ?, full_name = ?, role = ?, status = ?,
                    student_id = ?, major = ?, academic_year = ?, department = ?
                WHERE id = ?;
                """,
                (email, full_name, role, status or "Active", new_student_id, new_major, new_year, new_dept, user_id),
            )

            pw_note = ""
            if password and password.strip():
                cursor.execute(
                    "UPDATE Users SET password_hash = ? WHERE id = ?;",
                    (hash_password(password.strip()), user_id),
                )
                pw_note = " + password reset"

            if role == "Instructor" and courses is not None:
                cursor.execute("DELETE FROM Instructor_Courses WHERE instructor_id = ?;", (user_id,))
                for code in courses:
                    c_code = code.split(":")[0].strip().upper()
                    if not c_code:
                        continue
                    cid = self._resolve_course_id(cursor, c_code)
                    if not cid:
                        cursor.execute(
                            "INSERT INTO Courses (course_name, course_code, title, room) VALUES (?, ?, ?, 'Hall B-12');",
                            (f"{c_code}: Lecture Session", c_code, "Lecture Session"),
                        )
                        cid = cursor.lastrowid
                    cursor.execute(
                        "INSERT OR IGNORE INTO Instructor_Courses (instructor_id, course_id) VALUES (?, ?);",
                        (user_id, cid),
                    )

            self._insert_audit(
                cursor,
                actor_id,
                "Modify User Record",
                f"Updated User #{user_id} ({full_name}, {role}, {status}){pw_note}",
            )
            return f"User #{user_id} ({full_name}) updated successfully."

    def delete_user_record(self, user_id: int, actor_id: Optional[int] = None) -> None:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Users WHERE id = ?;", (user_id,))
            self._insert_audit(cursor, actor_id, "Deprovision User", f"User ID #{user_id} deleted.")

    # ---------------------------------------------------------
    # Sessions & Attendance CRUD
    # ---------------------------------------------------------
    def find_active_session(self, course_ref: Optional[Any] = None) -> Optional[AttendanceSession]:
        with self._connect() as conn:
            cursor = conn.cursor()
            if course_ref is not None:
                cid = self._resolve_course_id(cursor, course_ref)
                if not cid:
                    return None
                cursor.execute(
                    """
                    SELECT s.id, s.course_id, s.session_code, s.start_time, s.is_active,
                           COALESCE(c.course_code, c.course_name) as course_code, c.course_name
                    FROM Sessions s
                    JOIN Courses c ON s.course_id = c.id
                    WHERE s.course_id = ? AND s.is_active = 1
                    ORDER BY s.id DESC LIMIT 1;
                    """,
                    (cid,),
                )
            else:
                cursor.execute(
                    """
                    SELECT s.id, s.course_id, s.session_code, s.start_time, s.is_active,
                           COALESCE(c.course_code, c.course_name) as course_code, c.course_name
                    FROM Sessions s
                    JOIN Courses c ON s.course_id = c.id
                    WHERE s.is_active = 1
                    ORDER BY s.id DESC LIMIT 1;
                    """
                )
            row = cursor.fetchone()
            if not row:
                return None
            return AttendanceSession(
                session_id=row["id"],
                course_id=row["course_id"],
                session_code=row["session_code"],
                start_time=row["start_time"],
                is_active=bool(row["is_active"]),
                course_code=(row["course_code"] or "").split(":")[0].strip().upper(),
                course_name=row["course_name"],
            )

    def resolve_course_and_student(self, course_ref: Any, student_ref: Any) -> Dict[str, Optional[int]]:
        with self._connect() as conn:
            cursor = conn.cursor()
            return {
                "course_id": self._resolve_course_id(cursor, course_ref),
                "student_id": self._resolve_user_id(cursor, student_ref),
            }

    def record_checkin(
        self,
        session_id: int,
        student_id: int,
        status: str,
        time_logged: str,
        course_code: str,
        entered_token: str,
    ) -> None:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by, method)
                VALUES (?, ?, ?, ?, NULL, 'PIN Input')
                ON CONFLICT(session_id, student_id) DO UPDATE SET
                    status = excluded.status,
                    time_logged = excluded.time_logged,
                    method = 'PIN Input',
                    updated_by = NULL;
                """,
                (session_id, student_id, status, time_logged),
            )
            self._insert_audit(
                cursor,
                student_id,
                "Direct PIN Check-in",
                f"Course {course_code}: Status {status} via verified PIN [{entered_token.strip()}]",
            )

    def create_session(
        self,
        course_ref: Any,
        pin: str,
        now_str: str,
        instructor_id: Optional[int] = None,
    ) -> AttendanceSession:
        with self._connect() as conn:
            cursor = conn.cursor()
            resolved_cid = self._resolve_course_id(cursor, course_ref)
            if not resolved_cid:
                raise ValueError(f"Unknown course reference: {course_ref}")

            cursor.execute("UPDATE Sessions SET is_active = 0 WHERE is_active = 1;")
            cursor.execute(
                "INSERT INTO Sessions (course_id, session_code, start_time, is_active) VALUES (?, ?, ?, 1);",
                (resolved_cid, pin, now_str),
            )
            session_id = cursor.lastrowid

            cursor.execute("SELECT user_id FROM Enrollments WHERE course_id = ?;", (resolved_cid,))
            for stu in cursor.fetchall():
                cursor.execute(
                    """
                    INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by, method)
                    VALUES (?, ?, 'Absent', ?, NULL, 'Pending')
                    ON CONFLICT(session_id, student_id) DO NOTHING;
                    """,
                    (session_id, stu["user_id"], now_str),
                )

            cursor.execute("SELECT course_name, course_code FROM Courses WHERE id = ?;", (resolved_cid,))
            c_row = cursor.fetchone()
            course_code = (c_row["course_code"] or c_row["course_name"].split(":")[0]).strip()
            course_name = c_row["course_name"]

            self._insert_audit(
                cursor,
                instructor_id,
                "Start Attendance Session",
                f"Generated new dynamic PIN: {pin} for {course_code} ({course_name})",
            )
            return AttendanceSession(
                session_id=session_id,
                course_id=resolved_cid,
                session_code=pin,
                start_time=now_str,
                is_active=True,
                course_code=course_code,
                course_name=course_name,
            )

    def close_sessions(self, session_id: Optional[int] = None, instructor_id: Optional[int] = None) -> None:
        with self._connect() as conn:
            cursor = conn.cursor()
            if session_id:
                cursor.execute("UPDATE Sessions SET is_active = 0 WHERE id = ?;", (session_id,))
                detail = f"Closed session #{session_id}"
            else:
                cursor.execute("UPDATE Sessions SET is_active = 0 WHERE is_active = 1;")
                detail = "Attendance roster finalized and locked"
            self._insert_audit(cursor, instructor_id, "End Attendance Session", detail)

    def list_roster_records(self, course_ref: Optional[Any] = None) -> List[AttendanceRecord]:
        with self._connect() as conn:
            cursor = conn.cursor()
            session_id = None
            if course_ref is not None:
                resolved_cid = self._resolve_course_id(cursor, course_ref)
                if resolved_cid:
                    cursor.execute(
                        "SELECT id FROM Sessions WHERE course_id = ? ORDER BY id DESC LIMIT 1;",
                        (resolved_cid,),
                    )
                    s_row = cursor.fetchone()
                    if s_row:
                        session_id = s_row["id"]
            else:
                cursor.execute("SELECT id FROM Sessions WHERE is_active = 1 ORDER BY id DESC LIMIT 1;")
                s_row = cursor.fetchone()
                if not s_row:
                    cursor.execute("SELECT id FROM Sessions ORDER BY id DESC LIMIT 1;")
                    s_row = cursor.fetchone()
                if s_row:
                    session_id = s_row["id"]

            if not session_id:
                return []

            cursor.execute(
                """
                SELECT a.id as attendance_id, a.session_id, u.id as student_id,
                       u.student_id as student_code, u.full_name, u.email,
                       a.status, a.time_logged, a.updated_by, COALESCE(a.method, 'PIN Input') as method,
                       updater.full_name as updated_by_name
                FROM Attendance a
                JOIN Users u ON a.student_id = u.id
                LEFT JOIN Users updater ON a.updated_by = updater.id
                WHERE a.session_id = ?
                ORDER BY u.full_name ASC;
                """,
                (session_id,),
            )
            return [
                AttendanceRecord(
                    record_id=r["attendance_id"],
                    session_id=r["session_id"],
                    student_id=r["student_id"],
                    status=r["status"],
                    time_logged=r["time_logged"],
                    updated_by=r["updated_by"],
                    student_name=r["full_name"],
                    student_code=r["student_code"] or str(r["student_id"]),
                    email=r["email"],
                    method=r["method"],
                    updated_by_name=(
                        f"{r['updated_by_name']} (Override)"
                        if r["updated_by_name"]
                        else ("System Auto" if r["status"] == "Absent" else "Self (PIN)")
                    ),
                )
                for r in cursor.fetchall()
            ]

    def update_attendance_override(
        self, attendance_id: int, new_status: str, instructor_id: int, now_str: str
    ) -> None:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE Attendance
                SET status = ?, updated_by = ?, time_logged = ?, method = 'Manual Override'
                WHERE id = ?;
                """,
                (new_status, instructor_id, now_str, attendance_id),
            )
            self._insert_audit(
                cursor,
                instructor_id,
                "Manual Attendance Override",
                f"Attendance ID #{attendance_id} marked as {new_status}",
            )

    def get_student_enrolled_course_counts(self, student_ref: Any) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            cursor = conn.cursor()
            resolved_sid = self._resolve_user_id(cursor, student_ref) or int(student_ref)
            cursor.execute(
                """
                SELECT c.id as course_id, c.course_name, c.course_code, c.title
                FROM Courses c
                JOIN Enrollments e ON c.id = e.course_id
                WHERE e.user_id = ?
                ORDER BY c.course_name ASC;
                """,
                (resolved_sid,),
            )
            results: List[Dict[str, Any]] = []
            for c in cursor.fetchall():
                cid = c["course_id"]
                cursor.execute(
                    """
                    SELECT a.status, COUNT(*) as cnt
                    FROM Attendance a
                    JOIN Sessions s ON a.session_id = s.id
                    WHERE s.course_id = ? AND a.student_id = ?
                    GROUP BY a.status;
                    """,
                    (cid, resolved_sid),
                )
                counts = {row["status"]: row["cnt"] for row in cursor.fetchall()}
                total_sessions = sum(counts.values())
                if total_sessions == 0:
                    cursor.execute("SELECT COUNT(*) as cnt FROM Sessions WHERE course_id = ?;", (cid,))
                    total_sessions = cursor.fetchone()["cnt"]
                    counts["Absent"] = total_sessions
                results.append(
                    {
                        "course_id": cid,
                        "course_name": c["course_name"],
                        "course_code": c["course_code"],
                        "title": c["title"],
                        "counts": counts,
                        "total_sessions": total_sessions,
                    }
                )
            return results

    # ---------------------------------------------------------
    # Excuses CRUD
    # ---------------------------------------------------------
    def create_excuse(self, student_ref: Any, course_ref: Any, date_absent: str, reason: str) -> Optional[int]:
        with self._connect() as conn:
            cursor = conn.cursor()
            resolved_sid = self._resolve_user_id(cursor, student_ref) or int(student_ref)
            resolved_cid = self._resolve_course_id(cursor, course_ref)
            if not resolved_cid:
                return None

            excuse_obj = ExcuseRequest(
                excuse_id=None,
                student_id=resolved_sid,
                course_id=resolved_cid,
                date_absent=date_absent,
                reason=reason.strip(),
                status="Pending",
            )
            cursor.execute(
                "INSERT INTO Excuses (student_id, course_id, date_absent, reason, status) VALUES (?, ?, ?, ?, 'Pending');",
                (resolved_sid, resolved_cid, date_absent, excuse_obj.to_dict()["reason"]),
            )
            new_id = cursor.lastrowid
            self._insert_audit(
                cursor,
                resolved_sid,
                "Submit Absence Excuse",
                f"Course ID #{resolved_cid} ({date_absent}): {reason.strip()[:45]}",
            )
            return new_id

    def list_excuses(self, course_ref: Optional[Any] = None) -> List[ExcuseRequest]:
        with self._connect() as conn:
            cursor = conn.cursor()
            base_sql = """
                SELECT e.id as excuse_id, u.full_name as student_name, u.student_id as student_code,
                       c.course_name, e.date_absent, e.reason, e.status, e.student_id, e.course_id
                FROM Excuses e
                JOIN Users u ON e.student_id = u.id
                JOIN Courses c ON e.course_id = c.id
            """
            if course_ref is not None:
                resolved_cid = self._resolve_course_id(cursor, course_ref)
                cursor.execute(base_sql + " WHERE e.course_id = ? ORDER BY e.id DESC;", (resolved_cid,))
            else:
                cursor.execute(base_sql + " ORDER BY e.id DESC;")

            return [
                ExcuseRequest(
                    excuse_id=r["excuse_id"],
                    student_id=r["student_id"],
                    course_id=r["course_id"],
                    date_absent=r["date_absent"],
                    reason=r["reason"],
                    status=r["status"],
                    student_name=r["student_name"],
                    student_code=r["student_code"] or str(r["student_id"]),
                    course_name=r["course_name"],
                )
                for r in cursor.fetchall()
            ]

    def list_student_excuses(self, student_ref: Any) -> List[ExcuseRequest]:
        with self._connect() as conn:
            cursor = conn.cursor()
            resolved_sid = self._resolve_user_id(cursor, student_ref) or int(student_ref)
            cursor.execute(
                """
                SELECT ex.id, ex.student_id, ex.course_id, c.course_name, ex.date_absent, ex.reason, ex.status
                FROM Excuses ex
                JOIN Courses c ON ex.course_id = c.id
                WHERE ex.student_id = ?
                ORDER BY ex.id DESC;
                """,
                (resolved_sid,),
            )
            return [
                ExcuseRequest(
                    excuse_id=r["id"],
                    student_id=r["student_id"],
                    course_id=r["course_id"],
                    date_absent=r["date_absent"],
                    reason=r["reason"],
                    status=r["status"],
                    course_name=r["course_name"],
                )
                for r in cursor.fetchall()
            ]

    def update_excuse_decision(self, excuse_id: int, decision: str, instructor_id: int) -> None:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE Excuses SET status = ? WHERE id = ?;", (decision, excuse_id))
            if decision == "Approved":
                cursor.execute("SELECT student_id, course_id, date_absent FROM Excuses WHERE id = ?;", (excuse_id,))
                exc = cursor.fetchone()
                if exc:
                    cursor.execute(
                        """
                        UPDATE Attendance
                        SET status = 'Excused', updated_by = ?, method = 'Excuse Verified'
                        WHERE student_id = ? AND session_id IN (
                            SELECT id FROM Sessions WHERE course_id = ? AND start_time LIKE ?
                        );
                        """,
                        (instructor_id, exc["student_id"], exc["course_id"], f"{exc['date_absent']}%"),
                    )
            action = "Approve Excuse Request" if decision == "Approved" else "Reject Excuse Request"
            self._insert_audit(cursor, instructor_id, action, f"Excuse #{excuse_id} marked as {decision}")

    # ---------------------------------------------------------
    # Courses & Enrollments CRUD
    # ---------------------------------------------------------
    def list_courses(self) -> List[Course]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, course_name, course_code, title, room FROM Courses ORDER BY id ASC;")
            return [
                Course(
                    course_id=r["id"],
                    course_name=r["course_name"],
                    course_code=r["course_code"],
                    title=r["title"],
                    room=r["room"] or "Hall B-12",
                )
                for r in cursor.fetchall()
            ]

    def create_course(
        self, full_title: str, code: str, title: str, room: str, actor_id: Optional[int] = None
    ) -> int:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO Courses (course_name, course_code, title, room) VALUES (?, ?, ?, ?);",
                (full_title, code, title, room or "Hall B-12"),
            )
            c_id = cursor.lastrowid
            self._insert_audit(cursor, actor_id, "Register Course Offering", f"Registered #{c_id}: {full_title}")
            return c_id

    def delete_course_record(self, course_ref: Any, actor_id: Optional[int] = None) -> bool:
        with self._connect() as conn:
            cursor = conn.cursor()
            cid = self._resolve_course_id(cursor, course_ref)
            if not cid:
                return False
            cursor.execute("DELETE FROM Courses WHERE id = ?;", (cid,))
            self._insert_audit(cursor, actor_id, "Remove Course Offering", f"Course ID #{cid} deleted.")
            return True

    def assign_course_to_instructor(
        self, instructor_id: int, code: str, title: str, full_name: str, room: str
    ) -> None:
        with self._connect() as conn:
            cursor = conn.cursor()
            cid = self._resolve_course_id(cursor, code)
            if not cid:
                cursor.execute(
                    "INSERT INTO Courses (course_name, course_code, title, room) VALUES (?, ?, ?, ?);",
                    (full_name, code, title or "Lecture Session", room or "Hall B-12"),
                )
                cid = cursor.lastrowid
            cursor.execute(
                "INSERT OR IGNORE INTO Instructor_Courses (instructor_id, course_id) VALUES (?, ?);",
                (instructor_id, cid),
            )
            self._insert_audit(
                cursor,
                instructor_id,
                "Course Assigned to Instructor",
                f"Assigned {full_name} ({room}) to Instructor #{instructor_id}",
            )

    def list_enrollments(self) -> List[Enrollment]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT e.user_id, u.full_name as student_name, e.course_id, c.course_name
                FROM Enrollments e
                JOIN Users u ON e.user_id = u.id
                JOIN Courses c ON e.course_id = c.id
                ORDER BY u.full_name ASC;
                """
            )
            return [
                Enrollment(
                    user_id=r["user_id"],
                    course_id=r["course_id"],
                    student_name=r["student_name"],
                    course_name=r["course_name"],
                )
                for r in cursor.fetchall()
            ]

    def create_enrollment(
        self, user_id: int, course_ref: Any, semester: str, actor_id: Optional[int] = None
    ) -> bool:
        with self._connect() as conn:
            cursor = conn.cursor()
            cid = self._resolve_course_id(cursor, course_ref)
            if not cid:
                return False
            cursor.execute("INSERT OR IGNORE INTO Enrollments (user_id, course_id) VALUES (?, ?);", (int(user_id), cid))
            self._insert_audit(
                cursor,
                actor_id,
                "Enroll Student in Course",
                f"Enrolled User #{user_id} into Course #{cid} ({semester})",
            )
            return True

    def delete_enrollment_record(
        self, user_id: int, course_ref: Any, actor_id: Optional[int] = None
    ) -> None:
        with self._connect() as conn:
            cursor = conn.cursor()
            cid = self._resolve_course_id(cursor, course_ref) or int(course_ref)
            cursor.execute("DELETE FROM Enrollments WHERE user_id = ? AND course_id = ?;", (int(user_id), cid))
            self._insert_audit(
                cursor,
                actor_id,
                "Drop Student Enrollment",
                f"Dropped User #{user_id} from Course #{cid}",
            )

    # ---------------------------------------------------------
    # Advisor EWS & Counseling Notes Queries
    # ---------------------------------------------------------
    def get_ews_raw_student_metrics(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, full_name, email, student_id FROM Users WHERE role = 'Student';")
            students = cursor.fetchall()
            metrics: List[Dict[str, Any]] = []
            for s in students:
                sid = s["id"]
                cursor.execute(
                    "SELECT status, COUNT(*) as cnt FROM Attendance WHERE student_id = ? GROUP BY status;",
                    (sid,),
                )
                counts = {r["status"]: r["cnt"] for r in cursor.fetchall()}

                cursor.execute("SELECT DISTINCT course_id FROM Enrollments WHERE user_id = ?;", (sid,))
                cids = [r["course_id"] for r in cursor.fetchall()]

                course_histories: List[List[Dict[str, Any]]] = []
                for cid in cids:
                    cursor.execute(
                        """
                        SELECT a.status, c.course_name, COALESCE(c.course_code, c.course_name) as code
                        FROM Attendance a
                        JOIN Sessions s ON a.session_id = s.id
                        JOIN Courses c ON s.course_id = c.id
                        WHERE a.student_id = ? AND s.course_id = ?
                        ORDER BY s.start_time DESC LIMIT 10;
                        """,
                        (sid, cid),
                    )
                    course_histories.append([dict(rec) for rec in cursor.fetchall()])

                metrics.append(
                    {
                        "id": sid,
                        "student_id": s["student_id"] or str(sid),
                        "full_name": s["full_name"],
                        "email": s["email"],
                        "counts": counts,
                        "course_histories": course_histories,
                    }
                )
            return metrics

    def list_counseling_notes(self, student_ref: Any) -> List[CounselingNote]:
        with self._connect() as conn:
            cursor = conn.cursor()
            resolved_sid = self._resolve_user_id(cursor, student_ref)
            if not resolved_sid:
                return []
            cursor.execute(
                """
                SELECT cn.id, cn.student_id, cn.advisor_id, cn.note_text, cn.created_at, u.full_name as advisor_name
                FROM Counseling_Notes cn
                JOIN Users u ON cn.advisor_id = u.id
                WHERE cn.student_id = ?
                ORDER BY cn.id DESC;
                """,
                (resolved_sid,),
            )
            return [
                CounselingNote(
                    note_id=r["id"],
                    student_id=r["student_id"],
                    advisor_id=r["advisor_id"],
                    note_text=r["note_text"],
                    created_at=r["created_at"],
                    advisor_name=r["advisor_name"],
                )
                for r in cursor.fetchall()
            ]

    def create_counseling_note(
        self, student_ref: Any, advisor_ref: Any, note_text: str, created_at: str
    ) -> None:
        with self._connect() as conn:
            cursor = conn.cursor()
            resolved_sid = self._resolve_user_id(cursor, student_ref) or int(student_ref)
            resolved_aid = self._resolve_user_id(cursor, advisor_ref) or int(advisor_ref)
            cursor.execute(
                "INSERT INTO Counseling_Notes (student_id, advisor_id, note_text, created_at) VALUES (?, ?, ?, ?);",
                (resolved_sid, resolved_aid, note_text.strip(), created_at),
            )
            self._insert_audit(
                cursor,
                resolved_aid,
                "Save Intervention Note",
                f"Student #{student_ref}: {note_text.strip()[:45]}",
            )

    # ---------------------------------------------------------
    # CSV Report Queries
    # ---------------------------------------------------------
    def list_course_report_rows(self, course_ref: Optional[Any] = None) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            cursor = conn.cursor()
            resolved_cid = self._resolve_course_id(cursor, course_ref) if course_ref else None
            if resolved_cid:
                cursor.execute(
                    """
                    SELECT s.id as session_id, s.start_time, COALESCE(u.student_id, CAST(u.id AS TEXT)) as stu_code,
                           u.full_name, u.email, a.status, a.time_logged, COALESCE(a.method, 'PIN Input') as method
                    FROM Attendance a
                    JOIN Sessions s ON a.session_id = s.id
                    JOIN Users u ON a.student_id = u.id
                    WHERE s.course_id = ?
                    ORDER BY s.start_time DESC, u.full_name ASC;
                    """,
                    (resolved_cid,),
                )
            else:
                cursor.execute(
                    """
                    SELECT s.id as session_id, s.start_time, COALESCE(u.student_id, CAST(u.id AS TEXT)) as stu_code,
                           u.full_name, u.email, a.status, a.time_logged, COALESCE(a.method, 'PIN Input') as method
                    FROM Attendance a
                    JOIN Sessions s ON a.session_id = s.id
                    JOIN Users u ON a.student_id = u.id
                    ORDER BY s.start_time DESC, u.full_name ASC;
                    """
                )
            return [dict(r) for r in cursor.fetchall()]

    def list_system_report_rows(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT u.id as user_id, u.full_name, u.email, u.role, COALESCE(u.status, 'Active') as status,
                       COUNT(DISTINCT a.id) as total_attendance_records,
                       SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
                       SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_count,
                       SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count
                FROM Users u
                LEFT JOIN Attendance a ON u.id = a.student_id
                GROUP BY u.id
                ORDER BY u.role, u.full_name;
                """
            )
            return [dict(r) for r in cursor.fetchall()]

    # ---------------------------------------------------------
    # Jira Bug Tracking CRUD
    # ---------------------------------------------------------
    def list_bug_reports(self) -> List[JiraBugReport]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT b.*, COALESCE(u.full_name, 'QA Engineer') as reporter_name
                FROM Bug_Reports b
                LEFT JOIN Users u ON b.reporter_id = u.id
                ORDER BY b.id DESC;
                """
            )
            return [
                JiraBugReport(
                    bug_id=r["id"],
                    issue_key=r["issue_key"],
                    summary=r["summary"],
                    description=r["description"],
                    test_case_id=r["test_case_id"],
                    module=r["module"],
                    priority=r["priority"],
                    severity=r["severity"],
                    status=r["status"],
                    reporter_id=r["reporter_id"],
                    reporter_name=r["reporter_name"],
                    assignee=r["assignee"],
                    jira_remote_key=r["jira_remote_key"],
                    jira_sync_status=r["jira_sync_status"],
                    created_at=r["created_at"],
                    updated_at=r["updated_at"],
                )
                for r in cursor.fetchall()
            ]

    def create_bug_report(
        self,
        summary: str,
        description: str,
        test_case_id: str = "GENERAL",
        module: str = "System",
        priority: str = "Medium",
        severity: str = "Major",
        reporter_id: Optional[int] = None,
        assignee: str = "Backend MVC Team",
    ) -> JiraBugReport:
        now_utc = self.utc_now_str()
        # Validate domain constraints via JiraBugReport OOP constructor before persistence
        validated = JiraBugReport(
            bug_id=None,
            issue_key="SAS-TEMP",
            summary=summary,
            description=description,
            test_case_id=test_case_id,
            module=module,
            priority=priority,
            severity=severity,
            status="To Do",
            reporter_id=reporter_id,
            assignee=assignee,
            created_at=now_utc,
            updated_at=now_utc,
        )
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM Bug_Reports;")
            next_num = cursor.fetchone()["next_id"]
            issue_key = f"SAS-{next_num}"
            d = validated.to_dict()
            cursor.execute(
                """
                INSERT INTO Bug_Reports (
                    issue_key, summary, description, test_case_id, module,
                    priority, severity, status, reporter_id, assignee,
                    jira_sync_status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    issue_key,
                    d["summary"],
                    d["description"],
                    d["testCaseId"],
                    d["module"],
                    d["priority"],
                    d["severity"],
                    "To Do",
                    reporter_id,
                    d["assignee"],
                    "Local Jira Queue",
                    now_utc,
                    now_utc,
                ),
            )
            bug_id = cursor.lastrowid
            reporter_name = "QA Engineer"
            if reporter_id:
                cursor.execute("SELECT full_name FROM Users WHERE id = ?;", (reporter_id,))
                u_row = cursor.fetchone()
                if u_row:
                    reporter_name = u_row["full_name"]

            self._insert_audit(
                cursor,
                reporter_id,
                "Log Jira Bug",
                f"Created Jira defect {issue_key} [{d['testCaseId']} | {d['priority']}]: {d['summary'][:60]}",
            )
            return JiraBugReport(
                bug_id=bug_id,
                issue_key=issue_key,
                summary=d["summary"],
                description=d["description"],
                test_case_id=d["testCaseId"],
                module=d["module"],
                priority=d["priority"],
                severity=d["severity"],
                status="To Do",
                reporter_id=reporter_id,
                reporter_name=reporter_name,
                assignee=d["assignee"],
                jira_sync_status="Local Jira Queue",
                created_at=now_utc,
                updated_at=now_utc,
            )

    def update_bug_jira_sync(self, bug_id: int, remote_key: Optional[str], sync_status: str) -> None:
        now_utc = self.utc_now_str()
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE Bug_Reports SET jira_remote_key = ?, jira_sync_status = ?, updated_at = ? WHERE id = ?;",
                (remote_key, sync_status, now_utc, bug_id),
            )

    def update_bug_report_status(
        self, bug_id: int, new_status: str, actor_id: Optional[int] = None
    ) -> Optional[JiraBugReport]:
        if new_status not in JiraBugReport.VALID_STATUSES:
            raise ValueError(f"Invalid Jira status: {new_status}")
        now_utc = self.utc_now_str()
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT issue_key FROM Bug_Reports WHERE id = ?;", (bug_id,))
            row = cursor.fetchone()
            if not row:
                return None
            cursor.execute(
                "UPDATE Bug_Reports SET status = ?, updated_at = ? WHERE id = ?;",
                (new_status, now_utc, bug_id),
            )
            self._insert_audit(
                cursor,
                actor_id,
                "Jira Bug Transition",
                f"Transitioned {row['issue_key']} to '{new_status}'",
            )
        bugs = self.list_bug_reports()
        return next((b for b in bugs if b.id == bug_id), None)

    def delete_bug_report(self, bug_id: int, actor_id: Optional[int] = None) -> bool:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT issue_key FROM Bug_Reports WHERE id = ?;", (bug_id,))
            row = cursor.fetchone()
            if not row:
                return False
            cursor.execute("DELETE FROM Bug_Reports WHERE id = ?;", (bug_id,))
            self._insert_audit(
                cursor,
                actor_id,
                "Delete Jira Bug",
                f"Removed bug report {row['issue_key']}",
            )
            return True

    def get_bug_report_by_id(self, bug_id: int) -> Optional[JiraBugReport]:
        return next((b for b in self.list_bug_reports() if b.id == bug_id), None)
