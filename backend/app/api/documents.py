# app/api/documents.py
from fastapi import APIRouter, Query, HTTPException, Body, Path
from typing import Optional

from ..db import get_connection
from ..models.documents import (
    DocumentModel, DocumentCreate, DocumentUpdate, DocumentResponse,
    DocumentClientModel, DocumentClientCreate, DocumentClientResponse,
    DocumentPaymentModel, DocumentPaymentCreate, DocumentPaymentResponse
)

router = APIRouter(prefix="/api")

# ----- DOCUMENTS -----
@router.get("/documents", response_model=DocumentResponse)
async def get_documents(
    document_id: Optional[int] = Query(None),
    provider_id: Optional[int] = Query(None),
    document_type: Optional[str] = Query(None),
    client_id: Optional[int] = Query(None),  # For filtering by linked client
    payment_id: Optional[int] = Query(None),  # For filtering by linked payment
    limit: int = Query(100),
    offset: int = Query(0)
):
    """
    Get documents with filtering options
    Can filter by linked client or payment
    """
    with get_connection() as conn:
        params = []
        
        # Base query
        query = "SELECT DISTINCT d.* FROM documents d"
        
        # Add joins if needed
        if client_id is not None:
            query += " JOIN document_clients dc ON d.document_id = dc.document_id"
            
        if payment_id is not None:
            query += " JOIN document_payments dp ON d.document_id = dp.document_id"
            
        # Start the WHERE clause
        conditions = []
        
        if document_id is not None:
            conditions.append("d.document_id = ?")
            params.append(document_id)
            
        if provider_id is not None:
            conditions.append("d.provider_id = ?")
            params.append(provider_id)
            
        if document_type is not None:
            conditions.append("d.document_type = ?")
            params.append(document_type)
            
        if client_id is not None:
            conditions.append("dc.client_id = ?")
            params.append(client_id)
            
        if payment_id is not None:
            conditions.append("dp.payment_id = ?")
            params.append(payment_id)
            
        # Add the conditions to the query
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination and ordering
        query += " ORDER BY d.uploaded_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        documents = [DocumentModel.model_validate(dict(row)) for row in rows]
        
        return DocumentResponse(items=documents, total=total)

@router.post("/documents", response_model=DocumentModel)
async def create_document(document: DocumentCreate):
    """Create a new document"""
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO documents (
                    provider_id, document_type, received_date, 
                    file_name, file_path, metadata
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    document.provider_id, document.document_type, document.received_date,
                    document.file_name, document.file_path, document.metadata
                )
            )
            conn.commit()
            
            # Get the created document
            document_id = cursor.lastrowid
            cursor = conn.execute("SELECT * FROM documents WHERE document_id = ?", (document_id,))
            row = cursor.fetchone()
            
            return DocumentModel.model_validate(dict(row))
        except Exception as e:
            # Handle constraint violations
            if "FOREIGN KEY constraint failed" in str(e):
                raise HTTPException(status_code=404, detail="Provider not found")
            raise

@router.put("/documents/{document_id}", response_model=DocumentModel)
async def update_document(
    document_id: int = Path(...),
    document: DocumentUpdate = Body(...)
):
    """Update a document"""
    with get_connection() as conn:
        # Check if document exists
        cursor = conn.execute(
            "SELECT * FROM documents WHERE document_id = ?",
            (document_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Build update query dynamically based on provided fields
        updates = []
        params = []
        
        if document.provider_id is not None:
            updates.append("provider_id = ?")
            params.append(document.provider_id)
            
        if document.document_type is not None:
            updates.append("document_type = ?")
            params.append(document.document_type)
            
        if document.received_date is not None:
            updates.append("received_date = ?")
            params.append(document.received_date)
            
        if document.file_name is not None:
            updates.append("file_name = ?")
            params.append(document.file_name)
            
        if document.file_path is not None:
            updates.append("file_path = ?")
            params.append(document.file_path)
            
        if document.metadata is not None:
            updates.append("metadata = ?")
            params.append(document.metadata)
            
        if not updates:
            # No updates provided
            return DocumentModel.model_validate(dict(existing))
            
        update_str = ", ".join(updates)
        params.append(document_id)
        
        # Update document
        cursor = conn.execute(
            f"UPDATE documents SET {update_str} WHERE document_id = ?",
            params
        )
        conn.commit()
        
        # Get updated document
        cursor = conn.execute("SELECT * FROM documents WHERE document_id = ?", (document_id,))
        row = cursor.fetchone()
        
        return DocumentModel.model_validate(dict(row))

@router.delete("/documents/{document_id}")
async def delete_document(document_id: int = Path(...)):
    """Delete a document (hard delete)"""
    with get_connection() as conn:
        # Check if document exists
        cursor = conn.execute(
            "SELECT * FROM documents WHERE document_id = ?",
            (document_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete document (will cascade to junction tables)
        cursor = conn.execute(
            "DELETE FROM documents WHERE document_id = ?",
            (document_id,)
        )
        conn.commit()
        
        return {"detail": "Document deleted successfully"}

# ----- DOCUMENT_CLIENTS (Junction table) -----
@router.get("/document-clients", response_model=DocumentClientResponse)
async def get_document_clients(
    document_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get document-client associations"""
    with get_connection() as conn:
        query = "SELECT * FROM document_clients"
        conditions = []
        params = []
        
        if document_id is not None:
            conditions.append("document_id = ?")
            params.append(document_id)
            
        if client_id is not None:
            conditions.append("client_id = ?")
            params.append(client_id)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY id LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        links = [DocumentClientModel.model_validate(dict(row)) for row in rows]
        
        return DocumentClientResponse(items=links, total=total)

@router.post("/document-clients", response_model=DocumentClientModel)
async def create_document_client(link: DocumentClientCreate):
    """Link a document to a client"""
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                "INSERT INTO document_clients (document_id, client_id) VALUES (?, ?)",
                (link.document_id, link.client_id)
            )
            conn.commit()
            
            # Get the created link
            link_id = cursor.lastrowid
            cursor = conn.execute("SELECT * FROM document_clients WHERE id = ?", (link_id,))
            row = cursor.fetchone()
            
            return DocumentClientModel.model_validate(dict(row))
        except Exception as e:
            # Handle constraint violations
            if "UNIQUE constraint failed" in str(e):
                raise HTTPException(status_code=409, detail="This document is already linked to this client")
            if "FOREIGN KEY constraint failed" in str(e):
                raise HTTPException(status_code=404, detail="Document or client not found")
            raise

@router.delete("/document-clients/{id}")
async def delete_document_client(id: int = Path(...)):
    """Remove a document-client link"""
    with get_connection() as conn:
        # Check if link exists
        cursor = conn.execute(
            "SELECT * FROM document_clients WHERE id = ?",
            (id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Document-client link not found")
        
        # Delete link
        cursor = conn.execute(
            "DELETE FROM document_clients WHERE id = ?",
            (id,)
        )
        conn.commit()
        
        return {"detail": "Document-client link removed"}

# ----- DOCUMENT_PAYMENTS (Junction table) -----
@router.get("/document-payments", response_model=DocumentPaymentResponse)
async def get_document_payments(
    document_id: Optional[int] = Query(None),
    payment_id: Optional[int] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get document-payment associations"""
    with get_connection() as conn:
        query = "SELECT * FROM document_payments"
        conditions = []
        params = []
        
        if document_id is not None:
            conditions.append("document_id = ?")
            params.append(document_id)
            
        if payment_id is not None:
            conditions.append("payment_id = ?")
            params.append(payment_id)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY id LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        links = [DocumentPaymentModel.model_validate(dict(row)) for row in rows]
        
        return DocumentPaymentResponse(items=links, total=total)

@router.post("/document-payments", response_model=DocumentPaymentModel)
async def create_document_payment(link: DocumentPaymentCreate):
    """Link a document to a payment"""
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                "INSERT INTO document_payments (document_id, payment_id) VALUES (?, ?)",
                (link.document_id, link.payment_id)
            )
            conn.commit()
            
            # Get the created link
            link_id = cursor.lastrowid
            cursor = conn.execute("SELECT * FROM document_payments WHERE id = ?", (link_id,))
            row = cursor.fetchone()
            
            return DocumentPaymentModel.model_validate(dict(row))
        except Exception as e:
            # Handle constraint violations
            if "UNIQUE constraint failed" in str(e):
                raise HTTPException(status_code=409, detail="This document is already linked to this payment")
            if "FOREIGN KEY constraint failed" in str(e):
                raise HTTPException(status_code=404, detail="Document or payment not found")
            raise

@router.delete("/document-payments/{id}")
async def delete_document_payment(id: int = Path(...)):
    """Remove a document-payment link"""
    with get_connection() as conn:
        # Check if link exists
        cursor = conn.execute(
            "SELECT * FROM document_payments WHERE id = ?",
            (id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Document-payment link not found")
        
        # Delete link
        cursor = conn.execute(
            "DELETE FROM document_payments WHERE id = ?",
            (id,)
        )
        conn.commit()
        
        return {"detail": "Document-payment link removed"}