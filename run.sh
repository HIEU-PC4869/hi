#!/usr/bin/env bash
# SAS Enterprise - Linux / macOS Launcher
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TARGET="$SCRIPT_DIR/index.html"

echo "======================================================"
echo "  SAS Enterprise - Student Attendance System"
echo "  Launching HTML interface in default browser..."
echo "======================================================"

if which xdg-open > /dev/null; then
  xdg-open "$TARGET"
elif which open > /dev/null; then
  open "$TARGET"
else
  python3 "$SCRIPT_DIR/server.py"
fi
