
# Script to check database schema
import sqlite3
import json

conn = sqlite3.connect('/projects/4OH1KAY_3_25/payments.db')
conn.row_factory = sqlite3.Row

# Get tables
cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row['name'] for row in cursor.fetchall()]

# Get views
cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='view'")
views = [row['name'] for row in cursor.fetchall()]

result = {
    "tables": tables,
    "views": views
}

print(json.dumps(result, indent=2))
conn.close()
