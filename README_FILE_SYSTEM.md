DOCUMENT & DATABASE MANAGEMENT PLAN

CURRENT SETUP (PROBLEM):  
- Our document and database system currently uses OneDrive paths tied to individual usernames (e.g., `C:/Users/{username}/...`).  
- This design introduces complexity, frequent breakages, inconsistent experiences, and redundant file management (copying the same document into multiple client folders).  
- Additionally, documents often cover multiple clients per provider, causing unnecessary duplication and inefficient workflows.

GOALS (WHAT WE WILL ACCOMPLISH):  
- Eliminate username-based file paths entirely for a stable, consistent experience.  
- Centralize file storage, avoiding document duplication.  
- Improve document naming and association with database records automatically.  
- Provide a single "true" storage location for documents, linked smartly to clients and payments.  
- Retain simplicity: avoid complex cloud APIs, heavy backends, or unnecessary infrastructure.

FINAL DESIGN (TARGET SETUP):  
- A single shared OneDrive folder synced identically to all users' machines.  
- A simplified, consistent drive letter (Z:) mapped to this shared location on every user's computer, ensuring all users have identical paths.  
- SQLite database manages metadata (clients, payments, providers, documents) and client folder locations.  
- One single "dump" folder on the mapped drive (`Z:`) stores all incoming documents.  
- Each uploaded document is saved once, systematically named based on: provider, client(s), and payment date.  
- SQL database tracks which payments/clients a document applies to—no redundant copies needed.  
- Shortcuts automatically created (via Python automation) in each client's directory pointing to the single document in the dump folder, giving users a familiar browsing experience without duplication.

DOCUMENT UPLOAD & ASSOCIATION PROCESS:  
1. User uploads a document through the React frontend, specifying Provider, Document Type, Received Date, and Clients involved.  
2. Backend (Python FastAPI) stores the document into the central dump folder (`Z:/dump`) using naming conventions (`{provider} - {clients} - {date}.pdf`).  
3. The database associates the document with specific clients/payments automatically based on Provider and Received Date logic.  
4. Python creates shortcuts in relevant client folders (`Z:/401k Clients/{client_name}/Consulting Fee/{year}/`) that link back to the document, providing clear file structure without duplicating actual files.  

ABSOLUTE PLAN OF ACTION (EXACT STEPS):  
1. CREATE ONE CENTRAL ONEDRIVE FOLDER:  
   - Confirm a dedicated shared OneDrive (SharePoint library) folder synced to all users’ local machines.

2. STANDARDIZE FILE PATHS (ESSENTIAL STEP):  
   - Each user maps the OneDrive folder as drive `Z:`:  
   ```
   Z:\ → C:\Users\{username}\Hohimer Wealth Management\Hohimer Company Portal - Company\Hohimer Team Shared 4-15-19
   ```

3. UPDATE PROJECT CONFIGURATION (`config.yaml`):  
   ```
   database:
     live: Z:/HohimerPro/database/401k_payments_LIVE.db
     test: Z:/HohimerPro/database/401k_payments_test.db
     backup: Z:/HohimerPro/database/db_backups

   documents:
     dump_folder: Z:/dump
     client_base: Z:/401k Clients
   ```

4. DATABASE SETUP (SIMPLE SQL TABLE FOR CLIENT FOLDERS):  
   ```
   CREATE TABLE client_folders (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       client_name TEXT UNIQUE NOT NULL,
       base_path TEXT NOT NULL,
       current_year INTEGER NOT NULL
   );
   ```

5. PYTHON (FASTAPI) BACKEND LOGIC:  
   - Backend API handles dynamic file naming, linking documents to payments/clients, and creating Windows shortcuts automatically.  
   - Minimal Python backend API endpoints provide paths and file management services to React frontend.

6. REACT FRONTEND:  
   - Makes API calls to backend for file uploads, associations, document retrieval, and display.  
   - Never directly manages SQL or file system paths—backend handles these clearly.

RESULT (FINAL STATE):  
- Consistent, stable, and simple paths for all users (`Z:` drive).  
- No duplication of files; users find documents exactly where expected.  
- Clear backend logic, minimal code overhead, efficient document handling.  
- No usernames, no breakages, effortless maintenance, scalable simplicity.


these new Z: drive mappings can (and absolutely should) point directly to your existing OneDrive folders. You do not need new folders. You're just standardizing the access path.

Simply take the existing OneDrive path:

C:\Users\{username}\Hohimer Wealth Management\Hohimer Company Portal - Company\Hohimer Team Shared 4-15-19

And map it as the root of your new shared drive (Z:). Nothing changes physically—you're only standardizing how everyone accesses it.



use FastAPI exclusively as the backend, and do not mix direct SQL connections with frontend logic. Mixing both direct SQL access and a backend API is generally considered bad practice and creates complexity.

Your ideal setup is:

React Frontend → FastAPI Backend (handles business logic and SQL queries) → SQLite Database

FastAPI is thin and focused, just passing clean data and file paths between frontend and database.

Stick to this approach consistently for simplicity, stability, and ease of maintenance.



