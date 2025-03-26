#### A WEE BIT OF CONTEXT ####

Project Name: 401(k) Payment Tracking System  

Purpose:  
Replaces HH’s Excel-based 401(k) payment tracking with a local-only desktop app. Ensures accurate record-keeping, compliance, and streamlined payment management. Runs offline on secure workplace PCs with shared OneDrive access.  

Scope:  
- Local desktop app (Windows, no internet)  
- Max 5 non-concurrent users  
- SQLite, Python backend, React/Next.js frontend, FastAPI, Tailwind  

Payments:  
** IMPORTANT ** ALL PAYMENTS ARE IN AREERS. This means, if today's date is 3/13/2025 (for example) then:
a) if contracts.payment_schedule is 'monthly', we would be collecting payments for FEBUARY 2025 (applied_end_month: 2, applied_end_month_year: 2025)
// current date's month minus 1
b) if contracts.payment_schedule is 'quarterly', we would be collecting payments for Q4 2024 (.applied_end_quarter: 4, applied_end_quarter_year: 2024)
// current date's quarter minus one


Other simple buisiness logic:
- Expected Fee: Conditional. (python?)
a) for contracts with a flat fee, the expected fee is the flat fee. 
b) for contracts with a percentage fee, the expected fee is the percentage fee times the total assets for the payment period. If no AUM is available, use the the most recent available AUM from payment history, if none exists then do N/A. show a mega-small disclaimer if historic AUM is used.
- Last Payment (date): simple. the most recent payment received date for a given client. (formatted like Month Day, Year on UI)
- Last Payment (amount): simple. the most recent payment amount for a given client. (formatted like $0.00 on UI)
- Current Period: The current date's month and year (for monthly contracts) or quarter and year (for quarterly contracts).
- Payment Status: notice of if client has paid for the current period or not. Options: Due, Paid. (no need for "overdue") 
- Missing Payments: shows the periods that the client has not paid for, starting from the most recent period paid until the current period. for example, if the current period is Q2 2025, and the clients last payment was Q2 2024, then the missing payments are Q3 2024, Q4 2024, and Q1 2025. Same logic applies for monthly. Utilize the client_payment_status view to get the most recent payment date for a given client.
- immediate updates / UI updates when data is changed, etc. 
- regular expected states, confirmations, warnings, etc. 



Core Features:  
- **Payment Tracking**: Record, validate, and link payments  
- **Dashboard**: client, info, compliance info, other random things from the views, and client-specific views 
- payment history table 
- add payment, edit payment, delete, etc. 
- **Data Entry**: Quick and bulk entry 
- Offline, local-only operation  
- SQLite database  
- Supports PDFs, images  
- Handles ~30-50 clients, ~1000 payments annually  
- No investment management or financial transactions  
- No authentication, complex reporting  




**** THIS APP IS IN PROGRESS ****

#### THE MAJORITY OF THE BUSINESS LOGIC IS IN THE SQL DATABASE AND SOME IN PYTHON. ####
#### ITENLLIGENTLYY DETERMINE WHAT YYOUR JOB IS AND WHAT YYOUR JOB ISNT
#### THE FRONTEND IS RESPONSIBLE FOR DEALING WITH WHAT ITS OWN JOB IS AND MUST NOT ATTEMPT TO DO MORE THAN NEEDED... NO DUPLICATION. CLEAR SEPARATION OF CONCERNS  



With Tailwind CSS v4.0, there's no need for a separate tailwind.config.js file by default. If you need to customize Tailwind, you can do so directly in your CSS file using the new CSS-first configuration approach.


