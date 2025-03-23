# Database & File System Documentation

## Database Setup: LIVE vs Development

### Production Database
```
Location: [Shared OneDrive]/HohimerPro/database/401k_payments_LIVE.db
Purpose: The single source of truth everyone works with
Access: All users connect to this database during normal operations
```
for development the db is stored in the project directory
### Development Database
```
Location: (project directory)/backend/database/401k_local_dev.db
Purpose: Safe environment for testing changes
Access: Only I'll use this for building the app since i am not using the shared database at home...
```
ideally, it should be possible to use the development database for development and the production database for production...


heres my FULL local path in case we want to hardcode it for development since i will ONLY be using the development database at home and im the only developer...
C:\CODING\401401401\backend\database\401k_local_dev.db



we should probably have a config file in the project directory, right? to direct this stuff? 

This separation ensures development work never disrupts business operations.

## Automatic Backup System

The application should create automatic backups:

```python
# Simplified backup logic for documentation
def create_backup():
    """Create timestamped backup of database when app launches"""
    timestamp = datetime.now().strftime("%m-%d-%Y_%I-%M_%p")
    username = os.getenv("USERNAME")
    
    backup_path = f"{SHARED_BASE}/HohimerPro/database/db_backups/"
    backup_name = f"401k_payments_{username}_{timestamp}.db"
    
    # Create backup directory if needed
    os.makedirs(backup_path, exist_ok=True)
    
    # Copy current database to backup location
    shutil.copy(
        f"{SHARED_BASE}/HohimerPro/database/401k_payments_LIVE.db",
        f"{backup_path}/{backup_name}"
    )
    
    # Clean up old backups (keep last 20)
    cleanup_old_backups(backup_path, 20)
```

The app should trigger this backup:
1. When the application launches
2. Before making significant database changes (schema updates, etc.)

## Application Code Location

**Recommendation: Local Installation with Shared Database**

```
Application Code: Installed locally on each user's computer
Database: Accessed from shared OneDrive location
Document Storage: Centralized in shared OneDrive
```

Why this approach:
1. Better performance (application isn't dependent on OneDrive sync speed)
2. More reliable (works even during brief OneDrive sync issues)
3. Proper separation of application and data

## File System Structure

```
[Shared OneDrive]/
├── 401k Clients/                      # Client folders (existing)
│   ├── ABC Company/
│   │   ├── Consulting Fee/2025/       # Contains shortcuts to documents
│   ├── XYZ Inc/
│   │   ├── Checks/2025/               # Alternate folder structure
│   └── ...
├── HohimerPro/                        # Application data
│   ├── database/
│   │   ├── 401k_payments_LIVE.db      # Production database
│   │   └── db_backups/                # Database backups
│   └── config/                        # App configuration
└── compliance/mail/2025/              # Central document storage
```

## Update Distribution

For application updates:
1. Developer tests changes with development database
2. After validation, builds new application version
3. Distributes installer to team (via email or shared folder)
4. Users install update locally when convenient

This approach gives the reliability of local installation with the consistency of a shared database and document storage.

## Connecting to the Database

The application uses the path-finding logic discussed earlier to locate the database regardless of which computer it's running on:

```python
def get_database_path():
    """Find the production database from any computer"""
    shared_base = find_shared_folder()
    return f"{shared_base}/HohimerPro/database/401k_payments_LIVE.db"
```

This gives you a system that's:
1. Reliable (local app performance + database backups)
2. Consistent (everyone sees the same data)
3. Low-maintenance (updates are simple, no server needed)

Perfect for a small 5-user team working with OneDrive shared folders!



# The "One Document to Rule Them All" System

## A Complete Guide to Hohimer's Document Management Solution

## The Challenge: 401k Document Chaos

Welcome to the exciting world of 401k consulting documents! Every month, providers send checks and statements that need to be:
1. Stored somewhere accessible
2. Linked to the right clients
3. Associated with payments in your database
4. Accessible from client folders where users expect to find them

Your current environment adds some spice to this challenge:
- Everyone accesses the same SharePoint/OneDrive folders
- But each user has a different local path: `C:/Users/[username]/Hohimer Wealth Management/...`
- Client folders exist at `[Shared Folder]/401k Clients/[client name]/` 
- Client folder names might not exactly match database client names
- Client folder structures vary (some have "Consulting Fee", others "Checks", etc.)

## The Solution: Store Once, Reference Everywhere

Our system creates a elegant document flow:

1. **Central Storage**: All documents go to a single location (`compliance/mail/2025/`)
2. **Database Tracking**: Documents and their relationships stored in SQLite
3. **Client Access**: Shortcuts created in client folders pointing to original file
4. **Payment Linking**: Documents automatically matched to relevant payments

This approach eliminates duplication while maintaining the familiar folder structure users expect.

## Database Structure: Tracking All The Things

Add these tables to your existing database (`401k_payments_LIVE.db`):

```sql
-- Core document information
CREATE TABLE documents (
    document_id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    document_type TEXT NOT NULL,
    received_date TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(provider_id)
);

-- Many-to-many: documents to clients
CREATE TABLE document_clients (...);

-- Many-to-many: documents to payments
CREATE TABLE payment_documents (...);

-- Maps client IDs to their actual folder names
CREATE TABLE client_folders (
    client_id INTEGER PRIMARY KEY,
    actual_folder_name TEXT NOT NULL
);
```

## User Workflow: Simple But Powerful

The upload process is straightforward:

1. User opens "Upload Document" form and provides:
   - Document Type (dropdown: Check, Receipt, Invoice, Other)
   - Provider (dropdown from providers table)
   - Clients (multi-select dropdown filtered by provider)
   - Received Date (date picker)
   - PDF file upload

2. Behind the scenes, the system:
   - Saves file to the central location with standardized name
   - Creates database entries linking document to clients
   - Creates shortcuts in appropriate client folders
   - Matches document to payments based on received date
   - Embeds document ID in PDF metadata for future reference

3. Users continue working with familiar folder structure:
   - `[Shared Folder]/401k Clients/[Client]/Consulting Fee/2025/[Document].pdf`
   - But these are actually shortcuts to the single original file

## Path Finding Magic: Works Anywhere

The genius of this system is how it handles paths. Since each user has the shared folders in a different location (because of their username), we use a simple path finder:

```python
def find_shared_folder():
    """Find the synced OneDrive folder on any computer"""
    user_profile = os.path.expanduser("~")
    shared_path = Path(user_profile) / "Hohimer Wealth Management" / 
                  "Hohimer Company Portal - Company" / "Hohimer Team Shared 4-15-19"
    
    if shared_path.exists():
        return str(shared_path)
    else:
        raise Exception("Shared folder not found. Is OneDrive synced?")
```

This means the application works seamlessly for anyone with the synced folders, without configuration.

## Client Folder Reality: Flexibility Built In

Your client folders don't perfectly match your database names, and that's okay! We map them once:

```python
# Simplified concept - the actual implementation uses fuzzy matching
client_id = 123  # "ABC Company" in database
actual_folder = "ABC Co Inc"  # Actual folder name
db.execute("INSERT INTO client_folders VALUES (?, ?)", (client_id, actual_folder))
```

Then when creating shortcuts, we check for various folder structures:
- `[Client]/Consulting Fee/2025/`
- `[Client]/Checks/2025/`
- `[Client]/401k Fees/2025/`

The system adapts to whatever structure exists for each client.

## Payment Matching: Automatically Link Documents and Money

The clever part: When a document is uploaded, the system automatically matches it to payment records by:

1. Determining the billing period from the received date
   - Monthly: Previous month
   - Quarterly: Previous quarter

2. Using your existing database views (`v_expanded_payment_periods`) to find payments for:
   - The same client
   - The calculated billing period

3. Creating `payment_documents` records linking them together

This means when viewing payments in your application, you can easily show "View Attachment" buttons for payments with linked documents.

## UI Integration: View PDFs Seamlessly

In your React frontend, when displaying payments:
1. Check if payment has linked documents
2. Show "View Attachment" button if documents exist
3. Open embedded PDF viewer when clicked

## Implementation Notes

1. **One-time setup**: Map client database names to actual folder names
2. **PDF metadata**: Include document ID for future reference
3. **Automatic path finding**: Works on any computer with synced folders
4. **No new folders required**: Uses existing structure, just creates year subfolders
5. **No user training needed**: Everything works behind the scenes

## Benefits (The Why)

1. **Eliminates duplication**: One copy of each document saves space
2. **Maintains familiarity**: Users still find documents where they expect
3. **Automatic organization**: Documents properly categorized and linked
4. **Better searchability**: Central database tracking makes finding documents easy
5. **Reliable payment matching**: Documents automatically linked to financial records

The result? A document management system that feels magical to users but is built on solid, practical foundations.



# Why This Document Management Approach Makes Sense

I settled on this approach after considering several alternatives because it strikes the perfect balance between theoretical database purity and real-world practicality. Here's my thinking:

## The Central Storage + Shortcuts Approach

I chose this over alternatives because:

1. **File duplication is a nightmare waiting to happen**. When you have multiple copies of the same document, inevitably someone updates one copy but not the others. Then nobody knows which is authoritative.

2. **Windows shortcuts are lightweight** (just a few KB) but provide the illusion that files exist where users expect them. This gives you the best of both worlds - central management with distributed access.

3. **The existing folder structure clearly matters to your team**. People have workflows built around those client folders. Forcing everyone to use a new system would create unnecessary friction.

## The Path-Finding Logic

After considering drive mappings, UNC paths, and hardcoded paths, I settled on the automatic path detection because:

1. **It just works for everyone**. No tech setup required. The code navigates to the shared folder regardless of who's running it or which computer they're using.

2. **OneDrive sync already solves the hard problems**. Microsoft has spent millions perfecting file synchronization - we're just leveraging their solution.

3. **It's future-proof**. If your company ever migrates to a different folder structure, you only need to update one piece of code, not reconfigure every computer.

## The Database Design

The three-table approach (documents, document_clients, payment_documents) follows proper normalization principles while remaining practical:

1. **Many-to-many relationships are properly modeled**. One document can belong to multiple clients, and each client can have many documents.

2. **It integrates beautifully with your existing database**. Your views like `v_expanded_payment_periods` are sophisticated and demonstrate deep thought about period calculations. This design leverages that work rather than duplicating it.

3. **Fuzzy matching client folders to database names** acknowledges the reality that real-world systems are messy. Perfect is the enemy of good.

## The PDF Metadata Inclusion

Adding metadata to PDFs serves as an insurance policy:

1. **It creates self-identifying documents**. If a file somehow gets moved outside your system, the metadata ensures you can still identify what it is and who it belongs to.

2. **It's a standard practice in professional document management** for exactly this reason - data redundancy in the right places increases reliability.

In the end, I chose this approach because it works with your existing environment rather than trying to impose an idealized system that ignores reality. It's elegant not because it's complex, but because it solves real problems with minimal overhead.