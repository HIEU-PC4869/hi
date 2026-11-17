"""
model/__init__.py - MVC Model Package
Exports OOP Domain Entities, Database Connection/Migration utilities,
and the unified AttendanceModel CRUD manager.
"""

from model.database import DB_FILE, DBConnection, hash_password, init_database
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
from model.attendance_model import AttendanceModel

__all__ = [
    "DB_FILE",
    "DBConnection",
    "hash_password",
    "init_database",
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
    "AttendanceModel",
]
