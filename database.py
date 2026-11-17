"""
database.py - Compatibility Re-export for MVC Model Persistence Utilities
Delegates strictly to model.database (MVC Model Component).
"""

from model.database import (
    DB_FILE,
    DBConnection,
    hash_password,
    init_database,
)

__all__ = [
    "DB_FILE",
    "DBConnection",
    "hash_password",
    "init_database",
]
