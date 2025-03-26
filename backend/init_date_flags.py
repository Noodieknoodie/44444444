# Initialize date dimension flags
# Run this once to set up the date dimension flags correctly
import sqlite3
from pathlib import Path
import sys
from datetime import datetime

def update_date_flags_fixed():
    """Update date dimension flags with additional reset step"""
    # Get current date
    today = datetime.now()
    
    # Calculate current billing periods
    current_month_year = today.year
    current_month = today.month - 1
    if current_month == 0:
        current_month = 12
        current_month_year -= 1
        
    # Calculate quarterly
    current_quarter_year = today.year
    current_quarter = (today.month - 1) // 3 + 1
    if current_quarter == 0:
        current_quarter = 4
        current_quarter_year -= 1
    
    # Calculate previous periods
    prev_month_year = current_month_year
    prev_month = current_month - 1
    if prev_month == 0:
        prev_month = 12
        prev_month_year -= 1
        
    prev_quarter_year = current_quarter_year
    prev_quarter = current_quarter - 1
    if prev_quarter == 0:
        prev_quarter = 4
        prev_quarter_year -= 1
    
    # Calculate period keys
    current_monthly_key = current_month_year * 100 + current_month
    current_quarterly_key = current_quarter_year * 10 + current_quarter
    
    prev_monthly_key = prev_month_year * 100 + prev_month
    prev_quarterly_key = prev_quarter_year * 10 + prev_quarter
    
    # Calculate the first month of each quarter for precise selection
    current_quarter_first_month = ((current_quarter - 1) * 3) + 1
    prev_quarter_first_month = ((prev_quarter - 1) * 3) + 1
    
    print(f"Current monthly key: {current_monthly_key}")
    print(f"Current quarterly key: {current_quarterly_key} (first month: {current_quarter_first_month})")
    print(f"Previous monthly key: {prev_monthly_key}")
    print(f"Previous quarterly key: {prev_quarterly_key} (first month: {prev_quarter_first_month})")
    
    # Connect to database
    db_path = Path(__file__).parent / "payments.db"
    conn = sqlite3.connect(str(db_path))
    
    # First, do a hard reset of ALL flags
    print("Resetting all flags to 0...")
    conn.execute("UPDATE date_dimension SET is_current_monthly = 0, is_current_quarterly = 0, is_previous_month = 0, is_previous_quarter = 0")
    conn.commit()
    
    # Diagnostic step - check if the reset worked
    cursor = conn.execute("SELECT SUM(is_current_monthly) as cm, SUM(is_current_quarterly) as cq, SUM(is_previous_month) as pm, SUM(is_previous_quarter) as pq FROM date_dimension")
    counts = cursor.fetchone()
    print(f"After reset: CM={counts[0]}, CQ={counts[1]}, PM={counts[2]}, PQ={counts[3]}")
    
    # Now set ONE record for current monthly (SQLite doesn't support LIMIT in UPDATE)
    print(f"Setting current monthly for {current_monthly_key}...")
    conn.execute(
        "UPDATE date_dimension SET is_current_monthly = 1 WHERE period_key_monthly = ?",
        (current_monthly_key,)
    )
    
    # Set ONE record for current quarterly (pick the first month of the quarter)
    print(f"Setting current quarterly for {current_quarterly_key} (month {current_quarter_first_month})...")
    conn.execute(
        "UPDATE date_dimension SET is_current_quarterly = 1 WHERE period_key_quarterly = ? AND month = ?",
        (current_quarterly_key, current_quarter_first_month)
    )
    
    # Set ONE record for previous monthly
    print(f"Setting previous monthly for {prev_monthly_key}...")
    conn.execute(
        "UPDATE date_dimension SET is_previous_month = 1 WHERE period_key_monthly = ?",
        (prev_monthly_key,)
    )
    
    # Set previous quarterly period (pick the first month of the quarter)
    print(f"Setting previous quarterly for {prev_quarterly_key} (month {prev_quarter_first_month})...")
    conn.execute(
        "UPDATE date_dimension SET is_previous_quarter = 1 WHERE period_key_quarterly = ? AND month = ?",
        (prev_quarterly_key, prev_quarter_first_month)
    )
    
    conn.commit()
    
    # Verify the updates worked
    cursor = conn.execute("""
        SELECT 
            SUM(is_current_monthly) as current_monthly_count,
            SUM(is_current_quarterly) as current_quarterly_count,
            SUM(is_previous_month) as prev_monthly_count,
            SUM(is_previous_quarter) as prev_quarterly_count
        FROM date_dimension
    """)
    counts = cursor.fetchone()
    
    if (counts[0] != 1 or counts[1] != 1 or counts[2] != 1 or counts[3] != 1):
        print("WARNING: Flag counts are not as expected:")
        print(f"Current monthly: {counts[0]} (expected 1)")
        print(f"Current quarterly: {counts[1]} (expected 1)")
        print(f"Previous monthly: {counts[2]} (expected 1)")
        print(f"Previous quarterly: {counts[3]} (expected 1)")
        
        # Print detailed info about flagged records
        cursor = conn.execute("""
            SELECT period_date, period_key_monthly, period_key_quarterly, 
                   is_current_monthly, is_current_quarterly, 
                   is_previous_month, is_previous_quarter
            FROM date_dimension
            WHERE is_current_monthly = 1 OR is_current_quarterly = 1 
                  OR is_previous_month = 1 OR is_previous_quarter = 1
        """)
        print("\nRecords with flags set:")
        for row in cursor.fetchall():
            print(f"Date: {row[0]}, Monthly: {row[1]}, Quarterly: {row[2]}, Flags: CM={row[3]}, CQ={row[4]}, PM={row[5]}, PQ={row[6]}")
        
        conn.close()
        return False
    
    conn.close()
    return True

print("Initializing date dimension flags...")
success = update_date_flags_fixed()

if success:
    print("Date dimension flags initialized successfully!")
    sys.exit(0)
else:
    print("Failed to initialize date dimension flags")
    sys.exit(1)
