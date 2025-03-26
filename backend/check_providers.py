
# Script to analyze provider deletion behavior
import sqlite3
import json
from pathlib import Path

# Connect to the database
db_path = Path(__file__).parent / "payments.db"
conn = sqlite3.connect(str(db_path))
conn.row_factory = sqlite3.Row

# View the provider API query
print("Provider API query analysis:")
api_query = """
SELECT * FROM providers WHERE provider_id = ? AND valid_to IS NULL
"""
print(f"API query for provider by ID: {api_query}")

# Create a test provider
cursor = conn.execute(
    "INSERT INTO providers (provider_name) VALUES (?)",
    ("Test Provider for Deletion Analysis",)
)
provider_id = cursor.lastrowid
print(f"\nCreated test provider with ID: {provider_id}")

# Mark provider as deleted
cursor = conn.execute(
    "UPDATE providers SET valid_to = datetime('now') WHERE provider_id = ?",
    (provider_id,)
)
print(f"Marked provider {provider_id} as deleted")

# Try getting the provider with standard API query
cursor = conn.execute(
    "SELECT * FROM providers WHERE provider_id = ? AND valid_to IS NULL",
    (provider_id,)
)
api_result = cursor.fetchone()
print(f"\nAPI query result (with valid_to IS NULL): {api_result}")

# Try getting the provider without valid_to filter
cursor = conn.execute(
    "SELECT * FROM providers WHERE provider_id = ?",
    (provider_id,)
)
direct_result = cursor.fetchone()
print(f"Direct query result (without valid_to filter): {direct_result if direct_result else 'None'}")

# Look at the failing test logic
print("\nTest failure analysis:")
print("1. Test creates provider")
print("2. Test deletes provider (sets valid_to)")
print("3. Test verifies provider no longer in active list (valid_to IS NULL)")
print("4. Test tries to get provider directly by ID but uses 'valid_to IS NULL' filter")
print("   - Expected: Should find record")
print("   - Actual: Not found due to valid_to filter")

# Clean up
conn.execute("DELETE FROM providers WHERE provider_id = ?", (provider_id,))
conn.commit()
conn.close()
