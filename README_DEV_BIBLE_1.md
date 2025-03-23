# README_DEV_BIBLE_1.md

# HOHIMERPRO - THE 401(k) PAYMENT MANAGEMENT SYSTEM - DEVELOPER'S BIBLE

########## ALWAYS CHECK THE DATABASE SCHEMA BEFORE TRUSTING ANYTHING IN THIS DOCUMENTATION... 
THE DATABASE SCHEMA HAS CHANGED RECENTLY ########

## INTRODUCTION: WHY THIS SYSTEM EXISTS & WHAT IT DOES

This is an internal tool for a small company (about 5 people) that manages 401(k) plans for client businesses. They're replacing a shitty Excel system with this app. The system handles:

1. Tracking client payments for 401(k) management services
2. Detecting missed payments 
3. Calculating expected fees and variances
4. Storing documents related to payments
5. Generating reports

**ESSENTIAL BUSINESS CONTEXT**: They get paid for managing these 401(k) plans AFTER the period ends (in arrears). Monthly clients pay for the previous month, quarterly clients pay for the previous quarter. So if today is Feb 20, 2028, they're collecting for Jan 2028 (monthly clients) or Q4 2027 (quarterly clients).

**THE BIG IDEA**: Alot of complex business logic is in SQLite views. This is INTENTIONAL. The views handle all the complexity of figuring out periods, calculating fees, determining payment status, etc. The app code should be fairly thin, mostly connecting the UI to the right views. DON'T DUPLICATE VIEW LOGIC IN APPLICATION CODE!


## DATA MODEL FUNDAMENTALS

### THE BILLING MODEL

There are TWO dimensions that determine how a client is billed:

1. **Schedule**: Either "monthly" or "quarterly"
2. **Fee Type**: Either "percentage" (of assets) or "flat" (fixed amount)

So four possible combinations:
- Monthly percentage (e.g., 0.0007 of assets monthly)
- Monthly flat (e.g., $666.66 monthly)
- Quarterly percentage (e.g., 0.001875 of assets quarterly)
- Quarterly flat (e.g., $3500 quarterly)

### PAYMENTS & PERIODS

- Payments are stored exactly as received (no modifications)
- Each payment has fields clearly identifying what period(s) it covers:
  - Monthly: `applied_start_month`, `applied_start_month_year`, `applied_end_month`, `applied_end_month_year`
  - Quarterly: `applied_start_quarter`, `applied_start_quarter_year`, `applied_end_quarter`, `applied_end_quarter_year`

- **SUPER IMPORTANT**: Most payments cover a single period (start=end), but "split payments" cover multiple periods. THESE ARE DETECTED BY `applied_start` != `applied_end`.

### PERIOD ENCODINGS

There are TWO period encoding systems:
1. Monthly periods: encoded as `YYYYMM` (year * 100 + month)
2. Quarterly periods: encoded as `YYYYQ` (year * 10 + quarter)

For example:
- January 2025 = 202501
- Q3 2024 = 20243

**REMEMBER**: This encoding is used extensively in the views - don't reinvent period handling!


1. **Authentication & Authorization**:
// NONE - this is a small internal tool for ~5 users... NO AUTHENTICATION NEEDED

2. **Period Reference Maintenance**:
   - Create a scheduled task that runs daily to update the current period flags in the DB

3. **File Storage**: (see README_FILE_SYSTEM.md)

4. **Data Entry Validation**:
   - Form validation for payment entry
   - Ensure required fields are populated
   - Handle document uploads

5. **UI State Management**:
   - Client selection state
   - Form edit/create state
   - Document viewer state

## COMMON GOTCHAS & EDGE CASES

1. **Split Payment Weirdness**:
   - DON'T treat split payments as multiple separate payments
   - DON'T try to allocate split payments based on anything but equal distribution
   - DON'T calculate variance on split payments (intentionally muted) 
// verify with the SQL as it might not align 

2. **Missing AUM Data**:
   - Some percentage-based clients have ZERO AUM data (100% missing)
   - Others have sporadic missing values
   - Display estimated values by looking back for most recent aum entered but clearly mark them as such. if none then say so. this fallback only matters for percentage clients. 

4. **Current Period Logic**:
   - Billing is IN ARREARS - always one period behind
   - Period reference table MUST be kept current
   - Monthly and quarterly periods move independently

5. **SQLite Type Quirks**:
   - SQLite has flexible typing - be careful with type conversions
   - Watch for NULL handling in calculations


This system is built to minimize application code complexity by leveraging SQLite views. The views handle most of the complex business logic... 


---


THE FRONTEND IS A FUNCTIONAL WIREFRAME THAT NEEDS INTEGRATION....



