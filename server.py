#!/usr/bin/env python3
"""
SAS Enterprise - Ultra Simple Web Server
Zero external dependencies: Requires only standard Python 3. No pip install needed!

Run in VS Code terminal:
    python server.py
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

# Ensure working directory is the script's folder
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

class SASHttpHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Default root path to app.html for seamless one-click loading
        if self.path in ('/', '/index.html'):
            self.path = '/app.html'
        return super().do_GET()

    def end_headers(self):
        # Prevent caching during testing
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SASHttpHandler) as httpd:
        target_url = f"http://localhost:{PORT}/app.html"
        print("=" * 64)
        print("  🚀 SAS Enterprise - Student Attendance & Intelligence System")
        print(f"  🌐 Đang chạy máy chủ web cục bộ tại:")
        print(f"     👉 {target_url}")
        print("=" * 64)
        print("  💡 Bạn có thể mở trực tiếp link trên trong Chrome, Edge, Safari...")
        print("  🛑 Nhấn Ctrl + C để dừng máy chủ bất cứ lúc nào.")
        print("=" * 64)
        
        try:
            webbrowser.open(target_url)
        except Exception:
            pass
            
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  👋 Đã tắt máy chủ. Cảm ơn bạn đã sử dụng SAS Enterprise!")
            sys.exit(0)

if __name__ == "__main__":
    run()
