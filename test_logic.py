"""
test_logic.py - Unit test suite for database and logic layers
"""

import os
import unittest
from datetime import datetime, timedelta

from database import DBConnection, hash_password, init_database
from logic import AttendanceLogic

TEST_DB = "test_attendance.db"


class TestSASAttendance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)
        init_database(TEST_DB)
        cls.logic = AttendanceLogic(TEST_DB)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)

    def test_01_authentication(self):
        # Valid student
        user = self.logic.authenticate("a.rivera@university.edu", "password123")
        self.assertIsNotNone(user)
        self.assertEqual(user["role"], "Student")

        # Invalid password
        bad_pw = self.logic.authenticate("a.rivera@university.edu", "wrongpass")
        self.assertIsNone(bad_pw)

        # Invalid email
        bad_user = self.logic.authenticate("nobody@univ.edu", "password123")
        self.assertIsNone(bad_user)

    def test_02_checkin_timing_windows(self):
        # Start a test session
        session = self.logic.start_attendance_session(course_id=1, custom_code="123456")
        self.assertIsNotNone(session)
        s_id = session["session_id"]
        start_time = datetime.strptime(session["start_time"], "%Y-%m-%d %H:%M:%S")

        # Case 1: < 15 min -> Present
        ok, status, msg = self.logic.check_in(
            student_id=1,
            course_id=1,
            entered_token="123456",
            checkin_time=start_time + timedelta(minutes=5)
        )
        self.assertTrue(ok)
        self.assertEqual(status, "Present")

        # Case 2: 15-45 min -> Late
        ok, status, msg = self.logic.check_in(
            student_id=5,
            course_id=1,
            entered_token="123456",
            checkin_time=start_time + timedelta(minutes=20)
        )
        self.assertTrue(ok)
        self.assertEqual(status, "Late")

        # Case 3: > 45 min -> Absent / Closed
        ok, status, msg = self.logic.check_in(
            student_id=6,
            course_id=1,
            entered_token="123456",
            checkin_time=start_time + timedelta(minutes=50)
        )
        self.assertTrue(ok)
        self.assertEqual(status, "Absent")

        # Case 4: Invalid token
        ok, status, msg = self.logic.check_in(
            student_id=7,
            course_id=1,
            entered_token="999999",
            checkin_time=start_time + timedelta(minutes=5)
        )
        self.assertFalse(ok)
        self.assertIn("Invalid", msg)

    def test_03_student_statistics(self):
        stats = self.logic.get_student_statistics(student_id=1)
        self.assertTrue(len(stats) > 0)
        # Check properties exist
        s0 = stats[0]
        self.assertIn("course_name", s0)
        self.assertIn("attendance_percentage", s0)
        self.assertIn("compliance_status", s0)
        self.assertTrue(0 <= s0["attendance_percentage"] <= 100)

    def test_04_early_warning_system(self):
        flagged = self.logic.get_early_warning_students()
        self.assertTrue(len(flagged) > 0)
        # Verify David Kim or Sarah Jenkins is in flagged list
        names = [f["student_name"] for f in flagged]
        self.assertTrue("David Kim" in names or "Sarah Jenkins" in names)
        # Check that each flagged student has attendance < 80 or consecutive >= 3
        for f in flagged:
            self.assertTrue(f["attendance_rate"] < 80.0 or f["consecutive_absences"] >= 3)

    def test_05_manual_override(self):
        roster = self.logic.get_instructor_roster(course_id=1)
        self.assertTrue(len(roster) > 0)
        att_id = roster[0]["attendance_id"]
        ok = self.logic.manual_override_status(att_id, "Excused", instructor_id=2)
        self.assertTrue(ok)

        # Check DB reflects updated_by
        with DBConnection(TEST_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT status, updated_by FROM Attendance WHERE id = ?;", (att_id,))
            row = cursor.fetchone()
            self.assertEqual(row["status"], "Excused")
            self.assertEqual(row["updated_by"], 2)

    def test_06_excuse_submission_and_approval(self):
        ok, msg = self.logic.submit_excuse(student_id=1, course_id=1, date_absent="2025-04-18", reason="Medical doctor consultation")
        self.assertTrue(ok)

        excuses = self.logic.get_pending_excuses(course_id=1)
        self.assertTrue(len(excuses) > 0)
        exc_id = excuses[0]["excuse_id"]

        # Approve excuse
        ok = self.logic.review_excuse(exc_id, "Approved", instructor_id=2)
        self.assertTrue(ok)


if __name__ == "__main__":
    unittest.main()
