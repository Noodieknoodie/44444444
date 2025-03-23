import os
import sqlite3
from pathlib import Path
from config.config import Config
from backend.services.document_service import DocumentService

def test_document_upload():
    """Test the document upload process with a test PDF"""
    # Connect to database
    db_path = Config.get_db_path()
    conn = sqlite3.connect(db_path)
    
    # Get test document path
    test_file_path = os.path.join("test_assets", "fidelity_check.pdf")
    if not os.path.exists(test_file_path):
        print(f"Error: Test file {test_file_path} not found!")
        return
    
    # Get provider ID for Fidelity
    cursor = conn.cursor()
    cursor.execute("SELECT provider_id FROM providers WHERE provider_name = 'Fidelity'")
    provider_id = cursor.fetchone()[0]
    
    # Get client ID for ABC Company
    cursor.execute("SELECT client_id FROM clients WHERE display_name = 'ABC Company'")
    client_id = cursor.fetchone()[0]
    
    # Upload document
    document_id = DocumentService.save_document(
        file_path=test_file_path,
        provider_id=provider_id,
        client_ids=[client_id],
        document_type="Check",
        received_date="2025-02-20",
        db_connection=conn
    )
    
    print(f"Document uploaded successfully with ID: {document_id}")
    
    # Verify database entries
    cursor.execute("SELECT * FROM documents WHERE document_id = ?", (document_id,))
    document = cursor.fetchone()
    print(f"Document entry: {document}")
    
    cursor.execute("SELECT * FROM document_clients WHERE document_id = ?", (document_id,))
    doc_clients = cursor.fetchall()
    print(f"Document-client associations: {doc_clients}")
    
    cursor.execute("SELECT * FROM payment_documents WHERE document_id = ?", (document_id,))
    doc_payments = cursor.fetchall()
    print(f"Document-payment associations: {doc_payments}")
    
    conn.close()
    print("Test completed successfully!")

if __name__ == "__main__":
    test_document_upload()