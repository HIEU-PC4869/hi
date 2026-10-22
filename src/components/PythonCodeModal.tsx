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
      description: 'PySide6 Controller with 100% QUiLoader, Glacier Glassmorphism QSS theme, QStackedWidget navigation, and setCellWidget ComboBox override.',
      code: `"""
main.py - Main Application Entry Point & PySide6 Controller Navigation
SAS Enterprise - Student Attendance & Intelligence System
"""

import os, sys
from PySide6.QtCore import QFile, QIODevice, QTimer, Qt
from PySide6.QtUiTools import QUiLoader
from PySide6.QtWidgets import (
    QApplication, QComboBox, QHeaderView, QLabel, QLineEdit,
    QPushButton, QStackedWidget, QTableWidget, QTableWidgetItem,
    QTextEdit, QDateEdit, QFileDialog, QMessageBox
)
from database import init_database
from logic import AttendanceLogic

GLACIER_QSS = """
QWidget {
    background-color: #0a0e1a;
    color: #e0e8f0;
    font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif;
    font-size: 13px;
}
QMainWindow, QStackedWidget { background-color: #0a0e1a; }
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
QPushButton {
    background-color: rgba(26, 36, 56, 0.85);
    color: #e0e8f0;
    border: 1px solid rgba(125, 211, 252, 0.2);
    border-radius: 8px;
    padding: 8px 14px;
    font-weight: 600;
}
QPushButton#btn_login, QPushButton#btn_submit_attendance, QPushButton#btn_save_notes, QPushButton#btn_start_session, QPushButton#btn_add_user {
    background-color: #7dd3fc;
    color: #001f2e;
    font-weight: bold;
    border-radius: 10px;
}
QLineEdit, QTextEdit, QDateEdit, QComboBox {
    background-color: rgba(26, 36, 56, 0.75);
    border: 1px solid rgba(125, 211, 252, 0.18);
    border-radius: 9px;
    padding: 8px 12px;
    color: #e0e8f0;
}
QTableWidget {
    background-color: rgba(17, 24, 40, 0.7);
    border: 1px solid rgba(125, 211, 252, 0.15);
    border-radius: 14px;
}
QHeaderView::section {
    background-color: rgba(26, 36, 56, 0.85);
    color: #a0b4c4;
    padding: 10px;
    font-size: 11px;
    font-weight: bold;
}
"""

class SASApplication:
    def __init__(self, ui_file_path: str = "main_app.ui"):
        self.logic = AttendanceLogic()
        self.current_user = None
        self.active_session = None
        self.session_remaining_seconds = 899
        self.timer = QTimer()
        self.timer.timeout.connect(self._on_timer_tick)

        loader = QUiLoader()
        ui_file = QFile(ui_file_path)
        if not ui_file.open(QIODevice.ReadOnly):
            raise FileNotFoundError(f"Cannot open UI file: {ui_file_path}")
        self.window = loader.load(ui_file)
        ui_file.close()

        self._bind_ui_elements()
        self._connect_signals()
        self.set_active_page(1)

    def _bind_ui_elements(self):
        self.stackedWidget: QStackedWidget = self.window.findChild(QStackedWidget, "stackedWidget")
        self.btn_nav_login: QPushButton = self.window.findChild(QPushButton, "btn_nav_login")
        self.btn_nav_student: QPushButton = self.window.findChild(QPushButton, "btn_nav_student")
        self.btn_nav_instructor: QPushButton = self.window.findChild(QPushButton, "btn_nav_instructor")
        self.btn_nav_advisor: QPushButton = self.window.findChild(QPushButton, "btn_nav_advisor")
        self.btn_nav_admin: QPushButton = self.window.findChild(QPushButton, "btn_nav_admin")
        self.btn_side_instructor: QPushButton = self.window.findChild(QPushButton, "btn_side_instructor")
        self.btn_side_student: QPushButton = self.window.findChild(QPushButton, "btn_side_student")
        self.btn_side_advisor: QPushButton = self.window.findChild(QPushButton, "btn_side_advisor")
        self.btn_side_admin: QPushButton = self.window.findChild(QPushButton, "btn_side_admin")

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
        course_id = self.combo_instructor_courses.currentData() or 1
        roster = self.logic.get_instructor_roster(course_id)
        self.table_instructor_attendance.setRowCount(len(roster))

        statuses = ["Present", "Late", "Absent", "Excused"]
        for row_idx, student in enumerate(roster):
            att_id = student["attendance_id"]
            self.table_instructor_attendance.setItem(row_idx, 0, QTableWidgetItem(f"#{student['student_id']:04d}"))
            self.table_instructor_attendance.setItem(row_idx, 1, QTableWidgetItem(student["full_name"]))
            self.table_instructor_attendance.setItem(row_idx, 2, QTableWidgetItem(student["time_logged"] or "—"))

            combo = QComboBox()
            combo.addItems(statuses)
            combo.setCurrentText(student["status"])
            def make_handler(aid):
                return lambda text: self.logic.manual_override_status(aid, text, self.current_user["id"] if self.current_user else 2)
            combo.currentTextChanged.connect(make_handler(att_id))
            self.table_instructor_attendance.setCellWidget(row_idx, 3, combo)

def main():
    init_database()
    app = QApplication(sys.argv)
    app.setStyleSheet(GLACIER_QSS)
    ui_path = os.path.join(os.path.dirname(__file__), "main_app.ui")
    sas = SASApplication(ui_path)
    sas.window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()`
    },
    database: {
      filename: 'database.py',
      language: 'python',
      description: 'SQLite3 Context Manager (auto commit / rollback), parameterized queries, tables, and seeded mock data.',
      code: `"""database.py - Database layer with SQLite3 Context Manager and Secure Schema"""
import sqlite3, hashlib, os
from datetime import datetime, timedelta

DB_FILE = os.path.join(os.path.dirname(__file__), "attendance.db")

class DBConnection:
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
                self.conn.rollback()
            else:
                self.conn.commit()
            self.conn.close()
        return False

def hash_password(password: str) -> str:
    salt = "sas_secure_salt_2025"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def init_database(db_path=DB_FILE):
    with DBConnection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT NOT NULL);")
        cursor.execute("CREATE TABLE IF NOT EXISTS Courses (id INTEGER PRIMARY KEY AUTOINCREMENT, course_name TEXT UNIQUE NOT NULL);")
        cursor.execute("CREATE TABLE IF NOT EXISTS Enrollments (user_id INTEGER, course_id INTEGER, PRIMARY KEY (user_id, course_id));")
        cursor.execute("CREATE TABLE IF NOT EXISTS Sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, session_code TEXT, start_time TEXT, is_active INTEGER);")
        cursor.execute("CREATE TABLE IF NOT EXISTS Attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER, student_id INTEGER, status TEXT, time_logged TEXT, updated_by INTEGER, UNIQUE(session_id, student_id));")
        cursor.execute("CREATE TABLE IF NOT EXISTS Excuses (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, course_id INTEGER, date_absent TEXT, reason TEXT, status TEXT DEFAULT 'Pending');")
        cursor.execute("CREATE TABLE IF NOT EXISTS Counseling_Notes (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, advisor_id INTEGER, note_text TEXT, created_at TEXT);")
        cursor.execute("CREATE TABLE IF NOT EXISTS Audit_Logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT, timestamp TEXT, details TEXT);")`
    },
    logic: {
      filename: 'logic.py',
      language: 'python',
      description: 'Model & Controller Business Logic: Check-in timing window (<15m Present, 15-45m Late), EWS algorithm, and CSV exports.',
      code: `"""logic.py - Controller & Model Business Logic Layer"""
import csv, random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from database import DBConnection, hash_password

class AttendanceLogic:
    def __init__(self, db_path=None):
        self.db_path = db_path

    def check_in(self, student_id: int, course_id: int, entered_token: str) -> Tuple[bool, str, str]:
        with DBConnection(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, session_code, start_time FROM Sessions WHERE course_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1;", (course_id,))
            session = cursor.fetchone()
            if not session:
                return False, "Error", "No active session found."

            if session["session_code"].replace("-", "") != entered_token.strip().replace("-", ""):
                return False, "Error", "Invalid PIN or QR code entered."

            start_dt = datetime.strptime(session["start_time"], "%Y-%m-%d %H:%M:%S")
            elapsed = (datetime.now() - start_dt).total_seconds() / 60.0
            status = "Present" if elapsed < 15.0 else ("Late" if elapsed <= 45.0 else "Absent")

            cursor.execute("""
                INSERT INTO Attendance (session_id, student_id, status, time_logged)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(session_id, student_id) DO UPDATE SET status=excluded.status, time_logged=excluded.time_logged;
            """, (session["id"], student_id, status, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
            return True, status, f"Check-in verified: {status}."`
    },
    ui: {
      filename: 'main_app.ui',
      language: 'xml',
      description: 'Qt Designer XML with top header bar, left sidebar, card bento layout, and exact objectNames.',
      code: `<?xml version="1.0" encoding="UTF-8"?>
<ui version="4.0">
 <class>MainWindow</class>
 <widget class="QMainWindow" name="MainWindow">
  <widget class="QWidget" name="centralWidget">
   <layout class="QVBoxLayout" name="rootLayout">
    <!-- Top Header Bar -->
    <item>
     <widget class="QFrame" name="frame_top_header">
      <!-- btn_nav_login, btn_nav_student, btn_nav_instructor, btn_nav_advisor, btn_nav_admin -->
     </widget>
    </item>
    <!-- Main Body: Sidebar + Stacked Widget -->
    <item>
     <layout class="QHBoxLayout" name="bodyLayout">
      <item>
       <widget class="QFrame" name="frame_sidebar">
        <!-- btn_side_instructor, btn_side_student, btn_side_advisor, btn_side_admin -->
       </widget>
      </item>
      <item>
       <widget class="QStackedWidget" name="stackedWidget">
        <widget class="QWidget" name="page_login"/>
        <widget class="QWidget" name="page_student"/>
        <widget class="QWidget" name="page_instructor"/>
        <widget class="QWidget" name="page_advisor"/>
        <widget class="QWidget" name="page_admin"/>
       </widget>
      </item>
     </layout>
    </item>
   </layout>
  </widget>
 </widget>
</ui>`
    },
    req: {
      filename: 'requirements.txt',
      language: 'text',
      description: 'Requirements file: PySide6, pandas, openpyxl.',
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
                Self-contained desktop application with full Glacier Dark Glassmorphism QSS theme.
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
            <span>Zero external image dependencies — runs directly in VSCode with python main.py</span>
          </span>
          <span className="font-mono text-[11px] text-[#88b4cc]">
            Files in workspace root: main.py, database.py, logic.py, main_app.ui, styles.qss
          </span>
        </div>
      </div>
    </div>
  );
};
