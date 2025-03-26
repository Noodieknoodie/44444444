# app/date_utils.py
"""
Date utilities for maintaining period flags in the date_dimension table
"""

from datetime import datetime
import logging
from .db import get_connection

logger = logging.getLogger(__name__)

def update_date_flags():
    """
    Update the current and previous period flags in the date_dimension table.
    Called during application startup to ensure flags are always current.
    """
    # Get current date
    today = datetime.now()
    
    # Calculate current billing periods (1 month and 1 quarter behind current date)
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
    
    # Calculate previous periods (one before current)
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
    
    logger.info(f"Updating date flags: Current monthly={current_monthly_key}, Current quarterly={current_quarterly_key} (month {current_quarter_first_month})")
    logger.info(f"Previous monthly={prev_monthly_key}, Previous quarterly={prev_quarterly_key} (month {prev_quarter_first_month})")
    
    # Connect to database and update flags
    with get_connection() as conn:
        # First, reset all flags
        conn.execute("""
            UPDATE date_dimension 
            SET is_current_monthly = 0, 
                is_current_quarterly = 0,
                is_previous_month = 0,
                is_previous_quarter = 0
        """)
        
        # Set current monthly period
        conn.execute("""
            UPDATE date_dimension 
            SET is_current_monthly = 1
            WHERE period_key_monthly = ?
        """, (current_monthly_key,))
        
        # Set current quarterly period - only for the first month of the quarter
        conn.execute("""
            UPDATE date_dimension 
            SET is_current_quarterly = 1
            WHERE period_key_quarterly = ? AND month = ?
        """, (current_quarterly_key, current_quarter_first_month))
        
        # Set previous monthly period
        conn.execute("""
            UPDATE date_dimension 
            SET is_previous_month = 1
            WHERE period_key_monthly = ?
        """, (prev_monthly_key,))
        
        # Set previous quarterly period - only for the first month of the quarter
        conn.execute("""
            UPDATE date_dimension 
            SET is_previous_quarter = 1
            WHERE period_key_quarterly = ? AND month = ?
        """, (prev_quarterly_key, prev_quarter_first_month))
        
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
        
        if (counts['current_monthly_count'] != 1 or 
            counts['current_quarterly_count'] != 1 or
            counts['prev_monthly_count'] != 1 or
            counts['prev_quarterly_count'] != 1):
            logger.warning("Flag counts are not as expected:")
            logger.warning(f"Current monthly: {counts['current_monthly_count']} (expected 1)")
            logger.warning(f"Current quarterly: {counts['current_quarterly_count']} (expected 1)")
            logger.warning(f"Previous monthly: {counts['prev_monthly_count']} (expected 1)")
            logger.warning(f"Previous quarterly: {counts['prev_quarterly_count']} (expected 1)")
            return False
            
        return True