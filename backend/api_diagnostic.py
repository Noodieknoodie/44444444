import requests
import sys
import os
import sqlite3
from pathlib import Path

# Set color codes for terminal output
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def print_error(message):
    print(f"{RED}{BOLD}ERROR: {message}{RESET}")
    
def print_success(message):
    print(f"{GREEN}{BOLD}SUCCESS: {message}{RESET}")
    
def print_warning(message):
    print(f"{YELLOW}{BOLD}WARNING: {message}{RESET}")

def print_header(message):
    print(f"\n{BOLD}{message}{RESET}")
    print("-" * 80)

def check_database():
    print_header("DATABASE CHECK")
    
    try:
        # Import config to get db path
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from config.config import Config
        
        db_path = Config.get_db_path()
        if not os.path.exists(db_path):
            print_error(f"Database file not found at: {db_path}")
            return False
            
        # Try to connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check core tables
        tables_to_check = ['clients', 'providers', 'payments', 'contracts']
        for table in tables_to_check:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print_success(f"Table '{table}' exists with {count} rows")
            
        conn.close()
        return True
        
    except Exception as e:
        print_error(f"Database error: {str(e)}")
        return False

def check_api_endpoint(base_url, endpoint, description):
    url = f"{base_url}{endpoint}"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print_success(f"{url} - {description}: OK (HTTP 200)")
            return True
        else:
            print_error(f"{url} - {description}: Failed with HTTP {response.status_code}")
            print(f"   Response: {response.text[:100]}")
            return False
    except requests.exceptions.ConnectionError:
        print_error(f"{url} - {description}: Connection Error (Is the server running?)")
        return False
    except Exception as e:
        print_error(f"{url} - {description}: {str(e)}")
        return False

def run_diagnostics():
    print(f"{BOLD}401k APPLICATION DIAGNOSTIC TOOL{RESET}")
    print("=" * 80)
    
    # Step 1: Check if backend server is running
    print_header("SERVER STATUS")
    base_url = "http://localhost:8000"
    
    server_running = check_api_endpoint(base_url, "/", "Root endpoint")
    if not server_running:
        print_error("The backend server appears to be offline or unreachable!")
        print("Please make sure the server is running with:")
        print("cd backend && python -m uvicorn main:app --reload")
        return
    
    # Step 2: Check API endpoints
    print_header("API ENDPOINT CHECK")
    endpoints = [
        ("/api/clients", "Clients API"),
        ("/api/providers", "Providers API"),
        ("/api/payments/periods/current", "Current Period API"),
        ("/api/health", "Health Check API")
    ]
    
    failures = 0
    for endpoint, desc in endpoints:
        if not check_api_endpoint(base_url, endpoint, desc):
            failures += 1
    
    # Step 3: Check Database
    db_ok = check_database()
    
    # Step 4: Check Imports and Code
    print_header("CODE STRUCTURE CHECK")
    try:
        import importlib
        
        # Check for circular imports and other issues
        modules_to_check = [
            "routers.clients",
            "routers.providers",
            "routers.payments",
            "routers.documents",
            "services.document_service",
            "database.db_utils"
        ]
        
        for module in modules_to_check:
            try:
                importlib.import_module(module)
                print_success(f"Module '{module}' imports successfully")
            except ImportError as e:
                print_error(f"Module '{module}' has import issues: {str(e)}")
                failures += 1
    except Exception as e:
        print_error(f"Error checking imports: {str(e)}")
        failures += 1
    
    # Summary
    print_header("DIAGNOSTIC SUMMARY")
    if failures > 0:
        print_error(f"Found {failures} issues that need to be fixed!")
        
        if not server_running:
            print("1. The backend server is not running or cannot be reached.")
        
        if not db_ok:
            print("2. There are database connectivity issues.")
            
        # Common issues
        print("\nMOST LIKELY ISSUES:")
        print("1. PYTHONPATH issues - Make sure your PYTHONPATH includes the project root")
        print("   You can set it with: set PYTHONPATH=%CD% (on Windows)")
        print("2. Circular imports in router files")
        print("3. Database connection problems")
        print("4. CORS issues in the frontend-backend communication")
        
    else:
        print_success("All checks passed! If you're still having issues, check:")
        print("1. Frontend configuration (API URLs)")
        print("2. Network firewall settings")
        print("3. Browser console for additional error details")

if __name__ == "__main__":
    run_diagnostics() 