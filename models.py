"""
models.py - Compatibility Re-export for MVC Model Domain Entities
Delegates strictly to model.entities (MVC Model Component).
"""

from model.entities import (
    Administrator,
    Advisor,
    AttendanceRecord,
    AttendanceSession,
    AuditLog,
    BaseEntity,
    CounselingNote,
    Course,
    Enrollment,
    ExcuseRequest,
    Instructor,
    JiraBugReport,
    Student,
    User,
    UserFactory,
)

__all__ = [
    "BaseEntity",
    "User",
    "Student",
    "Instructor",
    "Advisor",
    "Administrator",
    "UserFactory",
    "Course",
    "Enrollment",
    "AttendanceSession",
    "AttendanceRecord",
    "ExcuseRequest",
    "JiraBugReport",
    "CounselingNote",
    "AuditLog",
]
