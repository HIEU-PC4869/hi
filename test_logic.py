"""
test_logic.py - Pytest suite for OOP models, database migrations, and strict MVC architecture.
Run with:
    pytest -v
or:
    python main.py --test
"""

import ast
import sqlite3
from datetime import datetime, timedelta

import pytest

from controller.attendance_controller import AttendanceController
from model.attendance_model import AttendanceModel
from model.database import DBConnection, hash_password, init_database
from model.entities import (
    Administrator,
    Advisor,
    AttendanceSession,
    Course,
    Instructor,
    Student,
    User,
)


@pytest.fixture(scope="module")
def controller(tmp_path_factory) -> AttendanceController:
    """Provision an isolated SQLite database initialized for MVC tests."""
    db_file = tmp_path_factory.mktemp("sas_db") / "test_attendance.db"
    db_path = str(db_file)
    init_database(db_path)
    return AttendanceController(db_path)


def test_01_authentication(controller: AttendanceController):
    # Valid student
    user = controller.authenticate("a.rivera@university.edu", "password123")
    assert user is not None
    assert user["role"] == "Student"
    assert user["portalRoute"] == "student.html"

    # Invalid password
    bad_pw = controller.authenticate("a.rivera@university.edu", "wrongpass")
    assert bad_pw is None

    # Invalid email
    bad_user = controller.authenticate("nobody@univ.edu", "password123")
    assert bad_user is None


def test_02_checkin_timing_windows(controller: AttendanceController):
    # Start a test session
    session = controller.start_attendance_session(course_id=1, custom_code="123456")
    assert session is not None
    start_time = datetime.strptime(session["start_time"], "%Y-%m-%d %H:%M:%S")

    # Case 1: < 15 min -> Present
    ok, status, msg = controller.check_in(
        student_id=1,
        course_id=1,
        entered_token="123456",
        checkin_time=start_time + timedelta(minutes=5),
    )
    assert ok is True
    assert status == "Present"

    # Case 2: 15-45 min -> Late
    ok, status, msg = controller.check_in(
        student_id=5,
        course_id=1,
        entered_token="123456",
        checkin_time=start_time + timedelta(minutes=20),
    )
    assert ok is True
    assert status == "Late"

    # Case 3: > 45 min -> Absent / Closed
    ok, status, msg = controller.check_in(
        student_id=6,
        course_id=1,
        entered_token="123456",
        checkin_time=start_time + timedelta(minutes=50),
    )
    assert ok is True
    assert status == "Absent"

    # Case 4: Invalid token
    ok, status, msg = controller.check_in(
        student_id=7,
        course_id=1,
        entered_token="999999",
        checkin_time=start_time + timedelta(minutes=5),
    )
    assert ok is False
    assert "Invalid" in msg


def test_03_student_statistics(controller: AttendanceController):
    stats = controller.get_student_statistics(student_id=1)
    assert len(stats) > 0
    s0 = stats[0]
    assert "course_name" in s0
    assert "attendance_percentage" in s0
    assert "compliance_status" in s0
    assert 0 <= s0["attendance_percentage"] <= 100


def test_04_early_warning_system(controller: AttendanceController):
    flagged = controller.get_early_warning_students()
    assert len(flagged) > 0
    names = [f["student_name"] for f in flagged]
    assert "David Kim" in names or "Sarah Jenkins" in names
    for f in flagged:
        assert f["attendance_rate"] < 80.0 or f["consecutive_absences"] >= 3


def test_05_manual_override(controller: AttendanceController):
    roster = controller.get_instructor_roster(course_id=1)
    assert len(roster) > 0
    att_id = roster[0]["attendance_id"]
    ok = controller.manual_override_status(att_id, "Excused", instructor_id=2)
    assert ok is True

    with DBConnection(controller.db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status, updated_by FROM Attendance WHERE id = ?;", (att_id,))
        row = cursor.fetchone()
        assert row["status"] == "Excused"
        assert row["updated_by"] == 2


def test_06_excuse_submission_and_approval(controller: AttendanceController):
    ok, msg = controller.submit_excuse(
        student_id=1,
        course_id=1,
        date_absent="2025-04-18",
        reason="Medical doctor consultation",
    )
    assert ok is True

    excuses = controller.get_pending_excuses(course_id=1)
    assert len(excuses) > 0
    exc_id = excuses[0]["excuse_id"]

    ok = controller.review_excuse(exc_id, "Approved", instructor_id=2)
    assert ok is True


def test_07_admin_user_crud_with_password_and_dossier(controller: AttendanceController):
    ok, msg = controller.add_user(
        email="test.student@univ.edu",
        role="Student",
        full_name="Test Student",
        password="CustomPass@2026",
        student_id="29999",
        major="B.S. Data Science & AI",
        academic_year="Year 4",
    )
    assert ok is True

    # Verify custom password works via authenticate
    auth_ok = controller.authenticate("test.student@univ.edu", "CustomPass@2026")
    assert auth_ok is not None
    assert auth_ok["studentId"] == "29999"
    assert auth_ok["major"] == "B.S. Data Science & AI"

    users = controller.get_all_users()
    created = next((u for u in users if u["email"] == "test.student@univ.edu"), None)
    assert created is not None
    uid = created["id"]

    # Update user + password
    ok, msg = controller.update_user(
        uid,
        "test.updated@univ.edu",
        "Test Student Updated",
        "Student",
        "Active",
        password="NewReset@999",
    )
    assert ok is True
    assert controller.authenticate("test.updated@univ.edu", "NewReset@999") is not None
    assert controller.authenticate("test.updated@univ.edu", "CustomPass@2026") is None

    # Delete user
    ok, msg = controller.delete_user(uid)
    assert ok is True
    assert next((u for u in controller.get_all_users() if u["id"] == uid), None) is None


def test_08_oop_inheritance_polymorphism_encapsulation(controller: AttendanceController):
    # Verify abstract User cannot be instantiated directly
    with pytest.raises(TypeError):
        User(1, "x@univ.edu", "h", "X", "Student")  # type: ignore

    # Verify concrete OOP instances hydrated via Factory
    stu = controller.authenticate_user_object("a.rivera@university.edu", "password123")
    inst = controller.authenticate_user_object("dr.vance@university.edu", "password123")
    adv = controller.authenticate_user_object("m.brody@university.edu", "password123")
    adm = controller.authenticate_user_object("sysadmin@university.edu", "password123")

    assert isinstance(stu, Student)
    assert isinstance(inst, Instructor)
    assert isinstance(adv, Advisor)
    assert isinstance(adm, Administrator)

    for actor in (stu, inst, adv, adm):
        assert isinstance(actor, User)

    # Polymorphic portal routes
    assert stu.get_portal_route() == "student.html"
    assert inst.get_portal_route() == "instructor.html"
    assert adv.get_portal_route() == "advisor.html"
    assert adm.get_portal_route() == "admin.html"

    # Encapsulation validation
    with pytest.raises(ValueError):
        stu.email = "invalid-email-without-at"

    # Instructor course assignment
    ok, _ = controller.assign_instructor_course(inst.id, "SWE-420", "Software Architecture", "Hall C-18")
    assert ok is True
    refreshed_inst = controller.get_user_object(inst.id)
    assert isinstance(refreshed_inst, Instructor)
    assert refreshed_inst.teaches_course("SWE-420")

    # Course & AttendanceSession OOP value methods
    c = Course(99, "AI-315: Machine Learning", room="Lab 404")
    assert c.code == "AI-315"
    assert c.room == "Lab 404"

    sess = AttendanceSession(1, 1, "849210", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    assert sess.matches_pin("849-210") is True
    assert sess.matches_pin("000-000") is False


def test_09_safe_legacy_schema_migration(tmp_path):
    """Ensure legacy SQLite schemas without new columns migrate without losing rows."""
    legacy_db = str(tmp_path / "test_migrate_legacy.db")
    conn = sqlite3.connect(legacy_db)
    conn.execute(
        "CREATE TABLE Users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT NOT NULL);"
    )
    conn.execute(
        "CREATE TABLE Courses (id INTEGER PRIMARY KEY AUTOINCREMENT, course_name TEXT UNIQUE NOT NULL);"
    )
    conn.execute(
        "INSERT INTO Users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?);",
        ("legacy@university.edu", hash_password("password123"), "Legacy Student", "Student"),
    )
    conn.execute("INSERT INTO Courses (course_name) VALUES ('CS-301: Advanced Data Structures');")
    conn.commit()
    conn.close()

    # Run migration
    init_database(legacy_db)
    migrated_controller = AttendanceController(legacy_db)
    legacy_user = migrated_controller.authenticate_user_object("legacy@university.edu", "password123")
    assert isinstance(legacy_user, Student)
    assert bool(legacy_user.student_id)


def test_10_strict_mvc_separation(controller: AttendanceController):
    """Verify strict MVC separation: Controller layer has zero sqlite3 imports or raw SQL."""
    assert isinstance(controller, AttendanceController)
    assert isinstance(controller.model, AttendanceModel)

    controller_paths = [
        "controller/attendance_controller.py",
        "controller/http_controller.py",
        "logic.py",
    ]
    sql_markers = ("import sqlite3", "SELECT ", "INSERT INTO", "UPDATE ", "DELETE FROM", "CREATE TABLE", "PRAGMA ")
    for path in controller_paths:
        with open(path, encoding="utf-8") as f:
            src = f.read()
        tree = ast.parse(src)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    assert alias.name != "sqlite3", f"{path} must not import sqlite3"
            elif isinstance(node, ast.ImportFrom):
                assert node.module != "sqlite3", f"{path} must not import from sqlite3"
        for marker in sql_markers:
            assert marker not in src, f"{path} must not contain persistence code ({marker!r})"


def test_11_jira_bug_tracking_workflow(controller: AttendanceController):
    """Verify Jira Bug creation, workflow transitions (To Do -> Done), and Jira CSV export."""
    initial_bugs = controller.get_bug_reports()
    assert len(initial_bugs) >= 2

    # Reject empty summary
    ok_empty, _, _ = controller.log_jira_bug(summary="", description="Missing summary", reporter_id=4)
    assert ok_empty is False

    # Log valid Jira bug linked to TC11
    ok, msg, created = controller.log_jira_bug(
        summary="Expired session token error badge misalignment",
        description="1. Open student.html\n2. Submit expired token\nExpected: Clear warning toast.",
        test_case_id="TC11",
        module="Student Portal",
        priority="High",
        severity="Major",
        reporter_id=4,
        assignee="Frontend View Team",
    )
    assert ok is True
    assert created is not None
    assert created["issueKey"].startswith("SAS-")
    assert created["status"] == "To Do"
    assert created["testCaseId"] == "TC11"

    bug_id = created["id"]

    # Transition across Jira workflow stages
    for stage in ("In Progress", "In Review", "Done"):
        t_ok, _ = controller.transition_jira_bug_status(bug_id, stage, actor_id=4)
        assert t_ok is True

    # Invalid Jira status should be rejected
    bad_ok, _ = controller.transition_jira_bug_status(bug_id, "ClosedInvalid", actor_id=4)
    assert bad_ok is False

    # Export Jira External System CSV Importer string
    csv_out = controller.export_jira_bugs_csv_string()
    assert "Issue Key,Issue Type,Summary" in csv_out
    assert "[TC11] Expired session token error badge misalignment" in csv_out

    # Connection verification without secrets returns descriptive setup notice cleanly
    if not controller.is_jira_cloud_configured():
        conn_ok, conn_msg = controller.verify_jira_connection()
        assert conn_ok is False
        assert "JIRA_BASE_URL" in conn_msg

    # Clean up bug created in test
    assert controller.delete_jira_bug(bug_id, actor_id=4) is True
