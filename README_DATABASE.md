# 401K MANAGEMENT SYSTEM DATABASE REFERENCE

## DATABASE OVERVIEW
Financial management system tracking client payments for asset management services with monthly/quarterly payment schedules, contract management, and payment tracking. Supports split payments that cover multiple periods. System uses temporal validity (valid_from/valid_to) patterns for historical tracking. Current period fields (is_current_monthly/quarterly) in date_dimension used to identify the current billing period.

## TABLES

### clients - Core client information
Fields: client_id, display_name, full_name, ima_signed_date, valid_from, valid_to
Sample:
(1, "ABC Corp", "ABC Corporation Inc", "2019-03-15", "2019-03-15 14:22:01", NULL)
(2, "XYZ LLC", "XYZ Limited Liability Company", "2020-01-22", "2020-01-22 09:14:32", NULL)
Notes: Soft deletion pattern with valid_to. IMA = Investment Management Agreement, which establishes the relationship. This is the most upstream table in the database. All client_id references point here.

### contracts - Defines financial relationships between clients and providers
Fields: contract_id, client_id, contract_number, provider_id, fee_type, percent_rate, flat_rate, payment_schedule, num_people, valid_from, valid_to, is_active
Sample:
(102, 13, "CTR-2019-013", 3, "percent", 0.85, NULL, "monthly", 42, "2019-09-12 08:17:32", NULL, 1)
(104, 14, "CTR-2020-001", 2, "flat", NULL, 1500.00, "quarterly", 18, "2020-01-03 11:42:19", NULL, 1)
Notes: payment_schedule can be 'monthly' or 'quarterly' and determines the billing cycle. fee_type determines which rate field is used (percent_rate OR flat_rate, never both). is_active=1 means contract is currently in force. A client can have multiple contracts but typically only one active.

### payments - Records of financial transactions
Fields: payment_id, contract_id, client_id, received_date, total_assets, actual_fee, method, notes, valid_from, valid_to, applied_start_month, applied_start_month_year, applied_end_month, applied_end_month_year, applied_start_quarter, applied_start_quarter_year, applied_end_quarter, applied_end_quarter_year
Sample:
(445, 102, 13, "2020-01-13", 588000, 5000.0, "wire", NULL, "2020-01-13 10:22:33", NULL, 12, 2019, 2, 2020, NULL, NULL, NULL, NULL)
(446, 102, 13, "2020-04-13", 612000, 5000.01, "check", "Late payment", "2020-04-13 14:08:44", NULL, 3, 2020, 5, 2020, NULL, NULL, NULL, NULL)
Notes: Split payments (covering multiple periods) identified by different start/end periods. ~2.3% of payments are splits (20 out of 886 active payments). Monthly payments use month fields, quarterly use quarter fields. Period fields store which periods the payment covers, not when payment was received (use received_date for that).

### date_dimension - Reference table for time periods
Fields: period_date, year, month, month_name, quarter, period_key_monthly, period_key_quarterly, display_label_monthly, display_label_quarterly, is_current_monthly, is_current_quarterly, is_previous_month, is_previous_quarter
Sample:
("2024-10-01", 2024, 10, "Oct", 4, 202410, 20244, "Oct 2024", "Q4 2024", 0, 1, 0, 0)
("2025-02-01", 2025, 2, "Feb", 1, 202502, 20251, "Feb 2025", "Q1 2025", 1, 0, 0, 0)
Notes: Central reference for period handling. period_key_monthly format is YYYYMM; period_key_quarterly is YYYYQ. Only one record has is_current_monthly=1 (present billing month); only one has is_current_quarterly=1 (present billing quarter). System sets these flags automatically based on current date. is_previous_month/quarter flags not currently used.

### providers - Asset management service providers
Fields: provider_id, provider_name, valid_from, valid_to
Sample:
(1, "Fidelity Investments", "2019-01-01 00:00:00", NULL)
(2, "Vanguard Group", "2019-01-01 00:00:00", NULL)
Notes: Third-party companies that provide the actual investment services. Changes to provider information tracked with valid_from/valid_to.

### client_providers - Maps clients to providers with relationship timeframes
Fields: client_id, provider_id, start_date, end_date, is_active
Sample:
(13, 3, "2019-10-01", NULL, 1)
(14, 2, "2020-01-15", NULL, 1)
Notes: Many-to-many relationship allowing clients to have multiple providers over time. start_date often used to determine when client should begin paying. is_active allows quickly identifying current relationships.

### contacts - Communication endpoints for clients
Fields: contact_id, client_id, contact_type, contact_name, phone, email, fax, physical_address, mailing_address, valid_from, valid_to
Sample:
(25, 13, "primary", "John Smith", "555-123-4567", "jsmith@abccorp.com", NULL, "123 Main St, Suite 400, New York, NY 10001", "PO Box 789, New York, NY 10001", "2019-09-12 08:22:14", NULL)
(26, 13, "billing", "Jane Doe", "555-987-6543", "accounting@abccorp.com", "555-987-6500", NULL, NULL, "2019-09-12 08:24:32", NULL)
Notes: contact_type values include 'primary', 'billing', 'legal', etc. One client can have multiple contacts for different purposes. ~85% of clients have separate billing contacts.

### system_config - Application configuration key-value store
// not used at the moment

## VIEWS

### v_active_contracts - Shows only current, active contracts
Fields: All fields from contracts table
Logic: Filters contracts where is_active=1 AND valid_to IS NULL
Notes: Use this instead of direct table access to ensure only current contracts included in operations.

### v_payments - Enhanced payment records with period information and split detection
Fields: All payment fields + display_label_monthly, display_label_quarterly, period_key_monthly, period_key_quarterly, is_split_payment
Logic: Joins payments with date_dimension, sets is_split_payment=1 when start/end periods differ
Notes: Foundation view for payment operations. Critical is_split_payment flag identifies payments covering multiple periods. Filtered to only active payments (valid_to IS NULL).

### v_client_payment_first - Details about each client's first payment
Fields: client_id, display_name, first_payment_id, first_payment_date, first_payment_amount, first_payment_method, first_payment_assets, first_payment_period_key, first_payment_period
Logic: For each client, finds earliest payment by received_date and retrieves all details
Notes: Used to determine client start date in period calculations. Includes only clients with at least one payment.

### v_client_payment_last - Details about each client's most recent payment
Fields: client_id, display_name, last_payment_id, last_payment_date, last_payment_amount, last_payment_method, last_payment_assets, last_payment_period_key, last_payment_period, days_since_last_payment
Logic: For each client, finds latest payment by received_date and calculates days elapsed since
Notes: Critical for monitoring payment recency and following up on delinquent clients.

### v_current_period - Calculates current billing periods based on system date
Fields: today, current_year, current_month, current_month_for_billing, current_month_year_for_billing, current_quarter_for_billing, current_quarter_year_for_billing, current_monthly_key, current_quarterly_key
Logic: Uses CURRENT_DATE and complex logic to determine current billing periods for both schedules
Notes: Central for time-based operations. current_monthly_key format is YYYYMM; current_quarterly_key is YYYYQ. System always bills for previous completed period, not current calendar period.

### v_client_expected_periods - All periods each client should have paid for
Fields: client_id, payment_schedule, period_key_monthly, period_key_quarterly, period_key, period_label
Logic: Generates all periods from client start date (first payment or relationship start) to current period
Notes: Foundation for missing payment detection. period_key field is period_key_monthly for monthly clients or period_key_quarterly for quarterly clients.

### v_payment_period_coverage - Maps which periods each payment covers with period details
Fields: payment_id, client_id, received_date, actual_fee, is_split_payment, covered_monthly_periods, covered_quarterly_periods, periods_covered
Logic: For each payment, compiles list of covered periods with labels and counts total periods covered
Notes: Designed for UI display of split payments. covered_*_periods fields contain semicolon-separated strings of "period_key|display_label" format for easy parsing in front-end. periods_covered is the count of periods for proration display.

### v_expanded_payment_periods - Expands split payments into individual period records
Fields: payment_id, client_id, period_key, payment_schedule
Logic: Joins payments with date_dimension to create one record per period covered by each payment
Notes: Backend view for calculations. One payment that covers multiple periods becomes multiple rows, one per period. Used for accurate payment/period mapping.

### v_current_period_payment_status - Shows whether clients have paid for current period
Fields: client_id, payment_schedule, period_key, period_label, status
Logic: For each active client, checks if current period (based on schedule) has been paid
Notes: Central for billing dashboard. status is either 'Paid' or 'Unpaid'. Shows payment status for exactly one period per client (the current one).

### v_all_missing_payment_periods - All periods clients should have paid for but haven't
Fields: client_id, payment_schedule, period_key, period_label, status
Logic: Compares expected periods against expanded payment periods to find gaps
Notes: Comprehensive view of payment delinquency across all historical periods. Always contains 'Missing' as status value. Used for collections and payment reconciliation.

## KEY RELATIONSHIPS
- clients 1→N contracts (one client can have multiple contracts)
- clients 1→N payments (payments associated with both client and contract)
- clients M→N providers (through client_providers junction table)
- clients 1→N contacts (multiple contact points per client)
- contracts 1→N payments (one contract can have multiple payments)
- payments 1→N periods (one payment can cover multiple periods when split)

## APP INTEGRATION PATTERNS
1. Client dashboard: Display v_current_period_payment_status to show if current period paid
2. Missing payments report: Use v_all_missing_payment_periods to show all delinquent periods
3. Payment history: Use v_payments with v_payment_period_coverage for expandable split payments
4. Period coverage: Use v_client_expected_periods joined with v_expanded_payment_periods

## DATA QUALITY NOTES
- ~2.3% of payments are splits (covering multiple periods)
- 29 active clients with 886 active payments in the system
- Payments range from 2019 to present
- Most clients have multiple contacts (~85% have separate billing contacts)
- Mixed fee structures (some flat fee, some percentage-based)
- All monetary values stored without currency symbols (assumed USD)
- Payment methods include 'wire', 'check', 'ach', 'credit_card'