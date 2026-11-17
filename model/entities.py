"""
model/entities.py - MVC Model: Object-Oriented Domain Entities
SAS Enterprise - Student Attendance & Intelligence System

Implements the four OOP pillars aligned with Stage 1/2 Class Diagrams:
1. Abstraction: BaseEntity(ABC) & User(ABC)
2. Encapsulation: Private attributes protected by validated @property getters/setters
3. Inheritance: Student, Instructor, Advisor, Administrator extending User(ABC)
4. Polymorphism & Factory Pattern: UserFactory + role-specific overrides
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple


class BaseEntity(ABC):
    """Abstract base entity providing identity and serialization contract."""

    def __init__(self, entity_id: Optional[int] = None):
        self._id: Optional[int] = entity_id

    @property
    def id(self) -> Optional[int]:
        return self._id

    @id.setter
    def id(self, value: Optional[int]) -> None:
        if value is not None and int(value) < 0:
            raise ValueError("Entity ID cannot be negative.")
        self._id = int(value) if value is not None else None

    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        """Serialize domain entity into a JSON-safe dictionary."""
        raise NotImplementedError


class User(BaseEntity, ABC):
    """
    Abstract superclass representing an authenticated institutional actor.
    Mapped to the Users relational table via Single-Table Inheritance (role discriminator).
    """

    VALID_ROLES = ("Student", "Instructor", "Advisor", "Administrator")
    VALID_STATUSES = ("Active", "Flagged (EWS)", "Suspended")

    def __init__(
        self,
        user_id: Optional[int],
        email: str,
        password_hash: str,
        full_name: str,
        role: str,
        status: str = "Active",
        department: str = "",
    ):
        super().__init__(user_id)
        self._email = ""
        self._password_hash = ""
        self._full_name = ""
        self._role = ""
        self._status = "Active"
        self._department = ""

        self.email = email
        self._password_hash = password_hash or ""
        self.full_name = full_name
        self.role = role
        self.status = status or "Active"
        self.department = department or ""

    @property
    def email(self) -> str:
        return self._email

    @email.setter
    def email(self, value: str) -> None:
        cleaned = (value or "").strip()
        if not cleaned or "@" not in cleaned:
            raise ValueError(f"Invalid email address: '{value}'")
        self._email = cleaned

    @property
    def password_hash(self) -> str:
        return self._password_hash

    def set_password(self, raw_password: str, hasher: Callable[[str], str]) -> None:
        if not raw_password or len(raw_password) < 3:
            raise ValueError("Password must be at least 3 characters long.")
        self._password_hash = hasher(raw_password)

    def verify_password(self, raw_password: str, hasher: Callable[[str], str]) -> bool:
        if not self._password_hash or raw_password is None:
            return False
        return self._password_hash == hasher(raw_password)

    @property
    def full_name(self) -> str:
        return self._full_name

    @full_name.setter
    def full_name(self, value: str) -> None:
        cleaned = (value or "").strip()
        if not cleaned:
            raise ValueError("Full name cannot be empty.")
        self._full_name = cleaned

    @property
    def role(self) -> str:
        return self._role

    @role.setter
    def role(self, value: str) -> None:
        if value not in self.VALID_ROLES:
            raise ValueError(f"Unsupported role '{value}'. Must be one of {self.VALID_ROLES}.")
        self._role = value

    @property
    def status(self) -> str:
        return self._status

    @status.setter
    def status(self, value: str) -> None:
        cleaned = (value or "Active").strip()
        if cleaned not in self.VALID_STATUSES:
            cleaned = "Active"
        self._status = cleaned

    @property
    def department(self) -> str:
        return self._department

    @department.setter
    def department(self, value: str) -> None:
        self._department = (value or "").strip()

    def get_initials(self) -> str:
        parts = [p for p in self._full_name.split() if p]
        if not parts:
            return "U"
        return "".join(p[0].upper() for p in parts[:2])

    def is_active_account(self) -> bool:
        return self._status != "Suspended"

    @abstractmethod
    def get_permissions(self) -> List[str]:
        raise NotImplementedError

    @abstractmethod
    def get_portal_route(self) -> str:
        raise NotImplementedError

    @abstractmethod
    def get_dashboard_summary(self) -> str:
        raise NotImplementedError

    def to_dict(self, include_hash: bool = False) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "id": self._id,
            "email": self._email,
            "full_name": self._full_name,
            "fullName": self._full_name,
            "name": self._full_name,
            "role": self._role,
            "status": self._status,
            "department": self._department,
            "initials": self.get_initials(),
            "permissions": self.get_permissions(),
            "portalRoute": self.get_portal_route(),
            "dashboardSummary": self.get_dashboard_summary(),
            "hasPassword": bool(self._password_hash),
        }
        if include_hash:
            payload["password_hash"] = self._password_hash
        return payload

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self._id} email='{self._email}' status='{self._status}'>"


class Student(User):
    """Concrete Student domain actor with academic dossier and check-in rules."""

    def __init__(
        self,
        user_id: Optional[int],
        email: str,
        password_hash: str,
        full_name: str,
        status: str = "Active",
        student_id: Optional[str] = None,
        major: str = "B.S. Software Engineering",
        academic_year: str = "Year 3",
        department: str = "",
        courses: Optional[List[str]] = None,
    ):
        derived_dept = department or f"{major} ({academic_year})"
        super().__init__(user_id, email, password_hash, full_name, "Student", status, derived_dept)
        self._student_id = (student_id or (str(24000 + int(user_id)) if user_id else "24000")).strip()
        self._major = (major or "B.S. Software Engineering").strip()
        self._academic_year = (academic_year or "Year 3").strip()
        self._courses: List[str] = list(courses or [])

    @property
    def student_id(self) -> str:
        return self._student_id

    @student_id.setter
    def student_id(self, value: str) -> None:
        self._student_id = (value or "").strip() or self._student_id

    @property
    def major(self) -> str:
        return self._major

    @major.setter
    def major(self, value: str) -> None:
        self._major = (value or "B.S. Software Engineering").strip()

    @property
    def academic_year(self) -> str:
        return self._academic_year

    @academic_year.setter
    def academic_year(self, value: str) -> None:
        self._academic_year = (value or "Year 3").strip()

    @property
    def courses(self) -> List[str]:
        return list(self._courses)

    @courses.setter
    def courses(self, values: List[str]) -> None:
        self._courses = [c.strip() for c in values if c and c.strip()]

    def can_check_in(self) -> bool:
        return self.is_active_account()

    def get_permissions(self) -> List[str]:
        return ["check_in", "view_own_stats", "submit_excuse"]

    def get_portal_route(self) -> str:
        return "student.html"

    def get_dashboard_summary(self) -> str:
        return f"Student ID: #{self._student_id} • {self._major} ({self._academic_year})"

    def to_dict(self, include_hash: bool = False) -> Dict[str, Any]:
        data = super().to_dict(include_hash=include_hash)
        data.update({
            "student_id": self._student_id,
            "studentId": self._student_id,
            "major": self._major,
            "academic_year": self._academic_year,
            "academicYear": self._academic_year,
            "year": self._academic_year,
            "courses": list(self._courses),
        })
        return data


class Instructor(User):
    """Concrete Instructor domain actor owning teaching courses and session orchestration."""

    def __init__(
        self,
        user_id: Optional[int],
        email: str,
        password_hash: str,
        full_name: str,
        status: str = "Active",
        department: str = "Faculty of Engineering",
        courses: Optional[List[str]] = None,
    ):
        super().__init__(
            user_id,
            email,
            password_hash,
            full_name,
            "Instructor",
            status,
            department or "Faculty of Engineering",
        )
        self._courses: List[str] = list(courses or [])

    @property
    def courses(self) -> List[str]:
        return list(self._courses)

    @courses.setter
    def courses(self, values: List[str]) -> None:
        cleaned: List[str] = []
        for c in values or []:
            code = c.strip().upper()
            if code and code not in cleaned:
                cleaned.append(code)
        self._courses = cleaned

    def assign_course(self, course_code: str) -> None:
        code = (course_code or "").strip().upper()
        if code and code not in self._courses:
            self._courses.append(code)

    def teaches_course(self, course_code: str) -> bool:
        return (course_code or "").strip().upper() in self._courses

    def can_override(self) -> bool:
        return self.is_active_account()

    def get_permissions(self) -> List[str]:
        return [
            "manage_courses",
            "start_session",
            "end_session",
            "override_attendance",
            "review_excuse",
            "export_course_report",
        ]

    def get_portal_route(self) -> str:
        return "instructor.html"

    def get_dashboard_summary(self) -> str:
        return f"Instructor: {self._full_name} • {self._department}"

    def to_dict(self, include_hash: bool = False) -> Dict[str, Any]:
        data = super().to_dict(include_hash=include_hash)
        data["courses"] = list(self._courses)
        return data


class Advisor(User):
    """Concrete Academic Advisor actor managing Early Warning interventions."""

    def __init__(
        self,
        user_id: Optional[int],
        email: str,
        password_hash: str,
        full_name: str,
        status: str = "Active",
        department: str = "Student Support Services",
        cohort_scope: str = "All CS Undergrads",
    ):
        super().__init__(
            user_id,
            email,
            password_hash,
            full_name,
            "Advisor",
            status,
            department or "Student Support Services",
        )
        self._cohort_scope = cohort_scope

    @property
    def cohort_scope(self) -> str:
        return self._cohort_scope

    def can_counsel(self, student: Student) -> bool:
        return self.is_active_account() and isinstance(student, Student)

    def get_permissions(self) -> List[str]:
        return ["view_ews_flags", "add_counseling_note", "view_counseling_notes"]

    def get_portal_route(self) -> str:
        return "advisor.html"

    def get_dashboard_summary(self) -> str:
        return f"Advisor: {self._full_name} • {self._department}"

    def to_dict(self, include_hash: bool = False) -> Dict[str, Any]:
        data = super().to_dict(include_hash=include_hash)
        data["courses"] = [self._cohort_scope]
        return data


class Administrator(User):
    """Concrete System Administrator actor with institutional RBAC and governance rights."""

    def __init__(
        self,
        user_id: Optional[int],
        email: str,
        password_hash: str,
        full_name: str,
        status: str = "Active",
        department: str = "Global Campus Administration",
        privilege_level: str = "Root Master Node",
    ):
        super().__init__(
            user_id,
            email,
            password_hash,
            full_name,
            "Administrator",
            status,
            department or "Global Campus Administration",
        )
        self._privilege_level = privilege_level

    @property
    def privilege_level(self) -> str:
        return self._privilege_level

    def can_provision(self) -> bool:
        return self.is_active_account()

    def get_permissions(self) -> List[str]:
        return [
            "manage_users",
            "reset_passwords",
            "manage_courses",
            "manage_enrollments",
            "view_audit_logs",
            "export_system_report",
        ]

    def get_portal_route(self) -> str:
        return "admin.html"

    def get_dashboard_summary(self) -> str:
        return f"Administrator: {self._full_name} • {self._department}"

    def to_dict(self, include_hash: bool = False) -> Dict[str, Any]:
        data = super().to_dict(include_hash=include_hash)
        data["courses"] = ["System Master Node"]
        data["privilegeLevel"] = self._privilege_level
        return data


class UserFactory:
    """Factory Method class constructing concrete User subclasses from DB rows or payloads."""

    @staticmethod
    def from_row(row: Any, courses: Optional[List[str]] = None) -> User:
        r = dict(row)
        role = r.get("role", "Student")
        user_id = r.get("id")
        email = r.get("email", "")
        pw_hash = r.get("password_hash", "")
        full_name = r.get("full_name", "")
        status = r.get("status") or "Active"
        department = r.get("department") or ""

        if role == "Student":
            return Student(
                user_id=user_id,
                email=email,
                password_hash=pw_hash,
                full_name=full_name,
                status=status,
                student_id=r.get("student_id"),
                major=r.get("major") or "B.S. Software Engineering",
                academic_year=r.get("academic_year") or "Year 3",
                department=department,
                courses=courses or [],
            )
        if role == "Instructor":
            return Instructor(
                user_id=user_id,
                email=email,
                password_hash=pw_hash,
                full_name=full_name,
                status=status,
                department=department or "Faculty of Engineering",
                courses=courses or ["CS-301", "CS-402"],
            )
        if role == "Advisor":
            return Advisor(
                user_id=user_id,
                email=email,
                password_hash=pw_hash,
                full_name=full_name,
                status=status,
                department=department or "Student Support Services",
            )
        if role == "Administrator":
            return Administrator(
                user_id=user_id,
                email=email,
                password_hash=pw_hash,
                full_name=full_name,
                status=status,
                department=department or "Global Campus Administration",
            )
        raise ValueError(f"Unknown user role discriminator: '{role}'")


class Course(BaseEntity):
    """Domain class representing an academic course offering."""

    def __init__(
        self,
        course_id: Optional[int],
        course_name: str,
        course_code: Optional[str] = None,
        title: Optional[str] = None,
        room: str = "Hall B-12",
    ):
        super().__init__(course_id)
        parsed_code, parsed_title = self._split_course_name(course_name)
        self._code = (course_code or parsed_code).strip().upper()
        self._title = (title or parsed_title).strip()
        self._course_name = f"{self._code}: {self._title}" if self._title else self._code
        self._room = (room or "Hall B-12").strip()

    @staticmethod
    def _split_course_name(course_name: str) -> Tuple[str, str]:
        raw = (course_name or "").strip()
        if ":" in raw:
            parts = raw.split(":", 1)
            return parts[0].strip().upper(), parts[1].strip()
        return raw.upper(), raw

    @property
    def code(self) -> str:
        return self._code

    @property
    def title(self) -> str:
        return self._title

    @property
    def course_name(self) -> str:
        return self._course_name

    @property
    def room(self) -> str:
        return self._room

    def display_label(self) -> str:
        return f"{self._course_name} ({self._room})" if self._room else self._course_name

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self._id,
            "code": self._code,
            "title": self._title,
            "course_name": self._course_name,
            "room": self._room,
            "displayLabel": self.display_label(),
        }


class Enrollment(BaseEntity):
    """Domain class representing an N-N student-course enrollment association."""

    def __init__(
        self,
        user_id: int,
        course_id: int,
        student_name: str = "",
        course_name: str = "",
        semester: str = "Fall 2026",
        enrollment_id: Optional[int] = None,
    ):
        super().__init__(enrollment_id)
        self._user_id = int(user_id)
        self._course_id = int(course_id)
        self._student_name = student_name
        self._course_name = course_name
        self._semester = semester

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self._id or f"{self._user_id}-{self._course_id}",
            "user_id": self._user_id,
            "userId": self._user_id,
            "student_name": self._student_name,
            "studentName": self._student_name,
            "course_id": self._course_id,
            "courseId": self._course_id,
            "course_name": self._course_name,
            "course": self._course_name,
            "semester": self._semester,
            "term": self._semester,
        }


class AttendanceSession(BaseEntity):
    """Domain class encapsulating live attendance session PIN verification and timing windows."""

    DEFAULT_DURATION_SECONDS = 15 * 60

    def __init__(
        self,
        session_id: Optional[int],
        course_id: int,
        session_code: str,
        start_time: str,
        is_active: bool = True,
        course_code: str = "",
        course_name: str = "",
        duration_seconds: int = DEFAULT_DURATION_SECONDS,
    ):
        super().__init__(session_id)
        self._course_id = int(course_id)
        self._session_code = (session_code or "").strip()
        self._start_time = start_time
        self._is_active = bool(is_active)
        self._course_code = course_code
        self._course_name = course_name
        self._duration_seconds = duration_seconds

    @property
    def course_id(self) -> int:
        return self._course_id

    @property
    def course_code(self) -> str:
        return self._course_code

    @property
    def course_name(self) -> str:
        return self._course_name

    @property
    def session_code(self) -> str:
        return self._session_code

    @property
    def start_time(self) -> str:
        return self._start_time

    @property
    def is_active(self) -> bool:
        return self._is_active

    @is_active.setter
    def is_active(self, value: bool) -> None:
        self._is_active = bool(value)

    def start_datetime(self) -> datetime:
        return datetime.strptime(self._start_time, "%Y-%m-%d %H:%M:%S")

    def matches_pin(self, entered_token: str) -> bool:
        if not entered_token:
            return False
        cleaned_entered = entered_token.strip().replace("-", "").replace(" ", "").lower()
        cleaned_stored = self._session_code.strip().replace("-", "").replace(" ", "").lower()
        return bool(cleaned_entered) and cleaned_entered == cleaned_stored

    def evaluate_check_in(self, checkin_time: Optional[datetime] = None) -> Tuple[str, str]:
        now = checkin_time or datetime.now()
        elapsed_minutes = max(0.0, (now - self.start_datetime()).total_seconds() / 60.0)
        if elapsed_minutes < 15.0:
            return "Present", f"Check-in verified: Present ({elapsed_minutes:.1f}m into session)."
        if 15.0 <= elapsed_minutes <= 45.0:
            return "Late", f"Check-in verified: Late (+{int(elapsed_minutes)}m arrival)."
        return "Absent", "Session verification window has closed (>45m elapsed)."

    def remaining_seconds(self, now: Optional[datetime] = None) -> int:
        if not self._is_active:
            return 0
        current = now or datetime.now()
        elapsed = max(0, int((current - self.start_datetime()).total_seconds()))
        return max(0, self._duration_seconds - elapsed)

    def to_dict(self) -> Dict[str, Any]:
        start_dt = self.start_datetime()
        rem = self.remaining_seconds()
        formatted_pin = self._session_code
        if len(formatted_pin) == 6 and "-" not in formatted_pin and formatted_pin.isdigit():
            formatted_pin = f"{formatted_pin[:3]}-{formatted_pin[3:]}"
        return {
            "session_id": self._id,
            "course_id": self._course_id,
            "session_code": self._session_code,
            "start_time": self._start_time,
            "is_active": 1 if self._is_active else 0,
            "duration_seconds": self._duration_seconds,
            "active": self._is_active,
            "code": formatted_pin,
            "course": self._course_code or f"CRS-{self._course_id}",
            "courseName": self._course_name or self._course_code,
            "startTime": int(start_dt.timestamp() * 1000),
            "remainingSeconds": rem,
        }


class AttendanceRecord(BaseEntity):
    """Domain entity representing an individual student's check-in or override record."""

    VALID_STATUSES = ("Present", "Late", "Absent", "Excused")

    def __init__(
        self,
        record_id: Optional[int],
        session_id: int,
        student_id: int,
        status: str,
        time_logged: str,
        updated_by: Optional[int] = None,
        student_name: str = "",
        student_code: str = "",
        email: str = "",
        method: str = "PIN Input",
        updated_by_name: str = "",
    ):
        super().__init__(record_id)
        self._session_id = int(session_id)
        self._student_id = int(student_id)
        self._status = "Absent"
        self.status = status
        self._time_logged = time_logged
        self._updated_by = updated_by
        self._student_name = student_name
        self._student_code = student_code or str(student_id)
        self._email = email
        self._method = method or "PIN Input"
        self._updated_by_name = updated_by_name or ("System Auto" if status == "Absent" else "Self (PIN)")

    @property
    def status(self) -> str:
        return self._status

    @status.setter
    def status(self, value: str) -> None:
        if value not in self.VALID_STATUSES:
            raise ValueError(f"Invalid attendance status: '{value}'")
        self._status = value

    def to_dict(self) -> Dict[str, Any]:
        short_time = self._time_logged
        try:
            short_time = datetime.strptime(self._time_logged, "%Y-%m-%d %H:%M:%S").strftime("%I:%M %p")
        except Exception:
            pass
        if self._status == "Absent" and self._updated_by is None:
            short_time = "--"
            method_display = "Pending"
        else:
            method_display = "Manual Override" if self._updated_by else self._method

        return {
            "attendance_id": self._id,
            "session_id": self._session_id,
            "student_id": self._student_id,
            "id": self._student_code,
            "studentDbId": self._student_id,
            "name": self._student_name,
            "full_name": self._student_name,
            "email": self._email,
            "status": self._status,
            "time_logged": self._time_logged,
            "time": short_time,
            "method": method_display,
            "updated_by": self._updated_by,
            "updatedBy": self._updated_by_name,
        }


class ExcuseRequest(BaseEntity):
    """Domain entity modeling a student absence excuse petition."""

    VALID_STATUSES = ("Pending", "Approved", "Rejected")

    def __init__(
        self,
        excuse_id: Optional[int],
        student_id: int,
        course_id: int,
        date_absent: str,
        reason: str,
        status: str = "Pending",
        student_name: str = "",
        student_code: str = "",
        course_name: str = "",
    ):
        super().__init__(excuse_id)
        self._student_id = int(student_id)
        self._course_id = int(course_id)
        self._date_absent = date_absent
        self._reason = (reason or "").strip()
        if not self._reason:
            raise ValueError("Excuse reason cannot be empty.")
        self._status = status if status in self.VALID_STATUSES else "Pending"
        self._student_name = student_name
        self._student_code = student_code or str(student_id)
        self._course_name = course_name

    def approve(self) -> None:
        self._status = "Approved"

    def reject(self) -> None:
        self._status = "Rejected"

    def to_dict(self) -> Dict[str, Any]:
        course_code = self._course_name.split(":")[0].strip() if self._course_name else f"CRS-{self._course_id}"
        return {
            "id": self._id,
            "excuse_id": self._id,
            "student_id": self._student_id,
            "studentId": self._student_code,
            "student_name": self._student_name,
            "studentName": self._student_name,
            "course_id": self._course_id,
            "course_name": self._course_name,
            "course": course_code,
            "date_absent": self._date_absent,
            "date": self._date_absent,
            "reason": self._reason,
            "status": self._status,
        }


class CounselingNote(BaseEntity):
    """Domain entity storing an academic advisor's counseling intervention record."""

    def __init__(
        self,
        note_id: Optional[int],
        student_id: int,
        advisor_id: int,
        note_text: str,
        created_at: str,
        advisor_name: str = "",
    ):
        super().__init__(note_id)
        self._student_id = int(student_id)
        self._advisor_id = int(advisor_id)
        self._note_text = (note_text or "").strip()
        if not self._note_text:
            raise ValueError("Counseling note cannot be empty.")
        self._created_at = created_at
        self._advisor_name = advisor_name

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self._id,
            "student_id": self._student_id,
            "advisor_id": self._advisor_id,
            "advisor_name": self._advisor_name,
            "advisor": self._advisor_name,
            "note_text": self._note_text,
            "text": self._note_text,
            "created_at": self._created_at,
            "date": self._created_at[:16],
        }


class AuditLog(BaseEntity):
    """Domain entity capturing immutable institutional security & governance events."""

    def __init__(
        self,
        log_id: Optional[int],
        user_id: Optional[int],
        action: str,
        timestamp: str,
        details: str = "",
        full_name: Optional[str] = None,
        email: Optional[str] = None,
    ):
        super().__init__(log_id)
        self._user_id = user_id
        self._action = action
        self._timestamp = timestamp
        self._details = details or ""
        self._full_name = full_name or "System Governance"
        self._email = email or ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self._id,
            "user_id": self._user_id,
            "user": self._full_name,
            "full_name": self._full_name,
            "email": self._email,
            "action": self._action,
            "timestamp": self._timestamp,
            "time": self._timestamp,
            "details": self._details,
        }


class JiraBugReport(BaseEntity):
    """Domain entity representing a QA defect tracked in Jira workflow."""

    VALID_PRIORITIES = ("Highest", "High", "Medium", "Low", "Lowest")
    VALID_SEVERITIES = ("Blocker", "Critical", "Major", "Minor", "Trivial")
    VALID_STATUSES = ("To Do", "In Progress", "In Review", "Done")

    def __init__(
        self,
        bug_id: Optional[int],
        issue_key: str,
        summary: str,
        description: str,
        test_case_id: str = "GENERAL",
        module: str = "System",
        priority: str = "Medium",
        severity: str = "Major",
        status: str = "To Do",
        reporter_id: Optional[int] = None,
        reporter_name: str = "QA Lead",
        assignee: str = "Unassigned",
        jira_remote_key: Optional[str] = None,
        jira_sync_status: str = "Local Jira Queue",
        created_at: str = "",
        updated_at: str = "",
    ):
        super().__init__(bug_id)
        clean_summary = (summary or "").strip()
        if not clean_summary:
            raise ValueError("Jira bug summary cannot be empty.")
        self._issue_key = (issue_key or "SAS-NEW").strip().upper()
        self._summary = clean_summary
        self._description = (description or "").strip() or "No reproduction steps provided."
        self._test_case_id = (test_case_id or "GENERAL").strip().upper()
        self._module = (module or "System").strip()
        self._priority = priority if priority in self.VALID_PRIORITIES else "Medium"
        self._severity = severity if severity in self.VALID_SEVERITIES else "Major"
        self._status = status if status in self.VALID_STATUSES else "To Do"
        self._reporter_id = reporter_id
        self._reporter_name = reporter_name or "QA Lead"
        self._assignee = (assignee or "Unassigned").strip()
        self._jira_remote_key = jira_remote_key
        self._jira_sync_status = jira_sync_status or "Local Jira Queue"
        self._created_at = created_at
        self._updated_at = updated_at or created_at

    @property
    def issue_key(self) -> str:
        return self._issue_key

    @property
    def status(self) -> str:
        return self._status

    def transition_status(self, new_status: str) -> None:
        if new_status not in self.VALID_STATUSES:
            raise ValueError(f"Invalid Jira status '{new_status}'.")
        self._status = new_status

    def to_jira_issue_payload(self, project_key: str = "SAS") -> Dict[str, Any]:
        """Return standard Atlassian Jira Cloud REST API v3 issue payload."""
        desc_text = (
            f"Linked Test Case: {self._test_case_id}\n"
            f"Module/Component: {self._module}\n"
            f"Severity: {self._severity}\n"
            f"Reporter: {self._reporter_name}\n\n"
            f"Steps / Details:\n{self._description}"
        )
        return {
            "fields": {
                "project": {"key": project_key},
                "issuetype": {"name": "Bug"},
                "summary": f"[{self._test_case_id}] {self._summary}",
                "priority": {"name": self._priority},
                "labels": ["sas-enterprise", self._test_case_id.lower(), self._severity.lower()],
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": desc_text}],
                        }
                    ],
                },
            }
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self._id,
            "issueKey": self._issue_key,
            "issue_key": self._issue_key,
            "summary": self._summary,
            "description": self._description,
            "testCaseId": self._test_case_id,
            "test_case_id": self._test_case_id,
            "module": self._module,
            "priority": self._priority,
            "severity": self._severity,
            "status": self._status,
            "reporterId": self._reporter_id,
            "reporterName": self._reporter_name,
            "assignee": self._assignee,
            "jiraRemoteKey": self._jira_remote_key,
            "jiraSyncStatus": self._jira_sync_status,
            "createdAt": self._created_at,
            "updatedAt": self._updated_at,
        }

