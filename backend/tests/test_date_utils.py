
import pytest
from app.date_utils import update_date_flags

def test_update_date_flags(db_connection):
    """Test the date flag update functionality"""
    # First reset all flags to ensure we're starting from a clean state
    db_connection.execute("""
        UPDATE date_dimension 
        SET is_current_monthly = 0, 
            is_current_quarterly = 0,
            is_previous_month = 0,
            is_previous_quarter = 0
    """)
    db_connection.commit()
    
    # Run the update function
    success = update_date_flags()
    
    # It should return True indicating success
    assert success
    
    # Verify we have exactly one record with each flag set
    cursor = db_connection.execute("""
        SELECT 
            SUM(is_current_monthly) as current_monthly_count,
            SUM(is_current_quarterly) as current_quarterly_count,
            SUM(is_previous_month) as prev_monthly_count,
            SUM(is_previous_quarter) as prev_quarterly_count
        FROM date_dimension
    """)
    counts = cursor.fetchone()
    
    assert counts['current_monthly_count'] == 1
    assert counts['current_quarterly_count'] == 1
    assert counts['prev_monthly_count'] == 1
    assert counts['prev_quarterly_count'] == 1
