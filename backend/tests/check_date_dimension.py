
# Script to check date_dimension table
import sqlite3
import json
from pathlib import Path

# Connect to the database
db_path = Path(__file__).parent / "payments.db"
conn = sqlite3.connect(str(db_path))
conn.row_factory = sqlite3.Row

# Query date_dimension table
cursor = conn.execute("""
    SELECT period_date, year, month, quarter, 
           period_key_monthly, period_key_quarterly,
           display_label_monthly, display_label_quarterly,
           is_current_monthly, is_current_quarterly,
           is_previous_month, is_previous_quarter
    FROM date_dimension
    ORDER BY period_date DESC
    LIMIT 10
""")

# Convert to list of dictionaries for JSON serialization
result = [dict(row) for row in cursor.fetchall()]
print(json.dumps(result, indent=2))

# Check if there are any records with previous flags set
cursor = conn.execute("""
    SELECT COUNT(*) as count
    FROM date_dimension
    WHERE is_previous_month = 1 OR is_previous_quarter = 1
""")
previous_count = cursor.fetchone()[0]
print(f"\nRecords with previous period flags set: {previous_count}")

# Check provider deletion behavior
cursor = conn.execute("""
    SELECT * FROM providers
    WHERE valid_to IS NOT NULL
    LIMIT 5
""")
deleted_providers = [dict(row) for row in cursor.fetchall()]
print(f"\nSoft-deleted providers:")
print(json.dumps(deleted_providers, indent=2))

# Check how provider querying works with valid_to
cursor = conn.execute("""
    SELECT provider_id, provider_name, valid_to
    FROM providers
    WHERE provider_id = ?
""", (deleted_providers[0]['provider_id'] if deleted_providers else -1,))
provider_query = [dict(row) for row in cursor.fetchall()]
print(f"\nQuerying provider_id {deleted_providers[0]['provider_id'] if deleted_providers else 'N/A'}:")
print(json.dumps(provider_query, indent=2))

conn.close()
