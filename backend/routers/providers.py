from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import sqlite3
from main import get_db_dependency

router = APIRouter()

@router.get("/")
def get_providers(db: sqlite3.Connection = Depends(get_db_dependency)):
    """Get all providers with their associated clients"""
    cursor = db.cursor()
    
    # Get all active providers
    cursor.execute("""
        SELECT provider_id, provider_name
        FROM providers
        WHERE valid_to IS NULL
        ORDER BY provider_name
    """)
    
    providers = [dict(row) for row in cursor.fetchall()]
    
    # Get all active client-provider relationships
    cursor.execute("""
        SELECT
            cp.provider_id,
            c.client_id,
            c.display_name AS client_name,
            cps.status AS current_period_status,
            con.payment_schedule
        FROM client_providers cp
        JOIN clients c ON cp.client_id = c.client_id
        LEFT JOIN v_active_contracts con ON c.client_id = con.client_id
        LEFT JOIN v_current_period_payment_status cps ON c.client_id = cps.client_id
        WHERE cp.is_active = 1
          AND c.valid_to IS NULL
        ORDER BY c.display_name
    """)
    
    client_providers = [dict(row) for row in cursor.fetchall()]
    
    # Group clients by provider
    for provider in providers:
        provider["clients"] = [
            {
                "client_id": cp["client_id"],
                "client_name": cp["client_name"],
                "payment_schedule": cp["payment_schedule"],
                "current_period_status": cp["current_period_status"] or "Unpaid",
                "provider_client_id": f"{provider['provider_id']}_{cp['client_id']}"
            }
            for cp in client_providers
            if cp["provider_id"] == provider["provider_id"]
        ]
    
    return providers

@router.get("/{provider_id}")
def get_provider(provider_id: int, db: sqlite3.Connection = Depends(get_db_dependency)):
    """Get detailed information about a specific provider"""
    cursor = db.cursor()
    
    cursor.execute("""
        SELECT provider_id, provider_name, valid_from
        FROM providers
        WHERE provider_id = ? AND valid_to IS NULL
    """, (provider_id,))
    
    provider = cursor.fetchone()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Get all active clients for this provider
    cursor.execute("""
        SELECT
            c.client_id,
            c.display_name,
            con.payment_schedule,
            con.fee_type,
            con.percent_rate,
            con.flat_rate,
            cpl.last_payment_date,
            cpl.last_payment_amount,
            cps.status AS current_period_status
        FROM client_providers cp
        JOIN clients c ON cp.client_id = c.client_id
        LEFT JOIN v_active_contracts con ON c.client_id = con.client_id
        LEFT JOIN v_client_payment_last cpl ON c.client_id = cpl.client_id
        LEFT JOIN v_current_period_payment_status cps ON c.client_id = cps.client_id
        WHERE cp.provider_id = ?
          AND cp.is_active = 1
          AND c.valid_to IS NULL
        ORDER BY c.display_name
    """, (provider_id,))
    
    clients = [dict(row) for row in cursor.fetchall()]
    
    # Add unique composite IDs
    for client in clients:
        client["provider_client_id"] = f"{provider_id}_{client['client_id']}"
    
    provider_dict = dict(provider)
    provider_dict["clients"] = clients
    
    return provider_dict