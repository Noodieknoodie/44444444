# app/api/contracts.py
from fastapi import APIRouter, Query, HTTPException, Body, Path
from typing import Optional
from datetime import datetime

from ..db import get_connection
from ..models.contracts import (
    ContractModel, ContractCreate, ContractUpdate, ContractResponse,
    ActiveContractViewModel, ActiveContractResponse,
    ExpectedPeriodViewModel, ExpectedPeriodResponse,
    MissingPaymentPeriodViewModel, MissingPaymentPeriodResponse
)

router = APIRouter(prefix="/api")

# ----- CONTRACTS -----
@router.get("/contracts", response_model=ContractResponse)
async def get_contracts(
    contract_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    provider_id: Optional[int] = Query(None),
    is_active: Optional[int] = Query(None),
    payment_schedule: Optional[str] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get contracts with filtering options"""
    with get_connection() as conn:
        query = "SELECT * FROM contracts WHERE valid_to IS NULL"
        params = []
        
        if contract_id is not None:
            query += " AND contract_id = ?"
            params.append(contract_id)
            
        if client_id is not None:
            query += " AND client_id = ?"
            params.append(client_id)
            
        if provider_id is not None:
            query += " AND provider_id = ?"
            params.append(provider_id)
            
        if is_active is not None:
            query += " AND is_active = ?"
            params.append(is_active)
            
        if payment_schedule is not None:
            query += " AND payment_schedule = ?"
            params.append(payment_schedule)
            
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        query += " ORDER BY client_id, contract_id LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        contracts = [ContractModel.model_validate(dict(row)) for row in rows]
        
        return ContractResponse(items=contracts, total=total)

@router.post("/contracts", response_model=ContractModel)
async def create_contract(contract: ContractCreate):
    """Create a new contract"""
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO contracts (
                    client_id, contract_number, provider_id, fee_type, 
                    percent_rate, flat_rate, payment_schedule, num_people, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    contract.client_id, contract.contract_number, contract.provider_id,
                    contract.fee_type, contract.percent_rate, contract.flat_rate,
                    contract.payment_schedule, contract.num_people, contract.is_active
                )
            )
            conn.commit()
            
            # Get the created contract
            contract_id = cursor.lastrowid
            cursor = conn.execute("SELECT * FROM contracts WHERE contract_id = ?", (contract_id,))
            row = cursor.fetchone()
            
            return ContractModel.model_validate(dict(row))
        except Exception as e:
            # Handle constraint violations
            if "FOREIGN KEY constraint failed" in str(e):
                raise HTTPException(status_code=404, detail="Client or provider not found")
            raise

@router.put("/contracts/{contract_id}", response_model=ContractModel)
async def update_contract(
    contract_id: int = Path(...),
    contract: ContractUpdate = Body(...)
):
    """Update a contract"""
    with get_connection() as conn:
        # Check if contract exists
        cursor = conn.execute(
            "SELECT * FROM contracts WHERE contract_id = ? AND valid_to IS NULL",
            (contract_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Build update query dynamically based on provided fields
        updates = []
        params = []
        
        if contract.contract_number is not None:
            updates.append("contract_number = ?")
            params.append(contract.contract_number)
            
        if contract.provider_id is not None:
            updates.append("provider_id = ?")
            params.append(contract.provider_id)
            
        if contract.fee_type is not None:
            updates.append("fee_type = ?")
            params.append(contract.fee_type)
            
        if contract.percent_rate is not None:
            updates.append("percent_rate = ?")
            params.append(contract.percent_rate)
            
        if contract.flat_rate is not None:
            updates.append("flat_rate = ?")
            params.append(contract.flat_rate)
            
        if contract.payment_schedule is not None:
            updates.append("payment_schedule = ?")
            params.append(contract.payment_schedule)
            
        if contract.num_people is not None:
            updates.append("num_people = ?")
            params.append(contract.num_people)
            
        if contract.is_active is not None:
            updates.append("is_active = ?")
            params.append(contract.is_active)
            
        if not updates:
            # No updates provided
            return ContractModel.model_validate(dict(existing))
            
        update_str = ", ".join(updates)
        params.append(contract_id)
        
        # Update contract
        cursor = conn.execute(
            f"UPDATE contracts SET {update_str} WHERE contract_id = ?",
            params
        )
        conn.commit()
        
        # Get updated contract
        cursor = conn.execute("SELECT * FROM contracts WHERE contract_id = ?", (contract_id,))
        row = cursor.fetchone()
        
        return ContractModel.model_validate(dict(row))

@router.delete("/contracts/{contract_id}", response_model=ContractModel)
async def delete_contract(contract_id: int = Path(...)):
    """Soft delete a contract by setting valid_to"""
    with get_connection() as conn:
        # Check if contract exists
        cursor = conn.execute(
            "SELECT * FROM contracts WHERE contract_id = ? AND valid_to IS NULL",
            (contract_id,)
        )
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Soft delete by setting valid_to
        now = datetime.now().isoformat()
        cursor = conn.execute(
            "UPDATE contracts SET valid_to = ? WHERE contract_id = ?",
            (now, contract_id)
        )
        conn.commit()
        
        # Get updated contract
        cursor = conn.execute("SELECT * FROM contracts WHERE contract_id = ?", (contract_id,))
        row = cursor.fetchone()
        
        return ContractModel.model_validate(dict(row))

# ----- CONTRACT-RELATED VIEWS -----
@router.get("/active-contracts", response_model=ActiveContractResponse)
async def get_active_contracts(
    client_id: Optional[int] = Query(None),
    payment_schedule: Optional[str] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get all active contracts"""
    with get_connection() as conn:
        query = "SELECT * FROM v_active_contracts"
        conditions = []
        params = []
        
        if client_id is not None:
            conditions.append("client_id = ?")
            params.append(client_id)
            
        if payment_schedule is not None:
            conditions.append("payment_schedule = ?")
            params.append(payment_schedule)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY client_id LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        contracts = [ActiveContractViewModel.model_validate(dict(row)) for row in rows]
        
        return ActiveContractResponse(items=contracts, total=total)

@router.get("/expected-periods", response_model=ExpectedPeriodResponse)
async def get_expected_periods(
    client_id: Optional[int] = Query(None),
    payment_schedule: Optional[str] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get all periods a client should have paid for"""
    with get_connection() as conn:
        query = "SELECT * FROM v_client_expected_periods"
        conditions = []
        params = []
        
        if client_id is not None:
            conditions.append("client_id = ?")
            params.append(client_id)
            
        if payment_schedule is not None:
            conditions.append("payment_schedule = ?")
            params.append(payment_schedule)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY client_id, period_key DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        periods = [ExpectedPeriodViewModel.model_validate(dict(row)) for row in rows]
        
        return ExpectedPeriodResponse(items=periods, total=total)

@router.get("/missing-periods", response_model=MissingPaymentPeriodResponse)
async def get_missing_periods(
    client_id: Optional[int] = Query(None),
    payment_schedule: Optional[str] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Get all periods that should have been paid but weren't"""
    with get_connection() as conn:
        query = "SELECT * FROM v_all_missing_payment_periods"
        conditions = []
        params = []
        
        if client_id is not None:
            conditions.append("client_id = ?")
            params.append(client_id)
            
        if payment_schedule is not None:
            conditions.append("payment_schedule = ?")
            params.append(payment_schedule)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query})"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()["total"]
        
        # Add pagination
        query += " ORDER BY client_id, period_key DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        # Execute
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        missing = [MissingPaymentPeriodViewModel.model_validate(dict(row)) for row in rows]
        
        return MissingPaymentPeriodResponse(items=missing, total=total)