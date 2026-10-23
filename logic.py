"""
logic.py - Controller Component & Business Layer
SAS Enterprise - Student Attendance & Intelligence System

Grounded in Software Engineering Chapter 3: Software Design:
- Architectural Pattern: MVC Model - Controller Component (Slides 17-19)
  * Slide 17: "The Controller component manages user interactions and passes these interactions to the View and Model respectively."
- Layered Model: Business Layer (Slides 25-27)
  * Slide 26: Role Checking, PIN Token Validation, Warning Engine, Report Generation
- Quality Metrics:
  * High Cohesion (Slides 11, 13, 19): Grouping of related business actions into focused Controller methods
  * Loose Coupling (Slides 11, 12, 19): Interaction with View and Model via clean data contracts (no direct SQL in UI)
"""

import csv
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any

from database import DBConnection, hash_password, init_database


class AttendanceLogic:
    """
    Central Controller Component for SAS Enterprise (SE Chapter 3, Slide 17).
    Decoupled from UI views to fulfill Model-View-Controller architecture.
    """

    def __init__(self, db_path=None):
        self.db_path = db_path
        if db_path:
            init_database(db_path)

    # ---------------------------------------------------------
    # Authentication & Session State
    # ---------------------------------------------------------
    def authenticate(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Verify institutional credentials against salted SHA-256 password hash.
        Returns user dictionary if valid, None otherwise.
        """
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id, email, password_hash, full_name, role FROM Users WHERE email = ?;",
                    (email.strip(),)
                )
                user = cursor.fetchone()
                if not user:
                    return None

                entered_hash = hash_password(password)
                if user["password_hash"] == entered_hash:
                    # Log successful sign-in
                    cursor.execute(
                        "INSERT INTO Audit_Logs (user_id, action, timestamp, details) VALUES (?, ?, ?, ?);",
                        (user["id"], "User Sign-in", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), f"Role: {user['role']}")
                    )
                    return dict(user)
                return None
        except Exception as e:
            print(f"[Logic Error] Authentication failure: {e}")
            return None

    # ---------------------------------------------------------
    # Student Functions
    # ---------------------------------------------------------
    def check_in(self, student_id: int, course_id: int, entered_token: str, checkin_time: Optional[datetime] = None) -> Tuple[bool, str, str]:
        """
        Direct check-in algorithm:
        Compares input time and QR/PIN opening time.
        - < 15 mins: Present
        - 15 to 45 mins: Late
        - > 45 mins: Session expired (Absent)
        Returns: (success, status_label, feedback_message)
        """
        try:
            if not entered_token or not entered_token.strip():
                return False, "Error", "PIN or QR token cannot be empty."

            cleaned_token = entered_token.strip().replace("-", "").replace(" ", "")
            now = checkin_time or datetime.now()

            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()

                # Find active session for course matching code
                cursor.execute("""
                    SELECT id, session_code, start_time, is_active
                    FROM Sessions
                    WHERE course_id = ? AND is_active = 1
                    ORDER BY id DESC LIMIT 1;
                """, (course_id,))
                session = cursor.fetchone()

                if not session:
                    return False, "Error", "No active attendance session found for this course."

                stored_token = session["session_code"].replace("-", "").replace(" ", "")
                if stored_token.lower() != cleaned_token.lower():
                    return False, "Error", "Invalid PIN or QR code entered. Please check projection."

                # Parse start time
                start_dt = datetime.strptime(session["start_time"], "%Y-%m-%d %H:%M:%S")
                elapsed_seconds = (now - start_dt).total_seconds()
                elapsed_minutes = elapsed_seconds / 60.0

                if elapsed_minutes < 0:
                    elapsed_minutes = 0

                if elapsed_minutes < 15.0:
                    status = "Present"
                    msg = f"Check-in verified: Present ({elapsed_minutes:.1f}m into session)."
                elif 15.0 <= elapsed_minutes <= 45.0:
                    status = "Late"
                    msg = f"Check-in verified: Late (+{int(elapsed_minutes)}m arrival)."
                else:
                    status = "Absent"
                    msg = "Session verification window has closed (>45m elapsed)."

                # Upsert attendance
                cursor.execute("""
                    INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by)
                    VALUES (?, ?, ?, ?, NULL)
                    ON CONFLICT(session_id, student_id) DO UPDATE SET
                        status = excluded.status,
                        time_logged = excluded.time_logged;
                """, (session["id"], student_id, status, now.strftime("%Y-%m-%d %H:%M:%S")))

                # Log check-in
                cursor.execute(
                    "INSERT INTO Audit_Logs (user_id, action, timestamp, details) VALUES (?, ?, ?, ?);",
                    (student_id, "Check-in Recorded", now.strftime("%Y-%m-%d %H:%M:%S"), f"Status: {status}, Course #{course_id}")
                )

                return True, status, msg
        except Exception as e:
            print(f"[Logic Error] Check-in exception: {e}")
            return False, "Error", f"Database error during check-in: {e}"

    def get_student_statistics(self, student_id: int) -> List[Dict[str, Any]]:
        """
        Calculate personal statistics per enrolled course:
        Total sessions, Present, Late, Absent, Excused, Attendance rate %.
        Formula: (Present + Late * 0.8) / Total * 100 or standard present count.
        """
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT c.id as course_id, c.course_name
                    FROM Courses c
                    JOIN Enrollments e ON c.id = e.course_id
                    WHERE e.user_id = ?
                    ORDER BY c.course_name ASC;
                """, (student_id,))
                courses = cursor.fetchall()

                stats = []
                for c in courses:
                    cid = c["course_id"]
                    cname = c["course_name"]

                    cursor.execute("""
                        SELECT a.status, COUNT(*) as cnt
                        FROM Attendance a
                        JOIN Sessions s ON a.session_id = s.id
                        WHERE s.course_id = ? AND a.student_id = ?
                        GROUP BY a.status;
                    """, (cid, student_id))
                    counts = {row["status"]: row["cnt"] for row in cursor.fetchall()}

                    present = counts.get("Present", 0)
                    late = counts.get("Late", 0)
                    absent = counts.get("Absent", 0)
                    excused = counts.get("Excused", 0)
                    total = present + late + absent + excused

                    # If total is 0, fetch total sessions held for that course
                    if total == 0:
                        cursor.execute("SELECT COUNT(*) as cnt FROM Sessions WHERE course_id = ?;", (cid,))
                        total_sessions = cursor.fetchone()["cnt"]
                        total = total_sessions
                        absent = total_sessions

                    # Attendance rate calculation
                    # Present counts 100%, Late counts 80% attendance towards metric
                    if total > 0:
                        attendance_pct = round(((present + (late * 0.8)) / total) * 100, 1)
                    else:
                        attendance_pct = 100.0

                    if attendance_pct >= 90.0:
                        compliance = "Good Standing"
                    elif attendance_pct >= 80.0:
                        compliance = "Notice"
                    else:
                        compliance = "<80% Warning Threshold"

                    stats.append({
                        "course_id": cid,
                        "course_name": cname,
                        "total_sessions": total,
                        "present": present,
                        "late": late,
                        "absent": absent,
                        "excused": excused,
                        "attendance_percentage": attendance_pct,
                        "compliance_status": compliance
                    })
                return stats
        except Exception as e:
            print(f"[Logic Error] Student stats error: {e}")
            return []

    def submit_excuse(self, student_id: int, course_id: int, date_absent: str, reason: str) -> Tuple[bool, str]:
        """Submit student absence excuse request (default status: Pending)."""
        try:
            if not reason or not reason.strip():
                return False, "Excuse justification reason cannot be empty."

            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO Excuses (student_id, course_id, date_absent, reason, status)
                    VALUES (?, ?, ?, ?, 'Pending');
                """, (student_id, course_id, date_absent, reason.strip()))

                cursor.execute(
                    "INSERT INTO Audit_Logs (user_id, action, timestamp, details) VALUES (?, ?, ?, ?);",
                    (student_id, "Excuse Submitted", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), f"Course ID {course_id}, Date: {date_absent}")
                )
                return True, "Formal excuse slip submitted successfully (Status: Pending)."
        except Exception as e:
            print(f"[Logic Error] Submit excuse error: {e}")
            return False, f"Failed to submit excuse: {e}"

    # ---------------------------------------------------------
    # Instructor Functions
    # ---------------------------------------------------------
    def start_attendance_session(self, course_id: int, custom_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Open a new live attendance session. Generates a 6-digit PIN / QR string.
        Closes any previously active session for that course.
        """
        try:
            pin = custom_code or f"{random.randint(100, 999)}-{random.randint(100, 999)}"
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                # Deactivate previous sessions for course
                cursor.execute("UPDATE Sessions SET is_active = 0 WHERE course_id = ?;", (course_id,))

                # Insert new active session
                cursor.execute("""
                    INSERT INTO Sessions (course_id, session_code, start_time, is_active)
                    VALUES (?, ?, ?, 1);
                """, (course_id, pin, now_str))
                session_id = cursor.lastrowid

                # Auto-populate enrolled students as 'Absent' initially
                cursor.execute("""
                    SELECT user_id FROM Enrollments WHERE course_id = ?;
                """, (course_id,))
                enrolled = cursor.fetchall()
                for student in enrolled:
                    cursor.execute("""
                        INSERT INTO Attendance (session_id, student_id, status, time_logged, updated_by)
                        VALUES (?, ?, 'Absent', ?, NULL)
                        ON CONFLICT(session_id, student_id) DO NOTHING;
                    """, (session_id, student["user_id"], now_str))

                cursor.execute(
                    "INSERT INTO Audit_Logs (user_id, action, timestamp, details) VALUES (NULL, ?, ?, ?);",
                    ("Session Started", now_str, f"Session #{session_id} for Course #{course_id}, PIN: {pin}")
                )

                return {
                    "session_id": session_id,
                    "session_code": pin,
                    "start_time": now_str,
                    "is_active": 1,
                    "duration_seconds": 15 * 60  # 15 mins default
                }
        except Exception as e:
            print(f"[Logic Error] Start session error: {e}")
            raise

    def end_attendance_session(self, session_id: int) -> bool:
        """Close an active session."""
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE Sessions SET is_active = 0 WHERE id = ?;", (session_id,))
                cursor.execute(
                    "INSERT INTO Audit_Logs (user_id, action, timestamp, details) VALUES (NULL, ?, ?, ?);",
                    ("Session Ended", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), f"Closed session #{session_id}")
                )
                return True
        except Exception as e:
            print(f"[Logic Error] End session error: {e}")
            return False

    def get_instructor_roster(self, course_id: int) -> List[Dict[str, Any]]:
        """
        Fetch real-time roster for the latest session of a course,
        including student id, full name, status, time_logged, and attendance id.
        """
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id FROM Sessions WHERE course_id = ? ORDER BY id DESC LIMIT 1;
                """, (course_id,))
                s_row = cursor.fetchone()
                if not s_row:
                    return []
                session_id = s_row["id"]

                cursor.execute("""
                    SELECT a.id as attendance_id, u.id as student_id, u.full_name, u.email,
                           a.status, a.time_logged, a.updated_by
                    FROM Attendance a
                    JOIN Users u ON a.student_id = u.id
                    WHERE a.session_id = ?
                    ORDER BY u.full_name ASC;
                """, (session_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"[Logic Error] Instructor roster error: {e}")
            return []

    def manual_override_status(self, attendance_id: int, new_status: str, instructor_id: int) -> bool:
        """
        Manual override of a student's attendance status by an instructor.
        Saves updated_by to maintain institutional audit compliance.
        """
        try:
            valid_statuses = ["Present", "Late", "Absent", "Excused"]
            if new_status not in valid_statuses:
                return False

            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE Attendance
                    SET status = ?, updated_by = ?, time_logged = ?
                    WHERE id = ?;
                """, (new_status, instructor_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), attendance_id))

                # Audit log
                cursor.execute("""
                    INSERT INTO Audit_Logs (user_id, action, timestamp, details)
                    VALUES (?, 'Manual Attendance Override', ?, ?);
                """, (instructor_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), f"Attendance ID {attendance_id} set to {new_status}"))
                return True
        except Exception as e:
            print(f"[Logic Error] Manual override error: {e}")
            return False

    def get_pending_excuses(self, course_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Retrieve pending excuse requests from students."""
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                if course_id:
                    cursor.execute("""
                        SELECT e.id as excuse_id, u.full_name as student_name, c.course_name,
                               e.date_absent, e.reason, e.status, e.student_id, e.course_id
                        FROM Excuses e
                        JOIN Users u ON e.student_id = u.id
                        JOIN Courses c ON e.course_id = c.id
                        WHERE e.course_id = ?
                        ORDER BY e.id DESC;
                    """, (course_id,))
                else:
                    cursor.execute("""
                        SELECT e.id as excuse_id, u.full_name as student_name, c.course_name,
                               e.date_absent, e.reason, e.status, e.student_id, e.course_id
                        FROM Excuses e
                        JOIN Users u ON e.student_id = u.id
                        JOIN Courses c ON e.course_id = c.id
                        ORDER BY e.id DESC;
                    """)
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"[Logic Error] Get excuses error: {e}")
            return []

    def review_excuse(self, excuse_id: int, decision: str, instructor_id: int) -> bool:
        """
        Approve or reject a student excuse.
        If approved, retroactively marks the matching attendance record as 'Excused'.
        """
        try:
            decision = decision.capitalize()
            if decision not in ["Approved", "Rejected"]:
                return False

            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE Excuses SET status = ? WHERE id = ?;
                """, (decision, excuse_id))

                if decision == "Approved":
                    cursor.execute("SELECT student_id, course_id, date_absent FROM Excuses WHERE id = ?;", (excuse_id,))
                    exc = cursor.fetchone()
                    if exc:
                        # Find session around date_absent and mark Excused
                        cursor.execute("""
                            UPDATE Attendance
                            SET status = 'Excused', updated_by = ?
                            WHERE student_id = ? AND session_id IN (
                                SELECT id FROM Sessions WHERE course_id = ? AND start_time LIKE ?
                            );
                        """, (instructor_id, exc["student_id"], exc["course_id"], f"{exc['date_absent']}%"))

                cursor.execute("""
                    INSERT INTO Audit_Logs (user_id, action, timestamp, details)
                    VALUES (?, 'Excuse Reviewed', ?, ?);
                """, (instructor_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), f"Excuse #{excuse_id} marked as {decision}"))
                return True
        except Exception as e:
            print(f"[Logic Error] Review excuse error: {e}")
            return False

    def export_course_report_csv(self, course_id: int, filepath: str) -> bool:
        """Export attendance logs for a course to CSV format."""
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT s.id as session_id, s.start_time, u.id as student_id, u.full_name,
                           u.email, a.status, a.time_logged, a.updated_by
                    FROM Attendance a
                    JOIN Sessions s ON a.session_id = s.id
                    JOIN Users u ON a.student_id = u.id
                    WHERE s.course_id = ?
                    ORDER BY s.start_time DESC, u.full_name ASC;
                """, (course_id,))
                rows = cursor.fetchall()

                with open(filepath, mode="w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(["Session ID", "Session Date/Time", "Student ID", "Full Name", "Email", "Status", "Check-in Timestamp", "Updated By Instructor ID"])
                    for r in rows:
                        writer.writerow([r["session_id"], r["start_time"], r["student_id"], r["full_name"], r["email"], r["status"], r["time_logged"], r["updated_by"] or "N/A"])
                return True
        except Exception as e:
            print(f"[Logic Error] Export course report error: {e}")
            return False

    # ---------------------------------------------------------
    # Academic Advisor Functions (Early Warning System)
    # ---------------------------------------------------------
    def get_early_warning_students(self) -> List[Dict[str, Any]]:
        """
        Early Warning System (EWS):
        Filter students who have:
        1. An overall attendance rate < 80.0%, OR
        2. Absent for 3 or more consecutive sessions in ANY course.
        """
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                # Get all students
                cursor.execute("SELECT id, full_name, email FROM Users WHERE role = 'Student';")
                students = cursor.fetchall()

                flagged = []
                for s in students:
                    sid = s["id"]
                    sname = s["full_name"]

                    # Check overall attendance
                    cursor.execute("""
                        SELECT status, COUNT(*) as cnt
                        FROM Attendance
                        WHERE student_id = ?
                        GROUP BY status;
                    """, (sid,))
                    status_counts = {r["status"]: r["cnt"] for r in cursor.fetchall()}
                    present = status_counts.get("Present", 0)
                    late = status_counts.get("Late", 0)
                    absent = status_counts.get("Absent", 0)
                    excused = status_counts.get("Excused", 0)
                    total = present + late + absent + excused

                    overall_rate = round(((present + (late * 0.8)) / total) * 100, 1) if total > 0 else 100.0

                    # Check consecutive absences per course
                    cursor.execute("""
                        SELECT DISTINCT course_id FROM Enrollments WHERE user_id = ?;
                    """, (sid,))
                    cids = [r["course_id"] for r in cursor.fetchall()]

                    consecutive_max = 0
                    impacted_course_name = "General"
                    is_consecutive_violation = False

                    for cid in cids:
                        cursor.execute("""
                            SELECT a.status, c.course_name
                            FROM Attendance a
                            JOIN Sessions s ON a.session_id = s.id
                            JOIN Courses c ON s.course_id = c.id
                            WHERE a.student_id = ? AND s.course_id = ?
                            ORDER BY s.start_time DESC LIMIT 10;
                        """, (sid, cid))
                        records = cursor.fetchall()
                        current_consecutive = 0
                        for rec in records:
                            if rec["status"] == "Absent":
                                current_consecutive += 1
                                impacted_course_name = rec["course_name"]
                            else:
                                break
                        if current_consecutive > consecutive_max:
                            consecutive_max = current_consecutive
                        if current_consecutive >= 3:
                            is_consecutive_violation = True

                    # Check if student qualifies for EWS flag
                    if overall_rate < 80.0 or is_consecutive_violation:
                        risk_level = "CRITICAL" if overall_rate < 70.0 or consecutive_max >= 4 else "HIGH"
                        if overall_rate >= 75.0 and consecutive_max < 3:
                            risk_level = "MODERATE"

                        flagged.append({
                            "student_id": sid,
                            "student_name": sname,
                            "email": s["email"],
                            "course_name": impacted_course_name,
                            "attendance_rate": overall_rate,
                            "consecutive_absences": consecutive_max,
                            "risk_level": risk_level,
                            "reason": f"<80% Attendance ({overall_rate}%)" if overall_rate < 80.0 else f"{consecutive_max} Consecutive Absences"
                        })

                # Sort by highest risk first
                flagged.sort(key=lambda x: (0 if x["risk_level"] == "CRITICAL" else (1 if x["risk_level"] == "HIGH" else 2), x["attendance_rate"]))
                return flagged
        except Exception as e:
            print(f"[Logic Error] EWS calculation error: {e}")
            return []

    def get_counseling_notes(self, student_id: int) -> List[Dict[str, Any]]:
        """Get chronological counseling notes for a student."""
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT cn.id, cn.note_text, cn.created_at, u.full_name as advisor_name
                    FROM Counseling_Notes cn
                    JOIN Users u ON cn.advisor_id = u.id
                    WHERE cn.student_id = ?
                    ORDER BY cn.created_at DESC;
                """, (student_id,))
                return [dict(r) for r in cursor.fetchall()]
        except Exception as e:
            print(f"[Logic Error] Get counseling notes error: {e}")
            return []

    def save_counseling_note(self, student_id: int, advisor_id: int, note_text: str) -> bool:
        """Save student counseling intervention note."""
        try:
            if not note_text or not note_text.strip():
                return False
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO Counseling_Notes (student_id, advisor_id, note_text, created_at)
                    VALUES (?, ?, ?, ?);
                """, (student_id, advisor_id, note_text.strip(), now_str))

                cursor.execute("""
                    INSERT INTO Audit_Logs (user_id, action, timestamp, details)
                    VALUES (?, 'Counseling Note Added', ?, ?);
                """, (advisor_id, now_str, f"Student ID #{student_id} counseling note saved."))
                return True
        except Exception as e:
            print(f"[Logic Error] Save counseling note error: {e}")
            return False

    # ---------------------------------------------------------
    # Administrator Functions (CRUD Master & System Governance)
    # ---------------------------------------------------------
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Retrieve all users with enrolled courses list."""
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, email, full_name, role FROM Users ORDER BY id ASC;
                """)
                users = [dict(u) for u in cursor.fetchall()]

                for u in users:
                    cursor.execute("""
                        SELECT c.course_name FROM Courses c
                        JOIN Enrollments e ON c.id = e.course_id
                        WHERE e.user_id = ?;
                    """, (u["id"],))
                    u["courses"] = [r["course_name"].split(":")[0] for r in cursor.fetchall()]
                return users
        except Exception as e:
            print(f"[Logic Error] Get users error: {e}")
            return []

    def add_user(self, email: str, role: str, full_name: Optional[str] = None, password: str = "password123") -> Tuple[bool, str]:
        """Add a new user (Student, Instructor, Advisor, or Administrator)."""
        try:
            email = email.strip()
            if not email or "@" not in email:
                return False, "Please enter a valid email address."

            name = full_name or email.split("@")[0].replace(".", " ").title()
            pw_hash = hash_password(password)

            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO Users (email, password_hash, full_name, role)
                    VALUES (?, ?, ?, ?);
                """, (email, pw_hash, name, role))
                new_id = cursor.lastrowid

                # If student, enroll in default courses
                if role == "Student":
                    cursor.execute("SELECT id FROM Courses; ")
                    all_courses = cursor.fetchall()
                    for c in all_courses[:3]:
                        cursor.execute("INSERT OR IGNORE INTO Enrollments (user_id, course_id) VALUES (?, ?);", (new_id, c["id"]))

                cursor.execute("""
                    INSERT INTO Audit_Logs (user_id, action, timestamp, details)
                    VALUES (NULL, 'User Provisioned', ?, ?);
                """, (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), f"Enrolled {email} as {role}"))
                return True, f"User {email} successfully created (ID: {new_id})."
        except Exception as e:
            print(f"[Logic Error] Add user error: {e}")
            return False, f"Failed to add user: {e}"

    def delete_user(self, user_id: int) -> bool:
        """Delete user by ID."""
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM Users WHERE id = ?;", (user_id,))
                cursor.execute("""
                    INSERT INTO Audit_Logs (user_id, action, timestamp, details)
                    VALUES (NULL, 'User Deleted', ?, ?);
                """, (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), f"User ID #{user_id} deleted."))
                return True
        except Exception as e:
            print(f"[Logic Error] Delete user error: {e}")
            return False

    def get_all_courses(self) -> List[Dict[str, Any]]:
        """Fetch all courses."""
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id, course_name FROM Courses ORDER BY id ASC;")
                return [dict(r) for r in cursor.fetchall()]
        except Exception as e:
            print(f"[Logic Error] Get courses error: {e}")
            return []

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve recent institutional audit logs."""
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT a.id, a.timestamp, a.action, a.details, u.email, u.full_name
                    FROM Audit_Logs a
                    LEFT JOIN Users u ON a.user_id = u.id
                    ORDER BY a.id DESC LIMIT ?;
                """, (limit,))
                return [dict(r) for r in cursor.fetchall()]
        except Exception as e:
            print(f"[Logic Error] Get audit logs error: {e}")
            return []

    def export_system_report_csv(self, filepath: str) -> bool:
        """Export system-wide master report to CSV."""
        try:
            with DBConnection(self.db_path) if self.db_path else DBConnection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT u.id as user_id, u.full_name, u.email, u.role,
                           COUNT(DISTINCT a.id) as total_attendance_records,
                           SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
                           SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_count,
                           SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count
                    FROM Users u
                    LEFT JOIN Attendance a ON u.id = a.student_id
                    GROUP BY u.id
                    ORDER BY u.role, u.full_name;
                """)
                rows = cursor.fetchall()

                with open(filepath, mode="w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(["User ID", "Full Name", "Email", "Role", "Total Records", "Present Count", "Late Count", "Absent Count"])
                    for r in rows:
                        writer.writerow([r["user_id"], r["full_name"], r["email"], r["role"], r["total_attendance_records"], r["present_count"], r["late_count"], r["absent_count"]])
                return True
        except Exception as e:
            print(f"[Logic Error] Export system report error: {e}")
            return False
