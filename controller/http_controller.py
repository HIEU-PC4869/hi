#!/usr/bin/env python3
"""
controller/http_controller.py - MVC Web Controller Dispatcher
SAS Enterprise - Student Attendance & Intelligence System

Handles HTTP user requests (1), delegates to AttendanceController -> AttendanceModel (2),
and sends formatted data models / HTML views back to the browser View (3 & 4).
"""

import http.server
import json
import os
import re
import sys
import urllib.parse
import webbrowser
from typing import Any, Dict, Optional

from controller.attendance_controller import AttendanceController
from model.database import init_database

PORT = int(os.environ.get("PYTHON_API_PORT", "8000"))
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class ThreadingHTTPServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


class SASHttpHandler(http.server.SimpleHTTPRequestHandler):
    """Unified MVC Web Dispatcher serving View HTML/JS assets and Controller JSON endpoints."""

    controller: Optional[AttendanceController] = None

    def _get_controller(self) -> AttendanceController:
        if SASHttpHandler.controller is None:
            SASHttpHandler.controller = AttendanceController()
        return SASHttpHandler.controller

    def log_message(self, format: str, *args: Any) -> None:
        if args and str(args[1]).startswith(("4", "5")):
            super().log_message(format, *args)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def _send_json(self, status_code: int, payload: Any) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_csv(self, filename: str, csv_content: str) -> None:
        body = ("\ufeff" + csv_content).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)

        if path.startswith("/api/"):
            self._handle_api_get(path, qs)
            return

        if path == "/":
            self.path = "/index.html"
        elif "?" in self.path:
            self.path = path
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        self._handle_api_post(parsed.path, self._read_json_body())

    def do_PUT(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        self._handle_api_put(parsed.path, self._read_json_body())

    def do_DELETE(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        self._handle_api_delete(parsed.path, self._read_json_body())

    def _handle_api_get(self, path: str, qs: Dict[str, Any]) -> None:
        ctrl = self._get_controller()
        if path == "/api/health":
            self._send_json(
                200,
                {
                    "ok": True,
                    "architecture": "MVC (Model-View-Controller)",
                    "serverTimeUtc": ctrl._utc_now_str(),
                },
            )
            return

        if path == "/api/state":
            user_id_param = qs.get("userId", [None])[0]
            uid = int(user_id_param) if user_id_param and str(user_id_param).isdigit() else None
            self._send_json(200, ctrl.get_full_state(current_user_id=uid))
            return

        if path == "/api/users":
            self._send_json(200, {"ok": True, "users": ctrl.get_all_users()})
            return

        if path == "/api/courses":
            self._send_json(200, {"ok": True, "courses": ctrl.get_all_courses()})
            return

        if path == "/api/enrollments":
            self._send_json(200, {"ok": True, "enrollments": ctrl.get_enrollments()})
            return

        if path == "/api/audit-logs":
            self._send_json(200, {"ok": True, "auditLogs": ctrl.get_audit_logs()})
            return

        if path == "/api/reports/course":
            course_ref = qs.get("courseId", [None])[0] or qs.get("course", [None])[0]
            csv_data = ctrl.export_course_report_csv_string(course_ref)
            self._send_csv("Course_Attendance_Roster_Export.csv", csv_data)
            return

        if path == "/api/reports/system":
            csv_data = ctrl.export_system_report_csv_string()
            self._send_csv("SAS_System_Attendance_Audit_Report.csv", csv_data)
            return

        if path == "/api/bugs":
            self._send_json(
                200,
                {
                    "ok": True,
                    "bugs": ctrl.get_bug_reports(),
                    "jiraConfigured": ctrl.is_jira_cloud_configured(),
                },
            )
            return

        if path == "/api/bugs/export-jira-csv":
            csv_data = ctrl.export_jira_bugs_csv_string()
            self._send_csv("SAS_Jira_Bug_Import.csv", csv_data)
            return

        self._send_json(404, {"ok": False, "error": f"Unknown API endpoint: {path}"})

    def _handle_api_post(self, path: str, body: Dict[str, Any]) -> None:
        ctrl = self._get_controller()

        if path == "/api/auth/login":
            email = str(body.get("email", "")).strip()
            password = str(body.get("password", ""))
            user_obj = ctrl.authenticate_user_object(email, password)
            if not user_obj:
                self._send_json(
                    401,
                    {"ok": False, "error": "Invalid email or password. Please verify your institutional credentials."},
                )
                return
            self._send_json(
                200,
                {
                    "ok": True,
                    "user": user_obj.to_dict(),
                    "redirect": user_obj.get_portal_route(),
                    "state": ctrl.get_full_state(current_user_id=user_obj.id),
                },
            )
            return

        if path == "/api/auth/logout":
            uid = body.get("userId")
            uname = str(body.get("userName", "User"))
            ctrl.record_logout(int(uid) if uid and str(uid).isdigit() else None, uname)
            self._send_json(200, {"ok": True})
            return

        if path == "/api/users":
            ok, msg = ctrl.add_user(
                email=body.get("email", ""),
                role=body.get("role", "Student"),
                full_name=body.get("fullName") or body.get("name"),
                password=body.get("password") or "password123",
                student_id=body.get("studentId") or body.get("student_id"),
                major=body.get("major"),
                academic_year=body.get("academicYear") or body.get("year"),
                department=body.get("department"),
                courses=body.get("courses"),
                actor_id=body.get("actorId"),
            )
            self._send_json(201 if ok else 400, {"ok": ok, "message": msg, "state": ctrl.get_full_state()})
            return

        if path == "/api/courses":
            ok, msg = ctrl.add_course(
                course_code=body.get("code", ""),
                course_name=body.get("title") or body.get("name", ""),
                room=body.get("room", "Hall B-12"),
                actor_id=body.get("actorId"),
            )
            self._send_json(201 if ok else 400, {"ok": ok, "message": msg, "state": ctrl.get_full_state()})
            return

        if path == "/api/instructor/courses":
            inst_id = int(body.get("instructorId") or 2)
            ok, msg = ctrl.assign_instructor_course(
                instructor_id=inst_id,
                course_code=body.get("code", ""),
                course_title=body.get("title", ""),
                room=body.get("room", "Hall B-12"),
            )
            self._send_json(201 if ok else 400, {"ok": ok, "message": msg, "state": ctrl.get_full_state(inst_id)})
            return

        if path == "/api/enrollments":
            ok, msg = ctrl.add_enrollment(
                user_id=int(body.get("userId", 0)),
                course_id=body.get("courseId") or body.get("course"),
                semester=body.get("term", "Fall 2026"),
                actor_id=body.get("actorId"),
            )
            self._send_json(201 if ok else 400, {"ok": ok, "message": msg, "state": ctrl.get_full_state()})
            return

        if path == "/api/sessions/start":
            course_ref = body.get("courseId") or body.get("course") or "CS-301"
            inst_id = body.get("instructorId")
            session_info = ctrl.start_attendance_session(
                course_id=course_ref,
                custom_code=body.get("customCode"),
                instructor_id=int(inst_id) if inst_id and str(inst_id).isdigit() else None,
            )
            self._send_json(200, {"ok": True, "session": session_info, "state": ctrl.get_full_state(inst_id)})
            return

        if path == "/api/sessions/end":
            sid = body.get("sessionId")
            inst_id = body.get("instructorId")
            ok = ctrl.end_attendance_session(
                session_id=int(sid) if sid and str(sid).isdigit() else None,
                instructor_id=int(inst_id) if inst_id and str(inst_id).isdigit() else None,
            )
            self._send_json(200 if ok else 400, {"ok": ok, "state": ctrl.get_full_state(inst_id)})
            return

        if path == "/api/attendance/checkin":
            student_ref = body.get("studentId") or body.get("userId")
            course_ref = body.get("course") or body.get("courseId")
            pin = body.get("pin") or body.get("token", "")
            ok, att_status, msg = ctrl.check_in(student_id=student_ref, course_id=course_ref, entered_token=pin)
            uid = int(body.get("userId")) if body.get("userId") and str(body.get("userId")).isdigit() else None
            self._send_json(200 if ok else 400, {"ok": ok, "status": att_status, "message": msg, "state": ctrl.get_full_state(uid)})
            return

        if path == "/api/attendance/override":
            att_id = body.get("attendanceId")
            new_status = body.get("status", "Present")
            inst_id = int(body.get("instructorId") or 2)
            ok = ctrl.manual_override_status(int(att_id), new_status, inst_id)
            self._send_json(200 if ok else 400, {"ok": ok, "state": ctrl.get_full_state(inst_id)})
            return

        if path == "/api/excuses":
            student_ref = body.get("studentId") or body.get("userId")
            course_ref = body.get("course") or body.get("courseId")
            date_absent = body.get("date", "")
            reason = body.get("reason", "")
            ok, msg = ctrl.submit_excuse(student_ref, course_ref, date_absent, reason)
            uid = int(body.get("userId")) if body.get("userId") and str(body.get("userId")).isdigit() else None
            self._send_json(201 if ok else 400, {"ok": ok, "message": msg, "state": ctrl.get_full_state(uid)})
            return

        m_excuse = re.match(r"^/api/excuses/(\d+)/review$", path)
        if m_excuse:
            exc_id = int(m_excuse.group(1))
            decision = body.get("decision", "")
            inst_id = int(body.get("instructorId") or 2)
            ok = ctrl.review_excuse(exc_id, decision, inst_id)
            self._send_json(200 if ok else 400, {"ok": ok, "state": ctrl.get_full_state(inst_id)})
            return

        if path == "/api/warnings/notes":
            student_ref = body.get("studentId")
            advisor_id = int(body.get("advisorId") or 3)
            note_text = body.get("noteText") or body.get("text", "")
            ok = ctrl.save_counseling_note(student_ref, advisor_id, note_text)
            self._send_json(201 if ok else 400, {"ok": ok, "state": ctrl.get_full_state(advisor_id)})
            return

        if path == "/api/bugs":
            rep_id = body.get("reporterId")
            ok, msg, bug = ctrl.log_jira_bug(
                summary=body.get("summary", ""),
                description=body.get("description", ""),
                test_case_id=body.get("testCaseId", "GENERAL"),
                module=body.get("module", "System"),
                priority=body.get("priority", "Medium"),
                severity=body.get("severity", "Major"),
                reporter_id=int(rep_id) if rep_id and str(rep_id).isdigit() else None,
                assignee=body.get("assignee", "Backend MVC Team"),
            )
            self._send_json(201 if ok else 400, {"ok": ok, "message": msg, "bug": bug, "state": ctrl.get_full_state()})
            return

        if path == "/api/bugs/jira-test":
            ok, msg = ctrl.verify_jira_connection()
            self._send_json(
                200 if ok else 400,
                {
                    "ok": ok,
                    "message": msg,
                    "jiraConfigured": ctrl.is_jira_cloud_configured(),
                },
            )
            return

        m_bug_sync = re.match(r"^/api/bugs/(\d+)/sync$", path)
        if m_bug_sync:
            bug_id = int(m_bug_sync.group(1))
            ok, msg = ctrl.sync_bug_to_jira(bug_id)
            self._send_json(200 if ok else 400, {"ok": ok, "message": msg, "state": ctrl.get_full_state()})
            return

        self._send_json(404, {"ok": False, "error": f"Unknown API POST route: {path}"})

    def _handle_api_put(self, path: str, body: Dict[str, Any]) -> None:
        ctrl = self._get_controller()
        m_user = re.match(r"^/api/users/(\d+)$", path)
        if m_user:
            uid = int(m_user.group(1))
            ok, msg = ctrl.update_user(
                user_id=uid,
                email=body.get("email", ""),
                full_name=body.get("fullName") or body.get("name", ""),
                role=body.get("role", "Student"),
                status=body.get("status", "Active"),
                password=body.get("password"),
                student_id=body.get("studentId") or body.get("student_id"),
                major=body.get("major"),
                academic_year=body.get("academicYear") or body.get("year"),
                department=body.get("department"),
                courses=body.get("courses"),
                actor_id=body.get("actorId"),
            )
            self._send_json(200 if ok else 400, {"ok": ok, "message": msg, "state": ctrl.get_full_state()})
            return

        m_bug_status = re.match(r"^/api/bugs/(\d+)/status$", path)
        if m_bug_status:
            bug_id = int(m_bug_status.group(1))
            actor_id = body.get("actorId")
            ok, msg = ctrl.transition_jira_bug_status(
                bug_id,
                body.get("status", "To Do"),
                actor_id=int(actor_id) if actor_id and str(actor_id).isdigit() else None,
            )
            self._send_json(200 if ok else 400, {"ok": ok, "message": msg, "state": ctrl.get_full_state()})
            return

        self._send_json(404, {"ok": False, "error": f"Unknown API PUT route: {path}"})

    def _handle_api_delete(self, path: str, body: Dict[str, Any]) -> None:
        ctrl = self._get_controller()

        m_user = re.match(r"^/api/users/(\d+)$", path)
        if m_user:
            uid = int(m_user.group(1))
            ok, msg = ctrl.delete_user(uid, actor_id=body.get("actorId"))
            self._send_json(200 if ok else 400, {"ok": ok, "message": msg, "state": ctrl.get_full_state()})
            return

        m_course = re.match(r"^/api/courses/(.+)$", path)
        if m_course:
            course_ref = urllib.parse.unquote(m_course.group(1))
            ok = ctrl.delete_course(course_ref, actor_id=body.get("actorId"))
            self._send_json(200 if ok else 400, {"ok": ok, "state": ctrl.get_full_state()})
            return

        m_bug = re.match(r"^/api/bugs/(\d+)$", path)
        if m_bug:
            bug_id = int(m_bug.group(1))
            actor_id = body.get("actorId")
            ok = ctrl.delete_jira_bug(bug_id, actor_id=int(actor_id) if actor_id and str(actor_id).isdigit() else None)
            self._send_json(200 if ok else 400, {"ok": ok, "state": ctrl.get_full_state()})
            return

        if path == "/api/enrollments":
            user_id = int(body.get("userId", 0))
            course_ref = body.get("courseId") or body.get("course")
            ok = ctrl.delete_enrollment(user_id, course_ref, actor_id=body.get("actorId"))
            self._send_json(200 if ok else 400, {"ok": ok, "state": ctrl.get_full_state()})
            return

        self._send_json(404, {"ok": False, "error": f"Unknown API DELETE route: {path}"})


def run(open_browser: bool = True, port: Optional[int] = None) -> None:
    os.chdir(ROOT_DIR)
    init_database()
    SASHttpHandler.controller = AttendanceController()

    env_port_set = "PYTHON_API_PORT" in os.environ
    target_port = port if port is not None else PORT
    httpd = None

    if env_port_set or port is not None:
        httpd = ThreadingHTTPServer(("0.0.0.0", target_port), SASHttpHandler)
    else:
        for candidate_port in range(target_port, target_port + 11):
            try:
                httpd = ThreadingHTTPServer(("0.0.0.0", candidate_port), SASHttpHandler)
                target_port = candidate_port
                break
            except OSError as exc:
                if candidate_port == target_port:
                    print(f"  [Info] Port {candidate_port} is busy ({exc}); probing next port...")
                if candidate_port == target_port + 10:
                    raise

    assert httpd is not None
    with httpd:
        target_url = f"http://localhost:{target_port}/index.html"
        print("=" * 68)
        print("  SAS Enterprise - Strict MVC Architecture Server")
        print(f"  View Entrypoint  : {target_url}")
        print(f"  Controller API   : http://localhost:{target_port}/api/health")
        print("=" * 68)

        if open_browser:
            try:
                webbrowser.open(target_url)
            except Exception:
                pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped cleanly.")
            sys.exit(0)


if __name__ == "__main__":
    no_browser = "--no-browser" in sys.argv
    run(open_browser=not no_browser)
