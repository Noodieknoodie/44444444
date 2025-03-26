# app/api/clients.py
from fastapi import APIRouter, Query, HTTPException, Body, Path
from typing import Optional
from datetime import datetime

from ..db import get_connection
from ..models.clients import (
    ClientModel, ClientCreate, ClientUpdate, ClientResponse,
    ClientFolderModel, ClientFolderCreate, ClientFolderUpdate, ClientFolderResponse,
    ClientProviderModel, ClientProviderCreate, ClientProviderUpdate, ClientProviderResponse,
    ContactModel, ContactCreate, ContactUpdate, ContactResponse,
    ClientFirstPaymentViewModel, ClientFirstPaymentResponse,
    ClientLastPaymentViewModel, ClientLastPaymentResponse
)

router = APIRouter(prefix="/api")

# ----- CLIENTS -----
@router.get("/clients", response_model=ClientResponse)
async def get_clients(
    client_id: Optional[int] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get all active clients"""
    with get_connection() as conn:
        query = "SELECT * FROM clients WHERE valid_to IS NULL"
        params = []
        
        if client_id is not None:
            query += " AND client_id = ?"
            params.append(client_id)
            
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        query += " ORDER BY display_name LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        clients = [ClientModel.model_validate(dict(row)) for row in rows]
        
        return ClientResponse(items=clients, total=total)

@router.post("/clients", response_model=ClientModel)
async def create_client(client: ClientCreate):
    """Create a new client"""
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO clients (display_name, full_name, ima_signed_date)
            VALUES (?, ?, ?)
            """,
            (client.display_name, client.full_name, client.ima_signed_date)
        )
        conn.commit()
        
        # Get the created client
        client_id = cursor.lastrowid
        cursor = conn.execute("SELECT * FROM clients WHERE client_id = ?", (client_id,))
        row = cursor.fetchone()
        
        return ClientModel.model_validate(dict(row))

@router.put("/clients/{client_id}", response_model=ClientModel)
async def update_client(
    client_id: int = Path(...),
    client: ClientUpdate = Body(...)
):
    """Update a client"""
    with get_connection() as conn:
        # Check if client exists
        cursor = conn.execute(
            "SELECT * FROM clients WHERE client_id = ? AND valid_to IS NULL",
            (client_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Build update query dynamically based on provided fields
        updates = []
        params = []
        
        if client.display_name is not None:
            updates.append("display_name = ?")
            params.append(client.display_name)
            
        if client.full_name is not None:
            updates.append("full_name = ?")
            params.append(client.full_name)
            
        if client.ima_signed_date is not None:
            updates.append("ima_signed_date = ?")
            params.append(client.ima_signed_date)
            
        if not updates:
            # No updates provided
            cursor = conn.execute("SELECT * FROM clients WHERE client_id = ?", (client_id,))
            row = cursor.fetchone()
            return ClientModel.model_validate(dict(row))
            
        update_str = ", ".join(updates)
        params.append(client_id)
        
        # Update client
        cursor = conn.execute(
            f"UPDATE clients SET {update_str} WHERE client_id = ?",
            params
        )
        conn.commit()
        
        # Get updated client
        cursor = conn.execute("SELECT * FROM clients WHERE client_id = ?", (client_id,))
        row = cursor.fetchone()
        
        return ClientModel.model_validate(dict(row))

@router.delete("/clients/{client_id}", response_model=ClientModel)
async def delete_client(client_id: int = Path(...)):
    """Soft delete a client by setting valid_to"""
    with get_connection() as conn:
        # Check if client exists
        cursor = conn.execute(
            "SELECT * FROM clients WHERE client_id = ? AND valid_to IS NULL",
            (client_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Soft delete by setting valid_to
        now = datetime.now().isoformat()
        cursor = conn.execute(
            "UPDATE clients SET valid_to = ? WHERE client_id = ?",
            (now, client_id)
        )
        conn.commit()
        
        # Get updated client
        cursor = conn.execute("SELECT * FROM clients WHERE client_id = ?", (client_id,))
        row = cursor.fetchone()
        
        return ClientModel.model_validate(dict(row))

# ----- CLIENT FOLDERS -----
@router.get("/client-folders", response_model=ClientFolderResponse)
async def get_client_folders(
    client_id: Optional[int] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get client folders"""
    with get_connection() as conn:
        query = "SELECT * FROM client_folders"
        params = []
        
        if client_id is not None:
            query += " WHERE client_id = ?"
            params.append(client_id)
            
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        query += " ORDER BY client_id LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        folders = [ClientFolderModel.model_validate(dict(row)) for row in rows]
        
        return ClientFolderResponse(items=folders, total=total)

@router.post("/client-folders", response_model=ClientFolderModel)
async def create_client_folder(folder: ClientFolderCreate):
    """Create a client folder"""
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO client_folders (client_id, actual_folder_name)
                VALUES (?, ?)
                """,
                (folder.client_id, folder.actual_folder_name)
            )
            conn.commit()
            
            # Get the created folder
            cursor = conn.execute(
                "SELECT * FROM client_folders WHERE client_id = ?", 
                (folder.client_id,)
            )
            row = cursor.fetchone()
            
            return ClientFolderModel.model_validate(dict(row))
        except Exception as e:
            # Handle constraint violations
            if "UNIQUE constraint failed" in str(e):
                raise HTTPException(status_code=409, detail="Folder already exists for this client")
            if "FOREIGN KEY constraint failed" in str(e):
                raise HTTPException(status_code=404, detail="Client not found")
            raise

@router.put("/client-folders/{client_id}", response_model=ClientFolderModel)
async def update_client_folder(
    client_id: int = Path(...),
    folder: ClientFolderUpdate = Body(...)
):
    """Update a client folder"""
    with get_connection() as conn:
        # Check if folder exists
        cursor = conn.execute(
            "SELECT * FROM client_folders WHERE client_id = ?",
            (client_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Client folder not found")
        
        # Update folder
        cursor = conn.execute(
            "UPDATE client_folders SET actual_folder_name = ? WHERE client_id = ?",
            (folder.actual_folder_name, client_id)
        )
        conn.commit()
        
        # Get updated folder
        cursor = conn.execute(
            "SELECT * FROM client_folders WHERE client_id = ?",
            (client_id,)
        )
        row = cursor.fetchone()
        
        return ClientFolderModel.model_validate(dict(row))

@router.delete("/client-folders/{client_id}")
async def delete_client_folder(client_id: int = Path(...)):
    """Delete a client folder"""
    with get_connection() as conn:
        # Check if folder exists
        cursor = conn.execute(
            "SELECT * FROM client_folders WHERE client_id = ?",
            (client_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Client folder not found")
        
        # Delete folder
        cursor = conn.execute(
            "DELETE FROM client_folders WHERE client_id = ?",
            (client_id,)
        )
        conn.commit()
        
        return {"detail": "Client folder deleted"}

# ----- CLIENT PROVIDERS -----
@router.get("/client-providers", response_model=ClientProviderResponse)
async def get_client_providers(
    client_id: Optional[int] = Query(None),
    provider_id: Optional[int] = Query(None),
    is_active: Optional[int] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get client providers with filtering options"""
    with get_connection() as conn:
        query = "SELECT * FROM client_providers"
        conditions = []
        params = []
        
        if client_id is not None:
            conditions.append("client_id = ?")
            params.append(client_id)
            
        if provider_id is not None:
            conditions.append("provider_id = ?")
            params.append(provider_id)
            
        if is_active is not None:
            conditions.append("is_active = ?")
            params.append(is_active)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        query += " ORDER BY client_id, provider_id LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        providers = [ClientProviderModel.model_validate(dict(row)) for row in rows]
        
        return ClientProviderResponse(items=providers, total=total)

@router.post("/client-providers", response_model=ClientProviderModel)
async def create_client_provider(provider: ClientProviderCreate):
    """Create a client-provider relationship"""
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO client_providers (client_id, provider_id, start_date, end_date, is_active)
                VALUES (?, ?, ?, ?, ?)
                """,
                (provider.client_id, provider.provider_id, provider.start_date, 
                 provider.end_date, provider.is_active)
            )
            conn.commit()
            
            # Get the created relationship
            cursor = conn.execute(
                "SELECT * FROM client_providers WHERE client_id = ? AND provider_id = ?", 
                (provider.client_id, provider.provider_id)
            )
            row = cursor.fetchone()
            
            return ClientProviderModel.model_validate(dict(row))
        except Exception as e:
            # Handle constraint violations
            if "UNIQUE constraint failed" in str(e):
                raise HTTPException(status_code=409, detail="This client-provider relationship already exists")
            if "FOREIGN KEY constraint failed" in str(e):
                raise HTTPException(status_code=404, detail="Client or provider not found")
            raise

@router.put("/client-providers/{client_id}/{provider_id}", response_model=ClientProviderModel)
async def update_client_provider(
    client_id: int = Path(...),
    provider_id: int = Path(...),
    provider: ClientProviderUpdate = Body(...)
):
    """Update a client-provider relationship"""
    with get_connection() as conn:
        # Check if relationship exists
        cursor = conn.execute(
            "SELECT * FROM client_providers WHERE client_id = ? AND provider_id = ?",
            (client_id, provider_id)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Client-provider relationship not found")
        
        # Build update query dynamically based on provided fields
        updates = []
        params = []
        
        if provider.start_date is not None:
            updates.append("start_date = ?")
            params.append(provider.start_date)
            
        if provider.end_date is not None:
            updates.append("end_date = ?")
            params.append(provider.end_date)
            
        if provider.is_active is not None:
            updates.append("is_active = ?")
            params.append(provider.is_active)
            
        if not updates:
            # No updates provided
            return ClientProviderModel.model_validate(dict(existing))
            
        update_str = ", ".join(updates)
        params.extend([client_id, provider_id])
        
        # Update relationship
        cursor = conn.execute(
            f"UPDATE client_providers SET {update_str} WHERE client_id = ? AND provider_id = ?",
            params
        )
        conn.commit()
        
        # Get updated relationship
        cursor = conn.execute(
            "SELECT * FROM client_providers WHERE client_id = ? AND provider_id = ?",
            (client_id, provider_id)
        )
        row = cursor.fetchone()
        
        return ClientProviderModel.model_validate(dict(row))

@router.delete("/client-providers/{client_id}/{provider_id}")
async def delete_client_provider(
    client_id: int = Path(...),
    provider_id: int = Path(...)
):
    """Delete a client-provider relationship"""
    with get_connection() as conn:
        # Check if relationship exists
        cursor = conn.execute(
            "SELECT * FROM client_providers WHERE client_id = ? AND provider_id = ?",
            (client_id, provider_id)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Client-provider relationship not found")
        
        # Delete relationship
        cursor = conn.execute(
            "DELETE FROM client_providers WHERE client_id = ? AND provider_id = ?",
            (client_id, provider_id)
        )
        conn.commit()
        
        return {"detail": "Client-provider relationship deleted"}

# ----- CONTACTS -----
@router.get("/contacts", response_model=ContactResponse)
async def get_contacts(
    contact_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    contact_type: Optional[str] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get contacts with filtering options"""
    with get_connection() as conn:
        query = "SELECT * FROM contacts WHERE valid_to IS NULL"
        params = []
        
        if contact_id is not None:
            query += " AND contact_id = ?"
            params.append(contact_id)
            
        if client_id is not None:
            query += " AND client_id = ?"
            params.append(client_id)
            
        if contact_type is not None:
            query += " AND contact_type = ?"
            params.append(contact_type)
            
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        query += " ORDER BY client_id, contact_type LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        contacts = [ContactModel.model_validate(dict(row)) for row in rows]
        
        return ContactResponse(items=contacts, total=total)

@router.post("/contacts", response_model=ContactModel)
async def create_contact(contact: ContactCreate):
    """Create a new contact"""
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO contacts (
                    client_id, contact_type, contact_name, phone, email, 
                    fax, physical_address, mailing_address
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    contact.client_id, contact.contact_type, contact.contact_name,
                    contact.phone, contact.email, contact.fax,
                    contact.physical_address, contact.mailing_address
                )
            )
            conn.commit()
            
            # Get the created contact
            contact_id = cursor.lastrowid
            cursor = conn.execute("SELECT * FROM contacts WHERE contact_id = ?", (contact_id,))
            row = cursor.fetchone()
            
            return ContactModel.model_validate(dict(row))
        except Exception as e:
            # Handle constraint violations
            if "FOREIGN KEY constraint failed" in str(e):
                raise HTTPException(status_code=404, detail="Client not found")
            raise

@router.put("/contacts/{contact_id}", response_model=ContactModel)
async def update_contact(
    contact_id: int = Path(...),
    contact: ContactUpdate = Body(...)
):
    """Update a contact"""
    with get_connection() as conn:
        # Check if contact exists
        cursor = conn.execute(
            "SELECT * FROM contacts WHERE contact_id = ? AND valid_to IS NULL",
            (contact_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        # Build update query dynamically based on provided fields
        updates = []
        params = []
        
        if contact.contact_type is not None:
            updates.append("contact_type = ?")
            params.append(contact.contact_type)
            
        if contact.contact_name is not None:
            updates.append("contact_name = ?")
            params.append(contact.contact_name)
            
        if contact.phone is not None:
            updates.append("phone = ?")
            params.append(contact.phone)
            
        if contact.email is not None:
            updates.append("email = ?")
            params.append(contact.email)
            
        if contact.fax is not None:
            updates.append("fax = ?")
            params.append(contact.fax)
            
        if contact.physical_address is not None:
            updates.append("physical_address = ?")
            params.append(contact.physical_address)
            
        if contact.mailing_address is not None:
            updates.append("mailing_address = ?")
            params.append(contact.mailing_address)
            
        if not updates:
            # No updates provided
            return ContactModel.model_validate(dict(existing))
            
        update_str = ", ".join(updates)
        params.append(contact_id)
        
        # Update contact
        cursor = conn.execute(
            f"UPDATE contacts SET {update_str} WHERE contact_id = ?",
            params
        )
        conn.commit()
        
        # Get updated contact
        cursor = conn.execute("SELECT * FROM contacts WHERE contact_id = ?", (contact_id,))
        row = cursor.fetchone()
        
        return ContactModel.model_validate(dict(row))

@router.delete("/contacts/{contact_id}", response_model=ContactModel)
async def delete_contact(contact_id: int = Path(...)):
    """Soft delete a contact by setting valid_to"""
    with get_connection() as conn:
        # Check if contact exists
        cursor = conn.execute(
            "SELECT * FROM contacts WHERE contact_id = ? AND valid_to IS NULL",
            (contact_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        # Soft delete by setting valid_to
        now = datetime.now().isoformat()
        cursor = conn.execute(
            "UPDATE contacts SET valid_to = ? WHERE contact_id = ?",
            (now, contact_id)
        )
        conn.commit()
        
        # Get updated contact
        cursor = conn.execute("SELECT * FROM contacts WHERE contact_id = ?", (contact_id,))
        row = cursor.fetchone()
        
        return ContactModel.model_validate(dict(row))

# ----- CLIENT PAYMENT SUMMARIES (VIEWS) -----
@router.get("/clients/first-payments", response_model=ClientFirstPaymentResponse)
async def get_client_first_payments(
    client_id: Optional[int] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get first payment details for each client"""
    with get_connection() as conn:
        query = "SELECT * FROM v_client_payment_first"
        params = []
        
        if client_id is not None:
            query += " WHERE client_id = ?"
            params.append(client_id)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY display_name LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        first_payments = [ClientFirstPaymentViewModel.model_validate(dict(row)) for row in rows]
        
        return ClientFirstPaymentResponse(items=first_payments, total=total)

@router.get("/clients/last-payments", response_model=ClientLastPaymentResponse)
async def get_client_last_payments(
    client_id: Optional[int] = Query(None),
    min_days: Optional[int] = Query(None, description="Minimum days since last payment"),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get last payment details for each client"""
    with get_connection() as conn:
        query = "SELECT * FROM v_client_payment_last"
        conditions = []
        params = []
        
        if client_id is not None:
            conditions.append("client_id = ?")
            params.append(client_id)
            
        if min_days is not None:
            conditions.append("days_since_last_payment >= ?")
            params.append(min_days)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY days_since_last_payment DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        last_payments = [ClientLastPaymentViewModel.model_validate(dict(row)) for row in rows]
        
        return ClientLastPaymentResponse(items=last_payments, total=total)