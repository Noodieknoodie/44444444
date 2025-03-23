HOHIMERPRO DEVELOPER BIBLE  
401(k) PAYMENT MANAGEMENT SYSTEM  

STACK:
- Backend: FastAPI, Pydantic for validation
- Frontend: React, Next.js, Tailwind, Shadcn/UI, Lucide Icons, React Query
- State: React Context API
- Database: SQLite
- Configuration: config\config.py
- File Storage: Shared OneDrive folder mapped consistently to `Z:` drive

DATABASE-FIRST DESIGN:
- Business logic centralized within SQLite views intentionally.
- **Never duplicate view logic in application code.**
- Schema reference: (`backend/data/schema.sql`)

SYSTEM PURPOSE:
Internal tool for managing client payments in a small (~5-person) 401(k) management firm. Core capabilities:
- Payment management (CRUD operations)
- Missed/delinquent payment detection
- Fee calculations, variances, and expectations
- Centralized document storage and retrieval linked to payments/clients
- Reporting and status monitoring

BILLING CONTEXT:
Clients billed "in arrears" (after the service period ends):
- Monthly clients billed for the previous month.
- Quarterly clients billed for the previous quarter.

DATA MODEL ESSENTIALS:
Billing determined by two dimensions:
- **Schedule:** Monthly or Quarterly
- **Fee Type:** Percentage (of assets) or Flat amount  
  (defined clearly in `contracts` table)

Payment Details:
- Payments recorded exactly as received.
- Associated clearly with specific billing periods:
  - Monthly: `applied_start_month/year`, `applied_end_month/year`
  - Quarterly: `applied_start_quarter/year`, `applied_end_quarter/year`
- "Split payments" (covering multiple periods) explicitly marked (`applied_start` ≠ `applied_end`).

PERIOD ENCODING SYSTEM:
- Monthly: `YYYYMM` (e.g., January 2025 → 202501)
- Quarterly: `YYYYQ` (e.g., Q3 2024 → 20243)

DATABASE STRUCTURE:
- Core tables: `clients`, `contracts`, `payments`, `providers`, `contacts`, `date_dimension`, `client_folders`
- Date dimension table centrally manages current monthly and quarterly billing periods.
- Payments explicitly linked to periods, providing accurate payment coverage data.

DOCUMENT STORAGE & MANAGEMENT:
- Documents stored centrally on a shared OneDrive folder, consistently mapped as drive `Z:` across all users.
- **No username-based paths;** all users reference identical, stable paths.
- Documents uploaded through React frontend; saved to central "dump" folder (`Z:/dump`) once per document.
- Documents systematically named: `{provider} - {clients} - {date}.pdf`.
- SQLite database automatically tracks document-to-payment/client associations.
- Python automation (FastAPI backend) creates shortcuts in individual client folders pointing to central document storage, avoiding file duplication.

see: config\config.py

CRITICAL APPLICATION DETAILS:
- **Authentication:** None required; internal userbase only.
- **Period Maintenance:** Daily scheduled task updates current billing period flags in the database.
- **Missing AUM Data:** For percentage-based clients, use the latest available asset data as an estimate. Clearly mark estimated data; explicitly note when historical data is absent.
- **SQLite Considerations:** Flexible typing and NULL handling require careful attention during calculations.

INTEGRATION ARCHITECTURE:
- **Frontend (React)** → **Backend (FastAPI)** → **Database (SQLite)**
- Frontend interacts exclusively with FastAPI endpoints—no direct database or file path manipulation.
- Backend handles SQL queries, business logic, file naming, associations, and shortcut creation.

FILE MANAGEMENT PROCESS:
// see README_FILE_SYSTEM.md

FRONTEND STATUS:
- Currently a functional wireframe; backend integration required following the above architecture.

RECOMMENDED DATABASE VIEW USAGE:
- Billing status → `v_current_period_payment_status`
- Identify delinquent periods → `v_all_missing_payment_periods`
- Payment history and split details → `v_payments` and `v_payment_period_coverage`
- Expected vs. actual period coverage → `v_client_expected_periods` with `v_expanded_payment_periods`