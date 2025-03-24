from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
import sqlite3
import tempfile
import os
from datetime import datetime
from pathlib import Path
from main import get_db_dependency

from services.document_service import DocumentService
from config.config import Config

router = APIRouter()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    provider_id: int = Form(...),
    client_ids: str = Form(...),  # Comma-separated client IDs
    document_type: str = Form(...),
    received_date: str = Form(...),
    db: sqlite3.Connection = Depends(get_db_dependency)
):
    """
    Upload a document and associate it with clients.
    For development only - production implementation requires office setup.
    """
    
    # Parse client IDs from comma-separated string
    client_id_list = [int(cid.strip()) for cid in client_ids.split(",") if cid.strip()]
    
    # Save to temporary file first
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(await file.read())
        temp_path = temp_file.name
    
    try:
        # Use DocumentService to handle the document
        document_id = DocumentService.save_document(
            file_path=temp_path,
            provider_id=provider_id,
            client_ids=client_id_list,
            document_type=document_type,
            received_date=received_date,
            db_connection=db
        )
        
        # Get the document details to return
        cursor = db.cursor()
        cursor.execute("""
            SELECT d.*, p.provider_name
            FROM documents d
            JOIN providers p ON d.provider_id = p.provider_id
            WHERE d.document_id = ?
        """, (document_id,))
        document = dict(cursor.fetchone())
        
        # Get associated clients
        cursor.execute("""
            SELECT c.client_id, c.display_name
            FROM document_clients dc
            JOIN clients c ON dc.client_id = c.client_id
            WHERE dc.document_id = ?
        """, (document_id,))
        clients = [dict(row) for row in cursor.fetchall()]
        
        document["clients"] = clients
        
        return document
    
    finally:
        # Clean up the temp file
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@router.get("/by-payment/{payment_id}")
def get_documents_by_payment(payment_id: int, db: sqlite3.Connection = Depends(get_db_dependency)):
    """Get documents associated with a payment"""
    cursor = db.cursor()
    
    cursor.execute("""
        SELECT 
            d.*,
            p.provider_name,
            pd.payment_id
        FROM payment_documents pd
        JOIN documents d ON pd.document_id = d.document_id
        JOIN providers p ON d.provider_id = p.provider_id
        WHERE pd.payment_id = ?
    """, (payment_id,))
    
    documents = [dict(row) for row in cursor.fetchall()]
    
    return documents

@router.get("/by-client/{client_id}")
def get_documents_by_client(client_id: int, db: sqlite3.Connection = Depends(get_db_dependency)):
    """Get documents associated with a client"""
    cursor = db.cursor()
    
    cursor.execute("""
        SELECT 
            d.*,
            p.provider_name
        FROM document_clients dc
        JOIN documents d ON dc.document_id = d.document_id
        JOIN providers p ON d.provider_id = p.provider_id
        WHERE dc.client_id = ?
        ORDER BY d.received_date DESC
    """, (client_id,))
    
    documents = [dict(row) for row in cursor.fetchall()]
    
    return documents