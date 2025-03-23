import os
import shutil
from datetime import datetime
from pathlib import Path
import sys
import PyPDF2
import win32com.client

# Add project root to path to import config
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config.config import Config

class DocumentService:
    @staticmethod
    def save_document(file_path, provider_id, client_ids, document_type, received_date, db_connection):
        """Save document and create database entries and shortcuts"""
        # Get provider name
        cursor = db_connection.cursor()
        cursor.execute("SELECT provider_name FROM providers WHERE provider_id = ?", (provider_id,))
        provider_name = cursor.fetchone()[0]
        
        # Get client names
        client_list = []
        for client_id in client_ids:
            cursor.execute("SELECT display_name FROM clients WHERE client_id = ?", (client_id,))
            client_list.append(cursor.fetchone()[0])
        
        # Format the date as month.day.year
        date_formatted = datetime.strptime(received_date, "%Y-%m-%d").strftime("%m.%d.%y")
        
        # Join client names with commas
        client_names_string = ", ".join(client_list)
        
        # Create standardized filename
        filename = f"{provider_name} - 401k Advisor Fee - {client_names_string} - {date_formatted}.pdf"
        
        # Copy file to document storage
        storage_path = Config.get_document_storage_path()
        os.makedirs(storage_path, exist_ok=True)
        dest_path = os.path.join(storage_path, filename)
        
        # Copy the file
        shutil.copy2(file_path, dest_path)
        
        # Add to database
        cursor.execute(
            "INSERT INTO documents (provider_id, document_type, received_date, file_name, file_path) "
            "VALUES (?, ?, ?, ?, ?)",
            (provider_id, document_type, received_date, filename, dest_path)
        )
        document_id = cursor.lastrowid
        
        # Link to clients
        for client_id in client_ids:
            cursor.execute(
                "INSERT INTO document_clients (document_id, client_id) VALUES (?, ?)",
                (document_id, client_id)
            )
        
        # Embed metadata
        DocumentService.embed_metadata(dest_path, document_id, provider_name, client_ids, document_type, received_date, db_connection)
        
        # Create shortcuts
        DocumentService.create_client_shortcuts(document_id, db_connection)
        
        # Match to payments
        DocumentService.match_document_to_payments(document_id, db_connection)
        
        db_connection.commit()
        return document_id
    
    @staticmethod
    def embed_metadata(file_path, document_id, provider_name, client_ids, document_type, received_date, db_connection):
        """Embed metadata in PDF file"""
        # Get client names
        cursor = db_connection.cursor()
        placeholders = ','.join(['?'] * len(client_ids))
        cursor.execute(f"SELECT display_name FROM clients WHERE client_id IN ({placeholders})", client_ids)
        client_names = [row[0] for row in cursor.fetchall()]
        
        # Open PDF
        reader = PyPDF2.PdfReader(file_path)
        writer = PyPDF2.PdfWriter()
        
        # Copy pages
        for page in reader.pages:
            writer.add_page(page)
        
        # Add metadata
        writer.add_metadata({
            "/DocumentID": str(document_id),
            "/Provider": provider_name,
            "/Clients": ", ".join(client_names),
            "/DocumentType": document_type,
            "/ReceivedDate": received_date,
            "/ManagedBy": "401k Document System"
        })
        
        # Save with metadata
        with open(file_path, "wb") as f:
            writer.write(f)
    
    @staticmethod
    def create_client_shortcuts(document_id, db_connection):
        """Create shortcuts in client folders"""
        cursor = db_connection.cursor()
        
        # Get document info
        cursor.execute("SELECT file_path, file_name, received_date FROM documents WHERE document_id = ?", (document_id,))
        file_path, file_name, received_date = cursor.fetchone()
        
        # Get associated clients
        cursor.execute(
            "SELECT dc.client_id, cf.actual_folder_name "
            "FROM document_clients dc "
            "JOIN client_folders cf ON dc.client_id = cf.client_id "
            "WHERE dc.document_id = ?", 
            (document_id,)
        )
        client_folders = cursor.fetchall()
        
        # Extract year from received date
        year = received_date.split('-')[0]
        
        # Create shortcuts for each client
        for client_id, folder_name in client_folders:
            # Get client's folder
            client_base = os.path.join(Config.get_clients_root(), folder_name)
            
            # Check for consulting fee folder or alternatives
            for subfolder in ["Consulting Fee", "Checks", "401k Fees", "Consulting Fees"]:
                target_dir = os.path.join(client_base, subfolder)
                if os.path.exists(target_dir):
                    # Create year folder if needed
                    year_dir = os.path.join(target_dir, year)
                    os.makedirs(year_dir, exist_ok=True)
                    
                    # Create shortcut
                    shortcut_path = os.path.join(year_dir, file_name + ".lnk")
                    
                    # Create actual Windows shortcut
                    shell = win32com.client.Dispatch("WScript.Shell")
                    shortcut = shell.CreateShortCut(shortcut_path)
                    shortcut.Targetpath = file_path
                    shortcut.save()
                    
                    break