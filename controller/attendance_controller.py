"""
controller/attendance_controller.py - MVC Controller Component
SAS Enterprise - Student Attendance & Intelligence System

Strictly adheres to Chapter 3 MVC Model (Slides 17-19):
- Controller manages user interactions and passes these interactions to Model and View.
- Contains ZERO raw SQL queries and ZERO sqlite3 imports.
"""

import base64
import csv
import io
import json
import os
import random
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from model.attendance_model import AttendanceModel
from model.database import hash_password
from model.entities import AttendanceRecord, AttendanceSession, JiraBugReport, User, UserFactory


class AttendanceController:
    """
    Central MVC Controller coordinating user requests with AttendanceModel
    and formatting data models for View rendering.
    """

    EMAIL_ALIASES = {
        "sarah.jenkins@student.univ.edu": "s.jenkins@university.edu",
        "david.kim@student.univ.edu": "d.kim@university.edu",
    }

    def __init__(self, db_path: Optional[str] = None):
        self._load_local_env()
        self.db_path = db_path
        self.model = AttendanceModel(db_path)

    @staticmethod
    def _load_local_env() -> None:
        """Load local .env variables without overriding already-set Secrets/env vars."""
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        env_path = os.path.join(root_dir, ".env")
        if not os.path.isfile(env_path):
            return
        try:
            with open(env_path, encoding="utf-8") as f:
                for raw_line in f:
                    line = raw_line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = val
        except Exception as e:
            print(f"[Controller Warning] Failed parsing .env: {e}")

    @staticmethod
    def _utc_now_str() -> str:
        return AttendanceModel.utc_now_str()

    @staticmethod
    def _local_now_str() -> str:
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # ---------------------------------------------------------
    # Authentication & User Hydration (Controller -> Model -> View)
    # ---------------------------------------------------------
    def authenticate_user_object(self, email: str, password: str) -> Optional[User]:
        try:
            lookup_email = (email or "").strip().lower()
            lookup_email = self.EMAIL_ALIASES.get(lookup_email, lookup_email)
            if not lookup_email:
                return None

            user_obj = self.model.find_user_by_email(lookup_email)
            if not user_obj:
                return None

            if not user_obj.verify_password(password, hash_password):
                return None

            if not user_obj.is_active_account():
                return None

            self.model.insert_audit_log(
                user_obj.id,
                "User Sign-In",
                f"Role: {user_obj.role} authenticated ({user_obj.get_portal_route()})",
            )
            return user_obj
        except Exception as e:
            print(f"[Controller Error] Authentication failure: {e}")
            return None

    def authenticate(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        user_obj = self.authenticate_user_object(email, password)
        return user_obj.to_dict() if user_obj else None

    def record_logout(self, user_id: Optional[int], user_name: str = "User") -> bool:
        try:
            self.model.insert_audit_log(user_id, "User Sign-Out", f"Session terminated by {user_name}")
            return True
        except Exception as e:
            print(f"[Controller Error] Logout audit error: {e}")
            return False

    def get_user_object(self, user_id: int) -> Optional[User]:
        try:
            return self.model.find_user_by_id(user_id)
        except Exception as e:
            print(f"[Controller Error] Get user error: {e}")
            return None

    def get_all_user_objects(self) -> List[User]:
        try:
            return self.model.list_users()
        except Exception as e:
            print(f"[Controller Error] Get users error: {e}")
            return []

    def get_all_users(self) -> List[Dict[str, Any]]:
        return [u.to_dict() for u in self.get_all_user_objects()]

    # ---------------------------------------------------------
    # Student & Session Check-in Interactions
    # ---------------------------------------------------------
    def get_active_session_object(self) -> Optional[AttendanceSession]:
        try:
            return self.model.find_active_session()
        except Exception as e:
            print(f"[Controller Error] Get active session error: {e}")
            return None

    def check_in(
        self,
        student_id: int,
        course_id: Any,
        entered_token: str,
        checkin_time: Optional[datetime] = None,
    ) -> Tuple[bool, str, str]:
        try:
            if not entered_token or not entered_token.strip():
                return False, "Error", "PIN or QR token cannot be empty."

            now = checkin_time or datetime.now()
            resolved = self.model.resolve_course_and_student(course_id, student_id)
            if not resolved["course_id"]:
                return False, "Error", "Selected course was not found."

            resolved_sid = resolved["student_id"] or int(student_id)
            session_obj = self.model.find_active_session(resolved["course_id"])
            if not session_obj:
                return False, "Error", "No active attendance session found for this course."

            if not session_obj.matches_pin(entered_token):
                return False, "Error", "Invalid PIN or QR code entered. Please check projection."

            status, msg = session_obj.evaluate_check_in(now)
            self.model.record_checkin(
                session_id=session_obj.id,  # type: ignore[arg-type]
                student_id=resolved_sid,
                status=status,
                time_logged=now.strftime("%Y-%m-%d %H:%M:%S"),
                course_code=session_obj.course_code,
                entered_token=entered_token,
            )
            return True, status, msg
        except Exception as e:
            print(f"[Controller Error] Check-in exception: {e}")
            return False, "Error", f"Database error during check-in: {e}"

    def get_student_statistics(self, student_id: int) -> List[Dict[str, Any]]:
        try:
            raw_courses = self.model.get_student_enrolled_course_counts(student_id)
            stats: List[Dict[str, Any]] = []
            for item in raw_courses:
                counts = item["counts"]
                present = counts.get("Present", 0)
                late = counts.get("Late", 0)
                absent = counts.get("Absent", 0)
                excused = counts.get("Excused", 0)
                total = present + late + absent + excused
                cname = item["course_name"]
                code = item["course_code"] or cname.split(":")[0].strip()
                title = item["title"] or (cname.split(":", 1)[1].strip() if ":" in cname else cname)

                attendance_pct = round(((present + (late * 0.8)) / total) * 100, 1) if total > 0 else 100.0
                if attendance_pct >= 90.0:
                    compliance = "Good Standing"
                elif attendance_pct >= 80.0:
                    compliance = "Notice"
                else:
                    compliance = "<80% Warning Threshold"

                stats.append(
                    {
                        "course_id": item["course_id"],
                        "course_name": cname,
                        "code": code,
                        "name": title,
                        "total_sessions": total,
                        "total": total,
                        "present": present,
                        "late": late,
                        "absent": absent,
                        "excused": excused,
                        "attendance_percentage": attendance_pct,
                        "pct": attendance_pct,
                        "compliance_status": compliance,
                        "status": compliance,
                    }
                )
            return stats
        except Exception as e:
            print(f"[Controller Error] Student stats error: {e}")
            return []

    def submit_excuse(self, student_id: int, course_id: Any, date_absent: str, reason: str) -> Tuple[bool, str]:
        try:
            if not reason or not reason.strip():
                return False, "Excuse justification reason cannot be empty."
            excuse_id = self.model.create_excuse(student_id, course_id, date_absent, reason)
            if excuse_id is None:
                return False, "Selected course not found."
            return True, "Formal excuse slip submitted successfully (Status: Pending)."
        except Exception as e:
            print(f"[Controller Error] Submit excuse error: {e}")
            return False, f"Failed to submit excuse: {e}"

    # ---------------------------------------------------------
    # Instructor Interactions
    # ---------------------------------------------------------
    def start_attendance_session(
        self,
        course_id: Any,
        custom_code: Optional[str] = None,
        instructor_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        try:
            pin = custom_code or f"{random.randint(100, 999)}-{random.randint(100, 999)}"
            now_str = self._local_now_str()
            session_obj = self.model.create_session(course_id, pin, now_str, instructor_id=instructor_id)
            return session_obj.to_dict()
        except Exception as e:
            print(f"[Controller Error] Start session error: {e}")
            raise

    def end_attendance_session(self, session_id: Optional[int] = None, instructor_id: Optional[int] = None) -> bool:
        try:
            self.model.close_sessions(session_id=session_id, instructor_id=instructor_id)
            return True
        except Exception as e:
            print(f"[Controller Error] End session error: {e}")
            return False

    def get_instructor_roster(self, course_id: Optional[Any] = None) -> List[Dict[str, Any]]:
        try:
            return [rec.to_dict() for rec in self.model.list_roster_records(course_id)]
        except Exception as e:
            print(f"[Controller Error] Instructor roster error: {e}")
            return []

    def manual_override_status(self, attendance_id: int, new_status: str, instructor_id: int) -> bool:
        try:
            if new_status not in AttendanceRecord.VALID_STATUSES:
                return False
            self.model.update_attendance_override(attendance_id, new_status, instructor_id, self._local_now_str())
            return True
        except Exception as e:
            print(f"[Controller Error] Manual override error: {e}")
            return False

    def get_pending_excuses(self, course_id: Optional[Any] = None) -> List[Dict[str, Any]]:
        try:
            return [ex.to_dict() for ex in self.model.list_excuses(course_id)]
        except Exception as e:
            print(f"[Controller Error] Get excuses error: {e}")
            return []

    def review_excuse(self, excuse_id: int, decision: str, instructor_id: int) -> bool:
        try:
            normalized = decision.capitalize()
            if normalized not in ("Approved", "Rejected"):
                return False
            self.model.update_excuse_decision(excuse_id, normalized, instructor_id)
            return True
        except Exception as e:
            print(f"[Controller Error] Review excuse error: {e}")
            return False

    def assign_instructor_course(
        self,
        instructor_id: int,
        course_code: str,
        course_title: str = "",
        room: str = "Hall B-12",
    ) -> Tuple[bool, str]:
        try:
            code = (course_code or "").strip().upper()
            title = (course_title or "").strip()
            if not code:
                return False, "Course code cannot be empty."
            if ":" in title:
                title = title.split(":", 1)[1].strip()
            full_name = f"{code}: {title}" if title else f"{code}: Lecture Session"
            self.model.assign_course_to_instructor(instructor_id, code, title, full_name, room)
            return True, f"Course {code} added and assigned."
        except Exception as e:
            print(f"[Controller Error] Assign instructor course error: {e}")
            return False, f"Failed to assign course: {e}"

    def export_course_report_csv_string(self, course_id: Optional[Any] = None) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ["Session ID", "Session Date/Time", "Student ID", "Full Name", "Email", "Status", "Check-in Timestamp", "Method"]
        )
        try:
            for r in self.model.list_course_report_rows(course_id):
                writer.writerow(
                    [r["session_id"], r["start_time"], r["stu_code"], r["full_name"], r["email"], r["status"], r["time_logged"], r["method"]]
                )
        except Exception as e:
            print(f"[Controller Error] CSV course string error: {e}")
        return output.getvalue()

    def export_course_report_csv(self, course_id: int, filepath: str) -> bool:
        try:
            csv_data = self.export_course_report_csv_string(course_id)
            with open(filepath, mode="w", newline="", encoding="utf-8") as f:
                f.write(csv_data)
            return True
        except Exception as e:
            print(f"[Controller Error] Export course report error: {e}")
            return False

    # ---------------------------------------------------------
    # Advisor Interactions (Early Warning System & Counseling)
    # ---------------------------------------------------------
    def get_early_warning_students(self) -> List[Dict[str, Any]]:
        try:
            metrics = self.model.get_ews_raw_student_metrics()
            flagged: List[Dict[str, Any]] = []
            for m in metrics:
                counts = m["counts"]
                present = counts.get("Present", 0)
                late = counts.get("Late", 0)
                absent = counts.get("Absent", 0)
                excused = counts.get("Excused", 0)
                total = present + late + absent + excused
                overall_rate = round(((present + (late * 0.8)) / total) * 100, 1) if total > 0 else 100.0

                consecutive_max = 0
                impacted_course_name = "General"
                is_consecutive_violation = False

                for history in m["course_histories"]:
                    current_consecutive = 0
                    for rec in history:
                        if rec["status"] == "Absent":
                            current_consecutive += 1
                            impacted_course_name = rec["code"].split(":")[0].strip()
                        else:
                            break
                    if current_consecutive > consecutive_max:
                        consecutive_max = current_consecutive
                    if current_consecutive >= 3:
                        is_consecutive_violation = True

                if overall_rate < 80.0 or is_consecutive_violation:
                    if overall_rate < 70.0 or consecutive_max >= 4:
                        risk_level, ui_risk = "CRITICAL", "Critical"
                    elif overall_rate < 75.0 or consecutive_max >= 3:
                        risk_level = "HIGH"
                        ui_risk = "Critical" if consecutive_max >= 3 else "Warning"
                    else:
                        risk_level, ui_risk = "MODERATE", "Warning"

                    flagged.append(
                        {
                            "student_id": m["id"],
                            "studentDbId": m["id"],
                            "studentId": m["student_id"],
                            "student_name": m["full_name"],
                            "name": m["full_name"],
                            "email": m["email"],
                            "course_name": impacted_course_name,
                            "course": impacted_course_name,
                            "attendance_rate": overall_rate,
                            "pct": overall_rate,
                            "consecutive_absences": consecutive_max,
                            "consecutiveAbsences": consecutive_max,
                            "risk_level": risk_level,
                            "risk": ui_risk,
                            "reason": (
                                f"<80% Attendance ({overall_rate}%)"
                                if overall_rate < 80.0
                                else f"{consecutive_max} Consecutive Absences"
                            ),
                        }
                    )

            flagged.sort(
                key=lambda x: (0 if x["risk_level"] == "CRITICAL" else (1 if x["risk_level"] == "HIGH" else 2), x["attendance_rate"])
            )
            return flagged
        except Exception as e:
            print(f"[Controller Error] EWS calculation error: {e}")
            return []

    def get_counseling_notes(self, student_id: Any) -> List[Dict[str, Any]]:
        try:
            return [n.to_dict() for n in self.model.list_counseling_notes(student_id)]
        except Exception as e:
            print(f"[Controller Error] Get counseling notes error: {e}")
            return []

    def save_counseling_note(self, student_id: Any, advisor_id: int, note_text: str) -> bool:
        try:
            if not note_text or not note_text.strip():
                return False
            self.model.create_counseling_note(student_id, advisor_id, note_text, self._local_now_str())
            return True
        except Exception as e:
            print(f"[Controller Error] Save counseling note error: {e}")
            return False

    # ---------------------------------------------------------
    # Administrator Interactions
    # ---------------------------------------------------------
    def add_user(
        self,
        email: str,
        role: str,
        full_name: Optional[str] = None,
        password: str = "password123",
        student_id: Optional[str] = None,
        major: Optional[str] = None,
        academic_year: Optional[str] = None,
        department: Optional[str] = None,
        courses: Optional[List[str]] = None,
        actor_id: Optional[int] = None,
    ) -> Tuple[bool, str]:
        try:
            email = (email or "").strip()
            if not email or "@" not in email:
                return False, "Please enter a valid email address."

            name = (full_name or email.split("@")[0].replace(".", " ").title()).strip()
            pw_hash = hash_password(password or "password123")

            if role == "Student":
                maj = (major or "B.S. Software Engineering").strip()
                yr = (academic_year or "Year 3").strip()
                dept = department or f"{maj} ({yr})"
                stu_code = (student_id or "").strip() or str(24000 + random.randint(100, 999))
            elif role == "Instructor":
                maj, yr, stu_code = None, None, None
                dept = department or "Faculty of Engineering"
            else:
                maj, yr, stu_code = None, None, None
                dept = department or ("Student Support Services" if role == "Advisor" else "Global Campus Administration")

            # Validate domain constraints via OOP UserFactory before persistence
            UserFactory.from_row(
                {
                    "id": 0,
                    "email": email,
                    "password_hash": pw_hash,
                    "full_name": name,
                    "role": role,
                    "student_id": stu_code,
                    "major": maj,
                    "academic_year": yr,
                    "department": dept,
                    "status": "Active",
                },
                courses=courses,
            )

            new_id = self.model.create_user(
                email=email,
                pw_hash=pw_hash,
                full_name=name,
                role=role,
                stu_code=stu_code,
                major=maj,
                academic_year=yr,
                department=dept,
                courses=courses,
                actor_id=actor_id,
            )
            return True, f"User {email} successfully created (ID: {new_id})."
        except Exception as e:
            print(f"[Controller Error] Add user error: {e}")
            return False, f"Failed to add user: {e}"

    def update_user(
        self,
        user_id: int,
        email: str,
        full_name: str,
        role: str,
        status: str = "Active",
        password: Optional[str] = None,
        student_id: Optional[str] = None,
        major: Optional[str] = None,
        academic_year: Optional[str] = None,
        department: Optional[str] = None,
        courses: Optional[List[str]] = None,
        actor_id: Optional[int] = None,
    ) -> Tuple[bool, str]:
        try:
            email = (email or "").strip()
            name = (full_name or "").strip()
            if not email or "@" not in email:
                return False, "Please enter a valid email address."
            if not name:
                return False, "Full Name cannot be empty."

            msg = self.model.update_user_record(
                user_id=user_id,
                email=email,
                full_name=name,
                role=role,
                status=status,
                password=password,
                student_id=student_id,
                major=major,
                academic_year=academic_year,
                department=department,
                courses=courses,
                actor_id=actor_id,
            )
            if not msg:
                return False, f"User #{user_id} not found."
            return True, msg
        except Exception as e:
            print(f"[Controller Error] Update user error: {e}")
            return False, f"Failed to update user: {e}"

    def delete_user(self, user_id: int, actor_id: Optional[int] = None) -> Tuple[bool, str]:
        try:
            self.model.delete_user_record(user_id, actor_id=actor_id)
            return True, f"User ID #{user_id} deleted successfully."
        except Exception as e:
            print(f"[Controller Error] Delete user error: {e}")
            return False, f"Failed to delete user: {e}"

    def get_all_courses(self) -> List[Dict[str, Any]]:
        try:
            return [c.to_dict() for c in self.model.list_courses()]
        except Exception as e:
            print(f"[Controller Error] Get courses error: {e}")
            return []

    def add_course(
        self,
        course_code: str,
        course_name: str,
        room: str = "Hall B-12",
        actor_id: Optional[int] = None,
    ) -> Tuple[bool, str]:
        try:
            code = (course_code or "").strip().upper()
            name = (course_name or "").strip()
            if not code or not name:
                return False, "Course code and title cannot be empty."
            full_title = f"{code}: {name}"
            self.model.create_course(full_title, code, name, room, actor_id=actor_id)
            return True, f"Course '{full_title}' successfully registered."
        except Exception as e:
            print(f"[Controller Error] Add course error: {e}")
            return False, f"Failed to register course: {e}"

    def delete_course(self, course_id: Any, actor_id: Optional[int] = None) -> bool:
        try:
            return self.model.delete_course_record(course_id, actor_id=actor_id)
        except Exception as e:
            print(f"[Controller Error] Delete course error: {e}")
            return False

    def get_enrollments(self) -> List[Dict[str, Any]]:
        try:
            return [e.to_dict() for e in self.model.list_enrollments()]
        except Exception as e:
            print(f"[Controller Error] Get enrollments error: {e}")
            return []

    def add_enrollment(
        self, user_id: int, course_id: Any, semester: str = "Fall 2026", actor_id: Optional[int] = None
    ) -> Tuple[bool, str]:
        try:
            ok = self.model.create_enrollment(user_id, course_id, semester, actor_id=actor_id)
            if not ok:
                return False, "Course not found."
            return True, "Enrollment assigned successfully."
        except Exception as e:
            print(f"[Controller Error] Add enrollment error: {e}")
            return False, f"Failed to assign enrollment: {e}"

    def delete_enrollment(self, user_id: int, course_id: Any, actor_id: Optional[int] = None) -> bool:
        try:
            self.model.delete_enrollment_record(user_id, course_id, actor_id=actor_id)
            return True
        except Exception as e:
            print(f"[Controller Error] Delete enrollment error: {e}")
            return False

    def get_student_excuses(self, student_id: int) -> List[Dict[str, Any]]:
        try:
            return [ex.to_dict() for ex in self.model.list_student_excuses(student_id)]
        except Exception as e:
            print(f"[Controller Error] Get student excuses error: {e}")
            return []

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        try:
            return [log.to_dict() for log in self.model.list_audit_logs(limit=limit)]
        except Exception as e:
            print(f"[Controller Error] Get audit logs error: {e}")
            return []

    def export_system_report_csv_string(self) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ["User ID", "Full Name", "Email", "Role", "Status", "Total Records", "Present Count", "Late Count", "Absent Count"]
        )
        try:
            for r in self.model.list_system_report_rows():
                writer.writerow([
                    r["user_id"],
                    r["full_name"],
                    r["email"],
                    r["role"],
                    r["status"],
                    r["total_attendance_records"] or 0,
                    r["present_count"] or 0,
                    r["late_count"] or 0,
                    r["absent_count"] or 0,
                ])
        except Exception as e:
            print(f"[Controller Error] CSV system string error: {e}")
        return output.getvalue()

    def export_system_report_csv(self, filepath: str) -> bool:
        try:
            csv_data = self.export_system_report_csv_string()
            with open(filepath, mode="w", newline="", encoding="utf-8") as f:
                f.write(csv_data)
            return True
        except Exception as e:
            print(f"[Controller Error] Export system report error: {e}")
            return False

    # ---------------------------------------------------------
    # View Data Model Assembly (Controller -> View)
    # ---------------------------------------------------------
    def get_full_state(self, current_user_id: Optional[int] = None) -> Dict[str, Any]:
        """Build complete synchronized Data Model snapshot sent from Controller to View."""
        users = self.get_all_users()
        courses_catalog = self.get_all_courses()
        course_labels = [c["displayLabel"] for c in courses_catalog]

        active_sess_obj = self.get_active_session_object()
        session_dict = (
            active_sess_obj.to_dict()
            if active_sess_obj
            else {
                "active": False,
                "code": "---",
                "course": "CS-301",
                "courseName": "CS-301: Advanced Data Structures",
                "startTime": int(datetime.now().timestamp() * 1000),
                "remainingSeconds": 0,
            }
        )

        roster = self.get_instructor_roster(active_sess_obj.course_id if active_sess_obj else None)
        excuses = self.get_pending_excuses()
        warnings = self.get_early_warning_students()
        enrollments = self.get_enrollments()
        audit_logs = self.get_audit_logs(limit=40)

        counseling_notes: Dict[str, List[Dict[str, Any]]] = {}
        for u in users:
            if u["role"] == "Student":
                notes = self.get_counseling_notes(u["id"])
                counseling_notes[str(u["id"])] = notes
                if u.get("studentId"):
                    counseling_notes[str(u["studentId"])] = notes

        target_student_id = current_user_id
        if not target_student_id:
            first_stu = next((u for u in users if u["role"] == "Student"), None)
            target_student_id = first_stu["id"] if first_stu else 1

        stats = self.get_student_statistics(target_student_id)
        current_user_obj = self.get_user_object(current_user_id) if current_user_id else None
        current_user = current_user_obj.to_dict() if current_user_obj else None
        bugs = self.get_bug_reports()

        return {
            "serverTimeUtc": self._utc_now_str(),
            "serverTimeMs": int(datetime.now(timezone.utc).timestamp() * 1000),
            "currentUser": current_user,
            "users": users,
            "courses": course_labels,
            "courseCatalog": courses_catalog,
            "enrollments": enrollments,
            "session": session_dict,
            "roster": roster,
            "excuses": excuses,
            "warnings": warnings,
            "counselingNotes": counseling_notes,
            "stats": stats,
            "auditLogs": audit_logs,
            "bugs": bugs,
            "jiraConfigured": self.is_jira_cloud_configured(),
            "jiraProjectKey": os.environ.get("JIRA_PROJECT_KEY", "SAS").strip() or "SAS",
        }

    # ---------------------------------------------------------
    # Jira Bug Tracking Workflow (Controller -> Model -> View)
    # ---------------------------------------------------------
    @staticmethod
    def is_jira_cloud_configured() -> bool:
        return bool(
            os.environ.get("JIRA_BASE_URL", "").strip()
            and os.environ.get("JIRA_EMAIL", "").strip()
            and os.environ.get("JIRA_API_TOKEN", "").strip()
        )

    @staticmethod
    def _jira_headers() -> Tuple[str, Dict[str, str]]:
        raw_url = os.environ.get("JIRA_BASE_URL", "").strip().rstrip("/")
        if raw_url and not raw_url.startswith(("http://", "https://")):
            raw_url = "https://" + raw_url
        parsed = urllib.parse.urlparse(raw_url)
        base_url = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else raw_url
        email = os.environ.get("JIRA_EMAIL", "").strip()
        token = os.environ.get("JIRA_API_TOKEN", "").strip()
        auth_raw = f"{email}:{token}".encode("utf-8")
        auth_header = "Basic " + base64.b64encode(auth_raw).decode("ascii")
        return base_url, {
            "Authorization": auth_header,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def verify_jira_connection(self) -> Tuple[bool, str]:
        self._load_local_env()
        if not self.is_jira_cloud_configured():
            return (
                False,
                "Jira Cloud credentials are not configured yet. Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_PROJECT_KEY in Secrets or local .env.",
            )
        try:
            base_url, headers = self._jira_headers()
            project_key = os.environ.get("JIRA_PROJECT_KEY", "SAS").strip() or "SAS"
            req_me = urllib.request.Request(f"{base_url}/rest/api/3/myself", headers=headers, method="GET")
            with urllib.request.urlopen(req_me, timeout=8) as resp_me:
                raw_me = resp_me.read().decode("utf-8", errors="replace")
                if not raw_me.strip().startswith("{"):
                    return (
                        False,
                        f"Jira endpoint '{base_url}/rest/api/3/myself' returned HTML/non-JSON (HTTP {resp_me.status}). Verify JIRA_BASE_URL (e.g. https://your-domain.atlassian.net) and API Token.",
                    )
                me = json.loads(raw_me)
            req_proj = urllib.request.Request(
                f"{base_url}/rest/api/3/project/{urllib.parse.quote(project_key)}",
                headers=headers,
                method="GET",
            )
            with urllib.request.urlopen(req_proj, timeout=8) as resp_proj:
                proj = json.loads(resp_proj.read().decode("utf-8", errors="replace"))
            return True, f"Connected to Jira Cloud as {me.get('displayName', me.get('emailAddress', 'User'))} (Project: {proj.get('key', project_key)})."
        except urllib.error.HTTPError as http_err:
            return False, f"Jira Cloud rejected credentials/project (HTTP {http_err.code}). Verify JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_PROJECT_KEY."
        except Exception as e:
            return False, f"Jira Cloud connection failed: {e}"

    def get_bug_reports(self) -> List[Dict[str, Any]]:
        try:
            return [b.to_dict() for b in self.model.list_bug_reports()]
        except Exception as e:
            print(f"[Controller Error] Get bug reports error: {e}")
            return []

    def _push_to_jira_cloud(self, bug: JiraBugReport) -> Optional[str]:
        if not self.is_jira_cloud_configured():
            return None
        base_url, headers = self._jira_headers()
        project_key = os.environ.get("JIRA_PROJECT_KEY", "SAS").strip() or "SAS"
        payload = json.dumps(bug.to_jira_issue_payload(project_key)).encode("utf-8")

        req = urllib.request.Request(
            f"{base_url}/rest/api/3/issue",
            data=payload,
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                return body.get("key")
        except urllib.error.HTTPError as http_err:
            err_body = http_err.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {http_err.code}: {err_body[:180]}") from http_err

    def _sync_remote_jira_transition(self, remote_key: str, target_status: str) -> None:
        if not (remote_key and self.is_jira_cloud_configured()):
            return
        base_url, headers = self._jira_headers()
        req_get = urllib.request.Request(
            f"{base_url}/rest/api/3/issue/{remote_key}/transitions",
            headers=headers,
            method="GET",
        )
        with urllib.request.urlopen(req_get, timeout=8) as resp:
            transitions = json.loads(resp.read().decode("utf-8")).get("transitions", [])
        match = next(
            (t for t in transitions if str(t.get("name", "")).strip().lower() == target_status.lower()),
            None,
        )
        if not match:
            return
        payload = json.dumps({"transition": {"id": match["id"]}}).encode("utf-8")
        req_post = urllib.request.Request(
            f"{base_url}/rest/api/3/issue/{remote_key}/transitions",
            data=payload,
            headers=headers,
            method="POST",
        )
        urllib.request.urlopen(req_post, timeout=8).close()

    def sync_bug_to_jira(self, bug_id: int) -> Tuple[bool, str]:
        self._load_local_env()
        if not self.is_jira_cloud_configured():
            return False, "Jira Cloud credentials are not configured in Secrets or .env."
        bug = self.model.get_bug_report_by_id(bug_id)
        if not bug:
            return False, f"Bug #{bug_id} not found."
        try:
            remote_key = self._push_to_jira_cloud(bug)
            if remote_key:
                self.model.update_bug_jira_sync(bug_id, remote_key, f"Synced ({remote_key})")
                return True, f"Synced {bug.issue_key} to Jira Cloud as {remote_key}."
            return False, "Jira Cloud returned empty issue key."
        except Exception as e:
            self.model.update_bug_jira_sync(bug_id, None, f"Jira Sync Failed: {str(e)[:60]}")
            return False, f"Jira sync failed: {e}"

    def log_jira_bug(
        self,
        summary: str,
        description: str,
        test_case_id: str = "GENERAL",
        module: str = "System",
        priority: str = "Medium",
        severity: str = "Major",
        reporter_id: Optional[int] = None,
        assignee: str = "Backend MVC Team",
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        try:
            bug = self.model.create_bug_report(
                summary=summary,
                description=description,
                test_case_id=test_case_id,
                module=module,
                priority=priority,
                severity=severity,
                reporter_id=reporter_id,
                assignee=assignee,
            )
            if self.is_jira_cloud_configured() and bug.id is not None:
                try:
                    remote_key = self._push_to_jira_cloud(bug)
                    if remote_key:
                        self.model.update_bug_jira_sync(bug.id, remote_key, f"Synced ({remote_key})")
                except Exception as jira_err:
                    self.model.update_bug_jira_sync(bug.id, None, f"Jira Sync Failed: {str(jira_err)[:60]}")

            refreshed = next((b for b in self.get_bug_reports() if b["id"] == bug.id), bug.to_dict())
            return True, f"Jira Bug {refreshed['issueKey']} logged successfully.", refreshed
        except Exception as e:
            print(f"[Controller Error] Log Jira bug error: {e}")
            return False, f"Failed to log Jira bug: {e}", None

    def transition_jira_bug_status(
        self, bug_id: int, new_status: str, actor_id: Optional[int] = None
    ) -> Tuple[bool, str]:
        try:
            if new_status not in JiraBugReport.VALID_STATUSES:
                return False, f"Invalid Jira workflow status: {new_status}"
            updated = self.model.update_bug_report_status(bug_id, new_status, actor_id=actor_id)
            if not updated:
                return False, f"Bug #{bug_id} not found."
            remote_key = updated.to_dict().get("jiraRemoteKey")
            if remote_key and self.is_jira_cloud_configured():
                try:
                    self._sync_remote_jira_transition(remote_key, new_status)
                except Exception as jira_err:
                    print(f"[Controller Warning] Jira remote transition failed: {jira_err}")
            return True, f"{updated.issue_key} transitioned to '{new_status}'."
        except Exception as e:
            print(f"[Controller Error] Transition Jira bug error: {e}")
            return False, f"Failed to transition bug status: {e}"

    def delete_jira_bug(self, bug_id: int, actor_id: Optional[int] = None) -> bool:
        try:
            return self.model.delete_bug_report(bug_id, actor_id=actor_id)
        except Exception as e:
            print(f"[Controller Error] Delete Jira bug error: {e}")
            return False

    def export_jira_bugs_csv_string(self) -> str:
        """Export logged defects formatted for Jira External System CSV Importer."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "Issue Key",
                "Issue Type",
                "Summary",
                "Description",
                "Priority",
                "Severity",
                "Status",
                "Component",
                "Assignee",
                "Reporter",
                "Labels",
                "Custom field (Test Case ID)",
            ]
        )
        for b in self.get_bug_reports():
            writer.writerow(
                [
                    b["jiraRemoteKey"] or b["issueKey"],
                    "Bug",
                    f"[{b['testCaseId']}] {b['summary']}",
                    b["description"],
                    b["priority"],
                    b["severity"],
                    b["status"],
                    b["module"],
                    b["assignee"],
                    b["reporterName"],
                    f"sas-enterprise {b['testCaseId'].lower()}",
                    b["testCaseId"],
                ]
            )
        return output.getvalue()
