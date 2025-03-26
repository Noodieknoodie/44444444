# Date Dimension Maintenance

## Overview

The payment system relies on a date dimension table that tracks which periods (months and quarters) are considered "current" and "previous" for billing purposes. These flags are used by several views and API endpoints to determine payment status.

## Automatic Maintenance

The system automatically maintains these flags on application startup:

1. When the API server starts, it calculates the appropriate current and previous billing periods
2. It updates the date_dimension table to set the correct flags
3. This ensures the flags are always current without requiring external scheduled tasks

## How It Works

- Current billing period = The month/quarter before the current date
  - Example: If today is March 25, 2025, then February 2025 is the current monthly billing period
  - And Q4 2024 is the current quarterly billing period
  
- Previous billing period = The period before the current billing period
  - Example: January 2025 is the previous monthly period
  - And Q3 2024 is the previous quarterly period

## Implementation Details

For quarterly periods, the system specifically flags only the first month of the quarter (Jan for Q1, Apr for Q2, Jul for Q3, Oct for Q4) to ensure exactly one record is flagged per period. This is important for consistent query results when using the `is_current_quarterly` and `is_previous_quarter` flags.

The functionality is implemented in:

1. `app/date_utils.py` - Contains the `update_date_flags()` function that updates flags on application startup
2. `app/main.py` - Calls this function on application startup via the `@app.on_event("startup")` decorator

## Logs

The system logs information about date flag updates to help with troubleshooting:

- Successful updates will show "Date dimension flags updated successfully"
- Failed updates will show "Failed to properly update date dimension flags" with additional details

## Initial Setup

To initialize the date flags for the first time, run the following command from the backend directory:

```bash
python init_date_flags.py
```

This command sets the proper date flags in the database based on today's date.

## Ongoing Maintenance

As long as the application is restarted at least occasionally (daily/weekly), the date flags will remain current without any manual intervention.