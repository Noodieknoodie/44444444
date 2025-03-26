# app/db.py
import sqlite3
from contextlib import contextmanager

@contextmanager
def get_connection():
    """Simple database connection manager that ensures connections are closed"""
    conn = sqlite3.connect("payments.db")
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    try:
        yield conn
    finally:
        conn.close()