#!/usr/bin/env bash
# SAS Enterprise - Linux / macOS Launcher
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TARGET="$SCRIPT_DIR/app.html"

echo "======================================================"
echo "  SAS Enterprise - Student Attendance System"
echo "  Đang mở giao diện HTML trên trình duyệt..."
echo "======================================================"

if which xdg-open > /dev/null; then
  xdg-open "$TARGET"
elif which open > /dev/null; then
  open "$TARGET"
else
  python3 "$SCRIPT_DIR/server.py"
fi
