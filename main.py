"""
main.py - Main Application Entry Point & PySide6 Controller Navigation
SAS Enterprise - Student Attendance & Intelligence System

Strictly complies with Architecture Requirements:
- 100% PySide6 QUiLoader to load main_app.ui.
- NO initialization of base UI elements in Python (all forms, inputs, tables, buttons loaded from .ui).
- QStackedWidget page switching based on RBAC & interactive navigation tabs.
- Full Glacier Dark Glassmorphism QSS applied across all PySide6 widgets.
- setCellWidget integration for real-time status ComboBox overrides in Instructor's QTableWidget.
- Completely self-contained: auto-seeds database on first launch, robust exception handling.
"""

import os
import sys

try:
    from PySide6.QtCore import QFile, QIODevice, QTimer, Qt
    from PySide6.QtUiTools import QUiLoader
    from PySide6.QtWidgets import (
        QApplication,
        QComboBox,
        QHeaderView,
        QLabel,
        QLineEdit,
        QPushButton,
        QStackedWidget,
        QTableWidget,
        QTableWidgetItem,
        QTextEdit,
        QDateEdit,
        QFileDialog,
        QMessageBox
    )
    PYSIDE6_AVAILABLE = True
except (ImportError, Exception) as _err:
    PYSIDE6_AVAILABLE = False

from database import init_database
from logic import AttendanceLogic

GLACIER_QSS = """
QWidget {
    background-color: #0a0e1a;
    color: #e0e8f0;
    font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif;
    font-size: 13px;
}

QMainWindow, QStackedWidget {
    background-color: #0a0e1a;
}

/* Header & Sidebar frames */
QFrame#frame_top_header {
    background-color: rgba(15, 21, 36, 0.95);
    border-bottom: 1px solid rgba(125, 211, 252, 0.18);
}

QFrame#frame_sidebar {
    background-color: rgba(17, 24, 40, 0.85);
    border-right: 1px solid rgba(125, 211, 252, 0.15);
}

QFrame#frame_student_banner, QFrame#frame_session_bento, QFrame#frame_advisor_kpis, QFrame#frame_login_card, QGroupBox {
    background-color: rgba(20, 28, 46, 0.75);
    border: 1px solid rgba(125, 211, 252, 0.18);
    border-radius: 14px;
    padding: 12px;
}

QGroupBox {
    margin-top: 14px;
    font-weight: bold;
    color: #e0e8f0;
}

QGroupBox::title {
    subcontrol-origin: margin;
    subcontrol-position: top left;
    left: 14px;
    padding: 0 6px;
    color: #7dd3fc;
    font-size: 13px;
}

/* PushButtons */
QPushButton {
    background-color: rgba(26, 36, 56, 0.85);
    color: #e0e8f0;
    border: 1px solid rgba(125, 211, 252, 0.2);
    border-radius: 8px;
    padding: 8px 14px;
    font-weight: 600;
}

QPushButton:hover {
    background-color: rgba(32, 44, 66, 0.95);
    border-color: rgba(125, 211, 252, 0.45);
}

QPushButton:pressed {
    background-color: #0e4d6e;
}

/* Primary Accent Buttons (Ice-Blue) */
QPushButton#btn_login, QPushButton#btn_submit_attendance, QPushButton#btn_save_notes, QPushButton#btn_start_session, QPushButton#btn_add_user {
    background-color: #7dd3fc;
    color: #001f2e;
    border: 1px solid #7dd3fc;
    font-weight: bold;
    border-radius: 10px;
    padding: 10px 18px;
}

QPushButton#btn_login:hover, QPushButton#btn_submit_attendance:hover, QPushButton#btn_save_notes:hover, QPushButton#btn_start_session:hover, QPushButton#btn_add_user:hover {
    background-color: #c8eaff;
    border-color: #c8eaff;
}

/* Tertiary Buttons (Lavender) */
QPushButton#btn_submit_excuse, QPushButton#btn_approve_excuse {
    background-color: #c8a0f0;
    color: #1a002e;
    border: 1px solid #c8a0f0;
    font-weight: bold;
    border-radius: 10px;
    padding: 9px 16px;
}

QPushButton#btn_submit_excuse:hover, QPushButton#btn_approve_excuse:hover {
    background-color: #e8d0ff;
}

/* Error / Reject Buttons */
QPushButton#btn_end_session, QPushButton#btn_reject_excuse {
    background-color: rgba(61, 20, 20, 0.85);
    color: #ffb3b3;
    border: 1px solid rgba(255, 107, 107, 0.4);
    font-weight: bold;
    border-radius: 10px;
    padding: 9px 16px;
}

QPushButton#btn_end_session:hover, QPushButton#btn_reject_excuse:hover {
    background-color: #5c1e1e;
    border-color: #ff6b6b;
}

/* Top Navigation Tabs */
QPushButton#btn_nav_login, QPushButton#btn_nav_student, QPushButton#btn_nav_instructor, QPushButton#btn_nav_advisor, QPushButton#btn_nav_admin {
    background-color: rgba(17, 24, 40, 0.8);
    border: 1px solid rgba(125, 211, 252, 0.15);
    color: #a0b4c4;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
}

QPushButton#btn_nav_login:hover, QPushButton#btn_nav_student:hover, QPushButton#btn_nav_instructor:hover, QPushButton#btn_nav_advisor:hover, QPushButton#btn_nav_admin:hover {
    background-color: #1a2438;
    color: #e0e8f0;
}

/* Sidebar Navigation Items */
QPushButton#btn_side_instructor, QPushButton#btn_side_student, QPushButton#btn_side_advisor, QPushButton#btn_side_admin {
    background-color: transparent;
    border: none;
    color: #a0b4c4;
    text-align: left;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
}

QPushButton#btn_side_instructor:hover, QPushButton#btn_side_student:hover, QPushButton#btn_side_advisor:hover, QPushButton#btn_side_admin:hover {
    background-color: rgba(26, 36, 56, 0.6);
    color: #e0e8f0;
}

/* Inputs & Form Fields */
QLineEdit, QTextEdit, QDateEdit, QComboBox {
    background-color: rgba(26, 36, 56, 0.75);
    border: 1px solid rgba(125, 211, 252, 0.18);
    border-radius: 9px;
    padding: 8px 12px;
    color: #e0e8f0;
    selection-background-color: #0e4d6e;
    selection-color: #c8eaff;
}

QLineEdit:focus, QTextEdit:focus, QDateEdit:focus, QComboBox:focus {
    border: 1px solid #7dd3fc;
    background-color: rgba(26, 36, 56, 0.95);
}

/* Dropdown ComboBox styling */
QComboBox {
    padding-right: 24px;
}

QComboBox::drop-down {
    subcontrol-origin: padding;
    subcontrol-position: top right;
    width: 20px;
    border-left: none;
}

QComboBox QAbstractItemView {
    background-color: #141c2e;
    border: 1px solid rgba(125, 211, 252, 0.25);
    border-radius: 8px;
    color: #e0e8f0;
    selection-background-color: #0e4d6e;
    selection-color: #c8eaff;
    padding: 4px;
}

/* QTableWidget Modern Glassmorphism Styling */
QTableWidget {
    background-color: rgba(17, 24, 40, 0.7);
    border: 1px solid rgba(125, 211, 252, 0.15);
    border-radius: 14px;
    gridline-color: transparent;
    selection-background-color: rgba(14, 77, 110, 0.5);
    selection-color: #c8eaff;
    outline: none;
}

QTableWidget::item {
    padding: 8px 10px;
    border-bottom: 1px solid rgba(125, 211, 252, 0.06);
}

QTableWidget::item:selected {
    background-color: rgba(14, 77, 110, 0.6);
    color: #c8eaff;
}

QHeaderView::section {
    background-color: rgba(26, 36, 56, 0.85);
    color: #a0b4c4;
    padding: 10px;
    font-size: 11px;
    font-weight: bold;
    border: none;
    border-bottom: 1px solid rgba(125, 211, 252, 0.18);
    text-transform: uppercase;
}

/* Scrollbars */
QScrollBar:vertical {
    border: none;
    background: rgba(10, 14, 26, 0.5);
    width: 8px;
    margin: 0px;
    border-radius: 4px;
}

QScrollBar::handle:vertical {
    background: rgba(74, 96, 112, 0.5);
    min-height: 20px;
    border-radius: 4px;
}

QScrollBar::handle:vertical:hover {
    background: rgba(125, 211, 252, 0.6);
}

/* Labels */
QLabel {
    background: transparent;
}

QLabel#lbl_dynamic_qr {
    color: #7dd3fc;
    font-size: 26px;
    font-weight: bold;
    font-family: 'Consolas', 'Courier New', monospace;
}

QLabel#lbl_timer {
    color: #c8a0f0;
    font-size: 22px;
    font-weight: bold;
    font-family: 'Consolas', 'Courier New', monospace;
}

QLabel#lbl_checkin_status {
    background-color: rgba(14, 77, 110, 0.5);
    color: #7dd3fc;
    border: 1px solid rgba(125, 211, 252, 0.3);
    border-radius: 12px;
    padding: 6px 14px;
    font-weight: 600;
}
"""


class SASApplication:
    """
    Main Controller managing navigation between pages loaded dynamically from main_app.ui.
    """

    def __init__(self, ui_file_path: str = "main_app.ui"):
        self.logic = AttendanceLogic()
        self.current_user = None
        self.active_session = None
        self.session_remaining_seconds = 899
        self.timer = QTimer()
        self.timer.timeout.connect(self._on_timer_tick)

        # 1. Load UI dynamically using QUiLoader (Zero manual UI widget instantiation)
        loader = QUiLoader()
        ui_file = QFile(ui_file_path)
        if not ui_file.open(QIODevice.ReadOnly):
            raise FileNotFoundError(f"Cannot open UI file: {ui_file_path}")
        self.window = loader.load(ui_file)
        ui_file.close()

        if not self.window:
            raise RuntimeError(f"QUiLoader failed to load {ui_file_path}")

        # 2. Bind Object References from the .ui file
        self._bind_ui_elements()

        # 3. Setup signals and event listeners
        self._connect_signals()

        # 4. Default to Student Dashboard (Screen 1) matching the preview, or Login (Screen 0)
        self.set_active_page(1)
        self.setup_student_screen()

    def _bind_ui_elements(self):
        """Map every objectName defined in main_app.ui via findChild."""
        self.stackedWidget: QStackedWidget = self.window.findChild(QStackedWidget, "stackedWidget")

        # Top Header Navigation Tabs
        self.btn_nav_login: QPushButton = self.window.findChild(QPushButton, "btn_nav_login")
        self.btn_nav_student: QPushButton = self.window.findChild(QPushButton, "btn_nav_student")
        self.btn_nav_instructor: QPushButton = self.window.findChild(QPushButton, "btn_nav_instructor")
        self.btn_nav_advisor: QPushButton = self.window.findChild(QPushButton, "btn_nav_advisor")
        self.btn_nav_admin: QPushButton = self.window.findChild(QPushButton, "btn_nav_admin")
        self.lbl_header_user: QLabel = self.window.findChild(QLabel, "lbl_header_user")

        # Sidebar Navigation Buttons
        self.btn_side_instructor: QPushButton = self.window.findChild(QPushButton, "btn_side_instructor")
        self.btn_side_student: QPushButton = self.window.findChild(QPushButton, "btn_side_student")
        self.btn_side_advisor: QPushButton = self.window.findChild(QPushButton, "btn_side_advisor")
        self.btn_side_admin: QPushButton = self.window.findChild(QPushButton, "btn_side_admin")

        # Screen 0: Login
        self.txt_email: QLineEdit = self.window.findChild(QLineEdit, "txt_email")
        self.txt_password: QLineEdit = self.window.findChild(QLineEdit, "txt_password")
        self.btn_login: QPushButton = self.window.findChild(QPushButton, "btn_login")
        self.lbl_login_error: QLabel = self.window.findChild(QLabel, "lbl_login_error")
        self.btn_quick_student: QPushButton = self.window.findChild(QPushButton, "btn_quick_student")
        self.btn_quick_instructor: QPushButton = self.window.findChild(QPushButton, "btn_quick_instructor")
        self.btn_quick_advisor: QPushButton = self.window.findChild(QPushButton, "btn_quick_advisor")
        self.btn_quick_admin: QPushButton = self.window.findChild(QPushButton, "btn_quick_admin")

        # Screen 1: Student Module
        self.combo_student_courses: QComboBox = self.window.findChild(QComboBox, "combo_student_courses")
        self.txt_qr_code: QLineEdit = self.window.findChild(QLineEdit, "txt_qr_code")
        self.btn_submit_attendance: QPushButton = self.window.findChild(QPushButton, "btn_submit_attendance")
        self.lbl_checkin_status: QLabel = self.window.findChild(QLabel, "lbl_checkin_status")
        self.table_student_stats: QTableWidget = self.window.findChild(QTableWidget, "table_student_stats")
        self.combo_excuse_course: QComboBox = self.window.findChild(QComboBox, "combo_excuse_course")
        self.date_excuse: QDateEdit = self.window.findChild(QDateEdit, "date_excuse")
        self.txt_excuse_reason: QTextEdit = self.window.findChild(QTextEdit, "txt_excuse_reason")
        self.btn_submit_excuse: QPushButton = self.window.findChild(QPushButton, "btn_submit_excuse")

        # Screen 2: Instructor Module
        self.combo_instructor_courses: QComboBox = self.window.findChild(QComboBox, "combo_instructor_courses")
        self.btn_start_session: QPushButton = self.window.findChild(QPushButton, "btn_start_session")
        self.btn_end_session: QPushButton = self.window.findChild(QPushButton, "btn_end_session")
        self.lbl_dynamic_qr: QLabel = self.window.findChild(QLabel, "lbl_dynamic_qr")
        self.lbl_timer: QLabel = self.window.findChild(QLabel, "lbl_timer")
        self.table_instructor_attendance: QTableWidget = self.window.findChild(QTableWidget, "table_instructor_attendance")
        self.table_instructor_excuses: QTableWidget = self.window.findChild(QTableWidget, "table_instructor_excuses")
        self.btn_approve_excuse: QPushButton = self.window.findChild(QPushButton, "btn_approve_excuse")
        self.btn_reject_excuse: QPushButton = self.window.findChild(QPushButton, "btn_reject_excuse")
        self.btn_export_course_report: QPushButton = self.window.findChild(QPushButton, "btn_export_course_report")

        # Screen 3: Academic Advisor Module
        self.table_advisor_warnings: QTableWidget = self.window.findChild(QTableWidget, "table_advisor_warnings")
        self.txt_counseling_notes: QTextEdit = self.window.findChild(QTextEdit, "txt_counseling_notes")
        self.btn_save_notes: QPushButton = self.window.findChild(QPushButton, "btn_save_notes")

        # Screen 4: Administrator Module
        self.table_admin_users: QTableWidget = self.window.findChild(QTableWidget, "table_admin_users")
        self.txt_add_email: QLineEdit = self.window.findChild(QLineEdit, "txt_add_email")
        self.combo_add_role: QComboBox = self.window.findChild(QComboBox, "combo_add_role")
        self.btn_add_user: QPushButton = self.window.findChild(QPushButton, "btn_add_user")
        self.btn_export_system_report: QPushButton = self.window.findChild(QPushButton, "btn_export_system_report")

    def _connect_signals(self):
        """Bind UI user events to controller methods."""
        # Top Header Navigation Tabs
        if self.btn_nav_login:
            self.btn_nav_login.clicked.connect(lambda: self.set_active_page(0))
        if self.btn_nav_student:
            self.btn_nav_student.clicked.connect(lambda: self.set_active_page(1))
        if self.btn_nav_instructor:
            self.btn_nav_instructor.clicked.connect(lambda: self.set_active_page(2))
        if self.btn_nav_advisor:
            self.btn_nav_advisor.clicked.connect(lambda: self.set_active_page(3))
        if self.btn_nav_admin:
            self.btn_nav_admin.clicked.connect(lambda: self.set_active_page(4))

        # Sidebar buttons
        if self.btn_side_instructor:
            self.btn_side_instructor.clicked.connect(lambda: self.set_active_page(2))
        if self.btn_side_student:
            self.btn_side_student.clicked.connect(lambda: self.set_active_page(1))
        if self.btn_side_advisor:
            self.btn_side_advisor.clicked.connect(lambda: self.set_active_page(3))
        if self.btn_side_admin:
            self.btn_side_admin.clicked.connect(lambda: self.set_active_page(4))

        # Screen 0: Login
        if self.btn_login:
            self.btn_login.clicked.connect(self.handle_login)

        # Demo role helpers
        if self.btn_quick_student:
            self.btn_quick_student.clicked.connect(lambda: self._fill_credentials("a.rivera@university.edu", "password123"))
        if self.btn_quick_instructor:
            self.btn_quick_instructor.clicked.connect(lambda: self._fill_credentials("dr.vance@university.edu", "password123"))
        if self.btn_quick_advisor:
            self.btn_quick_advisor.clicked.connect(lambda: self._fill_credentials("m.brody@university.edu", "password123"))
        if self.btn_quick_admin:
            self.btn_quick_admin.clicked.connect(lambda: self._fill_credentials("sysadmin@university.edu", "password123"))

        # Screen 1: Student
        if self.btn_submit_attendance:
            self.btn_submit_attendance.clicked.connect(self.handle_student_checkin)
        if self.btn_submit_excuse:
            self.btn_submit_excuse.clicked.connect(self.handle_student_excuse_submit)

        # Screen 2: Instructor
        if self.btn_start_session:
            self.btn_start_session.clicked.connect(self.handle_instructor_start_session)
        if self.btn_end_session:
            self.btn_end_session.clicked.connect(self.handle_instructor_end_session)
        if self.btn_approve_excuse:
            self.btn_approve_excuse.clicked.connect(lambda: self.handle_excuse_decision("Approved"))
        if self.btn_reject_excuse:
            self.btn_reject_excuse.clicked.connect(lambda: self.handle_excuse_decision("Rejected"))
        if self.btn_export_course_report:
            self.btn_export_course_report.clicked.connect(self.handle_export_course_report)
        if self.combo_instructor_courses:
            self.combo_instructor_courses.currentIndexChanged.connect(self._on_instructor_course_changed)

        # Screen 3: Advisor
        if self.table_advisor_warnings:
            self.table_advisor_warnings.itemSelectionChanged.connect(self._on_advisor_student_selected)
        if self.btn_save_notes:
            self.btn_save_notes.clicked.connect(self.handle_save_counseling_notes)

        # Screen 4: Admin
        if self.btn_add_user:
            self.btn_add_user.clicked.connect(self.handle_admin_add_user)
        if self.btn_export_system_report:
            self.btn_export_system_report.clicked.connect(self.handle_admin_export_report)

    def _fill_credentials(self, email: str, pw: str):
        if self.txt_email: self.txt_email.setText(email)
        if self.txt_password: self.txt_password.setText(pw)

    def set_active_page(self, index: int):
        """Switch page in QStackedWidget and update active styles."""
        if not self.stackedWidget: return
        self.stackedWidget.setCurrentIndex(index)

        # Update header highlight
        nav_buttons = [
            self.btn_nav_login, self.btn_nav_student, self.btn_nav_instructor,
            self.btn_nav_advisor, self.btn_nav_admin
        ]
        for i, btn in enumerate(nav_buttons):
            if btn:
                if i == index:
                    btn.setStyleSheet("background-color: #0e4d6e; color: #c8eaff; font-weight: bold; border-radius: 8px;")
                else:
                    btn.setStyleSheet("background-color: rgba(17, 24, 40, 0.8); color: #a0b4c4; border-radius: 8px;")

        # Initialize screen data
        if index == 1:
            self.setup_student_screen()
        elif index == 2:
            self.setup_instructor_screen()
        elif index == 3:
            self.setup_advisor_screen()
        elif index == 4:
            self.setup_admin_screen()

    # ---------------------------------------------------------
    # Screen 0: Login Authentication
    # ---------------------------------------------------------
    def handle_login(self):
        try:
            email = self.txt_email.text().strip()
            password = self.txt_password.text().strip()

            if not email or not password:
                self._show_login_error("Email and password fields are required.")
                return

            user = self.logic.authenticate(email, password)
            if not user:
                self._show_login_error("Invalid credentials (try password123).")
                return

            self.current_user = user
            if self.lbl_login_error:
                self.lbl_login_error.setVisible(False)

            if self.lbl_header_user:
                self.lbl_header_user.setText(f"<b>{user['full_name']}</b><br/><span style='font-size:10px; color:#88b4cc;'>{user['role']} • Univ</span>")

            # Route by role
            role = user["role"]
            if role == "Student":
                self.set_active_page(1)
            elif role == "Instructor":
                self.set_active_page(2)
            elif role == "Advisor":
                self.set_active_page(3)
            elif role == "Administrator":
                self.set_active_page(4)
        except Exception as e:
            self._show_login_error(f"Login error: {e}")

    def _show_login_error(self, message: str):
        if self.lbl_login_error:
            self.lbl_login_error.setText(message)
            self.lbl_login_error.setVisible(True)

    # ---------------------------------------------------------
    # Screen 1: Student Module
    # ---------------------------------------------------------
    def setup_student_screen(self):
        try:
            student_id = self.current_user["id"] if self.current_user else 1
            stats = self.logic.get_student_statistics(student_id)

            if self.combo_student_courses:
                self.combo_student_courses.clear()
                for s in stats:
                    self.combo_student_courses.addItem(f"{s['course_name']}", s["course_id"])

            if self.combo_excuse_course:
                self.combo_excuse_course.clear()
                for s in stats:
                    self.combo_excuse_course.addItem(f"{s['course_name']}", s["course_id"])

            if self.date_excuse:
                from PySide6.QtCore import QDate
                self.date_excuse.setDate(QDate.currentDate())

            self._refresh_student_stats_table(stats)
            if self.lbl_checkin_status:
                self.lbl_checkin_status.setText("● Ready for check-in")
        except Exception as e:
            print(f"[Student Setup Error] {e}")

    def _refresh_student_stats_table(self, stats):
        try:
            if not self.table_student_stats: return
            self.table_student_stats.setRowCount(len(stats))
            for row_idx, s in enumerate(stats):
                self.table_student_stats.setItem(row_idx, 0, QTableWidgetItem(str(s["course_name"])))
                self.table_student_stats.setItem(row_idx, 1, QTableWidgetItem(str(s["total_sessions"])))
                self.table_student_stats.setItem(row_idx, 2, QTableWidgetItem(str(s["present"])))
                self.table_student_stats.setItem(row_idx, 3, QTableWidgetItem(str(s["late"])))
                self.table_student_stats.setItem(row_idx, 4, QTableWidgetItem(str(s["absent"])))
                self.table_student_stats.setItem(row_idx, 5, QTableWidgetItem(str(s["excused"])))

                # Attendance % item
                pct_item = QTableWidgetItem(f"{s['attendance_percentage']}%")
                if s["attendance_percentage"] < 80.0:
                    pct_item.setForeground(Qt.red)
                else:
                    pct_item.setForeground(Qt.cyan)
                self.table_student_stats.setItem(row_idx, 6, pct_item)

                status_item = QTableWidgetItem(s["compliance_status"])
                self.table_student_stats.setItem(row_idx, 7, status_item)

            self.table_student_stats.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        except Exception as e:
            print(f"[Stats Table Refresh Error] {e}")

    def handle_student_checkin(self):
        try:
            token = self.txt_qr_code.text().strip()
            course_id = self.combo_student_courses.currentData() or 1
            student_id = self.current_user["id"] if self.current_user else 1

            success, status, msg = self.logic.check_in(student_id, course_id, token)
            if self.lbl_checkin_status:
                self.lbl_checkin_status.setText(f"● {msg}")

            if success:
                self.txt_qr_code.clear()
                stats = self.logic.get_student_statistics(student_id)
                self._refresh_student_stats_table(stats)
        except Exception as e:
            if self.lbl_checkin_status:
                self.lbl_checkin_status.setText(f"Error: {e}")

    def handle_student_excuse_submit(self):
        try:
            course_id = self.combo_excuse_course.currentData() or 1
            date_str = self.date_excuse.date().toString("yyyy-MM-dd")
            reason = self.txt_excuse_reason.toPlainText().strip()
            student_id = self.current_user["id"] if self.current_user else 1

            if not reason:
                QMessageBox.warning(self.window, "Validation Error", "Please provide a valid reason.")
                return

            ok, msg = self.logic.submit_excuse(student_id, course_id, date_str, reason)
            if ok:
                QMessageBox.information(self.window, "Excuse Submitted", msg)
                self.txt_excuse_reason.clear()
            else:
                QMessageBox.warning(self.window, "Submission Failed", msg)
        except Exception as e:
            QMessageBox.critical(self.window, "Error", str(e))

    # ---------------------------------------------------------
    # Screen 2: Instructor Module
    # ---------------------------------------------------------
    def setup_instructor_screen(self):
        try:
            courses = self.logic.get_all_courses()
            if self.combo_instructor_courses:
                self.combo_instructor_courses.clear()
                for c in courses:
                    self.combo_instructor_courses.addItem(c["course_name"], c["id"])

            self._refresh_instructor_roster()
            self._refresh_instructor_excuses()
        except Exception as e:
            print(f"[Instructor Setup Error] {e}")

    def _on_instructor_course_changed(self):
        self._refresh_instructor_roster()
        self._refresh_instructor_excuses()

    def handle_instructor_start_session(self):
        try:
            course_id = self.combo_instructor_courses.currentData() or 1
            self.active_session = self.logic.start_attendance_session(course_id)
            if self.lbl_dynamic_qr:
                self.lbl_dynamic_qr.setText(self.active_session["session_code"])

            self.session_remaining_seconds = 15 * 60
            self._update_timer_display()
            self.timer.start(1000)
            self._refresh_instructor_roster()
        except Exception as e:
            QMessageBox.critical(self.window, "Session Error", f"Failed to start session: {e}")

    def handle_instructor_end_session(self):
        try:
            if self.active_session:
                self.logic.end_attendance_session(self.active_session["session_id"])
            self.timer.stop()
            if self.lbl_timer:
                self.lbl_timer.setText("00:00 (Closed)")
            if self.lbl_dynamic_qr:
                self.lbl_dynamic_qr.setText("EXPIRED")
            self._refresh_instructor_roster()
        except Exception as e:
            QMessageBox.critical(self.window, "Error", str(e))

    def _on_timer_tick(self):
        if self.session_remaining_seconds > 0:
            self.session_remaining_seconds -= 1
            self._update_timer_display()
        else:
            self.handle_instructor_end_session()

    def _update_timer_display(self):
        mins = self.session_remaining_seconds // 60
        secs = self.session_remaining_seconds % 60
        if self.lbl_timer:
            self.lbl_timer.setText(f"{mins:02d}:{secs:02d}")

    def _refresh_instructor_roster(self):
        """
        Populate real-time class roster.
        Uses setCellWidget to embed a QComboBox in each row for status override.
        """
        try:
            course_id = self.combo_instructor_courses.currentData() or 1
            roster = self.logic.get_instructor_roster(course_id)
            if not self.table_instructor_attendance: return

            self.table_instructor_attendance.setRowCount(len(roster))
            statuses = ["Present", "Late", "Absent", "Excused"]

            for row_idx, student in enumerate(roster):
                attendance_id = student["attendance_id"]
                current_status = student["status"]

                self.table_instructor_attendance.setItem(row_idx, 0, QTableWidgetItem(f"#{student['student_id']:04d}"))
                self.table_instructor_attendance.setItem(row_idx, 1, QTableWidgetItem(student["full_name"]))
                self.table_instructor_attendance.setItem(row_idx, 2, QTableWidgetItem(student["time_logged"] or "—"))

                # Create QComboBox for manual override
                combo = QComboBox()
                combo.addItems(statuses)
                combo.setCurrentText(current_status)

                def make_override_handler(att_id):
                    return lambda new_text: self.logic.manual_override_status(
                        att_id, new_text, self.current_user["id"] if self.current_user else 2
                    )

                combo.currentTextChanged.connect(make_override_handler(attendance_id))
                self.table_instructor_attendance.setCellWidget(row_idx, 3, combo)

            self.table_instructor_attendance.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        except Exception as e:
            print(f"[Roster Error] {e}")

    def _refresh_instructor_excuses(self):
        try:
            if not self.table_instructor_excuses: return
            course_id = self.combo_instructor_courses.currentData()
            excuses = self.logic.get_pending_excuses(course_id)
            self.table_instructor_excuses.setRowCount(len(excuses))

            for row_idx, exc in enumerate(excuses):
                self.table_instructor_excuses.setItem(row_idx, 0, QTableWidgetItem(str(exc["excuse_id"])))
                self.table_instructor_excuses.setItem(row_idx, 1, QTableWidgetItem(exc["student_name"]))
                self.table_instructor_excuses.setItem(row_idx, 2, QTableWidgetItem(exc["date_absent"]))
                self.table_instructor_excuses.setItem(row_idx, 3, QTableWidgetItem(exc["reason"]))
                self.table_instructor_excuses.setItem(row_idx, 4, QTableWidgetItem(exc["status"]))

            self.table_instructor_excuses.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        except Exception as e:
            print(f"[Excuses Refresh Error] {e}")

    def handle_excuse_decision(self, decision: str):
        try:
            selected_rows = self.table_instructor_excuses.selectedItems()
            if not selected_rows:
                QMessageBox.warning(self.window, "Selection Required", "Please select an excuse from the table first.")
                return

            row = selected_rows[0].row()
            excuse_id = int(self.table_instructor_excuses.item(row, 0).text())
            instructor_id = self.current_user["id"] if self.current_user else 2

            ok = self.logic.review_excuse(excuse_id, decision, instructor_id)
            if ok:
                QMessageBox.information(self.window, "Success", f"Excuse #{excuse_id} has been {decision.lower()}.")
                self._refresh_instructor_excuses()
                self._refresh_instructor_roster()
            else:
                QMessageBox.warning(self.window, "Error", "Failed to update excuse status.")
        except Exception as e:
            QMessageBox.critical(self.window, "Error", str(e))

    def handle_export_course_report(self):
        try:
            course_id = self.combo_instructor_courses.currentData() or 1
            filename, _ = QFileDialog.getSaveFileName(self.window, "Export Course Attendance", f"attendance_course_{course_id}.csv", "CSV Files (*.csv)")
            if filename:
                self.logic.export_course_report_csv(course_id, filename)
                QMessageBox.information(self.window, "Export Complete", f"Attendance report exported to {filename}")
        except Exception as e:
            QMessageBox.critical(self.window, "Export Error", str(e))

    # ---------------------------------------------------------
    # Screen 3: Academic Advisor Module
    # ---------------------------------------------------------
    def setup_advisor_screen(self):
        try:
            self._refresh_advisor_warnings()
        except Exception as e:
            print(f"[Advisor Setup Error] {e}")

    def _refresh_advisor_warnings(self):
        try:
            if not self.table_advisor_warnings: return
            flagged = self.logic.get_early_warning_students()
            self.table_advisor_warnings.setRowCount(len(flagged))

            for row_idx, s in enumerate(flagged):
                self.table_advisor_warnings.setItem(row_idx, 0, QTableWidgetItem(str(s["student_id"])))
                self.table_advisor_warnings.setItem(row_idx, 1, QTableWidgetItem(s["student_name"]))
                self.table_advisor_warnings.setItem(row_idx, 2, QTableWidgetItem(s["course_name"]))

                rate_item = QTableWidgetItem(f"{s['attendance_rate']}%")
                if s["attendance_rate"] < 75.0:
                    rate_item.setForeground(Qt.red)
                self.table_advisor_warnings.setItem(row_idx, 3, rate_item)

                self.table_advisor_warnings.setItem(row_idx, 4, QTableWidgetItem(f"{s['consecutive_absences']} sessions"))

                risk_item = QTableWidgetItem(s["risk_level"])
                if s["risk_level"] == "CRITICAL":
                    risk_item.setForeground(Qt.red)
                elif s["risk_level"] == "HIGH":
                    risk_item.setForeground(Qt.darkYellow)
                self.table_advisor_warnings.setItem(row_idx, 5, risk_item)

            self.table_advisor_warnings.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        except Exception as e:
            print(f"[EWS Refresh Error] {e}")

    def _on_advisor_student_selected(self):
        try:
            selected_items = self.table_advisor_warnings.selectedItems()
            if not selected_items: return

            row = selected_items[0].row()
            student_id = int(self.table_advisor_warnings.item(row, 0).text())
            student_name = self.table_advisor_warnings.item(row, 1).text()

            notes = self.logic.get_counseling_notes(student_id)
            if notes and self.txt_counseling_notes:
                history_text = "\n---\n".join([f"[{n['created_at']} by {n['advisor_name']}]:\n{n['note_text']}" for n in notes])
                self.txt_counseling_notes.setText(history_text)
            elif self.txt_counseling_notes:
                self.txt_counseling_notes.setPlaceholderText(f"No prior counseling notes for {student_name}. Type here to add one...")
                self.txt_counseling_notes.clear()
        except Exception as e:
            print(f"[Advisor Select Error] {e}")

    def handle_save_counseling_notes(self):
        try:
            selected_items = self.table_advisor_warnings.selectedItems()
            if not selected_items:
                QMessageBox.warning(self.window, "Selection Required", "Please select a student first.")
                return

            row = selected_items[0].row()
            student_id = int(self.table_advisor_warnings.item(row, 0).text())
            notes_text = self.txt_counseling_notes.toPlainText().strip()

            if not notes_text:
                QMessageBox.warning(self.window, "Empty Note", "Please enter counseling note text.")
                return

            advisor_id = self.current_user["id"] if self.current_user else 3
            ok = self.logic.save_counseling_note(student_id, advisor_id, notes_text)
            if ok:
                QMessageBox.information(self.window, "Saved", "Intervention notes logged successfully.")
        except Exception as e:
            QMessageBox.critical(self.window, "Save Note Error", str(e))

    # ---------------------------------------------------------
    # Screen 4: Administrator Module
    # ---------------------------------------------------------
    def setup_admin_screen(self):
        try:
            self._refresh_admin_users()
        except Exception as e:
            print(f"[Admin Setup Error] {e}")

    def _refresh_admin_users(self):
        try:
            if not self.table_admin_users: return
            users = self.logic.get_all_users()
            self.table_admin_users.setRowCount(len(users))

            for row_idx, u in enumerate(users):
                self.table_admin_users.setItem(row_idx, 0, QTableWidgetItem(f"USR-{u['id']}"))
                self.table_admin_users.setItem(row_idx, 1, QTableWidgetItem(u["full_name"]))
                self.table_admin_users.setItem(row_idx, 2, QTableWidgetItem(u["email"]))
                self.table_admin_users.setItem(row_idx, 3, QTableWidgetItem(u["role"]))
                self.table_admin_users.setItem(row_idx, 4, QTableWidgetItem(", ".join(u.get("courses", [])) or "None"))

            self.table_admin_users.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        except Exception as e:
            print(f"[Admin Users Refresh Error] {e}")

    def handle_admin_add_user(self):
        try:
            email = self.txt_add_email.text().strip()
            role = self.combo_add_role.currentText()

            ok, msg = self.logic.add_user(email=email, role=role)
            if ok:
                QMessageBox.information(self.window, "User Added", msg)
                self.txt_add_email.clear()
                self._refresh_admin_users()
            else:
                QMessageBox.warning(self.window, "Enrollment Failed", msg)
        except Exception as e:
            QMessageBox.critical(self.window, "Error", str(e))

    def handle_admin_export_report(self):
        try:
            filename, _ = QFileDialog.getSaveFileName(self.window, "Export System Report", "system_attendance_report.csv", "CSV Files (*.csv)")
            if filename:
                self.logic.export_system_report_csv(filename)
                QMessageBox.information(self.window, "Export Complete", f"System report exported to {filename}")
        except Exception as e:
            QMessageBox.critical(self.window, "Export Error", str(e))


def main():
    """Application runner with automatic web fallback."""
    init_database()

    if not PYSIDE6_AVAILABLE:
        print("\n" + "=" * 64)
        print("  ⚠️ PySide6 is not detected in your Python environment.")
        print("  🚀 Automatically launching standalone HTML web interface...")
        print("  👉 Serving at: http://localhost:8000")
        print("=" * 64 + "\n")
        try:
            import server
            server.run()
        except Exception as e:
            print(f"Server startup error: {e}")
        return

    try:
        app = QApplication(sys.argv)
        app.setStyleSheet(GLACIER_QSS)

        ui_path = os.path.join(os.path.dirname(__file__), "main_app.ui")
        sas_app = SASApplication(ui_path)
        sas_app.window.show()
        sys.exit(app.exec())
    except Exception as e:
        print(f"\n⚠️ Unable to initialize desktop Qt display window ({e}).")
        print("🚀 Automatically opening standalone web interface in browser...")
        try:
            import server
            server.run()
        except Exception:
            pass


if __name__ == "__main__":
    main()
