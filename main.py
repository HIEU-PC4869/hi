#!/usr/bin/env python3
"""
main.py - Main Application Entry Point
SAS Enterprise - Student Attendance & Intelligence System

Strict Architectural Pattern (Chapter 3, Slides 17-19):
  ONLY ONE PATTERN: MVC (Model - View - Controller)
  - Model      (model/)      : Domain OOP Entities + SQLite3 AttendanceModel CRUD
  - View       (*.html, shared.js): Browser Presentation & Event Capture
  - Controller (controller/) : AttendanceController + HTTP Dispatcher (no raw SQL)

Run standalone:
    python main.py
Run automated OOP & strict MVC pytest suite:
    pytest -v
    python main.py --test
"""

import os
import sys

from controller import http_controller
from controller.attendance_controller import AttendanceController
from model.database import init_database


def main() -> None:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    print("\n" + "=" * 68)
    print("  SAS ENTERPRISE - STUDENT ATTENDANCE & INTELLIGENCE SYSTEM")
    print("  Architectural Pattern: Strictly MVC (Model - View - Controller)")
    print("=" * 68)

    print("  [1/3] Model Layer: Initializing SQLite3 DB & schema migrations...")
    init_database()

    print("  [2/3] Controller Layer: Connecting AttendanceController -> AttendanceModel...")
    controller = AttendanceController()
    users = controller.get_all_user_objects()
    courses = controller.get_all_courses()
    print(f"  [OK] Loaded {len(users)} polymorphic User objects and {len(courses)} courses via Model.")
    if controller.is_jira_cloud_configured():
        print(f"  [OK] Jira Cloud REST API v3 sync enabled (Project: {os.environ.get('JIRA_PROJECT_KEY', 'SAS')}).")
    else:
        print("  [Info] Jira Bug Tracking active in Local Queue + CSV mode (.env/Secrets optional).")

    if "--test" in sys.argv:
        print("  [TEST] Running automated OOP & strict MVC pytest suite...")
        try:
            import pytest
        except ImportError:
            print("  [ERROR] pytest is not installed. Install via: pip install -r requirements.txt")
            sys.exit(1)

        sys.exit(pytest.main(["-v"]))

    no_browser = "--no-browser" in sys.argv
    print(f"  [3/3] Controller -> View: Launching Web GUI & REST API (port {http_controller.PORT})...")
    print("=" * 68 + "\n")
    http_controller.run(open_browser=not no_browser)


if __name__ == "__main__":
    main()
