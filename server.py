#!/usr/bin/env python3
"""
server.py - Compatibility Entrypoint for MVC HTTP Controller
Delegates strictly to controller.http_controller (MVC Controller Component).
"""

import sys

from controller.http_controller import (
    PORT,
    SASHttpHandler,
    ThreadingHTTPServer,
    run,
)

__all__ = ["PORT", "SASHttpHandler", "ThreadingHTTPServer", "run"]

if __name__ == "__main__":
    no_browser = "--no-browser" in sys.argv
    run(open_browser=not no_browser)
