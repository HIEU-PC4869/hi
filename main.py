#!/usr/bin/env python3
"""
main.py - Main Application Entry Point
SAS Enterprise - Student Attendance & Intelligence System

Architecture:
- MVC Architecture (Chapter 3 Software Engineering):
  * Model: database.py (SQLite3, 8 normalized entities)
  * View: index.html (Responsive Glacier Dark Glassmorphism Web App)
  * Controller: logic.py (AttendanceLogic) & server.py (HTTP Request Routing)
- Zero GUI toolkit dependencies (PySide6 / Qt UI removed).
- Runs directly on standard Python 3.
"""

import sys
import os
from database import init_database
from logic import AttendanceLogic
import server


def main():
    """Initializes system database and launches the web interface."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    print("\n" + "=" * 68)
    print("  🎓 SAS ENTERPRISE - STUDENT ATTENDANCE & INTELLIGENCE SYSTEM")
    print("  📌 Software Architecture: Web Client-Server MVC (Ch3 SE)")
    print("=" * 68)

    # 1. Initialize SQLite Database & Relational Schemas
    print("  ⚙️ Initializing SQLite Database (PRAGMA foreign_keys = ON)...")
    init_database()

    # 2. Verify Logic & Data Integrity
    logic = AttendanceLogic()
    users = logic.get_all_users()
    courses = logic.get_all_courses()
    print(f"  ✅ Data Integrity OK: {len(users)} users, {len(courses)} courses loaded.")

    # 3. Check CLI arguments (e.g. python main.py --test)
    if "--test" in sys.argv:
        print("  🧪 Running automated unit test suite (test_logic.py)...")
        import unittest
        suite = unittest.defaultTestLoader.discover(".", pattern="test_*.py")
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        sys.exit(0 if result.wasSuccessful() else 1)

    # 4. Launch Web Application Server
    print("  🚀 Starting Web Application Server...")
    print("=" * 68 + "\n")
    server.run()


if __name__ == "__main__":
    main()
