"""
logic.py - Compatibility Re-export for MVC Controller
Delegates strictly to controller.attendance_controller (MVC Controller Component).
Contains ZERO raw SQL queries and ZERO sqlite3 imports.
"""

from controller.attendance_controller import AttendanceController

AttendanceLogic = AttendanceController

__all__ = ["AttendanceController", "AttendanceLogic"]
