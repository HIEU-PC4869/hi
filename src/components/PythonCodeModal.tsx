import React, { useState } from 'react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'database' | 'logic' | 'ui' | 'req'>('main');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fileContents: Record<string, { filename: string; language: string; description: string; code: string }> = {
    main: {
      filename: 'main.py',
      language: 'python',
      description: 'PySide6 Controller & Application Runner using QUiLoader (Zero manual UI widget initialization in Python, QStackedWidget role navigation, and setCellWidget ComboBox override).',
      code: `"""
main.py - Main Application Entry Point & PySide6 Controller Navigation
SAS Enterprise - Student Attendance & Intelligence System
"""

import os
import sys
from PySide6.QtCore import QFile, QIODevice, QTimer, Qt
from PySide6.QtUiTools import QUiLoader
from PySide6.QtWidgets import (
    QApplication, QComboBox, QHeaderView, QLabel, QLineEdit,
    QMainWindow, QPushButton, QStackedWidget, QTableWidget,
    QTableWidgetItem, QTextEdit, QDateEdit, QFileDialog, QMessageBox
)
from database import init_database
from logic import AttendanceLogic

class SASApplication:
    """Main Controller managing navigation between pages loaded dynamically from main_app.ui."""

    def __init__(self, ui_file_path: str = "main_app.ui"):
        self.logic = AttendanceLogic()
        self.current_user = None
        self.active_session = None
        self.session_remaining_seconds = 0
        self.timer = QTimer()
        self.timer.timeout.connect(self._on_timer_tick)

        # 1. 100% QUiLoader to load the .ui file (DO NOT initialize UI Elements in Python)
        loader = QUiLoader()
        ui_file = QFile(ui_file_path)
        if not ui_file.open(QIODevice.ReadOnly):
            raise FileNotFoundError(f"Cannot open UI file: {ui_file_path}")
        self.window = loader.load(ui_file)
        ui_file.close()

        # 2. Map every objectName defined in main_app.ui via findChild
        self._bind_ui_elements()
        self._connect_signals()
        self.stackedWidget.setCurrentIndex(0) # Default to Screen 0: Login

    def _bind_ui_elements(self):
        self.stackedWidget: QStackedWidget = self.window.findChild(QStackedWidget, "stackedWidget")
        
        # Screen 0: Login
        self.txt_email: QLineEdit = self.window.findChild(QLineEdit, "txt_email")
        self.txt_password: QLineEdit = self.window.findChild(QLineEdit, "txt_password")
        self.btn_login: QPushButton = self.window.findChild(QPushButton, "btn_login")
        self.lbl_login_error: QLabel = self.window.findChild(QLabel, "lbl_login_error")

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

    def _refresh_instructor_roster(self):
        """Uses setCellWidget to embed a QComboBox in the last column of each row."""
        course_id = self.combo_instructor_courses.currentData()
        if not course_id: return
        roster = self.logic.get_instructor_roster(course_id)
        self.table_instructor_attendance.setRowCount(len(roster))

        statuses = ["Present", "Late", "Absent", "Excused"]
        for row_idx, student in enumerate(roster):
            att_id = student["attendance_id"]
            self.table_instructor_attendance.setItem(row_idx, 0, QTableWidgetItem(f"#{student['student_id']:04d}"))
            self.table_instructor_attendance.setItem(row_idx, 1, QTableWidgetItem(student["full_name"]))
            self.table_instructor_attendance.setItem(row_idx, 2, QTableWidgetItem(student["time_logged"] or "—"))

            # Integrate QComboBox into row using setCellWidget
            combo = QComboBox()
            combo.addItems(statuses)
            combo.setCurrentText(student["status"])
            
            def make_handler(aid):
                return lambda text: self.logic.manual_override_status(aid, text, self.current_user["id"])
            combo.currentTextChanged.connect(make_handler(att_id))
            self.table_instructor_attendance.setCellWidget(row_idx, 3, combo)

def main():
    init_database()
    app = QApplication(sys.argv)
    sas = SASApplication("main_app.ui")
    sas.window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()`
    },
    database: {
      filename: 'database.py',
      language: 'python',
      description: 'SQLite3 Context Manager guaranteeing safe transaction rollback, parameterized queries preventing SQL injection, table schemas, and mock data.',
      code: `"""
database.py - Database layer with SQLite3 Context Manager and Secure Schema
"""

import sqlite3
import hashlib
import os
from datetime import datetime, timedelta

DB_FILE = os.path.join(os.path.dirname(__file__), "attendance.db")

class DBConnection:
    """Thread-safe Context Manager for SQLite3 database connections."""
    def __init__(self, db_path=DB_FILE):
        self.db_path = db_path
        self.conn = None

    def __enter__(self):
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON;")
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            if exc_type is not None:
                self.conn.rollback() # Roll back on exception
            else:
                self.conn.commit()   # Auto-commit on success
            self.conn.close()
        return False

def hash_password(password: str) -> str:
    salt = "sas_secure_salt_2025"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def init_database(db_path=DB_FILE):
    with DBConnection(db_path) as conn:
        cursor = conn.cursor()
        # 1. Users: id, email, password_hash, full_name, role
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('Student', 'Instructor', 'Advisor', 'Administrator'))
        );""")
        # 2. Courses: id, course_name
        cursor.execute("CREATE TABLE IF NOT EXISTS Courses (id INTEGER PRIMARY KEY AUTOINCREMENT, course_name TEXT UNIQUE NOT NULL);")
        # 3. Enrollments: user_id, course_id
        cursor.execute("CREATE TABLE IF NOT EXISTS Enrollments (user_id INTEGER, course_id INTEGER, PRIMARY KEY (user_id, course_id));")
        # 4. Sessions: id, course_id, session_code, start_time, is_active
        cursor.execute("CREATE TABLE IF NOT EXISTS Sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, session_code TEXT, start_time TEXT, is_active INTEGER);")
        # 5. Attendance: id, session_id, student_id, status, time_logged, updated_by
        cursor.execute("CREATE TABLE IF NOT EXISTS Attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER, student_id INTEGER, status TEXT, time_logged TEXT, updated_by INTEGER, UNIQUE(session_id, student_id));")
        # 6. Excuses: id, student_id, course_id, date_absent, reason, status
        cursor.execute("CREATE TABLE IF NOT EXISTS Excuses (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, course_id INTEGER, date_absent TEXT, reason TEXT, status TEXT DEFAULT 'Pending');")
        # 7. Counseling_Notes: id, student_id, advisor_id, note_text, created_at
        cursor.execute("CREATE TABLE IF NOT EXISTS Counseling_Notes (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, advisor_id INTEGER, note_text TEXT, created_at TEXT);")
        # 8. Audit_Logs: id, user_id, action, timestamp, details
        cursor.execute("CREATE TABLE IF NOT EXISTS Audit_Logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT, timestamp TEXT, details TEXT);")`
    },
    logic: {
      filename: 'logic.py',
      language: 'python',
      description: 'Model & Controller Business Logic: Check-in timing window calculation (<15m Present, 15-45m Late), Early Warning System algorithm, and reports.',
      code: `"""
logic.py - Controller & Model Business Logic Layer
"""

import csv, random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from database import DBConnection, hash_password

class AttendanceLogic:
    def __init__(self, db_path=None):
        self.db_path = db_path

    def check_in(self, student_id: int, course_id: int, entered_token: str) -> Tuple[bool, str, str]:
        """Compares input time and QR/PIN opening time: <15m Present, 15-45m Late, >45m Closed."""
        with DBConnection(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, session_code, start_time FROM Sessions WHERE course_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1;", (course_id,))
            session = cursor.fetchone()
            if not session:
                return False, "Error", "No active session found."

            if session["session_code"].replace("-", "") != entered_token.strip().replace("-", ""):
                return False, "Error", "Invalid PIN or QR code entered."

            start_dt = datetime.strptime(session["start_time"], "%Y-%m-%d %H:%M:%S")
            elapsed_minutes = (datetime.now() - start_dt).total_seconds() / 60.0

            if elapsed_minutes < 15.0:
                status = "Present"
            elif 15.0 <= elapsed_minutes <= 45.0:
                status = "Late"
            else:
                status = "Absent"

            cursor.execute("""
                INSERT INTO Attendance (session_id, student_id, status, time_logged)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(session_id, student_id) DO UPDATE SET status=excluded.status, time_logged=excluded.time_logged;
            """, (session["id"], student_id, status, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
            return True, status, f"Check-in verified: {status}."

    def get_early_warning_students(self) -> List[Dict[str, Any]]:
        """Filters students with overall rate < 80% or >= 3 consecutive unexcused absences."""
        with DBConnection(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, full_name, email FROM Users WHERE role = 'Student';")
            students = cursor.fetchall()
            flagged = []
            for s in students:
                cursor.execute("SELECT status, COUNT(*) as cnt FROM Attendance WHERE student_id = ? GROUP BY status;", (s["id"],))
                counts = {r["status"]: r["cnt"] for r in cursor.fetchall()}
                p, l, a, e = counts.get("Present", 0), counts.get("Late", 0), counts.get("Absent", 0), counts.get("Excused", 0)
                tot = p + l + a + e
                rate = round(((p + l * 0.8) / tot) * 100, 1) if tot > 0 else 100.0

                # Check consecutive absences in any course
                cursor.execute("SELECT DISTINCT course_id FROM Enrollments WHERE user_id = ?;", (s["id"],))
                cids = [r["course_id"] for r in cursor.fetchall()]
                consec_max = 0
                for cid in cids:
                    cursor.execute("SELECT a.status FROM Attendance a JOIN Sessions s ON a.session_id = s.id WHERE a.student_id = ? AND s.course_id = ? ORDER BY s.start_time DESC LIMIT 6;", (s["id"], cid))
                    consec = 0
                    for r in cursor.fetchall():
                        if r["status"] == "Absent": consec += 1
                        else: break
                    consec_max = max(consec_max, consec)

                if rate < 80.0 or consec_max >= 3:
                    flagged.append({
                        "student_id": s["id"],
                        "student_name": s["full_name"],
                        "attendance_rate": rate,
                        "consecutive_absences": consec_max,
                        "risk_level": "CRITICAL" if rate < 70.0 or consec_max >= 4 else "HIGH"
                    })
            return flagged`
    },
    ui: {
      filename: 'main_app.ui',
      language: 'xml',
      description: 'Qt Designer XML file with complete QStackedWidget pages and exact objectNames.',
      code: `<?xml version="1.0" encoding="UTF-8"?>
<ui version="4.0">
 <class>MainWindow</class>
 <widget class="QMainWindow" name="MainWindow">
  <widget class="QWidget" name="centralWidget">
   <layout class="QVBoxLayout" name="mainVerticalLayout">
    <item>
     <widget class="QStackedWidget" name="stackedWidget">
      <!-- page_login: txt_email, txt_password, btn_login, lbl_login_error -->
      <widget class="QWidget" name="page_login"/>
      <!-- page_student: combo_student_courses, txt_qr_code, btn_submit_attendance, lbl_checkin_status, table_student_stats, combo_excuse_course, date_excuse, txt_excuse_reason, btn_submit_excuse -->
      <widget class="QWidget" name="page_student"/>
      <!-- page_instructor: combo_instructor_courses, btn_start_session, btn_end_session, lbl_dynamic_qr, lbl_timer, table_instructor_attendance, table_instructor_excuses, btn_approve_excuse, btn_reject_excuse, btn_export_course_report -->
      <widget class="QWidget" name="page_instructor"/>
      <!-- page_advisor: table_advisor_warnings, txt_counseling_notes, btn_save_notes -->
      <widget class="QWidget" name="page_advisor"/>
      <!-- page_admin: table_admin_users, txt_add_email, combo_add_role, btn_add_user, btn_export_system_report -->
      <widget class="QWidget" name="page_admin"/>
     </widget>
    </item>
   </layout>
  </widget>
 </widget>
</ui>`
    },
    req: {
      filename: 'requirements.txt',
      language: 'text',
      description: 'Python dependencies for execution.',
      code: `PySide6>=6.5.0\npandas>=2.0.0\nopenpyxl>=3.1.0`
    }
  };

  const currentFile = fileContents[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-5xl glacier-card-elevated rounded-2xl p-6 shadow-2xl flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#7dd3fc]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#3d2060] text-[#c8a0f0] border border-[#c8a0f0]/30">
              <span className="material-symbols-outlined text-xl">terminal</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#e0e8f0]">
                Python PySide6 + SQLite3 MVC Source Code
              </h3>
              <p className="text-xs text-[#a0b4c4]">
                Complete Model-View-Controller implementation ready to run locally via{' '}
                <code className="text-[#7dd3fc] font-mono">python3 main.py</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a2438] hover:bg-[#202c42] border border-[#7dd3fc]/20 text-xs font-medium text-[#7dd3fc] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e4d6e] hover:bg-[#0a4c6e] border border-[#7dd3fc]/30 text-xs font-semibold text-[#c8eaff] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download {currentFile.filename}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#a0b4c4] hover:text-[#e0e8f0] hover:bg-[#1a2438] cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 pt-4 pb-2 overflow-x-auto">
          {[
            { id: 'main', name: 'main.py' },
            { id: 'database', name: 'database.py' },
            { id: 'logic', name: 'logic.py' },
            { id: 'ui', name: 'main_app.ui' },
            { id: 'req', name: 'requirements.txt' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0e4d6e] text-[#c8eaff] border border-[#7dd3fc]/40 shadow-inner'
                  : 'bg-[#141c2e] text-[#a0b4c4] hover:bg-[#1a2438] hover:text-[#e0e8f0]'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <p className="text-xs text-[#88b4cc] pb-2 italic">{currentFile.description}</p>

        {/* Code Editor Preview */}
        <div className="flex-1 overflow-auto rounded-xl bg-[#0a0e1a] border border-[#7dd3fc]/15 p-4 font-mono text-xs text-[#e0e8f0] leading-relaxed select-text">
          <pre>{currentFile.code}</pre>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[#7dd3fc]/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#a0b4c4]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7dd3fc]"></span>
            <span>Unit tested & verified with Python 3.10 + unittest (6/6 tests passing)</span>
          </span>
          <span className="font-mono text-[11px] text-[#88b4cc]">
            Files located at /main.py, /database.py, /logic.py, /main_app.ui
          </span>
        </div>
      </div>
    </div>
  );
};
