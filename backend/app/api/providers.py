# app/api/providers.py
from fastapi import APIRouter, Query, HTTPException, Body, Path
from typing import Optional
from datetime import datetime

from ..db import get_connection
from ..models.providers import ProviderModel, ProviderCreate, ProviderUpdate, ProviderResponse

router = APIRouter(prefix="/api")

@router.get("/providers", response_model=ProviderResponse)
async def get_providers(
    provider_id: Optional[int] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get all active providers"""
    with get_connection() as conn:
        query = "SELECT * FROM providers WHERE valid_to IS NULL"
        params = []
        
        if provider_id is not None:
            query += " AND provider_id = ?"
            params.append(provider_id)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination and sorting
        query += " ORDER BY provider_name LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        providers = [ProviderModel.model_validate(dict(row)) for row in rows]
        
        return ProviderResponse(items=providers, total=total)

@router.post("/providers", response_model=ProviderModel)
async def create_provider(provider: ProviderCreate):
    """Create a new provider"""
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO providers (provider_name) VALUES (?)",
            (provider.provider_name,)
        )
        conn.commit()
        
        # Get the created provider
        provider_id = cursor.lastrowid
        cursor = conn.execute("SELECT * FROM providers WHERE provider_id = ?", (provider_id,))
        row = cursor.fetchone()
        
        return ProviderModel.model_validate(dict(row))

@router.put("/providers/{provider_id}", response_model=ProviderModel)
async def update_provider(
    provider_id: int = Path(...),
    provider: ProviderUpdate = Body(...)
):
    """Update a provider"""
    with get_connection() as conn:
        # Check if provider exists
        cursor = conn.execute(
            "SELECT * FROM providers WHERE provider_id = ? AND valid_to IS NULL",
            (provider_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        # Update provider if name provided
        if provider.provider_name is not None:
            cursor = conn.execute(
                "UPDATE providers SET provider_name = ? WHERE provider_id = ?",
                (provider.provider_name, provider_id)
            )
            conn.commit()
        
        # Get updated provider
        cursor = conn.execute("SELECT * FROM providers WHERE provider_id = ?", (provider_id,))
        row = cursor.fetchone()
        
        return ProviderModel.model_validate(dict(row))

@router.delete("/providers/{provider_id}", response_model=ProviderModel)
async def delete_provider(provider_id: int = Path(...)):
    """Soft delete a provider by setting valid_to"""
    with get_connection() as conn:
        # Check if provider exists
        cursor = conn.execute(
            "SELECT * FROM providers WHERE provider_id = ? AND valid_to IS NULL",
            (provider_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        # Soft delete by setting valid_to
        now = datetime.now().isoformat()
        cursor = conn.execute(
            "UPDATE providers SET valid_to = ? WHERE provider_id = ?",
            (now, provider_id)
        )
        conn.commit()
        
        # Get updated provider
        cursor = conn.execute("SELECT * FROM providers WHERE provider_id = ?", (provider_id,))
        row = cursor.fetchone()
        
        return ProviderModel.model_validate(dict(row))